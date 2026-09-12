"""Ranking and anomaly helpers for cached economic data."""

from statistics import mean, pstdev
from typing import Any

from services import data_store


SUPPORTED_RANKING_METRICS = {
    "gdp",
    "gdp_per_capita",
    "inflation",
    "bond_yield_10y",
    "fx_rate",
}

SUPPORTED_ANOMALY_METRICS = {
    "gdp",
    "gdp_per_capita",
    "inflation",
    "bond_yield_10y",
    "fx_rate",
}


class AnalysisError(ValueError):
    """Raised when analysis inputs cannot produce a meaningful result."""


def _all_cached_countries() -> list[dict[str, Any]]:
    countries = []
    for item in data_store.list_countries():
        country = data_store.get_country(item["country_code"])
        if country is not None:
            countries.append(country)
    return countries


def rank_countries(metric: str) -> dict[str, Any]:
    metric = metric.strip().lower()
    if metric not in SUPPORTED_RANKING_METRICS:
        raise AnalysisError(f"Unsupported metric: {metric}")

    rows = []
    skipped = []
    units = set()
    dates = set()
    for country in _all_cached_countries():
        value = country.get(metric)
        if not isinstance(value, (int, float)):
            skipped.append(country["country_code"])
            continue
        unit = country.get("units", {}).get(metric)
        date = country.get("dates", {}).get(metric)
        if unit:
            units.add(unit)
        if date:
            dates.add(str(date))
        rows.append({
            "country_code": country["country_code"],
            "country_name": country["country_name"],
            "value": value,
            "unit": unit,
            "date": date,
        })

    if not rows:
        raise AnalysisError(f"No comparable data available for {metric}.")

    rows.sort(key=lambda item: item["value"], reverse=True)
    rankings = [{**row, "rank": index} for index, row in enumerate(rows, start=1)]
    return {
        "metric": metric,
        "unit": units.pop() if len(units) == 1 else None,
        "date": dates.pop() if len(dates) == 1 else None,
        "sort": "desc",
        "rankings": rankings,
        "skipped": skipped,
        "note": "Higher values are listed first; higher is not always better.",
    }


def detect_anomalies(metric: str, *, threshold: float = 2.0, min_prior: int = 5) -> dict[str, Any]:
    metric = metric.strip().lower()
    if metric not in SUPPORTED_ANOMALY_METRICS:
        raise AnalysisError(f"Unsupported metric: {metric}")
    if threshold <= 0:
        raise AnalysisError("Threshold must be positive.")
    if min_prior < 2:
        raise AnalysisError("Minimum prior observations must be at least 2.")

    anomalies = []
    skipped = []
    units = set()
    for country in _all_cached_countries():
        history = country.get("history", {}).get(metric, [])
        if not isinstance(history, list) or len(history) < min_prior + 1:
            skipped.append({"country_code": country["country_code"], "reason": "insufficient_history"})
            continue
        points = [
            item for item in history
            if isinstance(item, dict) and isinstance(item.get("value"), (int, float))
        ]
        if len(points) < min_prior + 1:
            skipped.append({"country_code": country["country_code"], "reason": "insufficient_numeric_history"})
            continue

        prior = [item["value"] for item in points[:-1]]
        latest = points[-1]
        prior_stdev = pstdev(prior)
        if prior_stdev == 0:
            skipped.append({"country_code": country["country_code"], "reason": "zero_variation"})
            continue

        prior_mean = mean(prior)
        z_score = (latest["value"] - prior_mean) / prior_stdev
        unit = country.get("units", {}).get(metric)
        if unit:
            units.add(unit)
        if abs(z_score) >= threshold:
            anomalies.append({
                "country_code": country["country_code"],
                "country_name": country["country_name"],
                "metric": metric,
                "value": latest["value"],
                "date": latest.get("year"),
                "unit": unit,
                "prior_mean": round(prior_mean, 6),
                "prior_stdev": round(prior_stdev, 6),
                "z_score": round(z_score, 3),
                "direction": "above" if z_score > 0 else "below",
                "prior_observations": len(prior),
            })

    anomalies.sort(key=lambda item: abs(item["z_score"]), reverse=True)
    return {
        "metric": metric,
        "unit": units.pop() if len(units) == 1 else None,
        "threshold": threshold,
        "min_prior_observations": min_prior,
        "method": "latest value compared with prior observations using population standard deviation",
        "anomalies": anomalies,
        "skipped": skipped,
    }
