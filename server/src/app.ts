import cors from "cors";
import express from "express";
import helmet from "helmet";
import { errorHandler, notFound } from "./middleware/error";
import authRoutes from "./routes/auth.routes";
import masterRoutes from "./routes/master.routes";
import rekapRoutes from "./routes/rekap.routes";
import rapatRoutes from "./routes/rapat.routes";
import publicRoutes from "./routes/public.routes";
import userRoutes from "./routes/user.routes";
import {
  authLimiter,
  guestLimiter,
  loginPerEmailLimiter,
  publicLimiter,
  refreshIpLimiter,
  refreshLimiter,
} from "./middleware/rateLimit";
import { checkDatabase } from "./lib/health";
import { CLIENT_ORIGIN } from "./lib/env";

export function createApp() {
  const app = express();

  app.set("trust proxy", 1);
  app.use(helmet());
  app.use(
    cors({
      origin: CLIENT_ORIGIN,
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

  app.use("/api/auth/login", authLimiter, loginPerEmailLimiter);
  app.use("/api/auth/guest", guestLimiter);
  app.use("/api/auth/refresh", refreshLimiter, refreshIpLimiter);
  app.use("/api/public", publicLimiter);

  app.use("/api/auth", authRoutes);
  app.use("/api/public", publicRoutes);
  app.use("/api", masterRoutes);
  app.use("/api/rekap", rekapRoutes);
  app.use("/api/rapat", rapatRoutes);
  app.use("/api/users", userRoutes);

  app.use(notFound);
  app.use(errorHandler);

  return app;
}