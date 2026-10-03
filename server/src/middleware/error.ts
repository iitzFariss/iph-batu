import { randomUUID } from "node:crypto";
import { NextFunction, Request, Response } from "express";
import { ZodError } from "zod";
import { Prisma } from "@prisma/client";
import { log } from "../lib/logger";

export function notFound(_req: Request, res: Response): void {
  res.status(404).json({ message: "Endpoint tidak ditemukan." });
}

type BodyParserError = Error & { type?: string; status?: number };

export function errorHandler(err: unknown, req: Request, res: Response, _next: NextFunction): void {
  const requestId = randomUUID();

  if (err instanceof ZodError) {
    const issue = err.issues[0];
    res.status(400).json({
      message: issue?.message ?? "Data tidak valid.",
      field: issue?.path.join("."),
      requestId,
    });
    return;
  }

  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    if (err.code === "P2002") {
      res.status(409).json({ message: "Data sudah terdaftar / duplikat.", requestId });
      return;
    }
    if (err.code === "P2025") {
      res.status(404).json({ message: "Data tidak ditemukan.", requestId });
      return;
    }
  }

  const bodyErr = err as BodyParserError;
  if (bodyErr?.type === "entity.too.large") {
    res.status(413).json({ message: "Data yang dikirim terlalu besar.", requestId });
    return;
  }
  if (bodyErr?.type === "entity.parse.failed") {
    res.status(400).json({ message: "Format JSON tidak valid.", requestId });
    return;
  }

  log.error("request.gagal", {
    requestId,
    method: req.method,
    path: req.originalUrl,
    message: (err as Error)?.message ?? String(err),
  });
  res.status(500).json({ message: "Terjadi kesalahan pada server.", requestId });
}