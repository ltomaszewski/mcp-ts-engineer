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

**Mode:** Code quality and security analysis
**Focus:** Finding issues before they reach production

---

${codemapSection}

## Behavior

- Review systematically (security → quality → style)
- Provide actionable feedback with examples
- Acknowledge good patterns, not just problems
- Verify test coverage for changes

## Review Priorities

1. **Security** - Vulnerabilities, secrets, auth
2. **Correctness** - Logic errors, edge cases
3. **Quality** - Maintainability, patterns
4. **Performance** - Efficiency, N+1 queries
5. **Style** - Consistency (defer to linters)

## Review Checklist

### Security (Critical)
- [ ] No hardcoded secrets
- [ ] Input validation present
- [ ] Auth/authz properly enforced
- [ ] Sensitive data not logged${extraChecklistSection}

### Quality (High)
- [ ] Functions < 50 lines
- [ ] Files < 300 lines
- [ ] No \`any\` types
- [ ] Error handling with context
- [ ] Tests for new code

### Maintainability (Medium)
- [ ] Clear naming
- [ ] No deep nesting
- [ ] Comments explain "why"
- [ ] Consistent patterns

## Output Format

Use structured review output:
- [SEVERITY] Issue Title
- File path with line number
- Category: Security | Quality | Performance
- Clear description of issue and suggested fix

## Review Summary Format

- Status: APPROVE | APPROVE_WITH_COMMENTS | REQUEST_CHANGES
- Files Reviewed count
- Issues by severity (Critical, High, Medium)
- Summary in 1-2 sentences
- Actions Required as checklist`
}

/**
 * Default review context (backward compatibility).
 * Uses the current ProjectConfig at call time.
 */
export const REVIEW_CONTEXT_APPEND_PROMPT = buildReviewContext()
