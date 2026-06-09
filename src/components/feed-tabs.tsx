"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { Badge } from "@/components/ui/badge";
import { Heart, ExternalLink, Cpu, LayoutGrid, FolderHeart, Calendar } from "lucide-react";

interface Post {
  id: string;
  title: string;
  url: string;
  description: string;
  githubUrl: string | null;
  createdAt: Date;
  usesAI: boolean;
  aiModels: string[];
  aiTools: string[];
  user: {
    id: string;
    name: string | null;
    image: string | null;
  };
  techTags: {
    id: string;
    name: string;
  }[];
  likes: {
    userId: string;
  }[];
}

interface FeedTabsProps {
  allPosts: Post[];
  userPosts: Post[];
  currentUserId?: string;
}

export default function FeedTabs({ allPosts, userPosts, currentUserId }: FeedTabsProps) {
  const [activeTab, setActiveTab] = useState<"all" | "mine">("all");

  const currentPosts = activeTab === "all" ? allPosts : userPosts;

  return (
    <div className="flex flex-col gap-5 w-full">
      {/* フィードタブ切り替え (ログイン済みの場合のみ表示) */}
      {currentUserId && (
        <div className="flex gap-2 border-b border-white/10 pb-2">
          <button
            onClick={() => setActiveTab("all")}
            className={`flex items-center gap-1.5 pb-2 text-sm font-semibold transition-all border-b-2 px-1 ${
              activeTab === "all"
                ? "border-indigo-500 text-indigo-400 font-bold"
                : "border-transparent text-zinc-400 hover:text-zinc-200"
            }`}
          >
            <LayoutGrid className="h-4 w-4" />
            すべてのプロダクト
          </button>
          <button
            onClick={() => setActiveTab("mine")}
            className={`flex items-center gap-1.5 pb-2 text-sm font-semibold transition-all border-b-2 px-1 ${
              activeTab === "mine"
                ? "border-indigo-500 text-indigo-400 font-bold"
                : "border-transparent text-zinc-400 hover:text-zinc-200"
            }`}
          >
            <FolderHeart className="h-4 w-4" />
            あなたの投稿 ({userPosts.length})
          </button>
        </div>
      )}

      {/* 投稿フィードリスト */}
      {currentPosts.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-white/10 p-16 text-center flex flex-col items-center justify-center gap-3 bg-white/5 backdrop-blur-xl">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-zinc-950/50 border border-white/5 text-zinc-500">
            <LayoutGrid className="h-6 w-6" />
          </div>
          <div>
            <p className="text-sm font-semibold text-zinc-400">プロダクトがありません</p>
            <p className="text-xs text-zinc-500 mt-1">
              {activeTab === "mine"
                ? "「新しいプロダクトを投稿する」からあなたの成果物を追加してください。"
                : "最初のプロダクトを投稿しましょう！"}
            </p>
          </div>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {currentPosts.map((post) => (
            <Link key={post.id} href={`/posts/${post.id}`} className="group block">
              <div className="rounded-2xl border border-white/10 bg-white/5 p-6 hover:border-indigo-500/40 hover:bg-white/10 transition-all duration-300 shadow-xl backdrop-blur-xl">
                {/* ヘッダー: タイトル & AIタグ */}
                <div className="flex justify-between items-start gap-3 flex-wrap">
                  <div className="min-w-0">
                    <h4 className="text-lg font-bold text-zinc-100 group-hover:text-indigo-400 transition-colors truncate">
                      {post.title}
                    </h4>
                    
                    {/* 作成者 ＆ 日付 */}
                    <div className="flex items-center gap-2 mt-1.5 text-xs text-zinc-400">
                      {post.user.image ? (
                        <Image
                          src={post.user.image}
                          alt={post.user.name || ""}
                          width={16}
                          height={16}
                          className="h-4 w-4 rounded-full object-cover"
                        />
                      ) : (
                        <div className="w-4 h-4 rounded-full bg-zinc-800 text-[9px] flex items-center justify-center font-bold text-zinc-400">
                          {post.user.name ? post.user.name.charAt(0).toUpperCase() : "U"}
                        </div>
                      )}
                      <span>{post.user.name}</span>
                      <span className="text-zinc-600">•</span>
                      <span className="text-[10px] text-zinc-500">
                        {new Date(post.createdAt).toLocaleDateString("ja-JP", {
                          month: "short",
                          day: "numeric",
                        })}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {post.usesAI && (
                      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] font-medium text-emerald-400 ring-1 ring-inset ring-emerald-500/20">
                        <Cpu className="h-3 w-3" />
                        AI 活用
                      </span>
                    )}
                    <span className="inline-flex items-center gap-1 text-xs text-zinc-400 bg-zinc-950/40 border border-white/5 px-2 py-0.5 rounded-lg">
                      <Heart className="h-3.5 w-3.5 text-rose-500 fill-rose-500/10" />
                      {post.likes.length}
                    </span>
                  </div>
                </div>

                {/* 説明 */}
                <p className="text-xs text-zinc-400 mt-4 line-clamp-2 leading-relaxed">
                  {post.description}
                </p>

                {/* フッター: 技術タグ & 外部リンク */}
                <div className="flex justify-between items-center gap-4 mt-5 pt-4 border-t border-white/5">
                  {/* 技術タグ */}
                  <div className="flex flex-wrap gap-1 min-w-0">
                    {post.techTags.slice(0, 4).map((tag) => (
                      <Badge
                        key={tag.id}
                        variant="secondary"
                        className="bg-zinc-900 border-zinc-800 text-[10px] text-zinc-300 rounded-md py-0.5 px-2"
                      >
                        {tag.name}
                      </Badge>
                    ))}
                    {post.techTags.length > 4 && (
                      <span className="text-[10px] text-zinc-500 font-bold self-center px-1">
                        +{post.techTags.length - 4}
                      </span>
                    )}
                  </div>

                  {/* リンクプレビュー */}
                  <span className="text-[10px] text-indigo-400 font-bold inline-flex items-center gap-1 shrink-0 group-hover:underline">
                    詳細を見る
                    <ExternalLink className="h-3 w-3" />
                  </span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
