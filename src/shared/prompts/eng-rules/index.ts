/**
 * Barrel export for curated engineering rule modules (shared).
 *
 * Originally from: src/capabilities/todo-code-writer/prompts/eng-rules/index.ts
 */

export { COMPONENT_CHECK_RULES } from './component-check.js'
export { EXPORT_DESIGN_RULES } from './export-design.js'
export { RACE_CONDITIONS_RULES } from './race-conditions.js'
export { REACT_HOOKS_REVIEW_RULES } from './react-hooks-review.js'
export {
  ALWAYS_LOAD_SKILLS,
  buildSkillLoadingSection,
  DEPENDENCY_SKILL_MAP,
  resolveSkillsFromTechnologies,
  SKILL_LOADING_INSTRUCTIONS,
  SKILL_LOADING_RULES,
} from './skill-loading.js'
export { TESTING_REQUIREMENTS_RULES } from './testing-requirements.js'
