import { useEffect, useState } from "react";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { PUBLIC_DASHBOARD_HASH } from "./lib/publicDashboard";
import { ThemeProvider, useTheme } from "./context/ThemeContext";
import Sidebar from "./components/Sidebar";
import Header from "./components/Header";
import Dashboard from "./components/Dashboard";
import RekapanData from "./components/RekapanData";
import InputRekapIPH from "./components/InputRekapIPH";
import VisualisasiTren from "./components/Visualisasitren";
import KelolaRapat from "./components/Kelolarapat";
import MonitoringResume from "./components/Monitoringresume";
import AnalisisTeksSiaran from "./components/Analisistekssiaran";
import KelolaPegawai from "./components/Kelolapegawai";
import LoginPage from "./components/LoginPage";
import RegisterPage from "./components/RegisterPage";
import LandingPage from "./components/LandingPage";
import ProfilSaya from "./components/ProfilSaya";
import PengaturanAkun from "./components/PengaturanAkun";
import Error404 from "./components/Error404";
import Error500 from "./components/Error500";

// ─── Types ────────────────────────────────────────────────────────────────────

export type PageId =
  | "dashboard"
  | "input-rekap"
  | "rekapan-data"
  | "kelola-rapat"
  | "monitoring-resume"
  | "kelola-pegawai"
  | "visualisasi-tren"
  | "analisis-teks"
  | "profil-saya"
  | "pengaturan-akun"
  | "pengaturan"
  | "bantuan"
  | "error-404"
  | "error-500";

// ─── Role-based access ────────────────────────────────────────────────────────

// Halaman yang hanya bisa diakses oleh admin
const ADMIN_ONLY: PageId[] = ["kelola-pegawai"];

// Halaman yang bisa diakses petugas / pegawai
const PETUGAS_ALLOWED: PageId[] = [
  "dashboard",
  "rekapan-data",
  "monitoring-resume",
  "visualisasi-tren",
  "analisis-teks",
];

// Semua halaman (untuk memblokir akses tamu selain dashboard)
const ALL_PAGES: PageId[] = [
  "dashboard",
  "input-rekap",
  "rekapan-data",
  "kelola-rapat",
  "monitoring-resume",
  "kelola-pegawai",
  "visualisasi-tren",
  "analisis-teks",
  "profil-saya",
  "pengaturan-akun",
  "pengaturan",
  "bantuan",
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
    case "monitoring-resume":
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

  // Link publik (#/publik): hanya dashboard — persis seperti tampilan masyarakat/tamu.
  const isPublicView = typeof window !== "undefined"
    && window.location.hash === PUBLIC_DASHBOARD_HASH;

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
  }

  return (
    <div className="flex h-screen bg-gray-50 dark:bg-gray-900 font-sans overflow-hidden">
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
            onNavigate={(id) => navigate(id as PageId)}
            onOpenSidebar={role === "tamu" ? undefined : () => setSidebarOpen(true)}
          />
        )}
        <main className="flex-1 overflow-y-auto">
          <PageContent page={activePage} navigate={navigate} role={role} />
        </main>
      </div>
    </div>
  );
}

// ─── App shell (routing auth) ─────────────────────────────────────────────────

function AppShell() {
  const { user, isAuthenticated, loginAsGuest } = useAuth();
  const { isDark } = useTheme();
  const [authView, setAuthView] = useState<"landing" | "login" | "register">(
    "landing"
  );

  // Link publik (#/publik): otomatis masuk sebagai tamu → dashboard yang
  // sama persis dengan yang dilihat masyarakat.
  const isPublicView =
    typeof window !== "undefined" &&
    window.location.hash === PUBLIC_DASHBOARD_HASH;

  useEffect(() => {
    if (isPublicView && !isAuthenticated) {
      loginAsGuest();
    }
    // hanya jalankan sekali saat terbuka
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Belum login → tampilkan halaman publik (tanpa dark mode)
  // Kecuali link publik dashboard (#/publik) yang langsung auto login.
  if (!isAuthenticated || !user) {
    if (isPublicView) {
      return (
        <div className={isDark ? "dark h-full" : "h-full"}>
          <InternalApp />
        </div>
      );
    }
    if (authView === "login") {
      return (
        <LoginPage
          onGoRegister={() => setAuthView("register")}
          onGoBack={() => setAuthView("landing")}
        />
      );
    }
    if (authView === "register") {
      return (
        <RegisterPage
          onGoLogin={() => setAuthView("login")}
          onGoBack={() => setAuthView("landing")}
        />
      );
    }
    return (
      <LandingPage
        onLogin={() => setAuthView("login")}
        onRegister={() => setAuthView("register")}
      />
    );
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