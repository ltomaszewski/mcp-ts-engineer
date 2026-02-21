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
│   ├── scripts/                  ← bootstrap, create-app, update scripts
│   └── templates/
│       ├── config/               ← monorepo root config templates
│       └── apps/                 ← app scaffold templates (expo, nestjs, mcp)
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

## Creating Apps

Scaffold new apps inside `apps/` from built-in templates using `create-app.sh` or the `/create-app` Claude Code command.

### Command Line

```bash
bash packages/mcp-ts-engineer/scripts/create-app.sh \
  --type <app-type> --name <app-name> [--port <port>]
```

### Claude Code Command

```
/create-app expo-app my-mobile
/create-app nestjs-server my-api --port 3002
/create-app mcp-server my-agent
```

Or just `/create-app` — it will ask for type and name interactively.

### Available App Types

| Type | Label | Test Runner | Key Stack |
|------|-------|-------------|-----------|
| `expo-app` | React Native (Expo) | Jest (`jest-expo`) | Expo SDK 54, NativeWind, Expo Router, Zustand, TanStack Query |
| `nestjs-server` | NestJS Backend | Vitest (`unplugin-swc`) | NestJS v11, GraphQL (Apollo), MongoDB (Mongoose), JWT auth |
| `mcp-server` | MCP Server | Vitest | Claude Agent SDK, MCP SDK, ESM, Zod |

**Why Jest for Expo?** `jest-expo` provides 100+ native module mocks out of the box. `vitest-react-native` is still experimental — Jest remains the safer choice for React Native.

**Why Vitest for NestJS?** Officially recommended by NestJS with `unplugin-swc` for decorator metadata. 3-4x faster than Jest.

### What It Creates

```
apps/<name>/
├── package.json          # Deps and scripts (workspace-aware)
├── tsconfig.json         # TypeScript config
├── biome.json            # Biome exclude rules (inherits root)
├── [test config]         # jest.config.js or vitest.config.ts
├── src/                  # Source code with starter files
└── ...                   # Type-specific config files
```

The script also:
1. Creates `docs/specs/<name>/todo/` for spec-driven development
2. Runs `npm install` to register the new workspace
3. Runs `update.sh` to regenerate codemaps and symlinks

### Template Placeholders

All `.template` files use `{{PLACEHOLDER}}`:

| Placeholder | Source | Example |
|---|---|---|
| `{{APP_NAME}}` | `--name` arg | `my-app` |
| `{{PACKAGE_NAME}}` | `@${repo}/${name}` | `@my-project/my-app` |
| `{{PASCAL_NAME}}` | PascalCase of name | `MyApp` |
| `{{EXPO_SLUG}}` | Same as name | `my-app` |
| `{{BUNDLE_ID}}` | `com.${repo}.${name}` (no hyphens) | `com.myproject.myapp` |
| `{{PORT}}` | `--port` or `3001` | `3001` |

### Adding a New App Type

The template system is fully registry-driven — **no script changes needed**:

1. Create template directory:
   ```bash
   mkdir -p templates/apps/my-type/src
   ```

2. Add entry to `templates/apps/registry.json`:
   ```json
   {
     "appTypes": {
       "my-type": {
         "label": "My Framework",
         "description": "Short description of the stack"
       }
     }
   }
   ```

3. Add template files with `.template` suffix. Use `{{PLACEHOLDER}}` for variable substitution.

4. Special file naming:
   - `swcrc.template` → `.swcrc` (dot-prefix added automatically)
   - `env.example.template` → `.env.example` (dot-prefix added automatically)
   - Non-`.template` files (e.g., `.gitkeep`) are copied as-is

### Per-App Scripts (Consistent Across All Types)

| Script | expo-app | nestjs-server | mcp-server |
|---|---|---|---|
| `dev` | `expo start` | `tsx watch src/main.ts` | `tsx src/index.ts` |
| `build` | `tsc` | `tsc -p tsconfig.build.json` | `rm -rf build && tsc` |
| `start` | — | `node dist/main.js` | `node build/index.js` |
| `test` | `jest` | `vitest run` | `vitest run` |
| `test:watch` | `jest --watch` | `vitest` | `vitest` |
| `test:coverage` | `jest --coverage` | `vitest run --coverage` | `vitest run --coverage` |
| `type-check` | `tsc --noEmit` | `tsc --noEmit` | `tsc --noEmit` |
| `lint` | `biome check .` | `biome check .` | `biome check .` |
| `format` | `biome format --write .` | `biome format --write .` | `biome format --write .` |
| `clean` | `rm -rf .expo dist node_modules` | `rm -rf dist` | `rm -rf build` |

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
| `/create-app [type] [name]` | Scaffold a new app from a template (interactive if args omitted) |
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
