import { pbkdf2Sync, randomBytes } from "node:crypto";
import { describe, expect, it } from "vitest";
import {
  hashPassword,
  isNewPasswordAllowed,
  verifyPassword,
} from "@/lib/auth-utils";

function createLegacyHash(password: string): string {
  const salt = randomBytes(16).toString("hex");
  const hash = pbkdf2Sync(password, salt, 1000, 64, "sha512").toString("hex");
  return `${salt}:${hash}`;
}

describe("Password hashing", () => {
  it("hashes and verifies a password with the current scrypt format", async () => {
    const storedHash = await hashPassword("correct horse battery staple");

    expect(storedHash).toMatch(/^scrypt\$v=1\$N=32768,r=8,p=3\$/);
    await expect(
      verifyPassword("correct horse battery staple", storedHash),
    ).resolves.toEqual({ valid: true, needsRehash: false });
    await expect(verifyPassword("wrong password", storedHash)).resolves.toEqual({
      valid: false,
      needsRehash: false,
    });
  });

  it("accepts a valid legacy PBKDF2 hash and requests migration", async () => {
    const storedHash = createLegacyHash("legacy-password");

    await expect(verifyPassword("legacy-password", storedHash)).resolves.toEqual({
      valid: true,
      needsRehash: true,
    });
  });

  it("rejects malformed and incorrect legacy hashes", async () => {
    await expect(verifyPassword("password", "invalid")).resolves.toEqual({
      valid: false,
      needsRehash: false,
    });
    await expect(
      verifyPassword("wrong-password", createLegacyHash("right-password")),
    ).resolves.toEqual({ valid: false, needsRehash: false });
  });

  it("enforces the new-account password length policy", () => {
    expect(isNewPasswordAllowed("short-password")).toBe(false);
    expect(isNewPasswordAllowed("123456789012345")).toBe(true);
    expect(isNewPasswordAllowed("a".repeat(128))).toBe(true);
    expect(isNewPasswordAllowed("a".repeat(129))).toBe(false);
  });
});
