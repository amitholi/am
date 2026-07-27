"""Fan-out/fan-in query pipeline.

    User Query -> SPLITTER -> [Encoder -> Wrapper -> ApiClient] x N -> MERGER -> Report

A user query is split into N sub-queries. Each sub-query independently runs
through an Encoder (payload construction), a Wrapper (metadata/envelope), and
an ApiClient (delivery). The N responses are merged into a single Report.
The ApiClient is pluggable: HttpApiClient posts JSON over HTTP; EchoApiClient
is an offline stand-in for tests and dry runs.
"""

from __future__ import annotations

import re
import uuid
from concurrent.futures import ThreadPoolExecutor
from dataclasses import dataclass, field
from typing import Any, Callable, Protocol

import requests


# --------------------------------------------------------------------------- #
# Splitter
# --------------------------------------------------------------------------- #

class Splitter:
    """Split a user query into at most ``max_parts`` sub-queries.

    Splits on sentence boundaries and semicolons/newlines; a query with no
    such boundaries passes through as a single part.
    """

    _BOUNDARY = re.compile(r"(?<=[.!?])\s+|[;\n]+")

    def __init__(self, max_parts: int = 8):
        if max_parts < 1:
            raise ValueError("max_parts must be >= 1")
        self.max_parts = max_parts

    def split(self, query: str) -> list[str]:
        parts = [p.strip() for p in self._BOUNDARY.split(query) if p.strip()]
        if not parts:
            raise ValueError("query is empty")
        if len(parts) > self.max_parts:
            head, tail = parts[: self.max_parts - 1], parts[self.max_parts - 1 :]
            parts = head + [" ".join(tail)]
        return parts


# --------------------------------------------------------------------------- #
# Encoder / Wrapper
# --------------------------------------------------------------------------- #

class Encoder:
    """Turn one sub-query into a request payload."""

    def encode(self, sub_query: str) -> dict[str, Any]:
        return {"query": sub_query}


@dataclass
class Wrapper:
    """Wrap an encoded payload in a delivery envelope."""

    source: str = "pipeline"

    def wrap(self, payload: dict[str, Any], index: int, batch_id: str) -> dict[str, Any]:
        return {
            "id": f"{batch_id}-{index}",
            "index": index,
            "source": self.source,
            "payload": payload,
        }


# --------------------------------------------------------------------------- #
# ApiClient
# --------------------------------------------------------------------------- #

class ApiClient(Protocol):
    def send(self, envelope: dict[str, Any]) -> dict[str, Any]: ...


@dataclass
class HttpApiClient:
    """POST the envelope as JSON and return the decoded JSON response."""

    url: str
    timeout: float = 30.0
    session: requests.Session = field(default_factory=requests.Session)

    def send(self, envelope: dict[str, Any]) -> dict[str, Any]:
        response = self.session.post(self.url, json=envelope, timeout=self.timeout)
        response.raise_for_status()
        return response.json()


@dataclass
class EchoApiClient:
    """Offline client: applies ``handler`` to the sub-query (default: echo)."""

    handler: Callable[[str], str] = lambda q: f"echo: {q}"

    def send(self, envelope: dict[str, Any]) -> dict[str, Any]:
        return {"id": envelope["id"], "result": self.handler(envelope["payload"]["query"])}


# --------------------------------------------------------------------------- #
# Merger / Report
# --------------------------------------------------------------------------- #

@dataclass
class SubResult:
    index: int
    sub_query: str
    response: dict[str, Any] | None
    error: str | None = None

    @property
    def ok(self) -> bool:
        return self.error is None


@dataclass
class Report:
    query: str
    batch_id: str
    results: list[SubResult]

    @property
    def succeeded(self) -> int:
        return sum(r.ok for r in self.results)

    def render(self) -> str:
        lines = [
            f"Report {self.batch_id}",
            f"Query: {self.query}",
            f"Parts: {len(self.results)} ({self.succeeded} ok)",
            "",
        ]
        for r in self.results:
            status = "ok" if r.ok else f"ERROR: {r.error}"
            body = r.response.get("result", r.response) if r.ok else ""
            lines.append(f"[{r.index}] {r.sub_query}\n    {status} {body}".rstrip())
        return "\n".join(lines)


class Merger:
    def merge(self, query: str, batch_id: str, results: list[SubResult]) -> Report:
        return Report(query=query, batch_id=batch_id, results=sorted(results, key=lambda r: r.index))


# --------------------------------------------------------------------------- #
# Pipeline
# --------------------------------------------------------------------------- #

@dataclass
class Pipeline:
    client: ApiClient
    splitter: Splitter = field(default_factory=Splitter)
    encoder: Encoder = field(default_factory=Encoder)
    wrapper: Wrapper = field(default_factory=Wrapper)
    merger: Merger = field(default_factory=Merger)
    max_workers: int = 8

    def run(self, query: str) -> Report:
        batch_id = uuid.uuid4().hex[:8]
        parts = self.splitter.split(query)

        def one(index_part: tuple[int, str]) -> SubResult:
            index, part = index_part
            try:
                envelope = self.wrapper.wrap(self.encoder.encode(part), index, batch_id)
                return SubResult(index, part, self.client.send(envelope))
            except Exception as exc:
                return SubResult(index, part, None, error=str(exc))

        with ThreadPoolExecutor(max_workers=min(self.max_workers, len(parts))) as pool:
            results = list(pool.map(one, enumerate(parts)))

        return self.merger.merge(query, batch_id, results)


if __name__ == "__main__":
    import sys

    query = " ".join(sys.argv[1:]) or "What is momentum? How is it measured? Why does it persist?"
    print(Pipeline(client=EchoApiClient()).run(query).render())
