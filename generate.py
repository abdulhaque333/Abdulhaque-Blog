#!/usr/bin/env python3
"""
Regenerate sitemap.xml and feed.xml (RSS) from posts.js.

ব্যবহার:  cd blog && python3 generate.py
নতুন লেখা posts.js-এ যোগ করার পর একবার চালালেই ফিড ও সাইটম্যাপ আপডেট হয়।

ডিপ্লয়ের আগে SITE_URL নিজের আসল ঠিকানায় বদলে নিন।
"""

import json
import os
import re
from datetime import datetime, timezone
from pathlib import Path
from xml.sax.saxutils import escape

# ---- কনফিগ: SITE_URL এনভায়রনমেন্ট থেকে নিলে নেয়, নইলে নিচের ডিফল্ট ----
SITE_URL = os.environ.get("SITE_URL", "https://abdulhaque.netlify.app").rstrip("/")
SITE_TITLE = "Mohammad Abdul Haque — ব্লগ"
SITE_DESC = "বাংলা, আরবি ও ইংরেজিতে নানা বিষয়ে লেখালেখি।"
AUTHOR = "Mohammad Abdul Haque"

HERE = Path(__file__).parent


def load_posts():
    """posts.js থেকে বৈধ JSON অ্যারেটি বের করে পড়ে।"""
    text = (HERE / "posts.js").read_text(encoding="utf-8")
    marker = text.index("window.POSTS")
    start = text.index("[", marker)
    end = text.rindex("]") + 1
    return json.loads(text[start:end])


def rfc822(date_str):
    dt = datetime.strptime(date_str, "%Y-%m-%d").replace(tzinfo=timezone.utc)
    return dt.strftime("%a, %d %b %Y %H:%M:%S +0000")


def build_sitemap(posts):
    urls = [f"{SITE_URL}/", f"{SITE_URL}/about.html"]
    urls += [f"{SITE_URL}/posts/{p['slug']}.html" for p in posts]
    items = "\n".join(
        f"  <url><loc>{escape(u)}</loc></url>" for u in urls
    )
    return (
        '<?xml version="1.0" encoding="UTF-8"?>\n'
        '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n'
        f"{items}\n</urlset>\n"
    )


def build_feed(posts):
    posts = sorted(posts, key=lambda p: p["date"], reverse=True)
    now = datetime.now(timezone.utc).strftime("%a, %d %b %Y %H:%M:%S +0000")
    items = []
    for p in posts:
        link = f"{SITE_URL}/posts/{p['slug']}.html"
        items.append(
            "    <item>\n"
            f"      <title>{escape(p['title'])}</title>\n"
            f"      <link>{escape(link)}</link>\n"
            f"      <guid>{escape(link)}</guid>\n"
            f"      <pubDate>{rfc822(p['date'])}</pubDate>\n"
            f"      <description>{escape(p.get('excerpt', ''))}</description>\n"
            "    </item>"
        )
    items_xml = "\n".join(items)
    return (
        '<?xml version="1.0" encoding="UTF-8"?>\n'
        '<rss version="2.0"><channel>\n'
        f"  <title>{escape(SITE_TITLE)}</title>\n"
        f"  <link>{escape(SITE_URL)}/</link>\n"
        f"  <description>{escape(SITE_DESC)}</description>\n"
        "  <language>bn</language>\n"
        f"  <lastBuildDate>{now}</lastBuildDate>\n"
        f"{items_xml}\n"
        "</channel></rss>\n"
    )


def main():
    posts = load_posts()
    (HERE / "sitemap.xml").write_text(build_sitemap(posts), encoding="utf-8")
    (HERE / "feed.xml").write_text(build_feed(posts), encoding="utf-8")
    print(f"✓ {len(posts)}টি লেখা থেকে sitemap.xml ও feed.xml তৈরি হলো।")


if __name__ == "__main__":
    main()
