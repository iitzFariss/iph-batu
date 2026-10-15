# TPID Kota Batu — Indeks Perkembangan Harga (IPH)

Aplikasi web untuk mengelola dan memantau **Indeks Perkembangan Harga (IPH) Kota Batu**: impor tabel Scanning Harga, verifikasi andil komoditas, dan publikasi ringkasan ke dashboard publik.

Database kantor: **`db_magang`**, schema **`iph_batu`**, API **5011**. Schema `presensi` dan API presensi 5010 tidak diubah. Lihat [panduan PostgreSQL kantor dan tunnel SSH](docs/postgresql-kantor.md) untuk instalasi, migration, inisialisasi akun, dan batas pengujian.

Undangan dan pengingat WhatsApp rapat melalui n8n/WAHA: [panduan pemasangan, status pengiriman, dan pengujian](docs/whatsapp-rapat.md).

Repo ini berisi dua aplikasi terpisah:

| Path     | Isi                | Stack                        |
| -------- | ------------------ | ---------------------------- |
| `/`      | Frontend dashboard | React 19 + Vite + Tailwind 4 |
| `server` | REST API           | Express 4 + Prisma + PostgreSQL |

## Prasyarat

- **Node.js 20+** dan **npm 10+**
- Git
- Akses PostgreSQL kantor secara LAN atau melalui tunnel SSH yang sudah dikonfigurasi.

Cek versi:

```bash
node -v
npm -v
```

## Instalasi

Clone lalu install dependency di kedua folder:

```bash
git clone <url-repo> iph-batu
cd iph-batu

npm install
cd server && npm install && cd ..
```

## Konfigurasi environment

Server membaca konfigurasi dari `server/.env`. Salin dari contoh:

```bash
cd server
# Hanya jika .env belum ada (PowerShell):
if (-not (Test-Path .env)) { Copy-Item .env.example .env }
```

Isi `server/.env` lokal. Untuk laptop di luar kantor:

```ini
PGHOST=127.0.0.1
PGPORT=15433
PGDATABASE=db_magang
PGUSER=magang
PGPASSWORD=""
PGSSLMODE=prefer
PORT=5011
CLIENT_ORIGIN="http://localhost:5173"
JWT_ACCESS_SECRET="ganti-dengan-rangkaian-acak-panjang"
JWT_REFRESH_SECRET="ganti-dengan-rangkaian-acak-panjang-berbeda"
ACCESS_TOKEN_TTL_MINUTES=15
REFRESH_TOKEN_TTL_DAYS=30
```

>`JWT_ACCESS_SECRET` dan `JWT_REFRESH_SECRET` wajib berbeda dan cukup panjang (minimal 32 karakter). Jangan memakai nilai `change-me` di produksi. Buat string acak, misalnya dengan `node -e "console.log(require('crypto').randomBytes(48).toString('base64url'))"`.

Isi password sendiri di `PGPASSWORD`, jangan commit `.env`. `DATABASE_URL` SQLite lama tidak digunakan. Di kantor, ubah PGHOST ke `192.168.100.10` dan PGPORT ke `5432`. Schema `iph_batu` ditetapkan dalam konfigurasi backend dan model Prisma.

Frontend tidak membaca kredensial database. Dev server memproxy `/api` ke `http://localhost:5011` (lihat `vite.config.ts`).

## Setup database

Jalankan tunnel di terminal terpisah jika berada di luar kantor:

```powershell
ssh -N -o ExitOnForwardFailure=yes -L 127.0.0.1:15433:192.168.100.10:5432 root@ssh.kaitourae.my.id
```

Migration hanya membuat tabel dalam `iph_batu`, tanpa seed atau reset database bersama:

```bash
cd server
npm run db:generate    # generate Prisma Client PostgreSQL
npm run db:migrate     # prisma migrate deploy, tanpa shadow/reset
npm run db:check       # periksa koneksi/schema/tabel
npm run db:status      # periksa riwayat migration
```

