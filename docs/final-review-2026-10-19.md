# Pemeriksaan admin dan petugas, 19 Oktober 2026

Pemeriksaan ini mencakup kode frontend/backend, alur browser dengan API mock, dan pengujian API pada database SQLite terpisah. Dua masalah dari screenshot direproduksi melalui alur formulir. Temuan yang terkonfirmasi telah diperbaiki di kode lokal. Pemeriksaan ini bukan pernyataan bahwa aplikasi bebas dari seluruh kemungkinan bug.

## Temuan dan perbaikan

| Bagian | Sebelumnya | Perbaikan |
| --- | --- | --- |
| Tambah/edit pegawai | Penolakan API ditulis ke banner halaman di belakang modal. | Formulir menunggu hasil API dan menampilkan error di dalam modal. Isian dipertahankan untuk dikoreksi. |
| Validasi NIP | Frontend hanya memeriksa apakah NIP kosong; panjang salah baru ditolak server. | Validasi 16–18 digit mengikuti backend, petunjuk selalu terlihat, fokus diarahkan ke kolom yang salah, dan field terhubung ke pesan error. Spasi pemisah tetap diizinkan. |
| Penyimpanan pegawai | Tombol dapat dipakai berulang selama permintaan berjalan; modal tinggi dapat sulit digunakan di layar pendek. | Status menyimpan menonaktifkan tombol/isian dan penutupan modal. Badan formulir dapat digulir, dengan tinggi dibatasi viewport. |
| Akun dan direktori pegawai | Akun login dibuat sebelum data pegawai, sehingga kegagalan langkah kedua dapat meninggalkan akun terpisah. Edit direktori lama juga dapat membuat akun tanpa email yang diminta secara eksplisit. | Pembuatan akun dilakukan sebagai nested create bersama pegawai dalam satu operasi atomik. Pembuatan akun saat edit memerlukan pengiriman kolom email secara eksplisit. |
| Ganti kata sandi | Frontend tidak mengirim `konfirmasi`, padahal schema backend mewajibkannya. Respons menjadi “Required”. | Frontend mengirim ketiga kolom; validasi kosong/tidak cocok dijelaskan dalam bahasa Indonesia. Petunjuk minimal 8 karakter, autocomplete dan status menyimpan diperjelas. |
| Sesi pengguna | Daftar dihapus dari layar sebelum server mengonfirmasi. Kegagalan memuat dan mencabut sesi diabaikan. | Sesi dihapus setelah API berhasil. Gangguan ditampilkan dengan tindakan muat ulang, serta tombol dinonaktifkan selama operasi. |
| Pencabutan akses | Middleware hanya memeriksa tanda tangan JWT. Sesi dicabut, akun nonaktif, atau peran berubah masih bisa memakai token lama sampai kedaluwarsa. | Setiap permintaan terautentikasi memeriksa sesi aktif dan status/peran akun terkini. Penggantian sandi dan pencabutan sesi lain juga disimpan dalam satu transaksi. |
| Sesi kedaluwarsa | Sesi yang sudah melewati `expiresAt` masih muncul sebagai aktif. | Endpoint daftar sesi dan ringkasan aktivitas hanya menghitung sesi yang belum kedaluwarsa. |
| Hapus akun | Kegagalan penghapusan diabaikan dan pengguna tetap dikeluarkan. | Pengguna tetap masuk ketika penghapusan ditolak; alasan ditampilkan. Teks tidak lagi menjanjikan penghapusan seluruh data. |
| Edit profil/pegawai | PATCH tanpa kolom instansi dapat mengosongkan instansi yang tersimpan. | Kolom yang tidak dikirim dipertahankan; pengosongan hanya dilakukan jika diminta secara eksplisit. Instansi akun terkait pegawai juga dipertahankan. |
| Tampilan profil | Fungsi refresh hanya memperbarui token, sehingga identitas di header tetap memakai data lama. Membatalkan edit juga meninggalkan draf di tampilan. | Profil terkini dimuat kembali ke konteks autentikasi. Batal mengembalikan nama, nomor, dan bio yang tersimpan. |
| Email direktori | Mengosongkan email mengirim string kosong yang ditolak schema. | Pengosongan mengirim `null`. Akun login terkait tidak otomatis dihapus. |
| Refresh token bersamaan | Permintaan paralel dan unduhan dapat berlomba merotasi refresh token yang sama. | Permintaan berbagi satu proses refresh. Respons 401 yang terlambat memakai token terbaru sebelum mencoba refresh lagi. |
| Edit rekap | Error API ada di belakang modal; input angka langsung diparsing sehingga input kosong/tidak valid bisa mempertahankan nilai lama. | Error API muncul di modal. Teks angka dipertahankan selama mengetik, divalidasi sebelum simpan, dan mendukung angka negatif serta desimal koma. |
| Rentang tanggal rekap | Rentang otomatis terlihat dapat diedit, tetapi perubahan tidak disimpan API. | Rentang ditampilkan sebagai read-only dengan penjelasan bahwa tanggal mengikuti periode pelaporan. |
| PATCH rekap sebagian | Mengirim nilai IPH saja dapat menghapus seluruh detail komoditas karena array yang tidak dikirim dianggap kosong. | Kelompok andil dan fluktuasi yang tidak dikirim dipertahankan. Array kosong/null eksplisit tetap dapat menghapus kelompok yang dimaksud. |
| Notulensi lebih dari satu notulis | Prioritas operator pada pemilihan penulis bisa mencatat notulis pertama walaupun notulis lain yang mengirim. | Notulis yang sedang masuk dicatat sebagai penulis. Pengingat manual juga mencakup seluruh notulis yang ditugaskan. |
| Kalender pengingat | Perhitungan hari dan tanggal manual mengikuti zona waktu host, sehingga bisa berbeda antara laptop dan server UTC. | Kalender pengingat memakai WIB secara eksplisit, termasuk saat tanggal UTC belum berganti. |

