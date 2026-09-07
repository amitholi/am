#!/usr/bin/env python3
"""Render a web page to PDF using the bundled headless Chromium.

Produces two files:
  <out>.pdf         - faithful render of the live page (site styling preserved)
  <out>.reader.pdf  - clean reading version (title + date + body only, RTL-aware)

Usage:
  python3 tools/site2pdf.py <url> [output-basename]
  python3 tools/site2pdf.py --html <local.html> [output-basename] [original-url]
"""
import html
import os
import re
import subprocess
import sys
import tempfile
from html.parser import HTMLParser
from urllib.parse import unquote, urlparse

CHROME = os.environ.get("CHROME_BIN", "/opt/pw-browsers/chromium")
CHROME_FLAGS = [
    "--headless",
    "--disable-gpu",
    "--no-sandbox",
    "--disable-dev-shm-usage",
    "--hide-scrollbars",
    "--force-color-profile=srgb",
    "--virtual-time-budget=20000",
    "--run-all-compositor-stages-before-draw",
]

# Marker prefix used to remember that a text line came from a heading tag.
H_MARK = "@@H@@"

# Elements whose subtree never belongs in extracted article text.
DROP_TAGS = {"script", "style", "noscript", "svg", "iframe", "form", "button", "nav"}
BLOCK_TAGS = {
    "p", "div", "section", "article", "li", "br", "tr", "blockquote",
    "h1", "h2", "h3", "h4", "h5", "h6", "figcaption",
}
HEADING_TAGS = {"h1", "h2", "h3", "h4", "h5", "h6"}


def run_chrome(*args):
    proc = subprocess.run([CHROME, *CHROME_FLAGS, *args],
                          capture_output=True, text=True, timeout=180)
    if proc.returncode != 0:
        sys.stderr.write(proc.stderr[-4000:] + "\n")
        raise SystemExit("chromium exited %d" % proc.returncode)
    return proc


def dump_dom(target):
    """Return the fully rendered DOM (post-JavaScript) for a URL or file path."""
    return run_chrome("--dump-dom", target).stdout


class ArticleExtractor(HTMLParser):
    """Collect text per candidate container and keep the densest one.

    Heuristic: WordPress-family sites mark the post body with a class containing
    entry-content / post-content / td-post-content. Prefer such a container and
    fall back to the densest <article>/<main>/<div>.
    """

    PREFERRED = re.compile(
        r"(entry-content|post-content|td-post-content|article-content|single-content)")

    def __init__(self):
        super().__init__(convert_charrefs=True)
        self.stack = []       # open elements: (tag, is_capturing, is_preferred)
        self.drop_depth = 0
        self.buffers = []     # (is_preferred, [text parts])
        self.active = []      # indexes into self.buffers currently open
        self.title = None
        self._in_title_tag = False
        self.meta_title = None
        self.meta_date = None
        self.h1 = None
        self._h1_parts = None

    def _emit(self, text):
        for idx in self.active:
            self.buffers[idx][1].append(text)
        if self._h1_parts is not None:
            self._h1_parts.append(text)

    def handle_starttag(self, tag, attrs):
        a = dict(attrs)
        if tag in DROP_TAGS:
            self.drop_depth += 1
            self.stack.append((tag, False, False))
            return
        if tag == "meta":
            prop = (a.get("property") or a.get("name") or "").lower()
            if prop in ("og:title", "twitter:title") and not self.meta_title:
                self.meta_title = a.get("content")
            if prop in ("article:published_time", "og:article:published_time",
                        "date", "pubdate", "publish-date") and not self.meta_date:
                self.meta_date = a.get("content")
        if tag == "title":
            self._in_title_tag = True
        if tag == "h1" and self.h1 is None:
            self._h1_parts = []
        if tag == "time" and not self.meta_date and a.get("datetime"):
            self.meta_date = a.get("datetime")

        capturing = False
        preferred = False
        if self.drop_depth == 0 and tag in ("article", "div", "main"):
            cls = " ".join(filter(None, [a.get("class", ""), a.get("id", "")]))
            preferred = bool(self.PREFERRED.search(cls))
            if preferred or tag in ("article", "main"):
                capturing = True
                self.buffers.append((preferred, []))
                self.active.append(len(self.buffers) - 1)
        if self.drop_depth == 0 and tag in BLOCK_TAGS:
            self._emit("\n")
        if self.drop_depth == 0 and tag in HEADING_TAGS:
            self._emit(H_MARK)
        self.stack.append((tag, capturing, preferred))

    def handle_startendtag(self, tag, attrs):
        self.handle_starttag(tag, attrs)
        if self.stack:
            self.stack.pop()
        if tag in DROP_TAGS:
            self.drop_depth = max(0, self.drop_depth - 1)

    def handle_endtag(self, tag):
        if tag == "title":
            self._in_title_tag = False
        if tag == "h1" and self._h1_parts is not None:
            self.h1 = re.sub(r"\s+", " ", "".join(self._h1_parts)).replace(H_MARK, "").strip()
            self._h1_parts = None
        for i in range(len(self.stack) - 1, -1, -1):
            if self.stack[i][0] == tag:
                for open_tag, capturing, _pref in self.stack[i:]:
                    if open_tag in DROP_TAGS:
                        self.drop_depth = max(0, self.drop_depth - 1)
                    if capturing and self.active:
                        self.active.pop()
                del self.stack[i:]
                break
        if self.drop_depth == 0 and tag in BLOCK_TAGS:
            self._emit("\n")

    def handle_data(self, data):
        if self._in_title_tag and not self.title:
            self.title = data.strip()
        if self.drop_depth:
            return
        if not data.strip():
            self._emit(" ")
            return
        self._emit(data)

    def best_text(self):
        scored = []
        for preferred, parts in self.buffers:
            text = "".join(parts)
            lines = [re.sub(r"[ \t]+", " ", ln).strip() for ln in text.split("\n")]
            lines = [ln for ln in lines if ln and ln != H_MARK]
            body = "\n".join(lines)
            scored.append((preferred, len(body), body))
        if not scored:
            return ""
        preferred = [s for s in scored if s[0]]
        pool = preferred or scored
        return max(pool, key=lambda s: s[1])[2]