Isi INITIAL_ADMIN_EMAIL, INITIAL_ADMIN_NAME, dan INITIAL_ADMIN_PASSWORD di `.env` lokal, kemudian:

```bash
npm run db:bootstrap   # buat akun awal tanpa menghapus data
```

## Menjalankan aplikasi

Satu perintah menyalakan API dan web sekaligus dari root:

```bash
npm run dev
```

- API: `http://localhost:5011`
- Web: `http://localhost:5173`

Kalau ingin memisahkan terminal (misal log API lebih mudah dibaca):

```bash
# Terminal 1 — API di http://localhost:5011
cd server
npm run dev
```

```bash
# Terminal 2 — web di http://localhost:5173
npm run dev:web
```

Buka `http://localhost:5173`. Health check API: `GET http://localhost:5011/api/health`.

Kalau web masih bisa dibuka tapi setiap request `/api` gagal dengan
`ECONNREFUSED`, berarti API belum jalan. Jalankan `npm run dev` dari root, atau
nyalakan `npm run dev:api` di terminal terpisah.

### Akun seed (development)

| Peran      | Email                              | Password    |
| ---------- | ---------------------------------- | ----------- |
| Admin      | `admin@tpid-batu.go.id`            | `admin123`  |
| Petugas    | `siti.rahmawati@bps-batu.go.id`    | `petugas123` |
| Petugas    | `bambang@diskoperindag-batu.go.id` | `petugas123` |
| Tamu       | `tamu@tpid-batu.go.id`             | `tamu123`   |

> Akun di atas hanya milik seed demo pada database terpisah. Seed diblokir pada `db_magang`. Untuk kantor gunakan `db:bootstrap` dengan kredensial sendiri; akun demo pada petunjuk development frontend tidak otomatis tersedia.

## Perintah harian

Frontend:

```bash
npm run dev       # dev server + HMR
npm run build     # typecheck + bundle produksi ke dist/
npm run lint      # ESLint
npm run preview   # serve hasil build
```

Backend:

```bash
npm run dev       # tsx watch, reload otomatis
npm run build     # tsc ke dist/
npm start         # jalankan hasil build
npm run import    # impor data Scanning Harga dari CSV
npm test          # automated test (database terpisah)
```

## Automated test

