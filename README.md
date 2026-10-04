# TPID Kota Batu — Indikator Harga Pasar (IPH)

Aplikasi web untuk mengelola dan memantau **Indikator Harga Pasar (IPH) Kota Batu**: upload tabel Scanning Harga, verifikasi andil komoditas, dan publikasi ringkasan ke dashboard publik.

Repo ini berisi dua aplikasi terpisah:

| Path     | Isi                | Stack                        |
| -------- | ------------------ | ---------------------------- |
| `/`      | Frontend dashboard | React 19 + Vite + Tailwind 4 |
| `server` | REST API           | Express 4 + Prisma + SQLite |

## Prasyarat

- **Node.js 20+** dan **npm 10+**
- Git
- (Opsional) PostgreSQL 14+ — hanya untuk target produksi, lihat [Catatan produksi](#catatan-produksi-postgresql)

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
cp .env.example .env      # Windows PowerShell: Copy-Item .env.example .env
```

Isi `server/.env` — development lokal cukup memakai nilai default:

```ini
DATABASE_URL="file:./dev.db"
PORT=4000
CLIENT_ORIGIN="http://localhost:5173"
JWT_ACCESS_SECRET="ganti-dengan-rangkaian-acak-panjang"
JWT_REFRESH_SECRET="ganti-dengan-rangkaian-acak-panjang-berbeda"
ACCESS_TOKEN_TTL_MINUTES=15
REFRESH_TOKEN_TTL_DAYS=30
```

>`JWT_ACCESS_SECRET` dan `JWT_REFRESH_SECRET` wajib berbeda dan cukup panjang (minimal 32 karakter). Jangan memakai nilai `change-me` di produksi. Buat string acak, misalnya dengan `node -e "console.log(require('crypto').randomBytes(48).toString('base64url'))"`.

Frontend tidak punya variabel environment sendiri. Dev server memproxy `/api` ke `http://localhost:4000` (lihat `vite.config.ts`).

## Setup database

Developer memakai SQLite lewat `prisma db push` — repo ini **tidak** menyimpan folder `prisma/migrations`.

```bash
cd server
npm run db:generate    # generate Prisma Client
npm run db:push        # terapkan schema ke DATABASE_URL
npm run db:seed        # isi instansi, komoditas, pegawai, akun, dan rekap contoh
```

Cek hasil:

```bash
npm run db:studio      # buka Prisma Studio untuk melihat data
```

## Menjalankan aplikasi

Butuh dua terminal terpisah — frontend dan backend tidak digabung.

```bash
# Terminal 1 — API di http://localhost:4000
cd server
npm run dev
```

```bash
# Terminal 2 — web di http://localhost:5173
npm run dev
```

Buka `http://localhost:5173`. Health check API: `GET http://localhost:4000/api/health`.

### Akun seed (development)

| Peran      | Email                              | Password    |
| ---------- | ---------------------------------- | ----------- |
| Admin      | `admin@tpid-batu.go.id`            | `admin123`  |
| Petugas    | `siti.rahmawati@bps-batu.go.id`    | `petugas123` |
| Petugas    | `bambang@diskoperindag-batu.go.id` | `petugas123` |
| Tamu       | `tamu@tpid-batu.go.id`             | `tamu123`   |

> Password di atas hanya untuk lokal. Hapus atau ubah sebelum dipakai di lingkungan bersama.

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

Test backend memakai database SQLite sendiri di `server/prisma/test.db`, **tidak pernah menyentuh `dev.db`**. `globalSetup` meng-*override* `DATABASE_URL` (bukan membaca `.env`), menjalankan `prisma db push` ke database test, dan memverifikasi sidik jari `dev.db` sebelum-sesudah run. `prisma/seed.ts` sengaja tidak dipakai karena isinya menghapus seluruh tabel.

```bash
cd server
npm test           # sekali jalan
npm run test:watch # mode watch
```

Cakupan test: health check dan header keamanan, login (gagal/berhasil/akun belum aktif/token dimanipulasi), rate limit auth dan tulis, filter `tahun`/`bulan`/`minggu`, endpoint `/api/rekap/periods`, activity log, serta master data.

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

## Yang belum ada

Fitur berikut masih kosong, jadi tidak ada di antarmuka maupun di backend. Dicatat supaya README dan tampilan aplikasi tidak menjanjikan sesuatu yang tidak dikerjakan.

- **Modul rapat dan notulen.** `Monitoringresume.tsx` dan `Kelolarapat.tsx` masih menampilkan data contoh, dan backend belum punya model maupun route rapat. Jangan dipakai sebagai rujukan data riil.
- **Integrasi Kemendagri.** Tidak ada integrasi API ke Pusda. Draf siaran pers disusun di browser lalu disalin manual; tidak ada pengiriman otomatis.
- **Notifikasi.** Tidak ada email maupun notifikasi browser. Pengaturan notifikasi tidak ada di UI.
- **Enkripsi dokumen.** Draf siaran pers berupa teks plaintext di browser. Tidak ada enkripsi saat transit maupun saat disimpan.
- **PIN dan audit trail.** Koreksi rekap hanya memerlukan akun admin; tidak ada PIN berjenjang dan tidak ada tabel audit. Waktu perubahan tersimpan di `Rekap.updatedAt`.
- **Unggah Scanning Harga dari web.** Impor lewat CLI (`npm run import`).
- **Harga absolut.** Data yang tersedia hanya IPH dan andil lihat [Makna andil](#makna-andil).

## Catatan produksi (PostgreSQL)

Repo masih memakai SQLite untuk development. Untuk BPS:

1. Ubah `provider = "sqlite"` menjadi `provider = "postgresql"` di `server/prisma/schema.prisma`.
2. Arahkan `DATABASE_URL` ke instance PostgreSQL di `server/.env`.
3. Terapkan schema:

```bash
cd server
npm run db:migrate   # membuat migration pertama untuk PostgreSQL
npm run db:generate
```

4. Jalankan backend dengan `NODE_ENV=production npm start` di belakang reverse proxy TLS. Pastikan `CLIENT_ORIGIN` sesuai domain publik dan `JWT_*_SECRET` sudah diganti.

Karena SQLite tidak cocok untuk multi-instance, endpoint ringkasan yang di-cache (60 detik) dan session di database akan konsisten setelah pindah ke PostgreSQL.

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

**`EADDRINUSE: address already in use :::4000`**
Port API sudah dipakai. Hentikan proses lain, atau ubah `PORT` di `server/.env` (frontend dev server tetap memproxy ke 4000, jadi sesuaikan `vite.config.ts` bila mengganti port).

**`Can't reach database server`**
`server/.env` belum ada atau `DATABASE_URL` salah. Jalankan `npm run db:push` dari folder `server`.

**Tabel Scanning Harga kosong setelah seed**
`npm run db:seed` mengisi rekap contoh. Untuk data asli, jalankan `npm run import` setelah menempatkan CSV di `server/data/`.

**Login ditolak padahal password benar**
Rate limiter membatasi 10 percobaan login per 15 menit per IP. Tunggu atau restart backend.
