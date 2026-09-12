"""Offline endpoint tests. Run from backend: python -m unittest discover -s tests."""

import json
from pathlib import Path
import unittest
from unittest.mock import AsyncMock, patch

from fastapi import FastAPI
from fastapi.testclient import TestClient
from main import app as main_app
from routes.ai import router
from services.ai import AIServiceError


class SummaryRouteTests(unittest.TestCase):
    def setUp(self):
        app = FastAPI()
        app.include_router(router)
        self.client = TestClient(app)
        self.country = json.loads(
            (Path(__file__).parent / "fixtures/sample_country.json").read_text(encoding="utf-8")
        )

    def test_summary_preserves_mock_label_and_missing_metric(self):
        with patch("routes.ai.summarize_country", new_callable=AsyncMock) as service, \
                patch("routes.ai.ai_cache.save_summary") as save_summary:
            service.return_value = "Fictional test values for India."
            response = self.client.post("/api/summarize/IND", json=self.country)
            self.assertEqual(response.status_code, 200)
            self.assertTrue(response.json()["is_mock"])
            self.assertEqual(response.json()["summary"], service.return_value)
            self.assertFalse(response.json()["is_cached"])
            self.assertIsNone(service.call_args.args[0]["metrics"]["bond_yield_10y"]["value"])
            save_summary.assert_called_once_with(service.call_args.args[0], service.return_value)

    def test_mismatch_does_not_call_ai(self):
        with patch("routes.ai.summarize_country", new_callable=AsyncMock) as service:
            response = self.client.post("/api/summarize/USA", json=self.country)
            self.assertEqual(response.status_code, 422)
            service.assert_not_called()

    def test_invalid_body_does_not_call_ai(self):
        with patch("routes.ai.summarize_country", new_callable=AsyncMock) as service:
            for body in ({}, {**self.country, "metrics": {}}, {**self.country, "country_code": "invalid"}):
                with self.subTest(body=body):
                    self.assertEqual(self.client.post("/api/summarize/IND", json=body).status_code, 422)
            service.assert_not_called()

    def test_provider_error_is_safe(self):
        with patch("routes.ai.summarize_country", new_callable=AsyncMock) as service, \
                patch("routes.ai.ai_cache.get_summary", return_value=None):
            service.side_effect = AIServiceError("Private configuration detail")
            response = self.client.post("/api/summarize/IND", json=self.country)
            self.assertEqual(response.status_code, 503)
            self.assertNotIn("Private", response.text)

    def test_provider_error_can_fall_back_to_cached_summary(self):
        cached = {
            "country_code": "IND",
            "country_name": "India",
            "summary": "Saved demo summary.",
            "is_mock": False,
        }
        with patch("routes.ai.summarize_country", new_callable=AsyncMock) as service, \
                patch("routes.ai.ai_cache.get_summary", return_value=cached):
            service.side_effect = AIServiceError("Provider down")
            response = self.client.post("/api/summarize/IND", json=self.country)
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()["summary"], "Saved demo summary.")
        self.assertTrue(response.json()["is_cached"])
        self.assertFalse(response.json()["is_mock"])

    def test_summary_can_load_country_from_cache(self):
        cached = {**self.country, "is_mock": False}
        with patch("routes.ai.data_store.get_country", return_value=cached), \
                patch("routes.ai.summarize_country", new_callable=AsyncMock) as service, \
                patch("routes.ai.ai_cache.save_summary"):
            service.return_value = "Cached India summary."
            response = self.client.post("/api/summarize/IND")
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()["summary"], "Cached India summary.")
        self.assertFalse(response.json()["is_mock"])
        self.assertEqual(service.call_args.args[0], cached)

    def test_summary_unknown_cached_country_does_not_call_ai(self):
        with patch("routes.ai.data_store.get_country", return_value=None), \
                patch("routes.ai.summarize_country", new_callable=AsyncMock) as service:
            response = self.client.post("/api/summarize/ZZZ")
        self.assertEqual(response.status_code, 404)
        service.assert_not_called()


class MainAppRegistrationTests(unittest.TestCase):
    def test_ai_routes_are_registered_on_main_app(self):
        paths = main_app.openapi()["paths"]
        self.assertIn("/api/summarize/{country_code}", paths)
        self.assertIn("/api/compare", paths)
        self.assertIn("/api/chat/{country_code}", paths)

    def test_summary_works_through_main_app(self):
        client = TestClient(main_app)
        with patch("routes.ai.summarize_country", new_callable=AsyncMock) as service, \
                patch("routes.ai.ai_cache.save_summary"):
            service.return_value = "Fictional test values for India."
            response = client.post("/api/summarize/IND")
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()["summary"], "Fictional test values for India.")


if __name__ == "__main__":
    unittest.main()
