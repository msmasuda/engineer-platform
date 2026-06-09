"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { Heart, Trophy, Award, Flame } from "lucide-react";

interface RankingPost {
  id: string;
  title: string;
  user: {
    name: string | null;
    image: string | null;
  };
  likes: {
    userId: string;
  }[];
}

interface RankingSidebarProps {
  weeklyTrend: RankingPost[];
  allTime: RankingPost[];
}

export default function RankingSidebar({ weeklyTrend, allTime }: RankingSidebarProps) {
  const [activeTab, setActiveTab] = useState<"weekly" | "all_time">("weekly");

  const currentList = activeTab === "weekly" ? weeklyTrend : allTime;

  const getRankBadge = (index: number) => {
    switch (index) {
      case 0:
        return <Trophy className="h-4.5 w-4.5 text-amber-400" />;
      case 1:
        return <Award className="h-4.5 w-4.5 text-zinc-300" />;
      case 2:
        return <Award className="h-4.5 w-4.5 text-amber-600" />;
      default:
        return <span className="text-zinc-500 font-mono font-bold text-xs pl-1">{index + 1}</span>;
    }
  };

  return (
    <div className="w-full rounded-3xl border border-white/10 bg-white/5 p-6 shadow-2xl backdrop-blur-xl">
      {/* タイトル */}
      <div className="flex items-center gap-2 mb-5">
        <Flame className="h-5 w-5 text-indigo-400" />
        <h3 className="text-base font-bold text-zinc-100">プロダクトランキング</h3>
      </div>

      {/* タブ切り替え */}
      <div className="flex gap-1.5 p-1 rounded-xl bg-zinc-950/40 border border-white/5 mb-4">
        <button
          onClick={() => setActiveTab("weekly")}
          className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition-all duration-200 ${
            activeTab === "weekly"
              ? "bg-indigo-500/15 border border-indigo-500/20 text-indigo-400 font-bold"
              : "border border-transparent text-zinc-400 hover:text-zinc-200"
          }`}
        >
          週間トレンド
        </button>
        <button
          onClick={() => setActiveTab("all_time")}
          className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition-all duration-200 ${
            activeTab === "all_time"
              ? "bg-indigo-500/15 border border-indigo-500/20 text-indigo-400 font-bold"
              : "border border-transparent text-zinc-400 hover:text-zinc-200"
          }`}
        >
          累計いいね
        </button>
      </div>

      {/* ランキングリスト */}
      {currentList.length === 0 ? (
        <div className="py-8 text-center text-xs text-zinc-500 leading-normal">
          現在ランキングデータはありません
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {currentList.map((post, idx) => (
            <Link
              key={post.id}
              href={`/posts/${post.id}`}
              className="flex items-center justify-between gap-3 p-3 rounded-xl border border-transparent hover:border-white/5 hover:bg-white/5 transition-all duration-200"
            >
              <div className="flex items-center gap-3 min-w-0">
                {/* 順位表示 */}
                <div className="flex items-center justify-center w-6 h-6 shrink-0">
                  {getRankBadge(idx)}
                </div>

                {/* プロダクトタイトル ＆ 作成者名 */}
                <div className="min-w-0">
                  <h4 className="text-xs font-bold text-zinc-200 truncate group-hover:text-white">
                    {post.title}
                  </h4>
                  <div className="flex items-center gap-1.5 mt-1">
                    {post.user.image ? (
                      <Image
                        src={post.user.image}
                        alt={post.user.name || ""}
                        width={14}
                        height={14}
                        className="h-3.5 w-3.5 rounded-full object-cover"
                      />
                    ) : (
                      <div className="w-3.5 h-3.5 rounded-full bg-zinc-800 text-[8px] flex items-center justify-center font-bold text-zinc-400">
                        {post.user.name ? post.user.name.charAt(0).toUpperCase() : "U"}
                      </div>
                    )}
                    <span className="text-[10px] text-zinc-500 truncate max-w-[120px]">
                      {post.user.name}
                    </span>
                  </div>
                </div>
              </div>

              {/* いいね数 */}
              <div className="flex items-center gap-1 text-[11px] text-zinc-400 shrink-0">
                <Heart className="h-3 w-3 text-rose-500 fill-rose-500/20" />
                <span>{post.likes.length}</span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
