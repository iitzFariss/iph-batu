# Pemeriksaan desain TPID Kota Batu

Tanggal: 7 Oktober 2026. Antislop digunakan selama pengerjaan sesuai pilihan sesi pengguna.

Revisi lanjutan: dark mode diubah menjadi charcoal netral sesuai koreksi pengguna; tata letak judul, ukuran teks, dan bahasa ditinjau ulang. Bukti dan pratinjau di laporan ini diperbarui setelah revisi.

## Arah desain dan alasan

Brief pengguna: tampilan lebih clean, modern, nyaman dilihat, dengan fungsi yang ada tetap berjalan. Pembacaan desain disampaikan sebelum perubahan: aplikasi pemantauan IPH untuk petugas TPID dan masyarakat, tampilan terang, aksen hijau terukur, ENERGY 1 / RHYTHM 2 / MOTION 1.

- Warna: mode gelap memakai latar `#121212`, panel `#1e1e1e`, border `#404040`, teks utama `#f1f1f1`, dan teks sekunder `#b3b3b3`. Hijau hanya menjadi aksen tindakan/navigasi, bukan warna seluruh permukaan. Merah, kuning, serta biru dipakai untuk makna status data.
- Tipografi: Segoe UI dengan fallback sistem, agar teks formulir dan angka tabel mudah dibaca tanpa mengunduh font. Huruf kapital dan tracking dikurangi; angka tetap tabular.
- Tata letak: pada desktop, judul/deskripsi dan angka IPH berada di dua sisi ringkasan; pada ponsel keduanya bertumpuk dengan pemisah. Grafik dashboard menyesuaikan lebar layar. Judul beranda mengalir tanpa pemotongan baris paksa. Judul halaman dipersingkat dan nama sidebar mengikuti isi halaman.
- Ruang: jarak antarbagiannya memisahkan ringkasan, tabel, grafik, dan formulir. Tabel komoditas berubah menjadi baris bertingkat pada ponsel; tabel data lebar memakai wadah gulir tersendiri.
- Bentuk: radius 8 px untuk kontrol, 12 px untuk panel umum, dan 16 px pada formulir login. Badge status tidak menjadi pola seluruh komponen.
- Ikon: memakai ikon yang sudah tersedia untuk tujuan spesifik seperti navigasi, tema, kata sandi, hapus, dan kembali. Tidak membuat logo, foto, ilustrasi, atau statistik baru.
- Kedalaman: border menjadi pemisah utama; bayangan kecil pada pilihan peran dan lapisan mengambang menunjukkan posisi kontrol. Tidak memakai glow, pola latar, atau glassmorphism.
- Gerak: transisi singkat pada drawer dan kontrol memberi umpan balik; preferensi reduced motion dihormati. Tidak menambahkan animasi dekoratif.
- Teks: IPH ditulis konsisten sebagai Indeks Perkembangan Harga, TPID sebagai Tim Pengendalian Inflasi Daerah. Judul seperti “Generator Siaran Pers & Ringkasan Eksekutif” diganti “Draf siaran pers”. “Cutoff” menjadi “Tanggal awal/akhir”, “personil” menjadi “personel”, dan “None” menjadi “Belum tersedia”. Angka ringkasan dan tabel mingguan menggunakan koma desimal. Penanda modul V4 dan kode bergaya dokumen Kemendagri yang tidak memiliki dasar dihapus. Klaim notifikasi gangguan otomatis serta ID laporan fiktif pada halaman 500 juga dihapus.
- Keterbacaan: judul halaman 22–28 px, judul panel 16 px, paragraf 14 px dengan tinggi baris 1,65, dan isi tabel kecil 13 px. Ukuran dan jarak ini memisahkan judul, instruksi, dan data tanpa bergantung pada huruf tebal di seluruh halaman.

## Referensi internet

