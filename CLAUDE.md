# MCP Software House Server

AI assistant instructions for the MCP Software House Server development.

## Overview

**MCP Software House Server** - An MCP server that orchestrates multi-agent software development workflows using the Claude Agent SDK.

**Purpose**: Coordinate specialized agents (planner, implementer, reviewer, tester) to handle complex feature development with proper planning, execution, and quality gates.

## Architecture

### Directory Structure

```
apps/bastion-mcp-software-house/
├── src/
│   ├── config/                          # Configuration constants
│   │   ├── constants.ts                 # SERVER_INFO, PROVIDER_CONFIG, etc.
│   │   └── index.ts                     # Config exports
│   ├── core/                            # Core framework
│   │   ├── logger/                      # Structured logging with disk persistence
│   │   │   ├── logger.ts                # Logger class with context binding
│   │   │   ├── disk-writer.ts           # NDJSON file writer with rotation
│   │   │   ├── redact.ts                # Sensitive data redaction
│   │   │   ├── logger.types.ts          # Logger interfaces
│   │   │   ├── __tests__/               # Logger unit tests
│   │   │   └── index.ts                 # Logger exports
│   │   ├── ai-provider/                 # AI provider abstraction
│   │   │   ├── ai-provider.types.ts     # Provider interfaces
│   │   │   ├── ai-provider.factory.ts   # Provider registry and factory
│   │   │   ├── __tests__/               # Provider tests
│   │   │   └── index.ts                 # Provider exports
│   │   ├── session/                     # Session management
│   │   │   ├── session.manager.ts       # Session lifecycle and storage
│   │   │   ├── session.types.ts         # Session interfaces
│   │   │   ├── __tests__/               # Session tests
│   │   │   └── index.ts                 # Session exports
│   │   ├── cost/                        # Cost tracking and reporting
│   │   │   ├── cost.tracker.ts          # Cost aggregation and budgets
│   │   │   ├── cost.types.ts            # Cost interfaces
│   │   │   ├── cost-report.writer.ts    # Cost report generation
│   │   │   ├── cost-report.schemas.ts   # Cost report JSON schemas
│   │   │   ├── cost-report.types.ts     # Cost report interfaces
│   │   │   ├── __tests__/               # Cost tests
│   │   │   └── index.ts                 # Cost exports
│   │   ├── prompt/                      # Prompt management
│   │   │   ├── prompt.loader.ts         # Prompt version loading
│   │   │   ├── prompt.types.ts          # Prompt interfaces
│   │   │   ├── __tests__/               # Prompt tests
│   │   │   └── index.ts                 # Prompt exports
│   │   ├── capability-registry/         # Capability registration system
│   │   │   ├── capability-registry.ts   # CapabilityRegistry class
│   │   │   ├── capability-registry.types.ts # Registry interfaces
│   │   │   ├── __tests__/               # Registry tests
│   │   │   └── index.ts                 # Registry exports
│   │   ├── errors.ts                    # Framework error classes
│   │   ├── framework.types.ts           # Core framework types
│   │   ├── __tests__/                   # Core unit tests
│   │   └── index.ts                     # Core exports
│   ├── providers/                       # AI provider implementations
│   │   ├── claude/                      # Claude Agent SDK provider
│   │   │   ├── claude.provider.ts       # ClaudeProvider class
│   │   │   ├── __tests__/               # Provider tests
│   │   │   └── index.ts                 # Claude provider exports
│   │   └── index.ts                     # Provider exports
│   ├── capabilities/                    # MCP capability implementations
│   │   ├── echo-agent/                  # Echo agent capability
│   │   │   ├── echo-agent.capability.ts # Capability definition
│   │   │   ├── echo-agent.schema.ts     # Input/output schemas
│   │   │   ├── echo-agent.types.ts      # Type definitions
│   │   │   ├── prompts/                 # Versioned prompts
│   │   │   │   ├── v1.ts                # Echo agent prompt v1
│   │   │   │   └── index.ts             # Prompt exports
│   │   │   ├── __tests__/               # Capability tests
│   │   │   └── index.ts                 # Echo agent exports
│   │   └── index.ts                     # Capability registration hub
│   ├── server.ts                        # MCP server factory
│   └── index.ts                         # Entry point (minimal)
├── tests/                               # Additional tests
│   ├── setup.ts                         # Jest ESM setup
│   └── unit/                            # Unit tests
│       ├── config.test.ts               # Config tests
│       └── server.test.ts               # Server factory tests
├── jest.config.js                       # Jest ESM configuration
├── package.json                         # ESM package config
├── tsconfig.json                        # TypeScript config
├── README.md                            # User documentation
└── CLAUDE.md                            # This file (dev instructions)
```

