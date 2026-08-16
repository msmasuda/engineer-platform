CREATE TABLE "ContactMessage" (
    "id" TEXT NOT NULL,
    "submissionId" TEXT NOT NULL,
    "postId" TEXT,
    "postTitle" TEXT NOT NULL,
    "recipientId" TEXT,
    "recipientEmail" TEXT NOT NULL,
    "senderUserId" TEXT,
    "senderName" TEXT NOT NULL,
    "senderEmail" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "deliveryStatus" TEXT NOT NULL DEFAULT 'PENDING',
    "providerMessageId" TEXT,
    "deliveryError" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "sentAt" TIMESTAMP(3),

    CONSTRAINT "ContactMessage_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "ContactMessage_submissionId_key" ON "ContactMessage"("submissionId");
CREATE INDEX "ContactMessage_postId_createdAt_idx" ON "ContactMessage"("postId", "createdAt");
CREATE INDEX "ContactMessage_recipientId_createdAt_idx" ON "ContactMessage"("recipientId", "createdAt");

ALTER TABLE "ContactMessage" ADD CONSTRAINT "ContactMessage_postId_fkey"
FOREIGN KEY ("postId") REFERENCES "Post"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "ContactMessage" ADD CONSTRAINT "ContactMessage_recipientId_fkey"
FOREIGN KEY ("recipientId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "ContactMessage" ADD CONSTRAINT "ContactMessage_senderUserId_fkey"
FOREIGN KEY ("senderUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
