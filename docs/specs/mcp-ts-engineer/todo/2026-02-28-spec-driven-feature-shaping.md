# [mcp-ts-engineer] feat: Add `/issue-shape` command for spec-driven feature development

**Source**: Manual
**Project**: mcp-ts-engineer
**Status**: DRAFT
**Created**: 2026-02-28
**Appetite**: 1 week

---

## Problem

The current pipeline has a **cold-start gap**:

```
Rough idea (user's head)
    ↓ ??? ← THIS IS MISSING
Well-structured GitHub issue
    ↓ /issue-implement
Implemented, tested, PR'd code
```

Today, `/issue-capture` extracts context from an *existing conversation* — but it assumes the thinking already happened. `/issue-implement` requires a well-structured issue with FR-N requirements, affected files, and implementation notes.

**What's missing**: A guided, multi-agent process that transforms a vague feature draft into a battle-tested, implementation-ready specification — before any code is written.

---

## Solution: `/issue-shape` Command

A new Claude Code command following the `issue-*` prefix convention (`/issue-capture`, `/issue-implement`, `/issue-to-todo`). Inspired by:
- **GitHub Spec-Kit**: Two-layer specs (what vs how), `[NEEDS CLARIFICATION]` tags, Given/When/Then acceptance criteria
- **Basecamp Shape Up**: Appetite-based scoping, explicit no-gos, fat-marker sketches
- **Amazon PR/FAQ**: Start from customer outcome, force concrete answers
- **Stripe/Google RFCs**: Non-goals, alternatives considered, cross-cutting concerns

### Core Principle

> Specifications don't serve code — code serves specifications. Shape the feature completely before touching a keyboard.

---

## The `/issue-shape` Workflow

### Overview

```
/issue-shape [rough idea]
    ↓
Phase 1: DISCOVER   — Interactive interview (understand the feature)
    ↓
Phase 2: RESEARCH   — Multi-agent parallel research (find patterns, feasibility)
    ↓
Phase 3: SHAPE      — Structure into spec-kit format (requirements, scope, no-gos)
    ↓
Phase 4: CHALLENGE  — Devil's advocate review (find holes, ambiguities)
    ↓
Phase 5: OUTPUT     — Create GitHub issue → ready for /issue-implement
```

### Phase 1: DISCOVER (Interactive)

**Goal**: Extract the feature from the user's head into structured raw material.

**Agent**: Main session (interactive with user)

The command asks targeted questions using `AskUserQuestion`, adapting based on answers:

**Round 1 — The Pitch** (Shape Up inspired):
```
Q1: "What problem does this solve?" (Problem)
Q2: "Who hits this problem and when?" (User scenario)
Q3: "How much time is this worth?" (Appetite)
    Options: [Half-day, 1-2 days, 3-5 days, 1 week+]
Q4: "Which project(s) does this affect?"
    Options: [discovered from apps/*/packages/*]
```

**Round 2 — Boundaries** (Shape Up no-gos + RFC non-goals):
```
Q5: "What is explicitly OUT of scope?" (No-gos)
Q6: "What's the simplest version that would be useful?" (MVP)
Q7: "Any technical constraints or preferences?" (Guardrails)
```

**Round 3 — Success Criteria** (Amazon PR/FAQ inspired):
```
Q8: "How would you verify this works?" (Acceptance test)
Q9: "What would a user say after using this?" (Customer quote)
```

**Output**: `DISCOVERY_BRIEF` — structured raw material from all answers.

### Phase 2: RESEARCH (Multi-Agent, Parallel)

**Goal**: Ground the feature in reality — existing code, battle-tested patterns, feasibility.

Launch 3 agents in parallel, each returning structured findings:

#### Agent A: Codebase Scout
```
Task: Analyze affected project(s) for:
- Existing patterns that relate to this feature
- Files/modules that would need changes
- Similar past implementations (specs in docs/specs/)
- Architecture constraints
- Test patterns in use

Output: CODEBASE_REPORT {
  affected_files: [{path, action, reason}],
  existing_patterns: [{name, location, relevance}],
  similar_implementations: [{spec, description}],
  constraints: [string],
  estimated_complexity: "low" | "medium" | "high"
}
```

