import PQueue from "p-queue";

export const finnhubQueue = new PQueue({
  concurrency: 4,
  interval: 1000,
  intervalCap: 1,
});
