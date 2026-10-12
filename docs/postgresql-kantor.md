# PostgreSQL kantor untuk IPH Batu

Konfigurasi project: database `db_magang`, schema **`iph_batu`**, backend API **5011**. Project presensi tetap memakai schema `presensi` dan API 5010. Tidak ada perubahan role, search_path global, tabel, data, atau konfigurasi presensi.

## Struktur dan kebutuhan tabel

Frontend React memanggil `/api` melalui `src/lib/api.ts`. Backend Express memvalidasi autentikasi/peran dan memakai Prisma untuk membaca/menulis PostgreSQL. Password PostgreSQL hanya berada di environment backend.

| Tabel dalam iph_batu | Kegunaan dan hubungan |
| --- | --- |
| User | Akun admin, petugas, tamu; email dan emailNorm unik; password berupa hash bcrypt; instansi opsional. |
| Session | Sesi refresh token ter-hash, perangkat, kedaluwarsa, pencabutan; FK ke User dengan cascade. |
| AuditLog | Jejak aksi sensitif; actorId sengaja tanpa FK agar jejak tidak hilang saat akun dihapus. |
| Instansi | Master instansi, nama unik; dirujuk User dan Pegawai. |
| Komoditas | Master komoditas, nama/namaNorm unik, unit dan status aktif. |
| Pegawai | Personel TPID, NIP unik, akun User opsional satu-ke-satu, instansi opsional. |
| Rekap | IPH per tahun/bulan/minggu, nilai, status, pembuat; periode gabungan unik. |
| RekapDetail | Andil atau fluktuasi komoditas per rekap; FK ke Rekap dan Komoditas. |
| Rapat | Jadwal, lokasi, catatan, status; createdById tanpa FK untuk mempertahankan riwayat. |
| PetugasRapat | Relasi Rapat–Pegawai dan peran peserta/notulis; pasangan rapat/pegawai unik. |
| Notulensi | Satu notulensi per rapat, isi dan notulis Pegawai, waktu pengiriman/perubahan. |

ID tetap CUID yang dibuat Prisma. IPH/andil tetap double precision agar API/model TypeScript yang ada tetap kompatibel. Waktu menggunakan timestamp(3), sesuai pemetaan DateTime Prisma saat ini. Migration mempertahankan index, unique constraint, FK dan aturan cascade model yang ada; tidak membuat relasi lintas schema.

Semua model memakai `@@schema("iph_batu")`; datasource hanya mencakup schema itu. URL Prisma dibuat backend dari variabel `PG*`, dengan schema tetap `iph_batu` dan pool maksimal 5 koneksi per proses. `_prisma_migrations` menggunakan schema project pada URL koneksi. Tabel presensi tidak dikelola oleh migration ini. Pemakaian user PostgreSQL yang sama bukan pemisahan hak akses antaraplikasi: hak user `magang` yang sudah ada tidak diubah.

## 1. Environment lokal

Dari root project:

```powershell
if (-not (Test-Path server/.env)) { Copy-Item server/.env.example server/.env }
```

Jika `.env` sudah ada, **edit file yang ada** dan pertahankan secret JWT milik Anda. Hapus konfigurasi SQLite `DATABASE_URL="file:./dev.db"` lama agar tidak membingungkan; konfigurasi koneksi aplikasi kini membaca `PG*`, bukan `DATABASE_URL` lokal.

Untuk laptop di luar kantor, isi:

```dotenv
PGHOST=127.0.0.1
PGPORT=15433
PGDATABASE=db_magang
PGUSER=magang
PGPASSWORD=""
PGSSLMODE=prefer
PORT=5011
CLIENT_ORIGIN="http://localhost:5173"
```

Isi `PGPASSWORD` sendiri di `.env` lokal. Gunakan password asli, tanpa percent encoding; backend mengencode karakter khusus untuk URL Prisma. Jika password mengandung `#`, gunakan tanda kutip sesuai format dotenv. Isi juga `JWT_ACCESS_SECRET` dan `JWT_REFRESH_SECRET` dengan dua nilai acak berbeda. Untuk membuat nilai acak lokal:

```powershell
node -e "console.log(require('crypto').randomBytes(48).toString('base64url'))"
```

Untuk akses langsung dari jaringan kantor, cukup ubah:

```dotenv
PGHOST=192.168.100.10
PGPORT=5432
```

