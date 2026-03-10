# MCP TypeScript Engineer — Capabilities Reference

Complete reference for all MCP capabilities in the `mcp-ts-engineer` project. Use this as a foundation for documenting the AI Software Development Lifecycle (AI-SDLC).

---

## Overview

The project provides **7 MCP capabilities** that form an autonomous AI-driven software development pipeline. They chain together in a spec-driven workflow:

```
┌─────────────────────────────────────────────────────────────┐
│                    SPEC-DRIVEN WORKFLOW                      │
│                                                             │
│  todo_reviewer ──→ todo_code_writer ──→ finalize            │
│  (DRAFT→IN_REVIEW)  (IN_REVIEW→READY)  (READY→IMPLEMENTED) │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│                  INDEPENDENT CAPABILITIES                    │
│                                                             │
│  audit_fix        — Multi-project code quality cleanup      │
│  pr_reviewer      — Comprehensive PR review + auto-fix      │
│  pr_fixer         — Two-tier fix strategy for PR findings   │
│  echo_agent       — Proof-of-concept / connectivity test    │
└─────────────────────────────────────────────────────────────┘
```

### Technology Stack

| Layer | Technology |
|-------|-----------|
| Runtime | Node.js 20+, ES Modules |
| MCP SDK | `@modelcontextprotocol/sdk` |
| Agent SDK | `@anthropic-ai/claude-agent-sdk` |
| Validation | Zod |
| Testing | Vitest (80% coverage target) |
| TypeScript | Strict mode, Node16 module resolution |
| Auth | Claude Code CLI subscription (no API key) |

---

## 1. Echo Agent

**ID:** `echo_agent` | **Visibility:** Public | **Purpose:** Proof-of-concept

Simple test tool that sends a prompt to Claude via Agent SDK and returns the response with cost/turn metrics. Useful for verifying SDK integration and connectivity.

### Input

| Parameter | Type | Required | Default | Constraints | Description |
|-----------|------|----------|---------|-------------|-------------|
| `prompt` | string | Yes | — | 1–10,000 chars | The prompt to send to Claude |
| `model` | enum | No | `"haiku"` | `"haiku"` \| `"sonnet"` | Model selection |
| `cwd` | string | No | — | — | Working directory override |

### Output

| Field | Type | Description |
|-------|------|-------------|
| `response` | string | Claude's text response |
| `cost_usd` | number | Total cost in USD |
| `turns` | number | Number of conversation turns |
| `session_id` | string | Injected by framework |

### Configuration

| Setting | Value |
|---------|-------|
| Max Turns | 50 |
| Max Budget | $3.00 USD |
| Tools | Claude Code preset (full tool access) |
| Permission Mode | bypassPermissions |

---

## 2. Todo Reviewer

**ID:** `todo_reviewer` | **Visibility:** Public | **Purpose:** Spec validation & quality gate

Reviews and validates todo spec files through iterative review-validate cycles. Performs architecture review (10-phase analysis) and TDD coverage validation. Exits early if no changes detected between iterations. Commits once after final iteration if changes were made.

**Lifecycle transition:** `DRAFT → IN_REVIEW`

### Input

| Parameter | Type | Required | Default | Constraints | Description |
|-----------|------|----------|---------|-------------|-------------|
| `spec_path` | string | Yes | — | Valid `.md` file path | Path to the spec file |
| `model` | enum | No | `"sonnet"` | `"opus"` \| `"sonnet"` | Model for review agents |
| `iterations` | number | No | 3 | 1–10 | Review-validate cycles |
| `cwd` | string | No | — | — | Working directory override |

### Output

| Field | Type | Description |
|-------|------|-------------|
| `status` | enum | `"success"` \| `"failed"` |
| `review_report` | string | Human-readable findings from last iteration |
| `tdd_report` | string | TDD validation report |
| `iterations_completed` | number | Actual cycles completed (may exit early) |
| `commit_sha` | string \| null | Git commit SHA if changes were made |
| `commit_message` | string \| null | Commit message |
| `files_changed` | string[] | All modified file paths |
| `session_id` | string | Injected by framework |

### Configuration

