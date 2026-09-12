"""Refresh backend/cache/countries/*.json from World Bank, Yahoo Finance, and FRED.

Run from backend/: `python -m scripts.fetch_data` (or `python scripts/fetch_data.py`
with backend/ on PYTHONPATH). Safe to re-run; a country whose fetch raises is
skipped and its last-known-good cache file is left untouched.

Requires FRED_API_KEY in the environment for bond yields — without it, every
country's bond_yield_10y comes back null (not an error, not a stale value).
"""

import datetime
import json
import os
import sys
import time
from pathlib import Path

from dotenv import load_dotenv

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))
load_dotenv(Path(__file__).resolve().parent.parent / ".env")

from config.countries import FRED_BOND_SERIES, list_country_configs
from services import fred, market_data, world_bank

CACHE_DIR = Path(__file__).resolve().parent.parent / "cache" / "countries"

UNITS = {
    "gdp": "USD",
    "gdp_per_capita": "USD",
    "gdp_per_capita_ppp": "international $ (PPP)",
    "gdp_growth": "% per year",
    "inflation": "%",
    "unemployment": "% of labor force",
    "population": "people",
    "life_expectancy": "years",
    "bond_yield_10y": "%",
    "fx_rate": "USD per 1 unit of local currency",
}

SOURCES = {
    **{metric: f"World Bank {code}" for metric, code in world_bank.INDICATORS.items()},
    "bond_yield_10y": "FRED (OECD IRLTLT01)",
    "fx_rate": "Yahoo Finance",
}


def build_country_payload(country: dict) -> dict:
    wb_data = world_bank.fetch_world_bank_metrics(country["wb_code"])
    fx = market_data.fetch_fx_data(country["fx_ticker"])

    bond = fred.fetch_bond_yield(FRED_BOND_SERIES.get(country["code"]))

    today = str(datetime.date.today())

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
        "sources": SOURCES,
        "dates": {
            **{metric: wb_data[metric]["date"] for metric in world_bank.INDICATORS},
            "bond_yield_10y": bond["date"],
            "fx_rate": today if fx["latest"] is not None else None,
        },
        "history": {
            **{metric: wb_data[metric]["history"] for metric in world_bank.INDICATORS},
            "bond_yield_10y": bond["history"],
            "fx_rate": fx["history"],
        },
    }


def main():
    CACHE_DIR.mkdir(parents=True, exist_ok=True)
    countries = list_country_configs()

    ok, failed = 0, []
    for i, country in enumerate(countries):
        code = country["code"]
        try:
            payload = build_country_payload(country)
            with open(CACHE_DIR / f"{code}.json", "w") as f:
                json.dump(payload, f, indent=2)
            ok += 1
            print(f"[{i + 1}/{len(countries)}] {code} cached")
        except Exception as e:
            failed.append(code)
            print(f"[{i + 1}/{len(countries)}] {code} FAILED, keeping last-known-good cache: {e}")
        time.sleep(0.2)  # be polite to the World Bank/Yahoo endpoints

    print(f"\nDone. {ok} cached, {len(failed)} failed: {failed}")


if __name__ == "__main__":
    main()
