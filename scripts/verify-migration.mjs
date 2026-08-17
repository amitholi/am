// Verifies the claude-mythos-5 migration with one live request.
// Usage: ANTHROPIC_API_KEY=sk-ant-... node scripts/verify-migration.mjs
const key = process.env.ANTHROPIC_API_KEY;
if (!key) {
  console.error("Set ANTHROPIC_API_KEY first.");
  process.exit(1);
}

const resp = await fetch("https://api.anthropic.com/v1/messages", {
  method: "POST",
  headers: {
    "content-type": "application/json",
    "x-api-key": key,
    "anthropic-version": "2023-06-01",
    "anthropic-beta": "server-side-fallback-2026-07-01",
  },
  body: JSON.stringify({
    model: "claude-mythos-5",
    max_tokens: 256,
    fallbacks: "default",
    messages: [{ role: "user", content: "Say OK." }],
  }),
});

const data = await resp.json();
if (!resp.ok) {
  console.error("Request failed:", JSON.stringify(data, null, 2));
  process.exit(1);
}

console.log("model:", data.model);
console.log("stop_reason:", data.stop_reason);
if (data.stop_reason === "refusal") {
  console.error("Refused; stop_details:", JSON.stringify(data.stop_details));
  process.exit(1);
}
if (!data.model.startsWith("claude-mythos-5")) {
  console.error(`FAIL: response.model is ${data.model}, expected claude-mythos-5*`);
  process.exit(1);
}
console.log("PASS: response served by", data.model);
