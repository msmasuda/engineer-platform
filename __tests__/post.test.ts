import { describe, it, expect } from "vitest";
import { postSchema } from "@/lib/schemas/post";

describe("Post Validation Schema", () => {
  it("should validate correct input data", () => {
    const validData = {
      title: "My App",
      url: "https://my-app.com",
      description: "This is a great app",
      githubUrl: "https://github.com/user/app",
      techTags: ["React", "Go"],
      usesAI: true,
      aiModels: ["Gemini 3 Pro"],
      aiTools: ["Cursor"],
    };
    const result = postSchema.safeParse(validData);
    expect(result.success).toBe(true);
  });

  it("should fail validation if required fields are missing or invalid", () => {
    const invalidData = {
      title: "",
      url: "invalid-url",
      description: "",
      techTags: [],
      usesAI: false,
      aiModels: [],
      aiTools: [],
    };
    const result = postSchema.safeParse(invalidData);
    expect(result.success).toBe(false);
    if (!result.success) {
      const errors = result.error.flatten().fieldErrors;
      expect(errors.title).toBeDefined();
      expect(errors.url).toBeDefined();
      expect(errors.description).toBeDefined();
      expect(errors.techTags).toBeDefined();
    }
  });

  it("should fail if usesAI is true but no model or tool is specified", () => {
    const invalidAIData = {
      title: "AI App",
      url: "https://ai-app.com",
      description: "AI app description",
      techTags: ["React"],
      usesAI: true,
      aiModels: [],
      aiTools: [],
    };
    const result = postSchema.safeParse(invalidAIData);
    expect(result.success).toBe(false);
    if (!result.success) {
      const errors = result.error.flatten().fieldErrors;
      expect(errors.aiModels).toBeDefined();
    }
  });
});
