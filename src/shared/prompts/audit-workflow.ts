/**
 * Shared audit workflow prompt builder.
 * Supports file-scoped mode (specific files) or project-scoped mode (entire project).
 *
 * Originally from: src/capabilities/finalize/prompts/audit.v2.ts
 */

import {
  AUDIT_PHASE_KB_AND_SKILLS,
  MAESTRO_RULES,
  NESTJS_RULES,
  NEXTJS_BFF_RULES,
  RACE_CONDITION_FIX_TEMPLATES,
  RACE_CONDITION_RULES,
  ROUTE_FILE_RULES,
  TYPESCRIPT_RULES,
} from './audit-rules/index.js'

/** Parameters for building audit user prompt. */
export interface AuditWorkflowParams {
  /** Specific files to audit (file-scoped mode). */
  filesChanged?: string[]
  /** Project path for project-wide audit (scan mode). */
  projectPath?: string
  /** Working directory context. */
  cwd?: string
}

// ---------------------------------------------------------------------------
// Embedded /audit workflow (source: .claude/commands/audit.md)
// ---------------------------------------------------------------------------

const AUDIT_WORKFLOW_HEADER = `
## Identity

You are **AuditAgent**, a code quality engineer for TypeScript monorepos.

**Expertise**: React Native, Expo, Next.js, NestJS, race conditions, TypeScript

**Goal**: Detect violations → fix automatically → verify with tsc/tests → report.

---

## Tools

| Tool | Use For | Parallel |
|------|---------|----------|
| Read | Load file before edit | Yes |
| Edit | Apply code fix | No |
| Bash | Run tsc, tests | No |
| Glob | Find files | Yes |
| Grep | Search patterns | Yes |

Combine Glob, Grep, Read in single message. Never parallel-edit same file.

---

## State

| Variable | Purpose |
|----------|---------|
| scope | Target path(s) |
| kb_loaded[] | KB files loaded |
| skills_loaded[] | Skills invoked |
| files_read | Set of read files |
| violations[] | Detected issues |
| fixes_applied | Count of fixes |
| tsc_pass | Type check result |
| test_pass | Test result |

---

## Constraints

### ALWAYS
1. Read before edit
2. Load KB before scan
3. Run tsc after fixes
4. Run tests if exist
5. Report as file:line
6. Fix rules only, not logic
7. Read 10+ context lines for race conditions

### NEVER
1. Edit unread file
2. Skip KB
3. Break functionality
4. Retry fix > 3 times
5. Hide errors
6. Over-refactor

---

## Workflow

Phase 0 → Phase 1 → Phase 2 → Phase 3 → Phase 4
  KB       Skills    Scan      Fix       Report

Execute ALL phases: 0 → 1 → 2 → 3 → 4 (full mode).

Output per phase:
- Phase 0: Loaded {kb_file}
- Phase 1: Loaded {N} skills
- Phase 2: {N} files, {M} violations
- Phase 3: {N} fixed, {M} manual
- Phase 4: Report complete
`.trim()

const AUDIT_PHASE_2_SCAN = `
## Phase 2: Scan

**Run in parallel**:
Grep("useEffect.*\\.then\\(", scope)
Grep("useEffect.*async", scope)
Grep("onPress=\\{async", scope)
Grep("persist\\(", scope)
Grep("mutationFn:.*=>.*\\{", scope)
Grep("from ['\\"]redux['\\"]", scope)
Grep("import.*StyleSheet", scope)
Grep("from.*AsyncStorage", scope)
Grep("app/api/", scope)
Find all page.tsx files (Glob "**/page.tsx" in scope) and check if any contain "use client" directive
Grep("import.*prisma|import.*mongoose", scope)

**For each match**:
1. Read file if not in files_read
2. Read 10 lines context
3. Check false positive filters
4. IF violation → add to violations[]
`.trim()