#### Agent B: Pattern Researcher
```
Task: Research battle-tested solutions for the feature type:
- Industry patterns (how do similar tools solve this?)
- Library/framework best practices
- Known pitfalls and anti-patterns
- Reference implementations

Output: PATTERN_REPORT {
  recommended_approach: string,
  alternatives_considered: [{approach, pros, cons, rejected_reason}],
  pitfalls: [{description, mitigation}],
  references: [{title, url, relevance}]
}
```

#### Agent C: Cross-Cutting Analyzer
```
Task: Assess cross-cutting concerns:
- Security implications
- Performance impact
- Testing strategy (unit, integration, E2E)
- Migration/backwards compatibility
- Multi-project coordination (if cross-cutting)

Output: CROSSCUTTING_REPORT {
  security: [{concern, mitigation}],
  performance: [{concern, approach}],
  testing_strategy: {unit: string, integration: string, e2e: string},
  migration: string | null,
  coordination: [{project, changes_needed}]
}
```

### Phase 3: SHAPE (Structured Spec Generation)

**Goal**: Synthesize discovery + research into a spec-kit format spec.

**Agent**: Main session, using all Phase 2 outputs.

Generates a **two-layer specification**:

#### Layer 1: Functional Spec (What & Why)

```markdown
## User Scenarios (P1/P2/P3)

### P1: [Primary scenario]
**As a** {role}
**I want to** {action}
**So that** {outcome}

**Acceptance Criteria:**
- Given {precondition}, When {action}, Then {result}
- Given {precondition}, When {action}, Then {result}

### P2: [Secondary scenario]
...

## Edge Cases
- EC-1: {boundary condition} → {expected behavior}
- EC-2: {error scenario} → {expected behavior}

## Non-Goals (Explicit)
- NG-1: {what this does NOT do}
- NG-2: {what is deferred to future work}
```

#### Layer 2: Technical Spec (How & Constraints)

```markdown
## Architecture Approach
{Recommended approach from Pattern Researcher}

### Alternatives Considered
| Approach | Pros | Cons | Decision |
|----------|------|------|----------|
| {A} | ... | ... | ✅ Chosen / ❌ Rejected: {reason} |

## Affected Files
| File | Action | Purpose |
|------|--------|---------|
| ... | MODIFY/CREATE/DELETE | ... |

## Implementation Phases
- Phase 1: {foundation — what blocks everything}
- Phase 2: {core feature — P1 scenario}
- Phase 3: {polish — P2/P3 + edge cases}

## Cross-Cutting Concerns
- **Security**: {from analyzer}
- **Performance**: {from analyzer}
- **Testing**: {strategy}

## [NEEDS CLARIFICATION]
- NC-1: {unresolved question — requires user input}
- NC-2: {ambiguous requirement — needs decision}
```

### Phase 4: CHALLENGE (Devil's Advocate Review)

**Goal**: Find holes before committing to implementation.

**Agent**: Dedicated challenger agent with adversarial prompt.

Checks:
1. **Completeness**: Every P1 scenario has acceptance criteria?
2. **Testability**: Can each FR be verified with a test?
3. **Scope creep**: Does anything exceed the stated appetite?
4. **Ambiguity**: Are there hidden `[NEEDS CLARIFICATION]` items?
5. **Feasibility**: Given codebase analysis, is the plan realistic?
6. **Missing no-gos**: Are there implicit assumptions that should be explicit?

**Output**: `CHALLENGE_REPORT` with issues categorized as:
- **BLOCKER**: Must resolve before proceeding
- **WARNING**: Should address but can proceed
- **SUGGESTION**: Nice to have

**If BLOCKERs found**: Return to user for clarification (interactive).

### Phase 5: OUTPUT (GitHub Issue Creation)

**Goal**: Produce a self-contained GitHub issue compatible with `/issue-implement`.

Merges all artifacts into the `/issue-capture` format with enhancements:

