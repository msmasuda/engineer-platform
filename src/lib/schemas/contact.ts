import { z } from "zod";

export const contactSchema = z.object({
  submissionId: z.uuid("送信情報が正しくありません。"),
  postId: z.string().min(1, "投稿が指定されていません。"),
  type: z.enum(["job", "chat", "other"], "連絡の種類を選択してください。"),
  name: z
    .string()
    .trim()
    .min(1, "お名前を入力してください。")
    .max(100, "お名前は100文字以内で入力してください。"),
  email: z
    .string()
    .trim()
    .email("有効なメールアドレスを入力してください。")
    .max(254, "メールアドレスが長すぎます。"),
  message: z
    .string()
    .trim()
    .min(1, "メッセージを入力してください。")
    .max(3000, "メッセージは3000文字以内で入力してください。"),
  website: z.string().max(200).optional().default(""),
});

export type ContactInput = z.input<typeof contactSchema>;
