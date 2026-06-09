import { auth } from "@/auth";
import { db } from "@/lib/db";
import { handleSignIn, handleSignOut } from "@/actions/auth";
import { Button } from "@/components/ui/button";
import { getCumulativeRanking, getWeeklyTrendRanking } from "@/lib/ranking";
import RankingSidebar from "@/components/ranking-sidebar";
import FeedTabs from "@/components/feed-tabs";
import Image from "next/image";
import Link from "next/link";
import { LogOut, Plus, Database, Sparkles, LogIn, Laptop } from "lucide-react";

// ソーシャルアイコンの定義
const GithubIcon = () => (
  <svg className="mr-2 h-4 w-4" aria-hidden="true" fill="currentColor" viewBox="0 0 24 24">
    <path fillRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" clipRule="evenodd" />
  </svg>
);

const GoogleIcon = () => (
  <svg className="mr-2 h-4 w-4" aria-hidden="true" fill="currentColor" viewBox="0 0 24 24">
    <path d="M12.24 10.285V14.4h6.887c-.648 2.41-2.519 4.114-5.136 4.114-3.354 0-6.082-2.73-6.082-6.086 0-3.355 2.728-6.086 6.082-6.086 1.458 0 2.793.518 3.84 1.377l3.057-3.06c-1.92-1.745-4.455-2.82-7.25-2.82-5.918 0-10.718 4.8-10.718 10.718 0 5.919 4.8 10.718 10.718 10.718 5.719 0 10.432-4.148 10.432-10.285 0-.585-.05-1.155-.152-1.71H12.24z" />
  </svg>
);

const AppleIcon = () => (
  <svg className="mr-2 h-4 w-4" aria-hidden="true" fill="currentColor" viewBox="0 0 24 24">
    <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M15.97 4.17c.66-.81 1.11-1.93.99-3.06-1 .04-2.21.67-2.93 1.49-.62.69-1.16 1.84-1.01 2.96 1.11.09 2.26-.56 2.95-1.39" />
  </svg>
);

