import { db } from "@/lib/db";

export interface AiMasterOptions {
  models: string[];
  tools: string[];
}

export async function getActiveAiMasterOptions(): Promise<AiMasterOptions> {
  const [models, tools] = await Promise.all([
    db.aiModel.findMany({
      where: { isActive: true },
      orderBy: [{ displayOrder: "asc" }, { name: "asc" }],
      select: { name: true },
    }),
    db.aiTool.findMany({
      where: { isActive: true },
      orderBy: [{ displayOrder: "asc" }, { name: "asc" }],
      select: { name: true },
    }),
  ]);

  return {
    models: models.map(({ name }) => name),
    tools: tools.map(({ name }) => name),
  };
}

export async function hasOnlyAvailableAiSelections(
  selectedModels: string[],
  selectedTools: string[],
  existingModels: string[] = [],
  existingTools: string[] = [],
): Promise<boolean> {
  const options = await getActiveAiMasterOptions();
  const allowedModels = new Set([...options.models, ...existingModels]);
  const allowedTools = new Set([...options.tools, ...existingTools]);

  return (
    selectedModels.every((name) => allowedModels.has(name)) &&
    selectedTools.every((name) => allowedTools.has(name))
  );
}
