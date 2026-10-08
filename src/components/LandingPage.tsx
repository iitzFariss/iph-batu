import { useEffect, useState } from "react";
import { TrendingUp, Sun, Moon, ArrowRight } from "lucide-react";
import { api } from "../lib/api";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";

interface PublicSummary {
  latest: { tahun: number; bulan: number; mingguIndeks: number; iph: number; status: string; pemicu: string | null } | null;
  trend: { tahun: number }[];
  latestDetails: { name: string; nilai: number; isFluktuasi: boolean }[];
}

export default function LandingPage({ onLogin }: { onLogin: () => void }) {
  const { isDark, toggleTheme } = useTheme();
  const { loginAsGuest } = useAuth();
  const [summary, setSummary] = useState<PublicSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [entering, setEntering] = useState(false);
  const [guestError, setGuestError] = useState("");
  const [reload, setReload] = useState(0);

  useEffect(() => {
    let cancelled = false;
    api.get<PublicSummary>("/public/rekap/summary")
      .then((data) => { if (!cancelled) { setSummary(data); setError(""); } })
      .catch(() => { if (!cancelled) setError("Ringkasan harga belum dapat dimuat. Coba kembali sebentar lagi."); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [reload]);

  async function enterGuest() {
    if (entering) return;
    setEntering(true);
    setGuestError("");
    const result = await loginAsGuest();
    if (!result.success) setGuestError(result.message);
    setEntering(false);
  }

  const latest = summary?.latest;
  const period = latest ? `Minggu ${["I", "II", "III", "IV", "V"][latest.mingguIndeks - 1]} · ${new Intl.DateTimeFormat("id-ID", { month: "long", year: "numeric" }).format(new Date(latest.tahun, latest.bulan - 1))}` : "Periode belum tersedia";
  const details = (summary?.latestDetails ?? []).filter((item) => !item.isFluktuasi).sort((a, b) => Math.abs(b.nilai) - Math.abs(a.nilai)).slice(0, 4);

  return (
    <div className={`public-site ${isDark ? "dark" : ""}`}>
      <a href="#public-content" className="skip-link">Lewati navigasi</a>
      <header className="public-header">
        <div className="site-container flex items-center gap-3">
          <div className="brand-mark"><TrendingUp size={21} aria-hidden="true" /></div>
          <div className="brand-name"><strong>TPID Kota Batu</strong><span>Pengendalian inflasi daerah</span></div>
          <div className="ml-auto flex items-center gap-2 sm:gap-4">
            <button className="icon-button" onClick={toggleTheme} aria-label={isDark ? "Ganti ke mode terang" : "Ganti ke mode gelap"}>{isDark ? <Sun size={19} /> : <Moon size={19} />}</button>
            <button className="button-secondary" onClick={onLogin}>Masuk</button>
          </div>
        </div>
      </header>

      <main id="public-content" tabIndex={-1}>
        <section className="site-container landing-intro">
          <div className="intro-copy">
            <p className="section-label">Data harga mingguan · Kota Batu</p>
            <h1>Pantau perkembangan harga <span>di Kota Batu.</span></h1>
            <p className="intro-description">Lihat Indeks Perkembangan Harga (IPH) mingguan dan andil komoditas. Ringkasan berikut menampilkan periode terbaru yang tersedia di sistem.</p>
            <div className="flex flex-wrap gap-3 mt-7">
              <button className="button-primary" disabled={entering} onClick={enterGuest}>{entering ? "Membuka dashboard..." : "Lihat dashboard publik"}<ArrowRight size={17} aria-hidden="true" /></button>
              <button className="button-text" onClick={onLogin}>Masuk sebagai petugas</button>
            </div>
            <p className="text-sm text-gray-500 mt-4">Akses publik tersedia tanpa mengisi email dan kata sandi.</p>
            {guestError && <p role="alert" className="feedback-error mt-4">{guestError}</p>}
          </div>

          <section className="latest-report" aria-label="Ringkasan IPH terbaru" aria-busy={loading}>
            <div className="report-heading"><span>IPH pekan terbaru</span><span className="text-sm text-gray-500">Persen (%)</span></div>
            {loading ? <p role="status" className="report-empty">Memuat ringkasan harga...</p> : error ? (
              <div className="report-empty"><p role="alert">{error}</p><button className="button-secondary mt-4" onClick={() => { setLoading(true); setReload((value) => value + 1); }}>Muat ulang data</button></div>
            ) : latest ? (
              <>
                <p className="report-period">{period}</p>
                <div className="report-value">{latest.iph > 0 ? "+" : ""}{latest.iph.toLocaleString("id-ID", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}<span>%</span></div>
                <p className="report-direction">{latest.iph < 0 ? "Harga menurun" : latest.iph > 0 ? "Harga meningkat" : "Harga stabil"} dibandingkan periode acuan.</p>
                <div className="andil-heading"><h2>Andil komoditas</h2><span>Persen poin</span></div>
                {details.length ? <ul className="andil-list">{details.map((item) => <li key={item.name}><span>{item.name}</span><strong className={item.nilai > 0 ? "text-red-700" : "text-emerald-700"}>{item.nilai > 0 ? "+" : ""}{item.nilai.toLocaleString("id-ID", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</strong></li>)}</ul> : <p className="text-sm text-gray-500 py-4">Andil komoditas belum tersedia untuk periode ini.</p>}
                <p className="report-note">Ditampilkan dari rekap IPH yang tersedia di sistem.</p>
              </>
            ) : <div className="report-empty"><p>Belum ada rekap IPH.</p><p className="text-sm text-gray-500 mt-2">Ringkasan muncul setelah petugas memasukkan data.</p></div>}
          </section>
        </section>

        <section className="landing-explainer">
          <div className="site-container explainer-layout">
            <div><p className="section-label">Panduan membaca data</p><h2>Memahami IPH dan andil komoditas</h2></div>
            <dl className="explanation-list">
              <div><dt>IPH menunjukkan arah perubahan harga.</dt><dd>Nilai positif berarti harga meningkat; nilai negatif berarti harga menurun dibandingkan periode acuan.</dd></div>
              <div><dt>Andil menunjukkan kontribusi komoditas.</dt><dd>Andil dinyatakan dalam persen poin. Daftar komoditas bisa bersifat parsial, sehingga jumlah andil tidak selalu sama dengan IPH.</dd></div>
            </dl>
          </div>
        </section>
        <section className="site-container staff-access"><div><h2>Ruang kerja petugas TPID</h2><p>Telusuri rekap, pantau tren, dan susun draf siaran pers sesuai akses akun.</p></div><button onClick={onLogin} className="button-secondary">Masuk ke ruang kerja</button></section>
      </main>
      <footer className="public-footer"><div className="site-container flex flex-wrap gap-2 justify-between"><span>TPID Kota Batu</span><span>Indeks Perkembangan Harga · Rekap mingguan</span></div></footer>
    </div>
  );
}