```markdown
---
project: {PROJECT}
path: {apps|packages}/{PROJECT}
type: feat
status: draft
created: YYYY-MM-DD
appetite: {from Phase 1}
shaped: true
session: "{one-line summary}"
---

# {Feature Description}

## Context

{Problem statement — 2-3 sentences from Phase 1}

## Appetite

**{appetite}** — {what's included vs what's cut to fit}

---

## Requirements

- [ ] FR-1: {from P1 acceptance criteria — Given/When/Then}
- [ ] FR-2: {from P1 acceptance criteria}
- [ ] FR-3: {from P2 acceptance criteria}
- [ ] FR-4: {from edge cases}

## Non-Goals

- NG-1: {explicit exclusion}
- NG-2: {deferred to future}

---

## User Scenarios

### P1: {Primary}
{Full scenario with acceptance criteria}

### P2: {Secondary}
{Full scenario}

---

## Architecture

{Recommended approach}

### Alternatives Considered
{Table from Phase 3}

---

## Affected Files

{Table from Codebase Scout}

---

## Implementation Notes

- {Pattern to follow — from Pattern Researcher}
- {Constraint — from Cross-Cutting Analyzer}
- {Pitfall to avoid — from Pattern Researcher}

## Implementation Phases

- Phase 1: {foundation}
- Phase 2: {core}
- Phase 3: {polish}

---

## Testing Strategy

- **Unit**: {specific test approach}
- **Integration**: {specific test approach}
- **E2E**: {if applicable}

---

## Cross-Cutting Concerns

- **Security**: {mitigations}
- **Performance**: {approach}

---

## References

- {Pattern reference URLs}
- {Similar spec in repo}
- {Related issues}

---

## For Implementation

| Field | Value |
|-------|-------|
| **Project** | `{path}` |
| **Workspace** | `-w {path}` |
| **Test** | `npm test -w {path}` |
| **Build** | `npm run build -w {path}` |

**To implement:**
```
/issue-implement {number}
```
```

---

## Task Decomposition & Dependency Graph

### When to Decompose

Features that exceed a single issue's scope get broken into a **dependency graph** of related issues. The decomposition decision happens in Phase 3 (SHAPE) based on:

| Signal | Decomposition |
|--------|--------------|
| Single project, 1-2 phases | **Single issue** — no decomposition |
| Single project, 3+ phases | **Sequential chain** — 1 issue per phase, linked |
| Multiple projects | **Parallel tracks** — 1 issue per project, with cross-project deps |
| Foundation + features | **Fan-out** — 1 foundation issue blocks N feature issues |

### Dependency Model

Issues use GitHub's native issue linking + structured metadata:

```markdown
## Dependencies

| Issue | Relation | Reason |
|-------|----------|--------|
| #{parent} | parent | Epic/umbrella issue for {feature} |
| #{N} | blocks | Must complete before this issue starts |
| #{N} | blocked-by | This issue cannot start until #{N} is done |
| #{N} | related | Shared context but independent execution |
```

### Relation Types

| Relation | Meaning | `/issue-implement` Behavior |
|----------|---------|---------------------------|
| `parent` | This is a sub-task of a larger epic | Epic tracks overall progress |
| `blocks` | This issue must finish before dependent issues can start | Dependent issues get `status:blocked` label until this closes |
| `blocked-by` | This issue waits for another to complete | `/issue-implement` warns if blockers are still open |
| `related` | Shared context, no execution order constraint | Informational only |

### Decomposition Output Format

For multi-issue features, Phase 5 creates issues in dependency order:

```
/issue-shape "add user auth with login page"
    ↓
Phase 3 determines: 3 issues needed (backend → frontend → integration)
    ↓
Phase 5 creates:

Epic: #100 — [monorepo] feat: user authentication system
  │         Labels: epic, shaped
  │
  ├── #101 — [nestjs-server] feat: JWT auth module + guards
  │         Labels: project:nestjs-server, shaped
  │         Dependencies: parent=#100
  │         Execution order: 1 (no blockers)
  │
  ├── #102 — [next-app] feat: login page + auth context
  │         Labels: project:next-app, shaped
  │         Dependencies: parent=#100, blocked-by=#101
  │         Execution order: 2 (needs API first)
  │
  └── #103 — [monorepo] feat: auth integration tests
            Labels: shaped
            Dependencies: parent=#100, blocked-by=#101, blocked-by=#102
            Execution order: 3 (needs both)
```

