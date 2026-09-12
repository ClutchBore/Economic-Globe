"""Upstash Redis access over its REST API.

REST rather than a TCP Redis client because serverless instances freeze between
invocations, which silently drops pooled connections.

Reads KV_REST_API_URL and KV_REST_API_TOKEN from the environment — whoever
imports this is responsible for having loaded .env first.
"""

import json
import os

import httpx

_http = httpx.Client(timeout=10.0)


def country_key(code: str) -> str:
    return f"country:{code.upper()}"


def _command(*args: str):
    try:
        url = os.environ["KV_REST_API_URL"].rstrip("/")
        token = os.environ["KV_REST_API_TOKEN"]
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


def mget_json(keys: list[str]) -> list[dict | None]:
    """Fetch many keys in one round trip, aligned with `keys`. Keeps the
    import-time load in data_store to a single request instead of one per country.
    """
    if not keys:
        return []
    return [
        json.loads(raw) if raw is not None else None for raw in _command("MGET", *keys)
    ]


def set_json(key: str, value: dict) -> None:
    _command("SET", key, json.dumps(value))
