import { describe, it, expect, vi, beforeEach } from "vitest";
import { handleSignIn, handleSignOut } from "@/actions/auth";
import { signIn, signOut } from "@/auth";

// @/auth モジュールをモック
vi.mock("@/auth", () => ({
  signIn: vi.fn(),
  signOut: vi.fn(),
  auth: vi.fn(),
  handlers: { GET: vi.fn(), POST: vi.fn() },
}));

describe("Authentication Server Actions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("handleSignIn", () => {
    it("should call signIn with github and redirect option", async () => {
      await handleSignIn("github");
      expect(signIn).toHaveBeenCalledTimes(1);
      expect(signIn).toHaveBeenCalledWith("github", { redirectTo: "/" });
    });

    it("should call signIn with google and redirect option", async () => {
      await handleSignIn("google");
      expect(signIn).toHaveBeenCalledTimes(1);
      expect(signIn).toHaveBeenCalledWith("google", { redirectTo: "/" });
    });
  });

  describe("handleSignOut", () => {
    it("should call signOut with redirect option", async () => {
      await handleSignOut();
      expect(signOut).toHaveBeenCalledTimes(1);
      expect(signOut).toHaveBeenCalledWith({ redirectTo: "/" });
    });
  });
});
