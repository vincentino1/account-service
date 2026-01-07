import type { NextFunction, Request, Response } from "express";
import { verifyAccessToken } from "./jwt";
import { isTokenRevoked } from "../repositories/tokenBlocklistRepository";

export type AuthenticatedRequest = Request & {
  auth?: {
    accountId: string;
    email: string;
    jti: string;
  };
};

export async function requireAuth(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const header = req.header("authorization");
    if (!header?.startsWith("Bearer ")) {
      return res.status(401).json({ error: "Missing Bearer token" });
    }

    const token = header.slice("Bearer ".length);
    const payload = verifyAccessToken(token);

    // Optional revocation check:
    if (payload.jti) {
      const revoked = await isTokenRevoked(payload.jti);
      if (revoked) return res.status(401).json({ error: "Token revoked" });
    }

    req.auth = {
      accountId: payload.sub,
      email: payload.email,
      jti: payload.jti
    };

    return next();
  } catch {
    return res.status(401).json({ error: "Invalid token" });
  }
}