Test API tetap offline pada SQLite di `server/prisma/test.db`. `globalSetup` membuat salinan model PostgreSQL untuk test, menghasilkan client test terpisah, meng-*override* URL test, dan memverifikasi sidik jari `dev.db` sebelum-sesudah run. Test tidak menghubungi PostgreSQL kantor atau memakai seed. Ini regression API, bukan uji integration PostgreSQL; lihat [batas verifikasi](docs/postgresql-kantor.md#pengujian-dan-batas-verifikasi).

```bash
cd server
npm test           # sekali jalan
npm run test:watch # mode watch
```

Cakupan test: health check dan header keamanan, login (gagal/berhasil/akun belum aktif/token dimanipulasi), siklus hidup refresh token lewat cookie httpOnly (rotasi, penolakan token lama, pencabutan saat logout), rate limit auth dan tulis, filter `tahun`/`bulan`/`minggu`, endpoint `/api/rekap/periods`, activity log, serta master data.

## Cara kerja sesi

Access token (umur 15 menit) disimpan di `localStorage` dan dikirim sebagai
header `Authorization: Bearer`. Refresh token (umur 30 hari) **tidak pernah
disimpan di `localStorage` dan tidak pernah dikirim di body JSON** — ia hanya
berada di cookie `httpOnly` bernama `tpid_refresh`, dengan atribut
`SameSite=Lax`, `Path=/api/auth`, dan `Secure` saat HTTPS. Karena `httpOnly`,
JavaScript di browser tidak bisa membacanya, jadi satu celah XSS tidak cukup
untuk mencuri sesi 30 hari.

Alur sesi:

1. Login atau akses sebagai tamu mengembalikan `{ user, accessToken }` dan
   sekaligus memasang cookie refresh.
2. Saat access token habis masa berlaku, frontend memanggil
   `POST /api/auth/refresh` dengan `credentials: "include"`. Server memutar
   refresh token (token lama langsung tidak berlaku) dan mengembalikan access
   token baru.
3. `POST /api/auth/logout` mencabut sesi di server dan mengosongkan cookie.
   Endpoint ini tidak mewajibkan access token yang masih valid, karena access
   token bisa kedaluwarsa lebih dulu daripada cookie — kalau tidak, cookie
   tidak pernah bisa dibersihkan.

Kalau refresh ditolak, server juga mengosongkan cookie-nya supaya browser
tidak mencoba refresh gagal berulang kali.

## Impor tabel Scanning Harga

`npm run import` membaca CSV hasil ekspor Scanning Harga:

```bash
cd server
npm run import "data/Rekap IPH Kota Batu.xlsx - Data IPH Kota Batu.csv"
npm run import -- --help   # lihat cara pakai
```

Tanpa argumen, importer memakai path bawaan `server/data/Rekap IPH Kota Batu.xlsx - Data IPH Kota Batu.csv`.

Importer akan membuat rekap baru, menimpa rekap periode yang sama, dan mengabaikan baris yang bukan kolom Scanning Harga. Aman dijalankan berulang kali karena yang dicocokkan adalah periode (tahun, bulan, minggu).

### Apa yang diimpor

Hanya dua jenis angka, keduanya sudah berbentuk persen:

| Kolom CSV | Pergi ke |
| --------- | -------- |
| `Indikator Perubahan Harga (%)` | `Rekap.indikator` — nilai IPH periode itu |
| `Komoditas Andil Perubahan Harga` | `RekapDetail.nilai` — andil tiap komoditas |

Harga absolut dalam rupiah **tidak diimpor dan tidak dipakai**. Aplikasi menampilkan dan menghitung apa adanya: IPH per periode dan andil tiap komoditas. Lihat [Makna andil](#makna-andil).

```bash
cd server
npm run import
```

Importer aman dijalankan berulang kali; ia mencocokkan periode (tahun, bulan, minggu) dan menimpa data lama bila periode sudah ada.

## Makna andil

Andil adalah andil kontribusi tiap komoditas terhadap pergerakan IPH, dalam **persen poin** — bukan rupiah. Beberapa hal yang perlu diketahui saat membaca data:

- **Andil adalah daftar parsial.** File Scanning Harga memuat 2–3 komoditas andil per periode, bukan keranjang lengkap.
- **Jumlah andil tidak sama dengan IPH.** Contoh data di repo ini: periode September 2026 Minggu IV, IPH `3.06` sedangkan jumlah andil `2.88`. Selisih `0.18` adalah	andil komoditas yang tidak ikut dicantumkan di daftar andil.

Konsekuensinya, aplikasi **tidak pernah menghitung IPH dari andil**. Nilai IPH diambil apa adanya dari kolom `Indikator Perubahan Harga` di CSV, lalu `server/src/lib/rekap.ts` hanya mengelompokkannya (deflasi / inflasi / stabil) berdasarkan angka itu.

Karena itu, menghitung ulang IPH dari data yang sama membutuhkan keranjang komoditas lengkap beserta bobot belanja - data itu tidak ada di repo ini dan tidak diperlukan selama sumbernya tetap file Scanning Harga dari BPS.

## Cakupan fitur dan batasan

- **Rapat dan notulensi.** Admin mengatur jadwal, peserta dan notulis, serta dapat mengubah, membatalkan, atau menghapus agenda. Notulis mengisi hasil rapat sesuai penugasan. Rapat dengan notulensi ditandai selesai.
- **WhatsApp.** Nomor disimpan pada data pegawai. Undangan dan pengingat hari rapat menggunakan antrean backend melalui n8n/WAHA. Monitoring menyediakan pengingat langsung, riwayat pengiriman, dan alternatif manual per kontak. Lihat [integrasi WhatsApp rapat](docs/whatsapp-rapat.md).
- **Teks siaran.** Draf berasal dari rekap periode terpilih dan dapat disunting, disalin, atau dikirim oleh admin kepada peserta rapat. Pesan menyertakan link dashboard publik pada periode yang sama. Tidak ada integrasi API ke Pusda atau klaim rilis resmi Kemendagri.
- **Notifikasi lain.** Email dan notifikasi browser belum tersedia.
- **Enkripsi dokumen.** Draf berupa teks di browser. Domain produksi memakai HTTPS; aplikasi tidak menyediakan enkripsi dokumen tersendiri.
- **PIN berjenjang.** Koreksi rekap hanya memerlukan akun admin; tidak ada PIN berjenjang. Trail audit sudah ada: aksi sensitif (hapus/koreksi rekap, kelola akun, reset kata sandi, jadwal rapat, komoditas, pegawai) tercatat di tabel `AuditLog` beserta pelaku, aksi, rincian, dan IP. Waktu perubahan juga tersimpan di `Rekap.updatedAt`.
- **Unggah Scanning Harga dari web.** Impor lewat CLI (`npm run import`).
- **Harga absolut.** Data yang tersedia hanya IPH dan andil lihat [Makna andil](#makna-andil).

## Catatan produksi (PostgreSQL)

Panduan pemasangan server dan domain `iph.bpskotabatu.com`: [Deployment satu port 5011](docs/deployment.md). Aktifkan `SERVE_FRONTEND=true` untuk melayani hasil build frontend dan API dari layanan yang sama.

Provider Prisma sudah PostgreSQL. Model memakai `@@schema("iph_batu")`; schema lain tidak dikelola. Konfigurasi memakai PGHOST/PGPORT/PGDATABASE/PGUSER/PGPASSWORD. Terapkan migration yang sudah ditinjau:

```bash
cd server
npm run db:migrate   # deploy migration yang tersimpan dalam repo
npm run db:generate
```

Jalankan backend dengan NODE_ENV=production di belakang reverse proxy TLS yang meneruskan `/api` ke port 5011. Pastikan CLIENT_ORIGIN sesuai domain publik dan JWT secret sudah diganti. Cache ringkasan tetap berada di memori setiap proses; penggunaan PostgreSQL tidak menyinkronkan cache antaraproses secara otomatis.

## Struktur folder

```
.
├── src/                    # Frontend
│   ├── components/         # Dashboard, Analisis, Master Data, Pengaturan
│   ├── context/            # AuthContext (token, sesi, peran)
│   ├── data/               # Definisi kolom tabel Scanning Harga
│   ├── lib/                # Klien API, format tanggal/angka
│   └── types/
├── server/
│   ├── prisma/
│   │   ├── schema.prisma   # Model: User, Session, Rekap, Komoditas, dsb.
│   │   ├── seed.ts         # Akun dan data contoh
│   │   └── importer.ts     # CLI impor CSV
│   └── src/
│       ├── routes/         # auth, master, rekap, public
│       ├── lib/            # Prisma, keamanan, rate limit, cache
│       └── middleware/     # Autentikasi, rate limit, error handler
└── vite.config.ts
```

## Troubleshooting

**`EADDRINUSE: address already in use :::5011`**
Port API project IPH sudah dipakai. Periksa proses project ini atau ubah PORT dan target proxy Vite secara bersamaan. Jangan hentikan backend presensi pada 5010.

**`Can't reach database server`**
Periksa PGHOST/PGPORT/PGPASSWORD dan tunnel jika di luar kantor. Jalankan `db:check` setelah `db:migrate`; baca [panduan izin schema](docs/postgresql-kantor.md#3-buat-schema-dan-tabel-project).

**Tabel Scanning Harga kosong setelah seed**
`db:bootstrap` hanya membuat akun awal, tanpa rekap contoh. Impor data asli secara manual setelah meninjau CSV di `server/data/`; importer dapat memperbarui periode yang sudah ada. Data SQLite lama tidak otomatis dipindahkan.

**Login ditolak padahal password benar**
Rate limiter membatasi 10 percobaan login per 15 menit per IP. Tunggu atau restart backend.
