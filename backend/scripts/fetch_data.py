"""Refresh the country payloads in Upstash KV from World Bank, Yahoo Finance, and FRED.

Run from backend/: `python -m scripts.fetch_data` (or `python scripts/fetch_data.py`
with backend/ on PYTHONPATH). Safe to re-run; a country whose assembly raises is
skipped and its last-known-good KV entry is left untouched.

Requires KV_REST_API_URL and KV_REST_API_TOKEN in the environment, plus
FRED_API_KEY for bond yields — without the latter, every country's
bond_yield_10y comes back null (not an error, not a stale value).
"""

import datetime
import os
import sys
from pathlib import Path

from dotenv import load_dotenv

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))
load_dotenv(Path(__file__).resolve().parent.parent / ".env")

from config.countries import FRED_BOND_SERIES, list_country_configs
from services import fred, kv_client, market_data, world_bank

UNITS = {
    "gdp": "USD",
    "gdp_per_capita": "USD",
    "gdp_per_capita_ppp": "international $ (PPP)",
    "gdp_growth": "% per year",
    "inflation": "%",
    "unemployment": "% of labor force",
    "population": "people",
    "life_expectancy": "years",
    "govt_debt_pct_gdp": "% of GDP",
    "exports_pct_gdp": "% of GDP",
    "urban_population_pct": "% of population",
    "internet_users_pct": "% of population",
    "co2_per_capita": "t CO2e per person",
    "bond_yield_10y": "%",
    "fx_rate": "USD per 1 unit of local currency",
}

SOURCES = {
    **{metric: f"World Bank {code}" for metric, code in world_bank.INDICATORS.items()},
    "bond_yield_10y": "FRED (OECD IRLTLT01)",
    "fx_rate": "Yahoo Finance",
}


def _resolve_fx(yahoo: dict, wb_series: dict, today: str) -> tuple[dict, str]:
    """Pick an FX rate, preferring Yahoo's live quote over the World Bank's.

    Yahoo covers ~45 economies with a daily quote and a day-over-day change; the
    World Bank covers ~212 but only as an annual average, so it fills the gap
    rather than replacing it. Its figures are local-currency-per-USD, inverted
    here into this payload's USD-per-local-currency convention.
    """
    if yahoo["latest"] is not None:
        return {**yahoo, "date": today}, "Yahoo Finance"

    def invert(value):
        # A rate of exactly 1 means the economy uses the US dollar (Ecuador, Guam)
        # or pegs to it at par (Bermuda), so there is no exchange rate to report —
        # the same reason the US itself carries no FX ticker.
        if not value or value == 1:
            return None
        return round(1 / value, 6)

    return {
        "latest": invert(wb_series["latest"]),
        "change_pct": None,  # an annual average has no day-over-day change
        "history": [
            {"year": point["year"], "value": invert(point["value"])}
            for point in wb_series["history"]
            if point["value"]
        ],
        "date": wb_series["date"],
    }, "World Bank PA.NUS.FCRF"


def build_country_payload(country: dict, wb_data: dict, yahoo_fx: dict) -> dict:
    bond = fred.fetch_bond_yield(FRED_BOND_SERIES.get(country["code"]))
    today = str(datetime.date.today())
    fx, fx_source = _resolve_fx(yahoo_fx, wb_data["fx_rate_lcu_per_usd"], today)

    return {
        "country_code": country["code"],
        "country_name": country["name"],
        "region": country["region"],
        "data_as_of": today,
        **{metric: wb_data[metric]["latest"] for metric in world_bank.INDICATORS},
        "bond_yield_10y": bond["latest"],
        "fx_rate": fx["latest"],
        "fx_pair": country["fx_pair"],
        "fx_change_pct": fx["change_pct"],
        "units": UNITS,
        # fx_rate's source varies by country, so it can't live in the shared constant.
        "sources": {**SOURCES, "fx_rate": fx_source},
        "dates": {
            **{metric: wb_data[metric]["date"] for metric in world_bank.INDICATORS},
            "bond_yield_10y": bond["date"],
            "fx_rate": fx["date"] if fx["latest"] is not None else None,
        },
        "history": {
            **{metric: wb_data[metric]["history"] for metric in world_bank.INDICATORS},
            "bond_yield_10y": bond["history"],
            "fx_rate": fx["history"],
        },
    }


def main():
    countries = list_country_configs()
    codes = [c["code"] for c in countries]

    print(f"World Bank: {len(world_bank.INDICATORS)} indicators x {len(codes)} economies")
    wb_all = world_bank.fetch_all_metrics(codes)

    # Many economies share a currency — the euro alone covers 20 — so fetch each
    # distinct ticker once rather than once per country.
    tickers = sorted({c["fx_ticker"] for c in countries if c["fx_ticker"]})
    print(f"Yahoo Finance: {len(tickers)} distinct FX tickers")
    fx_by_ticker = {ticker: market_data.fetch_fx_data(ticker) for ticker in tickers}
    no_fx = market_data.fetch_fx_data(None)

    ok, failed = 0, []
    for i, country in enumerate(countries):
        code = country["code"]
        try:
            payload = build_country_payload(
                country, wb_all[code], fx_by_ticker.get(country["fx_ticker"], no_fx)
            )
            kv_client.set_json(kv_client.country_key(code), payload)
            ok += 1
            if (i + 1) % 25 == 0 or i + 1 == len(countries):
                print(f"  [{i + 1}/{len(countries)}] cached")
        except Exception as e:
            failed.append(code)
            print(f"  [{i + 1}/{len(countries)}] {code} FAILED, keeping last-known-good entry: {e}")

    print(f"\nDone. {ok} cached, {len(failed)} failed: {failed}")


if __name__ == "__main__":
    main()
