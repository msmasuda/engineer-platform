import { createHash } from "node:crypto";
import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  requestPasswordReset,
  resetPassword,
} from "@/actions/password-reset";
import { db } from "@/lib/db";
import { registerPasswordResetAttempt } from "@/lib/auth-rate-limit";
import { sendPasswordResetEmail } from "@/lib/password-reset-email";

vi.mock("next/headers", () => ({
  headers: vi.fn().mockResolvedValue(new Headers()),
}));
vi.mock("next/navigation", () => ({
  redirect: vi.fn((path: string) => {
    throw new Error(`REDIRECT:${path}`);
  }),
}));
vi.mock("@/lib/db", () => ({
  db: {
    user: { findUnique: vi.fn() },
    verificationToken: {
      deleteMany: vi.fn(),
      create: vi.fn(),
      findFirst: vi.fn(),
    },
    $transaction: vi.fn(),
  },
}));
vi.mock("@/lib/auth-rate-limit", () => ({
  registerPasswordResetAttempt: vi.fn(),
}));
vi.mock("@/lib/password-reset-email", () => ({
  sendPasswordResetEmail: vi.fn(),
}));
vi.mock("@/lib/auth-utils", () => ({
  isNewPasswordAllowed: vi.fn((password: string) =>
    password.length >= 15 && password.length <= 128,
  ),
  hashPassword: vi.fn().mockResolvedValue("new-password-hash"),
}));

describe("Password reset", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(registerPasswordResetAttempt).mockResolvedValue(true);
    vi.mocked(db.verificationToken.deleteMany).mockResolvedValue({ count: 0 });
    vi.mocked(db.verificationToken.create).mockResolvedValue({} as never);
    vi.mocked(db.$transaction).mockResolvedValue([] as never);
    vi.mocked(sendPasswordResetEmail).mockResolvedValue(undefined);
  });

  it("stores only a hash of the emailed reset token", async () => {
    vi.mocked(db.user.findUnique).mockResolvedValue({
      id: "user-1",
      passwordHash: "old-password-hash",
    } as never);
    const formData = new FormData();
    formData.set("email", "USER@example.com");

    await expect(requestPasswordReset(formData)).rejects.toThrow(
      "REDIRECT:/forgot-password?sent=1",
    );

    const emailedToken = vi.mocked(sendPasswordResetEmail).mock.calls[0][1];
    const storedToken = vi.mocked(db.verificationToken.create).mock.calls[0][0]
      .data.token;
    expect(emailedToken).toMatch(/^[A-Za-z0-9_-]{43}$/);
    expect(storedToken).toBe(
      createHash("sha256").update(emailedToken).digest("hex"),
    );
    expect(storedToken).not.toBe(emailedToken);
    expect(sendPasswordResetEmail).toHaveBeenCalledWith(
      "user@example.com",
      emailedToken,
    );
  });

  it("returns the same completion screen for an unknown account", async () => {
    vi.mocked(db.user.findUnique).mockResolvedValue(null);
    const formData = new FormData();
    formData.set("email", "unknown@example.com");

    await expect(requestPasswordReset(formData)).rejects.toThrow(
      "REDIRECT:/forgot-password?sent=1",
    );
    expect(sendPasswordResetEmail).not.toHaveBeenCalled();
  });

  it("consumes a valid token once and updates the password", async () => {
    const token = "a".repeat(43);
    const identifier = "password-reset:user-1";
    vi.mocked(db.verificationToken.findFirst).mockResolvedValue({
      identifier,
      token: createHash("sha256").update(token).digest("hex"),
      expires: new Date(Date.now() + 60_000),
    });
    const transaction = {
      verificationToken: {
        deleteMany: vi
          .fn()
          .mockResolvedValueOnce({ count: 1 })
          .mockResolvedValueOnce({ count: 0 }),
      },
      user: { update: vi.fn().mockResolvedValue({}) },
    };
    vi.mocked(db.$transaction).mockImplementation(async (callback) =>
      (
        callback as unknown as (
          client: typeof transaction,
        ) => Promise<boolean>
      )(transaction),
    );
    const formData = new FormData();
    formData.set("token", token);
    formData.set("password", "new-password-123");
    formData.set("passwordConfirmation", "new-password-123");

    await expect(resetPassword(formData)).rejects.toThrow(
      "REDIRECT:/reset-password?success=1",
    );
    expect(transaction.user.update).toHaveBeenCalledWith({
      where: { id: "user-1" },
      data: { passwordHash: "new-password-hash" },
    });
  });

  it("rejects a token that another request already consumed", async () => {
    const token = "a".repeat(43);
    vi.mocked(db.verificationToken.findFirst).mockResolvedValue({
      identifier: "password-reset:user-1",
      token: createHash("sha256").update(token).digest("hex"),
      expires: new Date(Date.now() + 60_000),
    });
    const transaction = {
      verificationToken: { deleteMany: vi.fn().mockResolvedValue({ count: 0 }) },
      user: { update: vi.fn() },
    };
    vi.mocked(db.$transaction).mockImplementation(async (callback) =>
      (
        callback as unknown as (
          client: typeof transaction,
        ) => Promise<boolean>
      )(transaction),
    );
    const formData = new FormData();
    formData.set("token", token);
    formData.set("password", "new-password-123");
    formData.set("passwordConfirmation", "new-password-123");

    await expect(resetPassword(formData)).rejects.toThrow(
      "REDIRECT:/reset-password?error=invalid_token",
    );
    expect(transaction.user.update).not.toHaveBeenCalled();
  });
});
