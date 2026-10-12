import { describe, expect, it } from "vitest";
import { planLegacy, sameRow, type Table } from "../scripts/lib/legacy-plan";

const tables: Table[] = [
  { name: "User", unique: [["email"], ["emailNorm"]], references: {} },
  { name: "Rekap", unique: [["tahun", "bulan", "mingguIndeks"]], references: { createdById: "User" } },
  { name: "Session", unique: [], references: { userId: "User" } },
  { name: "AuditLog", unique: [], references: { actorId: "User" } },
];
const oldUser = { id: "old-user", email: "admin@example.test", emailNorm: "admin@example.test", password: "old-hash", role: "admin", status: "aktif" };
const source = {
  User: [oldUser],
  Rekap: [{ id: "old-rekap", tahun: 2026, bulan: 1, mingguIndeks: 1, createdById: "old-user", indikator: 0.25, createdAt: new Date("2026-01-01Z") }],
  Session: [{ id: "old-session", userId: "old-user", refreshHash: "hash" }],
  AuditLog: [{ id: "old-audit", actorId: "old-user" }, { id: "deleted-user-audit", actorId: "deleted-user" }],
};
const empty = { User: [], Rekap: [], Session: [], AuditLog: [] };

describe("legacy transfer plan", () => {
  it("copies every source row without mutating source or target", () => {
    const plan = planLegacy(tables, source, empty);
    expect(plan.map(table => table.insert.length)).toEqual([1, 1, 1, 2]);
    expect(source.Rekap[0].createdById).toBe("old-user");
    expect(empty.User).toEqual([]);
  });
  it("preserves an existing login and remaps all dependent user IDs", () => {
    const account = { ...oldUser, id: "new-user", password: "new-hash" };
    const plan = planLegacy(tables, source, { ...empty, User: [account] });
    expect(plan[0].insert).toEqual([]);
    expect(plan[0].preservedAccounts).toBe(1);
    expect(plan[0].expected[0]).toEqual(account);
    expect(plan[1].insert[0].createdById).toBe("new-user");
    expect(plan[2].insert[0].userId).toBe("new-user");
    expect(plan[3].insert[0].actorId).toBe("new-user");
    expect(plan[3].insert[1].actorId).toBe("deleted-user");
  });
  it("is idempotent after a completed transfer", () => {
    const first = planLegacy(tables, source, empty);
    const target = Object.fromEntries(first.map(table => [table.name, table.insert]));
    expect(planLegacy(tables, source, target).every(table => table.insert.length === 0)).toBe(true);
  });
  it("rejects collisions on business data instead of dropping or updating records", () => {
    expect(() => planLegacy(tables, source, { ...empty, Rekap: [{ ...source.Rekap[0], id: "new-rekap", indikator: 9 }] })).toThrow("perlu rekonsiliasi");
  });
  it("rejects conflicting role/status for accounts with the same email", () => {
    expect(() => planLegacy(tables, source, { ...empty, User: [{ ...oldUser, id: "other", password: "new", role: "petugas" }] })).toThrow("perlu rekonsiliasi");
  });
  it("rejects unique keys pointing to different target records", () => {
    expect(() => planLegacy(tables, source, { ...empty, User: [
      { ...oldUser, emailNorm: "different@example.test" },
      { ...oldUser, id: "other", email: "different@example.test" },
    ] })).toThrow("beberapa unique key");
  });
  it("remaps a compound unique key before comparing an already imported row", () => {
    const target = { ...empty, User: [{ ...oldUser, id: "new-user", password: "new-hash" }], Rekap: [{ ...source.Rekap[0], id: "new-rekap", createdById: "new-user" }] };
    const plan = planLegacy(tables, source, target);
    expect(plan[1].insert).toEqual([]);
    expect(plan[1].expected[0].id).toBe("new-rekap");
  });
  it("compares dates by their millisecond values", () => {
    expect(sameRow({ id: "a", date: new Date(1000) }, { id: "a", date: new Date(1000) })).toBe(true);
    expect(sameRow({ id: "a", date: new Date(1000) }, { id: "a", date: new Date(1001) })).toBe(false);
  });
});
