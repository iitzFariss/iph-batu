# Revisi tombol masuk dan dark mode

Permintaan pengguna: tombol kanan atas cukup “Masuk”, dark mode bernuansa biru. Mode antislop sesi tetap during. Arah aplikasi layanan publik tetap ENERGY 1 / RHYTHM 2 / MOTION 1.

Tombol header kini bertuliskan “Masuk” pada semua ukuran layar, tetap membuka halaman login. Latar dark mode `#0b1220`, panel `#111c2e`, lapisan kontrol `#1e2b42`, dan border `#33445f`. Biru navy membedakan lapisan; hijau tetap menjadi aksen tindakan dan warna status dipertahankan. Teks sekunder `#b2bfd2` memiliki kontras 9,17:1 pada panel. Latar panel rapat terlambat juga dipetakan ke warna status gelap agar tidak memakai merah terang transparan.

## Delivery Gate revisi

- R-02/R-15 PASS: label tombol langsung menyebut “Masuk”, tanpa teks tambahan atau perubahan tujuan.
- R-03 PASS: sepuluh halaman/keadaan pada lebar 400 px tidak memiliki overflow halaman dalam pemeriksaan browser.
- R-25 PASS: 20 pemeriksaan otomatis tema terang/gelap serta 10 pemeriksaan mobile bersih; rasio teks sekunder diverifikasi dengan checker skill.
- R-26/R-35 PASS: klik Masuk membuka login; login administrator dan navigasi delapan halaman berhasil dalam pemeriksaan browser; lint dan build berhasil.
- R-34 PASS: palet dark mode diterapkan pada beranda, login, dashboard, dan halaman kerja melalui token bersama; mode terang tetap lolos pemeriksaan.
- Purpose-Gate PASS: perubahan palet berasal dari permintaan biru navy pengguna; perbedaan terang lapisan menunjukkan struktur panel/kontrol. Tidak menambah gradient, dekorasi, aset, atau gerak.
- Liveliness PASS: dial tetap 1/2/1; fokus angka IPH, jarak kelompok konten, dan aksen tindakan tetap terlihat pada pratinjau navy.
- Craftsmanship PASS: lingkup perubahan hanya label dan warna, tanpa perubahan handler bisnis atau backend. Butir lain mengikuti [gate lengkap sebelumnya](verification-2026-10-07.md), tanpa fitur, aset, atau klaim baru.

Bukti: [desktop dan dua tema](evidence/navy-accessibility-2026-10-08.json), [mobile dark mode](evidence/navy-mobile-2026-10-08.json), [pratinjau dashboard navy](previews/dashboard-navy-2026-10-08.png), [beranda mobile navy](previews/landing-navy-mobile-2026-10-08.png).

Pengujian memakai Chrome headless; tidak menyimpan/menghapus data pengguna. Build tetap memiliki peringatan bundel melebihi 500 kB yang sudah tercatat sebelumnya.
