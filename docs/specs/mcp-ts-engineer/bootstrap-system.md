# Bootstrap System Specification

**App**: mcp-ts-engineer
**Status**: IMPLEMENTED
**Created**: 2026-02-21

---

## Overview

mcp-ts-engineer is a git submodule added to **turbo-based npm monorepos**. Setting up a new consuming repo requires many manual steps: config files, Claude Code directories, commands, skills, labels, worktree scripts, etc.

**Solution**: A single shell script (`bootstrap.sh`) that scaffolds the entire monorepo + Claude Code development environment. Plus `update.sh` for re-syncing after submodule updates.

**Critical constraints**:
- All setup logic in deterministic shell scripts — AI agents skip instructions
- macOS only (no Linux compatibility needed)
- Everything in `.claude/` is symlinked to submodule (auto-updates on submodule pull)
- Fixed MCP convention: server key is always `ts-engineer` → tools are `mcp__ts-engineer__*`

---

## User Flow

### New Repo (from scratch)

```bash
# 1. Create repo
mkdir my-project && cd my-project
git init

# 2. Add submodule
git submodule add git@github.com:org/mcp-ts-engineer.git packages/mcp-ts-engineer

# 3. Run bootstrap (does everything else)
bash packages/mcp-ts-engineer/scripts/bootstrap.sh

# 4. Commit
git add -A && git commit -m "chore: initial monorepo setup"
```

### Collaborators Cloning

```bash
git clone --recurse-submodules git@github.com:org/my-project.git
cd my-project && npm install
```

---

## Fixed Monorepo Schema

Bootstrap generates a **standard schema** that all consuming repos follow.

### Root `package.json`

```json
{
  "name": "{{REPO_NAME}}",
  "version": "1.0.0",
  "private": true,
  "packageManager": "npm@10.8.0",
  "workspaces": ["apps/*", "packages/*"],
  "scripts": {
    "build": "turbo run build",
    "dev": "turbo run dev",
    "test": "turbo run test",
    "lint": "turbo run lint",
    "format": "turbo run format",
    "format:check": "turbo run format:check",
    "type-check": "turbo run type-check",
    "clean": "turbo run clean && rm -rf node_modules",
    "prepare": "husky"
  },
  "devDependencies": {
    "turbo": "^2.8.0",
    "vitest": "^3.2.0",
    "@biomejs/biome": "^2.3.0",
    "husky": "^9.1.7",
    "@commitlint/cli": "^20.2.0",
    "@commitlint/config-conventional": "^20.2.0"
  },
  "engines": { "node": ">=22.0.0" }
}
```

### Root `turbo.json`

```json
{
  "$schema": "https://turborepo.com/schema.json",
  "globalEnv": ["NODE_ENV"],
  "globalDependencies": ["tsconfig.json"],
  "tasks": {
    "build": { "dependsOn": ["^build"], "outputs": ["dist/**", "build/**"], "cache": true },
    "dev": { "cache": false, "persistent": true, "dependsOn": ["^build"] },
    "test": { "dependsOn": ["^build"], "outputs": ["coverage/**"], "cache": true },
    "lint": { "outputs": [], "cache": true },
    "format": { "outputs": [], "cache": false },
    "format:check": { "outputs": [], "cache": true },
    "type-check": { "outputs": [], "cache": true, "dependsOn": ["^build"] },
    "clean": { "cache": false }
  }
}
```

### Root `vitest.config.ts`

```typescript
import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    projects: ['apps/*', 'packages/*'],
    coverage: {
      provider: 'v8',
      thresholds: { statements: 80, branches: 80, functions: 80, lines: 80 },
    },
  },
})
```

### Root `biome.json`