export default async function Home() {
  const session = await auth();

  // DB接続検証用
  let dbUser = null;
  let dbError = null;

  if (session?.user?.id) {
    try {
      dbUser = await db.user.findUnique({
        where: { id: session.user.id },
      });
    } catch (error) {
      console.error("Failed to fetch dashboard data:", error);
      dbError = error instanceof Error ? error.message : String(error);
    }
  }

  // すべてのプロダクト投稿をタグといいねを含めて取得
  let allPosts: any[] = [];
  try {
    allPosts = await db.post.findMany({
      include: {
        user: {
          select: {
            id: true,
            name: true,
            image: true,
          },
        },
        techTags: true,
        likes: {
          select: {
            userId: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });
  } catch (error) {
    console.error("Failed to fetch posts:", error);
  }

  // ログインユーザーの投稿をフィルタリング
  const currentUserId = session?.user?.id;
  const userPosts = currentUserId
    ? allPosts.filter((post) => post.userId === currentUserId)
    : [];

  // Vercel KV からリアルタイムランキングデータを取得
  let weeklyTrendRanking: any[] = [];
  let cumulativeRanking: any[] = [];
  try {
    weeklyTrendRanking = await getWeeklyTrendRanking(5);
    cumulativeRanking = await getCumulativeRanking(5);
  } catch (error) {
    console.error("Failed to fetch rankings:", error);
  }

  return (
    <div className="relative flex min-h-screen flex-col items-center justify-start overflow-x-hidden bg-radial from-slate-900 via-zinc-950 to-black text-zinc-100 antialiased selection:bg-indigo-500 selection:text-white pb-16">
      {/* 背景装飾 */}
      <div className="absolute top-1/4 left-1/4 -z-10 h-[600px] w-[600px] rounded-full bg-indigo-500/5 blur-[150px]" />
      <div className="absolute bottom-1/4 right-1/4 -z-10 h-[600px] w-[600px] rounded-full bg-emerald-500/5 blur-[150px]" />

      {/* ヘッダー */}
      <header className="sticky top-0 z-40 w-full max-w-6xl px-6 py-4 flex items-center justify-between border-b border-white/5 bg-zinc-950/75 backdrop-blur-md">
        <Link href="/" className="flex items-center gap-2">
          <Laptop className="h-5 w-5 text-indigo-400" />
          <span className="font-extrabold text-lg bg-gradient-to-r from-indigo-200 via-indigo-400 to-emerald-400 bg-clip-text text-transparent">
            Engineer Platform
          </span>
        </Link>

        {session && (
          <div className="flex items-center gap-4">
            <Link href="/posts/new">
              <Button size="sm" className="rounded-xl bg-gradient-to-r from-indigo-500 to-emerald-500 hover:from-indigo-600 hover:to-emerald-600 text-white font-bold transition-all shadow-md">
                <Plus className="h-4 w-4 mr-1" />
                投稿する
              </Button>
            </Link>
          </div>
        )}
      </header>

      {/* ヒーローセクション */}
      <main className="z-10 flex w-full max-w-6xl flex-col px-6 mt-12 gap-10">
        <div className="text-center max-w-2xl mx-auto">
          <h2 className="bg-gradient-to-r from-indigo-200 via-indigo-400 to-emerald-400 bg-clip-text text-4xl font-extrabold tracking-tight text-transparent sm:text-5xl">
            ポートフォリオをアウトプットで語ろう
          </h2>
          <p className="mt-4 text-sm text-zinc-400 leading-relaxed max-w-lg mx-auto">
            作成したWebアプリやツールを公開し、他のエンジニアから評価を受け取ったり、採用担当者・クライアントと繋がるマッチングプラットフォーム。
          </p>
        </div>

        {/* グリッドレイアウト */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 w-full items-start">
          {/* 左カラム：フィード */}
          <div className="lg:col-span-2 flex flex-col gap-6">
            <FeedTabs
              allPosts={allPosts}
              userPosts={userPosts}
              currentUserId={session?.user?.id}
            />
          </div>

          {/* 右カラム：サイドバー */}
          <div className="flex flex-col gap-6">
            
            {/* 認証状態に応じたビュー（ログイン / プロフィール） */}
            {!session ? (
              /* 未ログイン UI */
              <div className="w-full rounded-3xl border border-white/10 bg-white/5 p-6 shadow-2xl backdrop-blur-xl">
                <div className="mb-5 text-center">
                  <h3 className="text-sm font-bold tracking-tight text-zinc-100 flex items-center justify-center gap-1.5">
                    <LogIn className="h-4 w-4 text-indigo-400" />
                    プラットフォームに参加する
                  </h3>
                  <p className="mt-1 text-[11px] text-zinc-500 leading-normal">
                    サインインして、自分の開発プロダクトを投稿・公開しましょう
                  </p>
                </div>

                <div className="flex flex-col gap-2.5">
                  {/* テストログイン */}
                  <form action={async () => {
                    "use server";
                    await handleSignIn("credentials");
                  }}>
                    <Button 
                      type="submit" 
                      className="w-full justify-center rounded-xl bg-gradient-to-r from-indigo-500 to-emerald-500 hover:from-indigo-600 hover:to-emerald-600 text-white font-bold h-10 text-xs transition-all shadow-md"
                    >
                      テストユーザーとしてサインイン
                    </Button>
                  </form>

                  <div className="relative my-1 flex items-center justify-center">
                    <span className="absolute w-full border-t border-white/5" />
                    <span className="relative bg-[#0d0e12] px-2 text-[9px] uppercase tracking-wider text-zinc-500 font-semibold z-10">
                      またはソーシャルログイン
                    </span>
                  </div>

                  {/* GitHub */}
                  <form action={async () => {
                    "use server";
                    await handleSignIn("github");
                  }}>
                    <Button 
                      type="submit" 
                      className="w-full justify-center rounded-xl bg-zinc-900 text-zinc-100 border border-zinc-800 hover:bg-zinc-800 hover:text-white transition-all text-xs h-10"
                    >
                      <GithubIcon />
                      GitHub でサインイン
                    </Button>
                  </form>

                  {/* Google */}
                  <form action={async () => {
                    "use server";
                    await handleSignIn("google");
                  }}>
                    <Button 
                      type="submit" 
                      className="w-full justify-center rounded-xl bg-white text-zinc-900 hover:bg-zinc-100 border border-zinc-200 transition-all text-xs h-10"
                    >
                      <GoogleIcon />
                      Google でサインイン
                    </Button>
                  </form>

                  {/* Apple */}
                  <form action={async () => {
                    "use server";
                    await handleSignIn("apple");
                  }}>
                    <Button 
                      type="submit" 
                      className="w-full justify-center rounded-xl bg-zinc-900 text-zinc-100 border border-zinc-800 hover:bg-zinc-800 hover:text-white transition-all text-xs h-10"
                    >
                      <AppleIcon />
                      Apple でサインイン
                    </Button>
                  </form>
                </div>
              </div>
            ) : (
              /* ログイン済 UI (ダッシュボード) */
              <div className="w-full rounded-3xl border border-white/10 bg-white/5 p-6 shadow-2xl backdrop-blur-xl">
                <div className="flex items-center gap-3 border-b border-white/10 pb-4">
                  {session.user?.image ? (
                    <Image
                      src={session.user.image}
                      alt={session.user.name || ""}
                      width={44}
                      height={44}
                      className="h-11 w-11 rounded-full border-2 border-indigo-500 shadow-md object-cover"
                    />
                  ) : (
                    <div className="flex h-11 w-11 items-center justify-center rounded-full border-2 border-indigo-500 bg-indigo-950 font-bold text-indigo-400 text-base shadow-md">
                      {session.user?.name ? session.user.name.charAt(0).toUpperCase() : "U"}
                    </div>
                  )}
                  <div className="overflow-hidden min-w-0 flex-1">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <h3 className="text-sm font-bold text-zinc-100 truncate">
                        {session.user?.name}
                      </h3>
                      {/* @ts-ignore */}
                      {session.user?.provider && (
                        <span className="inline-flex items-center rounded-full bg-indigo-500/10 px-1.5 py-0.2 text-[9px] font-medium text-indigo-400 ring-1 ring-inset ring-indigo-500/20">
                          {/* @ts-ignore */}
                          {session.user.provider}
                        </span>
                      )}
                    </div>
                    <p className="text-[10px] text-zinc-500 truncate mt-0.5">{session.user?.email}</p>
                  </div>
                </div>

                {/* ボタン */}
                <div className="mt-4 flex flex-col gap-2">
                  <Link href="/posts/new" className="w-full">
                    <Button className="w-full justify-center rounded-xl bg-gradient-to-r from-indigo-500 to-emerald-500 hover:from-indigo-600 hover:to-emerald-600 text-white font-bold h-10 text-xs transition-all shadow-md">
                      <Plus className="h-4 w-4 mr-1" />
                      新しいプロダクトを投稿する
                    </Button>
                  </Link>
                </div>

                {/* DB接続検証用 */}
                <div className="mt-4 rounded-xl bg-zinc-950/50 p-3 border border-white/5">
                  <div className="flex items-center justify-between">
                    <span className="text-[9px] font-semibold text-zinc-500 uppercase tracking-wider">
                      Prisma 同期検証
                    </span>
                    {dbUser ? (
                      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-1.5 py-0.2 text-[9px] font-medium text-emerald-400 ring-1 ring-inset ring-emerald-500/20">
                        <span className="h-1 w-1 rounded-full bg-emerald-500 animate-pulse" />
                        CONNECTED
                      </span>
                    ) : dbError ? (
                      <span className="inline-flex items-center gap-1 rounded-full bg-red-500/10 px-1.5 py-0.2 text-[9px] font-medium text-red-400 ring-1 ring-inset ring-red-500/20">
                        <span className="h-1 w-1 rounded-full bg-red-500" />
                        ERROR
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/10 px-1.5 py-0.2 text-[9px] font-medium text-amber-400 ring-1 ring-inset ring-amber-500/20">
                        <span className="h-1 w-1 rounded-full bg-amber-500" />
                        PENDING
                      </span>
                    )}
                  </div>

                  {dbUser && (
                    <div className="mt-2 text-[9px] border-t border-white/5 pt-2 text-zinc-400 flex justify-between">
                      <span>ID (UUID)</span>
                      <span className="font-mono text-zinc-300 truncate max-w-[150px] select-all">{dbUser.id}</span>
                    </div>
                  )}

                  {dbError && (
                    <div className="mt-2 text-[9px] text-red-400 font-mono break-all p-2 rounded bg-red-950/20 border border-red-900/30">
                      エラー: {dbError}
                    </div>
                  )}
                </div>

                {/* サインアウト */}
                <div className="mt-4 pt-3 border-t border-white/5 flex justify-center">
                  <form action={async () => {
                    "use server";
                    await handleSignOut();
                  }} className="w-full">
                    <button 
                      type="submit" 
                      className="w-full flex items-center justify-center gap-1.5 text-[11px] text-zinc-500 hover:text-zinc-300 transition-colors"
                    >
                      <LogOut className="h-3.5 w-3.5" />
                      サインアウトする
                    </button>
                  </form>
                </div>
              </div>
            )}

            {/* ランキングコンポーネント */}
            <RankingSidebar
              weeklyTrend={weeklyTrendRanking}
              allTime={cumulativeRanking}
            />

          </div>
        </div>
      </main>
    </div>
  );
}
