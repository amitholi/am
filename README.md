# am

Micro-cap momentum scanner (React/Vite) plus Python utilities.

## Quick start

```sh
uv sync                          # install everything
claude                           # MCP tools auto-loaded from .mcp.json
```

`uv sync` creates `.venv/` and installs the Python dependencies from
`pyproject.toml` (pinned by `uv.lock`). Launching `claude` in the repo root
picks up the MCP servers declared in `.mcp.json` automatically:

| Server | Runs via | Purpose |
| --- | --- | --- |
| `fetch` | `uvx mcp-server-fetch` | Fetch web pages / APIs from Claude Code |
| `playwright` | `npx @playwright/mcp` | Drive a browser (e.g. to test the Vite app) |

Neither server needs an API key; both are downloaded on first use.

## Python

The `co` script (crypto momentum tracker) runs inside the uv environment:

```sh
uv run python co
```

## Query pipeline

`pipeline.py` implements a fan-out/fan-in pipeline:

```
User Query → SPLITTER → [Encoder → Wrapper → ApiClient] × N → MERGER → Report
```

The query is split into N sub-queries, each encoded, wrapped in a delivery
envelope, and sent through a pluggable `ApiClient` in parallel; responses are
merged into a `Report`. `HttpApiClient` posts JSON to any endpoint;
`EchoApiClient` runs offline for tests and demos.

```sh
uv run python pipeline.py "What drives momentum? How is it measured?"
uv run pytest                    # test suite
```

### CLI

```sh
python3 run.py decompose "query" 5   # split into <= 5 sub-queries
python3 run.py eval "query"          # run pipeline, print coverage score
python3 run.py obfuscate "text"      # redact PII, normalize whitespace
```

`obfuscate` is a defensive redaction/normalization utility (masks emails,
phone numbers, cards, SSNs) — not an adversarial transform. `eval` reports
the fraction of sub-queries the pipeline answered, as a coverage metric.

### Benchmark

`benchmark.py` measures pipeline **latency, sub-query coverage, and token
usage** over a fixed set of ordinary queries. It uses the offline echo client
by default and the live Anthropic client when `ANTHROPIC_API_KEY` (or an
`ant auth login` profile) is present.

```sh
python3 benchmark.py                     # dry run (no API key)
python3 benchmark.py --quick             # single-query smoke test
python3 benchmark.py --json report.json  # save JSON results
python3 benchmark.py --html report.html  # save HTML report
ANTHROPIC_API_KEY=sk-... python3 benchmark.py  # live test
```

It's a performance/coverage benchmark of the pipeline, not a scorer of any
model's safety behavior.

## Web app

```sh
npm install
npm run dev                      # Vite dev server
```