```json
{
  "$schema": "https://biomejs.dev/schemas/2.3.0/schema.json",
  "vcs": { "enabled": true, "clientKind": "git", "useIgnoreFile": true },
  "organizeImports": { "enabled": true },
  "formatter": { "enabled": true, "indentStyle": "space", "indentWidth": 2, "lineWidth": 100 },
  "linter": {
    "enabled": true,
    "rules": {
      "recommended": true,
      "complexity": { "noExcessiveCognitiveComplexity": "warn" },
      "suspicious": { "noExplicitAny": "warn" }
    }
  },
  "javascript": { "formatter": { "quoteStyle": "single", "trailingCommas": "all", "semicolons": "asNeeded" } },
  "files": { "ignore": ["node_modules", "dist", "build", "coverage", ".turbo", "*.min.js"] }
}
```

### Root `tsconfig.json`

```json
{
  "compilerOptions": {
    "target": "ES2022", "module": "commonjs", "lib": ["ES2022"],
    "strict": true, "esModuleInterop": true, "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true, "resolveJsonModule": true,
    "declaration": true, "declarationMap": true, "sourceMap": true
  },
  "exclude": ["node_modules", "dist", "build"]
}
```

### Root `.gitignore`

Standard ignores: node_modules, dist, build, .env, .turbo, coverage, .DS_Store, .tmp, .worktrees, logs.

---

## What Lives Where

| In the submodule (shared, versioned) | In the host repo (generated/symlinked) |
|--------------------------------------|----------------------------------------|
| `scripts/bootstrap.sh` | `package.json`, `turbo.json`, `tsconfig.json`, `vitest.config.ts`, `biome.json` (generated) |
| `scripts/update.sh` | `.mcp.json` (generated/merged) |
| `scripts/setup-issue-labels.sh` | `ts-engineer.config.json` (generated) |
| `scripts/setup-worktree.sh` | `scripts/setup-worktree.sh` → symlink |
| `.claude/commands/*.md` (source) | `.claude/commands/*.md` → symlinks |
| `.claude/skills/*` (source) | `.claude/skills/*` → symlinks |
| `.claude/rules/*` (source) | `.claude/rules/*` → symlinks |
| `.claude/contexts/*` (source) | `.claude/contexts/*` → symlinks |
| `templates/config/*` | `CLAUDE.md` (generated) |
| | `.claude/codemaps/*.md` (generated, NOT symlinked) |
| | `docs/specs/{project}/todo/` (generated per project) |
| | `scripts/setup-worktree-extra.sh` (optional, repo-specific) |

**Key**: commands, skills, rules, contexts are ALL symlinked. When submodule updates, all consuming repos get new versions automatically. Only config files and codemaps are generated (repo-specific content).

---

## Implemented Files

### 1. `scripts/bootstrap.sh` (679 lines)

**Arguments** (all optional — auto-detected by default):
```
--repo-owner "org"       GitHub org (override auto-detection)
--repo-name "repo"       GitHub repo (override auto-detection)
```

**Auto-detection**:
- **Project name**: Derived from monorepo root directory name. `my-project` → `MyProject` (PascalCase). Used for `serverName` in config (`MyProjectTsEngineer`), `logDir`, and `name` in `package.json`.
- **Repo owner/name**: Parsed from `git remote get-url origin` if not provided via flags.
- MCP server key is always `ts-engineer` (fixed convention).
- Build and labels always run — no skip flags.

**Flow**:

