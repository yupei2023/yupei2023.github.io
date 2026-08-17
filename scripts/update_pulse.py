#!/usr/bin/env python3
"""Collect, rank, validate, and render the weekly Pulse article feed."""

from __future__ import annotations

import argparse
import html
import json
import os
import re
import sys
import time
import urllib.error
import urllib.parse
import urllib.request
from collections import Counter
from datetime import date, datetime, timedelta, timezone
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
TOPICS_PATH = ROOT / "config" / "pulse-topics.json"
JOURNALS_PATH = ROOT / "config" / "pulse-journals.json"
DATA_PATH = ROOT / "data" / "pulse.json"
PAGE_PATH = ROOT / "pulse" / "index.html"
API_URL = "https://api.openalex.org/works"
START_MARKER = "    <!-- PULSE_FEED_START -->"
END_MARKER = "    <!-- PULSE_FEED_END -->"
ALLOWED_TYPES = {"article", "review"}


def load_json(path: Path):
    return json.loads(path.read_text(encoding="utf-8"))


def normalized(value: str | None) -> str:
    return re.sub(r"[^a-z0-9]+", " ", (value or "").lower()).strip()


def reconstruct_abstract(inverted: dict | None) -> str:
    if not inverted:
        return ""
    positions = []
    for word, indexes in inverted.items():
        positions.extend((index, word) for index in indexes)
    return " ".join(word for _, word in sorted(positions))


def request_openalex(params: dict, api_key: str, attempts: int = 3) -> list[dict]:
    query = dict(params)
    query["api_key"] = api_key
    url = f"{API_URL}?{urllib.parse.urlencode(query)}"
    headers = {
        "Accept": "application/json",
        "User-Agent": "YupeiDuan-Pulse/1.0 (https://yupei2023.github.io/pulse/)"
    }
    for attempt in range(attempts):
        try:
            with urllib.request.urlopen(urllib.request.Request(url, headers=headers), timeout=35) as response:
                payload = json.load(response)
                return payload.get("results", [])
        except (urllib.error.URLError, urllib.error.HTTPError, TimeoutError, json.JSONDecodeError) as error:
            if attempt == attempts - 1:
                raise RuntimeError(f"OpenAlex request failed after {attempts} attempts: {error}") from error
            time.sleep(2 ** attempt)
    return []


def journal_maps(config: dict):
    by_issn, by_name = {}, {}
    for group in config["tiers"]:
        for journal in group["journals"]:
            record = {**journal, "tier": group["tier"]}
            by_issn[journal["issn_l"].upper()] = record
            by_name[normalized(journal["name"])] = record
    return by_issn, by_name


def source_record(work: dict) -> dict:
    return (work.get("primary_location") or {}).get("source") or {}


def match_journal(work: dict, by_issn: dict, by_name: dict) -> dict | None:
    source = source_record(work)
    issns = [source.get("issn_l"), *(source.get("issn") or [])]
    for issn in filter(None, issns):
        if issn.upper() in by_issn:
            return by_issn[issn.upper()]
    return by_name.get(normalized(source.get("display_name")))


def theme_scores(work: dict, themes: list[dict], origins: set[str]) -> dict[str, int]:
    title = normalized(work.get("title") or work.get("display_name"))
    abstract = normalized(reconstruct_abstract(work.get("abstract_inverted_index")))
    topic_text = normalized(" ".join(topic.get("display_name", "") for topic in work.get("topics") or []))
    corpus = f"{title} {abstract} {topic_text}"
    scores = {}
    for theme in themes:
        score = 4 if theme["id"] in origins else 0
        for phrase in theme["phrases"]:
            term = normalized(phrase)
            if term in title:
                score += 12
            elif term in corpus:
                score += 7
        for keyword in theme["keywords"]:
            term = normalized(keyword)
            if re.search(rf"\b{re.escape(term)}\b", title):
                score += 5
            elif re.search(rf"\b{re.escape(term)}\b", corpus):
                score += 2
        scores[theme["id"]] = score
    return scores


def stable_id(work: dict) -> str:
    doi = (work.get("doi") or "").lower().removeprefix("https://doi.org/")
    return doi or work.get("id", "")


def authors_for(work: dict) -> list[str]:
    names = []
    for authorship in work.get("authorships") or []:
        name = (authorship.get("author") or {}).get("display_name")
        if name:
            names.append(name)
    return names


def article_url(work: dict) -> tuple[str, str]:
    access = work.get("open_access") or {}
    oa_location = work.get("best_oa_location") or {}
    if access.get("is_oa") and oa_location.get("landing_page_url"):
        return oa_location["landing_page_url"], "Open access"
    if access.get("any_repository_has_fulltext") and oa_location.get("landing_page_url"):
        return oa_location["landing_page_url"], "Repository copy"
    doi = work.get("doi")
    if doi:
        return doi if doi.startswith("http") else f"https://doi.org/{doi}", "Publisher page"
    landing = (work.get("primary_location") or {}).get("landing_page_url")
    return landing or work.get("id", ""), "Scholarly record"


