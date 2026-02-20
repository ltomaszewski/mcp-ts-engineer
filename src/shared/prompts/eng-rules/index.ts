/**
 * Barrel export for curated engineering rule modules (shared).
 *
 * Originally from: src/capabilities/todo-code-writer/prompts/eng-rules/index.ts
 */

export { RACE_CONDITIONS_RULES } from "./race-conditions.js";
export { TESTING_REQUIREMENTS_RULES } from "./testing-requirements.js";
export { COMPONENT_CHECK_RULES } from "./component-check.js";
export { EXPORT_DESIGN_RULES } from "./export-design.js";
export {
  SKILL_LOADING_RULES,
  DEPENDENCY_SKILL_MAP,
  ALWAYS_LOAD_SKILLS,
  resolveSkillsFromTechnologies,
} from "./skill-loading.js";
