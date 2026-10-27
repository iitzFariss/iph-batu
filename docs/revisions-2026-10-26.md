# Revisi IPH dan rapat TPID, 26 Oktober 2026

## Perubahan

- Klasifikasi IPH mengikuti tanda: positif menjadi Inflasi, negatif menjadi Deflasi. Label dan filter intervensi serta kategori bertingkat dihapus. Nilai nol ditampilkan sebagai tidak berubah, agar tidak disebut inflasi atau deflasi secara keliru.
- Sel arsip mingguan yang tidak memiliki data menggunakan N/A. Angka nol tetap angka, bukan N/A.
- Dashboard dan visualisasi memiliki filter frekuensi komoditas per bulan/tahun. Satu nama dihitung satu kali per pekan, termasuk bila juga dicatat sebagai fluktuasi.
- Angka input manual wajib empat desimal. API menolak presisi lebih dari empat desimal; rincian andil tidak lagi dibulatkan menjadi dua desimal atau dipotong menjadi tiga komoditas saat membaca/mengedit rekap.
- Input Excel menyediakan workbook .xlsx dengan sheet Data IPH dan Panduan, judul kolom, format angka empat desimal, pilihan jenis, serta validasi periode. Batas 1 MB, 1.000 baris dan 20 MB setelah dekompresi. Rumus, makro, tautan eksternal, duplikasi komoditas/periode dan data tidak lengkap ditolak. Pratinjau tidak menulis; tombol impor menyimpan seluruh workbook secara atomik.
- Rekap data tidak lagi menampilkan rentang/cutoff tanggal. Ekspor CSV/Excel berisi Periode, IPH (%), Komoditas, Andil (persen poin), Jenis. Tidak ada kolom cutoff maupun status. Ekspor Excel merupakan workbook asli, dengan header berwarna, pembekuan header, filter, lebar kolom, garis dan baris berselang.
- Visualisasi menghapus stabilitas pasar, ambang intervensi, tombol rincian lengkap, dan isi rincian tambahan. Grafik, rata-rata empat pekan, puncak dan IPH terakhir memakai tahun yang dipilih. Matriks ringkas tetap tersedia dan mengikuti bulan terakhir dari pilihan grafik.
- Kelompok sidebar menjadi Rapat TPID. Analisis teks siaran berada setelah Monitoring rapat; Hasil rapat ditambahkan sesudahnya.
- Pemilih peserta/notulis dapat dicari dengan nama dan tetap dapat digulir. Lokasi dan tautan rapat dipisah, tautan rapat opsional. Peserta dipilih sebelum tautan notulensi dibuat.
- Tautan notulensi wajib dibuat di form rapat dan dikirim hanya kepada notulis. Setiap tautan terikat ke rapat dan pegawai yang ditugaskan. Perubahan peran, pegawai nonaktif, pembatalan dan berakhirnya waktu pengisian menutup akses tulis.
- Pengisian dibuka segera setelah tautan diterima. Batasnya tujuh kali 24 jam sejak pengiriman undangan pertama kepada notulis dikonfirmasi gateway, bukan sejak tanggal rapat. Sebelum konfirmasi tersedia, batas sementara memakai waktu pembuatan rapat. Pengiriman yang terlambat dikonfirmasi memperbarui awal jendela satu kali. Pembaruan tautan tidak memperpanjangnya lagi.
- Halaman notulensi menampilkan hitung mundur berdasarkan waktu server dan WIB untuk tanggal. API publik dan API akun sama-sama memeriksa batas waktu. Menyimpan notulensi sebelum jadwal tidak menandai rapat mendatang sebagai selesai. Hasil rapat menampilkan judul, peserta, notulis, dan notulensi tersimpan.
- Kunci penandatangan tautan disimpan sebagai konfigurasi internal di schema iph_batu, sehingga backend lokal dan produksi yang memakai database yang sama dapat memvalidasi tautan tanpa berbagi JWT login. Kunci tidak dikirim melalui API template.
- Monitoring rapat tidak mendapat desain/fitur baru sesuai klarifikasi pemilik. Pengingat notulensi mengikuti batas pengisian yang baru.
- Template siaran mengikuti format [Data IPH] dan penutup BPS Kota Batu yang diberikan pemilik. Untuk deflasi, arah dan komoditas dipilih dari kelompok deflasi. Tautan dashboard periode yang tepat tetap ditambahkan pada pesan.
- Edit draf/template tersimpan di database dan berlaku untuk semua periode. Penanda {{minggu}}, {{bulan}}, {{tahun}}, {{arah}}, {{iph}} dan {{komoditas}} diisi dengan data periode terpilih. Penyimpanan/reset template dibatasi admin. Petugas dapat membaca dan menyalin hasilnya.
- Administrator disatukan menjadi admin@bpskotabatu.com. Akun admin lama lain dinonaktifkan dan dilepas hak adminnya, tanpa menghapus riwayat atau kepemilikan data. Sesi lama dicabut. Kata sandi mengikuti permintaan pemilik dan tidak dimasukkan ke paket deploy maupun file konfigurasi yang dilacak Git.
- Tombol hapus pada tabel memiliki label terlihat, warna yang jelas, dan target sentuh minimal 44 px. Form, filter dan action rows mengikuti layout vertikal yang sudah disepakati; mode gelap tetap navy.

## Database dan pengujian