def article_from_work(work: dict, themes: list[dict], origins: set[str], by_issn: dict, by_name: dict, today: date) -> dict | None:
    if work.get("is_retracted") or work.get("type") not in ALLOWED_TYPES:
        return None
    title = (work.get("title") or work.get("display_name") or "").strip()
    published_raw = work.get("publication_date")
    if not title or not published_raw:
        return None
    try:
        published = date.fromisoformat(published_raw)
    except ValueError:
        return None
    if published > today:
        return None

    scores = theme_scores(work, themes, origins)
    theme = max(themes, key=lambda item: scores[item["id"]])
    relevance = scores[theme["id"]]
    if relevance < 7:
        return None

    journal = match_journal(work, by_issn, by_name)
    source = source_record(work)
    tier = journal["tier"] if journal else None
    journal_points = {1: 25, 2: 18, 3: 12}.get(tier, 0)
    source_points = 4 if source.get("is_core") else 0
    age = max(0, (today - published).days)
    recency_points = max(0, 25 - round(age * 25 / 45))
    authors = authors_for(work)
    url, access_label = article_url(work)
    if not url.startswith(("https://", "http://")):
        return None
    completeness = sum(bool(value) for value in (authors, source.get("display_name"), work.get("doi"))) * 2
    oa_points = 2 if access_label in {"Open access", "Repository copy"} else 0
    total = relevance + journal_points + source_points + recency_points + completeness + oa_points

    return {
        "id": stable_id(work),
        "title": title,
        "authors": authors,
        "journal": source.get("display_name") or "Scholarly source",
        "issn_l": source.get("issn_l"),
        "publication_date": published.isoformat(),
        "doi": work.get("doi"),
        "url": url,
        "access": access_label,
        "theme_id": theme["id"],
        "theme": theme["label"],
        "priority_tier": tier,
        "score": total,
        "reason": f"Selected for its connection to {theme['label'].lower()}" + (f" and publication in a priority journal" if tier else "") + "."
    }


def select_articles(candidates: list[dict], config: dict) -> list[dict]:
    best = {}
    for article in candidates:
        if article["id"] and (article["id"] not in best or article["score"] > best[article["id"]]["score"]):
            best[article["id"]] = article
    ranked = sorted(best.values(), key=lambda item: (-item["score"], item["publication_date"], item["title"]))
    selected, theme_counts, journal_counts = [], Counter(), Counter()

    def add(article):
        journal_key = normalized(article["journal"])
        if theme_counts[article["theme_id"]] >= config["maximum_per_theme"]:
            return False
        if journal_counts[journal_key] >= config["maximum_per_journal"]:
            return False
        selected.append(article)
        theme_counts[article["theme_id"]] += 1
        journal_counts[journal_key] += 1
        return True

    priority_target = config["minimum_priority_journal_articles"]
    for article in (item for item in ranked if item["priority_tier"]):
        if sum(bool(item["priority_tier"]) for item in selected) >= priority_target:
            break
        add(article)
    for article in ranked:
        if len(selected) >= config["article_count"]:
            break
        if article not in selected:
            add(article)
    return selected


def author_line(authors: list[str]) -> str:
    if not authors:
        return "Author information unavailable"
    return ", ".join(authors[:5]) + (", et al." if len(authors) > 5 else "")


def render_feed(articles: list[dict], refreshed: date) -> str:
    cards = []
    for index, article in enumerate(articles, 1):
        published = date.fromisoformat(article["publication_date"]).strftime("%B %-d, %Y")
        tier_label = f"Priority journal · Tier {article['priority_tier']}" if article["priority_tier"] else "Field discovery"
        cards.append(f'''        <article class="pulse-article">
          <div class="pulse-article__number" aria-hidden="true">{index:02d}</div>
          <div class="pulse-article__body">
            <div class="pulse-article__labels"><span>{html.escape(article['theme'])}</span><span>{html.escape(article['access'])}</span></div>
            <h3><a href="{html.escape(article['url'], quote=True)}">{html.escape(article['title'])}</a></h3>
            <p class="pulse-article__authors">{html.escape(author_line(article['authors']))}</p>
            <p class="pulse-article__venue"><strong>{html.escape(article['journal'])}</strong> · {published}</p>
            <p class="pulse-article__reason">{html.escape(article['reason'])}</p>
          </div>
          <div class="pulse-article__source"><span>{html.escape(tier_label)}</span><a href="{html.escape(article['url'], quote=True)}" aria-label="Open {html.escape(article['title'], quote=True)}">View article <i aria-hidden="true">↗</i></a></div>
        </article>''')
    refreshed_label = refreshed.strftime("%B %-d, %Y")
    return f'''{START_MARKER}
    <section class="pulse-feed" aria-labelledby="pulse-feed-title">
      <div class="pulse-feed__heading">
        <div><p class="kicker">Latest edition · {refreshed_label}</p><h2 id="pulse-feed-title">Ten signals from the research landscape.</h2></div>
        <p>Ranked for relevance, recency, journal priority, and record quality. Access labels distinguish freely available versions from publisher pages.</p>
      </div>
      <div class="pulse-article-list">
{chr(10).join(cards)}
      </div>
    </section>
{END_MARKER}'''


