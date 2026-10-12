export type Row = Record<string, unknown> & { id: string };
export type Table = { name: string; unique: string[][]; references: Record<string, string> };
export type TablePlan = { name: string; source: number; before: number; insert: Row[]; expected: Row[]; preservedAccounts: number };

export function sameValue(a: unknown, b: unknown): boolean {
  return a instanceof Date && b instanceof Date ? a.getTime() === b.getTime() : a === b;
}

export function sameRow(a: Row, b: Row, ignoreId = false): boolean {
  return Object.keys(a).every(key => (ignoreId && key === "id") || sameValue(a[key], b[key]));
}

// Tables must be in dependency order. Only IDs/references are remapped; conflicting
// business records abort instead of silently replacing existing PostgreSQL data.
export function planLegacy(tables: Table[], source: Record<string, Row[]>, target: Record<string, Row[]>): TablePlan[] {
  const maps: Record<string, Map<string, string>> = {};
  return tables.map(table => {
    const ids = maps[table.name] = new Map<string, string>();
    const existing = [...target[table.name]];
    const insert: Row[] = [];
    const expected: Row[] = [];
    let preservedAccounts = 0;
    for (const original of source[table.name]) {
      const row = { ...original };
      for (const [field, parent] of Object.entries(table.references)) {
        if (row[field] != null) row[field] = maps[parent]?.get(String(row[field])) ?? row[field];
      }
      const matches = existing.filter(candidate => candidate.id === row.id || table.unique.some(keys =>
        keys.every(key => row[key] != null && sameValue(row[key], candidate[key]))));
      if (matches.length > 1) throw new Error(`Konflik beberapa unique key pada ${table.name}; tidak ada data ditimpa.`);
      const match = matches[0];
      if (match) {
        const account = table.name === "User" && row.email === match.email && row.emailNorm === match.emailNorm
          && row.role === match.role && row.status === match.status;
        if (!sameRow(row, match, true) && !account) {
          throw new Error(`Data ${table.name} berbeda pada ID/unique key yang sudah ada; perlu rekonsiliasi manual.`);
        }
        ids.set(original.id, match.id);
        expected.push(match);
        if (account && !sameRow(row, match, true)) preservedAccounts++;
      } else {
        ids.set(original.id, row.id);
        existing.push(row);
        insert.push(row);
        expected.push(row);
      }
    }
    return { name: table.name, source: source[table.name].length, before: target[table.name].length, insert, expected, preservedAccounts };
  });
}
