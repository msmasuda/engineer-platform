"use server";

import { createHash } from "node:crypto";
import { headers } from "next/headers";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { kv } from "@/lib/kv";
import { sendContactNotification } from "@/lib/contact-email";
import { contactSchema, type ContactInput } from "@/lib/schemas/contact";

const RATE_LIMIT = 5;
const EMAIL_RATE_LIMIT = 3;
const RATE_LIMIT_SECONDS = 60 * 60;

export interface ContactResponse {
  success: boolean;
  errors?: Record<string, string[]>;
  message?: string;
}

async function checkRateLimit(postId: string, email: string): Promise<boolean> {
  const requestHeaders = await headers();
  const forwardedFor = requestHeaders.get("x-forwarded-for")?.split(",")[0]?.trim();
  const clientAddress =
    forwardedFor || requestHeaders.get("x-real-ip") || requestHeaders.get("x-vercel-forwarded-for") || "unknown";
  const ipFingerprint = createHash("sha256").update(clientAddress).digest("hex");
  const emailFingerprint = createHash("sha256")
    .update(email.toLowerCase())
    .digest("hex");
  const hourBucket = Math.floor(Date.now() / (RATE_LIMIT_SECONDS * 1000));
  const ipKey = `rate:contact:ip:${postId}:${hourBucket}`;
  const emailKey = `rate:contact:email:${postId}:${hourBucket}`;
  const [ipCount, emailCount] = await Promise.all([
    kv.zincrby(ipKey, 1, ipFingerprint),
    kv.zincrby(emailKey, 1, emailFingerprint),
  ]);
  await Promise.all([
    kv.expire(ipKey, RATE_LIMIT_SECONDS + 60),
    kv.expire(emailKey, RATE_LIMIT_SECONDS + 60),
  ]);
  return (
    ipCount !== null &&
    emailCount !== null &&
    ipCount <= RATE_LIMIT &&
    emailCount <= EMAIL_RATE_LIMIT
  );
}

export async function sendContact(input: ContactInput): Promise<ContactResponse> {
  const result = contactSchema.safeParse(input);
  if (!result.success) {
    return {
      success: false,
      errors: result.error.flatten().fieldErrors as Record<string, string[]>,
      message: "入力内容を確認してください。",
    };
  }

  const data = result.data;
  if (data.website) {
    return { success: true };
  }

  const existing = await db.contactMessage.findUnique({
    where: { submissionId: data.submissionId },
    select: { deliveryStatus: true },
  });
  if (existing) {
    return existing.deliveryStatus === "SENT"
      ? { success: true }
      : { success: false, message: "このメッセージは処理済みです。もう一度お試しください。" };
  }

  try {
    if (!(await checkRateLimit(data.postId, data.email))) {
      return {
        success: false,
        message: "送信回数が上限に達しました。1時間ほど待ってからお試しください。",
      };
    }
  } catch (error) {
    console.error("Failed to check contact rate limit:", error);
    return {
      success: false,
      message: "現在メッセージを送信できません。時間をおいてお試しください。",
    };
  }

  const post = await db.post.findUnique({
    where: { id: data.postId },
    select: {
      id: true,
      title: true,
      user: { select: { id: true, email: true } },
    },
  });
  if (!post) {
    return { success: false, message: "指定された投稿が見つかりません。" };
  }

  const session = await auth();
  let contact;
  try {
    contact = await db.contactMessage.create({
      data: {
        submissionId: data.submissionId,
        postId: post.id,
        postTitle: post.title,
        recipientId: post.user.id,
        recipientEmail: post.user.email,
        senderUserId: session?.user?.id ?? null,
        senderName: data.name,
        senderEmail: data.email,
        type: data.type,
        message: data.message,
      },
      select: { id: true },
    });
  } catch (error) {
    console.error("Failed to save contact message:", error);
    return { success: false, message: "メッセージを保存できませんでした。" };
  }

  try {
    const providerMessageId = await sendContactNotification({
      contactId: contact.id,
      recipientEmail: post.user.email,
      postTitle: post.title,
      type: data.type,
      senderName: data.name,
      senderEmail: data.email,
      message: data.message,
    });
    await db.contactMessage.update({
      where: { id: contact.id },
      data: { deliveryStatus: "SENT", providerMessageId, sentAt: new Date() },
    });
    return { success: true };
  } catch (error) {
    console.error("Failed to deliver contact message:", error);
    await db.contactMessage.update({
      where: { id: contact.id },
      data: {
        deliveryStatus: "FAILED",
        deliveryError: error instanceof Error ? error.message.slice(0, 500) : "Unknown delivery error",
      },
    });
    return {
      success: false,
      message: "メッセージは保存されましたが、通知メールを送信できませんでした。時間をおいて再度お試しください。",
    };
  }
}