### Key Patterns

**Capability-Based Architecture**:
- Each capability is a self-contained module in `src/capabilities/{name}/`
- Capabilities define their own schemas, types, prompts, and tests
- `CapabilityDefinition` interface standardizes capability structure
- `CapabilityRegistry` manages registration and MCP binding

**Capability Structure**:
```typescript
interface CapabilityDefinition {
  name: string;                  // Unique capability identifier
  title: string;                 // Human-readable title
  description: string;           // What the capability does
  inputSchema: ZodSchema;        // Zod schema for validation
  handler: CapabilityHandler;    // Async implementation function
}
```

**Framework Dependency Injection**:
- `CapabilityRegistry` receives all framework dependencies at construction
- Capabilities access dependencies via registry context
- No global state or singletons

**AI Provider Abstraction**:
- `AIProvider` interface defines standard AI query methods
- `ClaudeProvider` implements Claude Agent SDK integration
- Factory pattern for provider creation and registration

**Session Management**:
- `SessionManager` tracks agent invocations and lifecycle
- Sessions store metadata, timestamps, and nesting depth
- Budget tracking per session and per day

**Cost Tracking**:
- `CostTracker` aggregates costs per session
- Budget enforcement at query and session levels
- Cost reports generated on session close

**Prompt Management**:
- Prompts live in `capabilities/{name}/prompts/`
- Versioned prompt files (v1.ts, v2.ts, etc.)
- `PromptLoader` loads prompts by name and version

**Structured Logging**:
- Dual-write: stderr (MCP protocol) + disk (NDJSON files)
- Context binding for hierarchical logging
- Automatic sensitive data redaction
- Session-specific log files with rotation

**Graceful Shutdown**:
- Registry's `gracefulShutdown()` handles all cleanup
- Aborts in-flight queries, waits for cost aggregation
- Closes sessions, writes cost reports, flushes logs
- SIGINT/SIGTERM handlers in entry point

## Technology Stack

- **Runtime**: Node.js 20+ with ES Modules
- **MCP SDK**: `@modelcontextprotocol/sdk` for MCP server
- **Agent SDK**: `@anthropic-ai/claude-agent-sdk` for Claude agents
- **Validation**: Zod for input schema validation
- **Testing**: Jest with ESM support
- **TypeScript**: Strict mode with Node16 module resolution

## Development Commands

```bash
# Install dependencies
npm install

# Build TypeScript
npm run build

# Start production server
npm run start

# Development mode with auto-reload
npm run dev

# Run tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage
```

## Available Capabilities

### echo_agent

Proof-of-concept capability demonstrating Claude Agent SDK integration.

**Input**:
- `prompt` (string, required): Text prompt to send to Claude (max 10,000 chars)
- `model` (enum, optional): "haiku" or "sonnet" (default: "haiku")

**Output** (JSON):
- `response` (string): Claude's text response
- `cost_usd` (number): Total query cost
- `turns` (number): Conversation turns

**Security Constraints**:
- No tool access (pure text)
- Single turn only
- Budget: $0.01 (haiku), $0.10 (sonnet)

## Authentication

Uses **Claude Code CLI subscription authentication**. No API key required.

**Prerequisites**:
1. Install Claude Code CLI: `curl -fsSL https://claude.ai/install.sh | bash`
2. Authenticate with your subscription: `claude login`
3. Choose "Log in with subscription account" when prompted

The SDK automatically uses your authenticated CLI session.

## Code Style

Follow monorepo standards from root `CLAUDE.md`:
- Files under 300 lines
- Functions under 50 lines (prefer 20-30)
- Explicit return types on all functions
- TSDoc comments for public APIs
- Max nesting depth: 3 levels

## Testing

- **Unit tests**: Jest with ES modules
- **Coverage target**: 80% lines/statements/functions
- **Test location**: `__tests__/` directories next to source files, plus `tests/` at root
- **ESM Note**: Branch coverage threshold lowered due to ESM mocking limitations

### Running Tests

