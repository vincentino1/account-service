import request from "supertest";
import { describe, expect, it, vi } from "vitest";
import { createApp } from "../src/app";

vi.mock("../src/auth/password", () => ({
  hashPassword: vi.fn(async () => "hash"),
  verifyPassword: vi.fn(async () => true)
}));

const createAccountSpy = vi.fn(async (input: any) => ({
  id: "user-1",
  email: input.email,
  name: input.name ?? null,
  phoneNumber: input.phoneNumber ?? null,
  dateOfBirth: input.dateOfBirth ?? null,
  passwordHash: input.passwordHash,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString()
}));

vi.mock("../src/repositories/accountRepository", () => ({
  createAccount: (input: any) => createAccountSpy(input),
  getAccountById: vi.fn(async () => null),
  getAccountByEmail: vi.fn(async () => null),
  updateAccountProfile: vi.fn(async () => null),
  updateAccountPassword: vi.fn(async () => undefined)
}));

describe("registration", () => {
  it("POST /accounts supports phoneNumber and dateOfBirth", async () => {
    const app = createApp();

    const res = await request(app).post("/accounts").send({
      email: "user@example.com",
      name: "User",
      phoneNumber: "+15555550123",
      dateOfBirth: "1990-01-01",
      password: "new-password-123"
    });

    expect(res.status).toBe(201);
    expect(res.body).toMatchObject({
      email: "user@example.com",
      name: "User",
      phoneNumber: "+15555550123",
      dateOfBirth: "1990-01-01"
    });

    expect(createAccountSpy).toHaveBeenCalledTimes(1);
    expect(createAccountSpy.mock.calls[0][0]).toMatchObject({
      email: "user@example.com",
      phoneNumber: "+15555550123",
      dateOfBirth: "1990-01-01"
    });
  });

  it("POST /accounts rejects invalid dateOfBirth format", async () => {
    const app = createApp();
    const res = await request(app).post("/accounts").send({
      email: "user@example.com",
      password: "new-password-123",
      dateOfBirth: "01-01-1990"
    });
    expect(res.status).toBe(400);
  });
});
