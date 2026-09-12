"""Offline endpoint tests. Run from backend: python -m unittest discover -s tests."""

import json
from pathlib import Path
import unittest
from unittest.mock import AsyncMock, patch

from fastapi import FastAPI
from fastapi.testclient import TestClient
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
        with patch("routes.ai.summarize_country", new_callable=AsyncMock) as service:
            service.return_value = "Fictional test values for India."
            response = self.client.post("/api/summarize/IND", json=self.country)
            self.assertEqual(response.status_code, 200)
            self.assertTrue(response.json()["is_mock"])
            self.assertEqual(response.json()["summary"], service.return_value)
            self.assertIsNone(service.call_args.args[0]["metrics"]["bond_yield_10y"]["value"])

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
        with patch("routes.ai.summarize_country", new_callable=AsyncMock) as service:
            service.side_effect = AIServiceError("Private configuration detail")
            response = self.client.post("/api/summarize/IND", json=self.country)
            self.assertEqual(response.status_code, 503)
            self.assertNotIn("Private", response.text)


if __name__ == "__main__":
    unittest.main()
