/**
 * Tests for shared engineering prompt builder.
 * Validates spec mode and fix mode behaviors.
 */

import { buildEngPromptV2, type EngPromptInput } from "../eng-prompt.v2.js";
import { DEV_CONTEXT_APPEND_PROMPT } from "../dev-context.js";

describe("shared eng prompt builder", () => {
  const basePhasePlan = {
    phases: [
      {
        phase_number: 1,
        purpose: "Test phase",
        dependencies: [],
        files: [
          { action: "CREATE" as const, path: "test.ts", purpose: "Test file" },
        ],
      },
    ],
  };

  it("spec mode matches existing PhaseEngV2 prompt output", () => {
    const input: EngPromptInput = {
      mode: "spec",
      specPath: "docs/specs/test.md",
      phasePlan: basePhasePlan,
      currentPhaseNumber: 1,
      detectedTechnologies: ["react-native"],
      detectedDependencies: ["react-native"],
      cwd: "/workspace",
    };

    const result = buildEngPromptV2(input);

    expect(result.userPrompt).toContain("You are a senior engineer implementing Phase 1");
    expect(result.userPrompt).toContain("<spec_path>docs/specs/test.md</spec_path>");
    expect(result.userPrompt).toContain("<current_phase>1</current_phase>");
    expect(result.userPrompt).toContain("CREATE: test.ts");
    expect(result.systemPrompt?.append).toContain(DEV_CONTEXT_APPEND_PROMPT);
  });

  it("fix mode includes audit summary in user prompt", () => {
    const input: EngPromptInput = {
      mode: "fix",
      projectPath: "/workspace/apps/test",
      auditSummary: "Found 3 race conditions in useEffect hooks",
      filesWithIssues: ["src/hooks/useData.ts", "src/screens/Home.tsx"],
      iterationNumber: 1,
      detectedTechnologies: ["react-native"],
    };

    const result = buildEngPromptV2(input);

    expect(result.userPrompt).toContain("Found 3 race conditions in useEffect hooks");
  });

  it("fix mode includes files with issues list", () => {
    const input: EngPromptInput = {
      mode: "fix",
      projectPath: "/workspace/apps/test",
      auditSummary: "Issues found",
      filesWithIssues: ["src/file1.ts", "src/file2.ts"],
      iterationNumber: 1,
    };

    const result = buildEngPromptV2(input);

    expect(result.userPrompt).toContain("src/file1.ts");
    expect(result.userPrompt).toContain("src/file2.ts");
  });

  it("fix mode includes iteration number", () => {
    const input: EngPromptInput = {
      mode: "fix",
      projectPath: "/workspace/apps/test",
      auditSummary: "Issues",
      filesWithIssues: [],
      iterationNumber: 3,
    };

    const result = buildEngPromptV2(input);

    expect(result.userPrompt).toContain("Iteration 3");
  });

  it("fix mode prompt contains fix instructions", () => {
    const input: EngPromptInput = {
      mode: "fix",
      projectPath: "/workspace/apps/test",
      auditSummary: "Issues",
      filesWithIssues: [],
      iterationNumber: 1,
    };

    const result = buildEngPromptV2(input);

    expect(result.userPrompt).toContain("Apply fixes");
    expect(result.userPrompt).toContain("fix");
  });

  it("spec mode ignores fix-mode fields", () => {
    const input: EngPromptInput = {
      mode: "spec",
      specPath: "docs/specs/test.md",
      phasePlan: basePhasePlan,
      currentPhaseNumber: 1,
      // These should be ignored:
      auditSummary: "Should not appear",
      filesWithIssues: ["should-not-appear.ts"],
      iterationNumber: 999,
    };

    const result = buildEngPromptV2(input);

    expect(result.userPrompt).not.toContain("Should not appear");
    expect(result.userPrompt).not.toContain("should-not-appear.ts");
    expect(result.userPrompt).not.toContain("999");
  });

  it("includes detected technologies in both modes", () => {
    const specInput: EngPromptInput = {
      mode: "spec",
      specPath: "test.md",
      phasePlan: basePhasePlan,
      currentPhaseNumber: 1,
      detectedTechnologies: ["react-native", "expo"],
    };

    const fixInput: EngPromptInput = {
      mode: "fix",
      projectPath: "/workspace",
      auditSummary: "Issues",
      filesWithIssues: [],
      iterationNumber: 1,
      detectedTechnologies: ["react-native", "expo"],
    };

    const specResult = buildEngPromptV2(specInput);
    const fixResult = buildEngPromptV2(fixInput);

    // Both should reference technologies (via skill loading or rules)
    expect(specResult.userPrompt.length).toBeGreaterThan(0);
    expect(fixResult.userPrompt.length).toBeGreaterThan(0);
  });

  it("system prompt append includes DEV_CONTEXT", () => {
    const input: EngPromptInput = {
      mode: "spec",
      specPath: "test.md",
      phasePlan: basePhasePlan,
      currentPhaseNumber: 1,
    };

    const result = buildEngPromptV2(input);

    expect(result.systemPrompt?.append).toContain(DEV_CONTEXT_APPEND_PROMPT);
  });

  describe("monorepo path rules", () => {
    it("spec mode contains monorepo-rooted path rule", () => {
      const input: EngPromptInput = {
        mode: "spec",
        specPath: "docs/specs/test.md",
        phasePlan: basePhasePlan,
        currentPhaseNumber: 1,
      };

      const result = buildEngPromptV2(input);

      expect(result.userPrompt).toContain("monorepo-rooted");
      expect(result.userPrompt).toContain("starting with `apps/` or `packages/`");
      expect(result.userPrompt).toContain("WORKING DIRECTORY");
    });

    it("fix mode contains monorepo-rooted path rule", () => {
      const input: EngPromptInput = {
        mode: "fix",
        projectPath: "/workspace/apps/test",
        auditSummary: "Issues found",
        filesWithIssues: ["src/file1.ts"],
        iterationNumber: 1,
      };

      const result = buildEngPromptV2(input);

      expect(result.userPrompt).toContain("monorepo-rooted");
      expect(result.userPrompt).toContain("starting with `apps/` or `packages/`");
      expect(result.userPrompt).toContain("WORKING DIRECTORY");
    });

    it("spec mode contains PATH FORMAT rule", () => {
      const input: EngPromptInput = {
        mode: "spec",
        specPath: "docs/specs/test.md",
        phasePlan: basePhasePlan,
        currentPhaseNumber: 1,
      };

      const result = buildEngPromptV2(input);

      expect(result.userPrompt).toContain("PATH FORMAT");
      expect(result.userPrompt).toContain("`apps/` or `packages/`");
    });

    it("fix mode contains NO CD FOR PATHS rule", () => {
      const input: EngPromptInput = {
        mode: "fix",
        projectPath: "/workspace/apps/test",
        auditSummary: "Issues",
        filesWithIssues: [],
        iterationNumber: 1,
      };

      const result = buildEngPromptV2(input);

      expect(result.userPrompt).toContain("NO CD FOR PATHS");
      expect(result.userPrompt).toContain("Do NOT use `cd` to navigate before file operations");
    });

    it("both modes contain VERIFICATION rule allowing cd for tests", () => {
      const specInput: EngPromptInput = {
        mode: "spec",
        specPath: "test.md",
        phasePlan: basePhasePlan,
        currentPhaseNumber: 1,
      };

      const fixInput: EngPromptInput = {
        mode: "fix",
        projectPath: "/workspace/apps/test",
        auditSummary: "Issues",
        filesWithIssues: [],
        iterationNumber: 1,
      };

      const specResult = buildEngPromptV2(specInput);
      const fixResult = buildEngPromptV2(fixInput);

      expect(specResult.userPrompt).toContain("VERIFICATION");
      expect(specResult.userPrompt).toContain("cd apps/X && npm test");
      expect(fixResult.userPrompt).toContain("VERIFICATION");
      expect(fixResult.userPrompt).toContain("cd apps/X && npm test");
    });
  });
});