| Setting | Value |
|---------|-------|
| Max Turns | 80 |
| Max Budget | $5.00 USD |
| Tools | Claude Code preset |
| Permission Mode | bypassPermissions |

### Workflow

```
Session 1 — AI Review (10-Phase Architecture Analysis)
  ├── 1. Read spec structure
  ├── 2. Analyze completeness
  ├── 3. Check target app context
  ├── 4. Validate acceptance criteria
  ├── 5. Review implementation phases
  ├── 6. Check file changes summary
  ├── 7. Validate scope boundaries
  ├── 8. Review testing strategy
  ├── 9. Check design decisions
  └── 10. Generate findings report

Sessions 2–N — Iteration Loop (per iteration)
  ├── TDD Scan Step: scope analysis, coverage analysis, issue detection
  ├── TDD Fix Step (conditional): only if blocking issues found
  └── Early Exit: skip remaining if no changes detected

Final Session — Commit Step
  └── Commits all changes atomically (if any)
```

### Internal Sub-Capabilities

| Step | ID | Purpose |
|------|----|---------|
| TDD Scan | `todo_tdd_scan_step` | Comprehensive TDD coverage validation |
| TDD Fix | `todo_tdd_fix_step` | Fix blocking TDD issues |
| Commit | (embedded) | Git commit operations |

---

## 3. Todo Code Writer

**ID:** `todo_code_writer` | **Visibility:** Public | **Purpose:** Autonomous implementation

Orchestrates autonomous implementation of todo specs. Reads the spec, splits work into phases via a planner, executes each phase with engineering + audit steps, runs a final repository-wide audit, and commits all changes atomically. Each step uses fresh context for quality.

**Lifecycle transition:** `IN_REVIEW → READY`

### Input

| Parameter | Type | Required | Default | Constraints | Description |
|-----------|------|----------|---------|-------------|-------------|
| `spec_path` | string | Yes | — | Valid `.md` file path | Path to the reviewed spec |
| `model` | enum | No | `"sonnet"` | `"opus"` \| `"sonnet"` \| `"haiku"` | Model for implementation agents |
| `max_phases` | number | No | 5 | 1–10 | Maximum implementation phases |
| `cwd` | string | No | — | — | Working directory override |

### Output

| Field | Type | Description |
|-------|------|-------------|
| `status` | enum | `"success"` \| `"failed"` |
| `phases_completed` | number | Phases successfully completed (0–10) |
| `final_audit_status` | enum | `"pass"` \| `"warn"` \| `"fail"` |
| `commit_sha` | string \| null | Git commit SHA |
| `commit_message` | string \| null | Commit message |
| `files_changed` | string[] | All modified file paths |
| `failed_phase` | number \| null | Phase number where execution failed |
| `failure_reason` | string \| null | Human-readable failure description |
| `phase_results` | PhaseStatus[] | Detailed status per phase |
| `session_id` | string | Injected by framework |

#### PhaseStatus

| Field | Type | Description |
|-------|------|-------------|
| `phase_number` | number | Phase index |
| `eng_status` | enum | `"success"` \| `"failed"` \| `"skipped"` |
| `audit_status` | enum | `"pass"` \| `"warn"` \| `"fail"` \| `"skipped"` |
| `files_modified` | string[] | Files changed in this phase |
| `retry_attempts` | number | Retries attempted (max 3) |

### Configuration

| Setting | Value |
|---------|-------|
| Max Turns | 100 |
| Max Budget | $5.00 USD |
| Tools | Claude Code preset |
| Permission Mode | bypassPermissions |
| Retry per phase | Up to 3 attempts |

### Workflow

```
Session 1 — Planner (AI Query)
  ├── Read spec file
  ├── Analyze "Implementation Phases" section
  ├── Split work into sequential phases
  ├── Identify files to CREATE or MODIFY per phase
  └── Output PhasePlan JSON

Sessions 2–N — Phase Execution Loop (per phase)
  ├── Engineering Step: implement phase code
  ├── Phase Audit Step: validate quality
  ├── Retry (up to 3x on failure)
  └── Early Halt: stops at first unrecoverable phase failure

Final Sessions
  ├── Final Audit: repository-wide quality check
  ├── Spec Update: mark spec as READY
  └── Commit Step: atomic commit of all changes
```

