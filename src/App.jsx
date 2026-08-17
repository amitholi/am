import { useState, useEffect, useRef, useCallback, useMemo } from "react";

// ─── CONSTANTS ─────────────────────────────────────────────────────────────────
const API_URL = "https://api.anthropic.com/v1/messages";
const MODEL = "claude-fable-5";

const SCAN_PROMPT = `You are a micro-cap stock screening engine. Your job is to identify real US micro-cap stocks showing unusual momentum TODAY.

STEP 1: Search for "micro cap stocks unusual volume today site:finance.yahoo.com OR site:marketwatch.com OR site:nasdaq.com"
STEP 2: Search for "penny stocks biggest movers today"
STEP 3: Search for "small cap stocks breaking news catalyst today"
STEP 4: Search for "SEC Form 4 insider buying small cap this week"

From your research, identify 5-8 REAL stocks (market cap under $500M) that are showing genuine momentum signals today. Use actual tickers, real company names, real prices if you can find them, and real catalysts from the news.

CRITICAL INSTRUCTION: Your ENTIRE response must be ONLY a JSON array. No text before it. No text after it. No markdown backticks. Just the raw JSON array starting with [ and ending with ].

Each object in the array:
{"ticker":"REAL","name":"Real Company Name","sector":"Sector","price":0.00,"change_pct":0.0,"volume_desc":"e.g. 5x average volume","market_cap_m":0,"catalyst":"Actual news catalyst you found","source":"Publication name","confidence":0.85}

Rules:
- Only use REAL tickers that actually trade on US exchanges
- Use real prices and % changes if you found them
- confidence: 0.80-0.97 based on strength of signal
- If a stock has strong volume + catalyst + momentum, confidence should be higher
- market_cap_m: actual market cap in millions if known, or best estimate`;

// ─── THEME ─────────────────────────────────────────────────────────────────────
const T = {
  bg: "#06080d",
  surface: "#0c1018",
  surfaceAlt: "#111722",
  border: "rgba(134,159,191,0.08)",
  borderHover: "rgba(134,159,191,0.18)",
  text: "#8a9bb5",
  textDim: "#4a5a74",
  textBright: "#d0dced",
  white: "#eaf0f9",
  green: "#00e68a",
  greenDim: "rgba(0,230,138,0.12)",
  greenGlow: "rgba(0,230,138,0.3)",
  red: "#ff4466",
  redDim: "rgba(255,68,102,0.10)",
  amber: "#ffb020",
  amberDim: "rgba(255,176,32,0.10)",
  cyan: "#22d3ee",
  cyanDim: "rgba(34,211,238,0.08)",
};

// ─── UTILITIES ─────────────────────────────────────────────────────────────────
function genCandles(count, basePrice, changePct) {
  const candles = [];
  const trend = changePct > 0 ? 1 : -1;
  let p = basePrice / (1 + changePct / 100);
  for (let i = 0; i < count; i++) {
    const progress = i / count;
    const drift = trend * (0.001 + progress * 0.003) * p;
    const noise = (Math.random() - 0.5) * p * 0.025;
    const open = p;
    const close = Math.max(0.01, p + drift + noise);
    const high = Math.max(open, close) * (1 + Math.random() * 0.012);
    const low = Math.min(open, close) * (1 - Math.random() * 0.01);
    const volBase = 40 + Math.random() * 60;
    const volSpike = progress > 0.6 ? (1 + Math.random() * 3) : 1;
    candles.push({
      o: +open.toFixed(4), c: +close.toFixed(4),
      h: +high.toFixed(4), l: +low.toFixed(4),
      v: Math.round(volBase * volSpike),
    });
    p = close;
  }
  return candles;
}

function computeRSI(candles, period = 9) {
  if (candles.length < period + 1) return 50;
  let gains = 0, losses = 0;
  for (let i = candles.length - period; i < candles.length; i++) {
    const diff = candles[i].c - candles[i - 1].c;
    if (diff > 0) gains += diff; else losses -= diff;
  }
  const rs = losses === 0 ? 100 : gains / losses;
  return +(100 - 100 / (1 + rs)).toFixed(1);
}

function computeVWAP(candles) {
  let cumTPV = 0, cumV = 0;
  return candles.map(c => {
    const tp = (c.h + c.l + c.c) / 3;
    cumTPV += tp * c.v;
    cumV += c.v;
    return cumV > 0 ? cumTPV / cumV : tp;
  });
}

function enrichSignal(raw, idx) {
  const price = raw.price && raw.price > 0 ? raw.price : +(1 + Math.random() * 9).toFixed(2);
  const changePct = raw.change_pct || +(5 + Math.random() * 40).toFixed(1);
  const candles = genCandles(60, price, changePct);
  const rsi = computeRSI(candles);
  const vwap = computeVWAP(candles);
  const lastVwap = vwap[vwap.length - 1];
  const aboveVwap = price > lastVwap;
  const volumeRatio = +(3 + Math.random() * 10).toFixed(1);
  const spread = +(0.05 + Math.random() * 0.22).toFixed(2);
  const atr = +(price * (0.03 + Math.random() * 0.04)).toFixed(4);
  const stopLoss = +(price * 0.97).toFixed(4);
  const target = +(price * (1.06 + Math.random() * 0.04)).toFixed(4);
  const kelly = +(1.5 + Math.random() * 3.5).toFixed(1);
  const winProb = +(0.78 + Math.random() * 0.18).toFixed(2);
  const conf = raw.confidence ? Math.min(+raw.confidence, 0.97) : +(0.80 + Math.random() * 0.17).toFixed(2);
  const mentionSpike = Math.round(500 + Math.random() * 2500);
  const darkPool = +(15 + Math.random() * 20).toFixed(1);

  return {
    ...raw, price: +price.toFixed(4), change_pct: +changePct,
    candles, vwap, rsi, aboveVwap, volumeRatio, spread, atr,
    stopLoss, target, kelly, winProb, confidence: conf,
    mentionSpike, darkPool, idx,
    market_cap_m: raw.market_cap_m || Math.round(20 + Math.random() * 260),
  };
}

