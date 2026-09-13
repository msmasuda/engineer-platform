import "server-only";

import { Resend } from "resend";

function getAppUrl(): string {
  const configuredUrl = process.env.AUTH_URL || process.env.NEXTAUTH_URL;
  if (configuredUrl) return configuredUrl.replace(/\/$/, "");

  const vercelUrl =
    process.env.VERCEL_PROJECT_PRODUCTION_URL || process.env.VERCEL_URL;
  return vercelUrl ? `https://${vercelUrl}` : "http://localhost:3000";
}

export async function sendPasswordResetEmail(email: string, token: string) {
  const resetUrl = new URL("/reset-password", getAppUrl());
  resetUrl.searchParams.set("token", token);

  if (
    process.env.NODE_ENV === "development" &&
    process.env.PASSWORD_RESET_EMAIL_MODE === "console"
  ) {
    console.info(`[password-reset] ${resetUrl.toString()}`);
    return;
  }

  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.CONTACT_EMAIL_FROM;
  if (!apiKey || !from) {
    throw new Error("Resendの送信設定が不足しています。");
  }

  const { data, error } = await new Resend(apiKey).emails.send({
    from,
    to: email,
    subject: "【Engineer Platform】パスワードの再設定",
    html: `
      <h1>パスワードの再設定</h1>
      <p>次のリンクから、1時間以内に新しいパスワードを設定してください。</p>
      <p><a href="${resetUrl.toString()}">パスワードを再設定する</a></p>
      <p>このメールに心当たりがない場合は、何もする必要はありません。</p>
    `,
    text: `次のリンクから、1時間以内に新しいパスワードを設定してください。\n\n${resetUrl.toString()}\n\nこのメールに心当たりがない場合は、何もする必要はありません。`,
  });

  if (error || !data?.id) {
    throw new Error(error?.message ?? "メール送信に失敗しました。");
  }
}
