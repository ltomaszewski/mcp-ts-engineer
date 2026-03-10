# mcp-ts-engineer Improvement Plan

Based on research from industry success stories, battle-tested failure modes, and gap analysis against the current pipeline. **Prioritized by quality impact.** Cost and speed are secondary — the pipeline can run overnight.

---

## Current State

The pipeline already implements the **#1 winning pattern** — spec-driven development with phased execution and quality gates — validated by Microsoft, Salesforce, Google, Airbnb, and Loveholidays.

```
todo_reviewer → todo_code_writer → finalize → pr_reviewer → pr_fixer
(DRAFT→IN_REVIEW)  (IN_REVIEW→READY)  (READY→IMPLEMENTED)
```

Existing strengths:
- Spec-first workflow (matches GitHub Spec Kit, AWS Kiro patterns)
- Multi-agent orchestration with specialized sub-capabilities
- Fresh context per step (prevents context pollution)
- Incremental phased execution with per-phase audit
- Cost tracking and budget enforcement
- Structured logging with auto-redaction

**Design principle for improvements:** Quality is the top priority. Speed and cost are secondary — the pipeline can run overnight. Every tool choice, execution mode, and threshold below optimizes for catching more issues, not for running faster or cheaper.

---

## Cross-Cutting Architectural Patterns

These patterns apply to ALL improvements below. They are not separate items — they are constraints that every improvement must follow.

### A. Configuration Centralization

All quality thresholds MUST live in `ts-engineer.config.json` (via `ProjectConfig`), not hardcoded in source. Every threshold mentioned below has a sensible default but is overridable per-project:

```typescript
// ts-engineer.config.json
{
  "quality": {
    "mutation": { "break": 60, "grades": { "A": 80, "B": 70, "C": 60, "D": 50 } },
    "security": { "block_on_critical": true, "block_on_secrets": true, "max_high_before_block": 3 },
    "supply_chain": { "levenshtein_distance": 2, "min_weekly_downloads": 100, "min_age_days": 30 },
    "test_quality": { "min_assertion_density": 2, "mock_heavy_threshold": 0.6, "block_on_tautological": false, "block_on_weakened_assertions": false, "slow_test_threshold_ms": 5000 },
    "performance": { "enabled_patterns": ["n_plus_one", "unbatched_async", "missing_pagination", "sync_io"] },
    "context": { "max_depth": 2, "max_context_tokens": 50000, "graph_storage_path": ".mcp-ts-engineer/symbol-graph.json" },
    "review": { "max_review_fix_loops": 3, "convergence_issue_threshold": 2, "pr_fixer_budget_per_loop": 0.50, "auto_fixable_categories": ["style", "lint", "test_gaps", "naming", "dead_code", "imports", "types"] },
    "observability": { "trace_retention_days": 30, "max_trace_size_mb": 100 },
    "data_retention": { "max_session_reports": 100, "max_metrics_mb": 50, "max_lessons_lines": 200 }
  },
  "tools": {
    "versions": { "semgrep": ">=1.60", "gitleaks": ">=8.18", "stryker": ">=9.0", "knip": ">=5.0" },
    "npm_high_impact_version": "1.12.0"
  }
}
```

### B. Schema Versioning

Every persisted data structure (session reports, quality metrics, agent traces, lessons learned) MUST include a `schema_version: number` field. A shared `migrateSchema(data, fromVersion, toVersion)` utility handles forward migration. Old data that cannot be migrated is logged and skipped, never silently misinterpreted.

### C. Circuit Breaker Pattern for External Tools

All external tool integrations (Stryker, Semgrep, Gitleaks, dependency-cruiser, knip, ts-morph) use a shared `ToolRunner<TResult>` with:
- `canRun(): boolean` — checks if tool is installed/available
- `run(): Promise<TResult>` — executes with timeout
- Retry with backoff (max 2 retries)
- Circuit breaker: if a tool fails 3 times in a session, mark unavailable and log warning
- **Mandatory tools** (Semgrep, Gitleaks, Stryker) must be installed (checked at startup). Runtime failures degrade gracefully after retries.
- **Optional tools** skip silently if not installed.

- **Version compatibility:** `ToolRunner.canRun()` checks not just installation but version compatibility against `tools.versions` in config. Prevents silent breakage from auto-updates.
- **Mandatory-unavailable escalation:** If a mandatory tool hits the circuit breaker (3 failures) and becomes unavailable, the step status escalates to `warn` (default) or `fail` (if `quality.security.strict_mode: true`). This makes the ambiguity between "mandatory" and "degraded" explicit and configurable.

This pattern prevents both: (a) pipeline deadlocks from transient failures, and (b) silently skipping critical scanners because they weren't installed.

**Estimated effort:** 2 days (built in Phase 1, week 1, before first consumers).

### D. Prompt Injection Sanitization

The pipeline ingests spec files (Markdown) and issue content — both are attacker-controllable in public repos. Before any external content is interpolated into agent prompts, a sanitization layer runs:

1. **Pattern detection:** Flag instruction overrides ("ignore previous instructions"), system prompt references, tool-calling directives, and shell command injections embedded in Markdown
2. **Content boundary enforcement:** External content is wrapped in clearly delimited blocks (`<user-spec>...</user-spec>`) that the agent prompt explicitly instructs to treat as data, not instructions
3. **Inter-step sanitization:** When planner output or engineering step output is fed into subsequent prompts, apply the same content boundary enforcement using `<step-output>...</step-output>` blocks. Prevents injection payloads propagating from step 1 output to step 2 prompt.
4. **Tool-call scope validation:** After each engineering step, validate that:
   - File modifications are within the expected scope (files listed in the phase plan)
   - Tool calls use only allowed tool names per step type (e.g., engineering steps may call `Read`, `Write`, `Edit`, `Bash`; audit steps may only call `Read`, `Grep`, `Glob`)
   - Tool arguments don't reference paths outside the project root or known sensitive paths (`~/.ssh`, `~/.aws`, `/etc`)
   - For audit steps, verify no file modifications occurred
   - Lightweight guard against prompt injection escalating to tool-call hijacking
5. **Scanner configuration lockdown:** Before running Semgrep/Gitleaks, verify that no `.semgrepignore`, `.gitleaksignore`, or `.semgrep/` directories were created or modified by the engineering step. If detected, remove them before scanning and log a warning. Prevents injected content from disabling security scanners via ignore files.
6. **Integration:** Applied in `todo_reviewer`, `todo_code_writer`, and `pr_reviewer` before prompt construction. Inter-step sanitization applied at all step boundaries.

This does not fully prevent sophisticated attacks but raises the bar significantly and makes attacks detectable in traces.

**Estimated effort:** 2 days (built in Phase 1, applies to existing capabilities).

### E. Unified Symbol Graph (Shared TypeScript Analysis Foundation)

