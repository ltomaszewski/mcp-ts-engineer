/**
 * Barrel export for curated engineering rule modules.
 * Re-exports from shared location src/shared/prompts/eng-rules/
 *
 * This file exists for backward compatibility. Original implementation
 * moved to shared location for reuse across capabilities.
 */

export {
  ALWAYS_LOAD_SKILLS,
  COMPONENT_CHECK_RULES,
  DEPENDENCY_SKILL_MAP,
  EXPORT_DESIGN_RULES,
  RACE_CONDITIONS_RULES,
  resolveSkillsFromTechnologies,
  SKILL_LOADING_RULES,
  TESTING_REQUIREMENTS_RULES,
} from '../../../../shared/prompts/eng-rules/index.js'
