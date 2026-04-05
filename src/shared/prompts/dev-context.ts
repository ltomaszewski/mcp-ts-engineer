/**
 * Development context prompt builder.
 * Used as appendSystemPrompt for engineering steps.
 *
 * buildDevContext() generates a config-aware prompt with absolute codemap paths.
 * DEV_CONTEXT_APPEND_PROMPT is kept as a backward-compatible default.
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
 * Build development context prompt from ProjectConfig.
 * Uses absolute paths for codemaps so agents can find them regardless of cwd.
 */
export function buildDevContext(config?: ProjectConfig): string {
  const cfg = config ?? getProjectConfig()
  const codemapSection = buildCodemapTable(cfg.codemaps)

  return `# Development Context

${codemapSection}`
}

/**
 * Default development context (backward compatibility).
 * Uses the current ProjectConfig at call time.
 */
export const DEV_CONTEXT_APPEND_PROMPT = buildDevContext()
