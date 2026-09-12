"""Cache of AI-generated demo summaries, stored in Upstash KV.

Not local files: `save_summary` is called from inside a request handler, and on
serverless a file written there lives on one ephemeral instance and is lost.
"""

from datetime import datetime, timezone
from typing import Any

from services import kv_client


def get_summary(country_code: str) -> dict[str, Any] | None:
    # This is the fallback path, reached when the live AI call already failed,
    # so it must never raise — an unreachable KV degrades to "no cached summary".
    try:
        record = kv_client.get_json(kv_client.summary_key(country_code))
    except Exception:
        return None
    if not isinstance(record, dict) or not isinstance(record.get("summary"), str):
        return None
    return record


def save_summary(country: dict[str, Any], summary: str) -> dict[str, Any]:
    record = {
        "country_code": country["country_code"],
        "country_name": country["country_name"],
        "summary": summary,
        "is_mock": bool(country.get("is_mock", False)),
        "generated_at": datetime.now(timezone.utc).isoformat(),
        "data_as_of": country.get("data_as_of"),
    }
    kv_client.set_json(kv_client.summary_key(country["country_code"]), record)
    return record