Perubahan komoditas dan pengingat notulensi dari 16 Oktober tetap dipertahankan. Tidak ada perubahan schema database atau konfigurasi `presensi`.

## Bukti pengujian

- `npm --prefix server test`: 175 tes, 14 berkas, seluruhnya lulus. Pengujian tambahan berada di `server/tests/final-audit.test.ts`.
- `npm --prefix server run build`, `npm run build`, dan `npm run lint`: lulus.
- Pemeriksaan browser seluruh halaman: 162 pemeriksaan lulus, tanpa runtime error.
- Pemeriksaan tata letak: 323 pemeriksaan lulus, tanpa runtime error; mencakup lebar 320, 390, 768, 1024, dan 1440, kedua tema, tombol, dialog, dan variasi isi siaran.
- Pemeriksaan regresi formulir/peran: 50 pemeriksaan lulus, mencakup error NIP lokal/server, penolakan API, isian yang dipertahankan, tombol menyimpan, angka rekap, kolom konfirmasi sandi, kegagalan pencabutan sesi, kegagalan hapus akun, profil, dan refresh token paralel. Bukti rinci disimpan di `.ui.local/final-evidence.json`.
- Pemindaian otomatis WCAG A/AA: 23 pemindaian halaman dan 12 pemindaian kondisi formulir tidak menemukan pelanggaran. Hasil tersimpan di `.ui.local/accessibility.json` dan `.ui.local/final-accessibility.json`. Ini melengkapi pemeriksaan browser, bukan sertifikasi aksesibilitas menyeluruh.
- Semua API browser di-mock. Tidak ada notifikasi WhatsApp sungguhan, penambahan pegawai kantor, penghapusan data kantor, atau penggantian password akun asli untuk pengujian.

## Antislop delivery gate

- Hard Gate PASS dalam lingkup perubahan: error dijelaskan dekat tindakan/formulir, tombol mempunyai perilaku nyata, validasi dapat dibaca, dan pemeriksaan browser/aksesibilitas di atas tidak menemukan kerusakan pada kondisi yang diuji.
- Purpose-Gate PASS: tambahan UI hanya berupa petunjuk validasi, status proses, dan pesan kegagalan yang membantu menyelesaikan tugas. Tidak ada aset, dekorasi, atau navigasi baru.
- Liveliness PASS: arah `DESIGN.md` dipertahankan, ENERGY 1 / RHYTHM 1 / MOTION 1. Public Sans, identitas BPS/TPID, aksen data, tema gelap biru, dan panel vertikal tetap digunakan.
- Craftsmanship PASS dalam lingkup perubahan: operasi gagal tidak ditampilkan sebagai berhasil, isian koreksi dipertahankan, hak akses diperiksa backend, dan perubahan data parsial tidak menghapus kolom yang tidak dikirim. Bukti berupa pengujian API, browser, build, dan lint yang disebutkan di atas.

## Batas pengujian dan pemasangan

Pengiriman WA/WAHA, koneksi PostgreSQL kantor, konfigurasi reverse proxy, dan perilaku domain produksi belum diuji ulang secara langsung pada sesi ini. Pengujian database menggunakan client SQLite terpisah; setelah deploy lakukan smoke test di PostgreSQL untuk login admin/petugas, tambah/edit pegawai uji, ganti kata sandi akun uji, edit rekap uji, dan notulensi uji. Gunakan nomor WA milik penguji jika menguji pengiriman nyata.

Kode ini belum otomatis diterapkan ke domain. Paket sumber disiapkan di `deploy/package.local/iph-batu-update-2026-10-19.tar.gz`; petunjuk pemasangan ada di `docs/update-2026-10-19.md`. Paket tidak berisi `.env`, password/token, database, atau `node_modules`.