### Epic Issue Template

When decomposing, the first issue created is an **epic** (umbrella):

```markdown
---
project: monorepo
type: feat
status: draft
shaped: true
epic: true
created: YYYY-MM-DD
appetite: {total appetite}
---

# {Feature Description}

## Context
{Problem statement}

## Sub-Tasks (Execution Order)

| # | Issue | Project | Depends On | Status |
|---|-------|---------|------------|--------|
| 1 | #{N1} — {title} | {project} | — | draft |
| 2 | #{N2} — {title} | {project} | #{N1} | blocked |
| 3 | #{N3} — {title} | {project} | #{N1}, #{N2} | blocked |

## Execution Plan

```bash
# Execute in order (each waits for previous to merge):
/issue-implement {N1}    # Foundation — no blockers
/issue-implement {N2}    # Depends on #{N1}
/issue-implement {N3}    # Depends on #{N1} + #{N2}
```

## Architecture
{Overall architecture spanning all sub-tasks}

## Non-Goals
{What the full feature does NOT include}
```

### Sub-Task Issue Enhancements

Each sub-task issue includes a **Dependencies** section in its body:

```markdown
## Dependencies

| Issue | Relation | Status | Reason |
|-------|----------|--------|--------|
| #{parent} | parent | open | Epic: {epic title} |
| #{N} | blocked-by | open | Needs {what} from #{N} |

> **Execution gate**: Do NOT run `/issue-implement` on this issue until all `blocked-by` issues are closed.
```

### Execution Workflow (User-Facing)

After `/issue-shape` creates the graph:

```bash
# 1. User sees the epic with execution plan
gh issue view {epic_number}

# 2. Execute issues one-by-one in order
/issue-implement {N1}    # First — no blockers
# ... wait for PR merge ...

/issue-implement {N2}    # Second — #{N1} is now closed
# ... wait for PR merge ...

/issue-implement {N3}    # Third — #{N1} + #{N2} closed

# 3. Close epic when all sub-tasks done
# (Auto-closed if all sub-tasks reference "Closes #{epic}")
```

### `/issue-implement` Integration

When `/issue-implement` is run on an issue with `blocked-by` dependencies:

```
Step 0 (NEW): Dependency Check
    ↓
    Check each blocked-by issue:
      gh issue view #{N} --json state -q .state
    ↓
    IF any blocker is OPEN:
      ⚠️ "Issue #{current} is blocked by open issue(s): #{N1}, #{N2}"
      "Close blockers first, or override with: /issue-implement {current} --force"
      STOP (unless --force)
    ↓
    IF all blockers CLOSED:
      Continue normal pipeline (Step 1: Import → ...)
```

### Labels for Dependency Tracking

| Label | Applied When | Removed When |
|-------|-------------|-------------|
| `epic` | Issue is an umbrella for sub-tasks | Manual (when all sub-tasks done) |
| `shaped` | Issue went through `/issue-shape` | Never (permanent metadata) |
| `status:blocked` | Issue has open `blocked-by` deps | When all blockers close |
| `execution-order:N` | Sub-task position in sequence | Never (permanent metadata) |

### Phase 3 Decomposition Logic

During SHAPE phase, the synthesizer evaluates:

```
IF affected_projects.count > 1:
    → Multi-project decomposition (1 issue per project + epic)

ELIF implementation_phases.count >= 3 AND appetite > "1-2 days":
    → Sequential chain (1 issue per phase + epic)

ELIF has_foundation_work AND has_feature_work:
    → Fan-out (foundation blocks features)

ELSE:
    → Single issue (no decomposition)
```

**User confirmation before creating**: Always show the proposed graph and ask:

```
Proposed task breakdown:

  Epic: "user authentication system"
  ├── #1: [nestjs-server] JWT auth module (no blockers)
  ├── #2: [next-app] login page (blocked by #1)
  └── #3: [monorepo] integration tests (blocked by #1, #2)

  Total: 3 issues + 1 epic
  Execution: sequential (#1 → #2 → #3)

Create these issues? (Options: Yes / Merge into single issue / Adjust breakdown)
```