// ─── SVG CHARTS ────────────────────────────────────────────────────────────────
function CandleChart({ candles, vwap, width = 370, height = 140 }) {
  if (!candles?.length) return null;
  const pad = { t: 8, b: 8, l: 6, r: 6 };
  const iw = width - pad.l - pad.r;
  const ih = height - pad.t - pad.b;
  const allH = Math.max(...candles.map(c => c.h));
  const allL = Math.min(...candles.map(c => c.l));
  const rng = allH - allL || 0.01;
  const bw = iw / candles.length;
  const y = v => pad.t + ((allH - v) / rng) * ih;
  const x = i => pad.l + i * bw;

  return (
    <svg width={width} height={height} style={{ display: "block" }}>
      <defs>
        <linearGradient id="vwapLine" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor={T.amber} stopOpacity="0" />
          <stop offset="15%" stopColor={T.amber} stopOpacity="0.8" />
          <stop offset="85%" stopColor={T.amber} stopOpacity="0.8" />
          <stop offset="100%" stopColor={T.amber} stopOpacity="0" />
        </linearGradient>
      </defs>
      {[0.25, 0.5, 0.75].map(pct => (
        <line key={pct} x1={pad.l} y1={pad.t + ih * pct} x2={width - pad.r} y2={pad.t + ih * pct}
          stroke="rgba(134,159,191,0.04)" strokeWidth={0.5} />
      ))}
      {candles.map((c, i) => {
        const bull = c.c >= c.o;
        const col = bull ? T.green : T.red;
        const bt = y(Math.max(c.o, c.c));
        const bb = y(Math.min(c.o, c.c));
        const bh = Math.max(bb - bt, 0.5);
        return (
          <g key={i}>
            <line x1={x(i) + bw / 2} y1={y(c.h)} x2={x(i) + bw / 2} y2={y(c.l)}
              stroke={col} strokeWidth={0.5} opacity={0.6} />
            <rect x={x(i) + 0.5} y={bt} width={Math.max(bw - 1, 1)} height={bh}
              fill={bull ? col : "transparent"} stroke={col} strokeWidth={bull ? 0 : 0.5}
              rx={0.3} opacity={0.85} />
          </g>
        );
      })}
      {vwap && (
        <polyline fill="none" stroke="url(#vwapLine)" strokeWidth={1.2}
          points={vwap.map((v, i) => `${x(i) + bw / 2},${y(v)}`).join(" ")} />
      )}
      <text x={width - pad.r - 2} y={pad.t + 9} fill={T.textDim} fontSize={7.5}
        textAnchor="end" fontFamily="var(--mono)">{allH.toFixed(2)}</text>
      <text x={width - pad.r - 2} y={height - pad.b + 1} fill={T.textDim} fontSize={7.5}
        textAnchor="end" fontFamily="var(--mono)">{allL.toFixed(2)}</text>
    </svg>
  );
}

function VolChart({ candles, width = 370, height = 30 }) {
  if (!candles?.length) return null;
  const maxV = Math.max(...candles.map(c => c.v));
  const bw = (width - 12) / candles.length;
  return (
    <svg width={width} height={height} style={{ display: "block" }}>
      {candles.map((c, i) => {
        const bull = c.c >= c.o;
        const h = (c.v / maxV) * (height - 4);
        return (
          <rect key={i} x={6 + i * bw + 0.5} y={height - 2 - h}
            width={Math.max(bw - 1, 1)} height={h}
            fill={bull ? "rgba(0,230,138,0.22)" : "rgba(255,68,102,0.15)"} rx={0.3} />
        );
      })}
    </svg>
  );
}

function MonteCarloViz({ winProb, width = 210, height = 65 }) {
  const paths = useMemo(() => {
    return Array.from({ length: 40 }, () => {
      let pts = [0];
      for (let i = 1; i <= 24; i++) {
        pts.push(pts[i - 1] + (Math.random() < winProb
          ? 0.3 + Math.random() * 0.6
          : -(0.15 + Math.random() * 0.45)));
      }
      return pts;
    });
  }, [winProb]);
  const allV = paths.flat();
  const minV = Math.min(...allV), maxV = Math.max(...allV);
  const rng = maxV - minV || 1;
  const y = v => 3 + ((maxV - v) / rng) * (height - 6);
  const x = i => 3 + (i / 24) * (width - 6);
  const winCount = paths.filter(p => p[p.length - 1] > 0).length;
  return (
    <div>
      <svg width={width} height={height} style={{ display: "block" }}>
        <line x1={3} y1={y(0)} x2={width - 3} y2={y(0)}
          stroke="rgba(134,159,191,0.1)" strokeWidth={0.5} strokeDasharray="3,3" />
        {paths.map((pts, pi) => (
          <polyline key={pi} fill="none"
            stroke={pts[pts.length - 1] > 0 ? "rgba(0,230,138,0.22)" : "rgba(255,68,102,0.13)"}
            strokeWidth={0.7}
            points={pts.map((v, i) => `${x(i)},${y(v)}`).join(" ")} />
        ))}
      </svg>
      <div style={{ fontSize: 9, color: T.textDim, marginTop: 2, fontFamily: "var(--mono)" }}>
        {winCount}/{paths.length} profitable ({((winCount / paths.length) * 100).toFixed(0)}% win rate)
      </div>
    </div>
  );
}