Migration 20261026000000_reporting_and_meeting_minutes hanya menambahkan kolom pada iph_batu.Rapat serta tabel iph_batu.AppSetting. Schema presensi tidak diubah. Migration sudah diterapkan pada db_magang yang diakses konfigurasi lokal. Akun admin baru sudah diuji login dan hanya ada satu admin aktif. Data saat pemeriksaan: 181 rekap, 5 rapat, 1 notulensi.

Seluruh 195 tes otomatis lulus. Pengujian API menggunakan SQLite test terpisah melalui client Prisma khusus. Pengujian meliputi presisi, seluruh andil, workbook .xlsx nyata, pratinjau tanpa menulis, impor atomik/duplikasi, formula, otorisasi, template permanen, notulensi sebelum rapat, kedaluwarsa, pemalsuan token, perubahan penugasan, serta kunci tautan yang sama pada dua backend dengan JWT berbeda. Gateway pengiriman diuji dengan fetch tiruan.

Pemeriksaan langsung memakai akun admin baru, ringkasan publik, periode rekap, template siaran, daftar rapat, pengingat, template Excel, dan ekspor Excel. Login berhasil dan ketujuh endpoint merespons HTTP 200. Tidak membuat rapat, rekap, atau mengirim WhatsApp nyata sebagai bagian pengujian.

## Delivery gate

- Hard gate PASS: build frontend/backend dan lint berhasil; alur baru diuji di browser untuk admin dan petugas pada 390, 900, dan 1440 px, terang/gelap. Ada loading, empty dan error states. Tautan memakai tujuan nyata dari data; tidak ada metrik atau testimonial buatan di produk.
- Aksesibilitas PASS: 82 pemindaian axe WCAG A/AA pada layar yang telah selesai dimuat, tanpa pelanggaran; 376 pemeriksaan browser meliputi overflow, target sentuh, filter, presisi, impor, template persisten, hasil rapat dan countdown. Pengujian otomatis tidak membuktikan sertifikasi aksesibilitas menyeluruh.
- Purpose gate PASS: Public Sans, BPS identity, warna kertas dan navy, garis tabel, serta hijau untuk aksi/data mempertahankan DESIGN.md. Warna merah dan label teks membedakan tindakan hapus. Tidak menambah gambar, ikon dekoratif, animasi atau statistik pemasaran.
- Liveliness PASS: ENERGY 1 / RHYTHM 1 / MOTION 1. Judul tugas, periode, data dan tombol utama menjadi fokus tiap halaman. Filter menempel pada data yang dikendalikan; ruang kosong memisahkan tugas, bukan kolom tak terisi.
- Craftsmanship PASS: source fitur ditulis langsung; form memiliki label, busy state dan respons. Tahun terpilih memengaruhi statistik; template tidak hilang saat halaman dimuat ulang; jadwal mendatang tidak ditutup oleh notulensi awal. Rincian hasil memakai data tersimpan, bukan contoh produksi.

## Mencoba lokal

Hentikan npm run dev yang lama sebelum membuat ulang Prisma Client agar DLL Windows tidak terkunci. Setelah itu, dari root project:

```powershell
npm --prefix server run db:generate
npm run dev
```

Masuk kembali menggunakan email admin baru. Untuk undangan nyata, n8n dan session WAHA iph_batu harus WORKING. Pada node Send Meeting WhatsApp, Session harus persis iph_batu. Nomor/API key tidak diganti oleh revisi ini.

Frontend/backend terbaru belum dipasang ke domain. Database yang dipakai lokal dan domain adalah database kantor yang sama, sehingga perubahan akun dan migration sudah berlaku pada database tersebut. Langkah memasang kode ada di update-2026-10-26.md.

## Perbaikan akses notulensi

- Monitoring sebelumnya membatasi tombol Input Notulensi hanya untuk rapat yang tanggalnya sudah lewat. Tombol sekarang muncul sejak pengisian diizinkan oleh API, termasuk sebelum waktu rapat.
- Hasil rapat menyediakan tombol Isi notulensi atau Ubah notulensi untuk admin dan notulis yang ditugaskan. Form menyimpan langsung melalui API akun, menampilkan batas waktu, validasi minimal 10 karakter, status penyimpanan dan kesalahan di dekat isian. Peserta biasa tidak mendapat tombol pengisian.
- Pada dialog ubah rapat, Buka formulir notulensi memakai alamat web yang sedang dibuka. Pengujian localhost tidak dialihkan ke domain produksi. Tautan yang dikirim WhatsApp tetap memakai PUBLIC_APP_URL agar dapat dibuka penerima.
- Tautan yang baru dibuat belum berlaku sebelum jadwal rapat disimpan; petunjuk ini sekarang ditampilkan di form.
- Halaman tautan memeriksa kelengkapan respons API. Server lama yang belum memiliki endpoint tidak lagi menyebabkan halaman kosong; ada penjelasan dan tombol mencoba kembali. Frontend dan backend tetap harus dipasang bersama untuk tautan produksi.
- Verifikasi tambahan: 20 tes API revisi lulus; 81 pemeriksaan browser dan 16 pemindaian axe tanpa pelanggaran pada 390/1440 px, terang/gelap, admin/notulis. Browser memakai data tiruan, tanpa pengiriman WhatsApp nyata. Build dan lint berhasil. Tampilan formulir ponsel diperiksa secara visual.

Delivery gate tambahan: hard gate dan aksesibilitas lulus pada alur yang diuji. Purpose dan craftsmanship mempertahankan form civic yang sama, tombol berlabel tugas, umpan balik di dekat isian, dan tidak menambah aset dekoratif. ENERGY 1 / RHYTHM 1 / MOTION 1 tetap.
