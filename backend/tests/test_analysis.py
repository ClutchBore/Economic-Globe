"""Offline tests for rankings and analysis routes."""

import unittest
from unittest.mock import patch

from fastapi import FastAPI
from fastapi.testclient import TestClient
from main import app as main_app
from routes.analysis import router
from services.ai import AIServiceError
from services.analysis import AnalysisError, detect_anomalies, rank_countries


COUNTRIES = [
    {"country_code": "AAA", "country_name": "Alpha", "gdp": 10, "inflation": None,
     "units": {"gdp": "USD", "inflation": "%"}, "dates": {"gdp": "2025", "inflation": None}},
    {"country_code": "BBB", "country_name": "Beta", "gdp": 20, "inflation": 3,
     "units": {"gdp": "USD", "inflation": "%"}, "dates": {"gdp": "2025", "inflation": "2024"}},
    {"country_code": "CCC", "country_name": "Gamma", "gdp": None, "inflation": 6,
     "units": {"gdp": "USD", "inflation": "%"}, "dates": {"gdp": None, "inflation": "2024"}},
]

ANOMALY_COUNTRIES = [
    {
        "country_code": "AAA",
        "country_name": "Alpha",
        "inflation": 30,
        "units": {"inflation": "%"},
        "dates": {"inflation": "2025"},
        "history": {"inflation": [
            {"year": "2020", "value": 2},
            {"year": "2021", "value": 2.1},
            {"year": "2022", "value": 1.9},
            {"year": "2023", "value": 2.0},
            {"year": "2024", "value": 2.2},
            {"year": "2025", "value": 30},
        ]},
    },
    {
        "country_code": "BBB",
        "country_name": "Beta",
        "inflation": 2,
        "units": {"inflation": "%"},
        "dates": {"inflation": "2025"},
        "history": {"inflation": [
            {"year": "2020", "value": 2},
            {"year": "2021", "value": 2},
            {"year": "2022", "value": 2},
            {"year": "2023", "value": 2},
            {"year": "2024", "value": 2},
            {"year": "2025", "value": 2},
        ]},
    },
    {
        "country_code": "CCC",
        "country_name": "Gamma",
        "inflation": 4,
        "units": {"inflation": "%"},
        "dates": {"inflation": "2025"},
        "history": {"inflation": [{"year": "2025", "value": 4}]},
    },
]

EXPLANATION_BODY = {
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
    "threshold": 2.0,
    "method": "latest value compared with prior observations using population standard deviation",
    "prior_observations": 6,
}


def fake_list():
    return [{"country_code": item["country_code"]} for item in COUNTRIES]


def fake_get(code):
    return next((item for item in COUNTRIES if item["country_code"] == code), None)


class RankingServiceTests(unittest.TestCase):
    def test_rankings_sort_desc_and_skip_nulls(self):
        with patch("services.analysis.data_store.list_countries", fake_list), \
                patch("services.analysis.data_store.get_country", fake_get):
            result = rank_countries("gdp")
        self.assertEqual([row["country_code"] for row in result["rankings"]], ["BBB", "AAA"])
        self.assertEqual([row["rank"] for row in result["rankings"]], [1, 2])
        self.assertEqual(result["unit"], "USD")
        self.assertEqual(result["date"], "2025")
        self.assertEqual(result["skipped"], ["CCC"])
        self.assertIn("not always better", result["note"])

    def test_mixed_dates_are_not_collapsed(self):
        mixed = [
            {**COUNTRIES[0], "inflation": 2, "dates": {"inflation": "2023"}},
            COUNTRIES[1],
        ]
        with patch("services.analysis.data_store.list_countries",
                   lambda: [{"country_code": item["country_code"]} for item in mixed]), \
                patch("services.analysis.data_store.get_country",
                      lambda code: next((item for item in mixed if item["country_code"] == code), None)):
            result = rank_countries("inflation")
        self.assertIsNone(result["date"])
        self.assertEqual(result["unit"], "%")

    def test_unsupported_or_empty_metric(self):
        with self.assertRaises(AnalysisError):
            rank_countries("unknown")
        with patch("services.analysis.data_store.list_countries", fake_list), \
                patch("services.analysis.data_store.get_country", fake_get), \
                self.assertRaises(AnalysisError):
            rank_countries("bond_yield_10y")


