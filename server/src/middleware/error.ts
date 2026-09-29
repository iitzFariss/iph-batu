import { NextFunction, Request, Response } from "express";
import { ZodError } from "zod";
import { Prisma } from "@prisma/client";

export function notFound(_req: Request, res: Response): void {
  res.status(404).json({ message: "Endpoint tidak ditemukan." });
}

export function errorHandler(err: unknown, _req: Request, res: Response, _next: NextFunction): void {
  if (err instanceof ZodError) {
    res.status(400).json({ message: err.issues[0]?.message ?? "Data tidak valid." });
    return;
  }
  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    if (err.code === "P2002") {
      res.status(409).json({ message: "Data sudah terdaftar / duplikat." });
      return;
    }
  }
  console.error("[api]", err);
  res.status(500).json({ message: "Terjadi kesalahan pada server." });
}