"""Provisional summary API: callers supply country data until A's reader exists."""

import json
from contextlib import aclosing
from typing import Any, Literal

from fastapi import APIRouter, HTTPException
from fastapi.responses import StreamingResponse
from pydantic import BaseModel, ConfigDict, Field

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


class ChatTurn(BaseModel):
    model_config = ConfigDict(extra="forbid", str_strip_whitespace=True)
    role: Literal["user", "assistant"]
    content: str = Field(min_length=1, max_length=4000)


class ChatRequest(BaseModel):
    model_config = ConfigDict(extra="forbid", str_strip_whitespace=True)
    country: CountrySummaryRequest
    message: str = Field(min_length=1, max_length=4000)
    history: list[ChatTurn] = Field(default_factory=list, max_length=20)


@router.post("/chat/{country_code}")
async def chat(country_code: str, request: ChatRequest):
    if country_code.upper() != request.country.country_code:
        raise HTTPException(status_code=422, detail="URL and body country codes must match.")
    country = request.country.model_dump(exclude_none=True)
    try:
        json.dumps(country, allow_nan=False)
    except (ValueError, TypeError):
        raise HTTPException(status_code=422, detail="Country data must contain valid JSON values.") from None

    def event(name, data):
        return f"event: {name}\ndata: {json.dumps(data, ensure_ascii=False)}\n\n"

    async def events():
        yield event("meta", {"country_code": request.country.country_code,
                             "is_mock": request.country.is_mock})
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
    country_a: CountrySummaryRequest
    country_b: CountrySummaryRequest


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
    a, b = request.country_a, request.country_b
    if a.country_code == b.country_code:
        raise HTTPException(status_code=422, detail="Choose two different countries.")
    try:
        comparison = await compare_countries(
            a.model_dump(exclude_none=True), b.model_dump(exclude_none=True)
        )
    except AIServiceError:
        raise HTTPException(status_code=503, detail="Country comparison is temporarily unavailable.") from None
    except ValueError:
        raise HTTPException(status_code=422, detail="Country data must contain valid JSON values.") from None
    return ComparisonResponse(
        country_a=CountryIdentity(**a.model_dump()),
        country_b=CountryIdentity(**b.model_dump()),
        comparison=comparison,
        is_mock=a.is_mock or b.is_mock,
    )


@router.post("/summarize/{country_code}", response_model=CountrySummaryResponse)
async def summarize(country_code: str, country: CountrySummaryRequest):
    """Generate a summary from the supplied body; no data is fetched implicitly."""
    if country_code.upper() != country.country_code:
        raise HTTPException(status_code=422, detail="URL and body country codes must match.")
    try:
        summary = await summarize_country(country.model_dump(exclude_none=True))
    except AIServiceError:
        # Keep configuration/provider details on the service boundary, not in the UI.
        raise HTTPException(status_code=503, detail="Country summary is temporarily unavailable.") from None
    except ValueError:
        raise HTTPException(status_code=422, detail="Country data must contain valid JSON values.") from None
    return CountrySummaryResponse(
        country_code=country.country_code,
        country_name=country.country_name,
        summary=summary,
        is_mock=country.is_mock,
    )
