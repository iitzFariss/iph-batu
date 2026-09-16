import { useState } from "react";
import Sidebar from "./components/Sidebar";
import Header from "./components/Header";
import Dashboard from "./components/Dashboard";
import InputRekapIPH from "./components/InputRekapIPH";

export default function App() {
  const [activePage, setActivePage] = useState("dashboard");

  const renderPage = () => {
    switch (activePage) {
      case "dashboard":    return <Dashboard />;
      case "input-rekap":  return <InputRekapIPH />;
      default:
        return (
          <div className="flex items-center justify-center h-full text-gray-400 text-sm">
            Halaman ini belum tersedia
          </div>
        );
    }
  };

  return (
    <div className="flex h-screen bg-gray-50 font-sans overflow-hidden">
      <Sidebar activePage={activePage} onNavigate={setActivePage} />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header />
        <main className="flex-1 overflow-y-auto">
          {renderPage()}
        </main>
      </div>
    </div>
  );
}