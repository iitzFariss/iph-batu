# Data Impor TPID IPH Kota Batu

Folder ini tempat meletakkan data lama sebelum diimpor ke database.

## Cara pakai

1. Taruh file CSV di folder ini.
2. Jalankan importer sekali:
   ```bash
   npm run import
   ```
3. Data masuk ke database (`server/prisma/dev.db`) dan langsung tampil di aplikasi.

Importer bersifat **idempotent** — dijalankan berulang tidak menghasilkan data dobel.

## Nama file yang dikenali

| File                 | Isi |
|----------------------|-----|
| `pegawai.csv`        | Daftar pegawai / akun TPID |
| `rekap-2023.csv`     | Rekapan IPH tahun 2023 |

## Format kolom

### `pegawai.csv`
```
nama,nip,email,peran,status
Drs. Eko Prasetyo,196512031985031001,eko.prasetyo@bps-batu.go.id,Analis Data BPS & Verifikator,aktif
Siti Rahmawati S.E.,197206151992102001,siti.rahmawati@bps-batu.go.id,Notulis TPID,aktif
```
- `email` boleh kosong → pegawai tetap terdaftar, tetapi akun login **tidak dibuat**.
- `status`: `aktif` / `nonaktif`.
- Baris yang ber-`email` otomatis dibuatkan akun petugas + password sementara (keluar di log import).

### `rekap-2023.csv`
```
periode,tanggalMulai,tanggalSelesai,nilaiIPH,komoditasDeflasi,komoditasInflasi
M1 Januari 2023,2023-01-02,2023-01-08,-0.42,Bawang Merah: -1.2|Telur Ayam: -0.8,Daging Ayam Ras: +0.9|Cabai Rawit: +1.1
```
- `komoditasDeflasi` / `komoditasInflasi` dipisahkan `|`, tiap item `nama: perubahan`.
- `nilaiIPH` angka desimal (titik).

## Pengecualian (tidak perlu)
`dev.db` dan `.env` tidak pernah diimpor/dipush — sudah di-ignore.