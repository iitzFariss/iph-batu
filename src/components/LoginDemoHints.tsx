import type { UserRole } from "../types/auth";

export type DemoHint = { email: string; password: string };

// Isi modul ini sama persis dengan prisma/seed.ts, jadi hanya aman selama
// modul ini tidak pernah ikut ter-bundle ke produksi. LoginPage memuatnya lewat
// import() dinamis yang dijaga import.meta.env.DEV; saat build produksi Vite
// membuang cabang itu dan modul ini tidak ikut ter-emit sama sekali.
const DEMO_HINTS: Record<UserRole, DemoHint> = {
  admin: { email: "admin@tpid-batu.go.id", password: "admin123" },
  petugas: { email: "siti.rahmawati@bps-batu.go.id", password: "petugas123" },
  tamu: { email: "Tanpa kredensial", password: "—" },
};

export default function LoginDemoHints({
  role,
  label,
  onFill,
}: {
  role: UserRole;
  label: string;
  onFill: (hint: DemoHint) => void;
}) {
  const hint = DEMO_HINTS[role];

  return (
    <div className="mt-5 p-4 bg-gray-50 rounded-xl border border-gray-100">
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs text-gray-400 font-semibold uppercase tracking-wide">
          Akun Demo — {label}
        </span>
        <button
          type="button"
          onClick={() => onFill(hint)}
          className="text-xs text-emerald-600 font-bold hover:text-emerald-700"
        >
          Isi Otomatis →
        </button>
      </div>
      <p className="text-xs text-gray-500 font-mono">{hint.email}</p>
      <p className="text-xs text-gray-500 font-mono">{hint.password}</p>
    </div>
  );
}