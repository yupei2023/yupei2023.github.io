#!/usr/bin/env python3
"""Validate the generated Pulse data and rendered page."""

import json
import re
from datetime import date
from html.parser import HTMLParser
from pathlib import Path
from urllib.parse import urlparse

ROOT = Path(__file__).resolve().parents[1]
DATA_PATH = ROOT / "data" / "pulse.json"
PAGE_PATH = ROOT / "pulse" / "index.html"


class PulseParser(HTMLParser):
    def __init__(self):
        super().__init__()
        self.article_count = 0
        self.beacon_count = 0

    def handle_starttag(self, tag, attrs):
        values = dict(attrs)
        classes = values.get("class", "").split()
        if tag == "article" and "pulse-article" in classes:
            self.article_count += 1
        if tag == "script" and "cloudflareinsights.com/beacon.min.js" in values.get("src", ""):
            self.beacon_count += 1


def main():
    payload = json.loads(DATA_PATH.read_text(encoding="utf-8"))
    articles = payload.get("articles", [])
    if payload.get("schema_version") != 1:
        raise SystemExit("Unsupported Pulse schema version")
    if payload.get("article_count") != 10 or len(articles) != 10:
        raise SystemExit("Pulse must contain exactly 10 articles")
    ids = [article.get("id") for article in articles]
    if not all(ids) or len(ids) != len(set(ids)):
        raise SystemExit("Pulse article IDs must be present and unique")
    for article in articles:
        if not article.get("title") or not article.get("journal") or not article.get("theme"):
            raise SystemExit("Pulse article metadata is incomplete")
        if date.fromisoformat(article["publication_date"]) > date.today():
            raise SystemExit("Pulse includes a future publication date")
        parsed = urlparse(article["url"])
        if parsed.scheme not in {"http", "https"} or not parsed.netloc:
            raise SystemExit("Pulse includes an unsafe article URL")

    page = PAGE_PATH.read_text(encoding="utf-8")
    parser = PulseParser()
    parser.feed(page)
    if parser.article_count != 10:
        raise SystemExit(f"Rendered Pulse page contains {parser.article_count} article cards")
    if parser.beacon_count != 1:
        raise SystemExit("Rendered Pulse page must contain one analytics beacon")
    if len(re.findall(r'<!-- PULSE_FEED_(?:START|END) -->', page)) != 2:
        raise SystemExit("Pulse feed markers are invalid")
    print("Pulse data and rendered page validation passed.")


if __name__ == "__main__":
    main()
