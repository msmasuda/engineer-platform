"use client";

import { useTransition } from "react";
import { Trash2 } from "lucide-react";
import { deletePost } from "@/actions/post";
import { Button } from "@/components/ui/button";

interface DeletePostButtonProps {
  postId: string;
}

export default function DeletePostButton({ postId }: DeletePostButtonProps) {
  const [isPending, startTransition] = useTransition();

  const handleDelete = () => {
    if (confirm("本当にこの投稿を削除しますか？\n（この操作は取り消せません）")) {
      startTransition(async () => {
        const response = await deletePost(postId);
        if (response && !response.success) {
          alert(response.message || "削除中にエラーが発生しました。");
        }
      });
    }
  };

  return (
    <Button
      variant="outline"
      onClick={handleDelete}
      disabled={isPending}
      className="rounded-xl border-rose-500/30 bg-rose-500/5 hover:bg-rose-500/10 text-rose-400 hover:text-rose-300 font-bold h-11 px-4 transition-all flex items-center gap-2"
    >
      <Trash2 className="h-4 w-4" />
      {isPending ? "削除中..." : "削除する"}
    </Button>
  );
}
