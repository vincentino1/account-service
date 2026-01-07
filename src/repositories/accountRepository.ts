import { pool } from "../db/pool";
import type { Account } from "../models/account";

// Assumed table schema (can be adjusted once your DB schema is confirmed):
// account(
//   id uuid primary key default gen_random_uuid(),
//   email text unique not null,
//   name text,
//   password_hash text not null,
//   created_at timestamptz not null default now(),
//   updated_at timestamptz not null default now()
// )

export async function getAccountById(id: string): Promise<Account | null> {
  const { rows } = await pool.query(
    `
    SELECT id, email, name, phone_number, date_of_birth, password_hash, created_at, updated_at
    FROM account
    WHERE id = $1
    `,
    [id]
  );

  if (rows.length === 0) return null;
  const r = rows[0] as {
    id: string;
    email: string;
    name: string | null;
    phone_number: string | null;
    date_of_birth: string | null;
    password_hash: string;
    created_at: string;
    updated_at: string;
  };

  return {
    id: r.id,
    email: r.email,
    name: r.name,
    phoneNumber: r.phone_number,
    dateOfBirth: r.date_of_birth,
    passwordHash: r.password_hash,
    createdAt: r.created_at,
    updatedAt: r.updated_at
  };
}

export async function createAccount(input: {
  email: string;
  name?: string;
  phoneNumber?: string;
  dateOfBirth?: string;
  passwordHash: string;
}): Promise<Account> {
  const { rows } = await pool.query(
    `
    INSERT INTO account (email, name, phone_number, date_of_birth, password_hash)
    VALUES ($1, $2, $3, $4, $5)
    RETURNING id, email, name, phone_number, date_of_birth, password_hash, created_at, updated_at
    `,
    [
      input.email,
      input.name ?? null,
      input.phoneNumber ?? null,
      input.dateOfBirth ?? null,
      input.passwordHash
    ]
  );

  const r = rows[0] as {
    id: string;
    email: string;
    name: string | null;
    phone_number: string | null;
    date_of_birth: string | null;
    password_hash: string;
    created_at: string;
    updated_at: string;
  };

  return {
    id: r.id,
    email: r.email,
    name: r.name,
    phoneNumber: r.phone_number,
    dateOfBirth: r.date_of_birth,
    passwordHash: r.password_hash,
    createdAt: r.created_at,
    updatedAt: r.updated_at
  };
}

export async function getAccountByEmail(email: string): Promise<Account | null> {
  const { rows } = await pool.query(
    `
    SELECT id, email, name, phone_number, date_of_birth, password_hash, created_at, updated_at
    FROM account
    WHERE lower(email) = lower($1)
    LIMIT 1
    `,
    [email]
  );

  if (rows.length === 0) return null;
  const r = rows[0] as {
    id: string;
    email: string;
    name: string | null;
    phone_number: string | null;
    date_of_birth: string | null;
    password_hash: string;
    created_at: string;
    updated_at: string;
  };

  return {
    id: r.id,
    email: r.email,
    name: r.name,
    phoneNumber: r.phone_number,
    dateOfBirth: r.date_of_birth,
    passwordHash: r.password_hash,
    createdAt: r.created_at,
    updatedAt: r.updated_at
  };
}

export async function updateAccountProfile(
  id: string,
  patch: {
    name?: string;
    phoneNumber?: string;
    dateOfBirth?: string;
  }
): Promise<Account | null> {
  const { rows } = await pool.query(
    `
    UPDATE account
    SET name = COALESCE($2, name),
        phone_number = COALESCE($3, phone_number),
        date_of_birth = COALESCE($4, date_of_birth),
        updated_at = now()
    WHERE id = $1
    RETURNING id, email, name, phone_number, date_of_birth, password_hash, created_at, updated_at
    `,
    [id, patch.name ?? null, patch.phoneNumber ?? null, patch.dateOfBirth ?? null]
  );

  if (rows.length === 0) return null;
  const r = rows[0] as {
    id: string;
    email: string;
    name: string | null;
    phone_number: string | null;
    date_of_birth: string | null;
    password_hash: string;
    created_at: string;
    updated_at: string;
  };

  return {
    id: r.id,
    email: r.email,
    name: r.name,
    phoneNumber: r.phone_number,
    dateOfBirth: r.date_of_birth,
    passwordHash: r.password_hash,
    createdAt: r.created_at,
    updatedAt: r.updated_at
  };
}

export async function updateAccountPassword(id: string, passwordHash: string): Promise<void> {
  await pool.query(
    `
    UPDATE account
    SET password_hash = $2,
        updated_at = now()
    WHERE id = $1
    `,
    [id, passwordHash]
  );
}