def validate(articles: list[dict], config: dict, today: date):
    expected = config["article_count"]
    if len(articles) != expected:
        raise ValueError(f"Expected {expected} articles, selected {len(articles)}; previous edition preserved.")
    ids = [item["id"] for item in articles]
    if len(ids) != len(set(ids)):
        raise ValueError("Duplicate Pulse article identifiers detected.")
    for article in articles:
        if date.fromisoformat(article["publication_date"]) > today:
            raise ValueError(f"Future publication date: {article['title']}")
        if not article["url"].startswith(("https://", "http://")):
            raise ValueError(f"Unsafe URL: {article['url']}")


def collect(api_key: str, topics: dict, journals: dict, today: date) -> list[dict]:
    start = today - timedelta(days=topics["window_days"])
    common_filter = f"from_publication_date:{start.isoformat()},to_publication_date:{today.isoformat()},type:article|review"
    raw, origins = {}, {}
    for theme in topics["themes"]:
        for query in theme["queries"]:
            for work in request_openalex({"search": query, "filter": common_filter, "sort": "publication_date:desc", "per_page": 50}, api_key):
                key = stable_id(work)
                if key:
                    raw[key] = work
                    origins.setdefault(key, set()).add(theme["id"])

    issns = [journal["issn_l"] for group in journals["tiers"] for journal in group["journals"]]
    for offset in range(0, len(issns), 10):
        source_filter = "|".join(issns[offset:offset + 10])
        params = {"filter": f"{common_filter},primary_location.source.issn:{source_filter}", "sort": "publication_date:desc", "per_page": 100}
        for work in request_openalex(params, api_key):
            key = stable_id(work)
            if key:
                raw[key] = work
                origins.setdefault(key, set())

    by_issn, by_name = journal_maps(journals)
    candidates = []
    for key, work in raw.items():
        article = article_from_work(work, topics["themes"], origins.get(key, set()), by_issn, by_name, today)
        if article:
            candidates.append(article)
    return candidates


def write_outputs(articles: list[dict], topics: dict, today: date):
    payload = {
        "schema_version": 1,
        "refreshed_at": datetime.now(timezone.utc).replace(microsecond=0).isoformat(),
        "selection_window_days": topics["window_days"],
        "article_count": len(articles),
        "articles": articles
    }
    current_page = PAGE_PATH.read_text(encoding="utf-8")
    if START_MARKER not in current_page or END_MARKER not in current_page:
        raise ValueError("Pulse feed markers are missing from pulse/index.html")
    before, remainder = current_page.split(START_MARKER, 1)
    _, after = remainder.split(END_MARKER, 1)
    rendered = render_feed(articles, today)
    PAGE_PATH.write_text(before + rendered + after, encoding="utf-8")
    DATA_PATH.write_text(json.dumps(payload, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--date", help="Override collection date (YYYY-MM-DD) for testing")
    parser.add_argument("--input", type=Path, help="Use an OpenAlex result fixture instead of the network")
    args = parser.parse_args()
    today = date.fromisoformat(args.date) if args.date else datetime.now(timezone.utc).date()
    topics, journals = load_json(TOPICS_PATH), load_json(JOURNALS_PATH)
    by_issn, by_name = journal_maps(journals)

    if args.input:
        fixture = load_json(args.input)
        candidates = [
            article for work in fixture["results"]
            if (article := article_from_work(work, topics["themes"], set(), by_issn, by_name, today))
        ]
    else:
        api_key = os.environ.get("OPENALEX_API_KEY", "").strip()
        if not api_key:
            print("OPENALEX_API_KEY is required", file=sys.stderr)
            return 2
        candidates = collect(api_key, topics, journals, today)

    selected = select_articles(candidates, topics)
    validate(selected, topics, today)
    write_outputs(selected, topics, today)
    print(f"Pulse updated with {len(selected)} articles from {len(candidates)} eligible candidates.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