### Internal Sub-Capabilities

| Step | ID | Purpose |
|------|----|---------|
| Planner | (embedded in orchestrator) | Split spec into phases |
| Engineering | `todo_phase_eng_step` | Phase code implementation |
| Phase Audit | `todo_phase_audit_step` | Per-phase quality validation |
| Final Audit | `todo_final_audit_step` | Repository-wide quality check |
| Commit | `todo_commit_step` | Git commit operations |

---

## 4. Finalize

**ID:** `finalize` | **Visibility:** Public | **Purpose:** Post-implementation cleanup

Runs code audit with auto-fix, executes tests on affected workspaces, updates codemaps, updates READMEs, and commits all cleanup changes. Use after any code changes to ensure quality and documentation are current.

**Lifecycle transition:** `READY → IMPLEMENTED`

### Input

| Parameter | Type | Required | Default | Constraints | Description |
|-----------|------|----------|---------|-------------|-------------|
| `files_changed` | string[] | Yes | — | Min 1 item | List of modified file paths |
| `cwd` | string | No | — | — | Working directory override |
| `skip_codemaps` | boolean | No | `false` | — | Skip codemap generation |
| `skip_readmes` | boolean | No | `false` | — | Skip README updates |
| `spec_path` | string | No | — | Valid `.md` file path | Spec to mark as IMPLEMENTED |

### Output

| Field | Type | Description |
|-------|------|-------------|
| `status` | enum | `"success"` \| `"failed"` |
| `audit_status` | enum | `"pass"` \| `"warn"` \| `"fail"` |
| `audit_fixes_applied` | number | Number of auto-fixes applied |
| `audit_summary` | string | Human-readable audit report |
| `tests_passed` | boolean \| null | `null` if tests were skipped |
| `tests_summary` | string | Test execution report |
| `codemaps_updated` | boolean \| null | `null` if skipped |
| `codemaps_summary` | string | Codemap update report |
| `readmes_updated` | boolean \| null | `null` if skipped |
| `readmes_summary` | string | README update report |
| `commit_sha` | string \| null | Git commit SHA |
| `commit_message` | string \| null | Commit message |
| `session_id` | string | Injected by framework |

### Configuration

| Setting | Value |
|---------|-------|
| Max Turns | 50 |
| Max Budget | $3.00 USD |
| Tools | Claude Code preset |
| Permission Mode | bypassPermissions |

### Workflow

```
Session 1 — Orchestrator (AI Query)
  ├── Analyze changed files
  ├── Determine affected workspaces
  ├── Plan codemap areas needing updates
  └── Output FinalizePlan JSON

Sessions 2–N — Sequential Cleanup Steps
  ├── 1. Audit Step: code quality scan + auto-fix + TypeScript validation
  ├── 2. Test Step (conditional): run npm test in affected workspaces
  ├── 3. Codemap Step (conditional): update architecture docs
  ├── 4. README Step (conditional): update project READMEs
  ├── 5. Spec Update (conditional): mark spec as IMPLEMENTED
  └── 6. Commit Step: commit all changes atomically
```

### Internal Sub-Capabilities

| Step | ID | Purpose |
|------|----|---------|
| Audit | `finalize_audit_step` | Code quality + auto-fix |
| Test | `finalize_test_step` | Run tests in workspaces |
| Codemap | `finalize_codemap_step` | Update architecture docs |
| README | `finalize_readme_step` | Update project READMEs |
| Commit | `finalize_commit_step` | Git commit operations |

---

## 5. Audit Fix

**ID:** `audit_fix` | **Visibility:** Public | **Purpose:** Multi-project code quality

Discovers projects in the monorepo, runs code quality audits per project, applies fixes iteratively, and commits changes. Supports single-project targeting or full monorepo scan with exclusion lists.

### Input

