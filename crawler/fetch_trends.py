#!/usr/bin/env python3
"""
AI Tool Trends Crawler
- GitHub trending repos (AI/ML)
- OSS Insight API (trending repos)
- HuggingFace trending models/spaces
- GitHub stars update for tracked tools
"""

import json
import os
import time
import logging
from datetime import datetime, timezone
from pathlib import Path

import requests
from bs4 import BeautifulSoup

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")
logger = logging.getLogger(__name__)

PROJECT_ROOT = Path(__file__).parent.parent
DATA_DIR = PROJECT_ROOT / "data"
DOCS_DATA_DIR = PROJECT_ROOT / "docs" / "data"
TOOLS_FILE = DATA_DIR / "tools.json"
GITHUB_TRENDING_FILE = DATA_DIR / "github_trending.json"
HF_TRENDING_FILE = DATA_DIR / "hf_trending.json"
NEWS_FILE = DATA_DIR / "news.json"
GEEKNEWS_FILE = DATA_DIR / "geeknews.json"


def save_json(filepath, data):
    """Save JSON to both data/ and docs/data/ directories."""
    content = json.dumps(data, ensure_ascii=False, indent=2)
    filepath.write_text(content)
    # Mirror to docs/data/
    docs_path = DOCS_DATA_DIR / filepath.name
    if DOCS_DATA_DIR.exists():
        docs_path.write_text(content)

HEADERS = {
    "User-Agent": "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
}


def fetch_github_trending(language="python", since="weekly"):
    """Fetch trending repos from GitHub."""
    url = f"https://github.com/trending/{language}?since={since}"
    logger.info(f"Fetching GitHub trending: {url}")
    try:
        resp = requests.get(url, headers=HEADERS, timeout=30)
        resp.raise_for_status()
        soup = BeautifulSoup(resp.text, "html.parser")
        repos = []
        for article in soup.select("article.Box-row"):
            name_el = article.select_one("h2 a")
            if not name_el:
                continue
            full_name = name_el.get("href", "").strip("/")
            desc_el = article.select_one("p")
            description = desc_el.get_text(strip=True) if desc_el else ""
            stars_el = article.select_one("a[href$='/stargazers']")
            stars_text = stars_el.get_text(strip=True).replace(",", "") if stars_el else "0"
            stars = int(stars_text) if stars_text.isdigit() else 0
            lang_el = article.select_one("[itemprop='programmingLanguage']")
            lang = lang_el.get_text(strip=True) if lang_el else language
            today_stars_el = article.select_one("span.d-inline-block.float-sm-right")
            today_stars = today_stars_el.get_text(strip=True) if today_stars_el else ""

            repos.append({
                "full_name": full_name,
                "url": f"https://github.com/{full_name}",
                "description": description,
                "stars": stars,
                "language": lang,
                "trending_stars": today_stars,
            })
        logger.info(f"Found {len(repos)} trending repos")
        return repos
    except Exception as e:
        logger.error(f"Failed to fetch GitHub trending: {e}")
        return []


def fetch_oss_insight_trending(period="past_week", language="All"):
    """Fetch trending repos from OSS Insight API."""
    url = "https://api.ossinsight.io/v1/trends/repos/"
    params = {"period": period, "language": language}
    logger.info(f"Fetching OSS Insight trending: {url}")
    try:
        resp = requests.get(url, params=params, timeout=30)
        resp.raise_for_status()
        data = resp.json()
        repos = []
        items = data.get("data", data) if isinstance(data, dict) else data
        if not isinstance(items, list):
            items = []
        for item in items:
            if not isinstance(item, dict):
                continue
            repos.append({
                "full_name": item.get("repo_name", item.get("full_name", "")),
                "url": f"https://github.com/{item.get('repo_name', item.get('full_name', ''))}",
                "description": item.get("description", ""),
                "stars": item.get("stars", item.get("stargazers_count", 0)),
                "language": item.get("primary_language", item.get("language", "")),
                "forks": item.get("forks", item.get("forks_count", 0)),
            })
        logger.info(f"Found {len(repos)} repos from OSS Insight")
        return repos
    except Exception as e:
        logger.error(f"Failed to fetch OSS Insight: {e}")
        return []