---

## Agent Delegation Strategy

### Per Project Type (from registry.json)

The research agents adapt their analysis based on project type:

| Project Type | Codebase Scout Focus | Pattern Research Focus | Cross-Cutting Focus |
|-------------|---------------------|----------------------|-------------------|
| **expo-app** | Components, navigation, stores, NativeWind styles | RN patterns, gesture/animation libs, platform-specific | Bundle size, startup time, accessibility |
| **nestjs-server** | Modules, services, guards, schemas, GraphQL resolvers | API design, auth patterns, DB patterns | Rate limiting, input validation, error handling |
| **mcp-server** | Capabilities, prompts, schemas, provider integration | MCP patterns, agent orchestration, tool design | Budget limits, timeout handling, context limits |
| **next-app** | Pages, components, Server Actions, TanStack Query hooks | BFF patterns, caching strategies, SSR/SSG | Core Web Vitals, SEO, auth flow |
| **monorepo** | Cross-project deps, shared packages, build pipeline | Monorepo patterns, workspace coordination | Build time, CI impact, version alignment |

### Parallel Agent Orchestration

```
Main Session (interactive)
    │
    ├── Phase 1: Direct interaction (no delegation)
    │
    ├── Phase 2: Launch 3 agents in parallel ──┬── Agent A: Codebase Scout
    │                                           ├── Agent B: Pattern Researcher
    │                                           └── Agent C: Cross-Cutting Analyzer
    │                                                   │
    │   ←── Collect all 3 results ──────────────────────┘
    │
    ├── Phase 3: Main session synthesizes (no delegation)
    │
    ├── Phase 4: Launch 1 agent ── Agent D: Challenger
    │   ←── Collect result
    │   IF blockers: return to user (interactive)
    │
    └── Phase 5: Main session creates issue (no delegation)
```

---

## Scaling: When NOT to Use /issue-shape

Not every change needs full shaping. The command should detect scope and suggest the right tool:

| Signal | Scope | Redirect |
|--------|-------|----------|
| "fix typo", "update config" | Trivial | "This looks like a quick fix. Just do it directly." |
| "add button", "rename field" | Small | "Small change — use `/issue-capture` directly." |
| "add auth", "new API endpoint" | Medium | Run /issue-shape with **2-phase research** (skip cross-cutting) |
| "redesign system", "new app type" | Large | Run full /issue-shape (all 5 phases) |

Detection heuristic: Count of affected projects × estimated file changes × novelty (new vs modification).

---

## Integration with Existing Pipeline

### Before /issue-shape (New)
```
User has rough idea
    ↓
/issue-shape "rough idea description"
    ↓
Interactive discovery → Multi-agent research → Structured spec → Challenge review
    ↓
GitHub issue created (structured, self-contained, shaped: true)
```

### After /issue-shape (Existing, Unchanged)
```
/issue-implement {number}
    ↓
Import → Worktree → todo_reviewer → todo_code_writer → finalize → PR → Review-Fix Loop
```

### New Label
```
shaped: true  — Issue went through /issue-shape process (higher confidence for autonomous execution)
```

The `shaped: true` metadata signals to `/issue-implement` that the spec is high-quality and can run with fewer review iterations (e.g., `iterations=2` instead of `3` for `todo_reviewer`).

---

## Command File Structure

```
.claude/commands/issue-shape.md           — Command definition (this spec → implementation)
```

No new MCP capabilities needed — `/issue-shape` is purely a Claude Code command that orchestrates existing tools (Agent subagents, AskUserQuestion, gh CLI, file writes).

Minor enhancement to `/issue-implement`: add Step 0 (Dependency Check) that validates `blocked-by` issues are closed before proceeding.

### Bootstrap Integration

The command must be installed via `scripts/bootstrap.sh` and `scripts/update.sh` like all other commands:

1. **Source file**: `packages/mcp-ts-engineer/.claude/commands/issue-shape.md`
2. **bootstrap.sh**: Already symlinks all files in `.claude/commands/` — no script change needed if the file follows the existing pattern
3. **update.sh**: Already re-creates missing symlinks for `.claude/commands/` — no script change needed
4. **Verification**: After implementation, run `bootstrap.sh` or `update.sh` and confirm `.claude/commands/issue-shape.md` symlink appears in consuming monorepo's `.claude/commands/`