| Parameter | Type | Required | Default | Constraints | Description |
|-----------|------|----------|---------|-------------|-------------|
| `project` | string | No | — | Valid path | Single project to audit |
| `max_iteration_per_project` | number | No | 3 | 1–10 | Fix iterations per project |
| `max_total_cap` | number | No | 10 | 1–20 | Total iteration budget across all projects |
| `cwd` | string | No | — | — | Working directory override |
| `spec_path` | string | No | — | Valid `.md` file path | Spec file for context |
| `exclude` | string[] | No | — | — | Project paths to exclude |

### Output

| Field | Type | Description |
|-------|------|-------------|
| `status` | enum | `"success"` \| `"partial"` \| `"failed"` |
| `projects_audited` | number | Projects processed |
| `total_iterations` | number | Total iterations used across all projects |
| `project_results` | ProjectResult[] | Per-project details |
| `summary` | string | Human-readable summary |
| `session_id` | string | Injected by framework |

#### ProjectResult

| Field | Type | Description |
|-------|------|-------------|
| `project_path` | string | Project directory path |
| `iterations` | number | Iterations used for this project |
| `total_fixes` | number | Fixes applied |
| `final_audit_status` | enum | `"pass"` \| `"warn"` \| `"fail"` |
| `files_modified` | string[] | Modified file paths |
| `commit_sha` | string \| null | Git commit SHA |
| `summary` | string | Per-project summary |
| `tests_passed` | boolean \| null | Test results |

### Configuration

| Setting | Value |
|---------|-------|
| Max Turns | 10 |
| Max Budget | $1.00 USD per step |
| Tools | Claude Code preset |
| Permission Mode | bypassPermissions |

### Workflow

```
Session 1 — Planner (AI Query)
  ├── Discover projects in apps/ and packages/
  ├── Check for TypeScript/package.json presence
  ├── Respect exclude list + auto-detected submodules
  ├── Prioritize: apps > packages
  └── Output AuditPlan JSON

Sessions 2–N — Per-Project Loop (up to max_total_cap iterations)
  ├── 1. Lint Scan Step: run biome check
  ├── 2. Lint Fix Step (conditional): fix lint issues
  ├── 3. Deps Scan Step: check npm vulnerabilities
  ├── 4. Deps Fix Step (conditional): apply npm fixes
  ├── 5. Audit Step: project-scoped code quality scan
  ├── 6. Eng Fix Step (conditional): apply code fixes
  ├── 7. Test Step: run tests
  ├── 8. Commit Step: commit changes
  └── Early Exit: skip retries if audit passes on first iteration
```

---

## 6. PR Reviewer

**ID:** `pr_reviewer` | **Visibility:** Public | **Purpose:** Comprehensive PR review

Multi-agent PR analysis that reviews code quality, security, architecture, and performance in parallel. Auto-fixes simple issues, posts structured findings as GitHub PR comments with inline annotations.

### Input

| Parameter | Type | Required | Default | Constraints | Description |
|-----------|------|----------|---------|-------------|-------------|
| `pr` | string | Yes | — | PR number or URL | Pull request to review |
| `mode` | enum | No | `"review-fix"` | `"review-fix"` | Review mode (only review-fix supported) |
| `incremental` | boolean | No | `false` | — | Track prior reviews for delta analysis |
| `budget` | number | No | — | — | Cost budget override in USD |
| `cwd` | string | No | — | — | Working directory override |

### Output

| Field | Type | Description |
|-------|------|-------------|
| `status` | enum | `"success"` \| `"partial"` \| `"failed"` |
| `issues_found` | number | Total issues discovered |
| `issues_fixed` | number | Issues auto-fixed |
| `critical_count` | number | CRITICAL severity issues |
| `high_count` | number | HIGH severity issues |
| `medium_count` | number | MEDIUM severity issues |
| `low_count` | number | LOW severity issues |
| `unfixed_medium_count` | number | Medium issues not yet fixed |
| `unfixed_auto_fixable_count` | number | Fixable issues not yet applied |
| `comment_url` | string | GitHub PR comment URL |
| `cost_usd` | number | Total cost |
| `worktree_path` | string | Git worktree path used |
| `round` | number | Review round (for incremental) |
| `last_reviewed_sha` | string | Last reviewed commit SHA |

### Issue Severity Levels

