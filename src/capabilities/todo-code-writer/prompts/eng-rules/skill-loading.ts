/**
 * Skill loading rules and dependency-to-skill mapping.
 * Re-exports shared utilities from src/shared/prompts/eng-rules/skill-loading.ts
 *
 * This file exists for backward compatibility. Original implementation
 * moved to shared location for reuse across capabilities.
 */

export {
  ALWAYS_LOAD_SKILLS,
  DEPENDENCY_SKILL_MAP,
  resolveSkillsFromTechnologies,
  SKILL_LOADING_RULES,
} from '../../../../shared/prompts/eng-rules/skill-loading.js'
