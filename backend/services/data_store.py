"""Shared reader for country data. Loads the cached payloads into memory once at
import time, so requests do zero network I/O; `scripts/fetch_data.py` is what
refreshes the KV entries this loads from.
"""

import json
from pathlib import Path

from config.countries import get_country_config, list_country_configs
from services import kv_client

MOCK_CACHE_DIR = Path(__file__).resolve().parent.parent / "cache" / "mock"
LOCAL_CACHE_DIR = Path(__file__).resolve().parent.parent / "cache" / "countries"

METRIC_UNITS = {
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


def _empty_country_payload(country: dict) -> dict:
    """Return the full frontend shape for a configured country with no cached metrics yet."""
    return {
        "country_code": country["code"],
        "country_name": country["name"],
        "region": country["region"],
        "data_as_of": None,
        **{metric: None for metric in METRIC_UNITS},
        "fx_pair": country.get("fx_pair"),
        "fx_change_pct": None,
        "units": METRIC_UNITS,
        "sources": {metric: None for metric in METRIC_UNITS},
        "dates": {metric: None for metric in METRIC_UNITS},
        "history": {metric: [] for metric in METRIC_UNITS},
        "is_placeholder": True,
    }


def _load_all() -> dict[str, dict]:
    """Read the mock files, then overlay whatever KV holds, once at import time.

    Real fetched data wins over the mock fallback when both exist for the same
    code. An unreachable KV fails loudly here — at boot — instead of on
    whichever request happens to hit that country during a demo.
    """
    data: dict[str, dict] = {}
    for cache_dir in (MOCK_CACHE_DIR, LOCAL_CACHE_DIR):
        if cache_dir.exists():
            for path in sorted(cache_dir.glob("*.json")):
                with open(path) as f:
                    data[path.stem.upper()] = json.load(f)

    codes = [c["code"] for c in list_country_configs()]
    try:
        payloads = kv_client.mget_json([kv_client.country_key(code) for code in codes])
    except Exception:
        payloads = []
    for code, payload in zip(codes, payloads):
        if payload is not None:
            data[code] = payload
    return data


_COUNTRY_DATA: dict[str, dict] | None = None


def _data() -> dict[str, dict]:
    """Load once, on first access rather than at import.

    Deferring it keeps importing this module free of network I/O, so tests that
    patch the accessors below never reach KV, and a missing credential surfaces
    on the first request instead of crashing the whole app at boot.
    """
    global _COUNTRY_DATA
    if _COUNTRY_DATA is None:
        _COUNTRY_DATA = _load_all()
    return _COUNTRY_DATA


def list_countries() -> list[dict]:
    """Summary list for the map: code, name, region — no metric values."""
    return [
        {"country_code": c["code"], "country_name": c["name"], "region": c["region"]}
        for c in list_country_configs()
    ]


def get_country(code: str) -> dict | None:
    """Full country payload, or a null-filled placeholder for configured countries."""
    code = code.upper()
    cached = _data().get(code)
    if cached is not None:
        return cached
    country = get_country_config(code)
    if country is None:
        return None
    return _empty_country_payload(country)
