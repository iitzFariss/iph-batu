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

const roleLabel: Record<UserRole, string> = {
  admin:       "Administrator",
  petugas:     "Petugas TPID",
  masyarakat:  "Masyarakat",
};

const roleBadge: Record<UserRole, { cls: string; icon: React.ReactNode }> = {
  admin:      { cls: "bg-purple-100 text-purple-700 border border-purple-200", icon: <Shield size={9} />  },
  petugas:    { cls: "bg-emerald-100 text-emerald-700 border border-emerald-200", icon: <Users size={9} /> },
  masyarakat: { cls: "bg-blue-100 text-blue-700 border border-blue-200",     icon: <User size={9} />   },
};

export default function UserMenu() {
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
    .split(" ")
    .slice(0, 2)
    .map((n) => n[0])
    .join("")
    .toUpperCase();

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((p) => !p)}
        className="flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-gray-100 transition-colors"
      >
        {/* Avatar */}
        <div className="w-7 h-7 rounded-full bg-emerald-600 text-white flex items-center justify-center text-[11px] font-bold flex-shrink-0">
          {initials}
        </div>
        <div className="text-left hidden sm:block">
          <div className="text-xs font-semibold text-gray-900 leading-tight max-w-[120px] truncate">
            {user.name}
          </div>
          <div className="text-[10px] text-gray-400 leading-tight truncate">
            {user.instansi ?? roleLabel[user.role]}
          </div>
        </div>
        <ChevronDown size={12} className={`text-gray-400 transition-transform ${open ? "rotate-180" : ""}`} />
      </button>

      {/* Dropdown */}
      {open && (
        <div className="absolute right-0 top-full mt-1.5 w-56 bg-white border border-gray-100 rounded-xl shadow-lg z-50 overflow-hidden">
          {/* Profile section */}
          <div className="px-4 py-3 border-b border-gray-100">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-full bg-emerald-600 text-white flex items-center justify-center text-sm font-bold flex-shrink-0">
                {initials}
              </div>
              <div className="min-w-0">
                <div className="text-xs font-bold text-gray-900 truncate">{user.name}</div>
                <div className="text-[10px] text-gray-400 truncate">{user.email}</div>
                <span className={`inline-flex items-center gap-1 mt-1 px-1.5 py-0.5 rounded text-[9px] font-bold ${badge.cls}`}>
                  {badge.icon}
                  {roleLabel[user.role]}
                </span>
              </div>
            </div>
            {user.nip && (
              <div className="mt-2 text-[10px] text-gray-400 font-mono">
                NIP: {user.nip}
              </div>
            )}
          </div>

          {/* Menu items */}
          <div className="py-1">
            <button className="w-full flex items-center gap-2.5 px-4 py-2 text-xs text-gray-600 hover:bg-gray-50 transition-colors">
              <User size={13} className="text-gray-400" />
              Profil Saya
            </button>
            {user.role !== "masyarakat" && (
              <button className="w-full flex items-center gap-2.5 px-4 py-2 text-xs text-gray-600 hover:bg-gray-50 transition-colors">
                <Settings size={13} className="text-gray-400" />
                Pengaturan Akun
              </button>
            )}
          </div>

          <div className="border-t border-gray-100 py-1">
            <button
              onClick={() => { logout(); setOpen(false); }}
              className="w-full flex items-center gap-2.5 px-4 py-2 text-xs text-red-600 hover:bg-red-50 transition-colors font-semibold"
            >
              <LogOut size={13} />
              Keluar
            </button>
          </div>
        </div>
      )}
    </div>
  );
}