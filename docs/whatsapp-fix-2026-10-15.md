# Perbaikan antrean bersamaan dan token n8n

Ada dua masalah terpisah: revisi sebelumnya membuat undangan dan pengingat otomatis bersamaan setelah jam pengingat lewat; server produksi juga mengirim token yang ditolak n8n dengan HTTP 401. Token laptop telah lolos `wa:check`, sedangkan pemeriksaan yang dijalankan pemilik di server ditolak.

## Samakan token server

Di terminal SSH:

```bash
sudo nano /opt/iph-batu/server/.env
```

Ganti hanya nilai `N8N_WHATSAPP_TOKEN` dengan nilai pada `server/.env` laptop yang sudah lolos pemeriksaan. Jangan menyalin seluruh `.env` laptop, karena konfigurasi database dan JWT produksi berbeda. Simpan dengan Ctrl+O, Enter, Ctrl+X. Setelah perubahan:

```bash
sudo systemctl restart iph-batu
cd /opt/iph-batu/server
sudo -u iph-batu npm run wa:check
```

Hasil yang diharapkan adalah koneksi dan token valid, dry run berhasil. Perintah ini tidak mengirim pesan WhatsApp. Jika masih HTTP 401, periksa nilai token dan endpoint workflow IPH yang dipakai server.

## Pasang perbaikan penjadwalan

Paket `deploy/package.local/iph-batu-whatsapp-fix-2026-10-15.tar.gz` hanya berisi source penjadwalan, tes dan panduan ini. Tidak menyertakan `.env`, token atau migration. Dari PowerShell laptop pada folder utama project:

```powershell
scp .\deploy\package.local\iph-batu-whatsapp-fix-2026-10-15.tar.gz bps@192.168.100.10:~/
```

Kemudian salin seluruh blok berikut ke terminal SSH. Operator `&&` menghentikan langkah selanjutnya jika suatu perintah gagal:

```bash
cd /opt/iph-batu &&
cp server/src/lib/whatsapp.ts "server/src/lib/whatsapp.ts.before-$(date +%Y%m%d-%H%M%S)" &&
tar -xzf ~/iph-batu-whatsapp-fix-2026-10-15.tar.gz &&
npm --prefix server run build -- --outDir dist-next &&
mv server/dist "server/dist-before-wa-$(date +%Y%m%d-%H%M%S)" &&
mv server/dist-next server/dist &&
sudo systemctl restart iph-batu &&
curl -fsS https://iph.bpskotabatu.com/api/health &&
cd server &&
sudo -u iph-batu npm run wa:check
```

Tidak perlu build frontend, menjalankan migration atau transfer database. Perbaikan belum dipasang otomatis karena akses SSH membutuhkan password yang dimasukkan pemilik langsung di terminal.

## Perilaku setelah perbaikan

- Sebelum jam pengingat: undangan langsung dan pengingat terjadwal tetap dibuat sebagai dua jenis pesan dengan waktu berbeda.
- Setelah atau tepat pada jam pengingat: hanya undangan/perubahan jadwal langsung dibuat. Pengingat manual tetap tersedia sebagai aksi terpisah.
- Worker mengenali pengingat otomatis lama yang dibuat terlambat bersama undangan/perubahan pada revisi dan penerima yang sama. Pengingat yang belum dikirim dibatalkan saat diproses, tanpa menghapus riwayat. Pesan yang sudah terkirim atau berstatus unknown tidak diubah.
- Pesan gagal yang sudah mencapai batas percobaan tetap menunggu tindakan admin. Setelah token valid, pilih Coba lagi pada Undangan saja selama rapat belum lewat. Pengingat lama yang redundan akan dibatalkan bila diproses ulang menggunakan worker versi baru.

Pengujian menggunakan database test terpisah dan gateway tiruan, mencakup rapat terlambat, tepat pukul 07.00, idempotensi, antrean lama pending/failed, dan pengingat terjadwal normal. Tidak ada pengiriman WhatsApp nyata atau penulisan manual ke database kantor dalam pemeriksaan ini.
