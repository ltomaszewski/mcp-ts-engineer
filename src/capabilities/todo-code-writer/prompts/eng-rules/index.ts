/**
 * Barrel export for curated engineering rule modules.
 * Re-exports from shared location src/shared/prompts/eng-rules/
 *
 * This file exists for backward compatibility. Original implementation
 * moved to shared location for reuse across capabilities.
 */

export {
  RACE_CONDITIONS_RULES,
  TESTING_REQUIREMENTS_RULES,
  COMPONENT_CHECK_RULES,
  EXPORT_DESIGN_RULES,
  SKILL_LOADING_RULES,
  DEPENDENCY_SKILL_MAP,
  ALWAYS_LOAD_SKILLS,
  resolveSkillsFromTechnologies,
} from "../../../../shared/prompts/eng-rules/index.js";
