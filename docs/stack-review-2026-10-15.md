# Revisi susunan panel, 15 Oktober 2026

Delivery gate: PASS. Revisi lokal ini mengikuti permintaan pemilik agar fitur turun berurutan dan tidak meninggalkan kolom kosong di bawah panel yang lebih pendek. ENERGY 1 / RHYTHM 1 / MOTION 1; alasan diperbarui di `DESIGN.md`.

Monitoring menempatkan pengingat di atas riwayat WhatsApp. Analisis siaran menempatkan penerima di atas draf. Bagian dashboard, bidang input rekap, jadwal dan peserta rapat, evaluasi tren serta profil juga mengikuti alur vertikal. Data pada landing publik mengikuti susunan yang sama. Input pendek yang saling terkait tetap dapat sejajar, dengan urutan DOM dan keyboard tetap utuh.

## Bukti

- Build frontend, ESLint dan `git diff --check` lulus.
- 182 pemeriksaan susunan panel lulus pada 320, 390, 768, 1024 dan 1920 piksel, dalam kedua tema. Riwayat pengiriman memakai delapan pesan uji sehingga panel memiliki tinggi yang berbeda dari formulir.
- Geometri 81 kelompok panel diperiksa setelah elemen tampil: tidak ada kelompok yang hilang, seluruh panel berbagi kolom yang sama, tidak bertumpuk, dan jarak antarpanel maksimal 24 piksel.
- 162 pemeriksaan alur web lulus, termasuk login, izin, input/edit, komoditas, rapat, pegawai, CSV, siaran, link periode, reminder, notulensi, tema, menu dan pemulihan kegagalan.
- 43 scan axe WCAG A/AA tanpa temuan otomatis: 23 tampilan utama dan 20 tampilan ponsel. Hasil ini melengkapi pemeriksaan visual, bukan sertifikasi aksesibilitas universal.
- Screenshot monitoring dan siaran pada 1920 piksel diperiksa. Bukti lokal: `.ui.local/stack-geometry.json`, `stack-evidence.json`, `evidence.json`, `accessibility.json`, `mobile-accessibility.json`, `stack-light-Monitoring-rapat.png`, `stack-light-Analisis-teks-siaran.png`.
- Data dan error pada screenshot adalah fixture pengujian. Semua API browser dimock; pengujian tidak mengirim WhatsApp nyata atau menulis data kantor. Perubahan tidak menyentuh backend, `.env` atau schema database.

## Delivery gate

| Aturan | Hasil dan bukti |
| --- | --- |
| R-01 | PASS: tidak menambah gradient atau glow. |
| R-02 | PASS: teks baru tidak memakai em dash. |
| R-03 | PASS: lima lebar, dua tema, overflow dan geometri panel diperiksa. |
| R-04 | PASS: tidak menambah ikon dekoratif. |
| R-05 | PASS: urutan fitur mengikuti permintaan eksplisit pemilik. |
| R-06 | PASS: tipografi lokal dan format angka dipertahankan. |
| R-07 | PASS: tidak menambah pola latar. |
| R-08 | PASS: tidak menambah panah dekoratif. |
| R-09 | PASS: status tetap mewakili keadaan data atau pengiriman. |
| R-10 | PASS: tidak menambah glassmorphism. |
| R-11 | PASS: radius dan gap memakai token yang sudah ditentukan. |
| R-12 | PASS: panel tetap datar; shadow hanya pada overlay yang ada. |
| R-13 | PASS: tidak menambah glow. |
| R-14 | PASS: susunan mengikuti isi formulir, riwayat, grafik dan tabel. |
| R-15 | PASS: label serta aksi tombol dipertahankan dan diuji. |
| R-16 | PASS: tidak menambah jargon atau copy pemasaran. |
| R-17 | PASS: sumber data produk tetap API; fixture hanya untuk QA. |
| R-18 | PASS: tidak menambah testimoni atau identitas fiktif ke produk. |
| R-19 | PASS: motion dan reduced-motion tetap sama. |
| R-20 | PASS: identitas BPS, data IPH dan tema dipertahankan. |
| R-21 | PASS: toggle serta kedua tema diuji. |
| R-22 | PASS: tidak menambah ilustrasi. |
| R-23 | PASS: tidak membuat logo, avatar atau tujuan navigasi baru. |
| R-24 | PASS: tujuan navigasi dan link periode diuji. |
| R-25 | PASS: 43 scan axe tanpa temuan kontras otomatis. |
| R-26 | PASS: 162 pemeriksaan alur termasuk simpan, edit, kirim dan ekspor lulus. |
| R-27 | PASS: loading, empty, error dan retry tetap diuji. |
| R-28 | PASS: tidak menambah FAQ. |
| R-29 | PASS: palet tetap mengikuti DESIGN.md. |
| R-30 | PASS: revisi mengikuti arahan eksplisit pemilik, tanpa menyalin isi CRM. |
| R-31 | PASS: alasan alur vertikal dan bidang pendek sejajar tercatat di DESIGN.md. |
| R-32 | PASS: DOM order, fokus, Escape, menu dan pengguliran tetap diuji. |
| R-33 | PASS: perubahan ditulis pada source CSS/React. |
| R-34 | PASS: desktop dan ponsel diperiksa pada kedua tema. |
| R-35 | PASS: aplikasi dijalankan, dibuild dan diperiksa melalui browser. |
| R-36 | PASS: klaim dibatasi pada bukti pengujian. |
| R-37 | PASS: arah pemilik dan tiga dial dinyatakan. |
| R-38 | PASS: tidak menambah data produk yang dibuat-buat. |

C-1 PASS: alur vertikal menghindari kolom kosong. C-2 PASS: fitur dan aksi tetap diuji. C-3 PASS: bagian mengikuti isi sebenarnya. C-4 PASS: tinggi panel berbeda, lebar, tema dan keadaan data diperiksa. C-5 PASS: batas bukti disebutkan. Liveliness PASS: nilai IPH, formulir dan agenda tetap menjadi titik fokus masing-masing halaman; whitespace menghubungkan bagian dengan gap yang terukur.

Perubahan belum dipasang ke server produksi. Paket update dan panduannya diperbarui melalui `docs/update-2026-10-15.md`.
