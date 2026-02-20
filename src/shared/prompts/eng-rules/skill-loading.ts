/**
 * Skill loading rules and dependency-to-skill mapping.
 * Extracted from /eng Section 1: Dynamic Skill Loading.
 *
 * Used by prompt builders to instruct sub-agents to load
 * relevant skills via the Skill tool before implementation.
 *
 * Originally from: src/capabilities/todo-code-writer/prompts/eng-rules/skill-loading.ts
 */

/** Mapping from package.json dependency names to skill names. */
export const DEPENDENCY_SKILL_MAP: Record<string, string> = {
  expo: "expo-core",
  "expo-router": "expo-router",
  "expo-notifications": "expo-notifications",
  "react-native": "react-native-core",
  nativewind: "nativewind",
  "react-native-reanimated": "reanimated",
  zustand: "zustand",
  "@tanstack/react-query": "react-query",
  zod: "zod",
  "react-native-mmkv": "mmkv",
  "react-hook-form": "react-hook-form",
  "graphql-request": "graphql-request",
  "@shopify/flash-list": "flash-list",
  "@react-native-community/netinfo": "netinfo",
  "date-fns": "date-fns",
  "@testing-library/react-native": "rn-testing-library",
  "@nestjs/core": "nestjs-core",
  "@nestjs/graphql": "nestjs-graphql",
  "@nestjs/mongoose": "nestjs-mongoose",
  "@nestjs/passport": "nestjs-auth",
  "class-validator": "class-validator",
  biome: "biome",
  "@biomejs/biome": "biome",
  "react-native-keyboard-controller": "keyboard-controller",
  "@modelcontextprotocol/sdk": "claude-agent-sdk",
  "@sentry/react-native": "sentry-react-native",
};

/** Skills that must always be loaded regardless of dependencies. */
export const ALWAYS_LOAD_SKILLS: string[] = ["typescript-clean-code"];

/**
 * Base instruction block for skill loading.
 * Prompt builders append the resolved skill list to this.
 */
export const SKILL_LOADING_RULES = `## Skill Loading (MANDATORY)

BEFORE writing ANY code, load engineering skills via the Skill tool.
Skills provide project-specific patterns, anti-patterns, and best practices
that MUST be followed during implementation.

### Loading Process
1. Invoke each skill listed below using the Skill tool
2. Read and absorb the patterns returned by each skill
3. Apply those patterns throughout implementation
4. Always load typescript-clean-code for TypeScript quality standards

### ALWAYS
- Load ALL listed skills before writing implementation code
- Follow patterns from loaded skills (they override generic knowledge)
- Load typescript-clean-code for every TypeScript project

### NEVER
- Skip skill loading — skills contain critical project-specific rules
- Ignore patterns from loaded skills
- Start coding before skills are loaded`;

/**
 * Resolves detected technologies to a deduplicated list of skill names.
 * Includes ALWAYS_LOAD_SKILLS automatically.
 */
export function resolveSkillsFromTechnologies(
  detectedTechnologies: string[],
  allDependencies?: string[],
): string[] {
  const skills = new Set<string>(ALWAYS_LOAD_SKILLS);

  // Map raw dependency names to skills (when full dep list available)
  if (allDependencies) {
    for (const dep of allDependencies) {
      const skill = DEPENDENCY_SKILL_MAP[dep];
      if (skill) {
        skills.add(skill);
      }
    }
  }

  // Fallback: map technology tags to their primary skill
  // (used when only technology tags are available, not full dep list)
  if (!allDependencies || allDependencies.length === 0) {
    const techToSkill: Record<string, string[]> = {
      "react-native": ["react-native-core"],
      react: [],
      nestjs: ["nestjs-core"],
      expo: ["expo-core"],
      "tanstack-query": ["react-query"],
      zustand: ["zustand"],
    };
    for (const tech of detectedTechnologies) {
      const mapped = techToSkill[tech];
      if (mapped) {
        for (const s of mapped) skills.add(s);
      }
    }
  }

  return [...skills];
}