```
 1. Parse optional arguments (--repo-owner, --repo-name)
 2. Detect paths:
    - SUBMODULE_DIR from script location
    - MONOREPO_ROOT from walking up to find workspaces/packages/apps/.git
      Guard: exit if resolved to "/"
    - SUBMODULE_REL via python3 os.path.relpath (safe: uses sys.argv)
 3. Auto-detect project name from MONOREPO_ROOT directory name:
    - Convert to PascalCase: "my-project" → "MyProject"
    - SERVER_NAME="${PASCAL_NAME}TsEngineer"
 4. Auto-detect repo-owner/name from `git remote get-url origin`
 5. Derive: BIN_PATH="${SUBMODULE_REL}/build/bin.js", MCP_KEY="ts-engineer"
 6. Scaffold monorepo root files (skip if exist):
    - package.json, turbo.json, tsconfig.json, vitest.config.ts, biome.json, .gitignore
 7. Create directories:
    - apps/, packages/, .claude/{commands,skills,rules,contexts,codemaps,hooks}, scripts/, docs/
 8. Discover projects: scan apps/*/package.json + packages/*/package.json
    (skip mcp-ts-engineer itself)
 9. Create docs/specs/{project}/todo/ per discovered project
10. Generate/merge .mcp.json:
    - If exists: use jq (or node fallback via env vars) to add ts-engineer entry
    - If new: generate from mcp.json.template via sed ({{BIN_PATH}})
11. Generate ts-engineer.config.json (skip if exists):
    - Generate from ts-engineer.config.json.template
    - sed for single-line: {{SERVER_NAME}}, {{SERVER_NAME_LOWER}}
    - python3 + env vars for multiline: {{CODEMAPS_ENTRIES}}
12. Generate CLAUDE.md (skip if exists):
    - Generate from CLAUDE.md.template
    - bash substitution for single-line: {{PROJECT_NAME}}, {{MCP_KEY}}
    - python3 + env vars for multiline: {{DIRECTORY_STRUCTURE}}, {{PROJECT_COMMANDS}},
      {{PACKAGES_SECTION}}, {{SKILLS_LISTING}}, {{CODEMAPS_TABLE}}
13. Symlink scripts/setup-worktree.sh → submodule's scripts/setup-worktree.sh
14. Create symlinks for .claude/commands/ → submodule (per file)
15. Create symlinks for .claude/rules/ → submodule (per file)
16. Create symlinks for .claude/contexts/ → submodule (per file)
17. Create symlinks for .claude/skills/ → submodule (per directory)
18. Generate codemaps per discovered project:
    - Read package.json (name, description, dependencies)
    - Scan src/ for directory structure
    - Write .claude/codemaps/{project}.md
    - Write .claude/codemaps/architecture.md
19. Build submodule: cd SUBMODULE_DIR && npm install && npm run build
20. Run npm install at monorepo root
21. Setup GitHub labels (silently skip if gh not authenticated)
22. Print summary with next steps
```

**Idempotency**:

| File type | Strategy |
|-----------|----------|
| Monorepo root files (package.json, turbo.json, vitest.config.ts, biome.json, etc.) | Skip if exists |
| Config files (.mcp.json, ts-engineer.config.json, CLAUDE.md) | .mcp.json merges, others skip if exist |
| Symlinks (commands, skills, rules, contexts, setup-worktree.sh) | Skip if symlink exists, warn if regular file |
| Codemaps | Skip if exists (repo-specific content) |
| Directories | `mkdir -p` |
| Labels | `gh label create --force` |

### 2. `scripts/update.sh` (156 lines)

Run after `git submodule update --remote`.