- [Anti Slop, repositori penulis](https://github.com/miqdadbadjuber/anti-slop): filter terhadap pola generik, bukan ketentuan palet atau layout. Skill lokal tetap menjadi instruksi yang digunakan; tidak mengunduh instruksi pengganti.
- [Google Material, design a dark theme](https://codelabs.developers.google.com/codelabs/design-material-darktheme): permukaan gelap memakai lapisan berbeda sesuai elevasi. Penerapan di sini: charcoal dengan panel sedikit lebih terang dan aksen terbatas, sesuai preferensi pengguna.
- [GOV.UK, writing for user interfaces](https://www.gov.uk/service-manual/design/writing-for-user-interfaces): antarmuka perlu dapat dipindai tanpa membaca seluruh penjelasan. Penerapan: judul tugas yang singkat, istilah konsisten, dan instruksi langsung.
- [Nielsen Norman Group, visual hierarchy](https://www.nngroup.com/articles/visual-hierarchy-ux-definition/): ukuran dan organisasi elemen membantu urutan perhatian. Penerapan: angka IPH, judul, deskripsi, dan tabel memiliki tingkatan berbeda.
- [BPS, penyediaan statistik harga untuk proxy inflasi](https://www.bps.go.id/news/2025/11/20/812/penyediaan-statistik-harga-bps-kemendag-untuk-proxy-inflasi.html): dasar penyebutan Indeks Perkembangan Harga.
- [Bank Indonesia, koordinasi pengendalian inflasi](https://www.bi.go.id/id/publikasi/ruang-media/news-release/Pages/sp_2422122.aspx): dasar penyebutan Tim Pengendalian Inflasi Daerah.

Referensi dipakai untuk prinsip warna, hierarki, dan bahasa; komposisi tetap mengikuti data dan tugas aplikasi ini.

## Bukti pengujian

- `npm run lint`: berhasil.
- `npm run build`: berhasil. Vite masih memberi peringatan ukuran bundel utama melebihi 500 kB; ini bukan kegagalan build.
- Browser: Chrome headless melalui Playwright, frontend 5173 dan backend 4000. Login administrator, akses tamu, dan pembacaan data menggunakan backend berjalan.
- [Matriks aksesibilitas](evidence/accessibility.json): 20 pemeriksaan beranda, login, dan delapan halaman kerja pada tema terang/gelap, tanpa pelanggaran otomatis WCAG A/AA yang terdeteksi.
- [Pemeriksaan lanjutan](evidence/final-checks.json): 13 pemeriksaan tambahan untuk keadaan kosong, dialog rekap, profil, edit profil, pengaturan, serta halaman 404/500; tanpa pelanggaran otomatis atau error JavaScript. Fokus dialog, drawer, skip link, kegagalan login/tamu, retry, dan simulasi zoom 200% juga diperiksa.
- [Rekaman alur interaksi](evidence/flow-results.json): 15 kelompok alur berhasil, tanpa error JavaScript atau temuan aksesibilitas pada dialog/profil yang dipindai.
- [Dark mode ponsel](evidence/mobile-dark.json): 10 pemeriksaan tambahan pada lebar 400 px, mencakup beranda, login, dan delapan halaman kerja. Tidak ada temuan aksesibilitas otomatis, error JavaScript, atau overflow halaman. Tabel evaluasi mingguan sudah dapat difokuskan dengan keyboard.
- Responsif: delapan halaman kerja, beranda, dan login diperiksa pada 320, 400, 768, 1024, dan 1440 px. [Profil dan pengaturan](evidence/account-responsive.json) juga lolos pada kelima ukuran dalam kedua tema. Tidak ada overflow halaman yang terdeteksi; tabel lebar tetap dapat digulir di dalam wadahnya.
- Kontras token melalui checker skill: teks sekunder pada panel charcoal 7,95:1; aksen hijau pada permukaan navigasi aktif 8,68:1; border input pada panel 3,72:1 (memenuhi syarat nonteks 3:1). Teks putih pada tombol hijau 5,51:1 dan teks sekunder pada latar terang 4,87:1 tetap berlaku.
- Source: tidak tersisa em dash pada komponen; pemeriksaan JSX tidak menemukan tombol tanpa handler/submit/keadaan disabled. Kredensial demo tidak ditemukan dalam hasil build produksi.

Pratinjau: [beranda](previews/landing-final.png), [login](previews/login-final.png), [dashboard desktop](previews/dashboard-desktop-final.png), [dashboard ponsel](previews/dashboard-mobile-final.png), dan [dashboard gelap](previews/dashboard-dark.png).

Pratinjau tambahan: [dark mode dashboard ponsel](previews/dashboard-mobile-dark.png) dan [dark mode beranda ponsel](previews/landing-mobile-dark.png).

### Cakupan interaksi

Navigasi seluruh menu; pemilih peran; isi otomatis demo; tampil/sembunyi kata sandi; login dan logout; akses publik; tema; daftar komoditas buka/tutup; input rekap dan reset; tambah komoditas; filter tahun/bulan/status; pilih semua baris; pagination dan jumlah baris; unduh CSV; dialog ubah rekap; tahun grafik dan rincian pekan; muat ulang draf; salin teks/link; persiapan URL WhatsApp; validasi agenda; pemicu cetak; tambah/ubah peran/hapus personel dari formulir; filter/refresh/notulensi rapat; dialog pegawai tambah/edit/hapus; pencarian kosong; profil edit/batal; visibilitas dan validasi kata sandi; serta aksi kembali/retry halaman kesalahan.

Pengujian tidak menyimpan atau menghapus data pengguna. Operasi mutasi nonautentikasi diblokir dengan respons uji saat click-through; dialog hapus dibatalkan. Pemicu cetak dan pembukaan WhatsApp diperiksa dengan stub, tanpa mencetak atau mengirim pesan. Handler API bisnis, backend, database, dan `.env` tidak diubah. Hasil ini memverifikasi perilaku UI dalam cakupan di atas, bukan klaim pengujian seluruh transaksi backend atau sertifikasi aksesibilitas. Pengujian perangkat dilakukan melalui emulasi viewport browser, bukan perangkat fisik.

## Delivery Gate

Status berikut berlaku untuk perubahan dan cakupan pemeriksaan yang dicatat di atas.

### Hard Gate

- R-02 PASS: scan komponen tidak menemukan em dash atau bentuk mojibakenya; teks keadaan belum tersedia ditulis jelas.
- R-03 PASS: matriks lima viewport dan pemeriksaan visual ponsel menunjukkan konten berada dalam halaman; tabel lebar mempunyai wadah gulir.
- R-17 PASS: ringkasan, grafik, periode, dan andil memakai API sistem, tanpa statistik promosi baru.
- R-18 PASS: tidak ada testimonial atau identitas pelanggan buatan yang ditambahkan.
- R-23 PASS: menggunakan ikon/identitas dan tujuan halaman yang sudah ada; tidak menambah aset atau struktur halaman fiktif.
- R-24 PASS: seluruh tujuan sidebar diuji melalui browser; skip link menuju elemen yang ada.
- R-25 PASS: 20 pemindaian utama, 13 tambahan, dan 10 dark mode ponsel bersih setelah perbaikan, ditambah pemeriksaan rasio token.
- R-26 PASS: kontrol tanpa implementasi dihapus; select-all rekap diberi perilaku; handler kontrol yang dipertahankan diperiksa dan alur interaksinya dicatat.
- R-27 PASS: loading, kosong, error, dan retry beranda diuji dengan respons terkontrol; keadaan gagal login/tamu memberi pesan terlihat.
- R-28 PASS: tidak menambahkan FAQ generik.
- R-32 PASS: skip link, Tab/Shift+Tab pada drawer/dialog, Escape, pemulihan fokus, dan gaya focus-visible diperiksa.
- R-33 PASS: seluruh perubahan source/CSS ditulis menggunakan apply_patch; skrip eksternal hanya menjalankan pengujian dan menyimpan bukti.
- R-34 PASS: tema terang/gelap diperiksa pada halaman utama, profil, pengaturan, dialog rekap, dan halaman kesalahan.
- R-35 PASS: aplikasi dijalankan, lint/build berhasil, rekaman click-through tersedia beserta batas pengujian mutasi dan aksi eksternal.
- R-36 PASS: klaim penanganan/notifikasi otomatis, ID error buatan, modul V4, dan kode dokumen bergaya Kemendagri dihapus; tidak menambah klaim keamanan atau kinerja.
- R-37 PASS: brief clean modern pengguna diterjemahkan ke Design Read dan tiga dial sebelum implementasi.
- R-38 PASS: beranda menggunakan data rekap nyata; tidak membuat testimoni, statistik, personel, atau tujuan navigasi baru.

### Purpose-Gate

- R-01 PASS: tidak menambahkan gradient atau glow; pemisahan area memakai warna solid dan border.
- R-04 PASS: ikon yang dipertahankan menunjukkan tujuan halaman atau tindakan konkret, sesuai alasan ikon di atas.
- R-06 PASS: font sistem dipilih untuk keterbacaan/offline; monospace tidak menjadi gaya utama; kapital/tracking antarmuka dikurangi.
- R-07 PASS: tidak menggunakan grid/dot pattern sebagai latar.
- R-08 PASS: panah utama beranda menunjukkan perpindahan ke dashboard; panah kembali menunjukkan arah navigasi.
- R-09 PASS: badge yang tersisa menunjukkan periode/status data; tidak menambahkan badge promosi di atas headline.
- R-10 PASS: tidak menggunakan lapisan glassmorphism.
- R-12 PASS: bayangan dibatasi pada kontrol/lapisan mengambang; panel kerja memakai border.
- R-13 PASS: tidak menambahkan glow pada komponen.
- R-14 PASS: ringkasan besar, tabel, grafik, dan formulir memiliki hierarki berdasarkan isi; statistik kecil seragam untuk perbandingan.
- R-19 PASS: gerak terbatas pada umpan balik kontrol/drawer; reduced motion tersedia.
- R-22 PASS: tidak menambahkan ilustrasi generik.

### Liveliness

- Dials PASS: ENERGY 1 / RHYTHM 2 / MOTION 1 dinyatakan sebelum perubahan.
- Konsistensi dial PASS: warna tenang, variasi ringkasan/penjelasan/formulir, dan gerak singkat sesuai fungsi.
- Focal point PASS: angka IPH menjadi fokus dashboard; headline dan akses dashboard memimpin beranda; form memimpin login.
- Whitespace PASS: ruang membedakan bagian data dan kelompok formulir, terlihat pada pratinjau desktop/ponsel.
- Accent PASS: hijau dipakai pada tindakan utama dan navigasi aktif, dengan warna status untuk makna data.
- Identity motif PASS: periode mingguan, angka IPH, nama komoditas, dan aksen hijau berulang di area publik/kerja.
- Design Read PASS: jenis aplikasi, audiens, bahasa visual, dan dial disampaikan sebelum edit.

### Craftsmanship & Quality Locks

- C-1 PASS: alasan warna, tata letak, font, ruang, bentuk, ikon, dan gerak ditulis di laporan ini.
- C-2 PASS: kontrol kosong dihapus; kontrol nyata memiliki handler dan rekaman pengujian dalam cakupan di atas.
- C-3 PASS: beranda berisi data pekan terbaru, penjelasan IPH/andil, dan akses kerja petugas; tidak menambah bagian promosi pengisi.
- C-4 PASS: dua tema, lima viewport, dialog, kegagalan koneksi, dan navigasi keyboard diperiksa.
- C-5 PASS: statistik berasal dari API, tanpa testimoni atau klaim baru yang dibuat-buat.
- R-05 PASS: komposisi mengikuti ringkasan IPH dan kebutuhan kerja; tidak menggunakan pricing, logo wall, atau bento promosi.
- R-11 PASS: kontrol, panel, dan form menggunakan variasi radius 8/12/16 px; tidak seluruhnya kapsul.
- R-15 PASS: CTA menyebut tujuan, termasuk Lihat dashboard publik, Masuk ke ruang kerja, dan Muat ulang data.
- R-16 PASS: teks baru memakai bahasa tugas TPID; tidak menggunakan buzzword pemasaran.
- R-20 PASS: isi dan hierarki menonjolkan periode mingguan Kota Batu, IPH, andil, dan koordinasi TPID.
- R-21 PASS: default terang dipertahankan; preferensi gelap tersimpan dan berlaku konsisten di publik/login/ruang kerja.
- R-29 PASS: palet inti putih/netral/hijau; warna lain memiliki fungsi status data yang dinyatakan.
- R-30 PASS: desain mengikuti isi aplikasi ini, tanpa menyalin tata letak atau identitas produk lain.
- R-31 PASS: alasan keputusan visual utama tercatat pada bagian arah desain.