```bash
npm test                  # All tests
npm run test:watch        # Watch mode
npm run test:coverage     # With coverage report
```

### Test Organization

| Module | Test Location | Coverage |
|--------|--------------|----------|
| Config constants | `tests/unit/config.test.ts` | All constants including PROVIDER_CONFIG |
| Server factory | `tests/unit/server.test.ts` | Server initialization |
| Logger | `src/core/logger/__tests__/` | Logger, disk-writer, redact |
| AI provider | `src/core/ai-provider/__tests__/` | Provider factory |
| Session manager | `src/core/session/__tests__/` | Session lifecycle |
| Cost tracking | `src/core/cost/__tests__/` | Cost tracker, report writer, schemas |
| Prompt loader | `src/core/prompt/__tests__/` | Prompt loading |
| Capability registry | `src/core/capability-registry/__tests__/` | Registration, binding |
| Echo agent capability | `src/capabilities/echo-agent/__tests__/` | Schema, capability, integration |
| Claude provider | `src/providers/claude/__tests__/` | ClaudeProvider implementation |

## Security

**Critical**:
- Redact sensitive data in all logs (API keys, tokens)
- Block recursive tool calls via `BLOCKED_TOOLS`
- Never log tokens or credentials unredacted
- Budget enforcement at query and session levels
- Security validation for all AIQueryRequest parameters

## Adding New Capabilities

1. **Create capability directory**:
```bash
mkdir -p src/capabilities/my-capability/{prompts,__tests__}
```

2. **Define schemas** in `src/capabilities/my-capability/my-capability.schema.ts`:
```typescript
import { z } from "zod";

export const MyCapabilityInputSchema = z.object({
  input: z.string().min(1).max(10000),
  options: z.object({
    model: z.enum(["haiku", "sonnet"]).default("haiku"),
  }).optional(),
});

export const MyCapabilityOutputSchema = z.object({
  result: z.string(),
  metadata: z.object({
    cost_usd: z.number(),
    turns: z.number(),
  }),
});

export type MyCapabilityInput = z.infer<typeof MyCapabilityInputSchema>;
export type MyCapabilityOutput = z.infer<typeof MyCapabilityOutputSchema>;
```

3. **Create types** in `src/capabilities/my-capability/my-capability.types.ts`:
```typescript
export interface MyCapabilityContext {
  sessionId: string;
  requestId: string;
}
```

4. **Create prompts** in `src/capabilities/my-capability/prompts/v1.ts`:
```typescript
export const PROMPT_V1 = `
You are a specialized assistant.
Task: {task}
`.trim();
```

5. **Implement capability** in `src/capabilities/my-capability/my-capability.capability.ts`:
```typescript
import type { CapabilityDefinition } from "../../core/capability-registry/index.js";
import type { CapabilityRegistryContext } from "../../core/framework.types.js";
import { MyCapabilityInputSchema, MyCapabilityOutputSchema } from "./my-capability.schema.js";
import type { MyCapabilityInput, MyCapabilityOutput } from "./my-capability.schema.js";
import { PROMPT_V1 } from "./prompts/v1.js";

export const myCapabilityDefinition: CapabilityDefinition = {
  name: "my_capability",
  title: "My Capability",
  description: "Description of what this capability does",
  inputSchema: MyCapabilityInputSchema,
  handler: async (input: MyCapabilityInput, context: CapabilityRegistryContext) => {
    const { sessionManager, aiProvider, costTracker, logger } = context;

    // Open session
    const session = await sessionManager.openSession({
      capabilityName: "my_capability",
      metadata: { input },
    });

    try {
      // Execute AI query
      const result = await aiProvider.query({
        sessionId: session.sessionId,
        prompt: PROMPT_V1.replace("{task}", input.input),
        maxTurns: 1,
        budgetUsd: 0.01,
        timeoutMs: 30000,
      });

      // Track costs
      await costTracker.recordCost(session.sessionId, result.costUsd);

      // Close session
      await sessionManager.closeSession(session.sessionId, {
        success: true,
        result: result.response,
      });

      return MyCapabilityOutputSchema.parse({
        result: result.response,
        metadata: {
          cost_usd: result.costUsd,
          turns: result.turns,
        },
      });
    } catch (error) {
      await sessionManager.closeSession(session.sessionId, {
        success: false,
        error: error instanceof Error ? error.message : String(error),
      });
      throw error;
    }
  },
};
```

