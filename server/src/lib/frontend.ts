import express, { type Express } from "express";
import { existsSync } from "node:fs";
import path from "node:path";

/** Optional single-port deployment; Vite continues to serve development. */
export function mountFrontend(app: Express): void {
  if (process.env.SERVE_FRONTEND !== "true") return;
  const directory = path.resolve(process.env.FRONTEND_DIST_DIR || path.resolve(__dirname, "../../../dist"));
  if (!existsSync(path.join(directory, "index.html"))) {
    throw new Error("Build frontend belum tersedia. Jalankan npm run build dari folder utama project sebelum menjalankan server dengan SERVE_FRONTEND=true.");
  }
  app.use(express.static(directory, {
    dotfiles: "deny",
    setHeaders(res, file) {
      res.setHeader("Cache-Control", file.endsWith(".html") ? "no-cache" : "public, max-age=0, must-revalidate");
    },
  }));
}
