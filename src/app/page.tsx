import { auth } from "@/auth";
import { db } from "@/lib/db";
import { handleSignIn, handleSignOut } from "@/actions/auth";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import Image from "next/image";
import Link from "next/link";

// ソーシャルアイコンの定義
const GithubIcon = () => (
  <svg className="mr-2 h-5 w-5" aria-hidden="true" fill="currentColor" viewBox="0 0 24 24">
    <path fillRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" clipRule="evenodd" />
  </svg>
);

const GoogleIcon = () => (
  <svg className="mr-2 h-5 w-5" aria-hidden="true" fill="currentColor" viewBox="0 0 24 24">
    <path d="M12.24 10.285V14.4h6.887c-.648 2.41-2.519 4.114-5.136 4.114-3.354 0-6.082-2.73-6.082-6.086 0-3.355 2.728-6.086 6.082-6.086 1.458 0 2.793.518 3.84 1.377l3.057-3.06c-1.92-1.745-4.455-2.82-7.25-2.82-5.918 0-10.718 4.8-10.718 10.718 0 5.919 4.8 10.718 10.718 10.718 5.719 0 10.432-4.148 10.432-10.285 0-.585-.05-1.155-.152-1.71H12.24z" />
  </svg>
);

const AppleIcon = () => (
  <svg className="mr-2 h-5 w-5" aria-hidden="true" fill="currentColor" viewBox="0 0 24 24">
    <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M15.97 4.17c.66-.81 1.11-1.93.99-3.06-1 .04-2.21.67-2.93 1.49-.62.69-1.16 1.84-1.01 2.96 1.11.09 2.26-.56 2.95-1.39" />
  </svg>
);

