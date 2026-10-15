# Deployment IPH Batu: satu domain dan port 5011

Panduan ini menyiapkan frontend React dan backend API dalam **satu proses Express di port 5011**. Mode ini diaktifkan dengan `SERVE_FRONTEND=true`; mode development Vite tidak berubah. Backend melayani hasil build frontend dari `dist/` di root project dan API dari `/api/*`. Tidak memerlukan Vite/port 5173 di server produksi.

Target publik: `https://iph.bpskotabatu.com`. Cloudflare/reverse proxy menangani HTTPS. Tujuan internal adalah **HTTP** ke mesin yang benar pada port **5011**, bukan HTTPS port 5011. Contoh jika aplikasi di `192.168.100.10`: `http://192.168.100.10:5011`. Jika cloudflared berjalan pada mesin yang sama, gunakan `http://127.0.0.1:5011`; `127.0.0.1` di mesin/container cloudflared lain tidak menunjuk server aplikasi. Database tetap menggunakan schema `iph_batu` di `db_magang`; aplikasi dan schema presensi tidak diubah.

## 1. Periksa server sebelum memasang

Lakukan saat SSH dan jaringan kantor tersedia. Pastikan dengan admin bahwa mesin tujuan memang boleh menjalankan IPH. Perintah berikut hanya untuk **Linux**:

```bash
uname -s
cat /etc/os-release
node --version
npm --version
command -v node
ss -ltnp 'sport = :5011'
```

Gunakan Node.js 22.12+ atau 24 LTS yang sesuai dependency Vite project. Jika 5011 sudah digunakan, identifikasi layanan tersebut; jangan hentikan proses lain. Jika ternyata Windows, langkah build di bawah tetap berlaku melalui PowerShell, tetapi service systemd tidak dipakai; minta admin menentukan pengelola service Windows.

## 2. Salin source project dan konfigurasi server

Minta admin menempatkan source terbaru di direktori khusus, misalnya `/opt/iph-batu`, lengkap dengan package-lock frontend/backend, Prisma schema, migration, dan scripts. Salin source, bukan `node_modules` hasil install Windows atau client Prisma Windows. Folder `.env`, backup SQLite, dan `.n8n.local` tidak dimasukkan ke Git atau paket source.

Buat `/opt/iph-batu/server/.env` secara lokal di server berdasarkan `.env.example`. Pertahankan kredensial database dan token n8n yang benar melalui saluran pribadi, tanpa menaruhnya di repo. Konfigurasi contoh:

```dotenv
NODE_ENV=production
SERVE_FRONTEND=true
PORT=5011
CLIENT_ORIGIN=https://iph.bpskotabatu.com
PUBLIC_APP_URL=https://iph.bpskotabatu.com
PGDATABASE=db_magang
PGUSER=magang
PGPASSWORD="isi-di-server"
PGSSLMODE=prefer
JWT_ACCESS_SECRET="isi-string-acak-baru"
JWT_REFRESH_SECRET="isi-string-acak-lain"
ACCESS_TOKEN_TTL_MINUTES=15
REFRESH_TOKEN_TTL_DAYS=30
WHATSAPP_AUTOMATION_ENABLED=true
N8N_WHATSAPP_WEBHOOK_URL=http://192.168.100.9:5678/webhook/iph-batu-rapat
N8N_WHATSAPP_TOKEN="isi-token-integrasi-yang-sudah-ada"
```

Isi `PGHOST`/`PGPORT` berdasarkan lokasi server aplikasi:

- Jika aplikasi berjalan pada server PostgreSQL `192.168.100.10` itu sendiri: `PGHOST=127.0.0.1`, `PGPORT=5432` (konfirmasi PostgreSQL menerima koneksi lokal).
- Jika aplikasi berjalan pada server kantor lain: `PGHOST=192.168.100.10`, `PGPORT=5432`. Admin perlu memastikan jaringan dan izin koneksi PostgreSQL untuk mesin tersebut.

Jangan memakai tunnel DBeaver laptop `15432` untuk backend yang berjalan di server. Jangan menyalin konfigurasi lokal lalu menganggap tunnel tersebut tersedia di server. Gunakan JWT secret berbeda dari contoh development; mengganti secret membuat sesi lama perlu login kembali. Tidak perlu membuat akun admin baru jika database sudah berisi akun yang digunakan.

## 3. Install, build, dan periksa database

Jalankan sebagai akun deployment yang memiliki direktori project. Install dependency build sebelum menjalankan dengan mode produksi; `--include=dev` diperlukan untuk Vite, TypeScript, Prisma CLI, dan runner migration yang ada di project.

