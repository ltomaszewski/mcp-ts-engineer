import { vi } from "vitest";
/**
 * Tests for phase-eng-step sub-capability definition.
 * Updated for v2: workspace detection, skill loading, prompt version v2.
 */


// ---------------------------------------------------------------------------
// Mock fs before importing (workspace-detector uses fs.readFileSync)
// ---------------------------------------------------------------------------
const { mockReadFileSync } = vi.hoisted(() => ({
  mockReadFileSync: vi.fn<(path: string, encoding: string) => string>(),
}));

vi.mock("fs", () => ({
  readFileSync: mockReadFileSync,
  writeFileSync: vi.fn(),
  existsSync: vi.fn().mockReturnValue(false),
  promises: { readFile: vi.fn(), writeFile: vi.fn() },
}));

// Dynamic import after mock setup (required for ESM mocking)
const { phaseEngStepCapability } = await import(
  "../phase-eng-step.capability.js"
);

// ---------------------------------------------------------------------------
// Test helpers
// ---------------------------------------------------------------------------

interface MockCapabilityContext {
  session: Record<string, unknown>;
  invocation: Record<string, unknown>;
  logger: Record<string, () => void>;
  getSessionCost: () => Record<string, number>;
  promptVersion: string;
  providerName: string;
  invokeCapability: ReturnType<typeof vi.fn>;
}

function createMockContext(): MockCapabilityContext {
  return {
    session: {
      id: "test-session",
      state: "active",
      startedAt: "2026-01-30T00:00:00Z",
      invocations: [],
      totalInputTokens: 0,
      totalOutputTokens: 0,
      totalCost: 0,
    },
    invocation: {
      id: "test-invocation",
      capability: "test_capability",
      input: {},
      timestamp: "2026-01-30T00:00:00Z",
    },
    logger: {
      info: () => {},
      debug: () => {},
      error: () => {},
      warn: () => {},
    },
    getSessionCost: () => ({
      totalCostUsd: 0,
      totalInputTokens: 0,
      totalOutputTokens: 0,
    }),
    promptVersion: "v2",
    providerName: "ClaudeProvider",
    invokeCapability: vi.fn(),
  };
}

function createMockAiResult(
  content: string,
  structuredOutput?: Record<string, unknown>,
) {
  return {
    content,
    structuredOutput,
    usage: { inputTokens: 100, outputTokens: 200, totalTokens: 300 },
    costUsd: 0.1,
    turns: 5,
    terminationReason: "success",
    trace: {
      tid: "testtrace00000000000000000000000",
      startedAt: "2026-01-30T00:00:00Z",
      request: { prompt: "test" },
      turns: [],
    },
  };
}

const MOCK_PHASE_PLAN = {
  phases: [
    {
      phase_number: 1,
      purpose: "Test phase",
      dependencies: ["none"],
      files: [
        {
          path: "src/test.ts",
          action: "CREATE" as const,
          purpose: "Test file",
        },
      ],
    },
  ],
};

/** Configure mockReadFileSync to return a valid package.json. */
function mockPackageJson(content: Record<string, unknown>): void {
  mockReadFileSync.mockReturnValue(JSON.stringify(content));
}

