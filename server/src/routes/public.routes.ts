import { Router } from "express";
import { h } from "../lib/asyncHandler";
import { getSummary } from "../lib/rekapCache";

export const router = Router();

// ─── GET /api/public/rekap/summary ────────────────────────────────────────
router.get(
  "/rekap/summary",
  h(async (_req, res) => {
    const { summary, cache } = await getSummary();
    res.set("X-Cache", cache);
    res.json(summary);
  })
);

export default router;