"""Refresh backend/cache/countries/*.json from World Bank + Yahoo Finance.

Run from backend/: `python -m scripts.fetch_data` (or `python scripts/fetch_data.py`
with backend/ on PYTHONPATH). Safe to re-run; a country whose fetch raises is
skipped and its last-known-good cache file is left untouched.
"""

import datetime
import json
import sys
import time
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from config.countries import BOND_YIELD_TICKERS, list_country_configs
from services import market_data, world_bank

CACHE_DIR = Path(__file__).resolve().parent.parent / "cache" / "countries"

UNITS = {
    "gdp": "USD",
    "gdp_per_capita": "USD",
    "inflation": "%",
    "bond_yield_10y": "%",
    "fx_rate": "USD per 1 unit of local currency",
}

SOURCES = {
    "gdp": "World Bank NY.GDP.MKTP.CD",
    "gdp_per_capita": "World Bank NY.GDP.PCAP.CD",
    "inflation": "World Bank FP.CPI.TOTL.ZG",
    "bond_yield_10y": "Yahoo Finance",
    "fx_rate": "Yahoo Finance",
}


def build_country_payload(country: dict) -> dict:
    wb_data = world_bank.fetch_world_bank_metrics(country["wb_code"])
    fx = market_data.fetch_fx_data(country["fx_ticker"])

    bond = market_data.fetch_bond_yield(BOND_YIELD_TICKERS.get(country["code"]))

    today = str(datetime.date.today())

    return {
        "country_code": country["code"],
        "country_name": country["name"],
        "region": country["region"],
        "data_as_of": today,
        "gdp": wb_data["gdp"]["latest"],
        "gdp_per_capita": wb_data["gdp_per_capita"]["latest"],
        "inflation": wb_data["inflation"]["latest"],
        "bond_yield_10y": bond["latest"],
        "fx_rate": fx["latest"],
        "fx_pair": country["fx_pair"],
        "fx_change_pct": fx["change_pct"],
        "units": UNITS,
        "sources": SOURCES,
        "dates": {
            "gdp": wb_data["gdp"]["date"],
            "gdp_per_capita": wb_data["gdp_per_capita"]["date"],
            "inflation": wb_data["inflation"]["date"],
            "bond_yield_10y": bond["date"],
            "fx_rate": today if fx["latest"] is not None else None,
        },
        "history": {
            "gdp": wb_data["gdp"]["history"],
            "gdp_per_capita": wb_data["gdp_per_capita"]["history"],
            "inflation": wb_data["inflation"]["history"],
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
