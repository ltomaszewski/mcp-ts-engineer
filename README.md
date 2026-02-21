# MCP TypeScript Engineer

> Generic MCP server for multi-agent software engineering workflows — designed as a git submodule for turbo-based npm monorepos.

## Overview

**mcp-ts-engineer** provides AI-powered software development capabilities via the Model Context Protocol (MCP). It integrates the Claude Agent SDK to coordinate specialized agents (reviewer, implementer, auditor, finalizer) for feature development with proper planning, TDD execution, and quality gates.

When added as a git submodule, it provides:
- **MCP tools**: `todo_reviewer`, `todo_code_writer`, `finalize`, `audit_fix`, `pr_reviewer`
- **Claude Code commands**: `/worktree-add`, `/issue-capture`, `/issue-implement`, `/issue-to-todo`
- **Claude Code skills**: 35+ reusable skills (NestJS, React Native, Expo, TypeScript, etc.)
- **Claude Code rules**: Coding style, git workflow, testing, security, performance
- **Claude Code contexts**: Dev, research, review modes
- **Bootstrap script**: Scaffolds entire monorepo + Claude Code environment in one command

## Architecture

```
your-monorepo/
├── packages/mcp-ts-engineer/     ← git submodule
│   ├── src/capabilities/         ← MCP tool implementations
│   ├── .claude/commands/         ← command source files
│   ├── .claude/skills/           ← 35+ skill directories
│   ├── .claude/rules/            ← coding guidelines
│   ├── .claude/contexts/         ← context modes
│   ├── scripts/                  ← bootstrap, update, setup scripts
│   └── templates/config/         ← config file templates
├── .claude/commands/             → symlinks to submodule
├── .claude/skills/               → symlinks to submodule
├── .claude/rules/                → symlinks to submodule
├── .claude/contexts/             → symlinks to submodule
├── .mcp.json                     ← generated (MCP server config)
├── ts-engineer.config.json       ← generated (server settings)
└── CLAUDE.md                     ← generated (project instructions)
```

The MCP server key is always `ts-engineer` → tools are `mcp__ts-engineer__*`.

## Quick Start

```bash
# 1. Create repo
mkdir my-project && cd my-project
git init

# 2. Add submodule
git submodule add git@github.com:ltomaszewski/mcp-ts-engineer.git packages/mcp-ts-engineer

# 3. Run bootstrap (scaffolds everything)
bash packages/mcp-ts-engineer/scripts/bootstrap.sh

# 4. Commit
git add -A && git commit -m "chore: initial monorepo setup"
```

## What Bootstrap Does

The bootstrap script auto-detects project name, repo owner/name, and discovered workspaces. It generates:

- **Root monorepo files**: `package.json` (turbo + npm workspaces), `turbo.json`, `tsconfig.json`, `vitest.config.ts`, `biome.json`, `.gitignore`
- **MCP configuration**: `.mcp.json` (server registration), `ts-engineer.config.json` (server settings)
- **Claude Code environment**: `CLAUDE.md`, symlinked commands/skills/rules/contexts
- **Project infrastructure**: `.claude/codemaps/` (per project), `docs/specs/` (spec directories), GitHub labels
- **Worktree setup**: `scripts/setup-worktree.sh` (symlinked to submodule)
- **Submodule build**: `npm install && npm run build` in the submodule

**Idempotency**: Config files are skipped if they exist. `.mcp.json` is merged (adds entry without overwriting). Symlinks are skipped if present. Safe to run multiple times.

**Arguments** (all optional — auto-detected by default):
```
--repo-owner "org"     GitHub org (override auto-detection)
--repo-name "repo"     GitHub repo name (override auto-detection)
```

## For Collaborators

```bash
git clone --recurse-submodules git@github.com:org/my-project.git
cd my-project
npm install
```

## Updating the Submodule

```bash
cd packages/mcp-ts-engineer && git pull origin main && cd ../..
bash packages/mcp-ts-engineer/scripts/update.sh
git add -A && git commit -m "chore: update mcp-ts-engineer"
```

The update script re-syncs symlinks, discovers new projects, and rebuilds the submodule.

## Available MCP Tools

| Tool | Purpose |
|------|---------|
| `mcp__ts-engineer__todo_reviewer` | Review and validate spec files (TDD validation, structure check) |
| `mcp__ts-engineer__todo_code_writer` | TDD implementation from spec (multi-phase: eng → audit → commit) |
| `mcp__ts-engineer__finalize` | Post-implementation: audit, test, codemap update, commit |
| `mcp__ts-engineer__audit_fix` | Fix lint, type, test, and dependency violations |
| `mcp__ts-engineer__pr_reviewer` | Comprehensive PR review with auto-fix capabilities |
| `mcp__ts-engineer__echo_agent` | Test agent connectivity (proof-of-concept) |

