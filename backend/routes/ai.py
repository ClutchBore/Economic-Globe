"""AI endpoints backed by A's cached country reader, with fixture-body compatibility."""

import json
from contextlib import aclosing
from typing import Any, Literal

from fastapi import APIRouter, HTTPException
from fastapi.responses import StreamingResponse
from pydantic import BaseModel, ConfigDict, Field

from services import ai_cache, data_store
from services.ai import AIServiceError, chat_about_country, compare_countries, summarize_country


router = APIRouter(prefix="/api", tags=["AI"])


class CountrySummaryRequest(BaseModel):
    """Temporary body matching the sample fixture; agree with A/B before integration."""

    model_config = ConfigDict(extra="forbid", allow_inf_nan=False)
    country_code: str = Field(pattern=r"^[A-Z]{3}$")
    country_name: str = Field(min_length=1, max_length=100)
    metrics: dict[str, Any] = Field(min_length=1)
    is_mock: bool = False
    notice: str | None = None


class CountrySummaryResponse(BaseModel):
    country_code: str
    country_name: str
    summary: str
    is_mock: bool
    is_cached: bool = False


class ChatTurn(BaseModel):
    model_config = ConfigDict(extra="forbid", str_strip_whitespace=True)
    role: Literal["user", "assistant"]
    content: str = Field(min_length=1, max_length=4000)


class ChatRequest(BaseModel):
    model_config = ConfigDict(extra="forbid", str_strip_whitespace=True)
    country: CountrySummaryRequest | None = None
    message: str = Field(min_length=1, max_length=4000)
    history: list[ChatTurn] = Field(default_factory=list, max_length=20)


def _identity(country: dict[str, Any]) -> dict[str, Any]:
    return {
        "country_code": country["country_code"],
        "country_name": country["country_name"],
        "is_mock": bool(country.get("is_mock", False)),
    }


def _load_country(code: str) -> dict[str, Any]:
    country = data_store.get_country(code)
    if country is None:
        raise HTTPException(status_code=404, detail=f"Unknown country code: {code}")
    return country


def _country_from_body_or_cache(code: str, country: CountrySummaryRequest | None) -> dict[str, Any]:
    if country is None:
        return _load_country(code)
    if code.upper() != country.country_code:
        raise HTTPException(status_code=422, detail="URL and body country codes must match.")
    return country.model_dump(exclude_none=True)


def _validate_json_country(country: dict[str, Any]) -> None:
    try:
        json.dumps(country, allow_nan=False)
    except (ValueError, TypeError):
        raise HTTPException(status_code=422, detail="Country data must contain valid JSON values.") from None


@router.post("/chat/{country_code}")
async def chat(country_code: str, request: ChatRequest):
    country = _country_from_body_or_cache(country_code, request.country)
    _validate_json_country(country)

    def event(name, data):
        return f"event: {name}\ndata: {json.dumps(data, ensure_ascii=False)}\n\n"

    async def events():
        yield event("meta", {"country_code": country["country_code"],
                             "is_mock": bool(country.get("is_mock", False))})
        try:
            async with aclosing(chat_about_country(country, request.message,
                    [turn.model_dump() for turn in request.history])) as chunks:
                async for text in chunks:
                    yield event("delta", {"text": text})
        except (AIServiceError, ValueError):
            yield event("error", {"detail": "Country chat is temporarily unavailable. Please retry."})
            return
        yield event("done", {})

    return StreamingResponse(events(), media_type="text/event-stream",
                             headers={"Cache-Control": "no-cache", "X-Accel-Buffering": "no"})


class ComparisonRequest(BaseModel):
    model_config = ConfigDict(extra="forbid")
    country_a: CountrySummaryRequest | str
    country_b: CountrySummaryRequest | str


class CountryIdentity(BaseModel):
    country_code: str
    country_name: str
    is_mock: bool


class ComparisonResponse(BaseModel):
    country_a: CountryIdentity
    country_b: CountryIdentity
    comparison: str
    is_mock: bool


@router.post("/compare", response_model=ComparisonResponse)
async def compare(request: ComparisonRequest):
    a = _load_country(request.country_a) if isinstance(request.country_a, str) else request.country_a.model_dump(exclude_none=True)
    b = _load_country(request.country_b) if isinstance(request.country_b, str) else request.country_b.model_dump(exclude_none=True)
    _validate_json_country(a)
    _validate_json_country(b)
    if a["country_code"] == b["country_code"]:
        raise HTTPException(status_code=422, detail="Choose two different countries.")
    try:
        comparison = await compare_countries(a, b)
    except AIServiceError:
        raise HTTPException(status_code=503, detail="Country comparison is temporarily unavailable.") from None
    except ValueError:
        raise HTTPException(status_code=422, detail="Country data must contain valid JSON values.") from None
    return ComparisonResponse(
        country_a=CountryIdentity(**_identity(a)),
        country_b=CountryIdentity(**_identity(b)),
        comparison=comparison,
        is_mock=bool(a.get("is_mock", False) or b.get("is_mock", False)),
    )


@router.post("/summarize/{country_code}", response_model=CountrySummaryResponse)
async def summarize(country_code: str, country: CountrySummaryRequest | None = None):
    """Generate a summary from cached country data, or a supplied legacy fixture body."""
    country_data = _country_from_body_or_cache(country_code, country)
    _validate_json_country(country_data)
    try:
        summary = await summarize_country(country_data)
        ai_cache.save_summary(country_data, summary)
    except AIServiceError:
        cached = ai_cache.get_summary(country_data["country_code"])
        if cached is not None:
            return CountrySummaryResponse(
                country_code=cached["country_code"],
                country_name=cached["country_name"],
                summary=cached["summary"],
                is_mock=bool(cached.get("is_mock", False)),
                is_cached=True,
            )
        # Keep configuration/provider details on the service boundary, not in the UI.
        raise HTTPException(status_code=503, detail="Country summary is temporarily unavailable.") from None
    except ValueError:
        raise HTTPException(status_code=422, detail="Country data must contain valid JSON values.") from None
    return CountrySummaryResponse(
        country_code=country_data["country_code"],
        country_name=country_data["country_name"],
        summary=summary,
        is_mock=bool(country_data.get("is_mock", False)),
        is_cached=False,
    )
