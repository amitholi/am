import { watchlistRepo } from "../lib/db";

const DEFAULT = ["AAPL", "MSFT", "NVDA", "TSLA", "GOOGL"];

console.log("Seeding default watchlist...");
for (const sym of DEFAULT) {
  watchlistRepo.add(sym);
  console.log(`  + ${sym}`);
}
console.log("Done. Current watchlist:", watchlistRepo.list());