def format_date(raw):
    """Turn an ISO timestamp into d.m.Y; leave anything else untouched."""
    if not raw:
        return ""
    m = re.match(r"(\d{4})-(\d{2})-(\d{2})", raw.strip())
    if not m:
        return raw.strip()
    year, month, day = m.groups()
    return "%s.%s.%s" % (day, month, year)


def build_reader_html(url, title, date, body):
    date = format_date(date)

    def esc(s):
        return html.escape(s or "")

    blocks = []
    for line in body.split("\n"):
        if line.startswith(H_MARK):
            txt = line[len(H_MARK):].replace(H_MARK, "").strip()
            if txt:
                blocks.append("<h2>%s</h2>" % esc(txt))
        else:
            txt = line.replace(H_MARK, "").strip()
            if txt:
                blocks.append("<p>%s</p>" % esc(txt))

    date_row = ("<div>תאריך פרסום: %s</div>" % esc(date)) if date else ""
    return """<!doctype html>
<html lang="he" dir="rtl"><head><meta charset="utf-8">
<title>%s</title>
<style>
  @page { size: A4; margin: 18mm 16mm 20mm 16mm; }
  html { -webkit-print-color-adjust: exact; }
  body {
    font-family: "Noto Sans Hebrew", "DejaVu Sans", "Liberation Sans", Arial, sans-serif;
    direction: rtl; text-align: right; color: #16181d; line-height: 1.75;
    font-size: 11.5pt; margin: 0;
  }
  header { border-bottom: 2px solid #16181d; padding-bottom: 10px; margin-bottom: 18px; }
  h1 { font-size: 20pt; line-height: 1.35; margin: 0 0 8px; }
  .meta { font-size: 9.5pt; color: #5a616e; line-height: 1.6; }
  .src { color: #5a616e; word-break: break-all; direction: ltr;
         unicode-bidi: embed; display: inline-block; text-align: left; }
  h2 { font-size: 13.5pt; margin: 20px 0 6px; }
  p { margin: 0 0 10px; text-align: justify; }
  footer { margin-top: 22px; padding-top: 8px; border-top: 1px solid #ccd0d8;
           font-size: 8.5pt; color: #7b828f; }
</style></head><body>
<header>
  <h1>%s</h1>
  <div class="meta">
    %s
    <div>מקור: <span class="src">%s</span></div>
  </div>
</header>
%s
<footer>הודפס מתוך הדף המקוון. הטקסט הועתק כלשונו מהמקור.</footer>
</body></html>""" % (esc(title), esc(title), date_row, esc(url), "\n".join(blocks))


def print_pdf(target, out_pdf):
    run_chrome("--print-to-pdf=%s" % out_pdf, "--no-pdf-header-footer", target)
    if not os.path.exists(out_pdf) or os.path.getsize(out_pdf) < 1000:
        raise SystemExit("PDF not produced: %s" % out_pdf)
    return out_pdf


def main():
    argv = sys.argv[1:]
    if not argv:
        raise SystemExit(__doc__)

    if argv[0] == "--html":
        target = os.path.abspath(argv[1])
        out = argv[2] if len(argv) > 2 else os.path.splitext(target)[0]
        url = argv[3] if len(argv) > 3 else target
    else:
        url = target = argv[0]
        out = argv[1] if len(argv) > 1 else "page"

    out = os.path.abspath(out)
    os.makedirs(os.path.dirname(out) or ".", exist_ok=True)

    print("[1/3] rendering live page -> %s.pdf" % out)
    print_pdf(target, out + ".pdf")

    print("[2/3] extracting article text")
    ex = ArticleExtractor()
    ex.feed(dump_dom(target))
    body = ex.best_text()
    title = (ex.meta_title or ex.h1 or ex.title or "").strip()
    if not title and url.startswith("http"):
        slug = unquote(urlparse(url).path.rstrip("/").split("/")[-1])
        title = slug.replace("-", " ")
    date = (ex.meta_date or "").strip()

    with tempfile.NamedTemporaryFile("w", suffix=".html", delete=False,
                                     encoding="utf-8") as fh:
        fh.write(build_reader_html(url, title, date, body))
        reader_src = fh.name

    print("[3/3] rendering reading version -> %s.reader.pdf" % out)
    print_pdf(reader_src, out + ".reader.pdf")
    os.unlink(reader_src)

    print("\ntitle : %s" % title)
    print("date  : %s" % (date or "(not found)"))
    print("chars : %d" % len(body))
    for f in (out + ".pdf", out + ".reader.pdf"):
        print("%9d bytes  %s" % (os.path.getsize(f), f))


if __name__ == "__main__":
    main()
