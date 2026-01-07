import { Router } from "express";
import { z } from "zod";
import crypto from "node:crypto";

import { signAccessToken, verifyAccessToken } from "../auth/jwt";
import { verifyPassword } from "../auth/password";
import { getAccountByEmail } from "../repositories/accountRepository";
import { revokeToken } from "../repositories/tokenBlocklistRepository";

export const authRouter = Router();

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1)
});

authRouter.post("/login", async (req, res, next) => {
  try {
    const parsed = loginSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: "Invalid payload", details: parsed.error.flatten() });
    }

    const account = await getAccountByEmail(parsed.data.email);
    // Avoid user enumeration: always return same error for wrong email or password
    if (!account) return res.status(401).json({ error: "Invalid credentials" });

    const ok = await verifyPassword(parsed.data.password, account.passwordHash);
    if (!ok) return res.status(401).json({ error: "Invalid credentials" });

    const jti = crypto.randomUUID();
    const token = signAccessToken({ sub: account.id, email: account.email, jti });

    return res.status(200).json({
      accessToken: token,
      tokenType: "Bearer"
    });
  } catch (err) {
    next(err);
  }
});

const logoutSchema = z.object({
  token: z.string().min(1)
});

// Logout here means: revoke the presented token (blocklist by jti).
// Caller can send token in body.
authRouter.post("/logout", async (req, res, next) => {
  try {
    const parsed = logoutSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: "Invalid payload", details: parsed.error.flatten() });
    }

    // Decode/verify to extract jti; if invalid, treat as already logged out.
    try {
      const payload = verifyAccessToken(parsed.data.token);
      if (payload.jti) {
        await revokeToken(payload.jti, payload.exp ? new Date(payload.exp * 1000) : null);
      }
    } catch {
      // ignore
    }

    return res.status(204).send();
  } catch (err) {
    next(err);
  }
});
