# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).

## [Unreleased]

### Added
- SECURITY.md, CONTRIBUTING.md, CHANGELOG.md for open source release
- LICENSE (MIT)
- GitHub issue templates and PR template
- Input validation for shell command arguments (`execFileSync` with array args)

### Fixed
- Command injection risks in `github-comment.ts`, `pr-reviewer.orchestration.ts`, `git-utils.ts`
- Hardcoded local paths in `workspace-detector.test.ts`
- `.gitignore` missing `.env*` and `.turbo/` patterns
- Removed tracked `.turbo/` directory containing local filesystem paths
- Removed internal project references ("Bastion") from code and tests

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
