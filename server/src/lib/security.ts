import crypto from "crypto";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import { JWT_ACCESS_SECRET, JWT_REFRESH_SECRET, REFRESH_TTL_DAYS } from "./env";

const ACCESS_TTL_MIN = Number(process.env.ACCESS_TOKEN_TTL_MINUTES ?? 15);

const ACCESS_EXP: jwt.SignOptions["expiresIn"] = `${ACCESS_TTL_MIN}m`;
const REFRESH_EXP: jwt.SignOptions["expiresIn"] = `${REFRESH_TTL_DAYS}d`;

export function hashPassword(plain: string): Promise<string> {
  return bcrypt.hash(plain, 10);
}

export function verifyPassword(plain: string, hash: string): Promise<boolean> {
  return bcrypt.compare(plain, hash);
}

export function hashRefreshToken(token: string): Promise<string> {
  return bcrypt.hash(token, 10);
}

export function verifyRefreshToken(token: string, hash: string): Promise<boolean> {
  return bcrypt.compare(token, hash);
}

interface AccessPayload {
  sub: string;
  role: string;
  jti: string;
}

interface RefreshPayload {
  sub: string;
  jti: string;
}

export function signAccessToken(payload: AccessPayload): string {
  return jwt.sign(payload, JWT_ACCESS_SECRET, { expiresIn: ACCESS_EXP });
}

export function signRefreshToken(payload: RefreshPayload): string {
  return jwt.sign(payload, JWT_REFRESH_SECRET, { expiresIn: REFRESH_EXP });
}

export function verifyAccessToken(token: string): AccessPayload & jwt.JwtPayload {
  return jwt.verify(token, JWT_ACCESS_SECRET) as AccessPayload & jwt.JwtPayload;
}

export function verifyRefreshTokenSignature(token: string): RefreshPayload & jwt.JwtPayload {
  return jwt.verify(token, JWT_REFRESH_SECRET) as RefreshPayload & jwt.JwtPayload;
}

export function newRefreshJti(): string {
  return crypto.randomUUID();
}

// 32 karakter tanpa I, O, 0, 1 agar tidak membingungkan saat dibaca dari
// layar — password sementara ini ditampilkan ke admin, lalu dititipkan ke petugas.
const PASSWORD_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

export function generateTemporaryPassword(length = 8): string {
  let out = "";
  for (let i = 0; i < length; i++) {
    out += PASSWORD_ALPHABET[crypto.randomInt(PASSWORD_ALPHABET.length)];
  }
  return out;
}

export function refreshExpiry(): Date {
  return new Date(Date.now() + REFRESH_TTL_DAYS * 24 * 60 * 60 * 1000);
}