## Available Commands

| Command | Purpose |
|---------|---------|
| `/worktree-add <purpose>` | Create isolated git worktree with auto-cleanup of merged worktrees |
| `/issue-capture` | Capture session context as a structured GitHub issue |
| `/issue-implement <number>` | End-to-end pipeline: import → worktree → review → implement → finalize → PR |
| `/issue-to-todo <number>` | Import GitHub issue to local spec file |

## Available Skills

Categorized by domain:

**Backend (NestJS)**:
`nestjs-core`, `nestjs-auth`, `nestjs-graphql`, `nestjs-mongoose`

**Mobile (React Native / Expo)**:
`react-native-core`, `expo-core`, `expo-router`, `expo-notifications`, `reanimated`, `keyboard-controller`, `nativewind`, `flash-list`, `react-hook-form`

**State & Data**:
`react-query`, `zustand`, `mmkv`, `graphql-request`

**Validation & Quality**:
`zod`, `class-validator`, `biome`, `typescript-clean-code`, `rn-testing-library`, `maestro`

**AI & Engineering**:
`ai-engineering`, `claude-agent-sdk`, `anthropic-prompt-engineering`

**Utilities**:
`date-fns`, `netinfo`, `sentry-react-native`, `graphql-curl-testing`

**Workflow**:
`codemap-updater`, `session-manager`, `continuous-learning`, `design-system`

**Deployment**:
`azure-deployment`

## Repo-Specific Customization

| File | Purpose | Editable? |
|------|---------|-----------|
| `ts-engineer.config.json` | Server name, codemaps, review checklist | Yes |
| `scripts/setup-worktree-extra.sh` | Custom worktree setup steps (sourced after main setup) | Create if needed |
| `.claude/codemaps/*.md` | Project-specific code maps | Yes (not symlinked) |
| `docs/specs/*/todo/` | Spec files for documentation-driven development | Yes |
| `CLAUDE.md` | Project-wide Claude Code instructions | Yes |

## Monorepo Schema

All consuming repos follow a fixed schema:

- **Package manager**: npm with workspaces (`apps/*`, `packages/*`)
- **Build orchestration**: Turborepo (`turbo.json`)
- **Testing**: Vitest (`vitest.config.ts` — native TypeScript, zero-config monorepo discovery)
- **Linting/Formatting**: Biome (`biome.json` — single Rust binary, replaces ESLint + Prettier)
- **Node.js**: ≥22.0.0
- **Root deps**: Only repo tools (turbo, vitest, biome, husky, commitlint)
- **App/package deps**: Installed in the workspace that uses them

## CI/CD

```yaml
# .github/workflows/ci.yml
name: CI
on: [push, pull_request]
jobs:
  check:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
        with:
          submodules: recursive
      - uses: actions/setup-node@v4
        with:
          node-version: 22
          cache: npm
      - run: npm ci
      - run: npx turbo run build test lint format:check type-check
```

## Development

### Building & Testing

```bash
npm install          # Install dependencies
npm run build        # Build TypeScript
npm start            # Start MCP server
npm run dev          # Development with auto-reload
npm test             # Run tests
npm run test:watch   # Watch mode
npm run test:coverage # Coverage report
```

### Adding New Capabilities

See `CLAUDE.md` for the full capability creation guide. Each capability is a self-contained module:

```
src/capabilities/my-capability/
├── my-capability.capability.ts   # Handler + definition
├── my-capability.schema.ts       # Zod input/output schemas
├── my-capability.types.ts        # TypeScript types
├── prompts/                      # Versioned prompts
│   └── v1.ts
├── __tests__/                    # Tests
└── index.ts                      # Exports
```

### Authentication

Uses **Claude Code CLI subscription authentication** — no API key required.

1. Install Claude Code CLI: `curl -fsSL https://claude.ai/install.sh | bash`
2. Authenticate: `claude login`
3. Choose "Log in with subscription account"

### Configuration

All constants in `src/config/constants.ts`:

| Category | Examples |
|----------|----------|
| Budgets | `MAX_SESSION_BUDGET_USD` (10.0), `MAX_DAILY_BUDGET_USD` (500.0) |
| Sessions | `SESSION_MAX_DEPTH` (5), `MAX_SESSION_DURATION_MS` (30 min) |
| Security | `MAX_TURNS` (100), `MAX_PROMPT_LENGTH` (50k) |
| Logging | Log rotation, sensitive data redaction |

## License

MIT
