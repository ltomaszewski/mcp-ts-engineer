/**
 * Tests for phase-eng.v2.ts - conditional rule assembly and skill loading
 * based on detected technologies.
 */

import { phaseEngPromptV2 } from "../phase-eng.v2.js";
import type { PhasePlan } from "../../todo-code-writer.schema.js";

const MOCK_PHASE_PLAN: PhasePlan = {
  phases: [
    {
      phase_number: 1,
      purpose: "Test phase",
      dependencies: ["none"],
      files: [
        { path: "src/test.ts", action: "CREATE", purpose: "Test file" },
      ],
    },
  ],
};

describe("phaseEngPromptV2", () => {
  describe("Version Metadata", () => {
    it("should have version v2 (AC-2.1)", () => {
      expect(phaseEngPromptV2.version).toBe("v2");
    });

    it("should have createdAt 2026-01-31 (AC-2.2)", () => {
      expect(phaseEngPromptV2.createdAt).toBe("2026-01-31");
    });

    it("should not be deprecated (AC-2.3)", () => {
      expect(phaseEngPromptV2.deprecated).toBe(false);
    });

    it("should have a description explaining v2 (AC-2.4)", () => {
      expect(phaseEngPromptV2.description).toBeDefined();
      expect(phaseEngPromptV2.description).toContain("engineering");
    });
  });

  describe("Skill Loading", () => {
    it("should include skill_loading section with typescript-clean-code always", () => {
      const result = phaseEngPromptV2.build({
        specPath: "docs/specs/test.md",
        phasePlan: MOCK_PHASE_PLAN,
        currentPhaseNumber: 1,
        detectedTechnologies: [],
      });

      expect(result.userPrompt).toContain("<skill_loading>");
      expect(result.userPrompt).toContain("</skill_loading>");
      expect(result.userPrompt).toContain("typescript-clean-code");
      expect(result.userPrompt).toContain("Skill tool");
    });

    it("should include nestjs-core skill for nestjs tech", () => {
      const result = phaseEngPromptV2.build({
        specPath: "docs/specs/test.md",
        phasePlan: MOCK_PHASE_PLAN,
        currentPhaseNumber: 1,
        detectedTechnologies: ["nestjs"],
      });

      expect(result.userPrompt).toContain("nestjs-core");
    });

    it("should include react-native-core skill for react-native tech", () => {
      const result = phaseEngPromptV2.build({
        specPath: "docs/specs/test.md",
        phasePlan: MOCK_PHASE_PLAN,
        currentPhaseNumber: 1,
        detectedTechnologies: ["react-native"],
      });

      expect(result.userPrompt).toContain("react-native-core");
    });

    it("should resolve precise skills from raw dependencies", () => {
      const result = phaseEngPromptV2.build({
        specPath: "docs/specs/test.md",
        phasePlan: MOCK_PHASE_PLAN,
        currentPhaseNumber: 1,
        detectedTechnologies: ["nestjs"],
        detectedDependencies: ["@nestjs/core", "@nestjs/graphql", "class-validator", "date-fns"],
      });

      const prompt = result.userPrompt;
      expect(prompt).toContain("nestjs-core");
      expect(prompt).toContain("nestjs-graphql");
      expect(prompt).toContain("class-validator");
      expect(prompt).toContain("date-fns");
    });

    it("should instruct to load skills as first workflow step", () => {
      const result = phaseEngPromptV2.build({
        specPath: "docs/specs/test.md",
        phasePlan: MOCK_PHASE_PLAN,
        currentPhaseNumber: 1,
        detectedTechnologies: ["nestjs"],
      });

      expect(result.userPrompt).toContain("LOAD SKILLS FIRST");
      expect(result.userPrompt).toContain("1. Load all skills");
    });
  });

  describe("Conditional Rule Assembly", () => {
    it("should include race-conditions AND component-check for react-native + expo (AC-2.5)", () => {
      const result = phaseEngPromptV2.build({
        specPath: "docs/specs/test.md",
        phasePlan: MOCK_PHASE_PLAN,
        currentPhaseNumber: 1,
        detectedTechnologies: ["react-native", "expo"],
      });

      const userPrompt = result.userPrompt;

      // Always included
      expect(userPrompt).toContain("<testing_requirements>");
      expect(userPrompt).toContain("</testing_requirements>");
      expect(userPrompt).toContain("<export_design>");
      expect(userPrompt).toContain("</export_design>");

      // Conditionally included for react-native/expo
      expect(userPrompt).toContain("<race_conditions>");
      expect(userPrompt).toContain("</race_conditions>");
      expect(userPrompt).toContain("<component_check>");
      expect(userPrompt).toContain("</component_check>");

      // Check for actual rule content
      expect(userPrompt).toContain("AbortController");
      expect(userPrompt).toContain("variant");
    });

    it("should include race-conditions but NOT component-check for react only (AC-2.6)", () => {
      const result = phaseEngPromptV2.build({
        specPath: "docs/specs/test.md",
        phasePlan: MOCK_PHASE_PLAN,
        currentPhaseNumber: 1,
        detectedTechnologies: ["react"],
      });

      const userPrompt = result.userPrompt;

      // Always included
      expect(userPrompt).toContain("<testing_requirements>");
      expect(userPrompt).toContain("<export_design>");

      // Race conditions for react
      expect(userPrompt).toContain("<race_conditions>");
      expect(userPrompt).toContain("AbortController");

      // Component check NOT for react (only react-native)
      expect(userPrompt).not.toContain("<component_check>");
    });

    it("should omit race-conditions AND component-check for nestjs (AC-2.7)", () => {
      const result = phaseEngPromptV2.build({
        specPath: "docs/specs/test.md",
        phasePlan: MOCK_PHASE_PLAN,
        currentPhaseNumber: 1,
        detectedTechnologies: ["nestjs"],
      });

      const userPrompt = result.userPrompt;

      // Always included
      expect(userPrompt).toContain("<testing_requirements>");
      expect(userPrompt).toContain("<export_design>");

      // NOT included for backend
      expect(userPrompt).not.toContain("<race_conditions>");
      expect(userPrompt).not.toContain("<component_check>");
    });

    it("should include only base rules for empty detectedTechnologies array (AC-2.8)", () => {
      const result = phaseEngPromptV2.build({
        specPath: "docs/specs/test.md",
        phasePlan: MOCK_PHASE_PLAN,
        currentPhaseNumber: 1,
        detectedTechnologies: [],
      });

      const userPrompt = result.userPrompt;

      // Always included
      expect(userPrompt).toContain("<testing_requirements>");
      expect(userPrompt).toContain("<export_design>");

      // NOT included
      expect(userPrompt).not.toContain("<race_conditions>");
      expect(userPrompt).not.toContain("<component_check>");
    });

    it("should include only base rules when detectedTechnologies is undefined (AC-2.9)", () => {
      const result = phaseEngPromptV2.build({
        specPath: "docs/specs/test.md",
        phasePlan: MOCK_PHASE_PLAN,
        currentPhaseNumber: 1,
        // detectedTechnologies omitted
      });

      const userPrompt = result.userPrompt;

      // Always included
      expect(userPrompt).toContain("<testing_requirements>");
      expect(userPrompt).toContain("<export_design>");

      // NOT included
      expect(userPrompt).not.toContain("<race_conditions>");
      expect(userPrompt).not.toContain("<component_check>");
    });
  });

  describe("Character Count Limits", () => {
    it("should be under 8000 characters for backend-only (nestjs) (AC-2.10a)", () => {
      const result = phaseEngPromptV2.build({
        specPath: "docs/specs/test.md",
        phasePlan: MOCK_PHASE_PLAN,
        currentPhaseNumber: 1,
        detectedTechnologies: ["nestjs"],
      });

      const charCount = result.userPrompt.length;
      expect(charCount).toBeLessThan(8000);
    });

    it("should be under 12000 characters for react-native with all rules (AC-2.10b)", () => {
      const result = phaseEngPromptV2.build({
        specPath: "docs/specs/test.md",
        phasePlan: MOCK_PHASE_PLAN,
        currentPhaseNumber: 1,
        detectedTechnologies: ["react-native", "expo"],
      });

      const charCount = result.userPrompt.length;
      expect(charCount).toBeLessThan(12000);
    });
  });

  describe("Error Handling", () => {
    it("should return error message when phase not found (AC-2.11)", () => {
      const result = phaseEngPromptV2.build({
        specPath: "docs/specs/test.md",
        phasePlan: MOCK_PHASE_PLAN,
        currentPhaseNumber: 99, // Non-existent phase
        detectedTechnologies: ["react"],
      });

      expect(result.userPrompt).toContain("Error: Phase");
      expect(result.userPrompt).toContain("99");
      expect(result.userPrompt).toContain("not found");
    });
  });

  describe("Rule Content Validation", () => {
    it("should include TDD workflow content in testing-requirements", () => {
      const result = phaseEngPromptV2.build({
        specPath: "docs/specs/test.md",
        phasePlan: MOCK_PHASE_PLAN,
        currentPhaseNumber: 1,
        detectedTechnologies: [],
      });

      expect(result.userPrompt).toContain("TDD");
      expect(result.userPrompt).toContain("business logic");
    });

    it("should include export design checklist in export-design", () => {
      const result = phaseEngPromptV2.build({
        specPath: "docs/specs/test.md",
        phasePlan: MOCK_PHASE_PLAN,
        currentPhaseNumber: 1,
        detectedTechnologies: [],
      });

      expect(result.userPrompt).toContain("barrel");
      expect(result.userPrompt).toContain("@internal");
    });

    it("should include stale closure pattern in race-conditions when react detected", () => {
      const result = phaseEngPromptV2.build({
        specPath: "docs/specs/test.md",
        phasePlan: MOCK_PHASE_PLAN,
        currentPhaseNumber: 1,
        detectedTechnologies: ["react"],
      });

      expect(result.userPrompt).toContain("setState");
      expect(result.userPrompt).toContain("useEffect");
    });

    it("should include variant-first pattern in component-check when react-native detected", () => {
      const result = phaseEngPromptV2.build({
        specPath: "docs/specs/test.md",
        phasePlan: MOCK_PHASE_PLAN,
        currentPhaseNumber: 1,
        detectedTechnologies: ["react-native"],
      });

      expect(result.userPrompt).toContain("variant");
      expect(result.userPrompt).toContain("shared/components/ui");
    });
  });
});
