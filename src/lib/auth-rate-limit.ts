import { createHash } from "node:crypto";
import { kv } from "@/lib/kv";

const WINDOW_SECONDS = 15 * 60;
const ACCOUNT_ATTEMPT_LIMIT = 5;
const IP_ATTEMPT_LIMIT = 20;

interface AttemptKeys {
  accountKey: string;
  accountMember: string;
  ipKey: string;
  ipMember: string;
}

function digest(value: string): string {
  return createHash("sha256").update(value).digest("hex");
}

function getAttemptKeys(email: string, request: Request): AttemptKeys {
  const forwardedFor = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  const clientAddress =
    request.headers.get("x-vercel-forwarded-for") ||
    forwardedFor ||
    request.headers.get("x-real-ip") ||
    "unknown";
  const bucket = Math.floor(Date.now() / (WINDOW_SECONDS * 1000));

  return {
    accountKey: `rate:auth:account:${bucket}`,
    accountMember: digest(email.trim().toLowerCase()),
    ipKey: `rate:auth:ip:${bucket}`,
    ipMember: digest(clientAddress),
  };
}

export async function registerLoginAttempt(
  email: string,
  request: Request,
): Promise<{ allowed: boolean; keys: AttemptKeys }> {
  const keys = getAttemptKeys(email, request);
  const [accountAttempts, ipAttempts] = await Promise.all([
    kv.zincrby(keys.accountKey, 1, keys.accountMember),
    kv.zincrby(keys.ipKey, 1, keys.ipMember),
  ]);
  await Promise.all([
    kv.expire(keys.accountKey, WINDOW_SECONDS + 60),
    kv.expire(keys.ipKey, WINDOW_SECONDS + 60),
  ]);

  return {
    allowed:
      accountAttempts !== null &&
      ipAttempts !== null &&
      accountAttempts <= ACCOUNT_ATTEMPT_LIMIT &&
      ipAttempts <= IP_ATTEMPT_LIMIT,
    keys,
  };
}

export async function clearLoginAttempts(keys: AttemptKeys): Promise<void> {
  await Promise.all([
    kv.zrem(keys.accountKey, keys.accountMember),
    kv.zrem(keys.ipKey, keys.ipMember),
  ]);
}
