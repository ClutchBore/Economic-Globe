# Country summary and comparison endpoints — provisional handoff

This endpoint is implemented and tested offline. The live OpenRouter response has not been verified. The request format is provisional until A and B agree on it.

## Person A: registration

With the existing backend-directory launch command, add these lines to main.py:

```python
from routes.ai import router as ai_router
app.include_router(ai_router)
```

The entry point has not been edited. The route is unavailable in the main app until registered. Later, replace the supplied request data with the agreed cache reader for authoritative country data. Currently there is no implicit data lookup or automatic sample fallback.

## Person B: request and response

POST /api/summarize/IND with Content-Type: application/json. Send the contents of tests/fixtures/sample_country.json as the body. The URL and body's three-letter country code must match. Metrics must be non-empty; individual missing metric values may be null. Display the is_mock label whenever true.

The hand-written tests/fixtures/sample_summary_response.json demonstrates the 200 response shape; it is not a live model output. Fields are country_code, country_name, summary, and is_mock.

- 422: invalid input. FastAPI validation errors use a detail array; code-mismatch errors use a detail string.
- 503: summary unavailable, including absent backend credentials, provider failures, and timeouts. Body: {"detail": "Country summary is temporarily unavailable."}

Show a loading state during the request and a friendly error on failure. A successful request requires backend OPENROUTER_API_KEY and OPENROUTER_MODEL settings and can incur usage charges. No cached-summary fallback is implemented yet.

## Comparison for Person B

POST /api/compare with a JSON body containing country_a and country_b. Each is a full country record using the same shape as the summary request, not just a country code. For a sample request, put sample_country.json under country_a and sample_country_usa.json under country_b (both in tests/fixtures).

The hand-written tests/fixtures/sample_comparison_response.json shows the response shape, not a live AI output. Country identities preserve input order and each country's is_mock flag. The top-level is_mock is true if either input is fictional; display this label.

Duplicate countries, missing records, or invalid fields return 422. Service failures return 503 with {"detail": "Country comparison is temporarily unavailable."}. The prompt requires acknowledging missing metrics and mismatched dates/units; these instructions have not yet been verified against a live model.

Registering the same AI router enables both routes. Comparison uses the shared OpenRouter client; there is no automatic fake response or cached comparison fallback.

## Offline verification

From backend with the virtual environment active:

```powershell
python -m unittest discover -s tests -p "test_ai*.py" -v
```

Tests use an isolated FastAPI app, mocked AI services, and mocked HTTP responses. They require no key or network calls.

## Streaming country chat — provisional contract for B

POST /api/chat/IND with JSON containing country (the full sample_country.json object), message (the current question), and optional history (up to 20 previous user/assistant messages, each with role and content). Messages must be nonblank and at most 4000 characters. Clear history when changing countries; history is client-managed and not stored on the backend.

The same router registration enables chat. Use fetch with POST and read response.body as a stream; browser EventSource does not support this POST body. Buffer decoded text across network chunks, split complete SSE frames on blank lines, and JSON-parse each data field. Network chunks are not event boundaries.

Example events (fictional illustration, not live output):

```text
event: meta
data: {"country_code":"IND","is_mock":true}

event: delta
data: {"text":"Using fictional test data, "}

event: delta
data: {"text":"inflation is 5 percent in 2024."}

event: done
data: {}

```

Append delta.text to the displayed answer and label mock data from meta. Stop loading on done. Validation errors return HTTP 422 before streaming. Once streaming starts HTTP status is 200; provider/configuration failures produce an error event with {"detail":"Country chat is temporarily unavailable. Please retry."} and no done event. Keep any partial text visibly incomplete. Treat connection closure without done/error as interruption. Use AbortController when cancelling or switching countries; upstream connections are closed when the generator is cancelled/closed. Do not automatically retry a partial response.

The provider read timeout is 30 seconds, total generation limit 90 seconds, and output cap 600 tokens. Truncated, malformed, empty, or prematurely closed provider streams fail explicitly. This has only been tested offline; B's acceptance, live-model behavior, and deployed streaming still require validation.