def fetch_hf_trending_models(limit=30):
    """Fetch trending models from HuggingFace."""
    url = "https://huggingface.co/api/models"
    params = {"sort": "trendingScore", "direction": "-1", "limit": limit}
    logger.info("Fetching HuggingFace trending models")
    try:
        resp = requests.get(url, params=params, timeout=30)
        resp.raise_for_status()
        models = []
        for item in resp.json():
            models.append({
                "id": item.get("modelId", ""),
                "url": f"https://huggingface.co/{item.get('modelId', '')}",
                "downloads": item.get("downloads", 0),
                "likes": item.get("likes", 0),
                "pipeline_tag": item.get("pipeline_tag", ""),
                "trending_score": item.get("trendingScore"),
            })
        logger.info(f"Found {len(models)} trending models")
        return models
    except Exception as e:
        logger.error(f"Failed to fetch HuggingFace models: {e}")
        return []


def fetch_hf_trending_spaces(limit=20):
    """Fetch trending spaces from HuggingFace."""
    url = "https://huggingface.co/api/spaces"
    params = {"sort": "trendingScore", "direction": "-1", "limit": limit}
    logger.info("Fetching HuggingFace trending spaces")
    try:
        resp = requests.get(url, params=params, timeout=30)
        resp.raise_for_status()
        spaces = []
        for item in resp.json():
            spaces.append({
                "id": item.get("id", ""),
                "url": f"https://huggingface.co/spaces/{item.get('id', '')}",
                "likes": item.get("likes", 0),
                "sdk": item.get("sdk", ""),
                "trending_score": item.get("trendingScore"),
            })
        logger.info(f"Found {len(spaces)} trending spaces")
        return spaces
    except Exception as e:
        logger.error(f"Failed to fetch HuggingFace spaces: {e}")
        return []


def fetch_geeknews_ai():
    """Fetch AI-related posts from GeekNews (news.hada.io)."""
    url = "https://news.hada.io/new"
    logger.info("Fetching GeekNews AI posts")
    try:
        resp = requests.get(url, headers=HEADERS, timeout=30)
        resp.raise_for_status()
        soup = BeautifulSoup(resp.text, "html.parser")
        posts = []
        ai_keywords = [
            "ai", "llm", "gpt", "claude", "agent", "모델", "에이전트",
            "openai", "anthropic", "mcp", "코딩", "coding", "ollama",
            "transformer", "diffusion", "rag", "벡터", "워크플로우",
            "자동화", "생성", "copilot", "cursor", "로컬", "local",
        ]
        for item in soup.select(".topic_row"):
            title_el = item.select_one(".topictitle a")
            if not title_el:
                continue
            title = title_el.get_text(strip=True)
            link = title_el.get("href", "")
            if not link.startswith("http"):
                link = f"https://news.hada.io{link}"

            points_el = item.select_one(".topicinfo .u-count")
            points = 0
            if points_el:
                points_text = points_el.get_text(strip=True).replace("P", "").strip()
                points = int(points_text) if points_text.isdigit() else 0

            text_lower = title.lower()
            if any(kw in text_lower for kw in ai_keywords):
                posts.append({
                    "title": title,
                    "url": link,
                    "points": points,
                    "source": "GeekNews",
                })
        posts.sort(key=lambda x: x["points"], reverse=True)
        logger.info(f"Found {len(posts)} AI posts from GeekNews")
        return posts
    except Exception as e:
        logger.error(f"Failed to fetch GeekNews: {e}")
        return []