Items 2.4, 2.5, 3.6, and the existing codemap system all require the same core data: what symbols exist, how files connect, and what depends on what. Rather than maintaining four separate systems (static markdown codemaps, Pattern E's ts-morph wrapper, 2.5's verification queries, 3.6's context assembly), **build one symbol graph that serves all consumers.**

This approach is validated by production systems: [Aider's repo map](https://aider.chat/2023/10/22/repomap.html) (tree-sitter + NetworkX PageRank + disk caching), [Meta Glean](https://engineering.fb.com/2024/12/19/developer-tools/glean-open-source-code-indexing/) (native compiler per language + incremental indexing + derived facts), [Sourcegraph SCIP](https://sourcegraph.com/blog/announcing-scip-typescript) (TypeScript compiler + cross-repo symbol resolution), and [SymDex](https://github.com/husnainpk/SymDex) (per-repo SQLite + call graph edges). All use the same pattern: **native compiler extracts facts → graph stores relationships → consumers query the graph for their specific needs.**

**Why ts-morph over tree-sitter:** tree-sitter parses syntax in milliseconds but cannot resolve imports, follow type aliases, or find cross-file references. ts-morph wraps the TypeScript compiler API and provides `findReferences()`, type-aware import resolution, and full type signatures. [Meta Glean explicitly uses native compilers](https://engineering.fb.com/2024/12/19/developer-tools/glean-open-source-code-indexing/) for semantic accuracy, validating this choice. Aider uses tree-sitter because it supports 40+ languages — we only need TypeScript.

```
src/capabilities/shared/ts-analysis/
├── project-loader.ts         # ts-morph Project initialization with caching
├── import-resolver.ts        # Dependency-traced file resolution (configurable depth)
├── symbol-table.ts           # Extract public API surface (exports + signatures)
├── symbol-graph.ts           # Build and persist the unified symbol graph
├── graph-renderer.ts         # Render graph → codemap markdown (replaces AI-driven codemap updater)
├── context-assembler.ts      # Task-scoped context assembly from graph (replaces static codemap loading)
├── __tests__/
└── index.ts
```

#### The Symbol Graph

The graph is the single source of truth for codebase structure. Codemaps become a **rendered view** of the graph — deterministic, not AI-generated.

```typescript
interface SymbolGraph {
  schema_version: 1
  project: string
  updated_at: string
  build_duration_ms: number
  files: Record<string, FileNode>
}

interface FileNode {
  path: string
  hash: string                    // SHA-256 of file content — for incremental updates
  exports: SymbolDef[]
  imports: ImportEdge[]
  lines: number
  kind: 'source' | 'test' | 'config' | 'type-only'
}

interface SymbolDef {
  name: string
  kind: 'function' | 'class' | 'type' | 'interface' | 'const' | 'enum'
  line: number
  signature?: string              // e.g., "(input: string) => Result"
  jsdoc?: string                  // One-liner, omitted if stale (see JSDoc staleness heuristic)
  exported: boolean
  references?: ReferenceEdge[]    // Populated on demand, not in base graph
}

interface ImportEdge {
  from_file: string
  symbols: string[]
  is_type_only: boolean
}

interface ReferenceEdge {
  symbol: string
  defined_in: string
  used_at: Array<{ file: string, line: number }>
}
```

**Storage:** JSON file at `.mcp-ts-engineer/symbol-graph.json`. JSON is sufficient for <10K files ([SymDex uses SQLite](https://github.com/husnainpk/SymDex) for 12-language cross-repo support — overkill for single-language projects). If performance becomes an issue at scale, the schema migrates to SQLite without changing consumers.

#### Incremental Updates (Critical)

Every production system uses file-hash-based incremental processing ([Cursor uses Merkle trees](https://towardsdatascience.com/how-cursor-actually-indexes-your-codebase/), [GitHub stack graphs](https://github.blog/open-source/introducing-stack-graphs/) reprocess only changed files, [Meta Glean](https://engineering.fb.com/2024/12/19/developer-tools/glean-open-source-code-indexing/) indexes incrementally). Full reindex per change is not viable.

```
On graph build/update:
1. Read existing graph from disk
2. For each source file: compute SHA-256, compare to stored hash
3. Only re-parse files where hash differs (or file is new)
4. For deleted files: remove their FileNode and clean up dangling references
5. For changed files: re-extract exports/imports, update edges
6. Write updated graph to disk
```

**Project lifecycle per invocation:** The ts-morph Project is initialized once per `todo_code_writer` invocation. After each phase, refresh modified source files via `project.refreshSourceFile()` and update the affected subgraph. If file count changed (new files added/deleted), re-initialize the project. 2.4's cached analysis is pinned for the duration of a single invocation to avoid race conditions. Memory guard: if Project exceeds configurable memory threshold, fall back to per-analysis initialization.

#### Codemap Rendering (Replaces AI-Driven Codemap Updater)

The current `finalize_codemap_step` uses an AI agent ($3.00 budget) to read files and rewrite markdown codemaps. This is replaced by a **deterministic renderer** that projects the symbol graph into the existing codemap format:

```
graph-renderer.ts:
1. Read symbol graph
2. Group files by area (using config-defined area mappings or directory heuristics)
3. For each area, render:
   - Directory tree (max 3 levels, same as current codemaps)
   - Key files table (sorted by export count + import count)
   - Dependencies (internal workspace deps + key external deps)
   - Entry points
4. Write to .claude/codemaps/{area}.md
5. Keep each codemap < 200 lines (same constraint as current)
```

**Benefits over AI-driven codemaps:**
- **Deterministic:** Same graph always produces same codemap — no AI hallucination risk
- **Free:** No AI cost ($0 vs $0.50-$3.00 per finalize run)
- **Fast:** Milliseconds vs 30-60 seconds for AI codemap generation
- **Accurate:** Compiler-accurate symbols, not AI-interpreted

#### Task-Scoped Context Assembly

Replaces static codemap loading with dynamic, task-relevant context. Inspired by [Aider's repo map](https://aider.chat/docs/repomap.html) but using **distance-based ranking from seed files** instead of PageRank.

[Aider's PageRank breaks at scale](https://github.com/Aider-AI/aider/issues/2405) — utility files dominate rankings regardless of task relevance. In our pipeline, we always know the seed files (from the spec, from changed files), so simple graph traversal outperforms global ranking:

```
context-assembler.ts:
1. Identify seed files (from spec targets, phase plan, or changed files)
2. BFS from seeds through import graph, depth = quality.context.max_depth (default 2)
3. Score each discovered file: closer = higher rank, more import paths from seeds = higher rank
4. Extract symbols from top-ranked files up to quality.context.max_context_tokens budget
5. Render as markdown context for agent prompt
```

**File-count degradation strategy (configurable):**

| File Count | Strategy | Depth | Notes |
|-----------|----------|-------|-------|
| <5,000 | Full analysis | 2 levels | Complete dependency tracing + symbol table |
| 5,000–10,000 | Reduced depth | 1 level | Only direct imports, skip transitive deps |
| >10,000 | Changed-files-only | 0 levels (target files + direct imports) | Warn user. Only trace from files in the phase plan. |

#### Consumers of the Symbol Graph

| Consumer | What It Reads | When |
|----------|--------------|------|
| **2.4 Codebase Archaeology** | Full graph: modules, exports, dependency adjacency, complexity | Once per spec/feature — cached analysis |
| **2.5 Verification** | Reference edges, dead exports, circular deps | After each phase — validation gate |
| **3.6 Deep Context Loading** | Task-scoped symbol slice via context assembler | Before each engineering phase |
| **Codemap rendering** | Area-grouped file summaries | During `finalize` — replaces AI codemap step |
| **2.3b Advanced metrics** | Scope-aware AST via ts-morph (shared Project instance) | After Pattern E completes |
| **`pr_reviewer`** | Full codemaps (rendered from graph) via `loadProjectContext()` | During review phases |

#### Key Capabilities

- **Abstraction layer:** Consumers depend on a `CodeAnalysis` interface (`resolveImports()`, `extractSymbols()`, `findReferences()`, `detectCircularDeps()`, `getGraph()`, `assembleContext()`), not on ts-morph directly. The ts-morph implementation is the default provider. This allows future migration to TypeScript Language Server Protocol or oxc-parser without touching consumers.
- **Import resolver:** Given target files, resolve the full import tree (configurable depth). Handles tsconfig paths, barrel re-exports, and `package.json` exports fields. **Dynamic import detection:** When `import()` or `require()` expressions are found, log a warning listing them as "unresolved dynamic edges." Not followed (requires runtime analysis) but surfaced in traces.
- **Symbol table:** Extract all exported functions/types/classes with full type signatures AND JSDoc summaries. **JSDoc staleness heuristic:** If a JSDoc comment mentions parameter names or types that do not match the actual function signature, the JSDoc is omitted and a warning is logged. Stale JSDoc in the engineering prompt is worse than no JSDoc.
- **Path resolution alignment:** Integration test suite verifies ts-morph and knip agree on module resolution. Required test fixtures: (a) relative imports, (b) tsconfig path aliases, (c) barrel re-exports including type-only re-exports, (d) `package.json` exports field mapping.
- **Fallback behavior:** If ts-morph cannot load a project (malformed tsconfig, unsupported compiler options), consumers fall back to regex-based heuristics (import/export regex parsing). Lower quality but preserves pipeline continuity. Fallback activation is logged and surfaced in traces.

**Version pinning:** Pin `ts-morph` to a specific major version (e.g., `27.x`, not `^27.0.0`) in `package.json`. ts-morph wraps TypeScript compiler internals that change between major releases. Treat upgrades as a discrete coordinated task with integration tests verifying all consumers.

**Estimated effort:** 6–8 days. Saves 8–12 days across 2.4, 2.5, 3.6, and codemap maintenance by eliminating duplicate infrastructure and replacing AI-driven codemap generation with deterministic rendering.

---

## Tier 1: Critical (Address First)

### 1.1 Supply Chain Validator

**Gap:** No validation that AI-added npm packages actually exist or are safe. 20% of AI-generated code recommends non-existent packages (slopsquatting).

**Implementation: New internal step `dependency_validator_step`**

Add as a post-engineering step in `todo_code_writer` (after each phase) and in `finalize`.

| Component | Approach |
|-----------|----------|
| **Package existence** | Query `https://registry.npmjs.org/{name}` — 404 = hallucinated |
| **Typosquatting detection** | Compare new deps against `npm-high-impact` package list (~15K popular packages) using `fastest-levenshtein` (20M weekly downloads). Flag if edit distance ≤ 2 from a popular package |
| **Age/popularity check** | Query `https://api.npmjs.org/downloads/point/last-week/{name}` — flag packages with <100 weekly downloads or created <30 days ago |
| **Provenance** | Run `npm audit signatures` — flag packages without verified attestations |
| **Diff detection** | Parse `git diff package.json` to identify newly added dependencies only |
| **Dependency confusion** | When a newly added unscoped package name matches a scoped package already in the monorepo workspace (e.g., adding `config-utils` when `@company/config-utils` exists), flag for review. Simple string comparison against existing `package.json` workspaces |

**npm-high-impact list management:** `npm-high-impact` is a published npm package (wooorm/npm-high-impact, MIT). Install as a pinned dependency (`"npm-high-impact": "1.12.0"` — exact version, not range) and use its exported list. Pin the version in `tools.npm_high_impact_version` config. Stale cache (>30 days since last `npm install`) triggers a warning but does not block. This prevents supply-chain attacks against the detection list itself via standard npm lockfile integrity (SHA-512 in `package-lock.json`).

**New files:**
```
src/capabilities/shared/steps/dependency-validator/
├── dependency-validator.step.ts
├── dependency-validator.schema.ts
├── npm-registry.ts          # Registry API client
├── typosquatting-detector.ts # Levenshtein comparison
└── __tests__/
```

**Integration points:**
- `todo_code_writer`: Run after each phase's engineering step, before phase audit
- `finalize`: Run as first step before audit
- `audit_fix`: Include in per-project audit loop

**Output schema:**
```typescript
{
  schema_version: 1
  status: 'pass' | 'warn' | 'fail'
  new_packages: Array<{
    name: string
    exists: boolean
    weekly_downloads: number
    age_days: number
    typosquatting_risk: { similar_to: string, distance: number } | null
    dependency_confusion_risk: { matches_scoped: string } | null  // e.g., matches @company/config-utils
    provenance_verified: boolean
  }>
  blocked_packages: string[]  // Non-existent or high-risk
}
```

**Estimated effort:** 3–5 days

---

### 1.2 Security Scanner Step

**Gap:** No SAST/DAST tooling. 45% of AI-generated code contains security flaws (Veracode). AI is 2.74x more likely to introduce XSS than humans.

**Implementation: Multi-layer `security_scan_step`**

Quality-first means multiple complementary layers — each catches different vulnerability classes.

| Layer | Tool | Purpose | Integration | Catches What Others Miss |
|-------|------|---------|-------------|--------------------------|
| 1 | **@nodesecure/js-x-ray** | In-process AST analysis — unsafe regex, obfuscated code, dangerous imports | Direct npm import, zero CLI. **Node version:** v11+ requires Node ≥24. Decision: if the project's runtime target includes Node 20/22, pin to v10.x; if Node 24+ is the actual minimum (current dev environment is Node 24), use latest. Document the chosen approach in `tools.js_x_ray_version` config. | Obfuscation, eval(), dynamic require() |
| 2 | **Security lint rules** | Static pattern-based security rules | The project uses Biome, not ESLint. **Phase 1 (regex bridge):** Ship with regex-based detection for the 3 most critical patterns (eval detection, hardcoded credential patterns, non-literal RegExp). **Phase 2 (ts-morph upgrade):** After Pattern E lands, replace regex rules with scope-aware ts-morph AST analysis for higher precision and add detect-csrf, timing attack patterns. This avoids a temporal dependency gap — Layer 2 is functional in Phase 1 and enhanced in Phase 2. | Hardcoded credentials, non-literal regex, timing attacks |
| 3 | **Semgrep** (OSS) | Deep SAST — OWASP rules, taint tracking, cross-function analysis | `semgrep --config=auto --json` CLI | Cross-function data flow, injection chains |
| 4 | **Gitleaks** | Secret detection in committed code | `gitleaks detect --source=. --report-format=json` | API keys, tokens, passwords in source |
| 5 | **npm audit** | Known vulnerability detection in dependencies | `npm audit --json` (already partially in `audit_fix`) | CVEs in transitive dependencies |
| 6 | **TypeScript strict mode** | Type-safety as security layer | Already integrated via build step | Type confusion, null reference |

**Scanner plugin architecture:** Instead of hardcoded scanner files, define a `Scanner<TResult>` interface with `name`, `canRun()`, `run(files)`, and `parseOutput()`. Register scanners at startup via a `ScannerRegistry`. This makes adding/removing scanners a registration-level change, not a code change. Performance anti-pattern detection (3.4) registers additional scanners into the same registry.

**Layered execution strategy:**
- Layers 1–2 (in-process): Always run, no external dependencies, fast
- Layers 3–4 (CLI): **Mandatory dependencies** — must be installed (checked at startup via `ToolRunner.canRun()`). Runtime failures degrade gracefully via circuit breaker pattern (see Cross-Cutting Pattern C). This is a quality-first pipeline; overnight execution makes installation requirements irrelevant.
- Layers 5–6: Already integrated, always run

**Blocking thresholds (configurable via `quality.security` in `ts-engineer.config.json`):**

| Condition | Action | Default |
|-----------|--------|---------|
| Any `critical` severity finding | **FAIL** — blocks commit | `block_on_critical: true` |
| Any entry in `secrets_found` | **FAIL** — blocks commit | `block_on_secrets: true` |
| `total_high > N` | **FAIL** — blocks commit | `max_high_before_block: 3` |
| `layers_skipped` includes mandatory layer | **WARN** — degrades scan status to `warn` | Mandatory: Semgrep, Gitleaks |
| Only `medium`/`low` findings | **PASS** with findings in report | — |

Without explicit blocking thresholds, the scanner is advisory, not a gate. These thresholds make it a true quality gate.

**Scanner output health checks:** Each scanner reports the number of files it analyzed (`files_scanned`). If that count diverges from the expected set of changed files by >50%, the layer is flagged as `degraded` (partial output, not full failure). This prevents silent partial scans (e.g., Semgrep OOM on a large file) from masking vulnerabilities.

**New files:**
```
src/capabilities/shared/steps/security-scan/
├── security-scan.step.ts
├── security-scan.schema.ts
├── scanners/
│   ├── js-x-ray.scanner.ts      # In-process AST analysis
│   ├── security-lint.scanner.ts  # eslint-plugin-security rules
│   ├── semgrep.scanner.ts        # Wraps semgrep CLI
│   ├── gitleaks.scanner.ts       # Wraps gitleaks CLI
│   └── npm-audit.scanner.ts      # Wraps npm audit
├── severity-aggregator.ts        # Combine findings across layers
└── __tests__/
```

**Integration points:**
- `todo_code_writer`: Run in-process scanners (layers 1–2) after each phase
- `finalize`: Run ALL layers after audit step, before test step
- `pr_reviewer`: Add as 6th parallel review agent with full scanner output
- `audit_fix`: Include in per-project audit loop

**Output schema:**
```typescript
{
  schema_version: 1
  status: 'pass' | 'warn' | 'fail'
  layers_executed: string[]        // Which scanners actually ran
  layers_skipped: string[]         // CLI tools not installed
  findings: Array<{
    source: 'js-x-ray' | 'security-lint' | 'semgrep' | 'gitleaks' | 'npm-audit'
    severity: 'critical' | 'high' | 'medium' | 'low'
    rule_id: string
    file: string
    line: number
    message: string
    fix_suggestion?: string
  }>
  secrets_found: Array<{ file: string, line: number, rule: string }>
  npm_vulnerabilities: Array<{ package: string, severity: string, advisory: string }>
  scanner_config_tampering: boolean  // true if .semgrepignore/.gitleaksignore were detected and removed
  files_scanned_per_layer: Record<string, number>  // files analyzed by each layer, for health check
  total_critical: number
  total_high: number
  total_medium: number
}
```

**IDOR / authorization anti-pattern rules (v1 deliverable):** Ship 5-10 custom Semgrep rules targeting common Node.js/NestJS authorization patterns: missing `@UseGuards()` on controllers, direct parameter-to-query mapping without ownership checks (e.g., `findById(req.params.id)` without verifying `req.user`), missing `where: { userId }` clauses in multi-tenant queries. These are pattern-matching heuristics, not full DAST, but they catch the most common IDOR patterns that SAST systematically misses. Full DAST (ZAP) remains a v2 consideration.

**Temporary file handling:** Security scanners analyze changed files as tracked by `git diff`. Temporary files created during build/test (e.g., `.stryker-tmp/`, `build/`, `coverage/`) are excluded by matching against `.gitignore` patterns. If a scanner reports findings in gitignored paths, those findings are filtered from the output.

**Quality rationale:** Single-tool scanning catches ~60% of vulnerabilities. Multi-layer scanning with complementary tools catches ~85%+ because each tool specializes in different vulnerability classes. The overhead is acceptable since overnight execution is fine.

**Implementation split:**

- **1.2a: In-process scanners (4-5d, no external dependencies).** js-x-ray + regex-based security lint rules (Phase 1 bridge) + npm audit + severity aggregator + scanner plugin registry (`ScannerRegistry` with `Scanner<TResult>` interface). Ships in Phase 1.
- **1.2b: CLI scanners (6-8d, requires Semgrep/Gitleaks installation).** Semgrep wrapper (Python CLI, requires installation documentation) + Gitleaks wrapper (Go binary) + custom IDOR Semgrep rules (5-10 rules) + scanner config lockdown + scanner health checks. Ships in Phase 1, can slip to Phase 2 without blocking downstream items.

**Installation note:** Semgrep is a Python CLI (`pip install semgrep` or `brew install semgrep`), not an npm package. Gitleaks is a Go binary. Both require installation documentation and CI setup — budgeted in 1.2b. The `ToolRunner` circuit breaker handles runtime absence gracefully, but the plan designates them as "mandatory" — meaning they must be installed for the pipeline to reach full security coverage. If absent, the pipeline runs with degraded security scanning (in-process layers only) and surfaces a persistent warning.

**Estimated effort:** 10-13 days total (1.2a: 4-5d + 1.2b: 6-8d)

---

## Tier 2: High Priority

### 2.1 PR as the Human Gate (Autonomous Pipeline + AI Self-Review + Auto-Fix)

**Gap:** No structured quality enforcement before PR reaches a human reviewer. The pipeline produces code, but doesn't maximize the quality of the PR that the human ultimately sees.

**Principle:** The pipeline runs **fully autonomously** — plan, implement, test, audit, security scan, mutation test, open PR, self-review, auto-fix everything automatable. The human reviews only the final, pre-cleaned result. No mid-pipeline pauses.

**Implementation: Three-layer autonomous quality loop before human review**

**Layer 1: AI plan validation (pre-implementation)**

New internal `plan_validator` step within `todo_code_writer` — runs after the planner, before engineering steps. AI validates its own plan:

- Cross-references planned file modifications against actual file dependencies
- Validates that the plan addresses all spec requirements
- Checks for architectural anti-patterns (circular deps, layer violations)
- Rejects and re-plans if validation fails (up to 3 attempts)

This is NOT a human checkpoint — it's an AI self-check that prevents bad plans from entering execution.

```typescript
// Internal step, not a separate capability
{
  plan_valid: boolean
  issues_found: string[]
  re_planned: boolean        // true if planner was called again
  attempt: number            // 1-3
}
```

**Layer 2: `pr_reviewer` + `pr_fixer` auto-fix loop**

After `finalize` commits and opens the PR, run `pr_reviewer` → `pr_fixer` in a loop until no more auto-fixable issues remain:

```
finalize (commit + push + open PR)
  → pr_reviewer (comprehensive AI review)
  → pr_fixer (auto-fix all fixable issues: style, lint, test gaps, naming, docs)
  → pr_reviewer (re-review after fixes)
  → [repeat until clean OR max iterations reached]
  → PR ready for human
```

**Loop termination guarantees:**
- **Max iterations:** `max_review_fix_loops: 3` (configurable). After 3 iterations, remaining issues are added to `remaining_review_items` for the human.
- **Convergence detection:** Track issue fingerprints (rule_id + file + line) across iterations. If the same issue reappears in consecutive iterations, mark it as "unfixable by AI" and stop retrying it.
- **Cost cap:** Each iteration is an AI call. Total loop cost is bounded by `max_review_fix_loops × pr_fixer_budget`.
- **Build-check gate:** The fix loop operates on a temporary branch (`fix-loop/{session-id}`). After each `pr_fixer` iteration, run a lightweight build+test check. If the fix broke the build, discard the temporary branch and terminate the loop early — no commit revert needed. On successful loop completion, fast-forward merge the temporary branch to the PR branch. This eliminates revert-failure risk entirely and makes the loop's state inspectable via `git log`. Issues from a discarded fix iteration are explicitly added to `remaining_review_items` with a note: "auto-fix attempted but broke build — requires human attention."

**Auto-fix classification (configurable via `quality.review.auto_fixable_categories`):**

| Auto-fixable (AI handles, configurable) | Human-only (flagged in PR) |
|---------------------------|---------------------------|
| Code style violations | Architecture decisions |
| Missing error handling | Business logic correctness |
| Test gaps (low mutation score) | Security trade-offs |
| Import ordering | Performance vs. readability trade-offs |
| Naming inconsistencies | API design choices |
| Missing type annotations | Scope creep / over-engineering |
| Dead code removal | Domain-specific edge cases |

**Layer 3: Risk classification in PR description**

Attach a structured risk summary to the PR description so the human reviewer knows where to focus:

```typescript
{
  risk_level: 'low' | 'medium' | 'high'
  risk_factors: string[]
  modules_affected: string[]
  new_dependencies: string[]
  security_scan_summary: string
  mutation_score: number
  quality_grade: string
  auto_fixes_applied: number
  remaining_review_items: string[]  // What the human should focus on
}
```

**The human's job becomes:** Review the `remaining_review_items` list, verify architecture/business decisions, approve or request changes. Everything else was already handled.

**Quality workflow:**
```
/issue-implement (runs overnight, fully autonomous)
  → todo_reviewer (spec validation)
  → todo_code_writer (plan validation → phased implementation → per-phase quality gates)
  → finalize (audit + security + mutation + semantic + commit + push + open PR)
  → pr_reviewer → pr_fixer loop (auto-fix everything possible)
  → PR with risk summary ready for human review in the morning
```

**Estimated effort:** 5–7 days (plan validator: 2–3d, pr_reviewer/pr_fixer loop: 2–3d, risk summary: 1d)

---

### 2.2 Cross-Session Learning

**Gap:** Each invocation starts fresh. If `todo_code_writer` fails phase 3 due to a specific pattern, next invocation fails the same way.

**Implementation: Session report persistence + lessons learned loader**

**Phase 1: Session reports (write)**

After each capability completes, persist a structured report to disk:

```
.mcp-ts-engineer/
├── session-reports/
│   ├── 2026-03-10T14-30-00_todo_code_writer_success.json
│   └── 2026-03-10T15-00-00_todo_code_writer_failed.json
└── lessons-learned.md  # Human-readable, agent-readable
```

Report schema:
```typescript
{
  schema_version: 1
  capability: string
  timestamp: string
  status: 'success' | 'failed'
  spec_path: string | null
  phases_completed: number
  failure_phase: number | null
  failure_reason: string | null
  files_modified: string[]
  patterns_that_worked: string[]    // e.g., "used vi.mock for SDK"
  patterns_that_failed: string[]    // e.g., "circular import in cost module"
  recommendations: string[]         // e.g., "split cost.types.ts before modifying"
  phase_results: Array<{ phase: number, status: string, files: string[] }>  // For resume support
}
```

**Phase 2: Lessons learned loader (read)**

When `todo_code_writer` starts, load recent session reports for the same project/spec and inject relevant lessons into the planner prompt:

```typescript
// In planner prompt:
`## Lessons from Previous Sessions
${loadRecentLessons(specPath, { maxAge: '7d', maxEntries: 5 })}
`
```

**Phase 2.5: Pipeline resume support (separate work item, 3–4 days)**

Add a `resume_from_phase` optional parameter to `todo_code_writer`. When a run fails at phase N, phases 1 through N-1 are already committed. The `phase_results` array in the session report captures what was completed. A subsequent invocation with `resume_from_phase: N` skips completed phases and starts from the failed one, reconstructing planner context and cumulative file lists from committed git state. This avoids re-executing expensive engineering phases that already succeeded.

**Note:** This is a separate work item from session report persistence because state reconstruction (parsing git history to rebuild planner context) is a distinct engineering challenge. Can be deferred if Phase 1-2 of cross-session learning ship first.

**Data lifecycle management:** Session reports, quality metrics (3.1), and lessons-learned all accumulate on disk. A shared `DataRetention` module enforces configurable retention policies:
- Session reports: keep last 100 reports per project, delete older ones (configurable via `quality.data_retention.max_session_reports: 100`)
- Quality metrics NDJSON: rotate at 50MB, keep last 2 rotated files (configurable via `quality.data_retention.max_metrics_mb: 50`)
- Lessons-learned.md: cap at 200 lines, oldest entries trimmed
- Cleanup runs at session start (not during pipeline execution) to avoid I/O during active work

**Phase 3: CLAUDE.md auto-append (optional)**

For cross-project persistent learnings, append proven patterns to the project's `CLAUDE.md` memory section:

```markdown
## Learned Patterns (auto-generated)
- When modifying `src/core/cost/`, always update cost.types.ts first
- The `echo_agent` capability requires `bypassPermissions: true` in tests
```

**Estimated effort:** 5–7 days

---

### 2.3 Test Quality Assessment + Mutation Testing

**Gap:** Coverage quantity tracked but not quality. AI tests can be "green while fragile" — hitting coverage without testing meaningful behavior (CodeScene). **Mutation testing is the only objective way to measure whether tests actually verify behavior.**

**Implementation: Both static metrics AND mutation testing — mandatory**

**Layer 1: Static test quality metrics**

Compute from existing Vitest output and source code:

| Metric | How | Threshold | Quality Signal |
|--------|-----|-----------|----------------|
| **Assertion density** | Count `expect()` calls per test / total tests | ≥2 assertions/test | Tests actually check things |
| **Test-to-code ratio** | Lines of test code / lines of source code | ≥0.8 | Sufficient test coverage depth |
| **Branch vs line gap** | `(line_coverage - branch_coverage)` | Gap <15% | Tests cover decision points, not just happy paths |
| **Empty test detection** | Tests with 0 `expect()` calls | 0 allowed | No placeholder tests |
| **Snapshot-only tests** | Tests that only use `toMatchSnapshot()` | Flag as low quality | Snapshots don't verify behavior |
| **Mock-heavy ratio** | Tests where `vi.fn()`/`vi.mock()`/`vi.spyOn()` call sites exceed `expect()` call sites | Flag if ratio >60% (configurable via `quality.test_quality.mock_heavy_threshold`) | Over-mocking hides real behavior. Exclude integration test files. Allowlist for provider/external API modules. |
| **Boundary value coverage** | Tests with 0, null, undefined, empty string, max values | ≥1 boundary test per public function | Edge cases covered |
| **Test scope analysis** | Ratio of tests targeting exported/public functions vs. internal/private functions (AST analysis) | Flag if >80% of tests target non-exported functions | Proxy for "scenario-driven" — tests should verify public behavior, not implementation details |
| **Tautological assertion detection** | AST check for: (a) `expect(true).toBe(true)` / `expect(literal).toBe(literal)`, (b) try/catch encompassing >80% of test body where the catch block contains no `expect()` or only `expect(error).toBeDefined()` — legitimate patterns allowlisted: `expect(fn).toThrow()`, `expect(promise).rejects.toThrow()`, `expect(error).toBeInstanceOf(SpecificError)`, (c) assertions against mock return values (e.g., mock returns `42`, test asserts result is `42`), (d) `toHaveBeenCalled()` without corresponding `toHaveBeenCalledWith()` on the same mock in the same test — note: `toHaveBeenCalledTimes(n)` for any `n` (including 0) is allowed as it verifies invocation count, and `toHaveBeenCalledWith()` alone is allowed as it verifies arguments | 0 tautological assertions allowed (configurable: `quality.test_quality.block_on_tautological`; default `false` for first 30 days, flip to `true` after calibration via 3.1 data) | Catches mutation testing gaming — distinguishes from legitimate assertion patterns |
| **Skipped test detection** | Count tests with `.skip`, `xit`, `xdescribe`, `it.todo`. Compare before/after each phase. | Increase in skipped tests treated same as test deletion — blocks phase | Prevents agents from skipping tests instead of deleting them (subtler form of same evasion) |
| **Test execution time tracking** | Record per-test-file execution time from Vitest JSON output (`duration` field). Flag test files exceeding `quality.test_quality.slow_test_threshold_ms` (default: 5000ms) | Flag as low quality | AI agents write unnecessarily slow tests (large loops, redundant async delays, full integration where unit suffices) |
| **Test description quality** | Flag generic `it()`/`test()` descriptions: `'test 1'`, `'works'`, `'should work correctly'`. Require descriptions containing a verb + domain concept | Flag as low quality | Addresses Salesforce finding that "engineers had to manually review AI-generated test intentions" |
| **Hardcoded expected value clustering** | At file level, count assertions where BOTH input and expected output are literal values with no variable derivation (e.g., `expect(fn(10, 20)).toBe(30)`). If >80% of a file's assertions use only literal inputs and literal expected values, flag the file as `gaming_risk` | Flag as low quality (file-level, not individual assertion) | Catches mutation testing gaming where the agent writes hyper-specific literal-in/literal-out tests that kill mutants without testing behavior |
| **Test scenario depth heuristic** | Count distinct function calls within a single test body (excluding setup/teardown). Tests with only 1 function call + 1 assertion = "unit-level"; tests with 3+ function calls in sequence = "scenario-level." Report the ratio in `test_scope.scenario_ratio` | Informational (no blocking) | Makes the absence of scenario-driven tests visible in the quality report without blocking the pipeline — addresses the CodeScene "scenario-driven" finding indirectly |
| **Test intent comment requirement** | Each test file should include a top-level JSDoc or comment block describing what scenarios the file covers. Flag as `low_quality` if absent | Flag as low quality (non-blocking) | Directly addresses Salesforce finding that "engineers had to manually review AI-generated test intentions" — makes test intent explicit |

**Layer 2: Mutation testing via Stryker Mutator (mandatory)**

Stryker Mutator with `@stryker-mutator/vitest-runner` (peerDependency vitest ≥2.0.0, project uses vitest ^4.0.18 — likely compatible per peerDependency bound; empirical verification required in Phase 0).

**Two execution modes:**

| Mode | When | Scope | Target |
|------|------|-------|--------|
| **Incremental** | Per-phase in `todo_code_writer` | Changed files only | Mutation score ≥70% |
| **Full** | In `finalize` | All files touched in spec | Mutation score ≥60% |

Programmatic API:
```typescript
import { Stryker } from '@stryker-mutator/core'
const stryker = new Stryker({
  testRunner: 'vitest',
  mutate: changedFiles,
  coverageAnalysis: 'perTest',
  concurrency: 4,
  incremental: true,          // Reuse previous results
  incrementalFile: '.stryker-cache/incremental.json',
  thresholds: {
    high: 80,
    low: 60,
    break: 60   // Fail if mutation score below 60% (higher bar for AI-generated code)
  }
})
const results: MutantResult[] = await stryker.runMutationTest()
const killed = results.filter(r => r.status === 'Killed').length
const mutationScore = killed / results.length
```

**Compatibility verification (REQUIRED before Phase 2):** Install `@stryker-mutator/vitest-runner@9.1.1` in the project, run mutation testing on the existing echo-agent tests, and confirm it works with vitest 4.0.18. Document the result. If it fails, fallback to either pinning vitest or using an alternative mutation framework. The `ToolRunner` circuit breaker (Pattern C) ensures runtime failures degrade gracefully, but installation compatibility must be verified upfront.

**Rollout strategy:** Mutation testing is the gold standard for test quality measurement but the Stryker/vitest toolchain is unverified. **Phase 1 (first 30 days):** Ship with `quality.mutation.enabled: false` (default). Use static metrics (assertion density, test-to-code ratio, branch-line gap, test deletion detection) as the v1 quality gate. **Phase 2 (after verification):** After Stryker compatibility is confirmed in Phase 0 and 30 days of static metric data is collected via 3.1, flip `quality.mutation.enabled: true`. This eliminates the risk of an unverified tool blocking the pipeline on day one while preserving the quality-first goal. Line coverage tells you "this code ran." Mutation testing tells you "if this code broke, a test would catch it." Without it, AI-generated tests can achieve 95% coverage while catching 0% of real bugs. Overnight execution makes the runtime cost irrelevant.

**Threshold calibration:** The `break: 60` threshold (configurable via `quality.mutation.break`) is set higher than industry typical (30-50%) because AI-generated code should meet a higher bar than human-authored code. All grade thresholds should be recalibrated after 30 days of data collection via quality regression tracking (3.1). **Interim override:** Before calibration data is available, specs can include `mutation_break_override: <number>` in frontmatter to override the default break threshold for that spec only. This prevents uncalibrated thresholds from blocking legitimate work while data is collected. Overrides are logged in quality metrics for post-hoc analysis.

**Mock-assertion cross-scope tracing:** The tautological assertion detector for pattern (c) — asserting against mock return values — traces mock setup in `beforeEach`/`beforeAll` to assertions in `it` blocks within the same `describe` scope. This is AST scope-walking within the same file, not full data flow analysis.

**Output schema:**
```typescript
{
  static_metrics: {
    assertion_density: number
    test_to_code_ratio: number
    branch_line_gap: number
    empty_tests: string[]
    snapshot_only_tests: string[]
    mock_heavy_tests: string[]
    boundary_value_coverage: number       // ratio of public functions with boundary tests
    test_scope: { exported_ratio: number, internal_ratio: number, scenario_ratio: number }
    tautological_assertions: Array<{ file: string, line: number, pattern: string }>
    skipped_tests: { count: number, added_this_phase: number }
    slow_tests: Array<{ file: string, duration_ms: number }>
    low_quality_descriptions: Array<{ file: string, test_name: string }>
    hardcoded_value_files: string[]           // files with >80% literal-in/literal-out assertions
    files_missing_intent_comment: string[]    // test files without top-level scenario description
  }
  schema_version: 1
  mutation_testing: {
    mutation_score: number           // 0.0–1.0
    mutants_total: number
    mutants_killed: number
    mutants_survived: number
    mutants_no_coverage: number
    survived_mutants: Array<{        // Actionable — these are the weak spots
      file: string
      line: number
      mutator: string                // e.g., "ConditionalExpression", "ArithmeticOperator"
      replacement: string
    }>
  }
  quality_grade: 'A' | 'B' | 'C' | 'D' | 'F'  // Composite score
}
```

**Quality grade calculation (strict AND — all conditions must be met; configurable via `quality.mutation.grades`):**
- A: mutation score ≥80% AND assertion density ≥3 AND no empty tests AND no tautological assertions AND no skipped tests added
- B: mutation score ≥70% AND assertion density ≥2 AND no tautological assertions
- C: mutation score ≥60% AND assertion density ≥1.5
- D: mutation score ≥50%
- F: mutation score <60% — **blocks finalize** (configurable via `quality.mutation.break`)

Note: Thresholds should be recalibrated after 30 days of data collection via quality regression tracking (3.1). The strict AND ensures no single metric can compensate for another — each measures a distinct quality dimension.

**Critical: Test deletion/weakening detection**

CodeScene specifically warns that a common AI agent shortcut is to **delete a failing test rather than fix it**, silently weakening the safety net. This must be detected:

| Check | How | Action |
|-------|-----|--------|
| **Test count regression** | Compare test count before/after each phase (`vitest --reporter=json` → `numTotalTests`) | Block if tests were removed without explicit spec instruction |
| **Assertion count regression** | Compare total `expect()` calls before/after | Warn if assertions decreased |
| **Test file deletion** | Diff `git status` for deleted `*.test.ts` files | Block — test files should never be deleted by AI |
| **Weakened assertions** | Detect `toEqual` → `toBeDefined` or `toStrictEqual` → `toEqual` downgrades | Configurable: `warn` (default) or `block` (via `quality.test_quality.block_on_weakened_assertions`). Auto-escalates to `block` when combined with mutation score drop ≥5 percentage points in the same phase (e.g., score drops from 75% to 69%) |

This check runs at the START of each phase (baseline) and END of each phase (comparison). If tests were deleted or weakened, the phase fails and must be re-run.

**Implementation split for parallelization:**

- **2.3a: Mutation testing + simple static metrics (6-8d, no Pattern E dependency).** Stryker integration, test deletion/weakening detection, assertion density, test-to-code ratio, branch-line gap, empty tests, snapshot-only tests, mock-heavy ratio, skipped test detection, test description quality, slow test detection. These use Vitest JSON output and regex/simple AST pattern matching (via `typescript-estree` parser — chosen for lightweight scope-unaware traversal).

- **2.3b: Advanced static metrics (5-7d, depends on Pattern E).** Tautological assertion detection with 4 sub-patterns and allowlists (requires scope-aware AST for beforeEach-to-it tracing), mock cross-scope tracing, hardcoded expected value clustering (requires data-flow analysis), test scope analysis (exported vs. internal ratio), test scenario depth heuristic, test intent comment check. These use `ts-morph` via the shared TS Analysis Foundation for scope-aware analysis.

This split preserves the Phase 2 parallelization strategy: 2.3a runs in parallel with Pattern E, while 2.3b runs after Pattern E completes.

**Total estimated effort:** 11-15 days (2.3a: 6-8d + 2.3b: 5-7d)

---

### 2.4 Codebase Archaeology Capability

**Gap:** No "understand existing code" capability before spec writing. The pipeline assumes someone writes a good spec, but the bottleneck is knowing what to build (Google).

**Existing infrastructure to build on:**
- `project-context-loader.ts` — already loads CLAUDE.md, rules, skills, knowledge base, codemaps
- `knip` — already in devDependencies for dead code detection
- `/issue-shape` spec — already drafted (DRAFT status) with 5-phase discovery workflow

**Implementation: New public capability `code_analyzer`**

| Feature | Approach |
|---------|----------|
| **Module summary** | Unified symbol graph (Pattern E) → read exports, imports, function signatures, complexity |
| **Dependency graph** | Symbol graph import edges (Pattern E) → build adjacency list → detect circular deps |
| **Complexity metrics** | Cyclomatic complexity via shared `ts-morph` Project (Pattern E) |
| **Business logic detection** | Multi-signal heuristic: files scored by (imports count × 0.3 + line count × 0.2 + test coverage × 0.3 + export analysis × 0.2). Export analysis: files that export primarily functions/classes (vs. types/constants) score higher. Directory naming boost: files under `domain/`, `services/`, `models/`, `features/` score higher. Infrastructure penalty: files under `middleware/`, `config/`, `routes/`, `guards/` score lower. This addresses the weakness where infrastructure files (routers, middleware) would otherwise rank highest. |
| **Entry point mapping** | Find exports from `index.ts` files, trace dependency chains |
| **Git history context** | `git log --follow` per module: `last_modified_by`, `change_frequency_30d`, `recent_commit_messages` (last 5). Partially addresses "doesn't understand WHY" by surfacing historical design context |

**Input:**
```typescript
{
  target: string          // Directory or file path
  depth: 'shallow' | 'deep'  // shallow = exports only, deep = full analysis
  focus?: string[]        // Specific modules to analyze
}
```

**Output:**
```typescript
{
  schema_version: 1
  modules: Array<{
    path: string
    exports: string[]
    imports: string[]
    complexity: number
    lines: number
    test_coverage: number | null
    last_modified_by: string | null
    change_frequency_30d: number
    recent_commit_messages: string[]
  }>
  dependency_graph: Record<string, string[]>
  circular_deps: string[][]
  entry_points: string[]
  high_complexity_files: string[]  // complexity > threshold
  summary: string                  // Human-readable analysis
}
```

**Integration:** Feed output into spec writing (both manual and `/issue-shape`). Could also be used by `todo_reviewer` to validate specs against actual codebase structure.

**Composition contract with 2.5 and 3.6 (via unified symbol graph):**
- **2.4 runs once per spec/feature** as input to spec writing, reading from the unified symbol graph (Pattern E) for module summaries, dependency adjacency, and complexity metrics
- **3.6 runs per engineering phase**, using the graph's context assembler to generate task-scoped context for the engineering prompt
- **2.5 runs after each phase** as a validation gate, querying reference edges in the graph and incrementally updating it with changes from the phase. Also triggers codemap re-rendering.

All three are **consumers** of the unified symbol graph (Pattern E) with distinct roles: 2.4 = understand before writing, 3.6 = context during writing, 2.5 = verify after writing + update graph + refresh codemaps. The graph is the shared coordination point.

**Error propagation contract:**
- **2.4 cache staleness:** Cache expires after 24 hours or on `git diff --stat` change detection (any file added/removed/modified since cache timestamp). Stale cache triggers re-analysis from the symbol graph.
- **3.6 context assembly failure:** If the graph's import resolver fails on specific files (e.g., syntax errors), fall back to target-files-only for those files. Other files in the phase continue with full tracing.
- **2.5 `fail` in `todo_code_writer`:** Triggers phase retry (not abort) with broken references included in the retry prompt context, giving the agent information about what to fix.
- **Pattern E unavailable (ts-morph load failure):** All three consumers fall back to regex-based heuristics (per Pattern E fallback behavior). Quality is degraded but pipeline continues. Static codemaps (if they exist from a previous successful run) are still loaded as a baseline.

**Note:** The existing `/issue-shape` spec (DRAFT) at `docs/specs/mcp-ts-engineer/todo/2026-02-28-spec-driven-feature-shaping.md` addresses the discovery phase. `code_analyzer` would power its Phase 2 (RESEARCH).

**Estimated effort:** 5–8 days (reduced from 7-10d by reusing shared TS Analysis Foundation)

---

### 2.5 Semantic Graph Verification for Refactoring Safety

**Gap:** No cross-file consistency verification beyond lint/types after multi-file changes. Multi-file refactoring is the #1 source of AI-introduced regressions (VentureBeat).

**Implementation: Verification queries on the unified symbol graph (Pattern E) + knip**

2.5 is now a **consumer** of the unified symbol graph, not a separate analysis system. The graph built by Pattern E already contains exports, imports, reference edges, and file hashes. 2.5 runs verification queries against this graph after each phase to catch cross-file breakage.

**v1 scope (3 layers):**

| Layer | Tool | What It Catches | Version |
|-------|------|-----------------|---------|
| **Reference integrity** | Symbol graph reference edges (Pattern E) | Broken imports, removed exports still referenced, fabricated type names | v1 |
| **Dead export detection** | `knip` (already installed) | Exports that became unused after refactoring | v1 |
| **Same-type argument swap** | `ts-morph` parameter comparison via `CodeAnalysis` interface | When a function signature changes and parameters were reordered but types stayed the same, flag all call sites for review | v1 |
| ~~Full call site consistency~~ | ~~ts-morph AST analysis~~ | ~~All argument order changes, missing required params~~ | v2 |
| ~~Interface contract verification~~ | ~~ts-morph type comparison~~ | ~~Implementations no longer match~~ | v2 |

**v2 rationale:** Call-site consistency checking is a research-level problem requiring the full TypeScript Language Service API. Interface verification can use TypeScript's own compiler errors as a proxy for now. These are deferred, not dropped.

**Execution flow (v1):**
1. Get list of modified files from phase results
2. Update the symbol graph incrementally (Pattern E) — only re-parse changed files using file hashes
3. For each modified export: query reference edges in the updated graph → verify references still resolve
4. Check for fabricated type names: verify all referenced types in new code exist in the graph's symbol table
5. Run `knip` on affected exports → flag newly dead code
6. **Rename detection:** Run `git diff --name-status` before analysis. Feed rename pairs (R100) into the reference checker so "file moved" is not flagged as "broken reference"
7. **Circular dependency detection:** Walk the graph's import edges to detect newly introduced cycles. Optionally consume 2.4's `circular_deps` output as a baseline for delta detection, but works standalone.
8. **New call-site argument swap:** Check all new call sites (added in the phase diff) against existing function signatures via `CodeAnalysis.findReferences()`. If two adjacent parameters share the same type, flag for review.
9. **Codemap refresh:** After verification passes, trigger `graph-renderer` to update codemaps from the now-current symbol graph. This replaces the AI-driven `finalize_codemap_step`.

**Output schema:**
```typescript
{
  schema_version: 1
  status: 'pass' | 'warn' | 'fail'
  broken_references: Array<{ file: string, export: string, used_in: string[] }>
  fabricated_types: Array<{ file: string, type_name: string, line: number }>
  dead_exports: Array<{ file: string, export: string }>
  dynamic_import_targets: string[]          // files referenced by dynamic import() — excluded from dead export analysis
  circular_deps_introduced: string[][]      // newly introduced cycles (empty if none)
  renames_detected: Array<{ from: string, to: string }>
  graph_updated: boolean                    // whether symbol graph was refreshed
  codemaps_regenerated: string[]            // codemap files re-rendered from graph
}
```

**Integration:**
- `todo_code_writer`: Run after each phase via `ToolRunner` circuit breaker (Pattern C). Graph update + verification + codemap refresh in one step.
- `finalize`: Run full analysis between audit and test steps. Final codemap rendering ensures codemaps committed alongside code changes.
- **Fail condition:** Any broken reference or fabricated type = `fail` (blocks commit). Dead exports = `warn`. Newly introduced circular dependencies = `warn`.
- **Dynamic import exclusion:** Files that are targets of dynamic `import()` expressions (detected by Pattern E's warning system) are excluded from dead export analysis. Their exports are marked as "dynamically referenced" rather than dead, preventing false positives in plugin systems and lazy-loaded modules.
- Uses unified symbol graph (Pattern E) — depends on it being built first

**Estimated effort:** 4–6 days (reduced from 5-7d by: graph already built by Pattern E, codemap rendering is deterministic not AI-driven)

---

## Tier 3: Quality Support

### 3.1 Code Quality Regression Tracking

**Gap:** No trend analysis of AI output quality over time. AI code quality is declining industry-wide (IEEE Spectrum). Without tracking, degradation is invisible.

**Implementation: Comprehensive quality metrics persistence**

Extend `CostTracker` to also track quality metrics per session:

```typescript
interface QualityEntry {
  schema_version: 1
  session_id: string
  capability: string
  timestamp: string
  spec_path: string | null
  // Audit metrics
  audit_status: 'pass' | 'warn' | 'fail'
  lint_issues: number
  type_errors: number
  test_failures: number
  security_findings: number
  // Change metrics
  files_modified: number
  lines_added: number
  lines_removed: number
  // Quality depth metrics (from test quality assessment)
  mutation_score: number | null
  assertion_density: number | null
  quality_grade: string | null
  // Dependency metrics (from supply chain validator)
  new_packages_added: number
  packages_blocked: number
  // Semantic metrics (from graph analysis)
  broken_references_found: number
  dead_exports_found: number
}
```

Persist to `.mcp-ts-engineer/quality-metrics.ndjson`. Provide a `quality_report` MCP resource that aggregates trends over last 7/30/90 days (configurable windows) with trend direction (improving/stable/declining).

**Quality signal:** If mutation scores trend downward over 30 days, or security findings trend upward, surface as a warning in the next `finalize` output. This is the early warning system for the industry-wide AI quality decline.

**Estimated effort:** 3–4 days

---

### 3.3 Operational Awareness: Deploy Artifacts

**Gap:** Pipeline stops at "commit." No awareness of migrations, monitoring, deployment.

**Implementation: `deploy_checklist_step` — always-on, not optional**

Quality extends beyond code correctness. A correct implementation that breaks in deployment is still a failure. Run automatically in `finalize`.

| Change Type | Checklist Item | Detection Method |
|------------|----------------|------------------|
| New npm dependency | Verify CI installs it, check bundle size impact | Diff `package.json` |
| Environment variable reference | Add to `.env.example`, update deployment config | Grep for `process.env.` in changed files |
| Database schema change | Generate migration script or flag for manual review | Detect schema/model file changes |
| New API endpoint | Update API docs, add monitoring | Detect new route/controller files |
| Config file change | Flag for environment-specific review | Detect changes to config files |
| New background job/worker | Add health check, monitoring | Detect new worker/job files |
| Breaking API changes | Flag removed/renamed endpoints | Semantic analysis of controller changes |
| Feature flag usage | New `process.env.FEATURE_*` or feature flag SDK calls | Grep for feature flag patterns in changed files |
| Rollback risk | Changes that can't be easily reverted (data migrations, API removals) | Flag irreversible changes for human attention |

**Integration:** Run as step in `finalize` after commit. Output is human-readable markdown appended to PR description by `pr_reviewer`.

**Estimated effort:** 3–4 days

---

### 3.4 Performance Anti-Pattern Detection

**Gap:** CodeRabbit's analysis found AI code creates **~8x more excessive I/O operations** than human code. No step in the current or planned pipeline checks for performance anti-patterns.

**Implementation: Static performance analysis step**

Add performance-focused checks to the existing audit/security scan infrastructure:

| Anti-Pattern | Detection Method | Severity |
|-------------|-----------------|----------|
| **N+1 query patterns** | Detect DB/API calls inside loops (`for`/`map`/`forEach` containing `await fetch`/`query`/`findOne`) | High |
| **Unbatched async operations** | Sequential `await` in loops instead of `Promise.all()` | Medium |
| **Missing pagination** | `findAll()`/`find({})` without `limit`/`take` on DB queries | High |
| **Excessive re-renders** | React components with inline object/function creation in JSX props | Medium |
| **Synchronous file I/O** | `fs.readFileSync`/`fs.writeFileSync` in request handlers | High |
| **Unindexed queries** | MongoDB `.find()` with filters on non-indexed fields (heuristic based on schema) | Medium |
| **Memory leaks** | Event listeners added without cleanup, growing arrays in module scope | High |

**Integration:**
- Add as rules in the security scanner's `security-lint.scanner.ts` (same infrastructure, different rule set)
- Run during `finalize` full scan and per-phase in `todo_code_writer`
- Findings reported as `perf` category alongside security findings

**Why this matters:** AI models are trained on code that prioritizes correctness and readability, not performance. They default to the simplest pattern (sequential awaits, unbatched queries) because that's what most tutorial code does. Without explicit detection, these anti-patterns accumulate silently.

**Estimated effort:** 3–5 days (reuses security scanner infrastructure from 1.2 — depends on 1.2 being completed first)

---

### 3.5 Agent Observability / Step-Level Tracing

**Gap:** 89% of organizations with successful AI agents have implemented observability, and 62% have detailed tracing (LangChain State of Agents). The pipeline has structured logging but no step-level decision tracing — you can see WHAT happened but not WHY the agent made specific choices.

**Implementation: Extend structured logging with decision traces**

```typescript
interface AgentTrace {
  schema_version: 1
  session_id: string
  capability: string
  step: string                    // e.g., "planner", "engineer_phase_2", "audit"
  timestamp: string
  // Decision context
  input_summary: string           // What the step received (truncated)
  decision: string                // What the agent decided to do
  reasoning?: string              // Why (extracted from agent output when available)
  // Execution
  tools_called: Array<{ name: string, args_summary: string, result_summary: string }>
  files_read: string[]
  files_modified: string[]
  // Outcome
  outcome: 'success' | 'failed' | 'retried'
  duration_ms: number
  tokens_used: number
  error?: string
}
```

Persist to `.mcp-ts-engineer/traces/{session_id}.ndjson`. One trace file per session, one line per step. **Retention policy:** Traces older than `quality.observability.trace_retention_days` (default 30) are automatically pruned. Total trace storage capped at `quality.observability.max_trace_size_mb` (default 100MB) with oldest-first deletion.

**Integration:**
- Hook into `AIProvider.query()` to capture tool calls and reasoning
- Add trace emit points in each capability's step execution
- `quality_report` MCP resource includes link to trace file for debugging failed sessions

**Value:** When the pipeline produces a bad result, traces answer "what went wrong at step X?" without re-running the entire pipeline. Critical for building trust (developer trust dropped to 29%) and debugging cross-session learning entries.

**Two-phase delivery (observability from day 1):**
- **Phase 1 (basic, weeks 1-3):** Step-level tracing with step name, duration, outcome, error. Lightweight — just structured log entries. Enables debugging of new capabilities (1.1, 1.2) as they ship. ~1 day of effort, bundled with Phase 1 work.
- **Phase 4 (full, weeks 8-11):** Decision context extraction — tool calls, reasoning, input/output summaries. Requires hooking into `AIProvider.query()` and parsing Claude Agent SDK message format.

This ensures the most complex new capabilities (supply chain validator, security scanner, mutation testing) ship WITH the tracing needed to debug them, addressing the research finding that 89% of successful orgs have observability from day 1.

**Estimated effort:** 5–7 days total (1d basic in Phase 1 + 4-6d full in Phase 4)

---

### 3.6 Deep Context Loading (Symbol Graph-Powered Context Assembly)

**Gap:** Fresh context per step means no deep codebase retrieval. Each agent starts with minimal project awareness.

**Implementation: Task-scoped context assembly from the unified symbol graph (Pattern E)**

Full vector-DB RAG is tempting but adds infrastructure complexity and suffers from embedding similarity misses. [Cursor](https://towardsdatascience.com/how-cursor-actually-indexes-your-codebase/) and [Copilot](https://capabl.in/blog/elevating-code-retrieval-deep-dive-into-the-new-copilot-embedding-model-2025) use embeddings because they support any language and any project. For TypeScript codebases under 10K files, **deterministic graph-based context loading is both higher quality and more reliable** — compiler-accurate symbols instead of embedding similarity.

The unified symbol graph (Pattern E) already contains the data needed for context assembly: exports, imports, type signatures, JSDoc, and file-to-file edges. 3.6 is now a **consumer** of the graph via the `context-assembler.ts` module, not a separate analysis system.

**Three enhancements to `project-context-loader.ts`:**

1. **Graph-powered dependency-traced file selection:** When planner generates a phase plan, use `context-assembler.ts` (Pattern E) to BFS from target files through the symbol graph's import edges (depth configurable via `quality.context.max_depth`, default 2). Load discovered "context files" into the engineering step prompt. No re-parsing needed — the graph already has the structure.

2. **Symbol table injection (proactive hallucination prevention):** Before each engineering phase, extract the public API surface from the graph for all files in the resolved import tree. Inject as a `## Available Symbols` section in the engineering prompt. **Staleness boundary:** After each phase, 2.5 updates the symbol graph incrementally (re-parsing only changed files). The next phase's context assembly reads the updated graph, ensuring it always reflects the current state — not a stale snapshot. This directly prevents hallucinated function/type names during generation rather than catching them after (addressed by 2.5).

3. **Spec-driven search injection:** Before each engineering step:
   - Extract identifiers from spec code blocks and backtick-quoted names as the search corpus
   - Run Grep for each identifier in the project
   - **Filter results to structural occurrences:** Only include lines containing `export`, `import`, `function`, `class`, `type`, `interface`, or `const`
   - Deduplicate against files already loaded via graph traversal
   - Rank results by distance from target files in the symbol graph (closer = higher rank)
   - Truncate to remaining token budget (graph-based context loaded first, spec-driven results fill the remainder up to `max_context_tokens`)

**File-count degradation strategy:** Already defined in Pattern E's context assembler. Same thresholds apply: full analysis <5K files, reduced depth 5-10K, changed-files-only >10K.

**Extension point:** The context assembler implements a `ContextProvider` interface (`resolveContext(targets: string[], budget: number): ContextResult`). Graph-based traversal is the default. A future RAG-backed implementation would plug into this interface for >10K file codebases.

**Max context budget:** Injected context bounded by `quality.context.max_context_tokens` (default 50,000). Priority-based truncation: closest dependencies first, furthest truncated.

**Quality rationale:** The #1 cause of AI coding failures in large codebases is invisible context. The symbol graph makes dependency relationships explicit and queryable rather than relying on AI-driven file discovery.

**Composition:** Reads from the unified symbol graph (Pattern E). After each phase, 2.5 updates the graph and regenerates codemaps. 3.6 reads the updated graph for the next phase. The graph is the shared coordination point — no separate caching needed.

**Estimated effort:** 3–5 days (reduced from 5-8d — graph traversal and context assembly are now part of Pattern E. 3.6 adds the `project-context-loader.ts` integration, spec-driven search injection, and prompt formatting.)

---

## Implementation Roadmap

Ordered by **quality impact** — each phase builds on the previous, creating compounding quality improvements.

### Phase 0: Cross-Cutting Infrastructure (Weeks 1-2, ~9-12d)
- [ ] **A. Configuration centralization** (1-2d) — extend `ProjectConfig` with `quality`, `tools`, `data_retention` sections. Includes Zod schema for config file validation. Note: touches a foundational type imported by 20+ files.
- [ ] **B. migrateSchema() utility** (0.5-1d) — shared forward-migration utility for all versioned schemas
- [ ] **C. ToolRunner / circuit breaker** (2-3d) — shared tool execution with version checks, retry, and circuit breaker
- [ ] **D. Prompt injection sanitization** (3-4d) — content boundaries, inter-step sanitization, tool-call scope validation with name allowlisting, scanner config lockdown
- [ ] 3.5a Basic observability (1d) — step-level tracing (name, duration, outcome, error) for debugging all subsequent capabilities
- [ ] Stryker/vitest 4.x compatibility verification (<1d) — empirical test before Phase 2 commits to mutation testing

### Phase 1: Safety Foundation (Weeks 2–4)
- [ ] 1.1 Supply chain validator (3-5d) — prevent hallucinated/malicious dependencies
- [ ] 1.2a In-process security scanners (4-5d) — js-x-ray + regex bridge + npm audit + ScannerRegistry plugin architecture
- [ ] 1.2b CLI security scanners (6-8d) — Semgrep + Gitleaks wrappers + IDOR rules + config lockdown. Can slip to Phase 2 without blocking downstream.

### Phase 2: Unified Symbol Graph + Verification (Weeks 5–9)
- [ ] **E. Unified Symbol Graph** (6–8d) — project loader, import resolver, symbol table with JSDoc, symbol graph builder with incremental file-hash updates, graph-to-codemap renderer, task-scoped context assembler with BFS ranking, fallback behavior. MUST be built before 2.4, 2.5, or 3.6. Replaces AI-driven `finalize_codemap_step` with deterministic codemap rendering.
- [ ] 2.3a Mutation testing + simple static metrics (6-8d) — Stryker integration, test deletion detection, basic metrics via `typescript-estree`. Runs in parallel with E (no dependency).
- [ ] 2.3b Advanced static metrics (5-7d) — tautological assertion detection (4 sub-patterns, scope-aware), cross-scope mock tracing, hardcoded value clustering via ts-morph. Depends on E.
- [ ] 2.5 Semantic graph verification v1 (4-6d) — reference integrity queries on symbol graph, dead exports via knip, same-type argument swap, circular dep detection, codemap refresh after verification (depends on E)

### Phase 3: Intelligence & Autonomy (Weeks 9–13)
- [ ] 2.1 PR as the human gate (5-7d) — plan validator + pr_reviewer/pr_fixer auto-fix loop with build gate + risk summary
- [ ] 2.2 Cross-session learning (5-7d) — session reports + lessons loader. `resume_from_phase` is a separate 3-4d work item, can be deferred.
- [ ] 2.4 Codebase archaeology (5-7d) — understand code before modifying it (reads from unified symbol graph)

### Phase 4: Continuous Quality (Weeks 13–17)
- [ ] 3.1 Quality regression tracking (3-4d) — detect quality trends early
- [ ] 3.3 Deploy checklist (2-3d) — extend quality beyond code to operations
- [ ] 3.4 Performance anti-pattern detection (4-6d) — catch 8x I/O excess AI generates (depends on 1.2)
- [ ] 3.5b Full agent observability (4-6d) — decision context, tool calls, reasoning extraction
- [ ] 3.6 Deep context loading (3-5d) — integrate symbol graph context assembler into `project-context-loader.ts`, add spec-driven search injection (reads from unified symbol graph)

**Timeline note:** Adjusted total is ~90-130 working days across ~18-26 weeks for a single developer (add 3-4 weeks buffer if no prior ts-morph/Stryker experience). The unified symbol graph (Pattern E) adds ~2d to its own estimate but saves ~8-12d across consumers (2.5 reduced from 5-7d to 4-6d, 3.6 reduced from 5-8d to 3-5d, codemap AI agent eliminated). Includes ~3-5d of cross-component integration testing distributed across phases. Phase 0 is ~9-12d. Phase 1 allows 1.2b to slip to Phase 2 without blocking. Phase 2 offers parallelization: 2.3a runs in parallel with Pattern E; 2.3b and 2.5 run after Pattern E. Phase 4 items can be prioritized — 3.1 and 3.3 are quick wins, while 3.6 is now simpler since graph infrastructure already exists.

### Future (v2): Deferred Enhancements
- [ ] 2.2b `resume_from_phase` — state reconstruction from git history (3-4d, can be built anytime after 2.2)
- [ ] 2.5 v2: Full call-site consistency, interface contract verification
- [ ] Symbol graph SQLite migration — if JSON performance degrades at scale, migrate to SQLite (schema-compatible)
- [ ] DAST integration (e.g., ZAP baseline scan) for IDOR and runtime vulnerability classes
- [ ] Parallel/batch spec processing (Cursor "hundreds of automations/hour" pattern)
- [ ] Background agent execution mode — queue specs, receive notifications on completion
- [ ] Production monitoring template generation (extends deploy checklist)
- [ ] Large-scale test migration workflow (Airbnb pattern — specs can describe migration tasks for `todo_code_writer`)

---

## Updated Pipeline Vision

After all improvements:

```
┌──────────────────────────────────────────────────────────────────────────┐
│              FULLY AUTONOMOUS PIPELINE v2 (Quality-First)                 │
│              Human reviews only the final PR                             │
│                                                                          │
│  code_analyzer ──→ [HUMAN: write spec]                                   │
│       ↓                                                                  │
│  todo_reviewer ──→ todo_code_writer ──→ finalize ──→ PR loop ──→ HUMAN   │
│  (DRAFT→IN_REVIEW) (IN_REVIEW→READY)  (READY→IMPL)                      │
│       │                  │                │              │                │
│       │           ┌──────┴──────┐  ┌──────┴──────┐  ┌───┴────┐          │
│       │           │ Plan Phase  │  │  Post-Impl  │  │PR Loop │          │
│       │           ├─────────────┤  ├─────────────┤  ├────────┤          │
│       │           │ AI planner  │  │ audit       │  │review  │          │
│       │           │ AI plan     │  │ sec scan    │  │auto-fix│          │
│       │           │  validator  │  │  (6 layers) │  │review  │          │
│       │           │ (self-check)│  │ dep valid   │  │auto-fix│          │
│       │           ├─────────────┤  │ test        │  │  ...   │          │
│       │           │ Per Phase   │  │ mutation    │  │(until  │          │
│       │           ├─────────────┤  │  (full)     │  │ clean) │          │
│       │           │ eng step    │  │ sem graph   │  ├────────┤          │
│       │           │ dep valid   │  │  (full)     │  │ Risk   │          │
│       │           │ sec scan    │  │ perf check  │  │ summary│          │
│       │           │  (in-proc)  │  │ graph+cmap  │  │ for    │          │
│       │           │ phase aud   │  │ deploy ck   │  │ human  │          │
│       │           │ test guard  │  │ commit+push │  └────────┘          │
│       │           │  (no deletes)│ │ open PR     │                      │
│       │           │ mutation    │  └─────────────┘                      │
│       │           │ perf check  │                                        │
│       │           │ sem graph   │                                        │
│       │           └─────────────┘                                        │
│       │                                                                  │
│  Sessions persist → lessons-learned → quality-metrics → trend alerts     │
│  Agent traces → step-level decisions → debugging → trust building        │
└──────────────────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────────────────┐
│                  INDEPENDENT CAPABILITIES v2                              │
│                                                                          │
│  audit_fix + multi-layer security scan + dep validator + perf check      │
│  pr_reviewer + security_agent + dep_check + mutation report               │
│  pr_fixer (auto-fix loop partner)                                        │
│  code_analyzer (NEW — codebase archaeology)                              │
│  quality_report (NEW — MCP resource, trend tracking + traces)            │
└──────────────────────────────────────────────────────────────────────────┘
```

---

## Quality Impact Matrix

What each improvement catches that the current pipeline misses:

| Improvement | Vulnerability Class Caught | Without It | With It |
|------------|---------------------------|------------|---------|
| **Supply chain validator** | Hallucinated packages, typosquatting, malicious deps | 0% of supply chain attacks | ~90% detection (registry + Levenshtein + provenance) |
| **Multi-layer security scanner** | XSS, injection, secrets, unsafe patterns, CVEs | ~15% (only TypeScript types) | ~85% (6 complementary scanners) |
| **Mutation testing** | Tests that don't verify behavior ("green but fragile") | 0% — invisible | Quantified: mutation score shows exact test effectiveness |
| **Semantic graph analysis** | Broken references, fabricated types, dead exports (v1); interface violations, circular deps (v2) | ~40% (TypeScript catches type errors only) | ~75% v1, ~90% v2 (AST + dependency analysis) |
| **PR as human gate** | Bad plans, unfixed style/lint/test issues reaching human reviewer | PR contains raw AI output | Human sees pre-validated, auto-fixed PR with risk summary and focus areas |
| **Cross-session learning** | Repeated failures, rediscovered anti-patterns | 0% — each session starts fresh | Accumulated knowledge across invocations |
| **Codebase archaeology** | Wrong assumptions about existing code, missing context | Depends on spec writer's knowledge | Systematic understanding before spec writing |
| **Quality regression tracking** | Gradual quality decline across sessions | Invisible — no trend data | Early warning when quality metrics trend downward |
| **Deploy checklist** | Missing env vars, undocumented APIs, migration gaps | 0% — pipeline stops at commit | Operational completeness verification |
| **Performance anti-patterns** | N+1 queries, unbatched async, excessive I/O (8x more than human code) | 0% — no performance checks | Static detection of common AI performance anti-patterns |
| **Agent observability** | Opaque agent failures, no debugging without re-running | Can see WHAT happened (logs) but not WHY | Step-level decision traces with tool calls and reasoning |
| **Deep context loading** | Agent misunderstanding existing patterns, invisible dependencies | Limited to static AI-generated codemaps | Full graph-powered, task-scoped context per engineering step. Codemaps deterministically rendered from symbol graph |

**Compounding effect:** These improvements are not independent. Supply chain validation + security scanning + mutation testing + semantic analysis together create a quality safety net where each layer catches what others miss. A vulnerability that passes the security scanner might be caught by mutation testing (if the test for that code path is weak) or by semantic analysis (if the fix introduced a broken reference).

---

## Audit: Cross-Reference Against Research

Systematic verification that every challenge and every success pattern is addressed.

### Challenges Report Coverage (10/10)

| # | Challenge | Improvement(s) | Status |
|---|-----------|----------------|--------|
| 1 | AI quality declining (1.7x issues, 8x I/O) | 3.1 regression tracking, 2.3 mutation testing, **3.4 perf detection** | Covered |
| 2 | Security vulnerabilities (45% of AI code) | 1.2 multi-layer security scanner (6 layers) | Covered |
| 3 | Slopsquatting (20% hallucinated packages) | 1.1 supply chain validator (registry + Levenshtein + provenance) | Covered |
| 4 | Context window brittleness | 3.6 deep context loading (dependency-traced) | Covered |
| 5 | Goldfish memory | 2.2 cross-session learning (session reports + lessons loader) | Covered |
| 6 | Multi-file refactoring breaks | 2.5 semantic graph analysis (v1: 2 layers, v2: 5 layers) | Covered |
| 7 | Tests: coverage without quality | 2.3 mutation testing + **test deletion detection** | Covered |
| 8 | Legacy code comprehension | 2.4 codebase archaeology | Covered |
| 9 | Deploy-to-production gap | 3.3 deploy checklist (incl. feature flags, rollback risk) | Covered |
| 10 | Trust erosion (29% trust) | 2.1 PR as human gate + **3.5 agent observability** | Covered |

### Success Stories Patterns Coverage (7/7)

| Pattern | Source | Improvement(s) | Status |
|---------|--------|----------------|--------|
| Spec-first development | GitHub Spec Kit, AWS Kiro, Thoughtworks | Already implemented (todo_reviewer → todo_code_writer) | Existing |
| Quality guardrails are mandatory | Loveholidays/CodeScene | All quality gates mandatory, no optional flags | Covered |
| "Agents delete failing tests" | CodeScene | 2.3 test deletion/weakening detection | Covered |
| "Scenario-driven tests" / green-but-fragile | CodeScene, Salesforce | 2.3 mutation testing + test scope analysis + tautological assertion detection | Partially covered — mutation testing + test scope analysis are strong proxies but cannot directly enforce scenario-driven test design |
| Agent observability (89% of successful orgs) | LangChain State of Agents | 3.5 step-level tracing | Covered |
| AI review at scale (600K PRs/month) | Microsoft | 2.1 pr_reviewer/pr_fixer auto-fix loop | Covered |
| "Bottleneck is knowing what to build" | Google | 2.4 codebase archaeology + /issue-shape | Covered |

### The 5 Pillars Coverage

| Pillar | Status | How |
|--------|--------|-----|
| **Spec-First** | Existing | todo_reviewer → todo_code_writer pipeline |
| **Quality Guardrails** | Strengthened | Security scanner, mutation testing, semantic analysis, test deletion detection |
| **Multi-Agent Orchestration** | Existing | Specialized sub-capabilities, fresh context per step |
| **Incremental Execution** | Existing | Phased implementation with per-phase quality gates |
| **Human-in-the-Loop** | Redesigned | PR is the sole human gate; AI does everything before it |

### 8-Step Proven Workflow Coverage

```
1. SPECIFY    → Human writes spec                         ✓ Existing
2. REVIEW     → todo_reviewer validates spec              ✓ Existing
3. PLAN       → todo_code_writer planner + plan validator  ✓ Enhanced (2.1)
4. IMPLEMENT  → todo_code_writer engineer phases           ✓ Enhanced (per-phase gates)
5. AUDIT      → Security + supply chain + semantic + perf  ✓ Enhanced (1.1, 1.2, 2.5, 3.4)
6. TEST       → Mutation testing + test quality grades     ✓ Enhanced (2.3)
7. REVIEW     → PR auto-fix loop → human reviews clean PR  ✓ Enhanced (2.1)
8. DEPLOY     → Deploy checklist (detection, not execution) ~ Partial (3.3)
```

**Step 8 is intentionally partial.** Actual deployment is too project-specific (Kubernetes vs. Vercel vs. bare metal) to automate generically. The deploy checklist detects what needs attention and surfaces it in the PR description. Actual deployment tooling belongs in project-specific CI/CD pipelines, not in the MCP server.

### Cross-Cutting Patterns Audit

| Pattern | Purpose | Items Using It | Scheduled |
|---------|---------|---------------|-----------|
| A. Config centralization | All thresholds in `ts-engineer.config.json` | 1.1, 1.2, 2.1, 2.3, 3.4, 3.5, 3.6 | Phase 0 (1d) |
| B. Schema versioning | `schema_version` on all persisted data + `migrateSchema()` utility | 1.1, 1.2, 2.2, 2.3, 2.4, 2.5, 3.1, 3.5 | Convention + 0.5-1d for `migrateSchema()` utility in Phase 0 |
| C. Circuit breaker + version pinning | Graceful degradation + version compat for external tools | 1.2, 2.3, 2.5, 3.4 | Phase 0 (2d) |
| D. Prompt injection sanitization | Content boundaries, inter-step sanitization, tool-call scope validation | todo_reviewer, todo_code_writer, pr_reviewer, all inter-step boundaries | Phase 0 (2d) |
| E. Shared TS analysis foundation | Project loader (cached + invalidated), import resolver, symbol table (with JSDoc), fallback to regex | 2.4, 2.5, 3.6 | Phase 2 (4-6d) |

### Known Limitations (Acknowledged)

| Limitation | Status | Mitigation |
|-----------|--------|------------|
| **Business domain understanding** | Out of scope | No tool can capture why a payment edge case exists. The spec is the mechanism for human intent. Git history context in 2.4 partially addresses "why" for structural decisions. |
| **Very large codebases (>10K files)** | Degradation strategy in place | 3.6 defines a file-count degradation strategy: full analysis <5K, reduced depth 5-10K, changed-files-only >10K with warning. Full RAG remains out of scope. |
| **Actual deployment automation** | Out of scope | Too project-specific. Deploy checklist detects; CI/CD pipelines execute. Runtime monitoring/incident reduction (PwC's 70% fewer incidents) requires post-deploy observability, also out of scope. |
| **Prompt injection defense** | Addressed (Pattern D) | Spec files and issue content are attacker-controllable in public repos. Cross-cutting Pattern D adds sanitization (pattern detection + content boundary enforcement) before prompt construction. Not a full defense but raises the bar and makes attacks detectable in traces. |
| **DAST / runtime security testing** | Partially mitigated in v1 | All 6 scanner layers are static analysis. IDOR (1.91x more likely per Endor Labs) is partially addressed via custom Semgrep authorization anti-pattern rules (5-10 rules targeting missing guards, missing ownership checks, missing tenant filters — see 1.2). Full DAST (ZAP baseline scan) remains a v2 consideration for runtime vulnerability classes that static analysis cannot catch. |
| **Parallel spec processing** | Not in v1 | Cursor's "hundreds of automations/hour" pattern has no analogue. The pipeline is sequential per-spec. Batch orchestration is deferred to v2 (see Future roadmap). |

---

## References

- [Industry challenges research](./ai-sdlc-challenges-research.md)
- [Success stories research](./ai-sdlc-success-stories.md)
- [Current capabilities reference](./capabilities-reference.md)
- [Existing `/issue-shape` spec](./specs/mcp-ts-engineer/todo/2026-02-28-spec-driven-feature-shaping.md)
