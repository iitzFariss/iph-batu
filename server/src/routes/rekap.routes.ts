import { Router } from "express";
import prisma from "../lib/prisma";
import { h } from "../lib/asyncHandler";
import { rekapCreateSchema, rekapUpdateSchema } from "../lib/schemas";
import {
  computeCommodityGroups,
  computeCutoff,
  computeStatusIPH,
  parsePeriode,
  periodeLabel,
  round,
} from "../lib/rekap";
import { AuthedRequest, requireAuth, requireRoles } from "../middleware/auth";
import { findOrCreateKomoditas } from "./master.helpers";

export const router = Router();

function toRekapRow(rekap: {
  id: string;
  tahun: number;
  bulan: number;
  mingguIndeks: number;
  indikator: number;
  status: string;
  details: { isFluktuasi: boolean; nilai: number; komoditas: { nama: string } }[];
}) {
  const periodic = { tahun: rekap.tahun, bulan: rekap.bulan, mingguIndeks: rekap.mingguIndeks };
  const groups = computeCommodityGroups(rekap.details as never);
  return {
    id: rekap.id,
    periode: periodeLabel(periodic),
    ...computeCutoff(periodic),
    nilaiIPH: round(rekap.indikator),
    statusIPH: computeStatusIPH(rekap.indikator),
    deflasi: groups.deflasi,
    inflasi: groups.inflasi,
    tahun: rekap.tahun,
    bulan: rekap.bulan,
    mingguIndeks: rekap.mingguIndeks,
    status: rekap.status,
  };
}

// ─── GET /api/rekap ──────────────────────────────────────────────────────
router.get(
  "/",
  requireAuth,
  requireRoles("admin", "petugas"),
  h(async (req, res) => {
    const q = req.query as Record<string, string | undefined>;
    const tab = q.tab ?? "semua";
    const tahun = q.tahun ? Number(q.tahun) : undefined;
    const search = q.q?.trim();
    const page = Math.max(1, Number(q.page ?? 1));
    const perPage = Math.min(100, Math.max(1, Number(q.perPage ?? 10)));

    const where: Record<string, unknown> = {};
    if (tab === "deflasi") where.indikator = { lt: 0 };
    else if (tab === "inflasi") where.indikator = { gt: 0 };
    else if (tab === "intervensi") where.indikator = { gte: 1 };
    if (tahun) where.tahun = tahun;

    if (search) {
      const activeKom = await prisma.komoditas.findMany();
      const matched = activeKom
        .filter((k) => k.nama.toLowerCase().includes(search.toLowerCase()))
        .map((k) => k.id);
      if (matched.length > 0) {
        where.details = { some: { komoditasId: { in: matched } } };
      } else {
        res.json({ rows: [], total: 0, page, perPage, totalPages: 0 });
        return;
      }
    }

    const [total, records] = await Promise.all([
      prisma.rekap.count({ where }),
      prisma.rekap.findMany({
        where,
        include: { details: { include: { komoditas: true }, orderBy: { isFluktuasi: "desc" } } },
        orderBy: [{ tahun: "desc" }, { bulan: "desc" }, { mingguIndeks: "desc" }],
        skip: (page - 1) * perPage,
        take: perPage,
      }),
    ]);

    res.json({ rows: records.map(toRekapRow), total, page, perPage, totalPages: Math.ceil(total / perPage) });
  })
);

// ─── GET /api/rekap/export?format=csv ─────────────────────────────────────
router.get(
  "/export",
  requireAuth,
  requireRoles("admin", "petugas"),
  h(async (_req, res) => {
    const records = await prisma.rekap.findMany({
      include: { details: { include: { komoditas: true } } },
      orderBy: [{ tahun: "desc" }, { bulan: "desc" }, { mingguIndeks: "desc" }],
    });
    const rows = records.map(toRekapRow);
    const header = "Periode;Cutoff Mulai;Cutoff Selesai;IPH;Status;Komoditas Deflasi;Komoditas Inflasi";
    const lines = rows.map((r) =>
      [
        r.periode,
        r.cutoffStart,
        r.cutoffEnd,
        r.nilaiIPH.toFixed(2),
        r.statusIPH,
        r.deflasi.map((d) => `${d.name}:${d.change}`).join("|"),
        r.inflasi.map((d) => `${d.name}:${d.change}`).join("|"),
      ]
        .map((cell) => `"${String(cell).replace(/"/g, '""')}"`)
        .join(";")
    );
    res.setHeader("Content-Type", "text/csv; charset=utf-8");
    res.setHeader("Content-Disposition", `attachment; filename="rekap-iph.csv"`);
    res.send([header, ...lines].join("\r\n"));
  })
);

