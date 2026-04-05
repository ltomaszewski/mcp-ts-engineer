/**
 * Review context prompt builder.
 * Used as appendSystemPrompt for audit/review steps.
 *
 * buildReviewContext() generates a config-aware prompt with absolute codemap paths
 * and project-specific review checklist items.
 * REVIEW_CONTEXT_APPEND_PROMPT is kept as a backward-compatible default.
 */

import { getProjectConfig, type ProjectConfig } from '../../config/project-config.js'

/**
 * Build the codemap table from config entries.
 */
function buildCodemapTable(codemaps: ProjectConfig['codemaps']): string {
  if (codemaps.length === 0) return ''
  const rows = codemaps.map((c) => `| ${c.area} | \`${c.path}\` |`).join('\n')
  return `## Quick Navigation (Codemaps)

| Area | Codemap |
|------|---------|
${rows}

---`
}

/**
 * Build extra security checklist items from config.
 */
function buildExtraChecklist(items?: string[]): string {
  if (!items || items.length === 0) return ''
  return items.map((item) => `- [ ] ${item}`).join('\n')
}

/**
 * Build review context prompt from ProjectConfig.
 * Uses absolute paths for codemaps and injects project-specific checklist items.
 */
export function buildReviewContext(config?: ProjectConfig): string {
  const cfg = config ?? getProjectConfig()
  const codemapSection = buildCodemapTable(cfg.codemaps)
  const extraChecklist = buildExtraChecklist(cfg.reviewChecklist)
  const extraChecklistSection = extraChecklist ? `\n${extraChecklist}` : ''

  return `# Review Context

${codemapSection}${extraChecklistSection ? `\n\n## Additional Checks\n${extraChecklistSection}` : ''}`
}

/**
 * Default review context (backward compatibility).
 * Uses the current ProjectConfig at call time.
 */
export const REVIEW_CONTEXT_APPEND_PROMPT = buildReviewContext()
