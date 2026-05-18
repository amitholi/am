# Stock Chat

A ChatGPT-style stock research assistant. Ask in natural language —
get live quotes, charts, news, and comparisons rendered inline as
rich cards. Built with Next.js 15, the Vercel AI SDK, and Anthropic
`claude-sonnet-4-5`.

![screenshot placeholder](./docs/screenshot.png)

## 60-second setup

```bash
# 1. Install
npm install

# 2. Configure keys (optional — DEMO_MODE works without them)
cp .env.example .env.local
# edit .env.local and add ANTHROPIC_API_KEY and FINNHUB_API_KEY

# 3. Seed a default watchlist (AAPL, MSFT, NVDA, TSLA, GOOGL)
npm run seed

# 4. Run
npm run dev
# open http://localhost:3000
```

If no `ANTHROPIC_API_KEY` is set and demo symbols are requested, the
data layer falls back to canned quotes/charts/news for AAPL, MSFT,
NVDA, TSLA, GOOGL. The chat endpoint still needs `ANTHROPIC_API_KEY`
to call the model.

## API keys

- **Anthropic** — required for the chat model. Get one at
  <https://console.anthropic.com/>.
- **Finnhub** — free tier (60 calls/min) for news + earnings.
  Sign up at <https://finnhub.io/register>. Without it, demo news
  is served for the five canned symbols.
- **Yahoo Finance** — no key required. Powers quotes, charts, and
  company profiles via `yahoo-finance2`.

## What to ask first

Try these prompts:

1. **"What's AAPL trading at right now?"** — renders a `QuoteCard`
   with price, change %, sparkline, day range.
2. **"Show me a 1-year chart for NVDA"** — renders an interactive
   `ChartCard` with toggleable range buttons (1D · 5D · 1M · 6M · 1Y · 5Y).
3. **"Compare MSFT, GOOGL, AAPL"** — renders a side-by-side
   `ComparisonTable` with price, change, market cap, P/E, yield.

More to try: *"Latest news on TSLA"*, *"What does NVIDIA do? Add it to
my watchlist."*, *"מה קורה עם אפל?"* (Hebrew is supported).

## Architecture

- **`app/api/chat/route.ts`** — AI SDK `streamText` with tool calls.
  System prompt + 8 tools are defined in `lib/ai/`.
- **Tools** (`lib/ai/tools.ts`):
  `getQuote`, `getChart`, `getCompany`, `getNews`, `compareStocks`,
  `addToWatchlist`, `removeFromWatchlist`, `getWatchlist`.
- **Data providers**: `lib/providers/yahoo.ts` (quotes, charts,
  profiles, search) and `lib/providers/finnhub.ts` (news, with a
  `p-queue` rate-limit guard).
- **Inline cards**: each tool's output renders a React component
  in the chat bubble (`components/chat/cards/*`).
- **Persistence**: `better-sqlite3` in `data/stockchat.db` holds
  the watchlist and chat history.
- **Streaming**: `@ai-sdk/react`'s `useChat` with
  `DefaultChatTransport`; tokens stream with a blinking caret.
- **Theming**: `next-themes` with Tailwind v4 + shadcn primitives.

## Scripts

| Command | What it does |
| --- | --- |
| `npm run dev` | Start Next.js dev server on port 3000 |
| `npm run build` | Production build |
| `npm start` | Run the production build |
| `npm run seed` | Insert the default watchlist into SQLite |
| `npm run typecheck` | Run `tsc --noEmit` |

## Keyboard shortcuts

- **⌘N / Ctrl+N** — new chat
- **⌘K / Ctrl+K** — focus the input

## Disclaimer

This app is for research and education only. It is not investment
advice. Quotes may be delayed.
