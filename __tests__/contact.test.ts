import { beforeEach, describe, expect, it, vi } from "vitest";
import { sendContact } from "@/actions/contact";
import { db } from "@/lib/db";
import { kv } from "@/lib/kv";
import { sendContactNotification } from "@/lib/contact-email";

vi.mock("@/auth", () => ({ auth: vi.fn().mockResolvedValue(null) }));
vi.mock("next/headers", () => ({
  headers: vi.fn().mockResolvedValue(
    new Headers({ "x-forwarded-for": "203.0.113.10" }),
  ),
}));
vi.mock("@/lib/db", () => ({
  db: {
    post: { findUnique: vi.fn() },
    contactMessage: {
      findUnique: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
    },
  },
}));
vi.mock("@/lib/kv", () => ({
  kv: { zincrby: vi.fn(), expire: vi.fn() },
}));
vi.mock("@/lib/contact-email", () => ({ sendContactNotification: vi.fn() }));

const input = {
  submissionId: "4f6f8f99-81f4-4ae8-82af-a9b8307208d8",
  postId: "post-1",
  type: "job" as const,
  name: "山田 太郎",
  email: "yamada@example.com",
  message: "プロジェクトについて相談したいです。",
  website: "",
};

describe("Contact Server Action", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(db.contactMessage.findUnique).mockResolvedValue(null);
    vi.mocked(kv.zincrby).mockResolvedValue(1);
    vi.mocked(kv.expire).mockResolvedValue(1);
    vi.mocked(db.post.findUnique).mockResolvedValue({
      id: "post-1",
      title: "テストプロダクト",
      user: { id: "user-1", email: "creator@example.com" },
    } as never);
    vi.mocked(db.contactMessage.create).mockResolvedValue({ id: "contact-1" } as never);
    vi.mocked(db.contactMessage.update).mockResolvedValue({} as never);
    vi.mocked(sendContactNotification).mockResolvedValue("email-1");
  });

  it("validates input on the server", async () => {
    const response = await sendContact({ ...input, email: "invalid" });

    expect(response.success).toBe(false);
    expect(response.errors?.email).toBeDefined();
    expect(db.contactMessage.create).not.toHaveBeenCalled();
  });

  it("stores the message and sends a notification", async () => {
    const response = await sendContact(input);

    expect(response).toEqual({ success: true });
    expect(db.contactMessage.create).toHaveBeenCalledOnce();
    expect(sendContactNotification).toHaveBeenCalledWith(
      expect.objectContaining({
        contactId: "contact-1",
        recipientEmail: "creator@example.com",
        senderEmail: "yamada@example.com",
      }),
    );
    expect(db.contactMessage.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: "contact-1" },
        data: expect.objectContaining({ deliveryStatus: "SENT" }),
      }),
    );
  });

  it("records a delivery failure and returns an error", async () => {
    vi.mocked(sendContactNotification).mockRejectedValue(new Error("Resend error"));

    const response = await sendContact(input);

    expect(response.success).toBe(false);
    expect(response.message).toContain("保存されました");
    expect(db.contactMessage.update).toHaveBeenCalledWith({
      where: { id: "contact-1" },
      data: {
        deliveryStatus: "FAILED",
        deliveryError: "Resend error",
      },
    });
  });

  it("rejects requests over the rate limit", async () => {
    vi.mocked(kv.zincrby).mockResolvedValue(6);

    const response = await sendContact(input);

    expect(response.success).toBe(false);
    expect(response.message).toContain("上限");
    expect(db.contactMessage.create).not.toHaveBeenCalled();
  });

  it("silently accepts honeypot submissions without delivery", async () => {
    const response = await sendContact({ ...input, website: "https://spam.example" });

    expect(response).toEqual({ success: true });
    expect(db.contactMessage.create).not.toHaveBeenCalled();
    expect(sendContactNotification).not.toHaveBeenCalled();
  });
});
