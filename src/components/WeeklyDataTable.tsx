import { type WeeklyColumn, type WeeklyRow, weeklyColumns } from "../data/weeklyData";

// ─── helpers ────────────────────────────────────────────────────────────────

interface WeeklyDataTableProps {
  rows: WeeklyRow[];
  columns?: WeeklyColumn[];
  title?: string;
  description?: string;
}

function getRowValue(row: WeeklyRow, columnId: string): number | null {
  return row.data[columnId] ?? null;
}

function ValueCell({ value }: { value: number | null }) {
  if (value === null) {
    return <span className="text-xs text-gray-600 font-medium">Belum ada</span>;
  }
  if (value === 0) {
    return <span className="text-xs font-semibold text-gray-500">0.00</span>;
  }
  const pos = value > 0;
  return (
    <span className={`text-xs font-semibold tabular-nums ${pos ? "text-amber-600" : "text-green-600"}`}>
      {pos ? "+" : ""}
      {value.toFixed(2)}
    </span>
  );
}

// ─── component ──────────────────────────────────────────────────────────────

export default function WeeklyDataTable({
  columns = weeklyColumns,
  rows,
  title = "Data IPH mingguan",
  description,
}: WeeklyDataTableProps) {
  return (
    <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
      <div className="px-5 py-5 border-b border-gray-100 flex flex-wrap gap-3 items-start justify-between">
        <div>
          <h2 className="text-base font-semibold text-gray-900">{title}</h2>
          {description && <p className="text-xs text-gray-500 mt-1">{description}</p>}
        </div>
        <span className="text-xs text-gray-500">Persen (%)</span>
      </div>

      <div
        className="overflow-x-auto"
        tabIndex={0}
        role="region"
        aria-label="Tabel IPH mingguan, geser untuk melihat semua periode"
        style={{ maxWidth: "100%", scrollbarWidth: "thin" }}
      >
        <table className="w-full min-w-max border-separate border-spacing-0">
          <thead>
            <tr>
              <th className="sticky left-0 z-20 bg-gray-50 border-b border-r border-gray-200 px-3 py-2 text-left">
                <span className="text-xs font-semibold uppercase tracking-wide text-gray-500">Tahun</span>
              </th>
              {columns.map((col) => (
                <th
                  key={col.id}
                  className="sticky top-0 z-10 bg-gray-50 border-b border-l border-gray-200 px-3 py-2 text-center whitespace-nowrap"
                >
                  <span className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                    {col.label}
                  </span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.tahun} className="group hover:bg-gray-50/60">
                <td className="sticky left-0 z-10 bg-white group-hover:bg-gray-50/90 border-r border-gray-200 px-3 py-2.5">
                  <span className="text-xs font-bold text-gray-900 tabular-nums">{row.tahun}</span>
                </td>
                {columns.map((col) => (
                  <td
                    key={col.id}
                    className="border-l border-gray-100 px-3 py-2.5 text-center whitespace-nowrap"
                  >
                    <ValueCell value={getRowValue(row, col.id)} />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="px-4 py-2.5 border-t border-gray-100">
        <span className="text-xs text-gray-500">Periode tanpa rekap ditandai "Belum ada".</span>
      </div>
    </div>
  );
}
