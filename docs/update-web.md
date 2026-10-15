# Update tampilan IPH Kota Batu

Untuk pembaruan 15 Oktober yang juga memperbaiki reminder, gunakan [panduan UI dan reminder](update-2026-10-15.md). Instruksi di bawah khusus paket frontend sebelumnya.

Pembaruan ini mengubah frontend, font, dan dependency frontend. Backend, migration, dan `.env` produksi tetap memakai konfigurasi yang sudah berjalan. Paket `deploy/package.local/iph-batu-web-update.tar.gz` hanya berisi source frontend dan konfigurasi build yang diperlukan, tanpa kredensial produksi, `.env`, `node_modules`, atau data pegawai.

## Dari PowerShell laptop

```powershell
cd D:\bps-intern-project-ub\iph-batu
scp .\deploy\package.local\iph-batu-web-update.tar.gz bps@192.168.100.10:~/
```

Masukkan password SSH langsung pada prompt terminal. Paket tidak diunggah otomatis karena akses SSH saat pemeriksaan masih membutuhkan autentikasi password.

## Dari terminal SSH server

Pastikan berada di folder project yang sudah berjalan, bukan folder presensi:

```bash
cd /opt/iph-batu
pwd
curl -fsS http://127.0.0.1:5011/api/health
tar -xzf ~/iph-batu-web-update.tar.gz -C /opt/iph-batu
npm ci --include=dev
npm run build -- --outDir dist-next
```

Jalankan satu per satu. Jika install/build gagal, berhenti: web yang sedang dilayani masih memakai `dist` lama. Hasil build baru berada di `dist-next`. Setelah build berhasil, pertahankan aset versi sebelumnya agar tab yang masih terbuka dapat menyelesaikan pemuatan modul, lalu aktifkan:

```bash
cp -an dist/assets/. dist-next/assets/
mv dist "dist-before-$(date +%Y%m%d-%H%M%S)"
mv dist-next dist
curl -I http://127.0.0.1:5011/
curl -fsS https://iph.bpskotabatu.com/api/health
```

Ini mengganti file frontend yang dilayani Express. Tidak perlu menjalankan seed, transfer, migration, atau mengubah token n8n. Service backend tetap berjalan. Penukaran dua direktori memiliki jeda singkat; jika browser terbuka pada versi lama, refresh halaman untuk mengambil HTML dan aset yang baru.

Buka domain dan gunakan Ctrl+Shift+R. Periksa login, menu, tema, dan Analisis Teks Siaran. Siaran menampilkan penerima di samping draf pada desktop dan sebelum draf pada ponsel; hasil salinan dan pesan menyertakan domain publik dengan parameter periode. Uji pengiriman nyata pertama hanya ke nomor admin sendiri. Pengujian browser lokal menggunakan API tiruan dan tidak mengirim WhatsApp.

Jika hasil tampilan perlu dikembalikan, identifikasi folder `dist-before-...` dari update ini, simpan `dist` baru dengan nama lain, lalu kembalikan folder backup tersebut menjadi `dist`. Nama backup harus diperiksa terlebih dahulu. Backup ini mengembalikan frontend build, bukan database.

Untuk perubahan backend pada update mendatang, gunakan panduan [deployment](deployment.md) dan restart service setelah backend dibuild. Paket saat ini khusus frontend.
