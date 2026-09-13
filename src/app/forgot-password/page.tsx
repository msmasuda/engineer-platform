import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, KeyRound } from "lucide-react";
import { requestPasswordReset } from "@/actions/password-reset";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = {
  title: "パスワードを忘れた方 | Engineer Platform",
};

export default async function ForgotPasswordPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; sent?: string }>;
}) {
  const query = await searchParams;
  const sent = query.sent === "1";

  return (
    <main className="flex min-h-screen items-center justify-center bg-radial from-slate-900 via-zinc-950 to-black px-6 text-zinc-100">
      <div className="w-full max-w-md rounded-3xl border border-white/10 bg-white/5 p-8 shadow-2xl backdrop-blur-xl">
        <KeyRound className="mx-auto h-9 w-9 text-indigo-400" />
        <h1 className="mt-4 text-center text-2xl font-bold">
          パスワードの再設定
        </h1>

        {sent ? (
          <p className="mt-5 rounded-xl border border-emerald-500/20 bg-emerald-500/10 p-4 text-sm leading-relaxed text-emerald-300">
            登録済みのメールアドレスであれば、再設定用リンクを送信しました。
          </p>
        ) : (
          <>
            <p className="mt-3 text-center text-sm leading-relaxed text-zinc-400">
              登録したメールアドレスへ、1時間有効な再設定用リンクを送ります。
            </p>
            <form action={requestPasswordReset} className="mt-6 space-y-4">
              <div className="space-y-1.5">
                <label htmlFor="email" className="text-xs font-semibold text-zinc-300">
                  メールアドレス
                </label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  maxLength={254}
                  className="w-full rounded-xl border border-white/10 bg-zinc-950/40 px-3 py-2.5 text-sm outline-none transition-colors focus:border-indigo-500"
                />
              </div>
              {query.error === "invalid_email" && (
                <p className="text-sm text-rose-400">
                  有効なメールアドレスを入力してください。
                </p>
              )}
              <Button
                type="submit"
                className="h-10 w-full rounded-xl bg-gradient-to-r from-indigo-500 to-emerald-500 font-bold text-white"
              >
                再設定用リンクを送信
              </Button>
            </form>
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
