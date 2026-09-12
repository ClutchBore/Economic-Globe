"""Fetch and normalize the World Bank indicators behind each country payload.

One request per indicator covering every economy at once, rather than one request
per economy — at 217 economies that is the difference between ~9 requests and
~2,000, and it runs in seconds.

Coverage varies by indicator. Population and life expectancy are near-universal;
central government debt is published for well under half of economies. A missing
observation reports null rather than an invented value.
"""

import datetime

import wbgapi as wb

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


def fetch_all_metrics(codes: list[str]) -> dict[str, dict]:
    """Return {economy code: {metric: {latest, date, history}}} for every code."""
    current_year = datetime.date.today().year
    time_range = range(current_year - HISTORY_YEARS, current_year + 1)
    result: dict[str, dict] = {code: {} for code in codes}

    for metric, indicator in INDICATORS.items():
        try:
            df = wb.data.DataFrame(
                indicator, economy=codes, time=time_range, numericTimeKeys=True
            )
        except Exception:
            df = None

        for code in codes:
            if df is None or code not in df.index:
                result[code][metric] = _empty()
            else:
                result[code][metric] = _series(df.loc[code])

    return result
