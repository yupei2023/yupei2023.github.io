import importlib.util
import unittest
from datetime import date
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
SPEC = importlib.util.spec_from_file_location("update_pulse", ROOT / "scripts" / "update_pulse.py")
PULSE = importlib.util.module_from_spec(SPEC)
SPEC.loader.exec_module(PULSE)


class PulseTests(unittest.TestCase):
    def setUp(self):
        self.topics = PULSE.load_json(PULSE.TOPICS_PATH)
        journals = PULSE.load_json(PULSE.JOURNALS_PATH)
        self.by_issn, self.by_name = PULSE.journal_maps(journals)

    def work(self, number, theme_phrase="virtual reality", issn="0360-1315", journal_name="Computers & Education"):
        return {
            "id": f"https://openalex.org/W{number}",
            "doi": f"https://doi.org/10.0000/test.{number}",
            "title": f"{theme_phrase.title()} for Learning Study {number}",
            "publication_date": "2026-08-14",
            "type": "article",
            "is_retracted": False,
            "authorships": [{"author": {"display_name": f"Researcher {number}"}}],
            "abstract_inverted_index": {"education": [0], "learning": [1], "students": [2]},
            "topics": [{"display_name": "Educational technology"}],
            "primary_location": {
                "landing_page_url": f"https://doi.org/10.0000/test.{number}",
                "source": {"display_name": journal_name, "issn_l": issn, "issn": [issn], "is_core": True}
            },
            "open_access": {"is_oa": number % 2 == 0, "any_repository_has_fulltext": number % 2 == 0},
            "best_oa_location": {"landing_page_url": f"https://example.org/article/{number}"} if number % 2 == 0 else None
        }

    def test_retracted_work_is_rejected(self):
        work = self.work(1)
        work["is_retracted"] = True
        article = PULSE.article_from_work(work, self.topics["themes"], {"immersive-learning"}, self.by_issn, self.by_name, date(2026, 8, 16))
        self.assertIsNone(article)

    def test_priority_journal_and_access_are_labeled(self):
        article = PULSE.article_from_work(self.work(2), self.topics["themes"], {"immersive-learning"}, self.by_issn, self.by_name, date(2026, 8, 16))
        self.assertEqual(article["priority_tier"], 1)
        self.assertEqual(article["access"], "Open access")
        self.assertEqual(article["theme_id"], "immersive-learning")

    def test_selection_is_unique_and_limited(self):
        candidates = []
        phrases = ["virtual reality", "ai literacy", "learner agency", "stem education", "learning design"]
        for number in range(15):
            work = self.work(number + 1, phrases[number % len(phrases)], issn=f"9999-{number:04d}", journal_name=f"Test Journal {number}")
            article = PULSE.article_from_work(work, self.topics["themes"], set(), self.by_issn, self.by_name, date(2026, 8, 16))
            if article:
                candidates.append(article)
        selected = PULSE.select_articles(candidates, self.topics)
        self.assertEqual(len(selected), 10)
        self.assertEqual(len({item["id"] for item in selected}), 10)
        self.assertLessEqual(max(__import__("collections").Counter(item["theme_id"] for item in selected).values()), 3)


if __name__ == "__main__":
    unittest.main()
