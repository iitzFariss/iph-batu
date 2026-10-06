import prisma from "./prisma";

/**
 * Buang sesi yang sudah tidak mungkin dipakai lagi: yang lewat masa berlaku,
 * dan yang dicabut lebih dari 7 hari lalu. Baris revoked masih disimpan 7 hari
 * supaya ada jejak untuk inspeksi, lalu dibersihkan supaya tabel tidak
 * membengkak. Dipanggil sesekali (login/logout + jadwal harian), bukan setiap
 * request, supaya biayanya tidak terasa.
 */
export async function bersihkanSesiLama(): Promise<void> {
  const batasRevoke = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  await prisma.session.deleteMany({
    where: {
      OR: [{ expiresAt: { lt: new Date() } }, { revokedAt: { lt: batasRevoke } }],
    },
  });
}