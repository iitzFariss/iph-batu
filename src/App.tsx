import { lazy, Suspense, useEffect, useState } from "react";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { isPublicDashboard } from "./lib/publicDashboard";
import { ThemeProvider, useTheme } from "./context/ThemeContext";
import Sidebar from "./components/Sidebar";
import Header from "./components/Header";
import LoginPage from "./components/LoginPage";
import LandingPage from "./components/LandingPage";
import Error404 from "./components/Error404";
import Error500 from "./components/Error500";
import PublicHeader from "./components/PublicHeader";
import PageBoundary from "./components/PageBoundary";

const Dashboard = lazy(() => import("./components/Dashboard"));
const RekapanData = lazy(() => import("./components/Rekapandata"));
const InputRekapIPH = lazy(() => import("./components/InputRekapIPH"));
const VisualisasiTren = lazy(() => import("./components/Visualisasitren"));
const KelolaRapat = lazy(() => import("./components/Kelolarapat"));
const MonitoringResume = lazy(() => import("./components/Monitoringresume"));
const AnalisisTeksSiaran = lazy(() => import("./components/Analisistekssiaran"));
const KelolaPegawai = lazy(() => import("./components/Kelolapegawai"));
const ProfilSaya = lazy(() => import("./components/Profilsaya"));
const PengaturanAkun = lazy(() => import("./components/Pengaturanakun"));

const PAGE_TITLES: Record<string, string> = {
  dashboard: "Dashboard", "input-rekap": "Input rekap IPH", "rekapan-data": "Rekap data",
  "kelola-rapat": "Kelola rapat", "monitoring-rapat": "Monitoring rapat", "kelola-pegawai": "Kelola pegawai",
  "visualisasi-tren": "Visualisasi tren", "analisis-teks": "Analisis teks siaran", "profil-saya": "Profil saya", "pengaturan-akun": "Pengaturan akun",
};
const pageLoading = <div className="text-sm text-gray-500 p-6" role="status">Memuat halaman…</div>;

// ─── Types ────────────────────────────────────────────────────────────────────

type PageId =
  | "dashboard"
  | "input-rekap"
  | "rekapan-data"
  | "kelola-rapat"
  | "monitoring-rapat"
      | "kelola-pegawai"
      | "visualisasi-tren"
  | "analisis-teks"
  | "profil-saya"
  | "pengaturan-akun"
  | "error-404"
  | "error-500";

// ─── Role-based access ────────────────────────────────────────────────────────

// Halaman yang hanya bisa diakses oleh admin
const ADMIN_ONLY: PageId[] = ["kelola-pegawai"];

// Halaman yang bisa diakses petugas / pegawai
const PETUGAS_ALLOWED: PageId[] = [
  "dashboard",
  "rekapan-data",
  "monitoring-rapat",
  "visualisasi-tren",
  "analisis-teks",
  "profil-saya",
  "pengaturan-akun",
];

// Semua halaman (untuk memblokir akses tamu selain dashboard)
const ALL_PAGES: PageId[] = [
  "dashboard",
  "input-rekap",
  "rekapan-data",
  "kelola-rapat",
  "monitoring-rapat",
  "kelola-pegawai",
  "visualisasi-tren",
  "analisis-teks",
  "profil-saya",
  "pengaturan-akun",
  "error-404",
  "error-500",
];

// Halaman dark full-screen (tanpa header & sidebar wrapper)
const DARK_PAGES: PageId[] = ["error-404", "error-500"];

// ─── Page router ──────────────────────────────────────────────────────────────

function PageContent({
  page,
  navigate,
  role,
}: {
  page: PageId;
  navigate: (id: PageId) => void;
  role: string;
}) {
  // Blokir petugas & tamu dari halaman admin-only → tampilkan 404
  if (role !== "admin" && ADMIN_ONLY.includes(page)) {
    return <Error404 onGoHome={() => navigate("dashboard")} onGoBack={() => navigate("dashboard")} />;
  }

  // Tamu hanya boleh melihat dashboard
  if (role === "tamu" && page !== "dashboard") {
    return <Error404 onGoHome={() => navigate("dashboard")} onGoBack={() => navigate("dashboard")} />;
  }

  // Petugas hanya boleh melihat halaman yang diizinkan
  if (role === "petugas" && !PETUGAS_ALLOWED.includes(page)) {
    return <Error404 onGoHome={() => navigate("dashboard")} onGoBack={() => navigate("dashboard")} />;
  }

  switch (page) {
    case "dashboard":
      return <Dashboard />;
    case "input-rekap":
      return <InputRekapIPH />;
    case "rekapan-data":
      return <RekapanData />;
    case "kelola-rapat":
      return <KelolaRapat />;
    case "monitoring-rapat":
      return <MonitoringResume />;
    case "kelola-pegawai":
      return <KelolaPegawai />;
    case "visualisasi-tren":
      return <VisualisasiTren />;
    case "analisis-teks":
      return <AnalisisTeksSiaran />;
    case "profil-saya":
      return <ProfilSaya />;
    case "pengaturan-akun":
      return <PengaturanAkun />;
    case "error-404":
      return (
        <Error404
          onGoHome={() => navigate("dashboard")}
          onGoBack={() => navigate("dashboard")}
        />
      );
    case "error-500":
      return (
        <Error500
          onGoHome={() => navigate("dashboard")}
          onRetry={() => navigate("dashboard")}
        />
      );
    default:
      return (
        <Error404
          onGoHome={() => navigate("dashboard")}
          onGoBack={() => navigate("dashboard")}
        />
      );
  }
}

