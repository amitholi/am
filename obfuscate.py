"""Defensive text transformation: redact PII and normalize whitespace.

This is a privacy/normalization utility -- it removes or masks sensitive
identifiers before text is logged, stored, or sent to an external service.
It is deliberately NOT an adversarial transform for evading content filters.
"""

from __future__ import annotations

import re
from dataclasses import dataclass

_EMAIL = re.compile(r"\b[\w.%+-]+@[\w.-]+\.[A-Za-z]{2,}\b")
_PHONE = re.compile(r"\b(?:\+?\d[\d\s().-]{7,}\d)\b")
_CARD = re.compile(r"\b(?:\d[ -]?){13,16}\b")
_SSN = re.compile(r"\b\d{3}-\d{2}-\d{4}\b")


@dataclass
class Redaction:
    text: str
    counts: dict[str, int]


def obfuscate(text: str) -> Redaction:
    """Return ``text`` with PII masked and whitespace normalized."""
    counts: dict[str, int] = {}

    def sub(pattern: re.Pattern[str], label: str, s: str) -> str:
        def repl(_m: re.Match[str]) -> str:
            counts[label] = counts.get(label, 0) + 1
            return f"[{label}]"

        return pattern.sub(repl, s)

    # SSN and card before the looser phone pattern so they win.
    text = sub(_EMAIL, "EMAIL", text)
    text = sub(_SSN, "SSN", text)
    text = sub(_CARD, "CARD", text)
    text = sub(_PHONE, "PHONE", text)
    text = re.sub(r"\s+", " ", text).strip()
    return Redaction(text=text, counts=counts)


if __name__ == "__main__":
    import sys

    result = obfuscate(" ".join(sys.argv[1:]))
    print(result.text)
    if result.counts:
        print("redacted:", result.counts)
