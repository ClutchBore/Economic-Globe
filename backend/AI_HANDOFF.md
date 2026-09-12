# Country summary and comparison endpoints — provisional handoff

These endpoints are implemented, tested offline, and live-tested with IFM using sample data. They now use A's cached country reader by default.

## Person B quick integration

Backend base URL during local development:

```text
http://localhost:8000
```

Summary:

```http
POST /api/summarize/{country_code}
```

Send no body. Example: `POST /api/summarize/IND`. Response:

```json
{
  "country_code": "IND",
  "country_name": "India",
  "summary": "...",
  "is_mock": false,
  "is_cached": false
}
```

If `is_cached` is true, show a small label such as "Saved AI summary" because the backend used the fallback cache.

Comparison:

```http
POST /api/compare
```

Request body:

```json
{
  "country_a": "IND",
  "country_b": "USA"
}
```

Response:

```json
{
  "country_a": {
    "country_code": "IND",
    "country_name": "India",
    "is_mock": false
  },
  "country_b": {
    "country_code": "USA",
    "country_name": "United States",
    "is_mock": false
  },
  "comparison": "...",
  "is_mock": false
}
```

Chat:

```http
POST /api/chat/{country_code}
```

Request body:

```json
{
  "message": "What does inflation mean here?",
  "history": [],
  "selected_metric": "inflation",
  "comparison_country_code": "USA"
}
```

Use `fetch`, not `EventSource`, because this is a POST request. Read `response.body` as a stream. Append each `delta.text` to the displayed answer, stop loading on `done`, and show a friendly message on `error`. `selected_metric` and `comparison_country_code` are optional. If B sends them, the backend gives the chatbot extra dashboard context; if B omits them, chat still works.

Stream events:

```text
event: meta
data: {"country_code":"IND","is_mock":false,"suggested_questions":["What stands out in this country's data?","What data is missing or limited?","Explain the latest inflation reading.","Are any metrics statistically unusual?"]}

event: delta
data: {"text":"..."}

event: done
data: {}
```

Keep chat history on the frontend and clear it when switching countries.

Rankings:

```http
GET /api/rankings/{metric}
```

Supported metrics: `gdp`, `gdp_per_capita`, `inflation`, `bond_yield_10y`, `fx_rate`.

Example: `GET /api/rankings/gdp`. Response:

```json
{
  "metric": "gdp",
  "unit": "USD",
  "date": "2025",
  "sort": "desc",
  "rankings": [
    {
      "rank": 1,
      "country_code": "USA",
      "country_name": "United States",
      "value": 30769700000000.0,
      "unit": "USD",
      "date": "2025"
    }
  ],
  "skipped": ["..."],
  "note": "Higher values are listed first; higher is not always better."
}
```

Anomalies:

```http
GET /api/anomalies/{metric}
```

Optional query params: `threshold` defaults to `2.0`, `min_prior` defaults to `5`.

Example: `GET /api/anomalies/inflation`. Response:

```json
{
  "metric": "inflation",
  "unit": "%",
  "threshold": 2.0,
  "min_prior_observations": 5,
  "method": "latest value compared with prior observations using population standard deviation",
  "anomalies": [
    {
      "country_code": "ARG",
      "country_name": "Argentina",
      "metric": "inflation",
      "value": 219.8839,
      "date": "2024",
      "unit": "%",
      "prior_mean": 64.028283,
      "prior_stdev": 33.213617,
      "z_score": 4.693,
      "direction": "above",
      "prior_observations": 6
    }
  ],
  "skipped": []
}
```

Show the method/threshold somewhere small in the UI so judges know this is a simple statistical flag, not a claim about real-world causes.

Anomaly explanations:

```http
POST /api/anomaly/explain
```

Send one anomaly object from `/api/anomalies/{metric}` plus threshold and method fields. Response:

```json
{
  "explanation": "Argentina's inflation value ... is above its prior average ...",
  "is_fallback": true
}
```

If `is_fallback` is true, the backend used a deterministic template because IFM failed or was unavailable. The explanation should be displayed as a statistical explanation only. It does not claim a real-world cause.

## Person A: registration

With the existing backend-directory launch command, add these lines to main.py:

```python
from routes.ai import router as ai_router
app.include_router(ai_router)
```

The AI router is registered in `main.py` on Shrav's branch. Summary, comparison, and chat now call `services.data_store.get_country(code)` when the request supplies a country code.

## Person B: request and response

