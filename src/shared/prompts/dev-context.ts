/**
 * Development context prompt builder.
 * Used as appendSystemPrompt for engineering steps.
 *
 * buildDevContext() generates a config-aware prompt with absolute codemap paths.
 * DEV_CONTEXT_APPEND_PROMPT is kept as a backward-compatible default.
 */

import { getProjectConfig, type ProjectConfig } from "../../config/project-config.js";

/**
 * Build the codemap table from config entries.
 */
function buildCodemapTable(codemaps: ProjectConfig["codemaps"]): string {
  if (codemaps.length === 0) return "";
  const rows = codemaps.map((c) => `| ${c.area} | \`${c.path}\` |`).join("\n");
  return `## Quick Navigation (Codemaps)

| Area | Codemap |
|------|---------|
${rows}

---`;
}

/**
 * Build development context prompt from ProjectConfig.
 * Uses absolute paths for codemaps so agents can find them regardless of cwd.
 */
export function buildDevContext(config?: ProjectConfig): string {
  const cfg = config ?? getProjectConfig();
  const codemapSection = buildCodemapTable(cfg.codemaps);

  return `# Development Context

**Mode:** Active implementation
**Focus:** Writing code, building features, fixing bugs

---

${codemapSection}

## Behavior

- Write working code first, optimize later
- Run tests after changes
- Keep commits atomic and focused
- Use TDD for new features

## Priorities

1. **Get it working** - Functional code
2. **Get it right** - Correct behavior
3. **Get it clean** - Maintainable code

## Tools to Favor

| Task | Tool |
|------|------|
| Code changes | Edit, Write |
| Running tests/builds | Bash |
| Finding code | Grep, Glob |
| Understanding code | Read |

## Workflow

1. Read existing code → Understand patterns
2. Write tests → Define expected behavior
3. Implement → Make tests pass
4. Verify → turbo run build test lint
5. Commit → Atomic, descriptive commits

## Anti-Patterns to Avoid

- Coding without reading existing patterns
- Skipping tests
- Large commits with multiple concerns
- Ignoring type errors`;
}

/**
 * Default development context (backward compatibility).
 * Uses the current ProjectConfig at call time.
 */
export const DEV_CONTEXT_APPEND_PROMPT = buildDevContext();
