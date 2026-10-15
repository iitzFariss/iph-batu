# Penomoran dan tata letak, 15 Oktober 2026

Delivery gate: PASS untuk perubahan lokal yang diuji. Mode antislop during, session override. Arah CRM yang disepakati tetap digunakan: ENERGY 1 / RHYTHM 2 / MOTION 1. Perubahan belum dipasang ke domain produksi.

## Perubahan

Penomoran draf kini mengikuti bagian yang benar-benar ditampilkan. Jika tidak ada andil penurunan harga, bagian andil kenaikan menjadi nomor 2. Kombinasi penurunan, kenaikan dan fluktuasi tidak menghasilkan lompatan nomor. Draf hasil salin tetap menyertakan periode dashboard.

Input rekap IPH memakai satu panel untuk periode, IPH, andil, fluktuasi, daftar komoditas dan aksi simpan/reset. Pengelolaan komoditas tersedia melalui disclosure Daftar komoditas. Form membagi bidang ke dua kolom jika wadah cukup lebar, dan satu kolom pada wadah sempit. Nilai IPH dan periode sejajar. Preview andil tidak lagi menghabiskan lebar input atau menyebut satuan persen secara keliru; label dan ringkasan memakai persen poin.

Filter, tabel dan pagination rekap data juga menyatu. Filter kategori membungkus agar pilihannya terlihat. Tabel yang membutuhkan lebar besar mempunyai petunjuk geser pada ponsel dan dapat difokuskan untuk pengguliran dengan keyboard.

Footer dialog tambah komoditas, edit rapat, edit rekap dan tambah/edit pegawai memakai susunan tombol yang membungkus. Header profil tidak memaksakan judul serta tombol Batal/Simpan pada satu baris. Teks identitas panjang membungkus. Editor draf juga membungkus catatan dan jumlah karakter.

## Validasi

- Build frontend dan ESLint lulus.
- 162 pemeriksaan alur web lulus: login, navigasi dan izin, formulir rekap, daftar komoditas, penugasan rapat, pegawai, ekspor CSV, siaran, link periode, reminder, notulensi dan pemulihan error.
- 323 pemeriksaan tambahan lulus. Delapan kombinasi isi draf diuji melalui tampilan dan clipboard. Layout delapan halaman kerja, profil saat edit, pengaturan akun, dialog rapat/pegawai, editor siaran, katalog komoditas dan input andil terisi diperiksa pada lebar 320, 390, 768, 1024 dan 1440 dalam kedua tema.
- Pemeriksaan posisi menggunakan kotak aktual DOM: teks tombol tetap di dalam tombol dan tombol bersaudara tidak bertumpuk. Pemeriksaan overflow dokumen serta peninjauan screenshot melengkapinya.
- 43 pemindaian axe WCAG A/AA tanpa temuan otomatis: 23 tampilan utama dan 20 ponsel. Hasil otomatis tidak menyatakan bahwa semua kebutuhan aksesibilitas pengguna sudah terpenuhi.
- Semua API pada pemeriksaan browser merupakan fixture lokal. Tidak ada pengiriman WhatsApp nyata atau penulisan data kantor oleh pengujian ini. Backend tidak diubah pada perbaikan layout ini.

Bukti lokal: `.ui.local/evidence.json`, `layout-evidence.json`, `button-layout.json`, `accessibility.json`, `mobile-accessibility.json`. Screenshot memakai data uji, bukan cuplikan data produksi.

## Delivery gate

| Aturan | Hasil dan bukti |
| --- | --- |
| R-01 | PASS: tidak menambah gradient atau glow. |
| R-02 | PASS: copy yang diubah tidak memakai em dash; nomor mengikuti isi. |
| R-03 | PASS: lima lebar, kedua tema dan keadaan edit diuji tanpa overflow dokumen. |
| R-04 | PASS: tidak menambah ikon dekoratif; ikon yang tersisa mewakili aksi yang ada. |
| R-05 | PASS: satu sheet mengikuti tugas input, pengelolaan katalog bersifat sekunder. |
| R-06 | PASS: font dan skala teks mengikuti DESIGN.md; angka menggunakan format Indonesia. |
| R-07 | PASS: tidak menambah pola latar. |
| R-08 | PASS: tidak menambah panah dekoratif. |
| R-09 | PASS: label dan status tetap terkait data atau aksi. |
| R-10 | PASS: tidak menambah glassmorphism. |
| R-11 | PASS: radius panel dan kontrol tetap mengikuti token desain. |
| R-12 | PASS: panel datar; bayangan dibatasi pada overlay yang sudah ada. |
| R-13 | PASS: tidak menambah glow. |
| R-14 | PASS: bidang formulir, katalog, tabel dan aksi mempunyai susunan sesuai isi. |
| R-15 | PASS: tombol menyatakan aksi simpan, reset, tambah, salin dan edit. |
| R-16 | PASS: label singkat dan tidak menambah klaim pemasaran. |
| R-17 | PASS: angka produk tetap berasal dari API; fixture hanya untuk pengujian lokal. |
| R-18 | PASS: tidak menambah testimoni atau identitas fiktif ke produk. |
| R-19 | PASS: motion tetap hover/transisi yang ada dan reduced-motion dipertahankan. |
| R-20 | PASS: identitas BPS dan isi IPH dipertahankan. |
| R-21 | PASS: toggle dan kedua tema diperiksa. |
| R-22 | PASS: tidak menambah ilustrasi. |
| R-23 | PASS: tidak membuat logo, avatar atau tujuan navigasi baru. |
| R-24 | PASS: navigasi dan link dashboard periode tetap diuji. |
| R-25 | PASS: 43 scan axe tanpa temuan kontras otomatis. |
| R-26 | PASS: 162 pemeriksaan alur termasuk simpan, edit, ekspor, kirim dan salin lulus. |
| R-27 | PASS: loading, empty, error dan retry tetap diuji. |
| R-28 | PASS: tidak menambah FAQ. |
| R-29 | PASS: palet netral, hijau data dan warna status mengikuti tema yang disepakati. |
| R-30 | PASS: arahan referensi eksplisit pengguna dipertahankan tanpa menyalin data CRM. |
| R-31 | PASS: alasan sheet tunggal, disclosure, pembungkusan dan susunan aksi tercatat di DESIGN.md. |
| R-32 | PASS: fokus, Escape, navigasi, disclosure, pengguliran tabel dan zoom tersedia. |
| R-33 | PASS: perubahan ditulis dalam source React/CSS. |
| R-34 | PASS: desktop dan ponsel pada mode terang/gelap diperiksa. |
| R-35 | PASS: build, lint, pemeriksaan alur dan peninjauan screenshot dijalankan. |
| R-36 | PASS: laporan membatasi klaim pada pemeriksaan yang dilakukan. |
| R-37 | PASS: arah dan tiga dial tetap eksplisit dalam DESIGN.md. |
| R-38 | PASS: tidak menambah isi produk yang dibuat-buat. |

C-1 PASS: susunan dipilih untuk mengurangi bidang terpisah dan menjaga urutan kerja. C-2 PASS: alur dan aksi tetap diuji. C-3 PASS: bidang disusun menurut isi data. C-4 PASS: ukuran, tema, error dan keadaan edit diperiksa. C-5 PASS: bukti terpisah dari batas pengujian. Liveliness PASS: angka IPH, isi andil dan form utama tetap menjadi fokus; whitespace memisahkan bagian dalam satu sheet tanpa menambah panel dekoratif.