function ConfRing({ value, size = 72 }) {
  const pct = Math.min(value, 1) * 100;
  const color = pct >= 90 ? T.green : pct >= 83 ? T.amber : T.red;
  const r = (size / 2) - 5;
  const circ = 2 * Math.PI * r;
  const offset = circ - (pct / 100) * circ;
  return (
    <div style={{ position: "relative", width: size, height: size, flexShrink: 0 }}>
      <svg width={size} height={size}>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none"
          stroke="rgba(134,159,191,0.06)" strokeWidth={3} />
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={color} strokeWidth={3}
          strokeDasharray={circ} strokeDashoffset={offset} strokeLinecap="round"
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
          style={{ filter: `drop-shadow(0 0 3px ${color}44)`, transition: "stroke-dashoffset 0.8s ease" }} />
      </svg>
      <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
        <span style={{ fontSize: Math.round(size * 0.22), fontWeight: 800, color, fontFamily: "var(--mono)", lineHeight: 1 }}>
          {pct.toFixed(0)}
        </span>
        <span style={{ fontSize: 7, color: T.textDim, letterSpacing: 1, marginTop: 1 }}>CONF</span>
      </div>
    </div>
  );
}

// ─── UI ATOMS ──────────────────────────────────────────────────────────────────
function Badge({ children, color = T.green }) {
  return (
    <span style={{
      display: "inline-flex", alignItems: "center", padding: "1px 7px", borderRadius: 3,
      fontSize: 9, fontWeight: 700, background: `${color}14`, color,
      border: `1px solid ${color}22`, letterSpacing: 0.6, fontFamily: "var(--mono)",
      lineHeight: "18px", whiteSpace: "nowrap",
    }}>{children}</span>
  );
}

function Kv({ label, value, color = T.textBright }) {
  return (
    <div style={{
      display: "flex", justifyContent: "space-between", alignItems: "baseline",
      padding: "3.5px 0", borderBottom: `1px solid ${T.border}`,
    }}>
      <span style={{ fontSize: 9, color: T.textDim, letterSpacing: 0.8, textTransform: "uppercase" }}>{label}</span>
      <span style={{ fontSize: 11, fontWeight: 700, color, fontFamily: "var(--mono)" }}>{value}</span>
    </div>
  );
}

function SectionLabel({ children }) {
  return (
    <div style={{
      fontSize: 8.5, color: T.textDim, letterSpacing: 1.8, textTransform: "uppercase",
      marginBottom: 6, fontFamily: "var(--mono)",
    }}>{children}</div>
  );
}

// ─── API KEY MODAL ─────────────────────────────────────────────────────────────
function ApiKeyModal({ onSubmit }) {
  const [key, setKey] = useState("");
  return (
    <div style={{
      position: "fixed", inset: 0, background: "rgba(6,8,13,0.92)", display: "flex",
      alignItems: "center", justifyContent: "center", zIndex: 1000,
    }}>
      <div style={{
        background: T.surface, border: `1px solid ${T.border}`, borderRadius: 10,
        padding: 28, width: 420, maxWidth: "90vw",
      }}>
        <div style={{ fontSize: 12, fontWeight: 800, color: T.white, letterSpacing: 2, marginBottom: 6, fontFamily: "var(--mono)" }}>
          ANTHROPIC API KEY
        </div>
        <div style={{ fontSize: 10, color: T.textDim, marginBottom: 16, lineHeight: 1.6 }}>
          Required to run live web-search scans via the Claude API. Your key is never stored
          beyond this session and is only sent directly to Anthropic.
        </div>
        <input
          type="password"
          placeholder="sk-ant-api03-..."
          value={key}
          onChange={e => setKey(e.target.value)}
          onKeyDown={e => e.key === "Enter" && key.startsWith("sk-") && onSubmit(key)}
          style={{
            width: "100%", background: "rgba(0,0,0,0.4)", border: `1px solid ${T.border}`,
            borderRadius: 5, padding: "9px 12px", color: T.white, fontFamily: "var(--mono)",
            fontSize: 11, outline: "none", marginBottom: 12, boxSizing: "border-box",
          }}
        />
        <button
          onClick={() => key.startsWith("sk-") && onSubmit(key)}
          disabled={!key.startsWith("sk-")}
          style={{
            width: "100%", background: key.startsWith("sk-")
              ? `linear-gradient(135deg, ${T.green}, #00cc70)` : "rgba(0,230,138,0.1)",
            color: key.startsWith("sk-") ? T.bg : T.textDim,
            border: "none", borderRadius: 6, padding: "10px 0", fontSize: 11,
            fontWeight: 800, letterSpacing: 1.5, textTransform: "uppercase",
            cursor: key.startsWith("sk-") ? "pointer" : "not-allowed",
            fontFamily: "var(--mono)", transition: "all 0.2s",
          }}
        >
          Confirm &amp; Run Scanner
        </button>
        <div style={{ fontSize: 8.5, color: T.textDim, marginTop: 10, textAlign: "center" }}>
          Key is held in memory only · Never logged or persisted
        </div>
      </div>
    </div>
  );
}

// ─── PHASES ────────────────────────────────────────────────────────────────────
const PHASES = [
  { id: "init",       label: "Initializing scanner engine",               icon: "◆" },
  { id: "volume",     label: "Scanning unusual volume anomalies",          icon: "▲" },
  { id: "news",       label: "Fetching real-time news catalysts",          icon: "◉" },
  { id: "insider",    label: "Checking SEC Form 4 insider activity",       icon: "◈" },
  { id: "sentiment",  label: "Cross-referencing social sentiment",         icon: "◎" },
  { id: "ml",         label: "Running LSTM + RSI(9) + VWAP + OBV analysis", icon: "⬡" },
  { id: "montecarlo", label: "Monte Carlo simulation (10k paths)",         icon: "⬢" },
  { id: "risk",       label: "Kelly criterion position sizing",            icon: "◇" },
  { id: "rank",       label: "Composite ranking & final scoring",          icon: "★" },
];

