import "dotenv/config";

async function main() {
  const url = process.env.N8N_WHATSAPP_WEBHOOK_URL;
  const token = process.env.N8N_WHATSAPP_TOKEN;
  if (!url || !token) throw new Error("Isi N8N_WHATSAPP_WEBHOOK_URL dan N8N_WHATSAPP_TOKEN di .env backend ini.");
  const eventId = `iph-check-${Date.now()}`;
  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}`, "X-IPH-Event-ID": eventId },
    body: JSON.stringify({ dryRun: true, eventId, rapatId: "diagnostic", kind: "reminder", phone: "6281234567890", message: "Uji koneksi tanpa pengiriman WhatsApp.", expiresAt: new Date(Date.now() + 60_000).toISOString() }),
    signal: AbortSignal.timeout(15_000), redirect: "error",
  });
  if (response.status === 401 || response.status === 403) throw new Error(`Token n8n ditolak (HTTP ${response.status}). Samakan token backend ini dengan token workflow IPH di n8n, lalu restart backend.`);
  if (!response.ok) throw new Error(`Webhook n8n merespons HTTP ${response.status}. Periksa workflow IPH.`);
  const body = await response.json() as { ok?: boolean; dryRun?: boolean };
  if (body.ok !== true || body.dryRun !== true) throw new Error("Webhook belum mengonfirmasi dryRun. Periksa workflow IPH sebelum menguji pengiriman nyata.");
  console.log("Koneksi dan token n8n valid. Dry run berhasil, tanpa mengirim pesan WhatsApp.");
  console.log(`Worker otomatis: ${process.env.WHATSAPP_AUTOMATION_ENABLED === "true" ? "aktif" : "nonaktif"}. Jalankan pemeriksaan ini di laptop dan server jika keduanya memakai database yang sama.`);
}

main().catch(error => {
  console.error(error instanceof Error && error.message.startsWith("Token n8n") ? error.message
    : error instanceof Error && /^(Isi |Webhook )/.test(error.message) ? error.message
    : "Layanan n8n belum dapat dijangkau. Periksa jaringan dan endpoint webhook.");
  process.exitCode = 1;
});
