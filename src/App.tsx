import { useState } from "react";
import Sidebar from "./components/Sidebar";
import Header from "./components/Header";
import Dashboard from "./components/Dashboard";
import RekapanData from "./components/Rekapandata";
import VisualisasiTren from "./components/Visualisasitren";

export type PageId =
  | "dashboard"
  | "input-rekap"
  | "rekapan-data"
  | "kelola-rapat"
  | "monitoring-resume"
  | "kelola-pegawai"
  | "visualisasi-tren"
  | "analisis-teks"
  | "pengaturan"
  | "bantuan";

// Pages that use a dark full-screen layout (no shared header)
const DARK_PAGES: PageId[] = [];

function PageContent({ page }: { page: PageId }) {
  switch (page) {
    case "dashboard":
      return <Dashboard />;
    case "rekapan-data":
      return <RekapanData />;
    case "visualisasi-tren":
      return <VisualisasiTren />;
    default:
      return (
        <div className="flex items-center justify-center h-full text-gray-400 text-sm">
          Halaman <strong className="mx-1 text-gray-600">{page}</strong> belum tersedia
        </div>
      );
  }
}

export default function App() {
  const [activePage, setActivePage] = useState<PageId>("dashboard");
  const isDark = DARK_PAGES.includes(activePage);

  return (
    <div className="flex h-screen bg-gray-50 font-sans overflow-hidden">
      <Sidebar activePage={activePage} onNavigate={(id) => setActivePage(id as PageId)} />
      <div className={`flex-1 flex flex-col overflow-hidden ${isDark ? "bg-gray-950" : ""}`}>
        {!isDark && <Header />}
        <main className="flex-1 overflow-y-auto">
          <PageContent page={activePage} />
        </main>
      </div>
    </div>
  );
}