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
  expo: 'expo-core',
  'expo-router': 'expo-router',
  'expo-notifications': 'expo-notifications',
  'react-native': 'react-native-core',
  nativewind: 'nativewind',
  'react-native-reanimated': 'reanimated',
  zustand: 'zustand',
  '@tanstack/react-query': 'react-query',
  zod: 'zod',
  'react-native-mmkv': 'mmkv',
  'react-hook-form': 'react-hook-form',
  'graphql-request': 'graphql-request',
  '@shopify/flash-list': 'flash-list',
  '@react-native-community/netinfo': 'netinfo',
  'date-fns': 'date-fns',
  '@testing-library/react-native': 'rn-testing-library',
  '@nestjs/core': 'nestjs-core',
  '@nestjs/graphql': 'nestjs-graphql',
  '@nestjs/mongoose': 'nestjs-mongoose',
  '@nestjs/passport': 'nestjs-auth',
  'class-validator': 'class-validator',
  biome: 'biome',
  '@biomejs/biome': 'biome',
  'react-native-keyboard-controller': 'keyboard-controller',
  '@modelcontextprotocol/sdk': 'claude-agent-sdk',
  '@sentry/react-native': 'sentry-react-native',
  // Next.js web app dependencies
  next: 'nextjs-core',
  tailwindcss: 'tailwind-v4',
  '@tailwindcss/postcss': 'tailwind-v4',
  'better-auth': 'better-auth',
  'class-variance-authority': 'shadcn-ui',
  '@testing-library/react': 'nextjs-testing',
  'schema-dts': 'nextjs-seo',
}

/** Skills that must always be loaded regardless of dependencies. */
export const ALWAYS_LOAD_SKILLS: string[] = ['typescript-clean-code']

/**
 * Consolidated skill loading instructions.
 * Single source of truth — used by both eng-prompt and audit-prompt builders.
 */
export const SKILL_LOADING_INSTRUCTIONS = `BEFORE writing ANY code, load engineering skills via the Skill tool.
Skills provide project-specific patterns, anti-patterns, and best practices
that MUST be followed during implementation.

Loading process:
1. Invoke each skill listed below using the Skill tool
2. Read and absorb the patterns returned by each skill
3. Apply those patterns throughout implementation
4. Always load typescript-clean-code for TypeScript quality standards`

/**
 * Base instruction block for skill loading.
 * Prompt builders append the resolved skill list to this.
 * @deprecated Use SKILL_LOADING_INSTRUCTIONS + buildSkillLoadingSection() instead.
 */
export const SKILL_LOADING_RULES = `## Skill Loading (MANDATORY)

${SKILL_LOADING_INSTRUCTIONS}

### Example Invocation
To load a skill, call the Skill tool with the skill name:
- Skill("typescript-clean-code") — loads TypeScript quality patterns
- Skill("zustand") — loads Zustand state management patterns
- Skill("zod") — loads Zod validation patterns

### ALWAYS
- Load ALL listed skills before writing implementation code
- Follow patterns from loaded skills — when a skill's instructions contradict your training knowledge, follow the skill
- Load typescript-clean-code for every TypeScript project

### NEVER
- Skip skill loading — skills contain critical project-specific rules
- Ignore patterns from loaded skills
- Start coding before skills are loaded`

/**
 * Builds the <skill_loading> XML section with resolved skills.
 * Shared by eng-prompt and audit-prompt builders.
 *
 * @param detectedTechnologies - Technology tags from project detection
 * @param detectedDependencies - Raw package.json dependency names
 * @returns Skill loading prompt section, or empty string if no skills resolved
 */
export function buildSkillLoadingSection(
  detectedTechnologies: string[],
  detectedDependencies?: string[],
): string {
  const skills = resolveSkillsFromTechnologies(detectedTechnologies, detectedDependencies)

  if (skills.length === 0) {
    return ''
  }

  const skillList = skills.map((s) => `  - ${s}`).join('\n')

  return `<skill_loading>
${SKILL_LOADING_INSTRUCTIONS}

Skills to load:
${skillList}
</skill_loading>`
}

/**
 * Resolves detected technologies to a deduplicated list of skill names.
 * Includes ALWAYS_LOAD_SKILLS automatically.
 */
// biome-ignore lint/complexity/noExcessiveCognitiveComplexity: technology mapping logic
export function resolveSkillsFromTechnologies(
  detectedTechnologies: string[],
  allDependencies?: string[],
): string[] {
  const skills = new Set<string>(ALWAYS_LOAD_SKILLS)

  // Map raw dependency names to skills (when full dep list available)
  if (allDependencies) {
    for (const dep of allDependencies) {
      const skill = DEPENDENCY_SKILL_MAP[dep]
      if (skill) {
        skills.add(skill)
      }
    }
  }

  // Fallback: map technology tags to their primary skill
  // (used when only technology tags are available, not full dep list)
  if (!allDependencies || allDependencies.length === 0) {
    const techToSkill: Record<string, string[]> = {
      'react-native': ['react-native-core'],
      react: [],
      nextjs: ['nextjs-core'],
      nestjs: ['nestjs-core'],
      expo: ['expo-core'],
      'tanstack-query': ['react-query'],
      zustand: ['zustand'],
    }
    for (const tech of detectedTechnologies) {
      const mapped = techToSkill[tech]
      if (mapped) {
        for (const s of mapped) skills.add(s)
      }
    }
  }

  return [...skills]
}
