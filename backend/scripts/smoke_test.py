"""Smoke-test the country API against the current cache.

Run from backend/: `python scripts/smoke_test.py`
Exits 0 if every check passes, 1 on the first failure.
"""

import sys
import warnings
from pathlib import Path

warnings.filterwarnings("ignore")
sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from fastapi.testclient import TestClient

from main import app

REQUIRED_KEYS = {
    "country_code", "country_name", "region", "data_as_of",
    "gdp", "gdp_per_capita", "inflation", "bond_yield_10y",
    "fx_rate", "fx_pair", "fx_change_pct",
    "units", "sources", "dates", "history",
}

METRICS = ["gdp", "gdp_per_capita", "inflation", "bond_yield_10y", "fx_rate"]

passed = 0
failures = []


def check(label: str, condition: bool, detail: str = ""):
    global passed
    if condition:
        passed += 1
        print(f"  PASS  {label}" + (f"  ({detail})" if detail else ""))
    else:
        failures.append(label)
        print(f"  FAIL  {label}" + (f"  ({detail})" if detail else ""))


client = TestClient(app)

print("\nAPI contract")
r = client.get("/api/health")
check("GET /api/health -> 200 healthy", r.status_code == 200 and r.json()["status"] == "healthy")

r = client.get("/")
check("GET / -> 200 ok", r.status_code == 200 and r.json()["status"] == "ok")

r = client.get("/api/countries")
countries = r.json().get("countries", []) if r.status_code == 200 else []
check("GET /api/countries -> 200 with a non-empty list", bool(countries), f"{len(countries)} countries")
check(
    "list entries carry code, name, region",
    all({"country_code", "country_name", "region"} <= set(c) for c in countries),
)

print("\nCountry detail")
r = client.get("/api/countries/DEU")
payload = r.json() if r.status_code == 200 else {}
check("GET /api/countries/DEU -> 200", r.status_code == 200)
missing_keys = REQUIRED_KEYS - set(payload)
check("payload has every required key", not missing_keys, f"missing: {missing_keys}" if missing_keys else "")
check("history has a key per metric", all(m in payload.get("history", {}) for m in METRICS))
check("units/sources/dates cover every metric", all(m in payload.get("dates", {}) for m in METRICS))
check("GDP history is non-empty and dated", bool(payload.get("history", {}).get("gdp")) and "year" in payload["history"]["gdp"][0])

r = client.get("/api/countries/deu")
check("lowercase code resolves", r.status_code == 200)

print("\nMissing data and errors")
r = client.get("/api/countries/ZZZ")
check("unknown code -> 404 with a message", r.status_code == 404 and "detail" in r.json())

usa = client.get("/api/countries/USA").json()
check("USA fx_rate is null (USD is the quote currency)", usa.get("fx_rate") is None)
check("USA bond_yield_10y is a plausible percentage", usa.get("bond_yield_10y") is not None and 0 < usa["bond_yield_10y"] < 25, f"{usa.get('bond_yield_10y')}%")

deu_bond = client.get("/api/countries/DEU").json()
check("non-US bond yield is null, history an empty list", deu_bond.get("bond_yield_10y") is None and deu_bond["history"]["bond_yield_10y"] == [])

print(f"\n{passed} passed, {len(failures)} failed")
if failures:
    for f in failures:
        print(f"  - {f}")
    sys.exit(1)
print("Smoke test OK\n")
