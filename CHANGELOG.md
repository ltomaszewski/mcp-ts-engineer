# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).

## [Unreleased]

### Added
- Master optimization PR #40 — 8 issues, 53 functional requirements across quality, speed, architecture
- `pr_fixer` capability — automated PR fixes from review findings, two-tier fix strategy, cross-round tracking
- Slash commands: `/deep-review`, `/doc-audit`, `/health-check`, `/issue-shape`, `/skills-rn`, `/update-skills`, `/prompt-engineer`
- mcpmon hot-reload proxy for MCP server development
- Auto-configuration of MCP tool permissions in `settings.local.json` during bootstrap
- New skills: `agent-browser`, `doc-prd`, `gesture-handler`, `hooks`, `lucide-react`, `next-themes`, `patterns`, `rn-screens`, `safe-area-context`, `sonner`
- `nextjs-seo` skill — JSON-LD, robots.txt, sitemap.ts, llms.txt, markdown middleware for AI bots
- Next.js web app template (`next-app`) with TanStack Query, Better Auth, shadcn/ui, SEO infrastructure
- Worktree reuse and project exclusion in audit/review capabilities
- `pr-reviewer` per-project context loading and React hooks performance review rules
- Detailed issue tracking in `pr-reviewer` commit messages and PR comments
- PR review-fix loop in `issue-implement` pipeline
- SECURITY.md, CONTRIBUTING.md, CHANGELOG.md for open source release
- LICENSE (MIT), GitHub issue templates and PR template
- Input validation for shell command arguments (`execFileSync` with array args)
- Branded README header image

### Changed
- Expo template upgraded to SDK 55 with NativeWind v5 alignment
- `anthropic-prompt-engineering` skill updated for Claude Opus 4.7
- `prompt-engineer` command moved from user profile to repo
- 51 skills optimized for Claude 4.6 prompt engineering best practices
- Multiple skills bumped to latest versions (15 + 10 + 7 + 6 batches)
- `prd` skill renamed to `doc-prd`
- `nestjs-mongoose` skill updated to Mongoose 9.x
- `nestjs-server` template dependencies bumped, GraphQL Yoga replaces Apollo, `tsx` replaces `ts-node-dev`, vitest v4
- `@anthropic-ai/claude-agent-sdk` updated to 0.2.83
- Removed `skip_tests` option from `audit_fix`/`finalize` — tests always run
- Biome 2.4.4 formatting pass and template schema update
- CLAUDE.md and rules optimized for dynamic context loading
- Always use 800K prompt budget (all models support 1M context)

### Fixed
- `symlink_file` repair for broken or wrong-target symlinks (#40 fallout)
- `audit_fix` fatal error propagation (#30) and lost-changes prevention (#27)
- `audit_fix` and test runner hangs (#26); per-project 60min timeout enforcement
- `pr-reviewer` infrastructure file deletion prevention, preflight SHA parsing, GitHub comment posting
- `pr-reviewer`/`pr-fixer` cwd propagation for worktree isolation
- `health-check` autonomous end-to-end execution without pauses
- Provider watchdog timeouts to prevent hung CLI subprocesses
- `core` git root resolution for worktree cwd (#23)
- Timeout constants tuned to production performance data (#24)
- Bootstrap: Bun install + login shell PATH for Claude Code MCP spawning, `repoOwner`/`repoName` injection, kebab-case `logDir` derivation
- Test prompt v2 with `--outputFile` to prevent re-run loops (#28)
- Cost module missing `node:crypto` import for `randomBytes`
- Shell-safe quoting and input validation for prompt bash commands
- Command injection risks in `github-comment.ts`, `pr-reviewer.orchestration.ts`, `git-utils.ts`
- Hardcoded local paths in `workspace-detector.test.ts`
- `.gitignore` missing `.env*` and `.turbo/` patterns
- Submodule init before `setup-worktree` in worktrees

### Removed
- Tracked `.turbo/` directory containing local filesystem paths
- Internal project references ("Bastion") from code and tests
- `skip_tests` option in `audit_fix` and `finalize`

## [1.0.0] - 2025-12-01

### Added
- **Core framework**: Logger, session manager, cost tracker, prompt loader, capability registry
- **AI provider**: Claude Agent SDK integration via `ClaudeProvider`
- **Capabilities**:
  - `echo_agent` — proof-of-concept agent connectivity test
  - `todo_reviewer` — spec file review and TDD validation
  - `todo_code_writer` — multi-phase TDD implementation from specs
  - `finalize` — post-implementation audit, test, codemap update, commit
  - `audit_fix` — automated lint, type, test, and dependency violation fixes
  - `pr_reviewer` — comprehensive PR review with structured issue tracking
  - `pr_fixer` — automated PR fix from review findings
- **App scaffold system**: `create-app.sh` with registry-driven templates
  - `expo-app` — React Native (Expo) with NativeWind, Expo Router, Zustand
  - `nestjs-server` — NestJS with GraphQL Yoga, MongoDB, JWT auth
  - `mcp-server` — MCP server with Claude Agent SDK
  - `next-app` — Next.js 15 with TanStack Query, Better Auth, shadcn/ui, SEO infrastructure
- **Bootstrap script**: One-command monorepo scaffolding
- **Claude Code integration**: 35+ skills, commands, rules, contexts
- **Security**: Log redaction, budget enforcement, blocked tools, input validation
- **Structured logging**: Dual-write (stderr + NDJSON disk), rotation, context binding
- **Cost tracking**: Per-session and daily budgets with cost report generation
- **Spec lifecycle**: DRAFT → IN_REVIEW → READY → IMPLEMENTED state machine
