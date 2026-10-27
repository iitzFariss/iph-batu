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
import { writeLimiter } from "../middleware/rateLimit";
import { findOrCreateKomoditas } from "./master.helpers";
import { getSummary, invalidateSummary } from "../lib/rekapCache";
import { catatAudit } from "../lib/audit";
import { z } from "zod";
import { DEFAULT_BROADCAST_TEMPLATE, TEMPLATE_FIELDS } from "../lib/broadcastTemplate";
import { parseRekapWorkbook, styledWorkbook, styleSheet, templateWorkbook } from "../lib/rekapExcel";

export const router = Router();

router.get("/siaran-template", requireAuth, requireRoles("admin", "petugas"), h(async (_req, res) => {
  const stored = await prisma.appSetting.findUnique({ where: { id: "broadcast-template" } });
  res.set("Cache-Control", "no-store");
  res.json({ template: stored?.value ?? DEFAULT_BROADCAST_TEMPLATE, custom: Boolean(stored), fields: TEMPLATE_FIELDS });
}));
router.put("/siaran-template", writeLimiter, requireAuth, requireRoles("admin"), h(async (req, res) => {
  const { template } = z.object({ template: z.string().trim().min(10).max(3300).refine(value => {
    const fields = [...value.matchAll(/{{\s*([^{}]+?)\s*}}/g)].map(match => match[1]);
    return fields.every(field => TEMPLATE_FIELDS.includes(field)) && TEMPLATE_FIELDS.every(field => fields.includes(field));
  }, "Pertahankan penanda {{minggu}}, {{bulan}}, {{tahun}}, {{arah}}, {{iph}}, dan {{komoditas}} agar data periode terisi otomatis.") }).parse(req.body);
  await prisma.appSetting.upsert({ where: { id: "broadcast-template" }, update: { value: template }, create: { id: "broadcast-template", value: template } });
  await catatAudit(req, "siaran.template-diubah");
  res.json({ template });
}));
router.delete("/siaran-template", writeLimiter, requireAuth, requireRoles("admin"), h(async (req, res) => {
  await prisma.appSetting.deleteMany({ where: { id: "broadcast-template" } });
  await catatAudit(req, "siaran.template-direset");
  res.json({ template: DEFAULT_BROADCAST_TEMPLATE });
}));

/**
 * Query string bisa berasal dari URL mana pun, sehingga `?page=abc` menghasilkan
 * NaN. Prisma menolak skip/take NaN dan errornya berujung 500 tanpa penjelasan.
 * Angka yang tidak berhingga dikembalikan sebagai undefined supaya pemanggil
 * memakai nilai defaultnya masing-masing.
 */
