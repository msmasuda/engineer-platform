import { auth } from "@/auth";
import { db } from "@/lib/db";
import { redirect, notFound } from "next/navigation";
import PostForm from "@/components/post-form";
import Link from "next/link";

interface PageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function EditPostPage({ params }: PageProps) {
  const { id } = await params;
  const session = await auth();

  // 未ログインの場合はトップページ（ログイン画面）へリダイレクト
  if (!session?.user) {
    redirect("/");
  }

  // 投稿の詳細を取得
  const post = await db.post.findUnique({
    where: { id },
    include: {
      techTags: {
        select: {
          name: true,
        },
      },
    },
  });

  if (!post) {
    notFound();
  }

  // 投稿主でなければトップページへリダイレクト
  if (post.userId !== session.user.id) {
    redirect("/");
  }

  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-radial from-slate-900 via-zinc-950 to-black px-4 py-12 text-zinc-100 antialiased selection:bg-indigo-500 selection:text-white">
      {/* 背景装飾 */}
      <div className="absolute top-1/4 left-1/3 -z-10 h-[500px] w-[500px] rounded-full bg-indigo-500/5 blur-[120px]" />
      <div className="absolute bottom-1/4 right-1/3 -z-10 h-[500px] w-[500px] rounded-full bg-emerald-500/5 blur-[120px]" />

      <div className="z-10 flex w-full max-w-xl flex-col gap-6">
        {/* パンくず / 戻る */}
        <div className="flex justify-between items-center px-1">
          <Link
            href={`/posts/${post.id}`}
            className="inline-flex items-center gap-1.5 text-xs text-zinc-400 hover:text-white transition-colors"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            プロダクト詳細へ戻る
          </Link>
        </div>

        {/* フォームカード */}
        <div className="w-full rounded-3xl border border-white/10 bg-white/5 p-8 shadow-2xl backdrop-blur-xl">
          <div className="mb-6">
            <h1 className="text-2xl font-extrabold bg-gradient-to-r from-indigo-200 via-indigo-400 to-emerald-400 bg-clip-text text-transparent">
              プロダクト情報を編集
            </h1>
            <p className="mt-1.5 text-xs text-zinc-400 leading-normal">
              プロダクトの情報を更新します。
            </p>
          </div>

          <PostForm initialData={post} />
        </div>
      </div>
    </div>
  );
}
