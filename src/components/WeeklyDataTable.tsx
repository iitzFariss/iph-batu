import { type WeeklyColumn, type WeeklyRow, weeklyColumns, weeklyRows } from "../data/weeklyData";

// ─── helpers ────────────────────────────────────────────────────────────────

interface WeeklyDataTableProps {
  columns?: WeeklyColumn[];
  rows?: WeeklyRow[];
  title?: string;
  description?: string;
}

function getRowValue(row: WeeklyRow, columnId: string): number | null {
  return row.data[columnId] ?? null;
}

function ValueCell({ value }: { value: number | null }) {
  if (value === null) {
    return <span className="text-xs text-gray-600 font-medium">None</span>;
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
  rows = weeklyRows,
  title = "Data Detail Mingguan:",
  description,
}: WeeklyDataTableProps) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
      <div className="px-4 py-3 border-b border-gray-100 flex items-start justify-between">
        <div>
          <h2 className="text-sm font-bold text-gray-900">{title}</h2>
          {description && <p className="text-xs text-gray-400 mt-0.5">{description}</p>}
        </div>
        <span className="text-xs text-gray-500 bg-gray-50 border border-gray-100 rounded px-2 py-1">
          IPH Mingguan
        </span>
      </div>

      <div
        className="overflow-x-auto"
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
        <span className="text-xs text-gray-400">Sel kosong ditampilkan sebagai "None"</span>
      </div>
    </div>
  );
}