export default async function Home() {
  const session = await auth();

  // ログイン済みの場合はDBからユーザー情報と過去の投稿を取得
  let dbUser = null;
  let userPosts: any[] = [];
  let dbError = null;

  if (session?.user?.id) {
    try {
      dbUser = await db.user.findUnique({
        where: { id: session.user.id },
      });
      
      // ユーザーの投稿したプロダクトを技術タグも含めて取得
      userPosts = await db.post.findMany({
        where: { userId: session.user.id },
        include: {
          techTags: true,
        },
        orderBy: {
          createdAt: "desc",
        },
      });
    } catch (error) {
      console.error("Failed to fetch dashboard data:", error);
      dbError = error instanceof Error ? error.message : String(error);
    }
  }

  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center overflow-x-hidden bg-radial from-slate-900 via-zinc-950 to-black px-4 py-12 text-zinc-100 antialiased selection:bg-indigo-500 selection:text-white">
      {/* 装飾用背景グラデーション */}
      <div className="absolute top-1/4 left-1/4 -z-10 h-96 w-96 rounded-full bg-indigo-500/10 blur-3xl" />
      <div className="absolute bottom-1/4 right-1/4 -z-10 h-96 w-96 rounded-full bg-emerald-500/10 blur-3xl" />

      <main className="z-10 flex w-full max-w-xl flex-col items-center gap-8">
        {/* ロゴ / タイトル */}
        <div className="text-center">
          <h1 className="bg-gradient-to-r from-indigo-200 via-indigo-400 to-emerald-400 bg-clip-text text-4xl font-extrabold tracking-tight text-transparent sm:text-5xl">
            Engineer Platform
          </h1>
          <p className="mt-3 text-sm text-zinc-400 sm:text-base">
            アウトプット起点型 ポートフォリオ・マッチング
          </p>
        </div>

        {/* 認証状態に応じたビューの切り替え */}
        {!session ? (
          /* ================= 未ログイン UI ================= */
          <div className="w-full rounded-3xl border border-white/10 bg-white/5 p-8 shadow-2xl backdrop-blur-xl">
            <div className="mb-6 text-center">
              <h2 className="text-xl font-bold tracking-tight text-zinc-100">
                アカウントを作成・サインイン
              </h2>
              <p className="mt-1 text-xs text-zinc-400">
                ソーシャルログインでスムーズに始められます
              </p>
            </div>

            <div className="flex flex-col gap-3">
              {/* テストログイン (E2E/ローカル検証用) */}
              <form action={async () => {
                "use server";
                await handleSignIn("credentials");
              }}>
                <Button 
                  type="submit" 
                  className="w-full justify-center rounded-xl bg-gradient-to-r from-indigo-500 to-emerald-500 hover:from-indigo-600 hover:to-emerald-600 text-white font-bold h-11 transition-all shadow-lg shadow-indigo-500/10 hover:shadow-indigo-500/20"
                >
                  テストユーザーとしてサインイン
                </Button>
              </form>

              <div className="relative my-2 flex items-center justify-center">
                <span className="absolute w-full border-t border-white/5" />
                <span className="relative bg-[#0d0e12] px-3 text-[10px] uppercase tracking-wider text-zinc-500 font-semibold z-10">
                  またはソーシャルログイン
                </span>
              </div>

              {/* GitHub ログイン */}
              <form action={async () => {
                "use server";
                await handleSignIn("github");
              }}>
                <Button 
                  type="submit" 
                  className="w-full justify-center rounded-xl bg-zinc-900 text-zinc-100 border border-zinc-800 hover:bg-zinc-800 hover:text-white transition-all duration-200 h-11"
                >
                  <GithubIcon />
                  GitHub でサインイン
                </Button>
              </form>

              {/* Google ログイン */}
              <form action={async () => {
                "use server";
                await handleSignIn("google");
              }}>
                <Button 
                  type="submit" 
                  className="w-full justify-center rounded-xl bg-white text-zinc-900 hover:bg-zinc-100 border border-zinc-200 transition-all duration-200 h-11"
                >
                  <GoogleIcon />
                  Google でサインイン
                </Button>
              </form>

              {/* Apple ログイン */}
              <form action={async () => {
                "use server";
                await handleSignIn("apple");
              }}>
                <Button 
                  type="submit" 
                  className="w-full justify-center rounded-xl bg-zinc-900 text-zinc-100 border border-zinc-800 hover:bg-zinc-800 hover:text-white transition-all duration-200 h-11"
                >
                  <AppleIcon />
                  Apple でサインイン
                </Button>
              </form>
            </div>
            
            <div className="mt-6 border-t border-white/5 pt-4 text-center">
              <p className="text-[10px] leading-relaxed text-zinc-500">
                サインインすることで、利用規約およびプライバシーポリシーに同意したものとみなされます。
              </p>
            </div>
          </div>
        ) : (
          /* ================= ログイン済 UI ================= */
          <div className="w-full flex flex-col gap-6">
            {/* プロフィール & アクション */}
            <div className="rounded-3xl border border-white/10 bg-white/5 p-8 shadow-2xl backdrop-blur-xl">
              <div className="flex items-center gap-4 border-b border-white/10 pb-6">
                {session.user?.image ? (
                  <Image
                    src={session.user.image}
                    alt={session.user.name || "User Avatar"}
                    width={64}
                    height={64}
                    className="h-16 w-16 rounded-full border-2 border-indigo-500 shadow-md object-cover"
                  />
                ) : (
                  <div className="flex h-16 w-16 items-center justify-center rounded-full border-2 border-indigo-500 bg-indigo-950 font-bold text-indigo-400 text-xl shadow-md">
                    {session.user?.name ? session.user.name.charAt(0).toUpperCase() : "U"}
                  </div>
                )}
                <div className="overflow-hidden flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h2 className="text-xl font-bold tracking-tight text-zinc-100 truncate">
                      {session.user?.name || "No name"}
                    </h2>
                    {/* ログイン元プロバイダバッジ */}
                    {/* @ts-ignore */}
                    {session.user?.provider && (
                      <span className="inline-flex items-center rounded-full bg-indigo-500/10 px-2.5 py-0.5 text-xs font-medium text-indigo-400 ring-1 ring-inset ring-indigo-500/20">
                        {/* @ts-ignore */}
                        {session.user.provider}
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-zinc-400 truncate mt-0.5">{session.user?.email}</p>
                </div>
              </div>

              {/* 主要ナビゲーション */}
              <div className="mt-6 flex flex-col gap-3">
                <Link href="/posts/new" className="w-full">
                  <Button className="w-full justify-center rounded-xl bg-gradient-to-r from-indigo-500 to-emerald-500 hover:from-indigo-600 hover:to-emerald-600 text-white font-bold h-12 transition-all shadow-lg shadow-indigo-500/10 hover:shadow-indigo-500/20">
                    <svg className="mr-2 h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.6} d="M12 4v16m8-8H4" />
                    </svg>
                    新しいプロダクトを投稿する
                  </Button>
                </Link>
              </div>

              {/* DB同期の確認セクション */}
              <div className="mt-5 rounded-2xl bg-zinc-950/50 p-4 border border-white/5">
                <div className="flex items-center justify-between">
                  <h3 className="text-[10px] font-semibold tracking-wider text-zinc-500 uppercase">
                    Prisma データベース同期検証
                  </h3>
                  {dbUser ? (
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/10 px-2 py-0.5 text-xs font-medium text-emerald-400 ring-1 ring-inset ring-emerald-500/20">
                      <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                      CONNECTED
                    </span>
                  ) : dbError ? (
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-red-500/10 px-2 py-0.5 text-xs font-medium text-red-400 ring-1 ring-inset ring-red-500/20">
                      <span className="h-1.5 w-1.5 rounded-full bg-red-500" />
                      DB ERROR
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-500/10 px-2 py-0.5 text-xs font-medium text-amber-400 ring-1 ring-inset ring-amber-500/20">
                      <span className="h-1.5 w-1.5 rounded-full bg-amber-500 animate-pulse" />
                      NOT SAVED YET
                    </span>
                  )}
                </div>

                {dbUser && (
                  <div className="mt-3 flex flex-col gap-2 text-[11px]">
                    <div className="flex justify-between border-b border-white/5 pb-1.5 text-zinc-400">
                      <span>ユーザーID (UUID)</span>
                      <span className="font-mono text-zinc-300 select-all">{dbUser.id}</span>
                    </div>
                  </div>
                )}

                {dbError && (
                  <div className="mt-3 text-xs text-red-400 font-mono break-all bg-red-950/20 p-2.5 rounded-lg border border-red-900/30">
                    エラー: {dbError}
                  </div>
                )}
              </div>

              {/* サインアウト */}
              <div className="mt-5 pt-4 border-t border-white/5">
                <form action={async () => {
                  "use server";
                  await handleSignOut();
                }}>
                  <button 
                    type="submit" 
                    className="w-full text-center text-xs text-zinc-500 hover:text-zinc-300 transition-colors"
                  >
                    サインアウトする
                  </button>
                </form>
              </div>
            </div>

            {/* あなたの投稿一覧 */}
            <div className="flex flex-col gap-4">
              <h3 className="text-sm font-bold text-zinc-300 px-1">あなたの投稿したプロダクト ({userPosts.length})</h3>
              
              {userPosts.length === 0 ? (
                <div className="rounded-3xl border border-dashed border-white/10 p-12 text-center flex flex-col items-center justify-center gap-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-zinc-950/50 border border-white/5 text-zinc-500">
                    <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-zinc-400">プロダクトが未登録です</p>
                    <p className="text-xs text-zinc-500 mt-1">「新しいプロダクトを投稿する」から追加してください。</p>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col gap-3">
                  {userPosts.map((post) => (
                    <div key={post.id} className="rounded-2xl border border-white/10 bg-white/5 p-6 hover:border-indigo-500/30 transition-all duration-200">
                      <div className="flex justify-between items-start gap-3 flex-wrap">
                        <div>
                          <h4 className="text-base font-bold text-zinc-100">{post.title}</h4>
                          <a 
                            href={post.url} 
                            target="_blank" 
                            rel="noopener noreferrer" 
                            className="text-xs text-indigo-400 hover:underline inline-flex items-center gap-1 mt-1"
                          >
                            {post.url}
                            <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                            </svg>
                          </a>
                        </div>

                        {post.usesAI && (
                          <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/10 px-2.5 py-0.5 text-[10px] font-medium text-emerald-400 ring-1 ring-inset ring-emerald-500/20">
                            AI 活用
                          </span>
                        )}
                      </div>

                      <p className="text-xs text-zinc-400 mt-3 line-clamp-2 leading-relaxed">
                        {post.description}
                      </p>

                      {/* タグとAI詳細 */}
                      <div className="flex flex-col gap-2 mt-4 pt-3 border-t border-white/5">
                        {/* 技術タグ */}
                        {post.techTags.length > 0 && (
                          <div className="flex flex-wrap gap-1">
                            {post.techTags.map((tag: any) => (
                              <Badge key={tag.id} variant="secondary" className="bg-zinc-900 border-zinc-800 text-[10px] text-zinc-300 rounded-md py-0.5 px-2">
                                {tag.name}
                              </Badge>
                            ))}
                          </div>
                        )}

                        {/* AI関連詳細 */}
                        {post.usesAI && (post.aiModels.length > 0 || post.aiTools.length > 0) && (
                          <div className="flex items-center gap-2 flex-wrap text-[10px] text-zinc-500">
                            {post.aiModels.length > 0 && (
                              <div className="flex items-center gap-1">
                                <span className="text-zinc-600">LLM:</span>
                                <span className="text-emerald-500/80 font-medium">{post.aiModels.join(", ")}</span>
                              </div>
                            )}
                            {post.aiTools.length > 0 && (
                              <div className="flex items-center gap-1">
                                <span className="text-zinc-600">Tool:</span>
                                <span className="text-emerald-500/80 font-medium">{post.aiTools.join(", ")}</span>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
