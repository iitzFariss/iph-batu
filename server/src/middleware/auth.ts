import { NextFunction, Request, RequestHandler, Response } from "express";
import { verifyAccessToken } from "../lib/security";
import prisma from "../lib/prisma";

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
    if (!payload.jti || !payload.sub) {
      res.status(401).json({ message: "Sesi berakhir. Silakan masuk kembali." });
      return;
    }
    void prisma.session.findFirst({
      where: { id: payload.jti, userId: payload.sub, revokedAt: null, expiresAt: { gt: new Date() } },
      include: { user: { select: { status: true, role: true } } },
    }).then(session => {
      if (!session || session.user.status !== "aktif") {
        res.status(401).json({ message: "Sesi berakhir. Silakan masuk kembali." });
        return;
      }
      (req as AuthedRequest).user = { id: payload.sub, role: session.user.role, sessionId: session.id };
      next();
    }).catch(next);
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
