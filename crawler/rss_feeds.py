#!/usr/bin/env python3
"""
RSS/Atom Feed Monitor — Event-driven updates
Fetches from RSS/Atom feeds and detects new entries since last check.

Sources:
- arXiv AI/ML papers (RSS)
- HuggingFace Daily Papers (community RSS)
- Product Hunt AI (RSS)
- Hacker News (API + RSS)
- TechCrunch AI (RSS)
- The Verge AI (RSS)
- GeekNews (scrape, no RSS)
"""

import json
import hashlib
import logging
import time
from datetime import datetime, timezone
from pathlib import Path
from xml.etree import ElementTree

import requests
from bs4 import BeautifulSoup

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")
logger = logging.getLogger(__name__)

PROJECT_ROOT = Path(__file__).parent.parent
DATA_DIR = PROJECT_ROOT / "data"
DOCS_DATA_DIR = PROJECT_ROOT / "docs" / "data"
FEEDS_FILE = DATA_DIR / "rss_feeds.json"
SEEN_FILE = DATA_DIR / ".seen_entries.json"

HEADERS = {
    "User-Agent": "AI-Agent-Trends/1.0 (RSS Monitor)"
}

# --- RSS/Atom Feed Definitions ---
FEED_SOURCES = [
    {
        "id": "arxiv-ai",
        "name": "arXiv AI",
        "url": "https://rss.arxiv.org/rss/cs.AI",
        "type": "rss",
        "category": "research",
        "icon": "📄",
    },
    {
        "id": "arxiv-ml",
        "name": "arXiv ML",
        "url": "https://rss.arxiv.org/rss/cs.LG",
        "type": "rss",
        "category": "research",
        "icon": "📄",
    },
    {
        "id": "hf-papers",
        "name": "HuggingFace Daily Papers",
        "url": "https://huggingface.co/api/daily_papers",
        "type": "json-api",
        "category": "research",
        "icon": "🤗",
    },
    {
        "id": "hn-ai",
        "name": "Hacker News AI",
        "url": "https://hn.algolia.com/api/v1/search_by_date?query=AI+agent+LLM&tags=story&hitsPerPage=30",
        "type": "json-api",
        "category": "news",
        "icon": "🟧",
    },
    {
        "id": "techcrunch-ai",
        "name": "TechCrunch AI",
        "url": "https://techcrunch.com/category/artificial-intelligence/feed/",
        "type": "rss",
        "category": "news",
        "icon": "📰",
    },
    {
        "id": "theverge-ai",
        "name": "The Verge AI",
        "url": "https://www.theverge.com/rss/ai-artificial-intelligence/index.xml",
        "type": "atom",
        "category": "news",
        "icon": "📰",
    },
    {
        "id": "ph-ai",
        "name": "Product Hunt AI",
        "url": "https://www.producthunt.com/feed?category=artificial-intelligence",
        "type": "rss",
        "category": "launches",
        "icon": "🚀",
    },
]


def load_seen():
    """Load previously seen entry IDs."""
    if SEEN_FILE.exists():
        return json.loads(SEEN_FILE.read_text())
    return {}


def save_seen(seen):
    SEEN_FILE.write_text(json.dumps(seen))


def save_json(filepath, data):
    content = json.dumps(data, ensure_ascii=False, indent=2)
    filepath.write_text(content)
    docs_path = DOCS_DATA_DIR / filepath.name
    if DOCS_DATA_DIR.exists():
        docs_path.write_text(content)


def parse_rss(xml_text, source):
    """Parse RSS 2.0 feed."""
    entries = []
    try:
        root = ElementTree.fromstring(xml_text)
        for item in root.findall(".//item")[:20]:
            title = item.findtext("title", "").strip()
            link = item.findtext("link", "").strip()
            desc = item.findtext("description", "")
            if desc:
                desc = BeautifulSoup(desc, "html.parser").get_text()[:200].strip()
            pub_date = item.findtext("pubDate", "")
            entry_id = hashlib.md5((link or title).encode()).hexdigest()

            entries.append({
                "id": entry_id,
                "title": title,
                "url": link,
                "description": desc,
                "published": pub_date,
                "source_id": source["id"],
                "source_name": source["name"],
                "source_icon": source["icon"],
                "category": source["category"],
            })
    except Exception as e:
        logger.error(f"Failed to parse RSS from {source['name']}: {e}")
    return entries


