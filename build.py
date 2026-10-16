"""Build the static GitHub Pages site using only Python's standard library."""
import html
import hashlib
import json
import re
import shutil
from pathlib import Path

ROOT = Path(__file__).resolve().parent
OUT = ROOT / "dist"
OUT.mkdir(exist_ok=True)
profile = json.loads((ROOT / "profile.js").read_text().split("window.researchProfile =", 1)[1].strip().removesuffix(";"))
page = (ROOT / "index.html").read_text()
style_version = hashlib.sha256((ROOT / "styles.css").read_bytes()).hexdigest()[:12]
page = page.replace('href="./styles.css"', 'href="./styles.css?v=' + style_version + '"')
escape = lambda value: html.escape(str(value), quote=True)

for key in ("name", "bio"):
    page = re.sub(r'(<[^>]+data-profile="' + key + r'"[^>]*>)[^<]*(</[^>]+>)', lambda m: m[1] + escape(profile[key]) + m[2], page)
page = re.sub(r"<title>.*?</title>", lambda _: "<title>" + escape(profile["name"]) + " · Neuroscience</title>", page)
page = page.replace('<p class="muted" id="affiliation" hidden></p>', '<p class="muted" id="affiliation">' + escape(profile["affiliation"]) + '</p>')

articles = []
for paper in sorted(profile["publications"], key=lambda p: int(p["year"]), reverse=True):
    articles.append('<article class="publication"><span class="publication-year">' + escape(paper["year"]) + '</span><div><h3><a href="' + escape(paper["url"]) + '" target="_blank" rel="noopener noreferrer">' + escape(paper["title"]) + '</a></h3><p>' + escape(paper["authors"]) + '</p><p class="journal">' + escape(paper["journal"]) + ' · ' + escape(paper["type"]) + '</p></div></article>')
page = re.sub(r'<div id="publication-list">.*?(?=<button id="more-publications")', lambda _: '<div id="publication-list">' + ''.join(articles) + '</div>', page, flags=re.S)
links = []
for key, label in (("scholar", "Google Scholar"), ("github", "GitHub"), ("bluesky", "Bluesky"), ("orcid", "ORCID"), ("cv", "Curriculum vitae")):
    if profile.get(key):
        if key == "cv":
            links.append('<a href="#cv">Curriculum vitae ↓</a>')
        else:
            links.append('<a href="' + escape(profile[key]) + '" target="_blank" rel="noopener noreferrer">' + label + ' ↗</a>')
page = page.replace('<div id="profile-links" class="profile-links"></div>', '<div id="profile-links" class="profile-links">' + ''.join(links) + '</div>')
page = page.replace('The research content is available without JavaScript. Enable JavaScript for the interactive illustration and profile links.', 'All research and publications are available here. Enable JavaScript for the interactive illustration and publication search.')
(OUT / "index.html").write_text(page)
for name in ("app.js", "profile.js", "styles.css", "favicon.svg", ".nojekyll"):
    shutil.copyfile(ROOT / name, OUT / name)
if (ROOT / "assets").is_dir():
    shutil.copytree(ROOT / "assets", OUT / "assets", dirs_exist_ok=True)
print(f"Built {OUT} with {len(articles)} publications.")
