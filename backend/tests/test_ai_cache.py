"""Offline checks for saved AI summary fallbacks."""

import unittest
from pathlib import Path
from unittest.mock import patch

from services import ai_cache

TEMP_CACHE = Path(__file__).parent / ".tmp_ai_cache"


class AISummaryCacheTests(unittest.TestCase):
    def setUp(self):
        TEMP_CACHE.mkdir(exist_ok=True)
        for path in TEMP_CACHE.glob("*"):
            path.unlink()

    def tearDown(self):
        for path in TEMP_CACHE.glob("*"):
            path.unlink()
        TEMP_CACHE.rmdir()

    def test_save_and_read_summary(self):
        country = {"country_code": "IND", "country_name": "India", "is_mock": False, "data_as_of": "2026-09-11"}
        with patch.object(ai_cache, "AI_CACHE_DIR", TEMP_CACHE):
            saved = ai_cache.save_summary(country, "A saved summary.")
            loaded = ai_cache.get_summary("ind")
        self.assertEqual(saved["country_code"], "IND")
        self.assertEqual(loaded["summary"], "A saved summary.")
        self.assertFalse(loaded["is_mock"])
        self.assertEqual(loaded["data_as_of"], "2026-09-11")

    def test_missing_or_invalid_cache_returns_none(self):
        with patch.object(ai_cache, "AI_CACHE_DIR", TEMP_CACHE):
            self.assertIsNone(ai_cache.get_summary("USA"))
            (TEMP_CACHE / "USA_summary.json").write_text("not-json", encoding="utf-8")
            self.assertIsNone(ai_cache.get_summary("USA"))


if __name__ == "__main__":
    unittest.main()