POST /api/summarize/IND with no body. The backend loads `IND` from A's cached country data and sends that payload to IFM. The older full-country JSON body still works for fixture testing; if sent, the URL and body country codes must match. Display the is_mock label whenever true.

The hand-written tests/fixtures/sample_summary_response.json demonstrates the original 200 response shape; it is not a live model output. Current fields are country_code, country_name, summary, is_mock, and is_cached.

- 404: unknown or uncached country code.
- 422: invalid input. FastAPI validation errors use a detail array; code-mismatch errors use a detail string.
- 503: summary unavailable, including absent backend credentials, provider failures, and timeouts. Body: {"detail": "Country summary is temporarily unavailable."}

Show a loading state during the request and a friendly error on failure. A successful live request requires backend IFM_API_KEY and IFM_MODEL settings and can incur usage charges. Successful summaries are saved under backend/cache/ai. If IFM later fails and a saved summary exists, the endpoint returns 200 with is_cached true. If no saved summary exists, it returns 503.

## Comparison for Person B

POST /api/compare with a JSON body containing country_a and country_b as country codes:

```json
{"country_a":"IND","country_b":"USA"}
```

The backend loads both countries from A's cached country data. The older full-country object format still works for fixture testing.

The hand-written tests/fixtures/sample_comparison_response.json shows the response shape, not a live AI output. Country identities preserve input order and each country's is_mock flag. The top-level is_mock is true if either input is fictional; display this label.

Duplicate countries or invalid fields return 422. Unknown country codes return 404. Service failures return 503 with {"detail": "Country comparison is temporarily unavailable."}. The prompt requires acknowledging missing metrics and mismatched dates/units.

Registering the same AI router enables both routes. Comparison uses the shared IFM client; there is no automatic fake response or cached comparison fallback.

## Offline verification

From backend with the virtual environment active:

```powershell
python -m unittest discover -s tests -p "test_ai*.py" -v
```

Tests use an isolated FastAPI app, mocked AI services, cached-reader mocks, cache fallback checks, and mocked HTTP responses. They require no key or network calls. Current offline suite: 30 tests.

## Streaming country chat — provisional contract for B

POST /api/chat/IND with JSON containing message (the current question) and optional history (up to 20 previous user/assistant messages, each with role and content):

```json
{"message":"What does inflation mean here?","history":[]}
```

The backend loads `IND` from A's cached country data. The older body format with a full country object still works for fixture testing. Messages must be nonblank and at most 4000 characters. `selected_metric` and `comparison_country_code` are optional dashboard hints. The chatbot automatically receives ranking positions, anomaly flags, and suggested questions when those calculations are available. Clear history when changing countries; history is client-managed and not stored on the backend.

The same router registration enables chat. Use fetch with POST and read response.body as a stream; browser EventSource does not support this POST body. Buffer decoded text across network chunks, split complete SSE frames on blank lines, and JSON-parse each data field. Network chunks are not event boundaries.

Example events (fictional illustration, not live output):

```text
event: meta
data: {"country_code":"IND","is_mock":true,"suggested_questions":["What stands out in this country's data?","What data is missing or limited?","Explain the latest inflation reading.","Are any metrics statistically unusual?"]}

event: delta
data: {"text":"Using fictional test data, "}

event: delta
data: {"text":"inflation is 5 percent in 2024."}

event: done
data: {}

```

Append delta.text to the displayed answer, label mock data from meta, and optionally render meta.suggested_questions as clickable follow-up prompts. Stop loading on done. Validation errors return HTTP 422 before streaming. Once streaming starts HTTP status is 200; provider/configuration failures produce an error event with {"detail":"Country chat is temporarily unavailable. Please retry."} and no done event. Keep any partial text visibly incomplete. Treat connection closure without done/error as interruption. Use AbortController when cancelling or switching countries; upstream connections are closed when the generator is cancelled/closed. Do not automatically retry a partial response.

The provider read timeout is 30 seconds and total generation limit is 90 seconds. The frontend sends completed user/assistant turns as history so follow-up questions can refer to earlier answers. The backend sends that history to IFM as a transcript inside a user-context message, not as prior assistant-role messages, because IFM can reject assistant history without hidden thinking fields. Chat requests also omit IFM `chat_template_kwargs.reasoning_effort`; summaries/comparisons still use the default high-reasoning settings because they are single-turn requests. Truncated, malformed, empty, or prematurely closed provider streams fail explicitly. B's acceptance and frontend streaming still require validation.