def parse_atom(xml_text, source):
    """Parse Atom feed."""
    entries = []
    try:
        ns = {"a": "http://www.w3.org/2005/Atom"}
        root = ElementTree.fromstring(xml_text)
        for item in root.findall(".//a:entry", ns)[:20]:
            title = item.findtext("a:title", "", ns).strip()
            link_el = item.find("a:link[@rel='alternate']", ns)
            if link_el is None:
                link_el = item.find("a:link", ns)
            link = link_el.get("href", "") if link_el is not None else ""
            desc = item.findtext("a:summary", "", ns)
            if desc:
                desc = BeautifulSoup(desc, "html.parser").get_text()[:200].strip()
            pub_date = item.findtext("a:updated", "", ns) or item.findtext("a:published", "", ns)
            entry_id = hashlib.md5((link or title).encode()).hexdigest()

            entries.append({
                "id": entry_id,
                "title": title,
                "url": link,
                "description": desc,
                "published": pub_date,
                "source_id": source["id"],
                "source_name": source["name"],
                "source_icon": source["icon"],
                "category": source["category"],
            })
    except Exception as e:
        logger.error(f"Failed to parse Atom from {source['name']}: {e}")
    return entries


def fetch_hf_papers(source):
    """Fetch HuggingFace daily papers via API."""
    entries = []
    try:
        resp = requests.get(source["url"], headers=HEADERS, timeout=20)
        resp.raise_for_status()
        for item in resp.json()[:20]:
            paper = item.get("paper", {})
            title = paper.get("title", "")
            pid = paper.get("id", "")
            link = f"https://huggingface.co/papers/{pid}" if pid else ""
            entry_id = hashlib.md5(pid.encode()).hexdigest()
            entries.append({
                "id": entry_id,
                "title": title,
                "url": link,
                "description": paper.get("summary", "")[:200],
                "published": item.get("publishedAt", ""),
                "source_id": source["id"],
                "source_name": source["name"],
                "source_icon": source["icon"],
                "category": source["category"],
                "likes": item.get("paper", {}).get("upvotes", 0),
            })
    except Exception as e:
        logger.error(f"Failed to fetch HF papers: {e}")
    return entries


def fetch_hn_ai(source):
    """Fetch Hacker News AI stories via Algolia API."""
    entries = []
    try:
        resp = requests.get(source["url"], headers=HEADERS, timeout=20)
        resp.raise_for_status()
        for hit in resp.json().get("hits", [])[:20]:
            title = hit.get("title", "")
            url = hit.get("url") or f"https://news.ycombinator.com/item?id={hit.get('objectID', '')}"
            entry_id = str(hit.get("objectID", ""))
            entries.append({
                "id": entry_id,
                "title": title,
                "url": url,
                "description": "",
                "published": hit.get("created_at", ""),
                "source_id": source["id"],
                "source_name": source["name"],
                "source_icon": source["icon"],
                "category": source["category"],
                "points": hit.get("points", 0),
                "comments": hit.get("num_comments", 0),
            })
    except Exception as e:
        logger.error(f"Failed to fetch HN: {e}")
    return entries


def fetch_feed(source):
    """Fetch a single feed source."""
    logger.info(f"Fetching {source['name']}...")

    if source["type"] == "json-api":
        if source["id"] == "hf-papers":
            return fetch_hf_papers(source)
        elif source["id"] == "hn-ai":
            return fetch_hn_ai(source)
        return []

    try:
        resp = requests.get(source["url"], headers=HEADERS, timeout=20)
        resp.raise_for_status()
        if source["type"] == "atom":
            return parse_atom(resp.text, source)
        else:
            return parse_rss(resp.text, source)
    except Exception as e:
        logger.error(f"Failed to fetch {source['name']}: {e}")
        return []


def run_rss_update():
    """Fetch all RSS feeds, detect new entries, save results."""
    logger.info("=" * 50)
    logger.info("RSS Feed Update")
    logger.info("=" * 50)

    seen = load_seen()
    all_entries = []
    new_count = 0

    for source in FEED_SOURCES:
        entries = fetch_feed(source)
        source_seen = set(seen.get(source["id"], []))

        for entry in entries:
            entry["is_new"] = entry["id"] not in source_seen
            if entry["is_new"]:
                new_count += 1
            all_entries.append(entry)

        # Update seen
        seen[source["id"]] = [e["id"] for e in entries]
        time.sleep(1)

    # Sort by published date (newest first)
    all_entries.sort(key=lambda e: e.get("published", ""), reverse=True)

    # Group by category
    by_category = {}
    for entry in all_entries:
        cat = entry["category"]
        by_category.setdefault(cat, []).append(entry)

    feed_data = {
        "last_updated": datetime.now(timezone.utc).isoformat(),
        "total_entries": len(all_entries),
        "new_entries": new_count,
        "sources": [{"id": s["id"], "name": s["name"], "icon": s["icon"], "category": s["category"]} for s in FEED_SOURCES],
        "entries": all_entries[:100],  # Keep latest 100
        "by_category": {k: v[:30] for k, v in by_category.items()},
    }

    save_json(FEEDS_FILE, feed_data)
    save_seen(seen)

    logger.info(f"Fetched {len(all_entries)} entries ({new_count} new)")
    logger.info("=" * 50)
    return new_count


if __name__ == "__main__":
    run_rss_update()
