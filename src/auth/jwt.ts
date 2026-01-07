import { sign, verify, type JwtPayload } from "jsonwebtoken";
import type { StringValue } from "ms";
import { env } from "../config/env";

export type AccessTokenPayload = {
  sub: string; // account id
  email: string;
  jti: string;
};

export function signAccessToken(payload: AccessTokenPayload) {
  return sign(payload, env.JWT_SECRET, {
    expiresIn: env.JWT_EXPIRES_IN as StringValue
  });
}

export function verifyAccessToken(token: string): AccessTokenPayload & JwtPayload {
  return verify(token, env.JWT_SECRET) as AccessTokenPayload & JwtPayload;
}
