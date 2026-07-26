-- CreateTable
CREATE TABLE "AiModel" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "displayOrder" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "AiModel_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AiTool" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "displayOrder" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "AiTool_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "AiModel_name_key" ON "AiModel"("name");

-- CreateIndex
CREATE UNIQUE INDEX "AiTool_name_key" ON "AiTool"("name");

-- SeedData
INSERT INTO "AiModel" ("id", "name", "displayOrder")
VALUES
    (gen_random_uuid()::text, 'Gemini Flash', 10),
    (gen_random_uuid()::text, 'Gemini Pro', 20),
    (gen_random_uuid()::text, 'Claude Sonnet', 30),
    (gen_random_uuid()::text, 'GPT', 40),
    (gen_random_uuid()::text, 'Claude Opus', 50),
    (gen_random_uuid()::text, 'Claude Fable', 60);

INSERT INTO "AiTool" ("id", "name", "displayOrder")
VALUES
    (gen_random_uuid()::text, 'AntigravityIDE', 10),
    (gen_random_uuid()::text, 'Cursor', 20),
    (gen_random_uuid()::text, 'Cline', 30),
    (gen_random_uuid()::text, 'Claude Code', 40),
    (gen_random_uuid()::text, 'GitHub Copilot', 50),
    (gen_random_uuid()::text, 'Codex', 60);