| Level | Meaning | Action |
|-------|---------|--------|
| CRITICAL | Must fix before merge | Blocks PR |
| HIGH | Strongly recommended fix | Should fix |
| MEDIUM | Nice to have, often auto-fixable | Optional |
| LOW | Informational | No action needed |

### Issue Categories

- `code-quality` — Style, patterns, readability
- `security` — Vulnerabilities, injection, auth issues
- `architecture` — Design, coupling, separation of concerns
- `performance` — Bottlenecks, inefficiency, resource usage

### Configuration

| Setting | Value |
|---------|-------|
| Max Turns | 80 |
| Max Budget | $10.00 USD |
| Tools | Claude Code preset |
| Permission Mode | bypassPermissions |

### Workflow

```
Multi-Phase Orchestration:

  1. Preflight Step     — Validate PR (not draft, not closed)
  2. Context Step       — Create git worktree, fetch diff
  3. Review Step        — Run 5+ parallel review agents:
     ├── Code quality agent
     ├── Security agent
     ├── Architecture agent
     ├── Performance agent
     └── Test/validation agent
  4. Aggregate Step     — Deduplicate issues (deterministic IDs)
  5. Validate Step      — Filter by confidence, classify fixability
  6. Fix Step           — Apply auto-fixable mechanical fixes
  7. Test Step          — Run tests to validate fixes
  8. Commit Step        — Commit fixes to PR branch
  9. Comment Step       — Post summary + inline comments to GitHub
 10. Cleanup Step       — Remove unused exports, validate TypeScript
```

### Internal Sub-Capabilities

| Step | ID | Purpose |
|------|----|---------|
| Preflight | `pr_preflight_step` | PR validation |
| Context | `pr_context_step` | Worktree setup |
| Review | `pr_review_step` | Multi-agent parallel review |
| Aggregate | `pr_aggregate_step` | Issue deduplication |
| Validate | `pr_validate_step` | Issue filtering |
| Fix | `pr_fix_step` | Auto-fix application |
| Test | `pr_test_step` | Test validation |
| Commit | `pr_commit_step` | Git operations |
| Comment | `pr_comment_step` | GitHub PR commenting |
| Cleanup | `pr_cleanup_step` | Unused export removal |
| Revert | `pr_revert_step` | Cleanup on failure |

---

## 7. PR Fixer

**ID:** `pr_fixer` | **Visibility:** Public | **Purpose:** Two-tier PR fix strategy

Resolves `pr_reviewer` findings via a classification-first approach:
- **Tier 1 (Direct):** Mechanical fixes for simple, well-scoped issues
- **Tier 2 (Spec):** Generates spec for complex architectural changes (future)

Posts per-issue resolution status to the PR comment thread.

### Input

| Parameter | Type | Required | Default | Constraints | Description |
|-----------|------|----------|---------|-------------|-------------|
| `pr` | string | Yes | — | PR number or URL | Pull request to fix |
| `budget` | number | No | — | — | Cost budget override in USD |
| `cwd` | string | No | — | — | Working directory override |

### Output

| Field | Type | Description |
|-------|------|-------------|
| `status` | enum | `"success"` \| `"partial"` \| `"failed"` \| `"nothing_to_fix"` |
| `issues_input` | number | Total issues to fix |
| `issues_resolved` | number | Successfully fixed |
| `issues_failed` | number | Fix attempts failed |
| `issues_skipped` | number | Issues not fixable |
| `direct_fixes` | number | Tier 1 fixes applied |
| `spec_fixes` | number | Tier 2 fixes applied (usually 0) |
| `files_changed` | string[] | Modified file paths |
| `cost_usd` | number | Total cost |
| `round` | number | Review round number |
| `per_issue` | FixerIssueResult[] | Per-issue status |

#### FixerIssueResult

| Field | Type | Description |
|-------|------|-------------|
| `issue_id` | string | Deterministic ID from `pr_reviewer` |
| `title` | string | Issue title |
| `status` | enum | `"fixed"` \| `"failed"` \| `"skipped"` |
| `method` | enum | `"direct"` \| `"spec"` \| `"none"` |

### Configuration

| Setting | Value |
|---------|-------|
| Max Turns | 1 (orchestration only) |
| Max Budget | $5.00 USD |
| Permission Mode | bypassPermissions |

