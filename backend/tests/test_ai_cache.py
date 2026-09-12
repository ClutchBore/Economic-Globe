"""Offline checks for saved AI summary fallbacks."""

import unittest
from unittest.mock import patch

from services import ai_cache


class FakeKV:
    """In-memory stand-in for services.kv_client, so tests touch no network."""

    def __init__(self):
        self.store = {}

    def summary_key(self, code: str) -> str:
        return f"ai_summary:{code.upper()}"

    def get_json(self, key):
        return self.store.get(key)

    def set_json(self, key, value):
        self.store[key] = value


class AISummaryCacheTests(unittest.TestCase):
    def setUp(self):
        self.kv = FakeKV()

    def test_save_and_read_summary(self):
        country = {"country_code": "IND", "country_name": "India", "is_mock": False, "data_as_of": "2026-09-11"}
        with patch.object(ai_cache, "kv_client", self.kv):
            saved = ai_cache.save_summary(country, "A saved summary.")
            loaded = ai_cache.get_summary("ind")
        self.assertEqual(saved["country_code"], "IND")
        self.assertEqual(loaded["summary"], "A saved summary.")
        self.assertFalse(loaded["is_mock"])
        self.assertEqual(loaded["data_as_of"], "2026-09-11")

    def test_missing_or_invalid_cache_returns_none(self):
        with patch.object(ai_cache, "kv_client", self.kv):
            self.assertIsNone(ai_cache.get_summary("USA"))
            self.kv.store["ai_summary:USA"] = "not-a-record"
            self.assertIsNone(ai_cache.get_summary("USA"))

    def test_unreachable_kv_returns_none(self):
        boom = FakeKV()
        boom.get_json = lambda key: (_ for _ in ()).throw(RuntimeError("KV down"))
        with patch.object(ai_cache, "kv_client", boom):
            self.assertIsNone(ai_cache.get_summary("USA"))


if __name__ == "__main__":
    unittest.main()
