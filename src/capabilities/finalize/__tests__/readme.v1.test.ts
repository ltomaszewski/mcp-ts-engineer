/**
 * Tests for readme prompt v1.
 */

import { readmePromptV1 } from "../prompts/readme.v1.js";
import { readmePrompts, README_CURRENT_VERSION } from "../prompts/index.js";

describe("readmePromptV1", () => {
  describe("prompt structure", () => {
    it("build() returns systemPrompt with preset claude_code", () => {
      const builtPrompt = readmePromptV1.build({
        filesChanged: ["src/api/user.ts"],
        cwd: "/test",
      });

      expect(builtPrompt.systemPrompt).toBeDefined();
      expect(builtPrompt.systemPrompt).toHaveProperty("type", "preset");
      if (
        builtPrompt.systemPrompt &&
        typeof builtPrompt.systemPrompt === "object" &&
        "preset" in builtPrompt.systemPrompt
      ) {
        expect(builtPrompt.systemPrompt.preset).toBe("claude_code");
      }
    });

    it("build() systemPrompt has append field containing conservative bias phrase", () => {
      const builtPrompt = readmePromptV1.build({
        filesChanged: ["src/file.ts"],
      });

      expect(builtPrompt.systemPrompt).toHaveProperty("append");
      if (
        builtPrompt.systemPrompt &&
        typeof builtPrompt.systemPrompt === "object" &&
        "append" in builtPrompt.systemPrompt
      ) {
        const appendText = builtPrompt.systemPrompt.append;
        expect(appendText).toContain("Most changes do NOT require README updates");
      }
    });

    it("build() userPrompt interpolates filesChanged list and cwd", () => {
      const builtPrompt = readmePromptV1.build({
        filesChanged: ["src/api/user.ts", "src/api/auth.ts"],
        cwd: "/test/path",
      });

      expect(builtPrompt.userPrompt).toContain("src/api/user.ts");
      expect(builtPrompt.userPrompt).toContain("src/api/auth.ts");
      expect(builtPrompt.userPrompt).toContain("/test/path");
    });
  });

  describe("prompt registry export", () => {
    it("readmePrompts registry exports v1 prompt version", () => {
      expect(readmePrompts).toBeDefined();
      expect(readmePrompts.v1).toBeDefined();
      expect(readmePrompts.v1).toBe(readmePromptV1);
    });

    it("README_CURRENT_VERSION is 'v1'", () => {
      expect(README_CURRENT_VERSION).toBe("v1");
    });
  });
});