6. **Add tests** in `src/capabilities/my-capability/__tests__/`:
```typescript
// my-capability.schema.test.ts - Schema validation tests
// my-capability.capability.test.ts - Handler logic tests
// my-capability.integration.test.ts - End-to-end tests
```

7. **Register capability** in `src/capabilities/index.ts`:
```typescript
import { myCapabilityDefinition } from "./my-capability/my-capability.capability.js";

export function registerAllCapabilities(registry: CapabilityRegistry): void {
  registry.registerCapability(echoAgentDefinition);
  registry.registerCapability(myCapabilityDefinition); // Add here
}
```

## Capability Visibility

Capabilities can be marked as `public` (default) or `internal`:

- **Public capabilities**: Exposed as MCP tools, invokable by external MCP clients
- **Internal capabilities**: Only accessible via `context.invokeCapability()` from other capabilities, not exposed to MCP clients

### When to use `internal` visibility:
- Sub-capabilities that are implementation details of a larger orchestrator (example: `todo_tdd_validate_step`, `todo_commit_step` within `todo_reviewer`)
- Helper capabilities that should only be called by other capabilities
- Capabilities with incomplete validation that rely on parent capability for context
- Workflow steps that don't make sense to invoke independently

### When to use `public` visibility (default):
- Top-level capabilities that clients should invoke directly
- Standalone capabilities that provide complete functionality
- Entry point capabilities for multi-step workflows

### Example:
```typescript
export const internalHelperCapability: CapabilityDefinition = {
  id: "internal_helper",
  type: "tool",
  visibility: "internal", // <-- Not exposed to MCP clients
  name: "Internal Helper",
  description: "Helper capability for orchestration",
  // ... rest of definition
};

export const publicOrchestrator: CapabilityDefinition = {
  id: "orchestrator",
  type: "tool",
  // visibility defaults to "public" when omitted
  name: "Orchestrator",
  description: "Public-facing orchestrator capability",
  // ... rest of definition
};
```

### Pattern: Orchestrator + Internal Steps

```typescript
// Public orchestrator - exposed to clients
export const orchestratorCapability: CapabilityDefinition = {
  id: "orchestrator",
  type: "tool",
  // No visibility field = defaults to "public"
  processResult: async (input, aiResult, context) => {
    // Invoke internal capabilities
    const step1Result = await context.invokeCapability("internal_step_1", {});
    const step2Result = await context.invokeCapability("internal_step_2", {});
    return { step1: step1Result, step2: step2Result };
  },
};

// Internal step 1 - NOT exposed to clients
export const internalStep1Capability: CapabilityDefinition = {
  id: "internal_step_1",
  type: "tool",
  visibility: "internal",
  // ... implementation
};

// Internal step 2 - NOT exposed to clients
export const internalStep2Capability: CapabilityDefinition = {
  id: "internal_step_2",
  type: "tool",
  visibility: "internal",
  // ... implementation
};
```

## Configuration Constants

All configuration lives in `src/config/constants.ts`:

| Category | Constants |
|----------|-----------|
| Server | `SERVER_INFO`, `BLOCKED_TOOLS` |
| AI Providers | `PROVIDER_CONFIG` (defaultProvider, availableProviders) |
| Logging | `LOG_ROTATION_SIZE_MB`, `MAX_ENTRY_SIZE_MB`, `REDACT_MAX_INPUT_MB` |
| Sessions | `SESSION_MAX_DEPTH`, `MAX_INVOCATIONS_PER_SESSION`, `MAX_SESSION_DURATION_MS` |
| Budgets | `MAX_SESSION_BUDGET_USD`, `MAX_DAILY_BUDGET_USD`, `MAX_QUERY_BUDGET_USD` |
| Security | `MAX_TURNS`, `MAX_PROMPT_LENGTH`, `MAX_SYSTEM_PROMPT_LENGTH` |
| Shutdown | `SHUTDOWN_COST_WAIT_MS`, `SHUTDOWN_COST_WAIT_MAX_MS` |
| File Locking | `LOCK_TIMEOUT_MS`, `STALE_LOCK_AGE_MS`, `LOCK_POLL_MS` |
| Timeouts | `HOOK_TIMEOUT_MS`, `VALIDATION_TIMEOUT_MS`, `OUTPUT_SCHEMA_TIMEOUT_MS` |
| Workers | `WORKER_POOL_SIZE`, `WORKER_MEMORY_LIMIT_HOOKS_MB` |

