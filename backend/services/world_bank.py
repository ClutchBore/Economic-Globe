"""Fetch and normalize the World Bank indicators behind each country payload.

Every indicator here is populated for all 31 configured countries. Check
coverage before adding more — a half-populated indicator leaves holes on the
map (central government debt, GC.DOD.TOTL.GD.ZS, covers only 16 of 31).
"""

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
}

HISTORY_YEARS = 10


def fetch_world_bank_metrics(wb_code: str) -> dict:
    """Return latest value + date and yearly history for each indicator.

    Missing observations (a common World Bank gap) come back as None/omitted
    from the history list rather than invented values.
    """
    result = {}
    current_year = __import__("datetime").date.today().year
    time_range = range(current_year - HISTORY_YEARS, current_year + 1)

    for metric, indicator in INDICATORS.items():
        try:
            df = wb.data.DataFrame(indicator, economy=wb_code, time=time_range, numericTimeKeys=True)
        except Exception:
            result[metric] = {"latest": None, "date": None, "history": []}
            continue

        if df.empty:
            result[metric] = {"latest": None, "date": None, "history": []}
            continue

        row = df.loc[wb_code] if wb_code in df.index else df.iloc[0]
        history = []
        latest_value, latest_year = None, None
        for year in sorted(row.index):
            value = row[year]
            if value is None or (isinstance(value, float) and value != value):  # NaN check
                continue
            history.append({"year": str(year), "value": round(float(value), 4)})
            latest_value, latest_year = round(float(value), 4), str(year)

        result[metric] = {"latest": latest_value, "date": latest_year, "history": history}

    return result
