# MCP Software House

> MCP server for software development agent orchestration using Claude Agent SDK

## Overview

This is a Model Context Protocol (MCP) server that provides AI-powered software development capabilities. It integrates the Claude Agent SDK to enable programmatic access to Claude's agentic capabilities with a robust framework for session management, cost tracking, and structured logging.

## Architecture

Built on a **capability-based architecture** where each capability is a self-contained module with its own schemas, types, prompts, and tests. The framework provides dependency injection for core services (session management, cost tracking, logging) and enforces security constraints (budgets, timeouts, input validation).

### Core Components

- **CapabilityRegistry**: Manages capability registration and MCP binding
- **SessionManager**: Tracks agent invocations and lifecycle
- **CostTracker**: Aggregates costs with budget enforcement
- **Logger**: Structured logging with disk persistence and redaction
- **AIProvider**: Abstraction layer for AI service integration
- **PromptLoader**: Versioned prompt management

## Features

### Echo Agent Capability

A proof-of-concept capability demonstrating Claude Agent SDK integration.

**Purpose**: Accept a text prompt, process it through Claude, and return the response with cost and turn metrics.

**Input**:
- `prompt` (string, required): The text prompt to send to Claude (max 10,000 characters)
- `model` ("haiku" | "sonnet", optional): Model to use (default: "haiku")

**Output**:
- `response` (string): Claude's text response
- `cost_usd` (number): Total cost in USD
- `turns` (number): Number of conversation turns

**Security Constraints**:
- No tool access (pure text responses)
- Single turn only
- Budget limits: $0.01 for haiku, $0.10 for sonnet

## Setup

### Prerequisites

- Node.js 20+
- npm or pnpm
- Claude Code CLI (for authentication)

### Installation

```bash
# Install dependencies
npm install

# Build the project
npm run build
```

### Authentication

This server uses **Claude Code CLI subscription authentication**. No API key required.

**Steps**:
1. Install Claude Code CLI: `curl -fsSL https://claude.ai/install.sh | bash`
2. Authenticate with your subscription: `claude login`
3. Choose "Log in with subscription account" when prompted

The SDK automatically uses your authenticated CLI session.

## Usage

### Development Mode

```bash
npm run dev
```

### Production Mode

```bash
npm run build
npm start
```

### Running Tests

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage
```

## Development

### Project Structure

```
src/
├── capabilities/           # Capability implementations
│   ├── echo-agent/        # Echo agent capability
│   │   ├── echo-agent.capability.ts
│   │   ├── echo-agent.schema.ts
│   │   ├── echo-agent.types.ts
│   │   ├── prompts/       # Versioned prompts
│   │   └── __tests__/     # Capability tests
│   └── index.ts           # Capability registration hub
├── core/                  # Core framework
│   ├── logger/            # Structured logging
│   ├── ai-provider/       # AI provider abstraction
│   ├── session/           # Session management
│   ├── cost/              # Cost tracking and reporting
│   ├── prompt/            # Prompt loading
│   ├── capability-registry/ # Capability registration
│   └── index.ts           # Core exports
├── providers/             # AI provider implementations
│   └── claude/            # Claude Agent SDK provider
├── config/                # Configuration constants
├── server.ts              # MCP server factory
└── index.ts               # Entry point
```

### Adding New Capabilities

1. **Create capability directory**:
```bash
mkdir -p src/capabilities/my-capability/{prompts,__tests__}
```

2. **Define schemas** in `src/capabilities/my-capability/my-capability.schema.ts`:
```typescript
import { z } from "zod";

