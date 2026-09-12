"""Ranking and anomaly helpers for cached economic data."""

from statistics import mean, pstdev
from typing import Any

from services import data_store


SUPPORTED_METRICS = {
    "gdp",
    "gdp_per_capita",
    "gdp_per_capita_ppp",
    "gdp_growth",
    "inflation",
    "unemployment",
    "population",
    "life_expectancy",
    "govt_debt_pct_gdp",
    "exports_pct_gdp",
    "urban_population_pct",
    "internet_users_pct",
    "co2_per_capita",
    "bond_yield_10y",
    "fx_rate",
}

SUPPORTED_RANKING_METRICS = SUPPORTED_METRICS
SUPPORTED_ANOMALY_METRICS = SUPPORTED_METRICS

HEALTH_COMPONENT_WEIGHTS = {
    "gdp_per_capita": 30,
    "gdp_growth": 25,
    "inflation_stability": 25,
    "fx_stability": 10,
    "bond_yield": 10,
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


def _latest_growth_pct(country: dict[str, Any], metric: str) -> float | None:
    points = [
        item for item in country.get("history", {}).get(metric, [])
        if isinstance(item, dict) and isinstance(item.get("value"), (int, float))
    ]
    if len(points) < 2:
        return None
    previous = points[-2]["value"]
    latest = points[-1]["value"]
    if previous == 0:
        return None
    return ((latest - previous) / abs(previous)) * 100


def _linear_score(value: float, best: float, worst: float) -> float:
    if best == worst:
        return 100.0
    score = ((value - worst) / (best - worst)) * 100
    return max(0.0, min(100.0, score))


def _target_score(value: float, target: float, tolerance: float) -> float:
    score = 100 - (abs(value - target) / tolerance) * 100
    return max(0.0, min(100.0, score))


def _numeric_history(country: dict[str, Any], metric: str) -> list[dict[str, Any]]:
    points = [
        item for item in country.get("history", {}).get(metric, [])
        if isinstance(item, dict) and isinstance(item.get("value"), (int, float))
    ]
    return sorted(points, key=lambda item: str(item.get("year", "")))


def _validate_supported_metric(metric: str) -> str:
    metric = metric.strip().lower()
    if metric not in SUPPORTED_RANKING_METRICS:
        raise AnalysisError(f"Unsupported metric: {metric}")
    return metric


def rank_countries(metric: str) -> dict[str, Any]:
    metric = _validate_supported_metric(metric)

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


def metric_correlation(metric_x: str, metric_y: str) -> dict[str, Any]:
    metric_x = _validate_supported_metric(metric_x)
    metric_y = _validate_supported_metric(metric_y)
    if metric_x == metric_y:
        raise AnalysisError("Choose two different metrics.")

    pairs = []
    skipped = []
    for country in _all_cached_countries():
        x = country.get(metric_x)
        y = country.get(metric_y)
        if isinstance(x, (int, float)) and isinstance(y, (int, float)):
            pairs.append({
                "country_code": country["country_code"],
                "country_name": country["country_name"],
                metric_x: x,
                metric_y: y,
            })
        else:
            skipped.append(country["country_code"])
    if len(pairs) < 3:
        raise AnalysisError("At least three countries with both metrics are required.")

    xs = [item[metric_x] for item in pairs]
    ys = [item[metric_y] for item in pairs]
    x_mean = mean(xs)
    y_mean = mean(ys)
    numerator = sum((x - x_mean) * (y - y_mean) for x, y in zip(xs, ys))
    x_denom = sum((x - x_mean) ** 2 for x in xs)
    y_denom = sum((y - y_mean) ** 2 for y in ys)
    if x_denom == 0 or y_denom == 0:
        raise AnalysisError("Correlation is undefined when one metric has no variation.")
    coefficient = numerator / ((x_denom * y_denom) ** 0.5)
    strength = "weak"
    if abs(coefficient) >= 0.7:
        strength = "strong"
    elif abs(coefficient) >= 0.4:
        strength = "moderate"
    return {
        "metric_x": metric_x,
        "metric_y": metric_y,
        "coefficient": round(coefficient, 3),
        "strength": strength,
        "direction": "positive" if coefficient > 0 else "negative",
        "sample_size": len(pairs),
        "pairs": pairs,
        "skipped": skipped,
        "note": "Correlation describes co-movement in the available latest values; it does not prove causation.",
    }


def rolling_trends(metric: str, *, window: int = 3) -> dict[str, Any]:
    metric = _validate_supported_metric(metric)
    if window < 2:
        raise AnalysisError("Window must be at least 2.")
    trends = []
    skipped = []
    for country in _all_cached_countries():
        points = _numeric_history(country, metric)
        if len(points) < window:
            skipped.append({"country_code": country["country_code"], "reason": "insufficient_history"})
            continue
        recent = points[-window:]
        start = recent[0]["value"]
        end = recent[-1]["value"]
        absolute_change = end - start
        percent_change = None if start == 0 else (absolute_change / abs(start)) * 100
        direction = "flat"
        if absolute_change > 0:
            direction = "up"
        elif absolute_change < 0:
            direction = "down"
        trends.append({
            "country_code": country["country_code"],
            "country_name": country["country_name"],
            "metric": metric,
            "window": window,
            "start_year": recent[0].get("year"),
            "end_year": recent[-1].get("year"),
            "start_value": start,
            "end_value": end,
            "absolute_change": round(absolute_change, 6),
            "percent_change": None if percent_change is None else round(percent_change, 3),
            "direction": direction,
            "unit": country.get("units", {}).get(metric),
        })
    if not trends:
        raise AnalysisError(f"No trend data available for {metric}.")
    trends.sort(key=lambda item: abs(item["absolute_change"]), reverse=True)
    return {
        "metric": metric,
        "window": window,
        "trends": trends,
        "skipped": skipped,
        "note": "Trend uses the first and last observations in the selected recent window.",
    }


def biggest_movers(metric: str, *, limit: int = 5) -> dict[str, Any]:
    metric = _validate_supported_metric(metric)
    if limit < 1 or limit > 50:
        raise AnalysisError("Limit must be between 1 and 50.")
    movers = []
    skipped = []
    for country in _all_cached_countries():
        points = _numeric_history(country, metric)
        if len(points) < 2:
            skipped.append({"country_code": country["country_code"], "reason": "insufficient_history"})
            continue
        previous = points[-2]
        latest = points[-1]
        change = latest["value"] - previous["value"]
        percent_change = None if previous["value"] == 0 else (change / abs(previous["value"])) * 100
        movers.append({
            "country_code": country["country_code"],
            "country_name": country["country_name"],
            "metric": metric,
            "previous_year": previous.get("year"),
            "latest_year": latest.get("year"),
            "previous_value": previous["value"],
            "latest_value": latest["value"],
            "absolute_change": round(change, 6),
            "percent_change": None if percent_change is None else round(percent_change, 3),
            "direction": "up" if change > 0 else "down" if change < 0 else "flat",
            "unit": country.get("units", {}).get(metric),
        })
    if not movers:
        raise AnalysisError(f"No mover data available for {metric}.")
    movers.sort(key=lambda item: abs(item["absolute_change"]), reverse=True)
    return {
        "metric": metric,
        "limit": limit,
        "movers": movers[:limit],
        "skipped": skipped,
        "note": "Movers compare the latest observation with the previous observation.",
    }


def timeline(metric: str) -> dict[str, Any]:
    metric = _validate_supported_metric(metric)
    years = set()
    countries = []
    skipped = []
    for country in _all_cached_countries():
        points = _numeric_history(country, metric)
        if not points:
            skipped.append({"country_code": country["country_code"], "reason": "no_history"})
            continue
        values = {}
        for point in points:
            year = str(point.get("year"))
            years.add(year)
            values[year] = point["value"]
        countries.append({
            "country_code": country["country_code"],
            "country_name": country["country_name"],
            "unit": country.get("units", {}).get(metric),
            "values": values,
        })
    if not countries:
        raise AnalysisError(f"No timeline data available for {metric}.")
    return {
        "metric": metric,
        "years": sorted(years),
        "countries": countries,
        "skipped": skipped,
        "note": "Use years with null/missing country values as gaps in the time slider.",
    }


def market_health_scores() -> dict[str, Any]:
    countries = _all_cached_countries()
    if not countries:
        raise AnalysisError("No country data available.")

    gdp_per_capita_values = [
        country.get("gdp_per_capita") for country in countries
        if isinstance(country.get("gdp_per_capita"), (int, float))
    ]
    gdp_growth_values = [
        growth for country in countries
        if (growth := _latest_growth_pct(country, "gdp")) is not None
    ]
    gdp_per_capita_best = max(gdp_per_capita_values) if gdp_per_capita_values else None
    gdp_per_capita_worst = min(gdp_per_capita_values) if gdp_per_capita_values else None
    gdp_growth_best = max(gdp_growth_values) if gdp_growth_values else None
    gdp_growth_worst = min(gdp_growth_values) if gdp_growth_values else None

    rows = []
    skipped = []
    for country in countries:
        components = []

        gdp_per_capita = country.get("gdp_per_capita")
        if (isinstance(gdp_per_capita, (int, float)) and
                gdp_per_capita_best is not None and gdp_per_capita_worst is not None):
            components.append({
                "name": "gdp_per_capita",
                "label": "GDP per capita",
                "value": round(gdp_per_capita, 4),
                "unit": country.get("units", {}).get("gdp_per_capita"),
                "score": round(_linear_score(gdp_per_capita, gdp_per_capita_best, gdp_per_capita_worst), 2),
                "weight": HEALTH_COMPONENT_WEIGHTS["gdp_per_capita"],
                "note": "Higher GDP per person scores higher within the available countries.",
            })

        gdp_growth = _latest_growth_pct(country, "gdp")
        if gdp_growth is not None and gdp_growth_best is not None and gdp_growth_worst is not None:
            components.append({
                "name": "gdp_growth",
                "label": "Latest GDP growth",
                "value": round(gdp_growth, 4),
                "unit": "%",
                "score": round(_linear_score(gdp_growth, gdp_growth_best, gdp_growth_worst), 2),
                "weight": HEALTH_COMPONENT_WEIGHTS["gdp_growth"],
                "note": "Higher latest GDP growth scores higher within the available countries.",
            })

        inflation = country.get("inflation")
        if isinstance(inflation, (int, float)):
            components.append({
                "name": "inflation_stability",
                "label": "Inflation stability",
                "value": round(inflation, 4),
                "unit": country.get("units", {}).get("inflation"),
                "score": round(_target_score(inflation, target=2.0, tolerance=10.0), 2),
                "weight": HEALTH_COMPONENT_WEIGHTS["inflation_stability"],
                "note": "Scores highest near 2%; farther away scores lower.",
            })

        fx_change = country.get("fx_change_pct")
        if isinstance(fx_change, (int, float)):
            components.append({
                "name": "fx_stability",
                "label": "FX stability",
                "value": round(fx_change, 4),
                "unit": "%",
                "score": round(_target_score(fx_change, target=0.0, tolerance=5.0), 2),
                "weight": HEALTH_COMPONENT_WEIGHTS["fx_stability"],
                "note": "Smaller daily currency moves score higher.",
            })

        bond_yield = country.get("bond_yield_10y")
        if isinstance(bond_yield, (int, float)):
            components.append({
                "name": "bond_yield",
                "label": "10-year bond yield",
                "value": round(bond_yield, 4),
                "unit": country.get("units", {}).get("bond_yield_10y"),
                "score": round(_target_score(bond_yield, target=3.0, tolerance=8.0), 2),
                "weight": HEALTH_COMPONENT_WEIGHTS["bond_yield"],
                "note": "Scores highest near 3%; very high or very low yields score lower.",
            })

        if not components:
            skipped.append({"country_code": country["country_code"], "reason": "no_supported_components"})
            continue

        used_weight = sum(component["weight"] for component in components)
        score = sum(component["score"] * component["weight"] for component in components) / used_weight
        rows.append({
            "country_code": country["country_code"],
            "country_name": country["country_name"],
            "score": round(score, 1),
            "components": components,
            "used_weight": used_weight,
            "missing_components": [
                name for name in HEALTH_COMPONENT_WEIGHTS
                if name not in {component["name"] for component in components}
            ],
        })

    if not rows:
        raise AnalysisError("No market health scores could be calculated.")
    rows.sort(key=lambda item: item["score"], reverse=True)
    ranked = [{**row, "rank": index} for index, row in enumerate(rows, start=1)]
    return {
        "method": "weighted normalized score across available GDP per capita, GDP growth, inflation, FX movement, and bond yield components",
        "score_scale": "0-100",
        "weights": HEALTH_COMPONENT_WEIGHTS,
        "rankings": ranked,
        "skipped": skipped,
        "note": "This is a demo score for comparison only. Missing components are excluded and weights are re-normalized.",
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
