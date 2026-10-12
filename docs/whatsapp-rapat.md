# Undangan dan pengingat rapat melalui n8n + WAHA

Admin dapat mengisi nomor WhatsApp pada form tambah/edit di **Kelola Pegawai**, termasuk pegawai lama dan pegawai tanpa akun login. Nomor menerima format `08…`, `628…`, atau `+628…`. Kolom direktori pegawai menjadi sumber utama, dengan fallback ke nomor profil akun untuk kompatibilitas data lama. Menghapus nomor direktori mengaktifkan fallback tersebut jika nomor profil masih ada.

## Alur aplikasi

1. Admin menyimpan rapat mendatang beserta peserta dan notulis. Backend menyimpan rapat dan antrean undangan dalam satu transaksi. Nomor yang belum diisi tidak membatalkan pembuatan rapat; statusnya **Nomor belum diisi**.
2. Worker backend memeriksa antrean setiap 15 detik. Pesan hanya dikirim kepada pegawai aktif yang masih ditugaskan, pada revisi jadwal terkini.
3. n8n memvalidasi Bearer token (hanya SHA256 token yang disimpan dalam definisi workflow), nomor, isi pesan, jenis pesan, ID event, dan batas waktu pengiriman, kemudian memakai node WAHA **Send Text** dengan kredensial/sesi chatbot yang sudah ada.
4. Backend menyimpan ID pesan yang dikonfirmasi WAHA. Monitoring Rapat menampilkan 100 pengiriman terbaru dan diperbarui setiap 15 detik selama halaman terlihat.
5. Pengingat otomatis H-0 dijadwalkan pukul **07.00 WIB**. Rapat sebelum pukul 08.00 diingatkan satu jam sebelumnya, paling awal pukul 00.00 pada tanggal rapat. Jika waktu pengingat sudah lewat saat rapat dibuat, hanya undangan langsung yang dibuat agar tidak ada dua pesan bersamaan. Rapat tepat tengah malam hanya mendapat undangan sebelumnya.

Perubahan topik, waktu, lokasi, status atau peserta membatalkan antrean lama, menaikkan revisi, dan membuat pemberitahuan perubahan serta pengingat baru untuk peserta saat ini. Menyimpan data yang sama tidak membuat undangan ulang. Rapat selesai/dibatalkan tidak mendapat pesan antrean berikutnya. Penghapusan rapat menghapus antreannya melalui FK cascade. Perubahan jadwal tidak dapat menarik pesan yang sudah diserahkan kepada WhatsApp. Peserta yang dihapus dari daftar tidak menerima pemberitahuan pencabutan penugasan otomatis.

Pengingat manual H-1/H-0 dan notulensi terlambat tetap tersedia sebagai fitur terpisah. Pengingat notulensi belum dikirim otomatis. Jangan mengirim manual untuk pesan yang sudah diserahkan melalui antrean otomatis kecuali memang ingin mengirim pengingat tambahan.

## Workflow n8n

