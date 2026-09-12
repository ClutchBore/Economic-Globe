"""Offline comparison API and shared IFM client checks."""

import json
import os
from pathlib import Path
import unittest
from unittest.mock import AsyncMock, patch

import httpx
from fastapi import FastAPI
from fastapi.testclient import TestClient
from routes.ai import router
from services.ai import AIServiceError, compare_countries, summarize_country

FIXTURES = Path(__file__).parent / "fixtures"


def fixture(name):
    return json.loads((FIXTURES / name).read_text(encoding="utf-8"))


class ComparisonRoutes(unittest.TestCase):
    def setUp(self):
        app = FastAPI()
        app.include_router(router)
        self.client = TestClient(app)
        self.body = {"country_a": fixture("sample_country.json"), "country_b": fixture("sample_country_usa.json")}

    def test_success_matches_handoff(self):
        expected = fixture("sample_comparison_response.json")
        with patch("routes.ai.compare_countries", new_callable=AsyncMock) as service:
            service.return_value = expected["comparison"]
            response = self.client.post("/api/compare", json=self.body)
            self.assertEqual(response.status_code, 200)
            self.assertEqual(response.json(), expected)
            self.assertIsNone(service.call_args.args[1]["metrics"]["bond_yield_10y"]["value"])

    def test_mock_label_when_only_second_country_is_mock(self):
        self.body["country_a"]["is_mock"] = False
        with patch("routes.ai.compare_countries", new_callable=AsyncMock, return_value="Example"):
            response = self.client.post("/api/compare", json=self.body)
            self.assertTrue(response.json()["is_mock"])
            self.assertFalse(response.json()["country_a"]["is_mock"])

    def test_invalid_inputs_do_not_call_ai(self):
        cases = [{}, {"country_a": self.body["country_a"]},
                 {"country_a": self.body["country_a"], "country_b": self.body["country_a"]},
                 {**self.body, "country_b": {**self.body["country_b"], "metrics": {}}}]
        with patch("routes.ai.compare_countries", new_callable=AsyncMock) as service:
            for body in cases:
                with self.subTest(body=body):
                    self.assertEqual(self.client.post("/api/compare", json=body).status_code, 422)
            service.assert_not_called()

    def test_service_failure_is_safe(self):
        with patch("routes.ai.compare_countries", new_callable=AsyncMock, side_effect=AIServiceError("private")):
            response = self.client.post("/api/compare", json=self.body)
            self.assertEqual(response.status_code, 503)
            self.assertNotIn("private", response.text)

    def test_can_compare_cached_country_codes(self):
        india = fixture("sample_country.json")
        usa = fixture("sample_country_usa.json")
        expected = fixture("sample_comparison_response.json")
        with patch("routes.ai.data_store.get_country", side_effect=[india, usa]), \
                patch("routes.ai.compare_countries", new_callable=AsyncMock) as service:
            service.return_value = expected["comparison"]
            response = self.client.post("/api/compare", json={"country_a": "IND", "country_b": "USA"})
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json(), expected)
        self.assertEqual(service.call_args.args, (india, usa))

    def test_unknown_cached_country_does_not_call_ai(self):
        with patch("routes.ai.data_store.get_country", side_effect=[fixture("sample_country.json"), None]), \
                patch("routes.ai.compare_countries", new_callable=AsyncMock) as service:
            response = self.client.post("/api/compare", json={"country_a": "IND", "country_b": "ZZZ"})
        self.assertEqual(response.status_code, 404)
        service.assert_not_called()


class ComparisonService(unittest.IsolatedAsyncioTestCase):
    async def asyncSetUp(self):
        self.a = fixture("sample_country.json")
        self.b = fixture("sample_country_usa.json")
        env = patch.dict(os.environ, {"IFM_API_KEY": "offline-test", "IFM_MODEL": "test/model"})
        env.start()
        self.addCleanup(env.stop)

    async def test_both_records_and_summary_regression(self):
        requests = []
        def handler(request):
            requests.append(json.loads(request.content))
            return httpx.Response(200, json={"choices": [{"message": {"content": " Example "}, "finish_reason": "stop"}]})
        async with httpx.AsyncClient(transport=httpx.MockTransport(handler)) as client:
            self.assertEqual(await compare_countries(self.a, self.b, client=client), "Example")
            self.assertEqual(await summarize_country(self.a, client=client), "Example")
        self.assertEqual(json.loads(requests[0]["messages"][1]["content"]), {"country_a": self.a, "country_b": self.b})
        self.assertNotIn("max_tokens", requests[0])
        self.assertNotIn("max_tokens", requests[1])
        self.assertEqual(requests[0]["temperature"], 1.0)
        self.assertEqual(requests[0]["top_p"], 0.95)
        self.assertEqual(requests[0]["chat_template_kwargs"]["reasoning_effort"], "high")
        self.assertIn("different dates or units", requests[0]["messages"][0]["content"])

    async def test_failures_and_truncation(self):
        for status, body in [(429, {}), (500, {}), (200, {}),
                             (200, {"choices": [{"message": {"content": "partial"}, "finish_reason": "length"}]})]:
            with self.subTest(status=status, body=body):
                async with httpx.AsyncClient(transport=httpx.MockTransport(lambda req: httpx.Response(status, json=body))) as client:
                    with self.assertRaises(AIServiceError):
                        await compare_countries(self.a, self.b, client=client)

    async def test_duplicate_rejected_before_request(self):
        with self.assertRaises(ValueError):
            await compare_countries(self.a, self.a)

    async def test_timeout(self):
        def handler(request):
            raise httpx.ReadTimeout("offline", request=request)
        async with httpx.AsyncClient(transport=httpx.MockTransport(handler)) as client:
            with self.assertRaises(AIServiceError):
                await compare_countries(self.a, self.b, client=client)