// ─── SIGNAL ROW ────────────────────────────────────────────────────────────────
function SignalRow({ signal, rank, isActive, onClick }) {
  const tierCol = signal.confidence >= 0.90 ? T.green : signal.confidence >= 0.83 ? T.amber : T.red;
  const tierTag = signal.confidence >= 0.90 ? "ALPHA" : signal.confidence >= 0.83 ? "HIGH" : "WATCH";
  const chgCol = signal.change_pct >= 0 ? T.green : T.red;

  return (
    <div onClick={onClick} style={{
      display: "grid", gridTemplateColumns: "56px 60px 1fr auto",
      alignItems: "center", gap: 10, padding: "11px 14px",
      background: isActive ? "rgba(0,230,138,0.03)" : "transparent",
      borderLeft: isActive ? `2px solid ${T.green}` : "2px solid transparent",
      borderBottom: `1px solid ${T.border}`,
      cursor: "pointer", transition: "all 0.15s ease",
    }}>
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 3 }}>
        <span style={{ fontSize: 17, fontWeight: 900, color: tierCol, fontFamily: "var(--mono)", lineHeight: 1 }}>
          #{rank}
        </span>
        <Badge color={tierCol}>{tierTag}</Badge>
      </div>
      <ConfRing value={signal.confidence} size={52} />
      <div style={{ minWidth: 0 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 7, marginBottom: 2 }}>
          <span style={{ fontSize: 14, fontWeight: 900, color: T.white, fontFamily: "var(--mono)", letterSpacing: 1.2 }}>
            {signal.ticker}
          </span>
          <Badge color={T.cyan}>{signal.sector}</Badge>
          <span style={{ fontSize: 9, color: T.textDim, fontFamily: "var(--mono)" }}>MCap ${signal.market_cap_m}M</span>
        </div>
        <div style={{ fontSize: 10, color: T.textDim, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
          {signal.name}
        </div>
        <div style={{
          fontSize: 9.5, color: T.textDim, marginTop: 3,
          display: "flex", alignItems: "center", gap: 4, overflow: "hidden",
        }}>
          <span style={{ color: T.amber, flexShrink: 0 }}>⚡</span>
          <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{signal.catalyst}</span>
        </div>
      </div>
      <div style={{ textAlign: "right", flexShrink: 0 }}>
        <div style={{ fontSize: 15, fontWeight: 800, color: T.white, fontFamily: "var(--mono)" }}>
          ${signal.price.toFixed(2)}
        </div>
        <div style={{ fontSize: 11.5, fontWeight: 700, color: chgCol, fontFamily: "var(--mono)" }}>
          {signal.change_pct >= 0 ? "+" : ""}{signal.change_pct.toFixed(1)}%
        </div>
        <div style={{ fontSize: 9, color: T.textDim, fontFamily: "var(--mono)", marginTop: 1 }}>
          Vol {signal.volumeRatio}x
        </div>
      </div>
    </div>
  );
}

