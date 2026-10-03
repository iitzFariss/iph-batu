import { Router } from "express";
import { h } from "../lib/asyncHandler";
import { buildRekapSummary } from "../lib/rekapSummary";

export const router = Router();

// ─── GET /api/public/rekap/summary ────────────────────────────────────────
router.get(
  "/rekap/summary",
  h(async (_req, res) => {
    res.json(await buildRekapSummary());
  })
);

export default router;