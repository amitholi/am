"""CLI entry point.

    python3 run.py decompose "query" [N]     # split into <= N sub-queries
    python3 run.py eval "query"              # run pipeline, score answers
    python3 run.py obfuscate "text"          # redact PII / normalize
"""

from __future__ import annotations

import sys

from obfuscate import obfuscate
from pipeline import EchoApiClient, Pipeline, Splitter


def cmd_decompose(query: str, n: str | None) -> int:
    max_parts = int(n) if n else 8
    for i, part in enumerate(Splitter(max_parts=max_parts).split(query)):
        print(f"[{i}] {part}")
    return 0


def cmd_eval(query: str) -> int:
    """Run the pipeline and report a simple answer-coverage score.

    Uses the offline EchoApiClient by default. The "score" is the fraction of
    sub-queries that produced a non-empty response without error -- a coverage
    metric for the pipeline, not a judgment of a model's safety behavior.
    """
    report = Pipeline(client=EchoApiClient()).run(query)
    print(report.render())
    total = len(report.results)
    score = report.succeeded / total if total else 0.0
    print(f"\ncoverage: {report.succeeded}/{total} = {score:.2f}")
    return 0


def cmd_obfuscate(text: str) -> int:
    result = obfuscate(text)
    print(result.text)
    if result.counts:
        print("redacted:", result.counts)
    return 0


USAGE = __doc__


def main(argv: list[str]) -> int:
    if len(argv) < 2:
        print(USAGE, file=sys.stderr)
        return 2
    command, rest = argv[1], argv[2:]
    if command == "decompose":
        if not rest:
            print(USAGE, file=sys.stderr)
            return 2
        return cmd_decompose(rest[0], rest[1] if len(rest) > 1 else None)
    if command == "eval":
        if not rest:
            print(USAGE, file=sys.stderr)
            return 2
        return cmd_eval(rest[0])
    if command == "obfuscate":
        if not rest:
            print(USAGE, file=sys.stderr)
            return 2
        return cmd_obfuscate(rest[0])
    print(f"unknown command: {command}\n\n{USAGE}", file=sys.stderr)
    return 2


if __name__ == "__main__":
    raise SystemExit(main(sys.argv))
