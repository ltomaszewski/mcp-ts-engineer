# MCP TypeScript Engineer

MCP server for multi-agent software engineering workflows using Claude Agent SDK. Git submodule for any monorepo.

## Architecture

```
packages/mcp-ts-engineer/
├── src/
│   ├── config/              # SERVER_INFO, PROVIDER_CONFIG, budgets
│   ├── core/                # logger, ai-provider, session, cost, prompt, capability-registry
│   ├── providers/claude/    # ClaudeProvider (Agent SDK)
│   ├── capabilities/        # MCP capabilities (see rules/capabilities.md)
│   ├── server.ts            # MCP server factory
│   └── index.ts             # Entry point
├── __tests__/               # Root-level tests
├── scripts/                 # Shell scripts (see rules/scaffold-system.md)
├── templates/               # App scaffold templates (see rules/scaffold-system.md)
├── vitest.config.ts
├── tsconfig.json / tsconfig.build.json
└── package.json
```

### Key Patterns

- **Capability-Based**: Self-contained modules in `src/capabilities/{name}/` with schemas, types, prompts, tests
- **DI via Registry**: `CapabilityRegistry` receives all framework deps at construction, no global state
- **AI Provider Abstraction**: `AIProvider` interface → `ClaudeProvider`, factory pattern
- **Session Management**: `SessionManager` tracks lifecycle, metadata, budget per session/day
- **Cost Tracking**: `CostTracker` aggregates costs, enforces budgets at query/session levels
- **Prompt Versioning**: `capabilities/{name}/prompts/v1.ts`, loaded by `PromptLoader`
- **Structured Logging**: Dual-write (stderr + disk NDJSON), context binding, auto-redaction
- **Graceful Shutdown**: `gracefulShutdown()` aborts queries, closes sessions, writes reports, flushes logs

## Technology Stack

- **Runtime**: Node.js 20+, ES Modules
- **MCP SDK**: `@modelcontextprotocol/sdk`
- **Agent SDK**: `@anthropic-ai/claude-agent-sdk`
- **Validation**: Zod
- **Testing**: Vitest (80% coverage, branch 25%)
- **TypeScript**: Strict mode, Node16 module resolution

## Development Commands

```bash
npm install           # Install dependencies
npm run build         # Build TypeScript
npm run start         # Production server
npm run dev           # Dev mode with auto-reload
npm test              # Run tests
npm run test:watch    # Watch mode
npm run test:coverage # Coverage report
```

## Available Capabilities

### echo_agent

Proof-of-concept: Claude Agent SDK integration. Pure text, single turn, no tools.

- Input: `prompt` (string, max 10k), `model` ("haiku"|"sonnet", default "haiku")
- Output: `response`, `cost_usd`, `turns`
- Budget: $0.01 (haiku), $0.10 (sonnet)

## Authentication

Uses Claude Code CLI subscription auth. No API key needed.

1. Install: `curl -fsSL https://claude.ai/install.sh | bash`
2. Login: `claude login` → "Log in with subscription account"

## Test Organization

| Module | Test Location |
|--------|--------------|
| Config | `__tests__/config.test.ts` |
| Server factory | `__tests__/server.test.ts` |
| Logger | `src/core/logger/__tests__/` |
| AI provider | `src/core/ai-provider/__tests__/` |
| Session manager | `src/core/session/__tests__/` |
| Cost tracking | `src/core/cost/__tests__/` |
| Prompt loader | `src/core/prompt/__tests__/` |
| Capability registry | `src/core/capability-registry/__tests__/` |
| Echo agent | `src/capabilities/echo-agent/__tests__/` |
| Claude provider | `src/providers/claude/__tests__/` |
| Scripts | `__tests__/bootstrap-scripts.test.ts`, `create-app-scripts.test.ts` |

## Configuration Constants

All in `src/config/constants.ts`:

| Category | Key Constants |
|----------|-----------|
| Server | `SERVER_INFO`, `BLOCKED_TOOLS` |
| Providers | `PROVIDER_CONFIG` |
| Logging | `LOG_ROTATION_SIZE_MB`, `MAX_ENTRY_SIZE_MB` |
| Sessions | `SESSION_MAX_DEPTH`, `MAX_INVOCATIONS_PER_SESSION` |
| Budgets | `MAX_SESSION_BUDGET_USD`, `MAX_DAILY_BUDGET_USD`, `MAX_QUERY_BUDGET_USD` |
| Security | `MAX_TURNS`, `MAX_PROMPT_LENGTH` |
| Shutdown | `SHUTDOWN_COST_WAIT_MS`, `SHUTDOWN_COST_WAIT_MAX_MS` |
| Locking | `LOCK_TIMEOUT_MS`, `STALE_LOCK_AGE_MS` |
| Timeouts | `HOOK_TIMEOUT_MS`, `VALIDATION_TIMEOUT_MS` |

## References

### Path-scoped rules (load on demand via `globs:` frontmatter)
- Capabilities: `.claude/rules/capabilities.md` → `src/capabilities/**`
- Scaffold system: `.claude/rules/scaffold-system.md` → `templates/**`, `scripts/**`
- Spec lifecycle: `.claude/rules/spec-lifecycle.md` → `docs/specs/**`
- Next.js: `.claude/rules/nextjs-app.md` → `apps/*-web/**`, `apps/*-frontend/**`

### Global rules (always loaded)
- `coding-style.md`, `git-workflow.md`, `security.md`, `testing.md`, `performance.md`, `agents.md`

### Skills (load on invocation or auto-match)
- Code patterns: `.claude/skills/patterns/` (service, hooks, stores, validation, testing)
- Hooks config: `.claude/skills/hooks/` (PreToolUse, PostToolUse, settings.json)
- All other skills: `.claude/skills/`