## Known Issues

### Working Directory Path Duplication (Claude Code CLI Behavior)

**Issue**: Claude Code CLI agents may autonomously change their working directory during execution, causing file writes to nested duplicate paths.

**Symptom**: Files created in paths like `apps/bastion-app/apps/bastion-app/src/...` instead of correct `apps/bastion-app/src/...`

**Root Cause**:
- MCP server correctly passes `cwd` parameter (e.g., `/Users/user/Desktop/monorepo`)
- Claude Code CLI agent receives correct working directory
- During execution, agent autonomously runs `cd` commands or changes directory context
- When file paths in spec reference `apps/bastion-app/...`, agent may interpret this as a subdirectory
- File writes with relative paths then create nested duplicates

**Evidence** (Session 94c033d99ab654a84beba76ff8642147, 2026-02-01):
```
Turn 24: "Error: File does not exist. Current working directory:
  /Users/ltomaszewski/Desktop/bastion-mono/apps/bastion-app/apps/bastion-app"
```

**Impact**:
- Duplicate files created in both correct and nested locations
- Files are typically identical (agent eventually corrects itself)
- Nested directories are untracked by git but cause confusion

**Mitigation**:
1. **Prevention**: Phase engineering prompts explicitly instruct agents to avoid directory changes and use absolute paths
2. **Detection**: Add `.gitignore` entries for common nested patterns (e.g., `apps/bastion-app/apps/`)
3. **Cleanup**: Remove nested directories after execution if detected

**Related Files**:
- `src/capabilities/todo-code-writer/prompts/phase-eng.v2.ts` - Includes working directory warnings
- `.gitignore` - Excludes nested path patterns

---

## Todo Spec File Lifecycle

Todo spec files in `docs/specs/*/todo/*.md` follow a 4-state lifecycle managed by the MCP capabilities. Each capability advances the spec status as it completes its work.

### State Machine

```
DRAFT  ──→  IN_REVIEW  ──→  READY  ──→  IMPLEMENTED
       │                │           │
  todo_reviewer    todo_code_writer  finalize
```

### States

| Status | Meaning | Set By | Next Step |
|--------|---------|--------|-----------|
| `DRAFT` | Spec created, not yet reviewed | User (manual) | Run `todo_reviewer` |
| `IN_REVIEW` | Reviewed and validated, ready for implementation | `todo_reviewer` | Run `todo_code_writer` |
| `READY` | Code implemented and committed, ready for finalization | `todo_code_writer` | Run `finalize` |
| `IMPLEMENTED` | Fully complete: code + audit + tests + codemaps + committed | `finalize` | Done |

### How It Works

1. **User creates spec** with `**Status**: DRAFT` (or no status)
2. **`todo_reviewer`** reviews the spec, validates structure and TDD coverage, sets `**Status**: IN_REVIEW`
3. **`todo_code_writer`** reads the spec, implements code in phases, and on success sets `**Status**: READY`
4. **`finalize`** runs audit, tests, and codemaps; on success sets `**Status**: IMPLEMENTED`

### Rules

- Each capability only advances to the next state (never skips states)
- Status update is atomic: committed in the same git commit as the capability's other changes
- Status update is non-fatal: if the file write fails, the capability logs a warning and continues
- `todo_code_writer` only updates status on successful (non-halted) execution
- `finalize` only updates status when audit passes AND tests pass
- `finalize` requires `spec_path` input to update status (optional field, omit for non-spec workflows)

### Status in Spec Markdown

The status is stored in the spec's metadata header:

```markdown
**App**: bastion-mcp-software-house
**Status**: IN_REVIEW
**Created**: 2026-02-02
```

The `updateSpecStatus` helper in `src/core/utils/spec-status.ts` handles the regex replacement for both `**Status**: X` and `Status: X` formats.

---

## Future Work

- Additional specialized capabilities (planner, implementer, reviewer)
- Multi-agent orchestration workflows
- Workflow state management and persistence
- Result aggregation and reporting
- Enhanced cost reporting and visualization

## References

- Root monorepo: `/CLAUDE.md`
- Coding style: `/.claude/rules/coding-style.md`
- Testing: `/.claude/rules/testing.md`
- Agent patterns: `/.claude/rules/agents.md`
