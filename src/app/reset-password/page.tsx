import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, CheckCircle2, KeyRound } from "lucide-react";
import { resetPassword } from "@/actions/password-reset";
import { Button } from "@/components/ui/button";
import { PASSWORD_MAX_LENGTH, PASSWORD_MIN_LENGTH } from "@/lib/auth-utils";

export const metadata: Metadata = {
  title: "新しいパスワードを設定 | Engineer Platform",
};

export default async function ResetPasswordPage({
  searchParams,
}: {
  searchParams: Promise<{
    token?: string;
    error?: string;
    success?: string;
  }>;
}) {
  const query = await searchParams;
  const success = query.success === "1";
  const hasToken = typeof query.token === "string" && query.token.length > 0;
  const errorMessage =
    query.error === "invalid_password"
      ? "パスワードは15〜128文字で、確認用と同じ内容を入力してください。"
      : query.error === "server_error"
        ? "パスワードを更新できませんでした。時間をおいて再度お試しください。"
        : query.error === "invalid_token" || !hasToken
          ? "再設定用リンクが無効か、有効期限が切れています。"
          : "";

  return (
    <main className="flex min-h-screen items-center justify-center bg-radial from-slate-900 via-zinc-950 to-black px-6 text-zinc-100">
      <div className="w-full max-w-md rounded-3xl border border-white/10 bg-white/5 p-8 shadow-2xl backdrop-blur-xl">
        {success ? (
          <>
            <CheckCircle2 className="mx-auto h-9 w-9 text-emerald-400" />
            <h1 className="mt-4 text-center text-2xl font-bold">
              パスワードを更新しました
            </h1>
            <p className="mt-3 text-center text-sm text-zinc-400">
              新しいパスワードでサインインできます。
            </p>
          </>
        ) : (
          <>
            <KeyRound className="mx-auto h-9 w-9 text-indigo-400" />
            <h1 className="mt-4 text-center text-2xl font-bold">
              新しいパスワードを設定
            </h1>

            {errorMessage && (
              <p className="mt-5 rounded-xl border border-rose-500/20 bg-rose-500/10 p-4 text-sm leading-relaxed text-rose-300">
                {errorMessage}
              </p>
            )}

            {hasToken && query.error !== "invalid_token" && (
              <form action={resetPassword} className="mt-6 space-y-4">
                <input type="hidden" name="token" value={query.token} />
                <div className="space-y-1.5">
                  <label htmlFor="password" className="text-xs font-semibold text-zinc-300">
                    新しいパスワード
                  </label>
                  <input
                    id="password"
                    name="password"
                    type="password"
                    autoComplete="new-password"
                    required
                    minLength={PASSWORD_MIN_LENGTH}
                    maxLength={PASSWORD_MAX_LENGTH}
                    className="w-full rounded-xl border border-white/10 bg-zinc-950/40 px-3 py-2.5 text-sm outline-none transition-colors focus:border-indigo-500"
                  />
                </div>
                <div className="space-y-1.5">
                  <label htmlFor="passwordConfirmation" className="text-xs font-semibold text-zinc-300">
                    新しいパスワード（確認）
                  </label>
                  <input
                    id="passwordConfirmation"
                    name="passwordConfirmation"
                    type="password"
                    autoComplete="new-password"
                    required
                    minLength={PASSWORD_MIN_LENGTH}
                    maxLength={PASSWORD_MAX_LENGTH}
                    className="w-full rounded-xl border border-white/10 bg-zinc-950/40 px-3 py-2.5 text-sm outline-none transition-colors focus:border-indigo-500"
                  />
                </div>
                <Button
                  type="submit"
                  className="h-10 w-full rounded-xl bg-gradient-to-r from-indigo-500 to-emerald-500 font-bold text-white"
                >
                  パスワードを更新
                </Button>
              </form>
            )}
          </>
        )}

        <Link
          href="/"
          className="mt-6 flex items-center justify-center gap-1 text-sm text-zinc-400 hover:text-zinc-200"
        >
          <ArrowLeft className="h-4 w-4" />
          サインインへ戻る
        </Link>
      </div>
    </main>
  );
}