class AnomalyServiceTests(unittest.TestCase):
    def test_detects_obvious_latest_outlier(self):
        with patch("services.analysis.data_store.list_countries",
                   lambda: [{"country_code": item["country_code"]} for item in ANOMALY_COUNTRIES]), \
                patch("services.analysis.data_store.get_country",
                      lambda code: next((item for item in ANOMALY_COUNTRIES if item["country_code"] == code), None)):
            result = detect_anomalies("inflation", threshold=2.0, min_prior=5)
        self.assertEqual(result["metric"], "inflation")
        self.assertEqual(result["unit"], "%")
        self.assertEqual([item["country_code"] for item in result["anomalies"]], ["AAA"])
        self.assertEqual(result["anomalies"][0]["direction"], "above")
        self.assertGreater(result["anomalies"][0]["z_score"], 2)
        reasons = {item["country_code"]: item["reason"] for item in result["skipped"]}
        self.assertEqual(reasons["BBB"], "zero_variation")
        self.assertEqual(reasons["CCC"], "insufficient_history")

    def test_anomaly_rejects_bad_inputs(self):
        with self.assertRaises(AnalysisError):
            detect_anomalies("unknown")
        with self.assertRaises(AnalysisError):
            detect_anomalies("inflation", threshold=0)
        with self.assertRaises(AnalysisError):
            detect_anomalies("inflation", min_prior=1)


class RankingRouteTests(unittest.TestCase):
    def setUp(self):
        app = FastAPI()
        app.include_router(router)
        self.client = TestClient(app)

    def test_route_returns_rankings(self):
        with patch("routes.analysis.rank_countries", return_value={"metric": "gdp", "rankings": []}):
            response = self.client.get("/api/rankings/gdp")
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()["metric"], "gdp")

    def test_route_rejects_bad_metric(self):
        with patch("routes.analysis.rank_countries", side_effect=AnalysisError("bad metric")):
            response = self.client.get("/api/rankings/bad")
        self.assertEqual(response.status_code, 422)
        self.assertIn("bad metric", response.text)

    def test_anomaly_route_returns_results(self):
        with patch("routes.analysis.detect_anomalies", return_value={"metric": "inflation", "anomalies": []}):
            response = self.client.get("/api/anomalies/inflation?threshold=2&min_prior=5")
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()["metric"], "inflation")

    def test_anomaly_route_rejects_bad_input(self):
        with patch("routes.analysis.detect_anomalies", side_effect=AnalysisError("bad anomaly")):
            response = self.client.get("/api/anomalies/bad")
        self.assertEqual(response.status_code, 422)
        self.assertIn("bad anomaly", response.text)

    def test_explain_route_uses_ai(self):
        with patch("routes.analysis.explain_anomaly", return_value="AI explanation.") as service:
            response = self.client.post("/api/anomaly/explain", json=EXPLANATION_BODY)
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json(), {"explanation": "AI explanation.", "is_fallback": False})
        self.assertEqual(service.call_args.args[0]["country_code"], "ARG")

    def test_explain_route_falls_back_when_ai_fails(self):
        with patch("routes.analysis.explain_anomaly", side_effect=AIServiceError("private")):
            response = self.client.post("/api/anomaly/explain", json=EXPLANATION_BODY)
        self.assertEqual(response.status_code, 200)
        body = response.json()
        self.assertTrue(body["is_fallback"])
        self.assertIn("statistical flag", body["explanation"])
        self.assertNotIn("private", body["explanation"])

    def test_explain_route_rejects_invalid_direction(self):
        response = self.client.post("/api/anomaly/explain", json={**EXPLANATION_BODY, "direction": "sideways"})
        self.assertEqual(response.status_code, 422)

    def test_main_app_registers_analysis_routes(self):
        paths = main_app.openapi()["paths"]
        self.assertIn("/api/rankings/{metric}", paths)
        self.assertIn("/api/anomalies/{metric}", paths)
        self.assertIn("/api/anomaly/explain", paths)


if __name__ == "__main__":
    unittest.main()
