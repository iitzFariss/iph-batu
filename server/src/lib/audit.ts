import type { Request } from "express";
import prisma from "./prisma";
import { AuthedRequest } from "../middleware/auth";

/**
 * Catat aksi sensitif ke tabel AuditLog. Tidak memakai relasi FK sehingga
 * baris tetap tersimpan sekalipun akun pelaku dihapus. Dipanggil dari route;
 * kegagalan mencatat tidak boleh menggagalkan aksi itu sendiri.
 */
export async function catatAudit(req: Request, aksi: string, detail?: string): Promise<void> {
  const user = (req as AuthedRequest).user;
  try {
    await prisma.auditLog.create({
      data: {
        actorId: user?.id ?? "-",
        aksi,
        detail: detail ?? null,
        ip: req.ip ?? null,
      },
    });
  } catch {
    // log gagal, aksi tetap berhasil.
  }
}