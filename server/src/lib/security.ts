import crypto from "crypto";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";

const ACCESS_SECRET = process.env.JWT_ACCESS_SECRET ?? "dev-access-secret";
const REFRESH_SECRET = process.env.JWT_REFRESH_SECRET ?? "dev-refresh-secret";
const ACCESS_TTL_MIN = Number(process.env.ACCESS_TOKEN_TTL_MINUTES ?? 15);
const REFRESH_TTL_DAYS = Number(process.env.REFRESH_TOKEN_TTL_DAYS ?? 30);

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
  return jwt.sign(payload, ACCESS_SECRET, { expiresIn: ACCESS_EXP });
}

export function signRefreshToken(payload: RefreshPayload): string {
  return jwt.sign(payload, REFRESH_SECRET, { expiresIn: REFRESH_EXP });
}

export function verifyAccessToken(token: string): AccessPayload & jwt.JwtPayload {
  return jwt.verify(token, ACCESS_SECRET) as AccessPayload & jwt.JwtPayload;
}

export function verifyRefreshTokenSignature(token: string): RefreshPayload & jwt.JwtPayload {
  return jwt.verify(token, REFRESH_SECRET) as RefreshPayload & jwt.JwtPayload;
}

export function newRefreshJti(): string {
  return crypto.randomUUID();
}

export function refreshExpiry(): Date {
  return new Date(Date.now() + REFRESH_TTL_DAYS * 24 * 60 * 60 * 1000);
}