"""Small JSON cache for AI-generated demo summaries."""

import json
from datetime import datetime, timezone
from pathlib import Path
from typing import Any


AI_CACHE_DIR = Path(__file__).resolve().parent.parent / "cache" / "ai"


def _summary_path(country_code: str) -> Path:
    return AI_CACHE_DIR / f"{country_code.upper()}_summary.json"


def get_summary(country_code: str) -> dict[str, Any] | None:
    path = _summary_path(country_code)
    if not path.exists():
        return None
    try:
        with open(path, encoding="utf-8") as f:
            record = json.load(f)
    except (OSError, json.JSONDecodeError):
        return None
    if not isinstance(record, dict) or not isinstance(record.get("summary"), str):
        return None
    return record


def save_summary(country: dict[str, Any], summary: str) -> dict[str, Any]:
    AI_CACHE_DIR.mkdir(parents=True, exist_ok=True)
    record = {
        "country_code": country["country_code"],
        "country_name": country["country_name"],
        "summary": summary,
        "is_mock": bool(country.get("is_mock", False)),
        "generated_at": datetime.now(timezone.utc).isoformat(),
        "data_as_of": country.get("data_as_of"),
    }
    path = _summary_path(country["country_code"])
    with open(path, "w", encoding="utf-8") as f:
        json.dump(record, f, indent=2, ensure_ascii=False)
        f.write("\n")
    return record
