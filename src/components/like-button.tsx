"use client";

import { useState, useTransition } from "react";
import { Heart } from "lucide-react";
import { toggleLike } from "@/actions/post";
import { Button } from "@/components/ui/button";

interface LikeButtonProps {
  postId: string;
  initialLiked: boolean;
  initialLikeCount: number;
  hasUser: boolean;
}

export default function LikeButton({
  postId,
  initialLiked,
  initialLikeCount,
  hasUser,
}: LikeButtonProps) {
  const [liked, setLiked] = useState(initialLiked);
  const [likeCount, setLikeCount] = useState(initialLikeCount);
  const [isPending, startTransition] = useTransition();

  const handleLike = async () => {
    if (!hasUser) {
      alert("サインインが必要です。");
      return;
    }

    // オプティミスティック更新（UIを先に更新してサクサク感を出す）
    const prevLiked = liked;
    const prevLikeCount = likeCount;

    setLiked(!prevLiked);
    setLikeCount(prevLiked ? prevLikeCount - 1 : prevLikeCount + 1);

    startTransition(async () => {
      const result = await toggleLike(postId);
      if (!result.success) {
        // エラーの場合は元の状態に戻す
        setLiked(prevLiked);
        setLikeCount(prevLikeCount);
        alert(result.message || "いいね処理に失敗しました。");
      } else {
        if (result.likeCount !== undefined && result.liked !== undefined) {
          setLiked(result.liked);
          setLikeCount(result.likeCount);
        }
      }
    });
  };

  return (
    <Button
      type="button"
      variant="outline"
      onClick={handleLike}
      disabled={isPending}
      className={`group flex items-center gap-2 rounded-xl border px-4 py-2 text-xs font-semibold transition-all duration-300 ${
        liked
          ? "bg-rose-500/10 border-rose-500/30 text-rose-500 hover:bg-rose-500/20"
          : "bg-zinc-950/20 border-white/10 text-zinc-400 hover:border-white/20 hover:text-zinc-200"
      } active:scale-95`}
    >
      <Heart
        className={`h-4 w-4 transition-transform duration-300 group-hover:scale-110 ${
          liked ? "fill-rose-500 text-rose-500" : "text-zinc-400 group-hover:text-zinc-200"
        }`}
      />
      <span>{likeCount}</span>
    </Button>
  );
}
