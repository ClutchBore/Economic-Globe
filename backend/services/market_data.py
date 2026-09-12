"""Fetch and normalize FX rates and bond yields from Yahoo Finance."""

import yfinance as yf

FX_HISTORY_YEARS = 6


def fetch_fx_data(ticker: str | None) -> dict:
    """Latest FX quote, day-over-day % change, and a yearly-averaged history.

    Returns nulls across the board when no ticker is configured (e.g. USD,
    the base currency) or the fetch fails, rather than fabricating a rate.
    """
    if ticker is None:
        return {"latest": None, "change_pct": None, "history": []}

    try:
        hist = yf.Ticker(ticker).history(period=f"{FX_HISTORY_YEARS}y", interval="1d")
    except Exception:
        return {"latest": None, "change_pct": None, "history": []}

    if hist.empty:
        return {"latest": None, "change_pct": None, "history": []}

    closes = hist["Close"].dropna()
    latest = round(float(closes.iloc[-1]), 6) if len(closes) else None
    change_pct = None
    if len(closes) >= 2:
        prev = float(closes.iloc[-2])
        if prev:
            change_pct = round((float(closes.iloc[-1]) - prev) / prev * 100, 3)

    yearly = closes.groupby(closes.index.year).mean()
    history = [{"year": str(year), "value": round(float(value), 6)} for year, value in yearly.items()]

    return {"latest": latest, "change_pct": change_pct, "history": history}
