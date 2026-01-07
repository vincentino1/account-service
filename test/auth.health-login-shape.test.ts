import request from "supertest";
import { describe, expect, it, vi } from "vitest";
import { createApp } from "../src/app";

// This is a lightweight test that doesn't hit Postgres.
// We stub the repository method used by /auth/login so we can validate the API contract.
vi.mock("../src/repositories/accountRepository", () => {
  return {
    getAccountByEmail: vi.fn(async () => ({
      id: "00000000-0000-0000-0000-000000000001",
      email: "user@example.com",
      name: "User",
      passwordHash: "$2b$10$CwTycUXWue0Thq9StjUM0uJ8x6E6G8uT9nN2xWn5o9VnDdxuQk.3O", // bcrypt hash of 'password'
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }))
  };
});

vi.mock("../src/auth/password", async () => {
  return {
    verifyPassword: vi.fn(async () => true),
    hashPassword: vi.fn(async () => "hash")
  };
});

describe("auth", () => {
  it("login returns a bearer token", async () => {
    const app = createApp();

    const res = await request(app)
      .post("/auth/login")
      .send({ email: "user@example.com", password: "password" });

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty("accessToken");
    expect(typeof res.body.accessToken).toBe("string");
    expect(res.body).toMatchObject({ tokenType: "Bearer" });
  });

  it("logout accepts token and returns 204", async () => {
    const app = createApp();

    const res = await request(app).post("/auth/logout").send({ token: "fake" });
    expect(res.status).toBe(204);
  });
});