```bash
cd /opt/iph-batu
npm ci --include=dev
npm run build
cd server
npm ci --include=dev
npm run db:generate
npm run build
npm run db:status
npm run db:migrate
npm run db:check
```

`db:migrate` menerapkan migration yang belum diterapkan, hanya pada schema project. Jika sudah up-to-date, tidak memindahkan ulang data. **Jangan menjalankan `db:seed`, `migrate reset`, atau `db:transfer -- --apply` untuk deployment ini**: data kantor sudah tersedia.

## 4. Uji proses aplikasi

Dari `/opt/iph-batu/server`:

```bash
npm start
```

Perintah ini memakai `NODE_ENV=production` dan `SERVE_FRONTEND=true` dari `.env`. Di terminal SSH lain:

```bash
curl -I http://127.0.0.1:5011/
curl http://127.0.0.1:5011/api/health
```

Target: `/` menghasilkan HTML/HTTP 200 dan `/api/health` menghasilkan `status: ok`, `db: up`. Jika log menyatakan build frontend belum tersedia, build root project belum dijalankan atau folder source dipindah; `FRONTEND_DIST_DIR` opsional dapat menunjuk absolute path hasil build frontend. Jangan arahkan ke `server/dist`, yang berisi kode backend.

## 5. Jalankan terus sebagai service (Linux/systemd)

File contoh tersedia di `deploy/iph-batu.service`. Admin perlu menyiapkan akun `iph-batu` dan izin direktori project serta file `.env` untuk akun tersebut. Sesuaikan `User`, `Group`, `WorkingDirectory`, `ExecStart`, dan path Node dengan server yang sebenarnya. Akun service harus dapat membaca source/build dan `.env`; file `.env` hanya perlu terbaca akun service, misalnya mode `600` dengan pemilik yang sesuai.

Hentikan proses `npm start` percobaan dengan Ctrl+C sebelum menjalankan service agar port tidak bentrok. Setelah admin memeriksa file service:

```bash
sudo cp /opt/iph-batu/deploy/iph-batu.service /etc/systemd/system/iph-batu.service
sudo systemctl daemon-reload
sudo systemctl enable --now iph-batu.service
sudo systemctl status iph-batu.service
sudo journalctl -u iph-batu.service -n 50 --no-pager
```

Ini hanya memasang service IPH; jangan mengganti service presensi atau konfigurasi global PostgreSQL.

## 6. Arahkan Cloudflare/reverse proxy

Sampaikan ke admin:

> IPH sudah disiapkan untuk frontend dan API dalam satu layanan HTTP port 5011. Mohon arahkan `iph.bpskotabatu.com` ke `http://<IP-server-aplikasi>:5011`. Jika cloudflared berjalan di mesin aplikasi yang sama, targetnya `http://127.0.0.1:5011`. Akses publik tetap HTTPS. Mohon uji koneksi dari mesin/container cloudflared, bukan hanya dari laptop.

Jika Cloudflare yang dipakai bukan Tunnel, admin perlu mengatur Nginx/reverse proxy serta sertifikat origin sesuai mode TLS Cloudflare. Jangan menurunkan mode TLS hanya untuk menghilangkan 502. Untuk Tunnel, pilih service internal HTTP sementara hostname publik tetap HTTPS; periksa log tunnel jika target tidak dapat dijangkau.

Setelah routing benar:

```bash
curl -I https://iph.bpskotabatu.com/
curl https://iph.bpskotabatu.com/api/health
```

Cek login dari browser, dashboard publik tanpa login, dan pengiriman WhatsApp ke satu nomor uji. Saat backend server aktif, hentikan backend laptop agar hanya satu lingkungan memproses antrean database produksi. Database yang sama berarti rapat uji dan antreannya juga sama; jangan membuat rapat percobaan dengan seluruh pegawai.

## Membaca error 502

- HTTP lokal 5011 gagal: aplikasi belum berjalan, port salah, atau startup gagal; lihat log service.
- `/` 404 tetapi health 200: `SERVE_FRONTEND` belum aktif atau proses belum direstart dengan konfigurasi terbaru.
- Health 503: aplikasi berjalan, tetapi database tidak dapat dijangkau.
- HTTP lokal berhasil tetapi domain 502: cek IP/port/protokol tujuan dari mesin proxy/tunnel, firewall, dan log cloudflared/proxy.

Referensi: [Vite production build](https://vite.dev/guide/build.html), [Cloudflare Tunnel troubleshooting](https://developers.cloudflare.com/cloudflare-one/networks/connectors/cloudflare-tunnel/troubleshoot-tunnels/common-errors/).
