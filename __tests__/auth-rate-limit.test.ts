import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  clearLoginAttempts,
  registerLoginAttempt,
} from "@/lib/auth-rate-limit";
import { kv } from "@/lib/kv";

vi.mock("@/lib/kv", () => ({
  kv: {
    zincrby: vi.fn(),
    expire: vi.fn(),
    zrem: vi.fn(),
  },
}));

const request = new Request("https://example.com/api/auth", {
  headers: { "x-forwarded-for": "203.0.113.10" },
});

describe("Credential login rate limiting", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(kv.zincrby).mockResolvedValue(1);
    vi.mocked(kv.expire).mockResolvedValue(1);
    vi.mocked(kv.zrem).mockResolvedValue(1);
  });

  it("allows attempts below both account and IP limits", async () => {
    const result = await registerLoginAttempt("user@example.com", request);

    expect(result.allowed).toBe(true);
    expect(kv.zincrby).toHaveBeenCalledTimes(2);
    expect(kv.expire).toHaveBeenCalledTimes(2);
  });

  it("blocks attempts when the account limit is exceeded", async () => {
    vi.mocked(kv.zincrby)
      .mockResolvedValueOnce(6)
      .mockResolvedValueOnce(10);

    const result = await registerLoginAttempt("user@example.com", request);

    expect(result.allowed).toBe(false);
  });

  it("clears both counters after successful authentication", async () => {
    const { keys } = await registerLoginAttempt("user@example.com", request);

    await clearLoginAttempts(keys);

    expect(kv.zrem).toHaveBeenCalledTimes(2);
  });
});
