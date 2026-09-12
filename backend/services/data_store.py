"""Shared reader for country data. Loads the cached payloads into memory once at
import time, so requests do zero network I/O; `scripts/fetch_data.py` is what
refreshes the KV entries this loads from.
"""

import json
from pathlib import Path

from config.countries import list_country_configs
from services import kv_client

MOCK_CACHE_DIR = Path(__file__).resolve().parent.parent / "cache" / "mock"


def _load_all() -> dict[str, dict]:
    """Read the mock files, then overlay whatever KV holds, once at import time.

    Real fetched data wins over the mock fallback when both exist for the same
    code. An unreachable KV fails loudly here — at boot — instead of on
    whichever request happens to hit that country during a demo.
    """
    data: dict[str, dict] = {}
    if MOCK_CACHE_DIR.exists():
        for path in sorted(MOCK_CACHE_DIR.glob("*.json")):
            with open(path) as f:
                data[path.stem] = json.load(f)

    codes = [c["code"] for c in list_country_configs()]
    payloads = kv_client.mget_json([kv_client.country_key(code) for code in codes])
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
    """Full country payload, or None if the code is unknown/has no cached data."""
    return _data().get(code.upper())
