import { buildRekapSummary, type RekapSummary } from "./rekapSummary";
import { log } from "./logger";

const TTL_MS = 60_000;

let cached: { value: RekapSummary; storedAt: number } | null = null;
let inflight: Promise<RekapSummary> | null = null;

export type CacheState = "HIT" | "MISS";

export async function getSummary(): Promise<{ summary: RekapSummary; cache: CacheState }> {
  const now = Date.now();
  if (cached && now - cached.storedAt < TTL_MS) {
    return { summary: cached.value, cache: "HIT" };
  }

  // Satu query saja walau banyak request datang bersamaan.
  if (!inflight) {
    inflight = buildRekapSummary()
      .then((summary) => {
        cached = { value: summary, storedAt: Date.now() };
        return summary;
      })
      .finally(() => {
        inflight = null;
      });
  }

  return { summary: await inflight, cache: "MISS" };
}

export function invalidateSummary(): void {
  if (cached) log.info("cache.summary.dinvalidate");
  cached = null;
}