"use server";

import { signIn, signOut } from "@/auth";

import { redirect } from "next/navigation";

/**
 * 指定されたプロバイダでサインインを実行します。
 * @param provider 'github' | 'google' | 'apple'
 */
export async function handleSignIn(provider: string) {
  await signIn(provider, { redirectTo: "/" });
}

/**
 * メールアドレスとパスワードによるサインイン（または自動新規登録）を実行します。
 */
export async function handleCredentialsSignIn(formData: FormData) {
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;

  if (!email || !password) {
    redirect("/?error=missing_fields");
  }

  try {
    await signIn("credentials", {
      email,
      password,
      redirectTo: "/",
    });
  } catch (error) {
    if (error && typeof error === "object" && "type" in error) {
      redirect(`/?error=${encodeURIComponent((error as any).type)}`);
    }
    throw error;
  }
}

/**
 * サインアウトを実行します。
 */
export async function handleSignOut() {
  await signOut({ redirectTo: "/" });
}
