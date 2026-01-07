import { pool } from "../db/pool";

// This repo supports token revocation (logout) via a simple DB-backed blocklist.
// Schema (recommended):
// CREATE TABLE IF NOT EXISTS token_blocklist (
//   jti text primary key,
//   revoked_at timestamptz not null default now(),
//   expires_at timestamptz
// );

export async function revokeToken(jti: string, expiresAt: Date | null) {
  await pool.query(
    `
    INSERT INTO token_blocklist (jti, revoked_at, expires_at)
    VALUES ($1, now(), $2)
    ON CONFLICT (jti) DO NOTHING
    `,
    [jti, expiresAt]
  );
}

export async function isTokenRevoked(jti: string): Promise<boolean> {
  const { rows } = await pool.query(
    `
    SELECT 1
    FROM token_blocklist
    WHERE jti = $1
    LIMIT 1
    `,
    [jti]
  );
  return rows.length > 0;
}

