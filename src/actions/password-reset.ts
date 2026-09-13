"use server";

import { createHash, randomBytes } from "node:crypto";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { z } from "zod";
import { db } from "@/lib/db";
import {
  hashPassword,
  isNewPasswordAllowed,
} from "@/lib/auth-utils";
import { registerPasswordResetAttempt } from "@/lib/auth-rate-limit";
import { sendPasswordResetEmail } from "@/lib/password-reset-email";

const RESET_TOKEN_PREFIX = "password-reset:";
const RESET_TOKEN_TTL_MS = 60 * 60 * 1000;
const emailSchema = z.email().max(254);
const tokenSchema = z.string().regex(/^[A-Za-z0-9_-]{43}$/);

function digestToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

export async function requestPasswordReset(formData: FormData) {
  const result = emailSchema.safeParse(formData.get("email"));
  if (!result.success) redirect("/forgot-password?error=invalid_email");

  const email = result.data.trim().toLowerCase();
  try {
    const allowed = await registerPasswordResetAttempt(email, await headers());
    const user = allowed
      ? await db.user.findUnique({
          where: { email },
          select: { id: true, passwordHash: true },
        })
      : null;

    if (user?.passwordHash) {
      const token = randomBytes(32).toString("base64url");
      const identifier = `${RESET_TOKEN_PREFIX}${user.id}`;
      await db.$transaction([
        db.verificationToken.deleteMany({ where: { identifier } }),
        db.verificationToken.create({
          data: {
            identifier,
            token: digestToken(token),
            expires: new Date(Date.now() + RESET_TOKEN_TTL_MS),
          },
        }),
      ]);
      await sendPasswordResetEmail(email, token);
    }
  } catch (error) {
    console.error("Failed to request password reset:", error);
  }

  redirect("/forgot-password?sent=1");
}

export async function resetPassword(formData: FormData) {
  const token = formData.get("token");
  const password = formData.get("password");
  const confirmation = formData.get("passwordConfirmation");

  if (typeof token !== "string" || !tokenSchema.safeParse(token).success) {
    redirect("/reset-password?error=invalid_token");
  }
  if (
    typeof password !== "string" ||
    password !== confirmation ||
    !isNewPasswordAllowed(password)
  ) {
    redirect(
      `/reset-password?token=${encodeURIComponent(token)}&error=invalid_password`,
    );
  }

  let reset = false;
  try {
    const tokenHash = digestToken(token);
    const storedToken = await db.verificationToken.findFirst({
      where: {
        token: tokenHash,
        identifier: { startsWith: RESET_TOKEN_PREFIX },
        expires: { gt: new Date() },
      },
    });

    if (storedToken) {
      const passwordHash = await hashPassword(password);
      const userId = storedToken.identifier.slice(RESET_TOKEN_PREFIX.length);
      reset = await db.$transaction(async (transaction) => {
        const deleted = await transaction.verificationToken.deleteMany({
          where: {
            identifier: storedToken.identifier,
            token: tokenHash,
            expires: { gt: new Date() },
          },
        });
        if (deleted.count !== 1) return false;

        await transaction.user.update({
          where: { id: userId },
          data: { passwordHash },
        });
        await transaction.verificationToken.deleteMany({
          where: { identifier: storedToken.identifier },
        });
        return true;
      });
    }
  } catch (error) {
    console.error("Failed to reset password:", error);
    redirect(
      `/reset-password?token=${encodeURIComponent(token)}&error=server_error`,
    );
  }

  redirect(
    reset
      ? "/reset-password?success=1"
      : "/reset-password?error=invalid_token",
  );
}