def update_github_stars(tools_data):
    """Update GitHub stars for tracked tools."""
    logger.info("Updating GitHub stars for tracked tools")
    updated = 0
    for tool in tools_data.get("tools", []):
        github_url = tool.get("github_url")
        if not github_url:
            continue
        parts = github_url.rstrip("/").split("/")
        if len(parts) < 2:
            continue
        owner, repo = parts[-2], parts[-1]
        api_url = f"https://api.github.com/repos/{owner}/{repo}"
        try:
            resp = requests.get(api_url, headers=HEADERS, timeout=15)
            if resp.status_code == 200:
                data = resp.json()
                tool["stars"] = data.get("stargazers_count", tool.get("stars", 0))
                tool["forks"] = data.get("forks_count", 0)
                tool["open_issues"] = data.get("open_issues_count", 0)
                tool["last_push"] = data.get("pushed_at", "")
                updated += 1
                logger.info(f"  {tool['name']}: {tool['stars']} stars")
            elif resp.status_code == 403:
                logger.warning("GitHub API rate limit reached, stopping star updates")
                break
            time.sleep(1)  # Rate limiting
        except Exception as e:
            logger.error(f"  Failed to update {tool['name']}: {e}")
    logger.info(f"Updated stars for {updated} tools")
    return tools_data


def filter_ai_repos(repos):
    """Filter repos that are likely AI/ML related."""
    ai_keywords = [
        "ai", "ml", "llm", "gpt", "agent", "model", "neural", "transformer",
        "diffusion", "stable", "chat", "embedding", "rag", "langchain",
        "ollama", "inference", "fine-tune", "lora", "quantiz", "gguf",
        "copilot", "coding", "assistant", "workflow", "automation",
        "comfy", "whisper", "vision", "multimodal", "generative",
    ]
    filtered = []
    for repo in repos:
        text = f"{repo.get('full_name', '')} {repo.get('description', '')}".lower()
        if any(kw in text for kw in ai_keywords):
            filtered.append(repo)
    return filtered


