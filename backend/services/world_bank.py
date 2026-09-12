"""Fetch and normalize the World Bank indicators behind each country payload.

One request per indicator covering every economy at once, rather than one request
per economy — at 217 economies that is the difference between ~9 requests and
~2,000, and it runs in seconds.

Coverage varies by indicator. Population and life expectancy are near-universal;
central government debt is published for well under half of economies. A missing
observation reports null rather than an invented value.
"""

import datetime

import httpx

WORLD_BANK_URL = "https://api.worldbank.org/v2/country/{countries}/indicator/{indicator}"

INDICATORS = {
    "gdp": "NY.GDP.MKTP.CD",
    "gdp_per_capita": "NY.GDP.PCAP.CD",
    "gdp_per_capita_ppp": "NY.GDP.PCAP.PP.CD",
    "gdp_growth": "NY.GDP.MKTP.KD.ZG",
    "inflation": "FP.CPI.TOTL.ZG",
    "unemployment": "SL.UEM.TOTL.ZS",
    "population": "SP.POP.TOTL",
    "life_expectancy": "SP.DYN.LE00.IN",
    "govt_debt_pct_gdp": "GC.DOD.TOTL.GD.ZS",
    "exports_pct_gdp": "NE.EXP.GNFS.ZS",
    "urban_population_pct": "SP.URB.TOTL.IN.ZS",
    "internet_users_pct": "IT.NET.USER.ZS",
    "co2_per_capita": "EN.GHG.CO2.PC.CE.AR5",
}

# Official exchange rate, local currency units per US$. Fetched alongside the
# metrics above but not exposed as one: scripts/fetch_data.py inverts it and folds
# it into the payload's fx_rate, as the broad fallback behind Yahoo's live quotes.
FX_FALLBACK = {"fx_rate_lcu_per_usd": "PA.NUS.FCRF"}

HISTORY_YEARS = 10


def _empty() -> dict:
    return {"latest": None, "date": None, "history": []}


def _series(row) -> dict:
    """Collapse one economy's yearly row into latest value, its year, and history."""
    history = []
    latest_value, latest_year = None, None
    for year in sorted(row.index):
        value = row[year]
        if value is None or value != value:  # NaN
            continue
        history.append({"year": str(year), "value": round(float(value), 4)})
        latest_value, latest_year = round(float(value), 4), str(year)
    return {"latest": latest_value, "date": latest_year, "history": history}


def _fetch_indicator(codes: list[str], indicator: str, start_year: int, end_year: int) -> dict[str, list[dict]]:
    rows_by_code: dict[str, list[dict]] = {code: [] for code in codes}
    country_arg = ";".join(codes)
    page = 1

    with httpx.Client(timeout=30.0, follow_redirects=True, verify=False, trust_env=False) as client:
        while True:
            response = client.get(
                WORLD_BANK_URL.format(countries=country_arg, indicator=indicator),
                params={
                    "format": "json",
                    "per_page": 20000,
                    "page": page,
                    "date": f"{start_year}:{end_year}",
                },
            )
            response.raise_for_status()
            payload = response.json()
            if not isinstance(payload, list) or len(payload) < 2:
                return rows_by_code

            metadata, rows = payload[0], payload[1] or []
            for row in rows:
                code = row.get("countryiso3code")
                if code in rows_by_code:
                    rows_by_code[code].append(row)

            pages = int(metadata.get("pages") or 1)
            if page >= pages:
                return rows_by_code
            page += 1


def _series_from_rows(rows: list[dict]) -> dict:
    history = []
    latest_value, latest_year = None, None
    for row in sorted(rows, key=lambda item: str(item.get("date", ""))):
        value = row.get("value")
        year = row.get("date")
        if value is None or year is None:
            continue
        history.append({"year": str(year), "value": round(float(value), 4)})
        latest_value, latest_year = round(float(value), 4), str(year)
    return {"latest": latest_value, "date": latest_year, "history": history}


def fetch_all_metrics(codes: list[str]) -> dict[str, dict]:
    """Return {economy code: {metric: {latest, date, history}}} for every code."""
    current_year = datetime.date.today().year
    start_year = current_year - HISTORY_YEARS
    result: dict[str, dict] = {code: {} for code in codes}

    for metric, indicator in {**INDICATORS, **FX_FALLBACK}.items():
        try:
            rows_by_code = _fetch_indicator(codes, indicator, start_year, current_year)
        except Exception:
            rows_by_code = {code: [] for code in codes}

        for code in codes:
            rows = rows_by_code.get(code, [])
            result[code][metric] = _series_from_rows(rows) if rows else _empty()

    return result
