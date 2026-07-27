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

## Web app

```sh
npm install
npm run dev                      # Vite dev server
```