beforeEach(() => {
  vi.clearAllMocks();
  // Default: NestJS workspace
  mockPackageJson({
    dependencies: { "@nestjs/core": "11.0.0", "class-validator": "0.14.0" },
  });
});

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("phaseEngStepCapability", () => {
  describe("definition metadata", () => {
    it("has correct id", () => {
      expect(phaseEngStepCapability.id).toBe(
        "todo_code_writer_phase_eng_step",
      );
    });

    it("has correct type", () => {
      expect(phaseEngStepCapability.type).toBe("tool");
    });

    it("has correct visibility", () => {
      expect(phaseEngStepCapability.visibility).toBe("internal");
    });

    it("has non-empty name", () => {
      expect(phaseEngStepCapability.name).toBeTruthy();
      expect(phaseEngStepCapability.name.length).toBeGreaterThan(0);
    });

    it("has non-empty description", () => {
      expect(phaseEngStepCapability.description).toBeTruthy();
      expect(phaseEngStepCapability.description.length).toBeGreaterThan(0);
    });

    it("defaults to sonnet model", () => {
      expect(phaseEngStepCapability.defaultRequestOptions?.model).toBe(
        "sonnet",
      );
    });

    it("defaults to 100 maxTurns", () => {
      expect(phaseEngStepCapability.defaultRequestOptions?.maxTurns).toBe(100);
    });

    it("defaults to $5.0 budget", () => {
      expect(phaseEngStepCapability.defaultRequestOptions?.maxBudgetUsd).toBe(
        5.0,
      );
    });

    it("has prompt registry with v1 and v2 (AC-4.1)", () => {
      expect(phaseEngStepCapability.promptRegistry).toBeDefined();
      expect(phaseEngStepCapability.promptRegistry.v1).toBeDefined();
      expect(phaseEngStepCapability.promptRegistry.v2).toBeDefined();
    });

    it("has current prompt version v2 (AC-4.2)", () => {
      expect(phaseEngStepCapability.currentPromptVersion).toBe("v2");
    });

    it("v1 prompt is still available and not deprecated (AC-4.3)", () => {
      const v1 = phaseEngStepCapability.promptRegistry.v1;
      expect(v1).toBeDefined();
      expect(v1.deprecated).toBe(false);
      // v1 should build without error
      const result = v1.build({
        specPath: "test.md",
        phasePlan: MOCK_PHASE_PLAN,
        currentPhaseNumber: 1,
      });
      expect(result.userPrompt).toBeDefined();
      expect(result.userPrompt.length).toBeGreaterThan(0);
    });

    it("has outputSchema configured", () => {
      expect(
        phaseEngStepCapability.defaultRequestOptions?.outputSchema,
      ).toBeDefined();
    });

    it("has appendSystemPrompt set to undefined (lazy-loaded at runtime via buildDevContext)", () => {
      const append =
        phaseEngStepCapability.defaultRequestOptions?.appendSystemPrompt;
      expect(append).toBeUndefined();
    });

    it("includes path validation hooks in defaultRequestOptions", () => {
      expect(phaseEngStepCapability.defaultRequestOptions?.hooks).toBeDefined();
      const hooks = phaseEngStepCapability.defaultRequestOptions?.hooks as unknown as { PreToolUse?: unknown[] };
      expect(hooks?.PreToolUse).toHaveLength(2);
    });
  });

  describe("preparePromptInput", () => {
    /** Helper to get typed prompt input from capability. */
    function getPromptInput(
      input: Record<string, unknown>,
    ): Record<string, unknown> {
      const context = createMockContext();
      return phaseEngStepCapability.preparePromptInput(
        input as never,
        context as never,
      ) as Record<string, unknown>;
    }

    it("extracts specPath, phasePlan, currentPhaseNumber, and cwd", () => {
      const result = getPromptInput({
        spec_path: "docs/specs/feature.md",
        phase_plan: MOCK_PHASE_PLAN,
        current_phase_number: 1,
        cwd: "/some/path",
      });

      expect(result.specPath).toBe("docs/specs/feature.md");
      expect(result.phasePlan).toBe(MOCK_PHASE_PLAN);
      expect(result.currentPhaseNumber).toBe(1);
      expect(result.cwd).toBe("/some/path");
    });

    it("includes detectedTechnologies from workspace detection (AC-3.1)", () => {
      const result = getPromptInput({
        spec_path: "docs/specs/feature.md",
        phase_plan: MOCK_PHASE_PLAN,
        current_phase_number: 1,
        cwd: "/some/path",
      });

      expect(result.detectedTechnologies).toBeDefined();
      expect(Array.isArray(result.detectedTechnologies)).toBe(true);
      expect(result.detectedTechnologies).toContain("nestjs");
    });

    it("includes detectedDependencies from workspace detection", () => {
      const result = getPromptInput({
        spec_path: "docs/specs/feature.md",
        phase_plan: MOCK_PHASE_PLAN,
        current_phase_number: 1,
        cwd: "/some/path",
      });

      expect(result.detectedDependencies).toBeDefined();
      expect(Array.isArray(result.detectedDependencies)).toBe(true);
      expect(result.detectedDependencies).toContain("@nestjs/core");
    });

    it("calls readFileSync with the input cwd's package.json", () => {
      getPromptInput({
        spec_path: "docs/specs/feature.md",
        phase_plan: MOCK_PHASE_PLAN,
        current_phase_number: 1,
        cwd: "/my/workspace",
      });
      expect(mockReadFileSync).toHaveBeenCalledWith(
        expect.stringContaining("/my/workspace/package.json"),
        "utf-8",
      );
    });

    it("handles missing cwd gracefully", () => {
      const result = getPromptInput({
        spec_path: "docs/specs/feature.md",
        phase_plan: MOCK_PHASE_PLAN,
        current_phase_number: 1,
      });

      expect(result.cwd).toBeUndefined();
      expect(result.detectedTechnologies).toEqual([]);
      expect(result.detectedDependencies).toEqual([]);
    });
  });

  describe("processResult", () => {
    /** Helper to get typed process result from capability. */
    function getProcessResult(
      input: Record<string, unknown>,
      aiResult: ReturnType<typeof createMockAiResult>,
    ): Record<string, unknown> {
      const context = createMockContext();
      return phaseEngStepCapability.processResult(
        input as never,
        aiResult as never,
        context as never,
      ) as Record<string, unknown>;
    }

    it("uses structured output when available", () => {
      const structuredOutput = {
        status: "success" as const,
        files_modified: ["src/test1.ts", "src/test2.ts"],
        summary: "Implemented test phase successfully",
      };
      const aiResult = createMockAiResult("Some content", structuredOutput);
      const input = {
        spec_path: "docs/specs/feature.md",
        phase_plan: MOCK_PHASE_PLAN,
        current_phase_number: 1,
      };

      const result = getProcessResult(input, aiResult);

      expect(result).toEqual(structuredOutput);
    });

    it("falls back to XML parsing when structured output unavailable", () => {
      const engResult = {
        status: "success",
        files_modified: ["src/file.ts"],
        summary: "Done with phase 1",
      };
      const content = `Phase complete.\n<phase_eng_result>${JSON.stringify(engResult)}</phase_eng_result>`;
      const aiResult = createMockAiResult(content);
      const input = {
        spec_path: "docs/specs/feature.md",
        phase_plan: MOCK_PHASE_PLAN,
        current_phase_number: 1,
      };

      const result = getProcessResult(input, aiResult);

      expect(result).toEqual(engResult);
    });

    it("returns fallback on parse failure (no XML block)", () => {
      const content = "No eng result block here.";
      const aiResult = createMockAiResult(content);
      const input = {
        spec_path: "docs/specs/feature.md",
        phase_plan: MOCK_PHASE_PLAN,
        current_phase_number: 1,
      };

      const result = getProcessResult(input, aiResult);

      expect(result.status).toBe("failed");
      expect(result.files_modified).toEqual([]);
    });

    it("returns fallback on invalid JSON in XML block", () => {
      const content = `<phase_eng_result>not valid json</phase_eng_result>`;
      const aiResult = createMockAiResult(content);
      const input = {
        spec_path: "docs/specs/feature.md",
        phase_plan: MOCK_PHASE_PLAN,
        current_phase_number: 1,
      };

      const result = getProcessResult(input, aiResult);

      expect(result.status).toBe("failed");
    });

    it("returns fallback on invalid structured output schema", () => {
      const invalidStructuredOutput = {
        status: "invalid_status",
        files_modified: "not_an_array",
        summary: "Test",
      };
      const aiResult = createMockAiResult("Content", invalidStructuredOutput);
      const input = {
        spec_path: "docs/specs/feature.md",
        phase_plan: MOCK_PHASE_PLAN,
        current_phase_number: 1,
      };

      const result = getProcessResult(input, aiResult);

      expect(result.status).toBe("failed");
    });
  });
});