export const MyCapabilityInputSchema = z.object({
  input: z.string().min(1).max(10000),
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

3. **Create prompts** in `src/capabilities/my-capability/prompts/v1.ts`:
```typescript
export const PROMPT_V1 = `
You are a specialized assistant.
Task: {task}
`.trim();
```

4. **Implement capability** in `src/capabilities/my-capability/my-capability.capability.ts`:
```typescript
import type { CapabilityDefinition } from "../../core/capability-registry/index.js";
import type { CapabilityRegistryContext } from "../../core/framework.types.js";
import { MyCapabilityInputSchema, MyCapabilityOutputSchema } from "./my-capability.schema.js";
import { PROMPT_V1 } from "./prompts/v1.js";

export const myCapabilityDefinition: CapabilityDefinition = {
  name: "my_capability",
  title: "My Capability",
  description: "Description of what this capability does",
  inputSchema: MyCapabilityInputSchema,
  handler: async (input, context) => {
    const { sessionManager, aiProvider, costTracker } = context;

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

5. **Add tests** in `src/capabilities/my-capability/__tests__/`

6. **Register capability** in `src/capabilities/index.ts`:
```typescript
import { myCapabilityDefinition } from "./my-capability/my-capability.capability.js";

export function registerAllCapabilities(registry: CapabilityRegistry): void {
  registry.registerCapability(echoAgentDefinition);
  registry.registerCapability(myCapabilityDefinition);
}
```

### Testing Guidelines

- Write tests before implementation (TDD)
- Unit tests for schemas, handlers, and core logic
- Integration tests for end-to-end capability flows
- Aim for 80%+ coverage

## Framework Features

### Session Management
- Automatic session lifecycle tracking
- Nesting depth limits (max 5 levels)
- Per-session budget enforcement
- Session metadata and timestamps

### Cost Tracking
- Real-time cost aggregation
- Budget limits (per query, per session, per day)
- Automatic cost report generation on session close
- JSON cost reports with breakdown by model/capability

### Structured Logging
- Dual-write: stderr (MCP protocol) + disk (NDJSON files)
- Automatic sensitive data redaction
- Context binding for hierarchical logs
- Session-specific log files with rotation

### Security
- Input validation using Zod schemas
- Prompt length limits
- Cost budgets per query/session/day
- Timeout enforcement
- No tool access for text-only queries
- API key and token redaction in logs

## Configuration

### Log Directory

Logs are persisted to a user-scoped directory to ensure logs remain accessible across git worktrees and project clones.

**Default Location**: `~/.claude/bastion-mcp-software-house/logs/`

**Environment Variable Override**: Set `LOG_DIR` to customize the log directory:
```bash
export LOG_DIR=/custom/path/to/logs
# or
export LOG_DIR=~/my-logs  # Tilde expansion supported
```

**Log File Structure**:
- `YYYY-MM-DD-combined.ndjson` - Daily combined logs (all sessions)
- `sessions/YYYY-MM-DD-{sessionId}.ndjson` - Per-session logs
- `reports/` - Cost and performance reports

**Tilde Expansion**: The `~` character is expanded to your home directory. Supports both Unix (`/home/user`) and Windows (`C:\Users\user`) paths.

**Migration Note**: Logs from the package-relative `logs/` directory are not automatically migrated. To preserve old logs, manually copy `apps/bastion-mcp-software-house/logs/` contents to the new persistent directory.

**Cleanup Note**: Logs accumulate indefinitely. Manually delete old logs when disk space is a concern.

### General Configuration

All configuration constants are in `src/config/constants.ts`:

| Category | Examples |
|----------|----------|
| Budgets | `MAX_SESSION_BUDGET_USD`, `MAX_DAILY_BUDGET_USD`, `MAX_QUERY_BUDGET_USD` |
| Sessions | `SESSION_MAX_DEPTH`, `MAX_INVOCATIONS_PER_SESSION`, `MAX_SESSION_DURATION_MS` |
| Security | `MAX_TURNS`, `MAX_PROMPT_LENGTH`, `MAX_TIMEOUT_MS` |
| Logging | `DEFAULT_LOG_DIR` |
| Providers | `PROVIDER_CONFIG` (defaultProvider, availableProviders) |

## License

Private - Part of bastion-mono monorepo