Workflow: [IPH Batu - Undangan dan Pengingat Rapat](http://192.168.100.9:5678/workflow/QNXNoZuRI5nOMlj3).

Workflow ini terpisah dari **Whatsapp chatbot** dan memakai kredensial **WAHA account** serta sesi WAHA yang sama. Tidak diperlukan pemasangan WAHA baru. Workflow tidak memakai trigger pesan masuk, tidak menyentuh state percakapan chatbot, dan tidak menjalankan node AI. Balasan peserta tetap masuk ke alur chatbot yang sudah ada; konfirmasi kehadiran dari balasan belum tersedia.

Sumber SDK untuk review/rekonstruksi: `automation/n8n/rapat-workflow.ts`. Sebelum membuat workflow di instance lain, isi placeholder digest SHA256 token, nama sesi WAHA aktif, dan sambungkan kredensial WAHA yang sesuai. Tidak ada token mentah atau API key di file tersebut. Pengaturan live: timezone `Asia/Jakarta`, timeout 60 detik, penyimpanan payload eksekusi sukses/error/manual dimatikan.

## Konfigurasi backend

Tambahan di `server/.env` lokal:

```dotenv
WHATSAPP_AUTOMATION_ENABLED=true
N8N_WHATSAPP_WEBHOOK_URL="http://192.168.100.9:5678/webhook/iph-batu-rapat"
N8N_WHATSAPP_TOKEN="isi-token-integrasi-lokal-yang-sesuai-dengan-digest-workflow"
```

Token harus 32 byte acak dalam format 64 karakter heksadesimal. Token khusus webhook berbeda dari token akses MCP n8n dan API key WAHA. Nilainya sudah disiapkan di `.env` lokal saat pemasangan; jangan menggantinya tanpa memperbarui digest pada node **Validate Meeting Request**. `.env`, backup dan file inspeksi MCP lokal diabaikan Git.

Migration `20261012000000_whatsapp_notifications` hanya menambah `iph_batu.Pegawai.phone`, `iph_batu.Rapat.notificationRevision`, dan tabel `iph_batu.WhatsAppNotification` beserta indeks/FK. Tidak ada perubahan pada schema `presensi`.

```powershell
cd server
npm run db:generate
npm run db:migrate
npm run db:check
```

Backend perlu direstart setelah perubahan `.env`. Backend, koneksi PostgreSQL, n8n, dan sesi WAHA harus tetap aktif. Saat development memakai tunnel DBeaver, koneksi DBeaver harus tetap tersambung. Port lokal terbuka belum membuktikan tunnel mencapai PostgreSQL; gunakan `db:check`. Untuk operasi harian, jalankan backend dan koneksi database yang stabil di server kantor. n8n menerima event dari backend sehingga tidak perlu mengakses backend laptop dari arah server n8n.

Rapat lama tidak otomatis dibroadcast kembali saat migration diterapkan. Rapat mendatang yang dibuat/diperbarui setelah pemasangan masuk antrean melalui aplikasi.

## Status dan kegagalan

| Status | Makna / tindakan |
| --- | --- |
| Menunggu | Pesan menunggu waktu pengiriman dan worker aktif. |
| Nomor belum diisi | Isi nomor di Kelola Pegawai; worker akan membaca nomor terbaru. |
| Sedang dikirim | Satu worker sudah mengklaim pengiriman. |
| Diserahkan ke WhatsApp | n8n mengembalikan ID pesan WAHA. Belum merupakan bukti tersampaikan/dibaca. |
| Gagal | Penolakan pasti sebelum pengiriman atau layanan tidak dapat dihubungi. Dicoba hingga 3 kali, jeda 5 menit; admin dapat mencoba ulang sebelum waktu rapat. |
| Perlu diperiksa | Timeout, respons tidak lengkap, server error, atau worker terputus. Tidak diulang otomatis; periksa metadata eksekusi n8n dan riwayat pesan WAHA sebelum tindakan manual. |
| Dibatalkan | Jadwal/penugasan tidak berlaku atau rapat selesai. |
| Waktu rapat lewat | Pesan tidak dikirim setelah waktu mulai rapat. |

Antrean memiliki unique key rapat/pegawai/jenis/revisi dan klaim atomik untuk mencegah dua worker mengirim job yang sama. Workflow menyimpan receipt ID event selama tujuh hari untuk mengenali replay yang sudah selesai. Ini tidak menjamin exactly-once pada kegagalan jaringan; karena itu hasil yang tidak pasti tidak dicoba ulang otomatis.

## Pengecekan tanpa pesan sungguhan

POST webhook dengan Bearer token yang benar dan body berikut memilih jalur **Respond Without Sending**, melewati node WAHA:

```json
{
  "eventId": "dry-run-unik",
  "rapatId": "dry-run",
  "kind": "invitation",
  "phone": "6281234567890",
  "message": "Uji tanpa pengiriman WhatsApp",
  "expiresAt": "isi-waktu-ISO-di-masa-depan",
  "dryRun": true
}
```

Respons yang diharapkan: HTTP 200, `ok: true`, `dryRun: true`, `messageId: null`. Token tidak valid menghasilkan 401; nomor/batas waktu yang tidak valid menghasilkan 422. Backend tidak menganggap respons dry run sebagai pesan terkirim.

Pengujian otomatis backend menggunakan SQLite test terpisah dan mock fetch; tidak mengirim WhatsApp atau menulis ke database kantor. Saat pemasangan, webhook live diuji dengan dry run serta penolakan token/nomor invalid. Pengiriman nyata ke nomor pegawai belum diuji; lakukan percobaan pertama pada satu pegawai dengan nomor uji milik admin.

## Pengingat langsung dan teks siaran

Admin dapat membuka **Monitoring Rapat → Kirim pengingat rapat**, memilih tanggal dan rapat, lalu memeriksa daftar penerima sebelum menekan kirim. Pesan dikirim melalui antrean n8n/WAHA, tanpa membuka WhatsApp satu per satu. Peserta tidak aktif, nomor kosong/tidak valid, dan nomor yang sama dengan peserta lain dilewati. Pengingat manual hanya tersedia sebelum rapat dimulai. Klik berulang tidak membuat pengiriman baru untuk peserta yang sama pada hari dan revisi rapat yang sama; pengingat otomatis tetap berjalan sesuai jadwal.

Pada **Analisis Teks Siaran**, pilih periode data, tinjau/edit draf, lalu pilih tanggal dan rapat di panel **Kirim teks siaran ke peserta rapat**. Filter awal adalah hari ini menurut WIB. Pengiriman hanya tersedia pada tanggal pelaksanaan rapat, termasuk rapat yang sudah mulai/selesai pada hari tersebut. Pesan berisi draf yang sudah disimpan, topik rapat, dan link dashboard periode terpilih. Peserta tanpa nomor dilewati. Draf dan link yang sama tidak diantrekan ulang untuk peserta dan revisi rapat yang sama. Draf yang diedit dapat dikirim sebagai pesan baru. Riwayat dan percobaan ulang tersedia di Monitoring; hasil tidak pasti tidak diulang otomatis.

Backend memerlukan `PUBLIC_APP_URL` yang menunjuk alamat frontend yang dapat diakses penerima. `localhost` ditolak supaya pesan tidak membawa link yang hanya bekerja di laptop admin. Untuk uji di jaringan kantor, gunakan `http://<IP-laptop>:5173`; Vite mendengarkan jaringan lokal dan meneruskan `/api` ke backend. Ponsel perlu berada di jaringan yang sama dan akses jaringan di Windows perlu tersedia. Jangan membuat penerusan port database ke ponsel; browser hanya mengakses API web. IP laptop dapat berubah, sehingga `PUBLIC_APP_URL` perlu diperbarui dan backend direstart jika IP berubah.

Contoh link: `https://iph.example.org/#/publik?tahun=2026&bulan=10&minggu=2`. Halaman ini memakai API publik tanpa memerlukan akun tamu/login. Nilai IPH, andil, grafik, frekuensi, dan tabel menampilkan data hingga periode tersebut, bukan periode terbaru yang mungkin berubah setelah pesan dikirim. Periode yang tidak tersedia menghasilkan pesan kesalahan. Ini merupakan tampilan data periode yang tersimpan saat dibuka, bukan salinan data yang dibekukan; pembaruan data pada periode tersebut tetap terlihat.

Untuk akses dari luar kantor, host frontend dan backend di server dengan domain atau gunakan Cloudflare Tunnel ke web yang sudah ada. Streamlit tidak dibutuhkan untuk memakai dashboard React ini. Deployment publik belum dibuat otomatis. Workflow IPH yang sama menerima jenis pesan `broadcast`; workflow chatbot tetap terpisah dan tidak diubah.

Referensi: [n8n MCP](https://docs.n8n.io/connect/connect-to-n8n-mcp-server/), [WAHA Send Messages](https://waha.devlike.pro/docs/how-to/send-messages/), [Cloudflare Tunnel](https://developers.cloudflare.com/cloudflare-one/networks/connectors/cloudflare-tunnel/routing-to-tunnel/).