def run_full_update():
    """Run all crawlers and update data files."""
    logger.info("=" * 60)
    logger.info("Starting full trend update")
    logger.info("=" * 60)

    # 0. RSS feeds (event-driven)
    try:
        from rss_feeds import run_rss_update
        run_rss_update()
    except Exception as e:
        logger.error(f"RSS update failed: {e}")

    # 1. GitHub trending (daily + weekly)
    def collect_gh(since):
        repos = []
        for lang in ["python", "typescript", ""]:
            repos.extend(fetch_github_trending(lang, since))
            time.sleep(1)
        seen = set()
        unique = []
        for r in repos:
            if r["full_name"] not in seen:
                seen.add(r["full_name"])
                unique.append(r)
        return unique

    weekly_gh = collect_gh("weekly")
    daily_gh = collect_gh("daily")
    ai_weekly = filter_ai_repos(weekly_gh)
    ai_daily = filter_ai_repos(daily_gh)

    # Categorize trending repos
    cat_keywords = {
        "coding-agents": ["code", "coding", "copilot", "aider", "cursor", "cline", "ide", "editor", "swe-", "devin"],
        "nocode-builders": ["no-code", "nocode", "low-code", "dify", "flowise", "langflow", "visual", "builder"],
        "workflow-automation": ["workflow", "automation", "n8n", "zapier", "autogen", "crewai", "orchestrat"],
        "image-generation": ["diffusion", "stable", "comfy", "flux", "image", "sdxl", "lora", "controlnet"],
        "local-llm": ["ollama", "llm", "llama", "gguf", "quantiz", "inference", "vllm", "local"],
        "agent-frameworks": ["agent", "langchain", "llamaindex", "framework", "rag", "chain"],
        "browser-automation": ["browser", "scrape", "crawl", "playwright", "selenium", "web-use"],
        "video-generation": ["video", "sora", "wan2", "cogvideo", "animate", "diffusion-video"],
        "cloud-ai-ide": ["bolt", "lovable", "replit", "v0", "vercel"],
        "voice-music-ai": ["tts", "whisper", "voice", "speech", "music", "audio", "suno", "bark"],
        "ai-search": ["search", "perplexity", "retrieval"],
        "design-ai": ["design", "figma", "midjourney", "canva", "ui-gen"],
        "ai-protocols": ["mcp", "protocol", "a2a"],
        "observability": ["observ", "monitor", "trace", "langfuse", "eval"],
    }

    categorized_trending = {}
    for repo in ai_weekly:
        text = f"{repo.get('full_name', '')} {repo.get('description', '')}".lower()
        for cat_id, kws in cat_keywords.items():
            if any(kw in text for kw in kws):
                categorized_trending.setdefault(cat_id, []).append(repo)
                break

    gh_data = {
        "last_updated": datetime.now(timezone.utc).isoformat(),
        "all_trending": weekly_gh[:50],
        "ai_trending": ai_weekly[:30],
        "ai_daily": ai_daily[:20],
        "by_category": {k: v[:8] for k, v in categorized_trending.items()},
    }
    save_json(GITHUB_TRENDING_FILE, gh_data)
    logger.info(f"Saved {len(ai_weekly)} weekly + {len(ai_daily)} daily AI trending repos")

    time.sleep(2)

    # 2. OSS Insight
    oss_repos = fetch_oss_insight_trending("past_week")
    ai_oss = filter_ai_repos(oss_repos)

    # 3. HuggingFace trending
    hf_models = fetch_hf_trending_models(30)
    hf_spaces = fetch_hf_trending_spaces(20)
    hf_data = {
        "last_updated": datetime.now(timezone.utc).isoformat(),
        "trending_models": hf_models,
        "trending_spaces": hf_spaces,
    }
    save_json(HF_TRENDING_FILE, hf_data)
    logger.info("Saved HuggingFace trending data")

    time.sleep(2)

    # 4. Update stars for tracked tools
    tools_data = json.loads(TOOLS_FILE.read_text())
    tools_data = update_github_stars(tools_data)
    tools_data["last_updated"] = datetime.now(timezone.utc).isoformat()

    # Recalculate trending scores based on stars
    all_stars = [t.get("stars", 0) for t in tools_data["tools"] if t.get("stars")]
    if all_stars:
        max_stars = max(all_stars)
        for tool in tools_data["tools"]:
            if tool.get("stars") and max_stars > 0:
                tool["trending_score"] = round((tool["stars"] / max_stars) * 100)

    save_json(TOOLS_FILE, tools_data)
    logger.info("Updated tools data with fresh stars")

    # 5. Compile news/discoveries
    news_items = []
    for repo in ai_weekly[:10]:
        news_items.append({
            "type": "github_trending",
            "title": repo["full_name"],
            "description": repo.get("description", ""),
            "url": repo["url"],
            "stars": repo.get("stars", 0),
            "extra": repo.get("trending_stars", ""),
        })
    for model in hf_models[:5]:
        news_items.append({
            "type": "hf_model",
            "title": model["id"],
            "description": f"Pipeline: {model.get('pipeline_tag', 'N/A')}",
            "url": model["url"],
            "downloads": model.get("downloads", 0),
            "likes": model.get("likes", 0),
        })
    for space in hf_spaces[:5]:
        news_items.append({
            "type": "hf_space",
            "title": space["id"],
            "description": f"SDK: {space.get('sdk', 'N/A')}",
            "url": space["url"],
            "likes": space.get("likes", 0),
        })

    news_data = {
        "last_updated": datetime.now(timezone.utc).isoformat(),
        "items": news_items,
    }
    save_json(NEWS_FILE, news_data)
    logger.info(f"Saved {len(news_items)} news items")

    # 6. GeekNews AI posts
    geeknews_posts = fetch_geeknews_ai()
    gn_data = {
        "last_updated": datetime.now(timezone.utc).isoformat(),
        "posts": geeknews_posts[:20],
    }
    save_json(GEEKNEWS_FILE, gn_data)
    logger.info(f"Saved {len(geeknews_posts)} GeekNews AI posts")

    logger.info("=" * 60)
    logger.info("Full update complete!")
    logger.info("=" * 60)


if __name__ == "__main__":
    run_full_update()
