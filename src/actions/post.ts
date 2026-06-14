"use server";

import { auth } from "@/auth";
import { db } from "@/lib/db";
import { postSchema, type PostInput } from "@/lib/schemas/post";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { recordLikeInRedis, recordUnlikeInRedis, removePostFromRedisRanking } from "@/lib/ranking";

export interface CreatePostResponse {
  success: boolean;
  errors?: Record<string, string[]>;
  message?: string;
}

/**
 * 新しいプロダクト投稿を作成します。
 * @param input フォーム入力データ
 */
export async function createPost(input: PostInput): Promise<CreatePostResponse> {
  const session = await auth();
  
  if (!session?.user?.id) {
    return {
      success: false,
      message: "サインインが必要です。",
    };
  }

  // バリデーション実行
  const result = postSchema.safeParse(input);
  if (!result.success) {
    return {
      success: false,
      errors: result.error.flatten().fieldErrors as Record<string, string[]>,
    };
  }

  const { data } = result;

  try {
    // タグの connectOrCreate 用配列を作成
    const tags = data.techTags.map((name) => ({
      where: { name },
      create: { name },
    }));

    await db.post.create({
      data: {
        title: data.title,
        url: data.url,
        description: data.description,
        githubUrl: data.githubUrl || null,
        usesAI: data.usesAI,
        aiModels: data.usesAI ? data.aiModels : [],
        aiTools: data.usesAI ? data.aiTools : [],
        userId: session.user.id,
        techTags: {
          connectOrCreate: tags,
        },
      },
    });
  } catch (error) {
    console.error("Failed to create post:", error);
    return {
      success: false,
      message: "データベース保存時にエラーが発生しました。",
    };
  }

  // キャッシュを更新してトップページへリダイレクト
  revalidatePath("/");
  redirect("/");
}

export interface ToggleLikeResponse {
  success: boolean;
  liked?: boolean;
  likeCount?: number;
  message?: string;
}

/**
 * プロダクトに対するいいねの作成・削除を切り替えます。
 */
export async function toggleLike(postId: string): Promise<ToggleLikeResponse> {
  const session = await auth();
  
  if (!session?.user?.id) {
    return {
      success: false,
      message: "サインインが必要です。",
    };
  }

  const userId = session.user.id;

  try {
    // すでにいいねしているか確認
    const existingLike = await db.like.findUnique({
      where: {
        userId_postId: {
          userId,
          postId,
        },
      },
    });

    let liked = false;

    if (existingLike) {
      // いいね解除
      await db.like.delete({
        where: {
          userId_postId: {
            userId,
            postId,
          },
        },
      });
      // Redisの更新
      await recordUnlikeInRedis(postId);
      liked = false;
    } else {
      // いいね登録
      await db.like.create({
        data: {
          userId,
          postId,
        },
      });
      // Redisの更新
      await recordLikeInRedis(postId);
      liked = true;
    }

    // 最新のいいね数をカウント
    const likeCount = await db.like.count({
      where: { postId },
    });

    // パスの再検証をしてUIを更新
    revalidatePath("/");
    revalidatePath(`/posts/${postId}`);

    return {
      success: true,
      liked,
      likeCount,
    };
  } catch (error) {
    console.error("Failed to toggle like:", error);
    return {
      success: false,
      message: "いいねの処理中にエラーが発生しました。",
    };
  }
}

/**
 * 投稿を更新します。
 */
export async function updatePost(postId: string, input: PostInput): Promise<CreatePostResponse> {
  const session = await auth();
  
  if (!session?.user?.id) {
    return {
      success: false,
      message: "サインインが必要です。",
    };
  }

  // 投稿が存在し、かつ本人のものであるか確認
  const post = await db.post.findUnique({
    where: { id: postId },
  });

  if (!post) {
    return {
      success: false,
      message: "指定された投稿が見つかりません。",
    };
  }

  if (post.userId !== session.user.id) {
    return {
      success: false,
      message: "他人の投稿を変更する権限がありません。",
    };
  }

  // バリデーション実行
  const result = postSchema.safeParse(input);
  if (!result.success) {
    return {
      success: false,
      errors: result.error.flatten().fieldErrors as Record<string, string[]>,
    };
  }

  const { data } = result;

  try {
    const tags = data.techTags.map((name) => ({
      where: { name },
      create: { name },
    }));

    await db.post.update({
      where: { id: postId },
      data: {
        title: data.title,
        url: data.url,
        description: data.description,
        githubUrl: data.githubUrl || null,
        usesAI: data.usesAI,
        aiModels: data.usesAI ? data.aiModels : [],
        aiTools: data.usesAI ? data.aiTools : [],
        techTags: {
          set: [], // 既存のタグの関連付けを全削除
          connectOrCreate: tags,
        },
      },
    });
  } catch (error) {
    console.error("Failed to update post:", error);
    return {
      success: false,
      message: "データベースの更新時にエラーが発生しました。",
    };
  }

  revalidatePath("/");
  revalidatePath(`/posts/${postId}`);
  redirect(`/posts/${postId}`);
}

/**
 * 投稿を削除します。
 */
export async function deletePost(postId: string): Promise<{ success: boolean; message?: string }> {
  const session = await auth();
  
  if (!session?.user?.id) {
    return {
      success: false,
      message: "サインインが必要です。",
    };
  }

  // 投稿が存在し、かつ本人のものであるか確認
  const post = await db.post.findUnique({
    where: { id: postId },
  });

  if (!post) {
    return {
      success: false,
      message: "指定された投稿が見つかりません。",
    };
  }

  if (post.userId !== session.user.id) {
    return {
      success: false,
      message: "他人の投稿を削除する権限がありません。",
    };
  }

  try {
    // データベースから削除 (likes は Cascade で自動削除されます)
    await db.post.delete({
      where: { id: postId },
    });

    // Redisランキングから削除
    await removePostFromRedisRanking(postId);
  } catch (error) {
    console.error("Failed to delete post:", error);
    return {
      success: false,
      message: "投稿の削除時にエラーが発生しました。",
    };
  }

  revalidatePath("/");
  redirect("/");
}
