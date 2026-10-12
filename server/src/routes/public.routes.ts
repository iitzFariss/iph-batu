import { Router } from "express";
import { h } from "../lib/asyncHandler";
import { getSummary } from "../lib/rekapCache";
import { buildRekapSummary } from "../lib/rekapSummary";
import prisma from "../lib/prisma";
import { z } from "zod";

const periodSchema = z.object({ tahun: z.coerce.number().int().min(2000).max(2100), bulan: z.coerce.number().int().min(1).max(12), minggu: z.coerce.number().int().min(1).max(5) });

export const router = Router();

// ─── GET /api/public/rekap/summary ────────────────────────────────────────
router.get(
  "/rekap/summary",
  h(async (req, res) => {
    if (Object.keys(req.query).length) {
      const period = periodSchema.parse(req.query);
      const exists = await prisma.rekap.findFirst({ where: { tahun: period.tahun, bulan: period.bulan, mingguIndeks: period.minggu }, select: { id: true } });
      if (!exists) { res.status(404).json({ message: "Data periode ini tidak tersedia." }); return; }
      res.json(await buildRekapSummary(period));
      return;
    }
    const { summary, cache } = await getSummary();
    res.set("X-Cache", cache);
    res.json(summary);
  })
);

export default router;