// ─── POST /api/rekap ─────────────────────────────────────────────────────
router.post(
  "/",
  requireAuth,
  requireRoles("admin"),
  h(async (req, res) => {
    const me = (req as AuthedRequest).user!;
    const body = rekapCreateSchema.parse(req.body);

    const existing = await prisma.rekap.findUnique({
      where: { tahun_bulan_mingguIndeks: { tahun: body.tahun, bulan: body.bulan, mingguIndeks: body.mingguKe } },
    });
    if (existing) {
      res.status(409).json({ message: "Rekap untuk periode tersebut sudah tersimpan." });
      return;
    }

    const rekap = await prisma.$transaction(async (tx) => {
      const created = await tx.rekap.create({
        data: {
          tahun: body.tahun,
          bulan: body.bulan,
          mingguIndeks: body.mingguKe,
          indikator: body.indikator,
          status: "submitted",
          createdById: me.id,
        },
      });
      const rows = [
        ...body.andil.map((d) => ({ ...d, isFluktuasi: false })),
        ...(body.fluktuasi ? [{ ...body.fluktuasi, isFluktuasi: true }] : []),
      ];
      for (const row of rows) {
        const komoditas = await findOrCreateKomoditas(row.nama);
        await tx.rekapDetail.create({
          data: {
            rekapId: created.id,
            komoditasId: komoditas.id,
            nilai: row.nilai,
            isFluktuasi: row.isFluktuasi,
          },
        });
      }
      return created;
    });

    res.status(201).json({ message: "Rekap IPH berhasil disimpan.", rekap: { id: rekap.id } });
  })
);

// ─── GET /api/rekap/:id ───────────────────────────────────────────────────
router.get(
  "/:id",
  requireAuth,
  requireRoles("admin", "petugas"),
  h(async (req, res) => {
    const rekap = await prisma.rekap.findUnique({
      where: { id: req.params.id },
      include: { details: { include: { komoditas: true } } },
    });
    if (!rekap) {
      res.status(404).json({ message: "Rekap tidak ditemukan." });
      return;
    }
    res.json({ rekap: toRekapRow(rekap) });
  })
);

// ─── PATCH /api/rekap/:id ─────────────────────────────────────────────────
router.patch(
  "/:id",
  requireAuth,
  requireRoles("admin"),
  h(async (req, res) => {
    const rekap = await prisma.rekap.findUnique({ where: { id: req.params.id } });
    if (!rekap) {
      res.status(404).json({ message: "Rekap tidak ditemukan." });
      return;
    }

    const body = rekapUpdateSchema.parse(req.body);

    let tahun = rekap.tahun;
    let bulan = rekap.bulan;
    let mingguIndeks = rekap.mingguIndeks;
    if (body.periode) {
      const parsed = parsePeriode(body.periode);
      if (!parsed) {
        res.status(400).json({ message: "Format periode tidak valid." });
        return;
      }
      ({ tahun, bulan, mingguIndeks } = parsed);
    }
    const indikator = body.nilaiIPH ?? rekap.indikator;

    if (tahun !== rekap.tahun || bulan !== rekap.bulan || mingguIndeks !== rekap.mingguIndeks) {
      const conflict = await prisma.rekap.findUnique({
        where: { tahun_bulan_mingguIndeks: { tahun, bulan, mingguIndeks } },
      });
      if (conflict && conflict.id !== rekap.id) {
        res.status(409).json({ message: "Periode tersebut sudah ada pada rekap lain." });
        return;
      }
    }

    const details = [...body.deflasi, ...body.inflasi];

    await prisma.$transaction(async (tx) => {
      await tx.rekap.update({
        where: { id: rekap.id },
        data: { tahun, bulan, mingguIndeks, indikator },
      });
      await tx.rekapDetail.deleteMany({ where: { rekapId: rekap.id } });
      for (const d of details) {
        const komoditas = await findOrCreateKomoditas(d.nama);
        await tx.rekapDetail.create({
          data: { rekapId: rekap.id, komoditasId: komoditas.id, nilai: d.nilai, isFluktuasi: false },
        });
      }
    });

    const updated = await prisma.rekap.findUnique({
      where: { id: rekap.id },
      include: { details: { include: { komoditas: true } } },
    });
    res.json({ message: "Rekap berhasil diperbarui.", rekap: toRekapRow(updated!) });
  })
);

// ─── DELETE /api/rekap/:id ────────────────────────────────────────────────
router.delete(
  "/:id",
  requireAuth,
  requireRoles("admin"),
  h(async (req, res) => {
    const rekap = await prisma.rekap.findUnique({ where: { id: req.params.id } });
    if (!rekap) {
      res.status(404).json({ message: "Rekap tidak ditemukan." });
      return;
    }
    await prisma.rekap.delete({ where: { id: rekap.id } });
    res.json({ message: "Rekap berhasil dihapus." });
  })
);

export default router;