import { useState, useRef, useEffect } from "react";
import {
  ChevronDown,
  LogOut,
  User,
  Shield,
  Users,
  Settings,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import type { UserRole } from "../types/auth";

interface UserMenuProps {
  onNavigate?: (page: string) => void;
}

const roleLabel: Record<UserRole, string> = {
  admin:      "Administrator",
  petugas:    "Petugas TPID",
  masyarakat: "Masyarakat",
};

const roleBadge: Record<UserRole, { cls: string; icon: React.ReactNode }> = {
  admin:      { cls: "bg-purple-100 text-purple-700 border border-purple-200", icon: <Shield size={9} />  },
  petugas:    { cls: "bg-emerald-100 text-emerald-700 border border-emerald-200", icon: <Users size={9} /> },
  masyarakat: { cls: "bg-blue-100 text-blue-700 border border-blue-200",       icon: <User size={9} />   },
};

export default function UserMenu({ onNavigate }: UserMenuProps) {
  const { user, logout } = useAuth();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  if (!user) return null;

  const badge = roleBadge[user.role];
  const initials = user.name
    .split(" ").slice(0, 2)
    .map((n: string) => n[0])
    .join("").toUpperCase();

  function navigate(page: string) {
    onNavigate?.(page);
    setOpen(false);
  }

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((p) => !p)}
        className="flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-gray-100 transition-colors"
      >
        <div className="w-7 h-7 rounded-full bg-emerald-600 text-white flex items-center justify-center text-sm font-bold flex-shrink-0">
          {initials}
        </div>
        <div className="text-left hidden sm:block">
          <div className="text-xs font-semibold text-gray-900 leading-tight max-w-[120px] truncate">
            {user.name}
          </div>
          <div className="text-xs text-gray-400 leading-tight truncate">
            {user.instansi ?? roleLabel[user.role]}
          </div>
        </div>
        <ChevronDown size={12} className={`text-gray-400 transition-transform ${open ? "rotate-180" : ""}`} />
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-1.5 w-60 bg-white border border-gray-100 rounded-xl shadow-lg z-50 overflow-hidden">
          {/* Profile header */}
          <div className="px-4 py-3 border-b border-gray-100">
            <div className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-full bg-emerald-600 text-white flex items-center justify-center text-sm font-bold flex-shrink-0">
                {initials}
              </div>
              <div className="min-w-0">
                <div className="text-xs font-bold text-gray-900 truncate">{user.name}</div>
                <div className="text-xs text-gray-400 truncate">{user.email}</div>
                <span className={`inline-flex items-center gap-1 mt-1 px-1.5 py-0.5 rounded text-[11px] font-bold ${badge.cls}`}>
                  {badge.icon}
                  {roleLabel[user.role]}
                </span>
              </div>
            </div>
            {user.nip && (
              <div className="mt-2 text-xs text-gray-400 font-mono">
                NIP: {user.nip}
              </div>
            )}
          </div>

          {/* Menu items */}
          <div className="py-1">
            <button
              onClick={() => navigate("profil-saya")}
              className="w-full flex items-center gap-2.5 px-4 py-2.5 text-xs text-gray-700 hover:bg-gray-50 transition-colors"
            >
              <div className="w-6 h-6 rounded-lg bg-gray-100 flex items-center justify-center flex-shrink-0">
                <User size={12} className="text-gray-500" />
              </div>
              <div className="text-left">
                <div className="font-semibold">Profil Saya</div>
                <div className="text-xs text-gray-400">Lihat & edit informasi profil</div>
              </div>
            </button>

            {user.role !== "masyarakat" && (
              <button
                onClick={() => navigate("pengaturan-akun")}
                className="w-full flex items-center gap-2.5 px-4 py-2.5 text-xs text-gray-700 hover:bg-gray-50 transition-colors"
              >
                <div className="w-6 h-6 rounded-lg bg-gray-100 flex items-center justify-center flex-shrink-0">
                  <Settings size={12} className="text-gray-500" />
                </div>
                <div className="text-left">
                  <div className="font-semibold">Pengaturan Akun</div>
                  <div className="text-xs text-gray-400">Keamanan, notifikasi & privasi</div>
                </div>
              </button>
            )}
          </div>

          {/* Logout */}
          <div className="border-t border-gray-100 py-1">
            <button
              onClick={() => { logout(); setOpen(false); }}
              className="w-full flex items-center gap-2.5 px-4 py-2.5 text-xs text-red-600 hover:bg-red-50 transition-colors font-semibold"
            >
              <div className="w-6 h-6 rounded-lg bg-red-50 flex items-center justify-center flex-shrink-0">
                <LogOut size={12} className="text-red-500" />
              </div>
              Keluar dari Sistem
            </button>
          </div>
        </div>
      )}
    </div>
  );
}