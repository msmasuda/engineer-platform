import { z } from "zod";

export const postSchema = z
  .object({
    title: z
      .string()
      .min(1, "タイトルを入力してください")
      .max(100, "タイトルは100文字以内で入力してください"),
    url: z
      .string()
      .min(1, "プロダクトのURLを入力してください")
      .url("有効なURL形式で入力してください（例: https://example.com）"),
    description: z
      .string()
      .min(1, "概要・説明文を入力してください")
      .max(2000, "説明文は2000文字以内で入力してください"),
    githubUrl: z
      .string()
      .url("有効なURL形式で入力してください（例: https://github.com/...）")
      .or(z.literal(""))
      .optional(),
    techTags: z
      .array(z.string())
      .min(1, "技術タグを1つ以上追加してください"),
    usesAI: z.boolean(),
    aiModels: z.array(z.string()),
    aiTools: z.array(z.string()),
  })
  .refine(
    (data) => {
      // AI使用がONの時、LLMまたはツールのいずれかも入力されていない場合はエラー
      if (data.usesAI && data.aiModels.length === 0 && data.aiTools.length === 0) {
        return false;
      }
      return true;
    },
    {
      message: "AIを使用している場合は、使用したLLMまたはAIツールのいずれかを1つ以上選択してください",
      path: ["aiModels"],
    }
  );

export type PostInput = z.infer<typeof postSchema>;
export default postSchema;
