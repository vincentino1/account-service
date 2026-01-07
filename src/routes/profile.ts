import { Router } from "express";
import { z } from "zod";

import { requireAuth, type AuthenticatedRequest } from "../auth/middleware";
import { verifyPassword, hashPassword } from "../auth/password";
import {
  getAccountById,
  updateAccountProfile,
  updateAccountPassword
} from "../repositories/accountRepository";

export const profileRouter = Router();

profileRouter.get("/me", requireAuth, async (req: AuthenticatedRequest, res, next) => {
  try {
    const accountId = req.auth!.accountId;
    const account = await getAccountById(accountId);
    if (!account) return res.status(404).json({ error: "Account not found" });

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

const updateMeSchema = z
  .object({
    name: z.string().min(1).max(200).optional(),
    phoneNumber: z.string().min(7).max(30).optional(),
    dateOfBirth: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional()
  })
  .strict();

profileRouter.patch("/me", requireAuth, async (req: AuthenticatedRequest, res, next) => {
  try {
    const parsed = updateMeSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: "Invalid payload", details: parsed.error.flatten() });
    }

    const updated = await updateAccountProfile(req.auth!.accountId, {
      name: parsed.data.name,
      phoneNumber: parsed.data.phoneNumber,
      dateOfBirth: parsed.data.dateOfBirth
    });

    if (!updated) return res.status(404).json({ error: "Account not found" });

    return res.json({
      id: updated.id,
      email: updated.email,
      name: updated.name,
      phoneNumber: updated.phoneNumber,
      dateOfBirth: updated.dateOfBirth,
      createdAt: updated.createdAt,
      updatedAt: updated.updatedAt
    });
  } catch (err) {
    next(err);
  }
});

const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1),
    newPassword: z.string().min(8)
  })
  .strict();

profileRouter.post("/change-password", requireAuth, async (req: AuthenticatedRequest, res, next) => {
  try {
    const parsed = changePasswordSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: "Invalid payload", details: parsed.error.flatten() });
    }

    const account = await getAccountById(req.auth!.accountId);
    if (!account) return res.status(404).json({ error: "Account not found" });

    const ok = await verifyPassword(parsed.data.currentPassword, account.passwordHash);
    if (!ok) return res.status(401).json({ error: "Invalid credentials" });

    const newHash = await hashPassword(parsed.data.newPassword);
    await updateAccountPassword(req.auth!.accountId, newHash);

    return res.status(204).send();
  } catch (err) {
    next(err);
  }
});
