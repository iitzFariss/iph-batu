export const DEFAULT_BROADCAST_TEMPLATE = `[Data IPH]

Yth. Bapak/Ibu,
Berikut kami sampaikan informasi Indeks Perkembangan Harga (IPH) Kota Batu pada minggu ke-{{minggu}} {{bulan}} {{tahun}}. Pada periode tersebut, Kota Batu mengalami {{arah}} sebesar {{iph}}.

Adapun komoditas yang memberikan andil terbesar terhadap {{arah}} adalah sebagai berikut:
{{komoditas}}

Demikian kami sampaikan. Atas perhatian dan kerja samanya, kami ucapkan terima kasih.

Hormat kami,
BPS Kota Batu`;
export const TEMPLATE_FIELDS = ["minggu", "bulan", "tahun", "arah", "iph", "komoditas"];