The existing symlink loop in `bootstrap.sh` handles this automatically:
```bash
# From bootstrap.sh — symlinks all command files
for cmd_file in "$SUBMODULE_PATH/.claude/commands/"*.md; do
  symlink_file "$cmd_file" "$MONOREPO_ROOT/.claude/commands/$(basename "$cmd_file")"
done
```

No changes to bootstrap/update scripts required — just place the file in the right location.

---

## Success Criteria

- SC-1: User can go from "I want X" to a GitHub issue in <10 minutes of interaction
- SC-2: Shaped issues produce fewer `blocked` labels during `/issue-implement` than unstructured issues
- SC-3: Research agents surface at least 1 non-obvious insight per feature (pattern, pitfall, or constraint)
- SC-6: Multi-project features correctly decompose into dependency-ordered issues
- SC-7: `/issue-implement` respects blocked-by gates and warns on open blockers
- SC-4: Challenge phase catches at least 1 ambiguity or missing requirement per feature
- SC-5: Output issue is 100% self-contained (passes `/issue-capture` litmus test)

---

## Risks & Mitigations

| Risk | Mitigation |
|------|-----------|
| Over-engineering: /issue-shape takes too long for medium features | Scope detection auto-suggests lighter process |
| Research agents return noise | Constrain agent prompts to project-type-specific concerns |
| User fatigue from too many questions | Cap at 3 rounds of questions, make later ones optional |
| Challenger agent is too aggressive | Limit to BLOCKER/WARNING/SUGGESTION tiers |
| Context window pressure from research results | Each agent returns structured summary, not raw data |
| Dependency graph too granular (10+ issues for one feature) | Cap at 5 sub-tasks; merge small phases into one issue |
| Blockers stall the pipeline (issue #N never gets implemented) | `--force` override on `/issue-implement`; epic tracks stalled items |

---

## Open Questions

- ~~NC-1~~: **RESOLVED** — Cross-project features create multiple linked issues with an epic umbrella. See "Task Decomposition & Dependency Graph" section.
- ~~NC-2~~: **RESOLVED** — Research results are NOT persisted separately. The GitHub issue body is the single source of truth — all research findings are inlined.
- ~~NC-3~~: **RESOLVED** — `/issue-shape` bypasses `docs/specs/` entirely. Output is issue-only. The existing `/issue-to-todo` pipeline handles spec creation if needed downstream.
- ~~NC-4~~: **DEFERRED** — Dependency checks in `/issue-implement` are out of scope for this command. The `/issue-shape` command documents dependencies in issue bodies; enforcement is a future `/issue-implement` enhancement.

---

## References

- [GitHub Spec-Kit](https://github.com/github/spec-kit) — Two-layer spec model, `[NEEDS CLARIFICATION]` convention, Given/When/Then acceptance criteria
- [Basecamp Shape Up](https://basecamp.com/issue-shapeup/1.5-chapter-06) — Appetite-based scoping, pitch format, no-gos
- [Amazon Working Backwards](https://workingbackwards.com/resources/working-backwards-pr-faq/) — Customer-outcome-first thinking
- [Pragmatic Engineer: RFCs](https://newsletter.pragmaticengineer.com/p/software-engineering-rfc-and-design) — Non-goals, alternatives considered
- [Martin Fowler: SDD Tools](https://martinfowler.com/articles/exploring-gen-ai/sdd-3-tools.html) — Anti-patterns (over-specification, spec drift)
- [Addy Osmani: AI Coding Workflow](https://addyosmani.com/blog/ai-coding-workflow/) — Spec-first, chunked execution, dual review

---

## For Implementation

| Field | Value |
|-------|-------|
| **Project** | `packages/mcp-ts-engineer` |
| **Workspace** | `-w packages/mcp-ts-engineer` |
| **Primary File** | `.claude/commands/issue-shape.md` |

**To implement:**
```
/issue-implement {number}
```
