"""Upstash Redis access over its REST API.

REST rather than a TCP Redis client because serverless instances freeze between
invocations, which silently drops pooled connections.

Reads KV_REST_API_URL and KV_REST_API_TOKEN from the environment — whoever
imports this is responsible for having loaded .env first.
"""

import json
import os

import httpx

_http = httpx.Client(timeout=10.0, trust_env=False)


def country_key(code: str) -> str:
    return f"country:{code.upper()}"


def summary_key(code: str) -> str:
    return f"ai_summary:{code.upper()}"


def _command(*args: str):
    try:
        # .strip() before .rstrip("/"): a pasted secret (GitHub Actions, dashboard
        # UIs) can carry a trailing newline that "/"-only stripping leaves intact,
        # which httpx then rejects as a non-printable character in the URL.
        url = os.environ["KV_REST_API_URL"].strip().rstrip("/")
        token = os.environ["KV_REST_API_TOKEN"].strip()
    except KeyError as e:
        raise RuntimeError(
            f"{e.args[0]} is not set — copy the Upstash credentials into backend/.env"
        ) from None

    response = _http.post(
        url, headers={"Authorization": f"Bearer {token}"}, json=list(args)
    )
    response.raise_for_status()
    return response.json()["result"]


def get_json(key: str) -> dict | None:
    raw = _command("GET", key)
    return json.loads(raw) if raw is not None else None


_MGET_CHUNK = 50


def mget_json(keys: list[str]) -> list[dict | None]:
    """Fetch many keys, returning values aligned with `keys`.

    Chunked rather than one request: a single MGET across every economy would
    pull roughly a megabyte in one response. Still far fewer round trips than
    one GET per country.
    """
    out: list[dict | None] = []
    for start in range(0, len(keys), _MGET_CHUNK):
        out.extend(
            json.loads(raw) if raw is not None else None
            for raw in _command("MGET", *keys[start : start + _MGET_CHUNK])
        )
    return out


def set_json(key: str, value: dict) -> None:
    _command("SET", key, json.dumps(value))
