"""Fetch and normalize 10-year government bond yields from FRED's mirror of
the OECD long-term interest rate series (the `IRLTLT01<ISO2>M156N` family).

Monthly, percent, not seasonally adjusted. Coverage is OECD members plus a
handful of "key partner" economies FRED sometimes carries — real coverage is
whatever the API confirms per country, not what's assumed here.
"""

import datetime
import os

import httpx

FRED_OBSERVATIONS_URL = "https://api.stlouisfed.org/fred/series/observations"
HISTORY_YEARS = 10
STALE_AFTER_MONTHS = 24  # e.g. Russia's OECD series stopped updating in 2018


def fetch_bond_yield(series_id: str | None) -> dict:
    """Latest yield (%), its observation month, and a yearly-averaged history.

    Returns nulls — never a fabricated value — when no series is mapped for
    this country, `FRED_API_KEY` isn't set, or the request/series fails.
    """
    if series_id is None:
        return {"latest": None, "date": None, "history": []}

    api_key = os.environ.get("FRED_API_KEY")
    if not api_key:
        return {"latest": None, "date": None, "history": []}

    observation_start = f"{datetime.date.today().year - HISTORY_YEARS}-01-01"

    try:
        resp = httpx.get(
            FRED_OBSERVATIONS_URL,
            params={
                "series_id": series_id,
                "api_key": api_key,
                "file_type": "json",
                "sort_order": "asc",
                "observation_start": observation_start,
            },
            timeout=10,
        )
        resp.raise_for_status()
        observations = resp.json().get("observations", [])
    except Exception:
        return {"latest": None, "date": None, "history": []}

    monthly = [
        (obs["date"], float(obs["value"]))
        for obs in observations
        if obs.get("value") not in (None, ".", "")
    ]
    if not monthly:
        return {"latest": None, "date": None, "history": []}

    latest_date, latest_value = monthly[-1]

    # A series that stopped updating years ago (e.g. Russia's, suspended by
    # OECD in 2022) shouldn't read as a current value just because it's the
    # newest row FRED has — treat it as unavailable instead of stale-but-live.
    latest_dt = datetime.date.fromisoformat(latest_date)
    months_old = (datetime.date.today().year - latest_dt.year) * 12 + (datetime.date.today().month - latest_dt.month)
    if months_old > STALE_AFTER_MONTHS:
        return {"latest": None, "date": None, "history": []}

    yearly: dict[str, list[float]] = {}
    for date, value in monthly:
        yearly.setdefault(date[:4], []).append(value)

    history = [
        {"year": year, "value": round(sum(values) / len(values), 4)}
        for year, values in sorted(yearly.items())
    ]

    return {"latest": round(latest_value, 4), "date": latest_date, "history": history}
