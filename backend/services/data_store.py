"""Shared reader for country data. Serves cached JSON so requests never wait
on a live World Bank/Yahoo Finance call; `scripts/fetch_data.py` is what
refreshes the cache.
"""

import json
from pathlib import Path

from config.countries import list_country_configs

CACHE_DIR = Path(__file__).resolve().parent.parent / "cache"
COUNTRIES_CACHE_DIR = CACHE_DIR / "countries"
MOCK_CACHE_DIR = CACHE_DIR / "mock"


def list_countries() -> list[dict]:
    """Summary list for the map: code, name, region — no metric values."""
    return [
        {"country_code": c["code"], "country_name": c["name"], "region": c["region"]}
        for c in list_country_configs()
    ]


def get_country(code: str) -> dict | None:
    """Full country payload, or None if the code is unknown/has no cached data.

    Prefers real fetched data; falls back to the shared mock fixture so the
    frontend/AI layer can keep working if a country's fetch hasn't run yet.
    """
    code = code.upper()
    for directory in (COUNTRIES_CACHE_DIR, MOCK_CACHE_DIR):
        path = directory / f"{code}.json"
        if path.exists():
            with open(path) as f:
                return json.load(f)
    return None
