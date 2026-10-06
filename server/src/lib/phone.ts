/**
 * Nomor WhatsApp ditulis manusia dalam berbagai format ("0812-3456-789",
 * "+62 812..." dsb), tapi wa.me butuh bentuk internasional tanpa pemisah.
 * Penerjemahan ini dipakai untuk prefill penerima pesan reminder.
 */

export function normalisasiNomorWa(phone: string | null | undefined): string | null {
  if (!phone) return null;
  const digit = phone.replace(/\D/g, "");
  let nomor = digit;
  if (nomor.startsWith("0")) nomor = `62${nomor.slice(1)}`;
  if (nomor.length < 9 || nomor.length > 15) return null;
  return nomor;
}

export function tautanWa(phone: string | null | undefined, teks: string): string {
  const nomor = normalisasiNomorWa(phone);
  const pesan = encodeURIComponent(teks);
  return nomor ? `https://wa.me/${nomor}?text=${pesan}` : `https://wa.me/?text=${pesan}`;
}