`PGDATABASE`, `PGUSER`, schema, dan port API tetap sama. `PGSSLMODE=prefer` mengikuti kemampuan TLS server. Jika kantor mewajibkan TLS, gunakan `require` sesuai arahan DBA. SSH melindungi jalur laptop–gateway; konfigurasi TLS PostgreSQL berlaku pada koneksi gateway–PostgreSQL.

## 2. Tunnel di luar kantor

Konfigurasi OpenSSH/cloudflared yang sudah tersedia digunakan tanpa perubahan. Jalankan pada terminal pertama, biarkan tetap terbuka:

```powershell
ssh -N -o ExitOnForwardFailure=yes -L 127.0.0.1:15433:192.168.100.10:5432 root@ssh.kaitourae.my.id
```

Port 15433 hanya bind ke loopback laptop. Tunnel ini untuk PostgreSQL, bukan port API 5011. Lakukan login Cloudflare/SSH jika diminta. Periksa listener dari terminal kedua:

```powershell
Test-NetConnection 127.0.0.1 -Port 15433
```

Listener yang aktif belum membuktikan autentikasi/koneksi PostgreSQL; pemeriksaan database dilakukan dengan `db:check` setelah migration.

## 3. Buat schema dan tabel project

Jalankan dari terminal kedua:

```powershell
cd server
npm install
npm run db:generate
npm run db:migrate
npm run db:check
npm run db:status
```

`db:migrate` menjalankan **prisma migrate deploy**, menerapkan file `prisma/migrations/20261011000000_init_iph_batu/migration.sql`. Migration membuat schema `iph_batu` dan 11 tabel dalam transaksi, tanpa seed dan tanpa shadow database. SQL menggunakan nama schema eksplisit pada tabel, index target dan referensi FK. Perintah dapat dijalankan kembali: migration yang sudah tercatat tidak diterapkan dua kali.

Jika `permission denied for database` atau izin membuat schema tidak tersedia, minta DBA menjalankan **hanya** `server/prisma/permissions.sql` saat terhubung ke `db_magang`. Skrip membuat/memberi USAGE dan CREATE pada `iph_batu` untuk `magang`; tidak mengubah hak database secara global. Setelah itu ulangi `db:migrate`. Jika schema sudah ada tetapi dimiliki role lain, DBA perlu memeriksa kepemilikannya sebelum memberikan izin; jangan mengubah kepemilikan schema presensi.

Jangan menjalankan `migrate reset`, `migrate dev`, atau `db push --accept-data-loss` pada database kantor. Skrip npm reset/push sengaja tidak disediakan. Migration baru untuk pengembangan sebaiknya dibuat pada PostgreSQL lokal/terpisah, ditinjau SQL-nya, kemudian diterapkan melalui deploy. Jangan mengubah migration yang sudah diterapkan.

Gunakan runner Prisma di atas supaya riwayat migration tercatat. Jika SQL awal pernah dijalankan manual, DBA perlu mencocokkan struktur lalu melakukan baseline migration yang sesuai, bukan menjalankan ulang CREATE TABLE secara paksa.

## 4. Inisialisasi akun tanpa data demo

Database yang baru dimigrasikan belum memiliki akun. Isi nilai berikut di `server/.env` lokal:

```dotenv
INITIAL_ADMIN_EMAIL=""
INITIAL_ADMIN_NAME="Administrator TPID"
INITIAL_ADMIN_PASSWORD=""
```

Isi email dan password administrator sendiri (password minimal 12 karakter), lalu:

```powershell
npm run db:bootstrap
```

Bootstrap membuat akun administrator dan akses tamu dalam transaksi. Password di-hash, tidak dicetak. Akun yang sudah ada tidak diubah atau di-reset; konflik akun menghasilkan pesan dan rollback. Akun tamu menggunakan password acak internal dan tetap dapat diakses lewat tombol dashboard publik. Setelah berhasil, hapus `INITIAL_ADMIN_PASSWORD` dari `.env` jika tidak diperlukan lagi.

`db:seed` lama berisi penghapusan data dan akun demo; sekarang diblokir untuk `db_magang`. Masuk memakai akun administrator yang baru dibuat, kemudian kelola instansi, komoditas dan pegawai melalui aplikasi. Data SQLite lama tidak dihapus dan tidak otomatis disalin oleh migration struktur. Impor CSV tetap tersedia secara manual (`npm run import -- "path/file.csv"`) dan dapat memperbarui periode yang sudah ada; tinjau data sebelum menjalankannya.

### Pemindahan seluruh data SQLite lama

Migrator terpisah membaca `server/prisma/dev.db` secara read-only dan mencakup semua 11 model. Jalankan dari `server` dengan Node.js 22.16+ atau 24+:

```powershell
npm run db:transfer -- --source-only # inspeksi SQLite, tanpa koneksi PostgreSQL
npm run db:transfer                 # preview konflik dan jumlah record, tanpa menulis
npm run db:transfer -- --apply       # backup, pemindahan, dan verifikasi
```

Target wajib database `db_magang` dan schema `iph_batu`. Saat apply, backup SQLite yang konsisten (termasuk data WAL) dibuat di `server/backups/`, lalu backup tersebut menjadi sumber pemindahan. Folder backup dan laporan jumlah record diabaikan Git karena database memuat data akun dan pribadi. SQLite asli tidak diubah.

Semua insert berjalan dalam satu transaksi PostgreSQL dengan penguncian tabel project selama proses. ID, hash password akun yang baru diimpor, tanggal, status, dan relasi dipertahankan. Jika email akun sudah ada dengan role/status yang sama, seluruh nilai akun PostgreSQL dipertahankan, termasuk password/profil; foreign key dan referensi user pada audit/rapat diarahkan ke ID akun tersebut. Konflik lain yang berbeda isinya menghentikan seluruh transaksi, tanpa overwrite. Setiap record hasil dan jumlah per tabel diperiksa sebelum commit. Preview setelah apply dapat dipakai untuk memastikan tidak ada record tambahan yang masih perlu dipindahkan. Proses ini tidak menjalankan query pada schema `presensi`.

Pemindahan pada 11 Oktober 2026 berhasil: 969 record sumber diproses, 968 record ditambahkan, dan satu akun tamu yang sudah ada dipertahankan. PostgreSQL setelah pemindahan memuat 9 instansi, 27 komoditas, 6 pengguna (termasuk administrator baru), 7 pegawai, 178 rekap, 689 detail rekap, 2 rapat, 2 penugasan rapat, 1 notulensi, 47 sesi, dan 2 audit log. Akun dari database lama kini tersedia bersama akun administrator yang dibuat melalui bootstrap.

## 5. Jalankan aplikasi

Kembali ke root project, dengan tunnel tetap aktif jika di luar kantor:

```powershell
cd ..
npm run dev
```

- Frontend: `http://localhost:5173`
- Backend project IPH: `http://localhost:5011`
- Health API: `http://localhost:5011/api/health`
- Backend presensi: tetap 5010.

Vite meneruskan `/api` ke 5011. React tidak menggunakan driver PostgreSQL dan tidak menerima variabel `PGPASSWORD`. Untuk build produksi, jalankan build frontend dan backend; reverse proxy harus meneruskan `/api` ke backend 5011, dengan HTTPS dan CLIENT_ORIGIN sesuai domain aplikasi.

## Pengujian dan batas verifikasi

`npm test` di `server` menjalankan regression API pada SQLite test lokal terpisah. Schema/client test dihasilkan dari model produksi, dengan deklarasi schema PostgreSQL dilepas hanya pada salinan test yang diabaikan Git. Client PostgreSQL aplikasi tidak ditimpa. Test tidak memakai `.env` kantor, tidak menghubungi gateway, dan tidak menulis ke `db_magang`.

Test konfigurasi mencakup LAN/tunnel, encoding password, port invalid, schema yang dikunci, serta pembatasan SQL migration. Regression SQLite tidak menggantikan uji integration PostgreSQL. Koneksi kantor, hak akses, dan penerapan migration baru bisa diverifikasi setelah password diisi dan koneksi/tunnel tersedia. Tidak ada migration, bootstrap, seed atau perubahan schema yang dijalankan ke kantor selama penyiapan ini.

## Git

Semua `.env` dan `.env.*` diabaikan, kecuali `.env.example`. Jangan menyalin password ke contoh konfigurasi, URL Git, SQL, atau dokumentasi. Verifikasi sebelum commit:

```powershell
git check-ignore server/.env
git ls-files '*env*'
git diff --cached
```

File `.env` yang sudah pernah dilacak Git tidak otomatis berhenti dilacak karena `.gitignore`; periksa hasil `git ls-files`. Tidak ada password yang perlu dimasukkan ke commit.

Referensi: [Prisma connection URLs](https://www.prisma.io/docs/orm/v6/reference/connection-urls), [Prisma multi-schema](https://www.prisma.io/docs/orm/prisma-schema/data-model/multi-schema), dan [Prisma Migrate](https://www.prisma.io/docs/orm/v6/prisma-migrate/getting-started).
