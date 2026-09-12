"""Shared reader for country data. Loads the cached JSON into memory once at
import time, so requests do zero disk or network I/O; `scripts/fetch_data.py`
is what refreshes the on-disk cache this loads from.
"""

import json
from pathlib import Path

from config.countries import list_country_configs

CACHE_DIR = Path(__file__).resolve().parent.parent / "cache"
COUNTRIES_CACHE_DIR = CACHE_DIR / "countries"
MOCK_CACHE_DIR = CACHE_DIR / "mock"


def _load_all() -> dict[str, dict]:
    """Read every cached country file into memory once, at import time.

    Real fetched data wins over the mock fallback when both exist for the
    same code. A malformed JSON file fails loudly here — at boot — instead
    of on whichever request happens to hit that country during a demo.
    """
    data: dict[str, dict] = {}
    for directory in (MOCK_CACHE_DIR, COUNTRIES_CACHE_DIR):
        if not directory.exists():
            continue
        for path in sorted(directory.glob("*.json")):
            with open(path) as f:
                data[path.stem] = json.load(f)
    return data


_COUNTRY_DATA = _load_all()


def list_countries() -> list[dict]:
    """Summary list for the map: code, name, region — no metric values."""
    return [
        {"country_code": c["code"], "country_name": c["name"], "region": c["region"]}
        for c in list_country_configs()
    ]


def get_country(code: str) -> dict | None:
    """Full country payload, or None if the code is unknown/has no cached data."""
    return _COUNTRY_DATA.get(code.upper())