// ─── Internal app (sudah login) ───────────────────────────────────────────────

function InternalApp() {
  const { user } = useAuth();
  const [activePage, setActivePage] = useState<PageId>("dashboard");
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Link periode publik memakai izin tamu, termasuk saat akun admin sedang masuk.
  const isPublicView = typeof window !== "undefined"
    && isPublicDashboard();

  const isDark = DARK_PAGES.includes(activePage);
  const role = isPublicView ? "tamu" : (user?.role ?? "petugas");

  // Menu yang disembunyikan per role
  const hiddenPages: PageId[] =
    role === "admin"
      ? []
      : role === "tamu"
      ? ALL_PAGES.filter((p) => p !== "dashboard")
      : ALL_PAGES.filter((p) => !PETUGAS_ALLOWED.includes(p));

  function navigate(id: PageId) {
    setActivePage(id);
    setSidebarOpen(false);
    document.getElementById("main-content")?.scrollTo(0, 0);
  }

  return (
    <div className="workspace flex bg-gray-50 dark:bg-gray-900 font-sans overflow-hidden">
      <a href="#main-content" className="skip-link">Lewati navigasi</a>
      {role !== "tamu" && (
        <Sidebar
          activePage={activePage}
          open={sidebarOpen}
          onNavigate={(id) => navigate(id as PageId)}
          onClose={() => setSidebarOpen(false)}
          hiddenPages={hiddenPages}
        />
      )}
      <div
        className={`flex-1 flex flex-col overflow-hidden min-w-0 ${
          isDark ? "bg-gray-950" : ""
        }`}
      >
        {!isDark && (
          <Header
            title={PAGE_TITLES[activePage]}
            onNavigate={(id) => navigate(id as PageId)}
            onOpenSidebar={role === "tamu" ? undefined : () => setSidebarOpen(true)}
          />
        )}
        <main id="main-content" tabIndex={-1} className="workspace-main flex-1 overflow-y-auto">
          <PageBoundary key={activePage}><Suspense fallback={pageLoading}><PageContent page={activePage} navigate={navigate} role={role} /></Suspense></PageBoundary>
        </main>
      </div>
    </div>
  );
}

// ─── App shell (routing auth) ─────────────────────────────────────────────────

function AppShell() {
  const { user, isAuthenticated } = useAuth();
  const { isDark } = useTheme();
  const [authView, setAuthView] = useState<"landing" | "login">("landing");
  const [hash, setHash] = useState(() => window.location.hash);
  useEffect(() => {
    const changed = () => setHash(window.location.hash);
    window.addEventListener("hashchange", changed);
    return () => window.removeEventListener("hashchange", changed);
  }, []);

  // Link publik (#/publik): otomatis masuk sebagai tamu → dashboard yang
  // sama persis dengan yang dilihat masyarakat.
  const isPublicView =
    typeof window !== "undefined" &&
    hash.split("?")[0] === "#/publik";

  if (isPublicView) {
    return <div className={isDark ? "dark h-full" : "h-full"}>
      <div className="public-dashboard min-h-screen bg-gray-50 font-sans">
        <PublicHeader />
        <main><PageBoundary key={hash}><Suspense fallback={pageLoading}><Dashboard /></Suspense></PageBoundary></main>
      </div>
    </div>;
  }

  // Belum login → tampilkan halaman publik (tanpa dark mode)
  // Kecuali link publik dashboard (#/publik) yang langsung auto login.
  if (!isAuthenticated || !user) {
    if (authView === "login") {
      return <LoginPage onGoBack={() => setAuthView("landing")} />;
    }
    return <LandingPage onLogin={() => setAuthView("login")} />;
  }

  // Semua role (admin / petugas / tamu) → dashboard penuh
  return (
    <div className={isDark ? "dark h-full" : "h-full"}>
      <InternalApp />
    </div>
  );
}

// ─── Root ─────────────────────────────────────────────────────────────────────

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <AppShell />
      </AuthProvider>
    </ThemeProvider>
  );
}