function bacaAngka(nilai: string | undefined): number | undefined {
  if (nilai == null || nilai.trim() === "") return undefined;
  const n = Number(nilai);
  return Number.isFinite(n) ? n : undefined;
}

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
    fluktuasi: groups.fluktuasi,
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
    const tahun = bacaAngka(q.tahun);
    const bulan = bacaAngka(q.bulan);
    const minggu = bacaAngka(q.minggu);
    const search = q.q?.trim();
    const page = Math.min(100_000, Math.max(1, bacaAngka(q.page) ?? 1));
    const perPage = Math.min(100, Math.max(1, bacaAngka(q.perPage) ?? 10));

    const where: Record<string, unknown> = {};
    if (tab === "deflasi") where.indikator = { lt: 0 };
    else if (tab === "inflasi") where.indikator = { gt: 0 };
    if (tahun) where.tahun = tahun;
    if (bulan && bulan >= 1 && bulan <= 12) where.bulan = bulan;
    if (minggu && minggu >= 1 && minggu <= 5) where.mingguIndeks = minggu;

    if (search) {
      const activeKom = await prisma.komoditas.findMany({ where: { isActive: true } });
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

// ─── GET /api/rekap/periods ───────────────────────────────────────────────
// Daftar periode yang tersedia tanpa join detail komoditas. Dipakai untuk
// mengisi dropdown tahun/bulan/pekan supaya tidak terpaginasikan.
router.get(
  "/periods",
  requireAuth,
  requireRoles("admin", "petugas"),
  h(async (req, res) => {
    const records = await prisma.rekap.findMany({
      select: { id: true, tahun: true, bulan: true, mingguIndeks: true, indikator: true },
      orderBy: [{ tahun: "desc" }, { bulan: "desc" }, { mingguIndeks: "desc" }],
    });

    const rows = records.map((r) => {
      const periodic = { tahun: r.tahun, bulan: r.bulan, mingguIndeks: r.mingguIndeks };
      return {
        id: r.id,
        ...periodic,
        periode: periodeLabel(periodic),
        ...computeCutoff(periodic),
        nilaiIPH: round(r.indikator),
        statusIPH: computeStatusIPH(r.indikator),
      };
    });

    res.setHeader("Cache-Control", "private, max-age=60");
    res.json({ rows, total: rows.length });
  })
);

// ─── GET /api/rekap/summary ────────────────────────────────────────────────
router.get(
  "/summary",
  requireAuth,
  requireRoles("admin", "petugas", "tamu"),
  h(async (_req, res) => {
    const { summary, cache } = await getSummary();
    res.set("X-Cache", cache);
    res.json(summary);
  })
);

// ─── GET /api/rekap/export?format=csv ─────────────────────────────────────
router.get(
  "/export",
  requireAuth,
  requireRoles("admin", "petugas"),
  h(async (req, res) => {
    const records = await prisma.rekap.findMany({
      include: { details: { include: { komoditas: true } } },
      orderBy: [{ tahun: "desc" }, { bulan: "desc" }, { mingguIndeks: "desc" }],
    });
    const headers = ["Periode", "IPH (%)", "Komoditas", "Andil (persen poin)", "Jenis"];
    const rows = records.flatMap(r => r.details.length ? r.details.map(d => [periodeLabel(r), r.indikator, d.komoditas.nama, d.nilai, d.isFluktuasi ? "Fluktuasi" : d.nilai > 0 ? "Inflasi" : d.nilai < 0 ? "Deflasi" : "Tidak berubah"]) : [[periodeLabel(r), r.indikator, "", "", ""]]);
    if (req.query.format === "xlsx") {
      const book = styledWorkbook(), sheet = book.addWorksheet("Rekap IPH");
      sheet.columns = headers.map((header, i) => ({ header, width: [36, 16, 35, 24, 20][i] }));
      sheet.addRows(rows);
      sheet.getColumn(2).numFmt = "0.0000;-0.0000;0.0000";
      sheet.getColumn(4).numFmt = "0.0000;-0.0000;0.0000";
      styleSheet(sheet);
      res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
      res.setHeader("Content-Disposition", 'attachment; filename="rekap-iph.xlsx"');
      res.send(Buffer.from(await book.xlsx.writeBuffer())); return;
    }
    const quote = (cell: string | number) => {
      const text = typeof cell === "number" ? cell.toFixed(4).replace(".", ",") : /^[=+\-@\t\r]/.test(cell) ? `'${cell}` : cell;
      return `"${text.replace(/"/g, '""')}"`;
    };
    const lines = rows.map(row => row.map(quote).join(";"));
    res.setHeader("Content-Type", "text/csv; charset=utf-8");
    res.setHeader("Content-Disposition", `attachment; filename="rekap-iph.csv"`);
    res.send("\uFEFF" + [headers.join(";"), ...lines].join("\r\n"));
  })
);

router.get("/template", requireAuth, requireRoles("admin"), h(async (_req, res) => {
  res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
  res.setHeader("Content-Disposition", 'attachment; filename="template-input-iph.xlsx"');
  res.send(Buffer.from(await templateWorkbook()));
}));
router.post("/import", writeLimiter, requireAuth, requireRoles("admin"), h(async (req, res) => {
  const body = z.object({ base64: z.string().min(4).max(1_400_000).regex(/^[A-Za-z0-9+/]+={0,2}$/), commit: z.boolean().default(false) }).parse(req.body);
  let periods;
  try { periods = await parseRekapWorkbook(Buffer.from(body.base64, "base64")); }
  catch (error) { res.status(400).json({ message: error instanceof z.ZodError ? error.issues[0].message : (error as Error).message }); return; }
  const conflicts = await prisma.rekap.findMany({ where: { OR: periods.map(p => ({ tahun: p.tahun, bulan: p.bulan, mingguIndeks: p.mingguKe })) }, select: { tahun: true, bulan: true, mingguIndeks: true } });
  if (conflicts.length) { res.status(409).json({ message: `Periode sudah tersimpan: ${conflicts.map(periodeLabel).join(", ")}. Tidak ada data yang ditimpa.` }); return; }
  if (body.commit) {
    await prisma.$transaction(async tx => {
      for (const p of periods) {
        const record = await tx.rekap.create({ data: { tahun: p.tahun, bulan: p.bulan, mingguIndeks: p.mingguKe, indikator: p.indikator, createdById: (req as AuthedRequest).user!.id } });
        for (const d of [...p.andil.map(d => ({ ...d, isFluktuasi: false })), ...(p.fluktuasi ? [{ ...p.fluktuasi, isFluktuasi: true }] : [])]) {
          const commodity = await findOrCreateKomoditas(d.nama, tx);
          await tx.rekapDetail.create({ data: { rekapId: record.id, komoditasId: commodity.id, nilai: d.nilai, isFluktuasi: d.isFluktuasi } });
        }
      }
    }, { timeout: 30000 });
    invalidateSummary();
    await catatAudit(req, "rekap.excel-diimpor", `${periods.length} periode`);
  }
  res.json({ periods, committed: body.commit, message: body.commit ? `${periods.length} periode berhasil disimpan.` : `${periods.length} periode valid. Periksa pratinjau sebelum menyimpan.` });
}));

// ─── POST /api/rekap ─────────────────────────────────────────────────────
router.post(
  "/",
  writeLimiter,
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
        const komoditas = await findOrCreateKomoditas(row.nama, tx);
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
    invalidateSummary();
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
  writeLimiter,
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

    const previous = await prisma.rekapDetail.findMany({ where: { rekapId: rekap.id }, include: { komoditas: true } });
    const oldGroup = (negative: boolean) => previous.filter(d => !d.isFluktuasi && (d.nilai < 0) === negative).map(d => ({ nama: d.komoditas.nama, nilai: d.nilai }));
    const details = [...(body.deflasi ?? oldGroup(true)), ...(body.inflasi ?? oldGroup(false))];
    const previousFluktuasi = previous.find(d => d.isFluktuasi);
    const fluktuasi = body.fluktuasi === undefined
      ? previousFluktuasi ? { nama: previousFluktuasi.komoditas.nama, nilai: previousFluktuasi.nilai } : null
      : body.fluktuasi;

    await prisma.$transaction(async (tx) => {
      await tx.rekap.update({
        where: { id: rekap.id },
        data: { tahun, bulan, mingguIndeks, indikator },
      });
      await tx.rekapDetail.deleteMany({ where: { rekapId: rekap.id } });
      for (const d of details) {
        const komoditas = await findOrCreateKomoditas(d.nama, tx);
        await tx.rekapDetail.create({
          data: { rekapId: rekap.id, komoditasId: komoditas.id, nilai: d.nilai, isFluktuasi: false },
        });
      }
      if (fluktuasi) {
        const komoditas = await findOrCreateKomoditas(fluktuasi.nama, tx);
        await tx.rekapDetail.create({
          data: { rekapId: rekap.id, komoditasId: komoditas.id, nilai: fluktuasi.nilai, isFluktuasi: true },
        });
      }
    });

    const updated = await prisma.rekap.findUnique({
      where: { id: rekap.id },
      include: { details: { include: { komoditas: true } } },
    });
    res.json({ message: "Rekap berhasil diperbarui.", rekap: toRekapRow(updated!) });
    invalidateSummary();
  })
);

// ─── DELETE /api/rekap/:id ────────────────────────────────────────────────
router.delete(
  "/:id",
  writeLimiter,
  requireAuth,
  requireRoles("admin"),
  h(async (req, res) => {
    const rekap = await prisma.rekap.findUnique({ where: { id: req.params.id } });
    if (!rekap) {
      res.status(404).json({ message: "Rekap tidak ditemukan." });
      return;
    }
    await catatAudit(req, "rekap.dihapus", `${rekap.tahun}-${rekap.bulan}-m${rekap.mingguIndeks}`);
    await prisma.rekap.delete({ where: { id: rekap.id } });
    res.json({ message: "Rekap berhasil dihapus." });
    invalidateSummary();
  })
);

export default router;
