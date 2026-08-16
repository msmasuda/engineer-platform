import {
  pbkdf2 as pbkdf2Callback,
  randomBytes,
  scrypt as scryptCallback,
  timingSafeEqual,
} from "node:crypto";

const SCRYPT_VERSION = 1;
const SCRYPT_N = 2 ** 15;
const SCRYPT_R = 8;
const SCRYPT_P = 3;
const SCRYPT_KEY_LENGTH = 64;
const SCRYPT_MAX_MEMORY = 64 * 1024 * 1024;
const LEGACY_PBKDF2_ITERATIONS = 1000;

export const PASSWORD_MIN_LENGTH = 15;
export const PASSWORD_MAX_LENGTH = 128;

export interface PasswordVerificationResult {
  valid: boolean;
  needsRehash: boolean;
}

function safeEqual(actual: Buffer, expected: Buffer): boolean {
  return actual.length === expected.length && timingSafeEqual(actual, expected);
}

function deriveScrypt(
  password: string,
  salt: Buffer,
  keyLength: number,
  options: { N: number; r: number; p: number; maxmem: number },
): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    scryptCallback(password, salt, keyLength, options, (error, derivedKey) => {
      if (error) reject(error);
      else resolve(derivedKey);
    });
  });
}

function deriveLegacyPbkdf2(
  password: string,
  saltHex: string,
  keyLength: number,
): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    pbkdf2Callback(
      password,
      saltHex,
      LEGACY_PBKDF2_ITERATIONS,
      keyLength,
      "sha512",
      (error, derivedKey) => {
        if (error) reject(error);
        else resolve(derivedKey);
      },
    );
  });
}

function parseParameters(value: string): Record<string, number> | null {
  const entries = value.split(",").map((entry) => entry.split("="));
  if (entries.some(([key, parameter]) => !key || !parameter)) return null;

  const parameters = Object.fromEntries(
    entries.map(([key, parameter]) => [key, Number(parameter)]),
  );
  return Object.values(parameters).every(Number.isSafeInteger) ? parameters : null;
}

/**
 * scryptの設定値を含むバージョン付き形式でパスワードをハッシュ化します。
 */
export async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(16);
  const derivedKey = await deriveScrypt(password, salt, SCRYPT_KEY_LENGTH, {
    N: SCRYPT_N,
    r: SCRYPT_R,
    p: SCRYPT_P,
    maxmem: SCRYPT_MAX_MEMORY,
  });

  return [
    "scrypt",
    `v=${SCRYPT_VERSION}`,
    `N=${SCRYPT_N},r=${SCRYPT_R},p=${SCRYPT_P}`,
    salt.toString("base64"),
    derivedKey.toString("base64"),
  ].join("$");
}

async function verifyScrypt(
  password: string,
  storedHash: string,
): Promise<PasswordVerificationResult> {
  const parts = storedHash.split("$");
  if (parts.length !== 5) return { valid: false, needsRehash: false };
  const [algorithm, versionPart, parametersPart, saltPart, hashPart] = parts;
  const parameters = parseParameters(parametersPart ?? "");
  const version = Number(versionPart?.replace("v=", ""));

  if (
    algorithm !== "scrypt" ||
    version !== SCRYPT_VERSION ||
    !parameters ||
    !saltPart ||
    !hashPart ||
    parameters.N !== SCRYPT_N ||
    parameters.r !== SCRYPT_R ||
    parameters.p !== SCRYPT_P
  ) {
    return { valid: false, needsRehash: false };
  }

  try {
    const salt = Buffer.from(saltPart, "base64");
    const expected = Buffer.from(hashPart, "base64");
    if (salt.length !== 16 || expected.length !== SCRYPT_KEY_LENGTH) {
      return { valid: false, needsRehash: false };
    }
    const actual = await deriveScrypt(password, salt, expected.length, {
      N: parameters.N,
      r: parameters.r,
      p: parameters.p,
      maxmem: SCRYPT_MAX_MEMORY,
    });
    return { valid: safeEqual(actual, expected), needsRehash: false };
  } catch {
    return { valid: false, needsRehash: false };
  }
}

async function verifyLegacyPbkdf2(
  password: string,
  storedHash: string,
): Promise<PasswordVerificationResult> {
  const [saltHex, hashHex, ...rest] = storedHash.split(":");
  if (!saltHex || !hashHex || rest.length > 0) {
    return { valid: false, needsRehash: false };
  }

  try {
    const expected = Buffer.from(hashHex, "hex");
    if (!/^[a-f0-9]{32}$/i.test(saltHex) || expected.length !== 64) {
      return { valid: false, needsRehash: false };
    }
    const actual = await deriveLegacyPbkdf2(password, saltHex, expected.length);
    const valid = safeEqual(actual, expected);
    return { valid, needsRehash: valid };
  } catch {
    return { valid: false, needsRehash: false };
  }
}

/**
 * 現行scrypt形式と旧PBKDF2形式を定時間比較で検証します。
 */
export async function verifyPassword(
  password: string,
  storedHash: string,
): Promise<PasswordVerificationResult> {
  return storedHash.startsWith("scrypt$")
    ? verifyScrypt(password, storedHash)
    : verifyLegacyPbkdf2(password, storedHash);
}

export function isNewPasswordAllowed(password: string): boolean {
  return (
    password.length >= PASSWORD_MIN_LENGTH &&
    password.length <= PASSWORD_MAX_LENGTH
  );
}
