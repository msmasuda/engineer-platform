"use server";

import { auth } from "@/auth";
import { db } from "@/lib/db";
import { postSchema, type PostInput } from "@/lib/schemas/post";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

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