### Workflow

```
Orchestration Loop:

  1. Classify Step       — Categorize each issue:
     ├── direct: mechanical fix possible
     ├── spec-required: needs spec pipeline (future)
     └── skip: not fixable
  2. Direct Fix Step     — Apply Tier 1 fixes
  3. Validation Step     — TypeScript check + test validation
  4. Commit Step         — Commit fixes to PR branch
  5. Comment Step        — Post per-issue status to PR
```

### Internal Sub-Capabilities

| Step | ID | Purpose |
|------|----|---------|
| Classify | `pr_fixer_classify_step` | Issue classification |
| Direct Fix | `pr_fixer_direct_fix_step` | Apply mechanical fixes |
| Validation | `pr_fixer_fix_validation_step` | Validate fixes |
| Commit | `pr_fixer_commit_step` | Git operations |
| Comment | `pr_fixer_comment_step` | GitHub PR commenting |

---

## Budget & Cost Summary

| Capability | Max Budget | Typical Cost | Primary Use Case |
|-----------|-----------|-------------|------------------|
| `echo_agent` | $3.00 | $0.01–0.10 | Testing / connectivity |
| `todo_reviewer` | $5.00 | $1.00–3.00 | Spec validation (3 iterations) |
| `todo_code_writer` | $5.00 | $2.00–4.00 | Implementation (5 phases) |
| `finalize` | $3.00 | $0.50–2.00 | Post-implementation cleanup |
| `audit_fix` | $1.00/step | $0.10–0.50 | Code quality cleanup |
| `pr_reviewer` | $10.00 | $3.00–8.00 | Comprehensive PR review |
| `pr_fixer` | $5.00 | $1.00–3.00 | Fix PR findings |

**Full spec-to-implementation workflow:** ~$3.50–9.00 USD
**Full PR review + fix cycle:** ~$4.00–11.00 USD

---

## Spec Lifecycle State Machine

All spec-driven capabilities follow a strict state machine:

```
DRAFT ──────→ IN_REVIEW ──────→ READY ──────→ IMPLEMENTED
       todo_reviewer      todo_code_writer     finalize
```

| State | Meaning | Set By | Next Action |
|-------|---------|--------|-------------|
| `DRAFT` | Spec created, not validated | User | Run `todo_reviewer` |
| `IN_REVIEW` | Validated, ready for implementation | `todo_reviewer` | Run `todo_code_writer` |
| `READY` | Code implemented and committed | `todo_code_writer` | Run `finalize` |
| `IMPLEMENTED` | Complete: code + audit + tests + codemaps | `finalize` | Done |

### Rules

- Each capability only advances to the **next** state (never skips)
- Status update is **atomic**: committed in the same git commit as the work
- Status update is **non-fatal**: logs warning on failure, doesn't block
- `todo_code_writer` only updates on successful (non-halted) execution
- `finalize` only updates when audit passes AND tests pass

---

## Shared Architecture Patterns

### Fresh Context per Step

Every sub-step (engineering, audit, test, commit) runs as an independent AI query with fresh context. This ensures:
- No context pollution between phases
- Each step gets maximum context window
- Failures are isolated to individual steps

### Session Management

Each capability creates a tracked session via `SessionManager`:
- Unique session ID for cost tracking
- Metadata capture (inputs, outputs, timing)
- Budget enforcement at session level
- Graceful cleanup on failure

### Cost Tracking

`CostTracker` provides multi-level budget enforcement:
- **Per-query:** Individual AI call budget
- **Per-session:** Capability-level budget
- **Per-day:** Daily spend cap across all capabilities

### Permission Model

All capabilities use `bypassPermissions` because they:
1. Require unrestricted file read/write access
2. Need git operations (commit, branch, push)
3. Run as autonomous agents with full tool access
4. Validate inputs via Zod schemas at the boundary
5. Rely on MCP server-level access control (authenticated channel)

### Structured Logging

Dual-write logging system:
- **stderr:** Real-time output for monitoring
- **Disk NDJSON:** Structured logs for analysis
- Context binding per session/capability
- Auto-redaction of sensitive fields
