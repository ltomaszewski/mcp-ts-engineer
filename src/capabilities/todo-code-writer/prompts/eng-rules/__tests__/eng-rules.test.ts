/**
 * Tests for curated engineering rule modules.
 * Verifies AC-1.1 through AC-1.7 and skill-loading module.
 */

import { describe, it, expect } from "@jest/globals";
import {
  RACE_CONDITIONS_RULES,
  TESTING_REQUIREMENTS_RULES,
  COMPONENT_CHECK_RULES,
  EXPORT_DESIGN_RULES,
  SKILL_LOADING_RULES,
  DEPENDENCY_SKILL_MAP,
  ALWAYS_LOAD_SKILLS,
  resolveSkillsFromTechnologies,
} from "../index.js";

const VAGUE_TERMS_REGEX = /\b(consider|might|perhaps|maybe)\b/i;

describe("eng-rules modules", () => {
  describe("RACE_CONDITIONS_RULES (AC-1.1)", () => {
    it("is a non-empty string", () => {
      expect(typeof RACE_CONDITIONS_RULES).toBe("string");
      expect(RACE_CONDITIONS_RULES.length).toBeGreaterThan(0);
    });

    it("contains key race condition terms", () => {
      expect(RACE_CONDITIONS_RULES).toContain("useEffect");
      expect(RACE_CONDITIONS_RULES).toContain("cleanup");
      expect(RACE_CONDITIONS_RULES).toContain("AbortController");
      expect(RACE_CONDITIONS_RULES).toContain("functional update");
    });

    it("is under 5000 characters", () => {
      expect(RACE_CONDITIONS_RULES.length).toBeLessThan(5000);
    });

    it("contains no vague terms", () => {
      expect(RACE_CONDITIONS_RULES).not.toMatch(VAGUE_TERMS_REGEX);
    });
  });

  describe("TESTING_REQUIREMENTS_RULES (AC-1.2)", () => {
    it("is a non-empty string", () => {
      expect(typeof TESTING_REQUIREMENTS_RULES).toBe("string");
      expect(TESTING_REQUIREMENTS_RULES.length).toBeGreaterThan(0);
    });

    it("contains key testing terms", () => {
      expect(TESTING_REQUIREMENTS_RULES).toContain("coverage");
      expect(TESTING_REQUIREMENTS_RULES).toContain("business logic");
      expect(TESTING_REQUIREMENTS_RULES).toContain("edge cases");
    });

    it("is under 5000 characters", () => {
      expect(TESTING_REQUIREMENTS_RULES.length).toBeLessThan(5000);
    });

    it("contains no vague terms", () => {
      expect(TESTING_REQUIREMENTS_RULES).not.toMatch(VAGUE_TERMS_REGEX);
    });
  });

  describe("COMPONENT_CHECK_RULES (AC-1.3)", () => {
    it("is a non-empty string", () => {
      expect(typeof COMPONENT_CHECK_RULES).toBe("string");
      expect(COMPONENT_CHECK_RULES.length).toBeGreaterThan(0);
    });

    it("contains key component check terms", () => {
      expect(COMPONENT_CHECK_RULES).toContain("variant");
      expect(COMPONENT_CHECK_RULES).toContain("shared/components");
      expect(COMPONENT_CHECK_RULES).toContain("duplication");
    });

    it("is under 5000 characters", () => {
      expect(COMPONENT_CHECK_RULES.length).toBeLessThan(5000);
    });

    it("contains no vague terms", () => {
      expect(COMPONENT_CHECK_RULES).not.toMatch(VAGUE_TERMS_REGEX);
    });
  });

  describe("EXPORT_DESIGN_RULES (AC-1.4)", () => {
    it("is a non-empty string", () => {
      expect(typeof EXPORT_DESIGN_RULES).toBe("string");
      expect(EXPORT_DESIGN_RULES.length).toBeGreaterThan(0);
    });

    it("contains key export design terms", () => {
      expect(EXPORT_DESIGN_RULES).toContain("barrel");
      expect(EXPORT_DESIGN_RULES).toContain("@internal");
      expect(EXPORT_DESIGN_RULES).toContain("test-only");
    });

    it("is under 5000 characters", () => {
      expect(EXPORT_DESIGN_RULES.length).toBeLessThan(5000);
    });

    it("contains no vague terms", () => {
      expect(EXPORT_DESIGN_RULES).not.toMatch(VAGUE_TERMS_REGEX);
    });
  });

  describe("SKILL_LOADING_RULES", () => {
    it("is a non-empty string", () => {
      expect(typeof SKILL_LOADING_RULES).toBe("string");
      expect(SKILL_LOADING_RULES.length).toBeGreaterThan(0);
    });

    it("contains key skill loading terms", () => {
      expect(SKILL_LOADING_RULES).toContain("Skill tool");
      expect(SKILL_LOADING_RULES).toContain("typescript-clean-code");
      expect(SKILL_LOADING_RULES).toContain("MANDATORY");
    });

    it("is under 5000 characters", () => {
      expect(SKILL_LOADING_RULES.length).toBeLessThan(5000);
    });

    it("contains no vague terms", () => {
      expect(SKILL_LOADING_RULES).not.toMatch(VAGUE_TERMS_REGEX);
    });
  });

  describe("DEPENDENCY_SKILL_MAP", () => {
    it("maps react-native to react-native-core", () => {
      expect(DEPENDENCY_SKILL_MAP["react-native"]).toBe("react-native-core");
    });

    it("maps @nestjs/core to nestjs-core", () => {
      expect(DEPENDENCY_SKILL_MAP["@nestjs/core"]).toBe("nestjs-core");
    });

    it("maps expo to expo-core", () => {
      expect(DEPENDENCY_SKILL_MAP["expo"]).toBe("expo-core");
    });

    it("maps zustand to zustand", () => {
      expect(DEPENDENCY_SKILL_MAP["zustand"]).toBe("zustand");
    });

    it("maps @tanstack/react-query to react-query", () => {
      expect(DEPENDENCY_SKILL_MAP["@tanstack/react-query"]).toBe("react-query");
    });

    it("maps biome and @biomejs/biome to biome", () => {
      expect(DEPENDENCY_SKILL_MAP["biome"]).toBe("biome");
      expect(DEPENDENCY_SKILL_MAP["@biomejs/biome"]).toBe("biome");
    });

    it("has entries for all major framework dependencies", () => {
      const expectedDeps = [
        "expo", "expo-router", "expo-notifications",
        "react-native", "nativewind", "zustand",
        "@nestjs/core", "@nestjs/graphql", "@nestjs/mongoose",
        "class-validator", "zod", "date-fns",
      ];
      for (const dep of expectedDeps) {
        expect(DEPENDENCY_SKILL_MAP[dep]).toBeDefined();
      }
    });
  });

  describe("ALWAYS_LOAD_SKILLS", () => {
    it("includes typescript-clean-code", () => {
      expect(ALWAYS_LOAD_SKILLS).toContain("typescript-clean-code");
    });
  });

  describe("resolveSkillsFromTechnologies", () => {
    it("always includes typescript-clean-code", () => {
      const result = resolveSkillsFromTechnologies([]);
      expect(result).toContain("typescript-clean-code");
    });

    it("resolves skills from raw dependency names", () => {
      const result = resolveSkillsFromTechnologies(
        ["nestjs"],
        ["@nestjs/core", "@nestjs/graphql", "class-validator"],
      );
      expect(result).toContain("nestjs-core");
      expect(result).toContain("nestjs-graphql");
      expect(result).toContain("class-validator");
      expect(result).toContain("typescript-clean-code");
    });

    it("resolves skills from technology tags when no deps provided", () => {
      const result = resolveSkillsFromTechnologies(["react-native", "expo"]);
      expect(result).toContain("react-native-core");
      expect(result).toContain("expo-core");
      expect(result).toContain("typescript-clean-code");
    });

    it("deduplicates skills", () => {
      const result = resolveSkillsFromTechnologies(
        ["nestjs"],
        ["@nestjs/core", "@nestjs/core"],
      );
      const nestjsCoreCount = result.filter((s) => s === "nestjs-core").length;
      expect(nestjsCoreCount).toBe(1);
    });

    it("returns only always-load skills for empty inputs", () => {
      const result = resolveSkillsFromTechnologies([], []);
      expect(result).toEqual(["typescript-clean-code"]);
    });
  });

  describe("barrel export (AC-1.5)", () => {
    it("exports all rule modules from index", () => {
      expect(RACE_CONDITIONS_RULES).toBeDefined();
      expect(TESTING_REQUIREMENTS_RULES).toBeDefined();
      expect(COMPONENT_CHECK_RULES).toBeDefined();
      expect(EXPORT_DESIGN_RULES).toBeDefined();
      expect(SKILL_LOADING_RULES).toBeDefined();
      expect(DEPENDENCY_SKILL_MAP).toBeDefined();
      expect(ALWAYS_LOAD_SKILLS).toBeDefined();
      expect(resolveSkillsFromTechnologies).toBeDefined();
    });
  });

  describe("size limits (AC-1.6)", () => {
    it("no rule module exceeds 5000 characters", () => {
      const modules = [
        { name: "RACE_CONDITIONS_RULES", value: RACE_CONDITIONS_RULES },
        { name: "TESTING_REQUIREMENTS_RULES", value: TESTING_REQUIREMENTS_RULES },
        { name: "COMPONENT_CHECK_RULES", value: COMPONENT_CHECK_RULES },
        { name: "EXPORT_DESIGN_RULES", value: EXPORT_DESIGN_RULES },
        { name: "SKILL_LOADING_RULES", value: SKILL_LOADING_RULES },
      ];
      for (const mod of modules) {
        expect(mod.value.length).toBeLessThan(5000);
      }
    });
  });

  describe("no vague instructions (AC-1.7)", () => {
    it("no rule module contains vague terms", () => {
      const modules = [
        RACE_CONDITIONS_RULES,
        TESTING_REQUIREMENTS_RULES,
        COMPONENT_CHECK_RULES,
        EXPORT_DESIGN_RULES,
        SKILL_LOADING_RULES,
      ];
      for (const mod of modules) {
        expect(mod).not.toMatch(VAGUE_TERMS_REGEX);
      }
    });
  });
});