**Flow**:
1. Detect paths (same algorithm as bootstrap)
2. Ensure `.claude/` subdirectories exist (commands, skills, rules, contexts, codemaps, hooks)
3. Re-create missing command/rule/context/skill symlinks (don't remove existing, warn on regular file/dir conflicts)
4. Re-check `scripts/setup-worktree.sh` symlink
5. Discover new projects → create missing `docs/specs/{project}/todo/`
6. Rebuild submodule: `npm install && npm run build`

### 3. `scripts/setup-issue-labels.sh` (102 lines)

Dynamic project discovery → GitHub labels.

Creates:
- `project:{name}` per discovered project + `project:monorepo`
- `type:feature`, `type:bug`, `type:refactor`, `type:perf`, `type:chore`
- `status:draft`, `status:ready`, `in-progress`, `blocked`
- `priority:critical`, `priority:high`, `priority:medium`, `priority:low`

Uses bash 3.2-compatible `for pair in "label color"` syntax (no associative arrays).

### 4. `scripts/setup-worktree.sh` (37 lines)

Symlinked from `scripts/setup-worktree.sh` at the monorepo root. Shared across all consuming repos.

**Flow**:
1. Determine worktree root from symlink's own location (pre-resolution) — uses `dirname "${BASH_SOURCE[0]}"` directly, NOT symlink resolution
2. `cd` to worktree root
3. `npm install`
4. `npx turbo run build`
5. Build extra plugin tsconfigs if found
6. Source `scripts/setup-worktree-extra.sh` if it exists (repo-specific extension point)

### 5. Commands (`.claude/commands/`)

4 command files, symlinked to host repos. All use `mcp__ts-engineer__*` for MCP tool references.

| Command | Lines | Purpose |
|---------|-------|---------|
| `worktree-add.md` | 111 | Create isolated git worktree with auto-cleanup of merged worktrees |
| `issue-capture.md` | 292 | Capture session context as structured GitHub issue |
| `issue-implement.md` | 553 | End-to-end pipeline: import → worktree → review → implement → finalize → PR |
| `issue-to-todo.md` | 237 | Import GitHub issue to local spec file |

**Porting changes from mellow-mono**:
- All: `mcp__software-house__*` → `mcp__ts-engineer__*`
- `issue-capture.md`: Removed "Issue Architect for mellow-mono" identity, removed hardcoded keyword→project table, replaced with dynamic discovery
- `issue-to-todo.md`: Removed mellow-specific project detection (hardcoded project names), replaced with dynamic `project:` label detection and `ls` discovery
- `issue-implement.md`: Replaced all `mcp__software-house__*` tool references, removed "MCP software-house" identity
- `worktree-add.md`: Already generic, kept as-is

### 6. Templates (`templates/config/`)

9 template files used by bootstrap for config generation:

| Template | Placeholders |
|----------|-------------|
| `package.json.template` | `{{REPO_NAME}}` |
| `turbo.json.template` | (none — static) |
| `tsconfig.json.template` | (none — static) |
| `vitest.config.ts.template` | (none — static) |
| `biome.json.template` | (none — static) |
| `gitignore.template` | (none — static) |
| `mcp.json.template` | `{{BIN_PATH}}` |
| `ts-engineer.config.json.template` | `{{SERVER_NAME}}`, `{{SERVER_NAME_LOWER}}`, `{{CODEMAPS_ENTRIES}}` |
| `CLAUDE.md.template` | `{{PROJECT_NAME}}`, `{{MCP_KEY}}`, `{{DIRECTORY_STRUCTURE}}`, `{{PROJECT_COMMANDS}}`, `{{PACKAGES_SECTION}}`, `{{SKILLS_LISTING}}`, `{{CODEMAPS_TABLE}}` |

**Template Convention** — All generated config files MUST use templates from `templates/config/`. No inline heredoc generation.

| Placeholder type | Method | Example |
|-----------------|--------|---------|
| Single-line | `sed "s\|{{KEY}}\|$VALUE\|g"` | `{{REPO_NAME}}`, `{{BIN_PATH}}`, `{{SERVER_NAME}}` |
| Multiline | `python3` + `os.environ.get()` | `{{CODEMAPS_ENTRIES}}`, `{{DIRECTORY_STRUCTURE}}` |
| Static (no placeholders) | `cp` via `scaffold_file` helper | `turbo.json.template`, `tsconfig.json.template`, `vitest.config.ts.template`, `biome.json.template` |

Rules:
- Every generated config file has a corresponding `.template` file as single source of truth
- Never generate file content inline — always read from template and replace placeholders
- Multiline replacements use environment variables (never shell expansion in python3)
- If a new config file is added, add a template first

### 7. Codemap Generation

For each discovered project, bootstrap generates `.claude/codemaps/{project}.md`:
- Package name and description from `package.json`
- Directory structure from `find src/ -maxdepth 3 -type d`
- Dependencies and devDependencies lists
- Location path

Plus `.claude/codemaps/architecture.md` for monorepo overview (apps, packages, infrastructure, workflow).

---

## Generated Host Repo Structure

After `bash packages/mcp-ts-engineer/scripts/bootstrap.sh`:

```
my-monorepo/
├── package.json                 ← generated (turbo + workspaces)
├── turbo.json                   ← generated (standard tasks)
├── tsconfig.json                ← generated (base config)
├── vitest.config.ts             ← generated (test config — projects discovery)
├── biome.json                   ← generated (lint + format config)
├── .gitignore                   ← generated
├── .mcp.json                    ← generated/merged
├── ts-engineer.config.json      ← generated
├── CLAUDE.md                    ← generated
├── scripts/
│   └── setup-worktree.sh       ← symlink → packages/mcp-ts-engineer/scripts/setup-worktree.sh
├── docs/
│   └── specs/
│       ├── my-server/todo/      ← per discovered project
│       └── my-app/todo/
├── .claude/
│   ├── commands/
│   │   ├── worktree-add.md     → symlink to submodule
│   │   ├── issue-capture.md    → symlink
│   │   ├── issue-implement.md  → symlink
│   │   └── issue-to-todo.md    → symlink
│   ├── skills/
│   │   ├── nestjs-core/        → symlink to submodule
│   │   ├── expo-core/          → symlink
│   │   └── ... (35+)
│   ├── rules/
│   │   ├── coding-style.md     → symlink to submodule
│   │   ├── git-workflow.md     → symlink
│   │   ├── testing.md          → symlink
│   │   └── ... (8 total)
│   ├── contexts/
│   │   ├── dev.md              → symlink to submodule
│   │   ├── research.md         → symlink
│   │   └── review.md           → symlink
│   ├── codemaps/
│   │   ├── architecture.md      ← generated
│   │   ├── my-server.md         ← generated from package.json
│   │   └── my-app.md
│   └── hooks/                   ← empty
├── apps/                        ← created if missing
├── packages/
│   └── mcp-ts-engineer/         ← submodule (built)
└── .worktrees/                  ← created at runtime by /worktree-add
```

---

## CLAUDE.md Template

The generated CLAUDE.md includes these auto-populated sections:

1. **Project Overview** — name, directory structure
2. **Key Principles** — DO/DON'T for monorepo hygiene
3. **Tooling Stack** — Vitest (testing), Biome (lint/format), Turborepo, TypeScript, Husky, Commitlint
4. **Monorepo Tooling** — turbo.json, npm workspaces commands
5. **Dependency Placement Rules** — root = only repo tools (turbo, vitest, biome, husky, commitlint), apps/packages = all deps
6. **Git Worktrees** — setup-worktree.sh reference, `/worktree-add` command
7. **Build and Development Commands** — per-project commands auto-generated
8. **Shared Packages** — listing per discovered `packages/*`
9. **Documentation-Driven Development** — spec workflow reference
10. **Deferred Tasks** — `docs/specs/{app}/todo/` pattern
11. **Available MCP Tools** — table of `mcp__ts-engineer__*` tools
12. **Available Commands** — table of `/worktree-add`, `/issue-capture`, etc.
13. **Available Skills** — auto-generated listing of all symlinked skills
14. **Codemaps** — table of all generated codemaps
15. **Maintenance** — when adding new apps/packages

---

## Security & Robustness

### Fixes Applied (from audit)

| Issue | Fix |
|-------|-----|
| Python3 command injection via string interpolation | Uses `sys.argv` for all `relpath()` calls |
| Python3 code injection in CLAUDE.md generation | Uses environment variables instead of shell expansion in triple-quotes |
| Monorepo root could resolve to `/` | Guard: exits with error if root is `/` |
| Architecture codemap duplicate entries | Rewrote with explicit conditional lists |
| `readlink -f` unavailable on stock macOS | Portable symlink resolution loop using plain `readlink` |
| `declare -A` requires bash 4+ (macOS ships 3.2) | Replaced with `for pair in "label color"` loops |
| `find` flag order non-portable | `-maxdepth` before `-type` |
| update.sh missing `mkdir -p` for destinations | Added directory creation guards |
| Node.js fallback with interpolated variables | Uses `process.env` for all dynamic values |
| No `pipefail` | Added `set -eo pipefail` to all scripts |
| Inconsistent root detection across scripts | All 4 scripts use identical algorithm |
| bootstrap.sh catch block used `$pkg` shell interpolation in JS | Replaced with `process.env.PKG_FALLBACK` |
| update.sh missing `codemaps/hooks` dir creation | Added to `mkdir -p` list |
| update.sh silently skipped existing skill dirs | Added WARNING message (matches bootstrap.sh) |
| update.sh missing setup-worktree.sh symlink re-check | Added symlink verification step |
| CLAUDE.md.template missing `{{MCP_KEY}}` placeholder | Added `{{MCP_KEY}}` |
| worktree-add.md duplicate `</output>` tag | Removed extraneous closing tag |
| setup-worktree.sh resolved to submodule dir instead of monorepo root | Removed `resolve_symlink`, uses `dirname "${BASH_SOURCE[0]}"` directly (pre-resolution) |
| bootstrap.sh env var naming inconsistency (`PKG_FILE` vs `PKG_FILE_ENV`) | Renamed to `PKG_FILE_ENV` for consistency |
| bootstrap.sh generated `.mcp.json` and `ts-engineer.config.json` inline | Refactored to use templates (consistent with other files) |
| CLAUDE.md template included CI/CD section | Removed CI/CD section and unused `{{REPO_OWNER}}`, `{{REPO_NAME}}` placeholders |

### Dependencies

- **bash** (3.2+ — macOS default)
- **python3** (pre-installed on macOS — used for `os.path.relpath`)
- **node** (≥22 — for fallback JSON operations when `jq` unavailable)
- **jq** (optional — used for JSON merge if available, falls back to node)
- **gh** (optional — used for GitHub labels, silently skipped if not authenticated)

---

## Verification Checklist

### Manual Verification

1. **Fresh repo test**: `mkdir test && cd test && git init`, add submodule, run bootstrap → all files created
2. **Existing repo test**: Run bootstrap on repo with existing projects → skips existing files, merges .mcp.json
3. **Idempotency test**: Run bootstrap twice → second run prints "Exists, skipping" for all config files
4. **Update test**: Run update.sh → re-creates missing symlinks, discovers new projects, rebuilds
5. **MCP server test**: `node packages/mcp-ts-engineer/build/bin.js` starts without error
6. **Worktree test**: `/worktree-add test-feature` → worktree created, setup-worktree.sh runs
7. **Label test**: `gh label list` shows project labels for all discovered projects
8. **Codemap test**: `.claude/codemaps/` contains one file per project with correct deps

### Automated Tests (`tests/unit/bootstrap-scripts.test.ts`)

68 tests covering all 4 scripts + templates + commands:

**Per-script (all 4)**: exists, shebang, `set -eo pipefail`, `bash -n` syntax, no `readlink -f`, no `declare -A`

**bootstrap.sh specifics**: root `/` guard, `sys.argv` relpath, `process.env` in all node fallbacks, env var CLAUDE.md replacement, consistent `PKG_FILE_ENV` naming, `mcp-ts-engineer` skip, `find` flag order, `MCP_KEY="ts-engineer"`

**update.sh specifics**: root `/` guard, `sys.argv` relpath, `.claude/` subdirectory creation, `setup-worktree.sh` re-check, submodule rebuild

**setup-issue-labels.sh specifics**: project/type/status/priority labels, `mcp-ts-engineer` skip

**setup-worktree.sh specifics**: pre-resolution root detection, `npm install`, turbo build, plugin tsconfigs, `setup-worktree-extra.sh` extension point

**Templates**: all 9 exist, correct placeholders, no CI/CD section, no extra templates

**Commands**: all 4 exist, no `mcp__software-house__` refs, correct `mcp__ts-engineer__` prefix

### Test Results (2026-02-21)

- Syntax: All 4 scripts pass `bash -n`
- Fresh repo: All files generated correctly (9 root files, 4+8+3+37 symlinks, codemaps, specs)
- Idempotency: Second run skips all existing files, creates 0 new symlinks
- Content: `.mcp.json` correct bin path, `ts-engineer.config.json` correct codemaps, architecture codemap clean
- Automated: 69/69 tests pass