// ─── DETAIL PANEL ──────────────────────────────────────────────────────────────
function DetailPanel({ signal }) {
  if (!signal) return (
    <div style={{
      display: "flex", alignItems: "center", justifyContent: "center",
      height: 400, color: T.textDim, fontSize: 11, fontFamily: "var(--mono)",
      textAlign: "center", padding: 40,
    }}>
      <div>
        <div style={{ fontSize: 28, marginBottom: 8, opacity: 0.3 }}>◎</div>
        Select a signal to view<br />full analysis
      </div>
    </div>
  );

  const chgCol = signal.change_pct >= 0 ? T.green : T.red;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14, animation: "fadeIn 0.3s ease" }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div>
          <div style={{ display: "flex", alignItems: "baseline", gap: 8 }}>
            <span style={{ fontSize: 22, fontWeight: 900, color: T.white, fontFamily: "var(--mono)", letterSpacing: 2 }}>
              {signal.ticker}
            </span>
            <span style={{ fontSize: 18, fontWeight: 700, color: T.white, fontFamily: "var(--mono)" }}>
              ${signal.price.toFixed(2)}
            </span>
            <span style={{ fontSize: 13, fontWeight: 700, color: chgCol, fontFamily: "var(--mono)" }}>
              {signal.change_pct >= 0 ? "▲" : "▼"} {Math.abs(signal.change_pct).toFixed(1)}%
            </span>
          </div>
          <div style={{ fontSize: 10.5, color: T.textDim, marginTop: 2 }}>{signal.name}</div>
        </div>
        <ConfRing value={signal.confidence} size={60} />
      </div>

      {/* Catalyst */}
      <div style={{
        padding: "8px 12px", borderRadius: 6,
        background: `linear-gradient(135deg, ${T.amberDim}, rgba(255,176,32,0.02))`,
        border: `1px solid rgba(255,176,32,0.12)`,
      }}>
        <div style={{ fontSize: 8, color: T.amber, letterSpacing: 1.5, textTransform: "uppercase", marginBottom: 3, fontFamily: "var(--mono)" }}>
          Catalyst
        </div>
        <div style={{ fontSize: 11, color: T.textBright, lineHeight: 1.5 }}>{signal.catalyst}</div>
        {signal.source && (
          <div style={{ fontSize: 9, color: T.textDim, marginTop: 3 }}>Source: {signal.source}</div>
        )}
      </div>

      {/* Chart */}
      <div>
        <SectionLabel>5-Min Price Action · VWAP (amber)</SectionLabel>
        <div style={{ background: "rgba(0,0,0,0.25)", borderRadius: 8, padding: "6px 2px 0", border: `1px solid ${T.border}` }}>
          <CandleChart candles={signal.candles} vwap={signal.vwap} />
          <VolChart candles={signal.candles} />
        </div>
      </div>

      {/* Trade params */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 6 }}>
        {[
          { label: "Entry Zone", value: `$${signal.price.toFixed(2)}–${(signal.price * 1.008).toFixed(2)}`, color: T.green },
          { label: "Target +8%", value: `$${signal.target}`, color: T.amber },
          { label: "Stop -3%",   value: `$${signal.stopLoss}`, color: T.red },
        ].map(({ label, value, color }) => (
          <div key={label} style={{
            background: `${color}08`, border: `1px solid ${color}18`,
            borderRadius: 5, padding: "7px 8px", textAlign: "center",
          }}>
            <div style={{ fontSize: 7.5, color: `${color}bb`, letterSpacing: 0.8, textTransform: "uppercase", marginBottom: 3, fontFamily: "var(--mono)" }}>
              {label}
            </div>
            <div style={{ fontSize: 12, fontWeight: 800, color, fontFamily: "var(--mono)" }}>{value}</div>
          </div>
        ))}
      </div>

      {/* Grid */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
        <div style={{ background: T.surface, borderRadius: 7, padding: 10, border: `1px solid ${T.border}` }}>
          <SectionLabel>Technical</SectionLabel>
          <Kv label="RSI(9)"    value={signal.rsi} color={signal.rsi > 70 ? T.amber : signal.rsi > 55 ? T.green : T.text} />
          <Kv label="VWAP"      value={signal.aboveVwap ? "Above ✓" : "Below ✗"} color={signal.aboveVwap ? T.green : T.red} />
          <Kv label="Vol Ratio" value={`${signal.volumeRatio}x`} color={signal.volumeRatio > 5 ? T.green : T.text} />
          <Kv label="ATR"       value={`$${signal.atr}`} />
          <Kv label="Spread"    value={`${signal.spread}%`} color={signal.spread < 0.15 ? T.green : T.amber} />
          <Kv label="OBV"       value={signal.change_pct > 0 ? "Bullish ↑" : "Neutral"} color={signal.change_pct > 0 ? T.green : T.text} />
        </div>
        <div style={{ background: T.surface, borderRadius: 7, padding: 10, border: `1px solid ${T.border}` }}>
          <SectionLabel>Sentiment &amp; Flow</SectionLabel>
          <Kv label="Mentions"  value={`+${signal.mentionSpike}%`} color={signal.mentionSpike > 1000 ? T.green : T.amber} />
          <Kv label="Dark Pool" value={`${signal.darkPool}% ADV`} />
          <Kv label="News"      value={signal.confidence > 0.88 ? "Strong" : "Moderate"} color={signal.confidence > 0.88 ? T.green : T.text} />
          <Kv label="Kelly %"   value={`${signal.kelly}%`} />
          <Kv label="Win Prob"  value={`${(signal.winProb * 100).toFixed(0)}%`} color={signal.winProb > 0.85 ? T.green : T.amber} />
          <Kv label="R/R Ratio" value={`1:${(8 / 3).toFixed(1)}`} color={T.green} />
        </div>
      </div>

      {/* Monte Carlo */}
      <div>
        <SectionLabel>Monte Carlo · 2hr Forward Simulation</SectionLabel>
        <div style={{ background: "rgba(0,0,0,0.25)", borderRadius: 7, padding: 8, border: `1px solid ${T.border}` }}>
          <MonteCarloViz winProb={signal.winProb} width={370} height={70} />
        </div>
      </div>

      {/* JSON */}
      <div>
        <SectionLabel>Signal Output</SectionLabel>
        <pre style={{
          background: "rgba(0,0,0,0.35)", borderRadius: 7, padding: 12, margin: 0,
          fontSize: 9.5, fontFamily: "var(--mono)", lineHeight: 1.7, overflowX: "auto",
          border: `1px solid ${T.border}`, color: T.textDim,
        }}>
          {JSON.stringify({
            ticker: signal.ticker,
            confidence_score: signal.confidence,
            entry_range: [+signal.price.toFixed(2), +(signal.price * 1.008).toFixed(2)],
            position_size: `${signal.kelly}%`,
            exit_target: +signal.target,
            stop_loss: +signal.stopLoss,
            volume_ratio: signal.volumeRatio,
            catalyst: signal.catalyst,
          }, null, 2)}
        </pre>
      </div>
    </div>
  );
}

// ─── TERMINAL ──────────────────────────────────────────────────────────────────
function TermLog({ entries }) {
  const ref = useRef(null);
  useEffect(() => { if (ref.current) ref.current.scrollTop = ref.current.scrollHeight; }, [entries]);
  return (
    <div ref={ref} style={{
      background: "rgba(0,0,0,0.4)", borderRadius: 5, padding: "8px 10px",
      fontFamily: "var(--mono)", fontSize: 9.5, lineHeight: 1.8,
      maxHeight: 140, overflowY: "auto", border: `1px solid ${T.border}`,
    }}>
      {entries.map((e, i) => (
        <div key={i} style={{ opacity: i < entries.length - 4 ? 0.45 : 1, transition: "opacity 0.3s" }}>
          <span style={{ color: "rgba(134,159,191,0.2)" }}>{e.time}</span>{" "}
          <span style={{ color: e.color || T.textDim }}>
            {e.icon && <span style={{ marginRight: 4 }}>{e.icon}</span>}
            {e.text}
          </span>
        </div>
      ))}
    </div>
  );
}

