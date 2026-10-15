import { useState, useRef, useEffect } from "react";
import { ChevronDown } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import type { UserRole } from "../types/auth";

const roleLabel: Record<UserRole, string> = { admin: "Administrator", petugas: "Petugas TPID", tamu: "Tamu" };

export default function UserMenu({ onNavigate }: { onNavigate?: (page: string) => void }) {
  const { user, logout } = useAuth();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    const outside = (event: MouseEvent) => { if (ref.current && !ref.current.contains(event.target as Node)) setOpen(false); };
    const escape = (event: KeyboardEvent) => { if (event.key === "Escape" && open) { setOpen(false); triggerRef.current?.focus(); } };
    document.addEventListener("mousedown", outside);
    document.addEventListener("keydown", escape);
    return () => { document.removeEventListener("mousedown", outside); document.removeEventListener("keydown", escape); };
  }, [open]);
  if (!user) return null;
  const initials = user.name.split(" ").slice(0, 2).map(name => name[0]).join("").toUpperCase();
  const navigate = (page: string) => { onNavigate?.(page); setOpen(false); };
  return <div className="account-menu relative" ref={ref}>
    <button ref={triggerRef} aria-label="Menu akun" aria-expanded={open} onClick={() => setOpen(value => !value)} className="account-trigger">
      <span className="account-avatar" aria-hidden="true">{initials}</span>
      <span className="text-left hidden sm:block"><span className="block text-xs font-medium text-gray-900 max-w-[150px] truncate">{user.name}</span><span className="block text-[11px] text-gray-500 mt-0.5">{roleLabel[user.role]}</span></span>
      <ChevronDown size={13} className="text-gray-500" />
    </button>
    {open && <div className="account-popover">
      <header><p className="text-sm font-medium text-gray-900">{user.name}</p><p className="text-xs text-gray-500 break-all mt-1">{user.email}</p>{user.nip && <p className="text-xs text-gray-500 mt-2">NIP {user.nip}</p>}</header>
      {user.role !== "tamu" && <><button onClick={() => navigate("profil-saya")}>Profil Saya</button><button onClick={() => navigate("pengaturan-akun")}>Pengaturan Akun</button></>}
      <button onClick={() => { void logout(); setOpen(false); }} className="text-red-600 border-t border-gray-100">Keluar dari sistem</button>
    </div>}
  </div>;
}
