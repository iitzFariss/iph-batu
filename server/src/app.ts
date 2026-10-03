import cors from "cors";
import express from "express";
import { errorHandler, notFound } from "./middleware/error";
import authRoutes from "./routes/auth.routes";
import masterRoutes from "./routes/master.routes";
import rekapRoutes from "./routes/rekap.routes";
import publicRoutes from "./routes/public.routes";

export function createApp() {
  const app = express();

  app.use(
    cors({
      origin: process.env.CLIENT_ORIGIN ?? "http://localhost:5173",
      credentials: true,
    })
  );
  app.use(express.json());

  app.get("/api/health", (_req, res) => {
    res.json({ status: "ok", service: "tpid-iph-api" });
  });

  app.use("/api/auth", authRoutes);
  app.use("/api/public", publicRoutes);
  app.use("/api", masterRoutes);
  app.use("/api/rekap", rekapRoutes);

  app.use(notFound);
  app.use(errorHandler);

  return app;
}