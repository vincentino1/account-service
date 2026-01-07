import { Router } from "express";
import { z } from "zod";
import { hashPassword } from "../auth/password";
import { createAccount, getAccountById } from "../repositories/accountRepository";

export const accountsRouter = Router();

const createAccountSchema = z.object({
  email: z.string().email(),
  name: z.string().min(1).optional(),
  phoneNumber: z.string().min(7).max(30).optional(),
  dateOfBirth: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  password: z.string().min(8)
});

accountsRouter.get("/:id", async (req, res, next) => {
  try {
    const id = req.params.id;
    const account = await getAccountById(id);
    if (!account) return res.status(404).json({ error: "Account not found" });

    // Don’t return password hash
    return res.json({
      id: account.id,
      email: account.email,
      name: account.name,
      phoneNumber: account.phoneNumber,
      dateOfBirth: account.dateOfBirth,
      createdAt: account.createdAt,
      updatedAt: account.updatedAt
    });
  } catch (err) {
    next(err);
  }
});

accountsRouter.post("/", async (req, res, next) => {
  try {
    const parsed = createAccountSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: "Invalid payload", details: parsed.error.flatten() });
    }

    const passwordHash = await hashPassword(parsed.data.password);

    const created = await createAccount({
      email: parsed.data.email,
      name: parsed.data.name,
      phoneNumber: parsed.data.phoneNumber,
      dateOfBirth: parsed.data.dateOfBirth,
      passwordHash
    });

    return res.status(201).json({
      id: created.id,
      email: created.email,
      name: created.name,
      phoneNumber: created.phoneNumber,
      dateOfBirth: created.dateOfBirth,
      createdAt: created.createdAt,
      updatedAt: created.updatedAt
    });
  } catch (err: any) {
    // handle duplicate email (postgres unique violation)
    if (err?.code === "23505") {
      return res.status(409).json({ error: "Email already exists" });
    }
    next(err);
  }
});
