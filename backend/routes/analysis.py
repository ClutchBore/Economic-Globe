from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, ConfigDict, Field

from services.ai import AIServiceError, explain_anomaly
from services.analysis import (
    AnalysisError,
    biggest_movers,
    detect_anomalies,
    market_health_scores,
    metric_correlation,
    rank_countries,
    rolling_trends,
    timeline,
)


router = APIRouter(prefix="/api", tags=["analysis"])


class AnomalyExplainRequest(BaseModel):
    model_config = ConfigDict(extra="forbid")
    country_code: str = Field(min_length=2, max_length=3)
    country_name: str = Field(min_length=1)
    metric: str = Field(min_length=1)
    value: float
    date: str | None = None
    unit: str | None = None
    prior_mean: float
    prior_stdev: float
    z_score: float
    direction: str = Field(pattern="^(above|below)$")
    threshold: float = 2.0
    method: str = "latest value compared with prior observations using population standard deviation"
    prior_observations: int = Field(ge=2)


class AnomalyExplainResponse(BaseModel):
    explanation: str
    is_fallback: bool


def _fallback_explanation(anomaly: dict) -> str:
    unit = anomaly.get("unit") or "units"
    date = anomaly.get("date") or "the latest period"
    return (
        f"{anomaly['country_name']}'s {anomaly['metric']} value of {anomaly['value']} {unit} "
        f"in {date} is {anomaly['direction']} its prior average of {anomaly['prior_mean']} {unit} "
        f"by {abs(anomaly['z_score'])} standard deviations. This is a statistical flag "
        "based on the available history, not proof of a real-world cause."
    )


@router.get("/rankings/{metric}")
def rankings(metric: str):
    try:
        return rank_countries(metric)
    except AnalysisError as exc:
        raise HTTPException(status_code=422, detail=str(exc)) from None


@router.get("/anomalies/{metric}")
def anomalies(metric: str, threshold: float = 2.0, min_prior: int = 5):
    try:
        return detect_anomalies(metric, threshold=threshold, min_prior=min_prior)
    except AnalysisError as exc:
        raise HTTPException(status_code=422, detail=str(exc)) from None


@router.get("/market-health")
def market_health():
    try:
        return market_health_scores()
    except AnalysisError as exc:
        raise HTTPException(status_code=422, detail=str(exc)) from None


@router.get("/correlations")
def correlations(metric_x: str, metric_y: str):
    try:
        return metric_correlation(metric_x, metric_y)
    except AnalysisError as exc:
        raise HTTPException(status_code=422, detail=str(exc)) from None


@router.get("/trends/{metric}")
def trends(metric: str, window: int = 3):
    try:
        return rolling_trends(metric, window=window)
    except AnalysisError as exc:
        raise HTTPException(status_code=422, detail=str(exc)) from None


@router.get("/movers/{metric}")
def movers(metric: str, limit: int = 5):
    try:
        return biggest_movers(metric, limit=limit)
    except AnalysisError as exc:
        raise HTTPException(status_code=422, detail=str(exc)) from None


@router.get("/timeline/{metric}")
def metric_timeline(metric: str):
    try:
        return timeline(metric)
    except AnalysisError as exc:
        raise HTTPException(status_code=422, detail=str(exc)) from None


@router.post("/anomaly/explain", response_model=AnomalyExplainResponse)
async def anomaly_explain(request: AnomalyExplainRequest):
    anomaly = request.model_dump()
    try:
        explanation = await explain_anomaly(anomaly)
        return AnomalyExplainResponse(explanation=explanation, is_fallback=False)
    except (AIServiceError, ValueError):
        return AnomalyExplainResponse(explanation=_fallback_explanation(anomaly), is_fallback=True)
