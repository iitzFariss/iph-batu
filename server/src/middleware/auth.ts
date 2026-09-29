import { NextFunction, Request, RequestHandler, Response } from "express";
import { verifyAccessToken } from "../lib/security";

export interface AuthedUser {
  id: string;
  role: string;
  sessionId?: string;
}

export interface AuthedRequest extends Request {
  user?: AuthedUser;
}

export function requireAuth(req: Request, res: Response, next: NextFunction): void {
  const header = req.headers.authorization;
  if (!header || !header.startsWith("Bearer ")) {
    res.status(401).json({ message: "Tidak terautentikasi." });
    return;
  }
  try {
    const payload = verifyAccessToken(header.slice(7));
    (req as AuthedRequest).user = { id: payload.sub, role: payload.role, sessionId: payload.jti };
    next();
  } catch {
    res.status(401).json({ message: "Sesi berakhir. Silakan masuk kembali." });
  }
}

export function requireRoles(...roles: string[]): RequestHandler {
  return (req: Request, res: Response, next: NextFunction): void => {
    const user = (req as AuthedRequest).user;
    if (!user) {
      res.status(401).json({ message: "Tidak terautentikasi." });
      return;
    }
    if (!roles.includes(user.role)) {
      res.status(403).json({ message: "Anda tidak memiliki akses ke fitur ini." });
      return;
    }
    next();
  };
}