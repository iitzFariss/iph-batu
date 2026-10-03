import cors from "cors";
import express from "express";
import helmet from "helmet";
import { errorHandler, notFound } from "./middleware/error";
import authRoutes from "./routes/auth.routes";
import masterRoutes from "./routes/master.routes";
import rekapRoutes from "./routes/rekap.routes";
import publicRoutes from "./routes/public.routes";
import { authLimiter, guestLimiter, publicLimiter, refreshLimiter } from "./middleware/rateLimit";
import { checkDatabase } from "./lib/health";

export function createApp() {
  const app = express();

  app.set("trust proxy", 1);
  app.use(helmet());
  app.use(
    cors({
      origin: process.env.CLIENT_ORIGIN ?? "http://localhost:5173",
      credentials: true,
      methods: ["GET", "POST", "PATCH", "PUT", "DELETE", "OPTIONS"],
      allowedHeaders: ["Content-Type", "Authorization"],
    })
  );
  app.use(express.json({ limit: "1mb" }));

  app.get("/api/health", async (_req, res) => {
    const db = await checkDatabase();
    res.status(db.up ? 200 : 503).json({
      status: db.up ? "ok" : "degraded",
      service: "tpid-iph-api",
      db: db.up ? "up" : "down",
      dbLatencyMs: db.latencyMs,
      uptimeSec: Math.round(process.uptime()),
    });
  });

  app.use("/api/auth/login", authLimiter);
  app.use("/api/auth/guest", guestLimiter);
  app.use("/api/auth/refresh", refreshLimiter);
  app.use("/api/public", publicLimiter);

  app.use("/api/auth", authRoutes);
  app.use("/api/public", publicRoutes);
  app.use("/api", masterRoutes);
  app.use("/api/rekap", rekapRoutes);

  app.use(notFound);
  app.use(errorHandler);

  return app;
}