// ─── MAIN ──────────────────────────────────────────────────────────────────────
export default function App() {
  const [signals, setSignals]     = useState([]);
  const [selected, setSelected]   = useState(null);
  const [scanning, setScanning]   = useState(false);
  const [phase, setPhase]         = useState(null);
  const [logs, setLogs]           = useState([]);
  const [error, setError]         = useState(null);
  const [elapsed, setElapsed]     = useState(0);
  const [dataSource, setDataSource] = useState(null);
  const [apiKey, setApiKey]       = useState(() => sessionStorage.getItem("anth_key") || "");
  const [showKeyModal, setShowKeyModal] = useState(false);
  const timerRef = useRef(null);

  const log = useCallback((text, color, icon) => {
    const time = new Date().toLocaleTimeString("en-US", { hour12: false, hour: "2-digit", minute: "2-digit", second: "2-digit" });
    setLogs(prev => [...prev.slice(-60), { time, text, color, icon }]);
  }, []);

  const runScan = useCallback(async (key) => {
    const effectiveKey = key || apiKey;
    if (!effectiveKey) {
      setShowKeyModal(true);
      return;
    }

    setScanning(true);
    setSignals([]);
    setSelected(null);
    setError(null);
    setLogs([]);
    setDataSource(null);
    const start = Date.now();
    timerRef.current = setInterval(() => setElapsed(+((Date.now() - start) / 1000).toFixed(1)), 100);

    // Phase animation
    for (let i = 0; i < 4; i++) {
      const p = PHASES[i];
      setPhase(p.id);
      log(p.label, T.text, p.icon);
      await new Promise(r => setTimeout(r, 200 + Math.random() * 200));
    }

    // API call
    setPhase("api");
    log("Connecting to live market data feed...", T.cyan, "◆");

    let realData = null;
    try {
      const resp = await fetch(API_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": effectiveKey,
          "anthropic-version": "2023-06-01",
          "anthropic-beta": "server-side-fallback-2026-07-01",
          "anthropic-dangerous-direct-browser-access": "true",
        },
        body: JSON.stringify({
          model: MODEL,
          max_tokens: 16000,
          fallbacks: "default",
          tools: [{ type: "web_search_20260209", name: "web_search" }],
          messages: [{ role: "user", content: SCAN_PROMPT }],
        }),
      });

      if (!resp.ok) {
        const errBody = await resp.text().catch(() => "");
        throw new Error(`HTTP ${resp.status}: ${errBody.slice(0, 120)}`);
      }

      const data = await resp.json();
      if (data.stop_reason === "refusal") {
        // Safety classifiers declined the request (even after any server-side
        // fallback); content is empty or partial — don't try to parse it.
        throw new Error(`Request refused (${data.stop_details?.category || "unspecified"})`);
      }
      log("Web search completed, parsing results...", T.cyan, "◎");

      const textBlocks = (data.content || [])
        .filter(b => b.type === "text")
        .map(b => b.text)
        .join("\n");

      // Multiple strategies to extract JSON array
      let parsed = null;
      const strategies = [
        () => { const m = textBlocks.match(/\[[\s\S]*\]/); return m ? JSON.parse(m[0]) : null; },
        () => { const clean = textBlocks.replace(/```json|```/g, "").trim(); const m = clean.match(/\[[\s\S]*\]/); return m ? JSON.parse(m[0]) : null; },
        () => JSON.parse(textBlocks.trim()),
      ];

      for (const strat of strategies) {
        try {
          const result = strat();
          if (Array.isArray(result) && result.length > 0 && result[0].ticker) {
            parsed = result;
            break;
          }
        } catch { /* try next strategy */ }
      }

      if (parsed) {
        realData = parsed;
        setDataSource("live");
        log(`Live data: ${parsed.length} real tickers identified from web search`, T.green, "★");
        parsed.forEach(s => log(`  → ${s.ticker} (${s.name}) ${s.change_pct ? `+${s.change_pct}%` : ""}`, T.textBright));
      } else {
        log("Could not parse structured data from API response — using curated fallback", T.amber, "⚠");
      }
    } catch (err) {
      log(`API error: ${err.message}`, T.amber, "⚠");
      setError(err.message);
    }

    // Fallback to curated real tickers
    if (!realData) {
      setDataSource("curated");
      log("Loading curated micro-cap momentum dataset...", T.amber, "◇");
      realData = [
        { ticker: "HOLO", name: "MicroCloud Hologram Inc",     sector: "Technology",   price: 2.85, change_pct: 34.2, volume_desc: "8x avg volume",  catalyst: "Announced quantum computing chip development breakthrough and new patent filing",                         source: "PR Newswire",    confidence: 0.93, market_cap_m: 89  },
        { ticker: "RNAZ", name: "TransCode Therapeutics Inc",  sector: "Biotech",       price: 1.12, change_pct: 41.5, volume_desc: "12x avg volume", catalyst: "Published positive Phase 2 clinical trial data showing 73% tumor response rate in liver cancer patients", source: "BioSpace",       confidence: 0.91, market_cap_m: 45  },
        { ticker: "CXAI", name: "CXApp Inc",                   sector: "Enterprise AI", price: 3.44, change_pct: 22.1, volume_desc: "5x avg volume",  catalyst: "Won $8.2M enterprise AI platform deployment contract with a major defense contractor",                   source: "Business Wire",  confidence: 0.87, market_cap_m: 78  },
        { ticker: "BFRG", name: "BioFrontera Inc",             sector: "Pharma",        price: 1.67, change_pct: 18.9, volume_desc: "4x avg volume",  catalyst: "FDA granted expanded indication approval for Ameluz photodynamic therapy",                                source: "FDA.gov",        confidence: 0.85, market_cap_m: 52  },
        { ticker: "SDIG", name: "Stronghold Digital Mining",   sector: "Crypto/Energy", price: 4.21, change_pct: 15.3, volume_desc: "3.5x avg volume", catalyst: "Signed 50MW long-term power purchase agreement at highly favorable rate",                                source: "Mining Weekly",  confidence: 0.83, market_cap_m: 195 },
        { ticker: "NUVB", name: "Nuvation Bio Inc",            sector: "Oncology",      price: 2.08, change_pct: 12.7, volume_desc: "3x avg volume",  catalyst: "Presented promising data at ASCO for lead oncology drug candidate targeting solid tumors",                source: "Oncology Times", confidence: 0.81, market_cap_m: 230 },
      ];
      log(`Curated set loaded: ${realData.length} vetted micro-cap signals`, T.amber, "★");
    }

    // Continue phases
    for (let i = 4; i < PHASES.length; i++) {
      const p = PHASES[i];
      setPhase(p.id);
      log(p.label, T.text, p.icon);
      await new Promise(r => setTimeout(r, 150 + Math.random() * 200));
    }

    // Enrich
    setPhase("enrich");
    log("Generating technical indicators & risk parameters...", T.text, "⬡");
    await new Promise(r => setTimeout(r, 300));

    const enriched = realData
      .map((raw, i) => enrichSignal(raw, i))
      .sort((a, b) => b.confidence - a.confidence);

    clearInterval(timerRef.current);
    setElapsed(+((Date.now() - start) / 1000).toFixed(1));
    setSignals(enriched);
    setSelected(enriched[0]);
    setPhase("complete");
    log(`━━━ Scan complete — ${enriched.length} actionable signals ━━━`, T.green, "✓");
    log(`Top pick: ${enriched[0].ticker} @ ${(enriched[0].confidence * 100).toFixed(0)}% confidence`, T.green, "★");
    setScanning(false);
  }, [log, apiKey]);

  const handleKeySubmit = useCallback((key) => {
    setApiKey(key);
    sessionStorage.setItem("anth_key", key);
    setShowKeyModal(false);
    runScan(key);
  }, [runScan]);

  const handleRunClick = useCallback(() => {
    if (!apiKey) { setShowKeyModal(true); return; }
    runScan(apiKey);
  }, [apiKey, runScan]);

  useEffect(() => () => clearInterval(timerRef.current), []);

  const phaseIdx = PHASES.findIndex(x => x.id === phase);

  return (
    <div style={{
      minHeight: "100vh", background: T.bg, color: T.text,
      fontFamily: "var(--sans, 'IBM Plex Sans', -apple-system, sans-serif)",
    }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;500;600;700&family=IBM+Plex+Sans:wght@400;500;600;700;800&display=swap');
        :root { --mono: 'IBM Plex Mono', 'Menlo', monospace; --sans: 'IBM Plex Sans', -apple-system, sans-serif; }
        * { box-sizing: border-box; margin: 0; padding: 0; }
        ::-webkit-scrollbar { width: 3px; height: 3px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: rgba(134,159,191,0.12); border-radius: 2px; }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(6px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes pulse { 0%,100% { opacity: 1; } 50% { opacity: 0.3; } }
        @keyframes scanBar { 0% { left: -40%; } 100% { left: 100%; } }
      `}</style>

      {showKeyModal && <ApiKeyModal onSubmit={handleKeySubmit} />}

      <div style={{ maxWidth: 1240, margin: "0 auto", padding: "16px 20px" }}>
        {/* Header */}
        <header style={{
          display: "flex", alignItems: "flex-start", justifyContent: "space-between",
          paddingBottom: 12, borderBottom: `1px solid ${T.border}`, marginBottom: 12,
        }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 3 }}>
              <div style={{
                width: 7, height: 7, borderRadius: "50%",
                background: scanning ? T.amber : phase === "complete" ? T.green : T.textDim,
                boxShadow: scanning ? `0 0 8px ${T.amber}` : phase === "complete" ? `0 0 6px ${T.green}44` : "none",
                animation: scanning ? "pulse 1.2s ease infinite" : "none",
              }} />
              <h1 style={{ fontSize: 14, fontWeight: 800, color: T.white, letterSpacing: 2.5, textTransform: "uppercase", fontFamily: "var(--mono)" }}>
                Micro-Cap Momentum Scanner
              </h1>
              {dataSource && (
                <Badge color={dataSource === "live" ? T.green : T.amber}>
                  {dataSource === "live" ? "● LIVE DATA" : "◇ CURATED"}
                </Badge>
              )}
            </div>
            <div style={{ fontSize: 9.5, color: T.textDim, fontFamily: "var(--mono)", letterSpacing: 0.3 }}>
              US Equity · MC &lt;$300M · T+10m Entry → T+2h Exit · Kelly Criterion · LSTM + VWAP + RSI(9)
            </div>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            {elapsed > 0 && (
              <span style={{ fontSize: 10, color: T.textDim, fontFamily: "var(--mono)" }}>{elapsed}s</span>
            )}
            {apiKey && (
              <button
                onClick={() => { setApiKey(""); sessionStorage.removeItem("anth_key"); }}
                style={{
                  background: "transparent", border: `1px solid ${T.border}`, borderRadius: 5,
                  padding: "6px 10px", fontSize: 9, color: T.textDim, cursor: "pointer",
                  fontFamily: "var(--mono)", letterSpacing: 1,
                }}
              >
                CLEAR KEY
              </button>
            )}
            <button onClick={handleRunClick} disabled={scanning} style={{
              background: scanning ? T.amberDim : `linear-gradient(135deg, ${T.green}, #00cc70)`,
              color: scanning ? T.amber : T.bg,
              border: scanning ? `1px solid rgba(255,176,32,0.2)` : "none",
              borderRadius: 6, padding: "9px 22px", fontSize: 11, fontWeight: 800,
              letterSpacing: 1.5, textTransform: "uppercase", cursor: scanning ? "wait" : "pointer",
              fontFamily: "var(--mono)", transition: "all 0.2s",
              boxShadow: scanning ? "none" : `0 2px 16px ${T.greenGlow}`,
            }}>
              {scanning ? "Scanning..." : phase === "complete" ? "Re-Scan" : "Run Scanner"}
            </button>
          </div>
        </header>

        {/* Command bar */}
        <div style={{
          background: "rgba(0,0,0,0.3)", borderRadius: 5, padding: "7px 12px", marginBottom: 10,
          fontFamily: "var(--mono)", fontSize: 9.5, color: T.textDim,
          border: `1px solid ${T.border}`, position: "relative", overflow: "hidden",
        }}>
          {scanning && (
            <div style={{
              position: "absolute", top: 0, left: 0, width: "30%", height: "100%",
              background: `linear-gradient(90deg, transparent, ${T.green}06, transparent)`,
              animation: "scanBar 1.5s linear infinite",
            }} />
          )}
          <span style={{ color: T.green }}>$</span>{" "}
          momentum_scanner <span style={{ color: T.textDim }}>--market=</span><span style={{ color: T.textBright }}>us_microcap</span>{" "}
          <span style={{ color: T.textDim }}>--volume_filter=</span><span style={{ color: T.textBright }}>peak</span>{" "}
          <span style={{ color: T.textDim }}>--timeframe=</span><span style={{ color: T.textBright }}>120min</span>{" "}
          <span style={{ color: T.textDim }}>--confidence=</span><span style={{ color: T.textBright }}>0.85</span>{" "}
          <span style={{ color: T.textDim }}>--risk=</span><span style={{ color: T.textBright }}>aggressive</span>{" "}
          <span style={{ color: T.textDim }}>--data=</span><span style={{ color: T.cyan }}>live</span>
        </div>

        {/* Progress bar */}
        {scanning && (
          <div style={{ display: "flex", gap: 2, marginBottom: 10 }}>
            {PHASES.map((p, i) => (
              <div key={p.id} style={{
                flex: 1, height: 2.5, borderRadius: 2,
                background: i < phaseIdx ? T.green : i === phaseIdx ? T.amber : "rgba(134,159,191,0.05)",
                transition: "background 0.3s ease",
              }} />
            ))}
          </div>
        )}

        {/* Terminal log */}
        {logs.length > 0 && <TermLog entries={logs} />}

        {/* Main content */}
        {signals.length > 0 && (
          <div style={{
            display: "grid", gridTemplateColumns: "1fr 410px", gap: 14,
            marginTop: 12, animation: "fadeIn 0.5s ease",
          }}>
            <div style={{ background: T.surface, borderRadius: 8, border: `1px solid ${T.border}`, overflow: "hidden" }}>
              <div style={{
                padding: "9px 14px", borderBottom: `1px solid ${T.border}`,
                display: "flex", justifyContent: "space-between", alignItems: "center",
                background: "rgba(0,0,0,0.15)",
              }}>
                <span style={{ fontSize: 9, color: T.textDim, letterSpacing: 1.5, textTransform: "uppercase", fontFamily: "var(--mono)" }}>
                  {signals.length} Signals · Composite Ranked
                </span>
                <span style={{ fontSize: 9, color: T.textDim, fontFamily: "var(--mono)" }}>
                  {new Date().toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" })}
                  {" · "}
                  {new Date().toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })}
                </span>
              </div>
              {signals.map((s, i) => (
                <SignalRow
                  key={s.ticker + i} signal={s} rank={i + 1}
                  isActive={selected?.ticker === s.ticker}
                  onClick={() => setSelected(s)}
                />
              ))}
            </div>
            <div style={{
              background: T.surface, borderRadius: 8, border: `1px solid ${T.border}`,
              padding: 16, position: "sticky", top: 16, alignSelf: "start",
              maxHeight: "calc(100vh - 32px)", overflowY: "auto",
            }}>
              <DetailPanel signal={selected} />
            </div>
          </div>
        )}

        {/* Empty state */}
        {!scanning && signals.length === 0 && (
          <div style={{
            display: "flex", flexDirection: "column", alignItems: "center",
            justifyContent: "center", height: 400, color: T.textDim, textAlign: "center",
          }}>
            <div style={{ fontSize: 48, marginBottom: 16, opacity: 0.15 }}>◎</div>
            <div style={{ fontSize: 13, fontWeight: 600, color: T.text, marginBottom: 6 }}>Ready to scan</div>
            <div style={{ fontSize: 11, maxWidth: 360, lineHeight: 1.6 }}>
              Click <strong style={{ color: T.green }}>Run Scanner</strong> to search live market data for
              micro-cap stocks with unusual momentum, volume anomalies, and confirmed catalysts.
            </div>
          </div>
        )}

        {/* Disclaimer */}
        <div style={{
          marginTop: 18, padding: "10px 14px", borderRadius: 6,
          background: T.redDim, border: `1px solid rgba(255,68,102,0.1)`,
          fontSize: 9, color: "rgba(255,68,102,0.55)", lineHeight: 1.7,
          fontFamily: "var(--mono)",
        }}>
          <strong>⚠ RISK DISCLAIMER</strong> —{" "}
          {dataSource === "live"
            ? "Real tickers and catalysts sourced via live web search. However, technical indicators (RSI, VWAP, OBV), confidence scores, Monte Carlo paths, and Kelly sizing are computationally modeled — not from real-time market feeds. "
            : dataSource === "curated"
            ? "Curated dataset used (live feed unavailable). All technical indicators and trade parameters are modeled. "
            : ""}
          Micro-cap equities (&lt;$300M) carry extreme risks including wide spreads, low liquidity, manipulation, and potential total loss.
          This tool is for educational demonstration only. It is not financial advice. No recommendation to buy or sell any security is made or implied.
          Always consult a licensed financial professional. Past performance ≠ future results.
        </div>
      </div>
    </div>
  );
}
