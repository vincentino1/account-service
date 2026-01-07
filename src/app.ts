import express, { type Request, type Response } from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";

import { env } from "./config/env";
import { accountsRouter } from "./routes/accounts";
import { authRouter } from "./routes/auth";
import { profileRouter } from "./routes/profile";

export function createApp() {
  const app = express();

  app.use(helmet());
  app.use(cors());
  app.use(express.json({ limit: "1mb" }));
  app.use(morgan(env.NODE_ENV === "production" ? "combined" : "dev"));

  app.get("/health", (_req: Request, res: Response) => {
    res.json({ ok: true, service: "account-service" });
  });

  app.use("/auth", authRouter);
  app.use("/profile", profileRouter);
  app.use("/accounts", accountsRouter);

  // 404
  app.use((_req, res) => {
    res.status(404).json({ error: "Not Found" });
  });

  // error handler
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  app.use((err: unknown, _req: Request, res: Response, _next: unknown) => {
    console.error(err);
    res.status(500).json({ error: "Internal Server Error" });
  });

  return app;
}
