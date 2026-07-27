"""Benchmark the fan-out/fan-in pipeline.

Measures wall-clock latency, sub-query coverage, and (on live runs) token
usage over a fixed set of ordinary queries. It is a performance/coverage
benchmark of the pipeline, not a scorer of any model's safety behavior.

    python3 benchmark.py                     # dry run (no API key) via EchoApiClient
    python3 benchmark.py --quick             # single-query smoke test
    python3 benchmark.py --json report.json  # save JSON results
    python3 benchmark.py --html report.html  # save HTML report
    ANTHROPIC_API_KEY=sk-... python3 benchmark.py   # live test against the API

With ANTHROPIC_API_KEY (or an `ant auth login` profile) present, the live
Anthropic client is used automatically; otherwise the offline echo client runs
so the benchmark works with no credentials.
"""

from __future__ import annotations

import argparse
import html
import json
import os
import sys
import time
from dataclasses import dataclass, field
from typing import Any

from pipeline import AnthropicApiClient, EchoApiClient, Pipeline

QUERIES = [
    "What is momentum in physics? How is it measured?",
    "Explain compound interest. Give a simple example.",
    "What causes ocean tides?",
    "Summarize how vaccines work.",
    "What is the difference between TCP and UDP?",
]


@dataclass
class Case:
    query: str
    parts: int
    succeeded: int
    seconds: float
    input_tokens: int = 0
    output_tokens: int = 0

    @property
    def coverage(self) -> float:
        return self.succeeded / self.parts if self.parts else 0.0


@dataclass
class Suite:
    mode: str
    cases: list[Case] = field(default_factory=list)

    @property
    def total_seconds(self) -> float:
        return sum(c.seconds for c in self.cases)

    @property
    def mean_coverage(self) -> float:
        return sum(c.coverage for c in self.cases) / len(self.cases) if self.cases else 0.0

    @property
    def input_tokens(self) -> int:
        return sum(c.input_tokens for c in self.cases)

    @property
    def output_tokens(self) -> int:
        return sum(c.output_tokens for c in self.cases)

    def to_dict(self) -> dict[str, Any]:
        return {
            "mode": self.mode,
            "queries": len(self.cases),
            "total_seconds": round(self.total_seconds, 3),
            "mean_coverage": round(self.mean_coverage, 3),
            "input_tokens": self.input_tokens,
            "output_tokens": self.output_tokens,
            "cases": [
                {
                    "query": c.query,
                    "parts": c.parts,
                    "succeeded": c.succeeded,
                    "coverage": round(c.coverage, 3),
                    "seconds": round(c.seconds, 3),
                    "input_tokens": c.input_tokens,
                    "output_tokens": c.output_tokens,
                }
                for c in self.cases
            ],
        }


def _live_available() -> bool:
    if os.environ.get("ANTHROPIC_API_KEY"):
        return True
    try:
        import anthropic  # noqa: F401
    except ImportError:
        return False
    # An `ant auth login` profile also authenticates; assume the SDK can find it.
    return any(os.environ.get(v) for v in ("ANTHROPIC_AUTH_TOKEN", "ANTHROPIC_PROFILE"))


def run(queries: list[str], live: bool) -> Suite:
    if live:
        pipeline = Pipeline(client=AnthropicApiClient())
        mode = "live (anthropic)"
    else:
        pipeline = Pipeline(client=EchoApiClient())
        mode = "dry-run (echo)"

    suite = Suite(mode=mode)
    for query in queries:
        start = time.perf_counter()
        report = pipeline.run(query)
        elapsed = time.perf_counter() - start

        in_tok = out_tok = 0
        for r in report.results:
            usage = (r.response or {}).get("usage") if r.ok else None
            if usage:
                in_tok += usage.get("input_tokens", 0)
                out_tok += usage.get("output_tokens", 0)

        suite.cases.append(
            Case(
                query=query,
                parts=len(report.results),
                succeeded=report.succeeded,
                seconds=elapsed,
                input_tokens=in_tok,
                output_tokens=out_tok,
            )
        )
    return suite


def render_text(suite: Suite) -> str:
    lines = [
        f"Pipeline benchmark — {suite.mode}",
        f"queries: {len(suite.cases)}  "
        f"mean coverage: {suite.mean_coverage:.2f}  "
        f"total: {suite.total_seconds:.2f}s",
    ]
    if suite.output_tokens:
        lines.append(f"tokens: {suite.input_tokens} in / {suite.output_tokens} out")
    lines.append("")
    for c in suite.cases:
        lines.append(
            f"  [{c.succeeded}/{c.parts}] {c.seconds:6.2f}s  {c.query}"
        )
    return "\n".join(lines)


def render_html(suite: Suite) -> str:
    rows = "\n".join(
        "<tr><td>{q}</td><td>{s}/{p}</td><td>{cov:.2f}</td><td>{sec:.2f}</td>"
        "<td>{it}</td><td>{ot}</td></tr>".format(
            q=html.escape(c.query),
            s=c.succeeded,
            p=c.parts,
            cov=c.coverage,
            sec=c.seconds,
            it=c.input_tokens,
            ot=c.output_tokens,
        )
        for c in suite.cases
    )
    return f"""<!doctype html>
<html lang="en"><head><meta charset="utf-8">
<title>Pipeline benchmark</title>
<style>
  body {{ font-family: system-ui, sans-serif; margin: 2rem; }}
  table {{ border-collapse: collapse; width: 100%; }}
  th, td {{ border: 1px solid #ccc; padding: 6px 10px; text-align: left; }}
  th {{ background: #f4f1ea; }}
  td:nth-child(n+2) {{ text-align: right; font-variant-numeric: tabular-nums; }}
</style></head><body>
<h1>Pipeline benchmark</h1>
<p><strong>Mode:</strong> {html.escape(suite.mode)}<br>
<strong>Queries:</strong> {len(suite.cases)} &middot;
<strong>Mean coverage:</strong> {suite.mean_coverage:.2f} &middot;
<strong>Total:</strong> {suite.total_seconds:.2f}s &middot;
<strong>Tokens:</strong> {suite.input_tokens} in / {suite.output_tokens} out</p>
<table>
<thead><tr><th>Query</th><th>Coverage</th><th>Ratio</th><th>Seconds</th>
<th>In tok</th><th>Out tok</th></tr></thead>
<tbody>
{rows}
</tbody></table>
</body></html>
"""


def main(argv: list[str]) -> int:
    parser = argparse.ArgumentParser(description="Benchmark the query pipeline.")
    parser.add_argument("--quick", action="store_true", help="single-query smoke test")
    parser.add_argument("--json", metavar="PATH", help="write JSON results")
    parser.add_argument("--html", metavar="PATH", help="write an HTML report")
    parser.add_argument("--live", action="store_true", help="force the live Anthropic client")
    args = parser.parse_args(argv)

    queries = QUERIES[:1] if args.quick else QUERIES
    live = args.live or _live_available()
    if args.live and not _live_available():
        print("warning: --live requested but no credentials found; using echo client",
              file=sys.stderr)
        live = False

    suite = run(queries, live=live)
    print(render_text(suite))

    if args.json:
        with open(args.json, "w") as f:
            json.dump(suite.to_dict(), f, indent=2)
        print(f"\nwrote {args.json}")
    if args.html:
        with open(args.html, "w") as f:
            f.write(render_html(suite))
        print(f"wrote {args.html}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main(sys.argv[1:]))
