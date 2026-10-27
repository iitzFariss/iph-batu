import { createHmac, timingSafeEqual, randomBytes } from "node:crypto";
import prisma from "./prisma";

let sharedSecret: string | null = null;
let preparing: Promise<void> | null = null;
export function prepareMinutesLinks(): Promise<void> {
  if (sharedSecret) return Promise.resolve();
  if (!preparing) preparing = prisma.appSetting.upsert({
    where: { id: "minutes-link-signing-secret" }, update: {},
    create: { id: "minutes-link-signing-secret", value: randomBytes(32).toString("hex") },
  }).then(row => { sharedSecret = row.value; }).finally(() => { preparing = null; });
  return preparing;
}
function signingSecret(): string {
  if (!sharedSecret) throw new Error("Kunci tautan notulensi belum dimuat.");
  return sharedSecret;
}

export const MINUTES_WINDOW_MS = 7 * 86_400_000;
export function minutesDeadline(meeting: { createdAt: Date; notulensiInvitedAt?: Date | null }): Date {
  return new Date((meeting.notulensiInvitedAt ?? meeting.createdAt).getTime() + MINUTES_WINDOW_MS);
}
export function minutesToken(key: string, pegawaiId: string): string {
  const payload = Buffer.from(JSON.stringify({ key, pegawaiId })).toString("base64url");
  return `${payload}.${createHmac("sha256", signingSecret()).update(`iph-minutes:${payload}`).digest("base64url")}`;
}
export function readMinutesToken(token: string): { key: string; pegawaiId: string } | null {
  if (token.length > 1000) return null;
  const [payload, signature, extra] = token.split(".");
  if (!payload || !signature || extra || !/^[A-Za-z0-9_-]+$/.test(payload) || !/^[A-Za-z0-9_-]+$/.test(signature)) return null;
  const expected = createHmac("sha256", signingSecret()).update(`iph-minutes:${payload}`).digest("base64url");
  if (signature.length !== expected.length || !timingSafeEqual(Buffer.from(signature), Buffer.from(expected))) return null;
  try {
    const data = JSON.parse(Buffer.from(payload, "base64url").toString("utf8"));
    return typeof data.key === "string" && typeof data.pegawaiId === "string" ? data : null;
  } catch { return null; }
}
export function minutesLink(key: string, pegawaiId: string): string {
  const url = new URL(process.env.PUBLIC_APP_URL || "http://localhost:5173");
  url.hash = `/notulensi/${minutesToken(key, pegawaiId)}`;
  return url.toString();
}
