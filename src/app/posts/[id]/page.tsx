import { auth } from "@/auth";
import { db } from "@/lib/db";
import { notFound } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import LikeButton from "@/components/like-button";
import ContactModal from "@/components/contact-modal";
import { ExternalLink, Calendar, ArrowLeft, Cpu, User } from "lucide-react";

const GithubIcon = () => (
  <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
    <path fillRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" clipRule="evenodd" />
  </svg>
);

interface PageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function PostDetailPage({ params }: PageProps) {
  const { id } = await params;

  // 投稿の詳細を、作成者ユーザー情報、技術タグ、いいね情報を含めて取得
  const post = await db.post.findUnique({
    where: { id },
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
  });

  if (!post) {
    notFound();
  }

  const session = await auth();
  const currentUserId = session?.user?.id;
  
  // 現在のユーザーがいいね済みか確認
  const isLiked = currentUserId 
    ? post.likes.some((like) => like.userId === currentUserId) 
    : false;
  
  const likeCount = post.likes.length;

  return (
    <div className="relative flex min-h-screen flex-col items-center justify-start overflow-x-hidden bg-radial from-slate-900 via-zinc-950 to-black px-4 py-12 text-zinc-100 antialiased selection:bg-indigo-500 selection:text-white">
      {/* 背景装飾 */}
      <div className="absolute top-1/4 left-1/4 -z-10 h-[500px] w-[500px] rounded-full bg-indigo-500/5 blur-[120px]" />
      <div className="absolute bottom-1/4 right-1/4 -z-10 h-[500px] w-[500px] rounded-full bg-emerald-500/5 blur-[120px]" />

      <div className="z-10 flex w-full max-w-3xl flex-col gap-6">
        {/* ナビゲーション・戻る */}
        <div className="flex justify-between items-center px-1">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-xs text-zinc-400 hover:text-white transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            ダッシュボードへ戻る
          </Link>
        </div>

        {/* メインコンテンツカード */}
        <div className="w-full rounded-3xl border border-white/10 bg-white/5 p-8 shadow-2xl backdrop-blur-xl">
          {/* ヘッダーエリア */}
          <div className="flex flex-col md:flex-row md:items-start justify-between gap-6 border-b border-white/10 pb-8">
            <div className="flex-1 min-w-0">
              <h1 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-indigo-200 via-indigo-400 to-emerald-400 bg-clip-text text-transparent truncate pb-1">
                {post.title}
              </h1>
              
              {/* 作成者情報 & 投稿日 */}
              <div className="flex items-center gap-3 mt-4 text-xs text-zinc-400">
                {post.user.image ? (
                  <Image
                    src={post.user.image}
                    alt={post.user.name || "Creator Avatar"}
                    width={32}
                    height={32}
                    className="h-8 w-8 rounded-full border border-indigo-500/40 object-cover"
                  />
                ) : (
                  <div className="flex h-8 w-8 items-center justify-center rounded-full border border-indigo-500/40 bg-indigo-950 font-bold text-indigo-400 text-sm">
                    {post.user.name ? post.user.name.charAt(0).toUpperCase() : "U"}
                  </div>
                )}
                <div>
                  <p className="font-semibold text-zinc-200 inline-flex items-center gap-1">
                    <User className="h-3.5 w-3.5 text-zinc-400" />
                    {post.user.name || "No name"}
                  </p>
                  <p className="text-[10px] text-zinc-500 mt-0.5 inline-flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    {new Date(post.createdAt).toLocaleDateString("ja-JP", {
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    })} 投稿
                  </p>
                </div>
              </div>
            </div>

            {/* アクションボタン（いいね ＆ コンタクト） */}
            <div className="flex items-center gap-3 flex-wrap">
              <LikeButton
                postId={post.id}
                initialLiked={isLiked}
                initialLikeCount={likeCount}
                hasUser={!!currentUserId}
              />
              <ContactModal postTitle={post.title} creatorName={post.user.name || "作者"} />
            </div>
          </div>

          {/* リンク導線セクション */}
          <div className="flex flex-wrap gap-3 py-6 border-b border-white/10">
            <a href={post.url} target="_blank" rel="noopener noreferrer" className="flex-1 sm:flex-initial">
              <Button className="w-full justify-center rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold h-11 px-5 transition-all flex items-center gap-2">
                <ExternalLink className="h-4 w-4" />
                プロダクトを見る
              </Button>
            </a>
            {post.githubUrl && (
              <a href={post.githubUrl} target="_blank" rel="noopener noreferrer" className="flex-1 sm:flex-initial">
                <Button variant="outline" className="w-full justify-center rounded-xl bg-zinc-950/40 border-white/10 hover:border-white/20 hover:bg-white/5 text-zinc-300 hover:text-white font-bold h-11 px-5 transition-all flex items-center gap-2">
                  <GithubIcon />
                  GitHub リポジトリ
                </Button>
              </a>
            )}
          </div>

          {/* 説明文 */}
          <div className="py-6">
            <h3 className="text-sm font-bold text-zinc-400 uppercase tracking-wider mb-3">プロダクト概要</h3>
            <p className="text-zinc-300 leading-relaxed text-sm whitespace-pre-wrap">
              {post.description}
            </p>
          </div>

          {/* 技術タグ */}
          <div className="py-6 border-t border-white/10">
            <h3 className="text-sm font-bold text-zinc-400 uppercase tracking-wider mb-3">使用技術</h3>
            <div className="flex flex-wrap gap-1.5">
              {post.techTags.map((tag) => (
                <Badge
                  key={tag.id}
                  variant="secondary"
                  className="bg-zinc-900 border border-zinc-800 hover:border-indigo-500/30 text-zinc-300 rounded-lg py-1 px-3 text-xs transition-all"
                >
                  {tag.name}
                </Badge>
              ))}
            </div>
          </div>

          {/* AI活用セクション (usesAIがONの時のみ表示) */}
          {post.usesAI && (
            <div className="mt-6 rounded-2xl bg-emerald-500/5 border border-emerald-500/20 p-5">
              <div className="flex items-center gap-2 text-emerald-400 font-bold text-sm mb-4">
                <Cpu className="h-5 w-5 animate-pulse" />
                AI 活用プロダクト
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {post.aiModels.length > 0 && (
                  <div className="rounded-xl bg-zinc-950/40 p-4 border border-white/5">
                    <span className="text-[10px] font-semibold text-zinc-500 uppercase tracking-wider block mb-1">使用した LLM</span>
                    <div className="flex flex-wrap gap-1 mt-1.5">
                      {post.aiModels.map((model) => (
                        <Badge key={model} variant="outline" className="border-emerald-500/20 bg-emerald-500/5 text-emerald-400 text-xs">
                          {model}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
                {post.aiTools.length > 0 && (
                  <div className="rounded-xl bg-zinc-950/40 p-4 border border-white/5">
                    <span className="text-[10px] font-semibold text-zinc-500 uppercase tracking-wider block mb-1">使用した AI ツール</span>
                    <div className="flex flex-wrap gap-1 mt-1.5">
                      {post.aiTools.map((tool) => (
                        <Badge key={tool} variant="outline" className="border-emerald-500/20 bg-emerald-500/5 text-emerald-400 text-xs">
                          {tool}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
