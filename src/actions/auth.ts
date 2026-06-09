"use server";

import { signIn, signOut } from "@/auth";

/**
 * 指定されたプロバイダでサインインを実行します。
 * @param provider 'github' | 'google' | 'apple'
 */
export async function handleSignIn(provider: string) {
  await signIn(provider, { redirectTo: "/" });
}

/**
 * サインアウトを実行します。
 */
export async function handleSignOut() {
  await signOut({ redirectTo: "/" });
}