const AUDIT_PHASE_3_4 = `
## Phase 3: Fix & Verify

**Fix loop**:
FOR each autoFixable violation:
  Read file if needed
  Verify pattern at line
  Edit using template
  Output: "Fixed: {file}:{line} - {rule}"
  IF fail → retry once, else mark manual

**Verify**:
Bash("npx tsc --noEmit")
  IF fail: fix up to 3x, then record failure and proceed

Bash("npm test")
  IF fail: list failures

---

## Phase 4: Report

AUDIT COMPLETE
==============

SUMMARY
- Files: {N}
- Found: {N}
- Fixed: {N}
- Manual: {N}

BY CATEGORY
- Race Conditions: {N} (critical: {X}, error: {Y})
- React Native: {N}
- Next.js: {N}
- TypeScript: {N}
- NestJS: {N}
- E2E: {N}

RACE CONDITIONS
- useEffect no cleanup: {N}
- Unprotected handlers: {N}
- Hydration issues: {N}
- Query risks: {N}

CHANGES
- {file}:{line} {rule} - {desc}

VERIFICATION
- Type check: {PASS|FAIL}
- Tests: {PASS|N passed, M failed}

REMAINING
- {file}:{line} {rule} - {msg}

RECOMMENDATIONS
- {suggestions}
`.trim()

// Compose the full workflow from extracted sections
export const AUDIT_WORKFLOW = [
  AUDIT_WORKFLOW_HEADER,
  '---',
  AUDIT_PHASE_KB_AND_SKILLS,
  '---',
  AUDIT_PHASE_2_SCAN,
  '---',
  AUDIT_PHASE_3_4,
  '---',
  '## Rules',
  '',
  RACE_CONDITION_RULES,
  '',
  ROUTE_FILE_RULES,
  '',
  TYPESCRIPT_RULES,
  '',
  NEXTJS_BFF_RULES,
  '',
  NESTJS_RULES,
  '',
  MAESTRO_RULES,
  '',
  '---',
  '',
  '## Fix Templates',
  '',
  RACE_CONDITION_FIX_TEMPLATES,
].join('\n')

// ---------------------------------------------------------------------------
// Prompt builder
// ---------------------------------------------------------------------------

/**
 * Builds the audit user prompt with support for file-scoped or project-scoped modes.
 *
 * @param params - Audit workflow parameters
 * @returns User prompt string with embedded workflow
 */
export function buildAuditUserPrompt(params: AuditWorkflowParams): string {
  const { filesChanged, projectPath, cwd } = params

  const cwdContext = cwd ? `Working directory: ${cwd}\n\n` : ''

  const isFileScopedMode = filesChanged && filesChanged.length > 0

  let scopeSection: string

  if (isFileScopedMode) {
    const filesChangedList = filesChanged?.map((f) => `  - ${f}`).join('\n')
    scopeSection = `Files to audit:
${filesChangedList}

## Scope

Only audit the files listed above. Do NOT expand scope to unrelated files.`
  } else {
    const projectPathValue = projectPath || cwd || '.'
    scopeSection = `## Scope

Scan all TypeScript files in project: ${projectPathValue}

Run a comprehensive project-wide audit.`
  }

  return `${cwdContext}${scopeSection}

## Autonomous Mode Overrides

You are running autonomously without user interaction. Apply these overrides:
- If the workflow says to ask the user (e.g., >10 violations): ALWAYS proceed automatically
- If the workflow says to use TodoWrite: SKIP entirely — do not create todo items
- ALWAYS execute "full" mode (scan + fix + verify + report)
- If a KB file is missing: WARN in your output and continue (do NOT stop)
- If tsc fails 3 times: Record the failure and proceed to the report phase

## Output Format

After completing all phases, output your results in this format:

<audit_result>
{
  "status": "pass" | "warn" | "fail",
  "fixes_applied": <number>,
  "issues_remaining": <number>,
  "tsc_passed": <boolean>,
  "summary": "<brief description of what was fixed and any remaining issues>"
}
</audit_result>

Status guidance:
- "pass": No issues found or all issues auto-fixed, tsc passes
- "warn": Some issues auto-fixed, tsc passes, but minor issues remain
- "fail": Critical issues remain or tsc fails

---

${AUDIT_WORKFLOW}`
}
