import request from "supertest";
import { describe, expect, it, vi } from "vitest";
import { createApp } from "../src/app";

vi.mock("../src/repositories/tokenBlocklistRepository", () => ({
  isTokenRevoked: vi.fn(async () => false),
  revokeToken: vi.fn(async () => undefined)
}));

vi.mock("../src/auth/jwt", () => ({
  verifyAccessToken: vi.fn(() => ({ sub: "user-1", email: "u@example.com", jti: "jti-1" })),
  signAccessToken: vi.fn(() => "token")
}));

vi.mock("../src/auth/password", () => ({
  verifyPassword: vi.fn(async () => true),
  hashPassword: vi.fn(async () => "new-hash")
}));

vi.mock("../src/repositories/accountRepository", () => ({
  getAccountById: vi.fn(async () => ({
    id: "user-1",
    email: "u@example.com",
    name: "User",
    phoneNumber: "+15555550123",
    dateOfBirth: "1990-01-01",
    passwordHash: "hash",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  })),
  updateAccountProfile: vi.fn(async (_id: string, patch: any) => ({
    id: "user-1",
    email: "u@example.com",
    name: patch.name ?? "User",
    phoneNumber: patch.phoneNumber ?? "+15555550123",
    dateOfBirth: patch.dateOfBirth ?? "1990-01-01",
    passwordHash: "hash",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  })),
  updateAccountPassword: vi.fn(async () => undefined),
  getAccountByEmail: vi.fn(async () => null),
  createAccount: vi.fn(async () => {
    throw new Error("not used");
  })
}));

describe("profile", () => {
  it("GET /profile/me returns current user without password", async () => {
    const app = createApp();
    const res = await request(app).get("/profile/me").set("Authorization", "Bearer x");
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty("id", "user-1");
    expect(res.body).toHaveProperty("phoneNumber", "+15555550123");
    expect(res.body).toHaveProperty("dateOfBirth", "1990-01-01");
    expect(res.body).not.toHaveProperty("passwordHash");
  });

  it("PATCH /profile/me updates profile", async () => {
    const app = createApp();
    const res = await request(app)
      .patch("/profile/me")
      .set("Authorization", "Bearer x")
      .send({ name: "New Name", phoneNumber: "+15555550999", dateOfBirth: "1999-12-31" });
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty("name", "New Name");
    expect(res.body).toHaveProperty("phoneNumber", "+15555550999");
    expect(res.body).toHaveProperty("dateOfBirth", "1999-12-31");
  });

  it("POST /profile/change-password returns 204", async () => {
    const app = createApp();
    const res = await request(app)
      .post("/profile/change-password")
      .set("Authorization", "Bearer x")
      .send({ currentPassword: "old", newPassword: "new-password-123" });
    expect(res.status).toBe(204);
  });
});
