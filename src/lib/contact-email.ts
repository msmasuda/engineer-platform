import "server-only";

import { Resend } from "resend";

interface ContactEmailInput {
  contactId: string;
  recipientEmail: string;
  postTitle: string;
  type: "job" | "chat" | "other";
  senderName: string;
  senderEmail: string;
  message: string;
}

const TYPE_LABELS = {
  job: "案件の依頼",
  chat: "話を聞きたい",
  other: "その他",
} as const;

function escapeHtml(value: string): string {
  return value.replace(/[&<>'"]/g, (character) => {
    const entities: Record<string, string> = {
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      "'": "&#39;",
      '"': "&quot;",
    };
    return entities[character];
  });
}

export async function sendContactNotification(input: ContactEmailInput) {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.CONTACT_EMAIL_FROM;

  if (!apiKey || !from) {
    throw new Error("Resendの送信設定が不足しています。");
  }

  const resend = new Resend(apiKey);
  const safeMessage = escapeHtml(input.message).replace(/\n/g, "<br />");
  const { data, error } = await resend.emails.send(
    {
      from,
      to: input.recipientEmail,
      replyTo: input.senderEmail,
      subject: `【Engineer Platform】${TYPE_LABELS[input.type]}: ${input.postTitle}`,
      html: `
        <h1>プロダクトへのコンタクトが届きました</h1>
        <p><strong>プロダクト:</strong> ${escapeHtml(input.postTitle)}</p>
        <p><strong>種類:</strong> ${TYPE_LABELS[input.type]}</p>
        <p><strong>お名前:</strong> ${escapeHtml(input.senderName)}</p>
        <p><strong>返信先:</strong> ${escapeHtml(input.senderEmail)}</p>
        <hr />
        <p>${safeMessage}</p>
      `,
    },
    { idempotencyKey: `contact-${input.contactId}` },
  );

  if (error || !data?.id) {
    throw new Error(error?.message ?? "メール送信に失敗しました。");
  }

  return data.id;
}
