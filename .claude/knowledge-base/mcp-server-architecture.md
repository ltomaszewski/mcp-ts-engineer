# MCP Server Architecture Guide — Capability-Based Framework

> **Architecture Evolution Note**: This guide describes the **capability-based framework architecture** recommended for all MCP servers. The previous layered architecture (`tools/`, `schemas/`, `types/`, `utils/` as flat folders) is an older pattern. For new projects, this capability-based guide takes precedence.

**References:**
- [MCP Best Practices Guide](https://modelcontextprotocol.info/docs/best-practices/)
- [Official TypeScript SDK](https://github.com/modelcontextprotocol/typescript-sdk)
- [Claude Agent SDK](https://github.com/anthropics/claude-sdk-typescript)

---

## Table of Contents

1. [Architecture Overview](#architecture-overview)
2. [Directory Structure](#directory-structure)
3. [Capability Module Pattern](#capability-module-pattern)
4. [AI Provider Abstraction](#ai-provider-abstraction)
5. [Session Model](#session-model)
6. [Cost Tracking](#cost-tracking)
7. [Prompt Versioning](#prompt-versioning)
8. [Structured Logging](#structured-logging)
9. [Capability Registry](#capability-registry)
10. [Adding a New Capability](#adding-a-new-capability)
11. [Adding a New AI Provider](#adding-a-new-ai-provider)
12. [Anti-Patterns](#anti-patterns)

---

## Architecture Overview

The capability-based framework follows a **feature-module architecture** where each capability is a self-contained module:

```
┌─────────────────────────────────────────┐
│         MCP Server (Index)              │
│  - Process management                   │
│  - Signal handling                      │
│  - Graceful shutdown                    │
└──────────────┬──────────────────────────┘
               │
               ▼
┌─────────────────────────────────────────┐
│      Capability Registry (Core)         │
│  - Capability registration              │
│  - MCP server binding                   │
│  - Lifecycle orchestration              │
│  - Context injection                    │
│  - Security validation                  │
└──────────────┬──────────────────────────┘
               │
               ├──────────────────┬────────────────┬────────────────┐
               ▼                  ▼                ▼                ▼
      ┌────────────────┐ ┌────────────────┐ ┌────────────────┐ ┌────────────────┐
      │ Capability 1   │ │ Capability 2   │ │ Capability 3   │ │ Capability N   │
      │ (echo-agent)   │ │ (analyzer)     │ │ (custom)       │ │ (...)          │
      └────────────────┘ └────────────────┘ └────────────────┘ └────────────────┘

Core Framework:
┌─────────────┬──────────────┬───────────────┬──────────────┬─────────────┐
│ AI Provider │ Session Mgr  │ Cost Tracker  │ Prompt Load  │ Logger      │
└─────────────┴──────────────┴───────────────┴──────────────┴─────────────┘
```

### Key Principles

1. **Capabilities are self-contained** - Each capability is a complete feature module
2. **Framework handles orchestration** - Registry coordinates lifecycle, sessions, costs
3. **AI provider abstraction** - Capabilities never import SDK directly
4. **Prompts are versioned** - All prompts have versions, sunset dates, traceability
5. **Sessions track invocations** - Every capability invocation creates/reuses sessions
6. **Costs are tracked** - Token usage and costs are recorded per invocation

---

## Directory Structure

```
apps/mcp-server/
├── src/
│   ├── index.ts                          # Entry point (30-50 lines)
│   │
│   ├── core/                             # Framework internals
│   │   ├── ai-provider/                  # AI provider abstraction
│   │   │   ├── ai-provider.types.ts      # AIProvider interface, AIQueryRequest/Result
│   │   │   ├── claude-provider.ts        # Claude Agent SDK implementation
│   │   │   ├── provider-factory.ts       # Factory for creating providers
│   │   │   └── index.ts                  # Barrel export
│   │   │
│   │   ├── session/                      # Session management
│   │   │   ├── session.types.ts          # Session, Invocation types
│   │   │   ├── session.manager.ts        # SessionManager (create, track, close)
│   │   │   └── index.ts
│   │   │
│   │   ├── cost/                         # Cost tracking
│   │   │   ├── cost.types.ts             # CostEntry, CostSummary types
│   │   │   ├── cost.tracker.ts           # CostTracker (record, summarize)
│   │   │   ├── cost-report.writer.ts     # CostReportWriter (daily reports)
│   │   │   └── index.ts
│   │   │
│   │   ├── prompt/                       # Prompt versioning
│   │   │   ├── prompt.types.ts           # PromptVersion, PromptRegistry types
│   │   │   ├── prompt.loader.ts          # PromptLoader (register, load)
│   │   │   └── index.ts
│   │   │
│   │   ├── logger/                       # Structured logging
│   │   │   ├── logger.types.ts           # LogEntry, LogLevel types
│   │   │   ├── logger.ts                 # Logger (NDJSON + stderr)
│   │   │   ├── disk-writer.ts            # DiskWriter (dual-write: combined + session)
│   │   │   └── index.ts
│   │   │
│   │   ├── capability-registry/          # Capability registry (orchestrator)
│   │   │   ├── capability-registry.types.ts  # CapabilityDefinition, CapabilityContext
│   │   │   ├── capability-registry.ts        # CapabilityRegistry
│   │   │   └── index.ts
│   │   │
│   │   ├── errors.ts                     # Framework error classes
│   │   └── index.ts                      # Core barrel export
│   │
│   ├── providers/                        # AI provider implementations
│   │   ├── claude/                       # Claude provider
│   │   │   ├── claude.provider.ts        # ClaudeProvider (AIProvider impl)
│   │   │   ├── claude.config.ts          # Claude-specific config
│   │   │   └── index.ts
│   │   └── index.ts
│   │
│   ├── capabilities/                     # Self-contained capability modules
│   │   ├── echo-agent/                   # Example capability
│   │   │   ├── echo-agent.capability.ts  # CapabilityDefinition
│   │   │   ├── echo-agent.schema.ts      # Zod input/output schemas
│   │   │   ├── echo-agent.types.ts       # Type definitions
│   │   │   ├── prompts/                  # Versioned prompts
│   │   │   │   ├── v1.ts                 # Version 1 prompt
│   │   │   │   └── index.ts              # PROMPT_VERSIONS map + CURRENT_VERSION
│   │   │   ├── __tests__/                # Co-located tests
│   │   │   │   ├── echo-agent.capability.test.ts
│   │   │   │   └── echo-agent.integration.test.ts
│   │   │   └── index.ts                  # Barrel export
│   │   └── index.ts                      # All capabilities barrel
│   │
│   ├── config/                           # Configuration constants
│   │   ├── constants.ts                  # MAX_TURNS, MAX_BUDGET, etc.
│   │   └── index.ts
│   │
│   └── index.ts                          # Main entry (registers capabilities, starts server)
│
├── tests/                                # Root-level integration tests
│   └── framework/                        # Framework integration tests
│
├── logs/                                 # Log files (gitignored)
│   ├── sessions/                         # Per-session log files
│   ├── reports/                          # Daily cost reports
│   └── YYYY-MM-DD-combined.ndjson        # Combined daily log
│
├── build/                                # Compiled output (gitignored)
├── package.json
├── tsconfig.json
├── jest.config.js
└── README.md
```

---

## Capability Module Pattern

Each capability is a **self-contained folder** with everything it needs:

### File Structure

```
src/capabilities/echo-agent/
├── echo-agent.capability.ts    # CapabilityDefinition (main)
├── echo-agent.schema.ts        # Zod input/output schemas
├── echo-agent.types.ts         # Type definitions
├── prompts/
│   ├── v1.ts                   # Versioned prompt implementation
│   ├── v2.ts                   # (optional) Next version
│   └── index.ts                # PROMPT_VERSIONS map + CURRENT_VERSION
├── __tests__/
│   ├── echo-agent.capability.test.ts      # Unit tests
│   └── echo-agent.integration.test.ts     # Integration tests
└── index.ts                    # Barrel export (export { echoAgentCapability })
```

### Example: echo-agent.capability.ts

```typescript
import { z } from 'zod';
import type { CapabilityDefinition } from '@/core/capability-registry';
import { EchoAgentInputSchema, EchoAgentOutputSchema } from './echo-agent.schema.js';
import { PROMPT_VERSIONS, CURRENT_VERSION } from './prompts/index.js';
import type { EchoAgentInput, EchoAgentOutput } from './echo-agent.types.js';

export const echoAgentCapability: CapabilityDefinition<
  EchoAgentInput,
  EchoAgentOutput
> = {
  id: 'echo_agent',
  type: 'tool',
  name: 'Echo Agent',
  description: 'Simple proof-of-concept agent that echoes prompts via Claude Agent SDK',

  // Input validation (Zod schema)
  inputSchema: EchoAgentInputSchema,

  // Prompt versions registry
  promptRegistry: PROMPT_VERSIONS,
  currentPromptVersion: CURRENT_VERSION,

  // Default AI query options
  defaultRequestOptions: {
    model: 'haiku',
    maxTurns: 1,
    maxBudgetUsd: 0.10,
  },

  // Prepare prompt input from validated input and context
  preparePromptInput: (input, context) => {
    return {
      userPrompt: input.prompt,
      model: input.model || 'haiku',
    };
  },

  // Process AI result into output format
  processResult: async (input, aiResult, context) => {
    const output: EchoAgentOutput = {
      response: aiResult.content,
      cost_usd: aiResult.costUsd,
      turns: aiResult.turns,
    };

    return EchoAgentOutputSchema.parse(output);
  },
};
```

### Example: echo-agent.schema.ts

```typescript
import { z } from 'zod';

export const EchoAgentInputSchema = z.object({
  prompt: z.string().min(1, 'Prompt is required').max(10000, 'Prompt too long'),
  model: z.enum(['haiku', 'sonnet', 'opus']).optional().default('haiku'),
});

export const EchoAgentOutputSchema = z.object({
  response: z.string(),
  cost_usd: z.number(),
  turns: z.number(),
});
```

### Example: prompts/v1.ts

```typescript
import type { PromptVersion } from '@/core/prompt';

export const v1: PromptVersion<{ userPrompt: string; model: string }> = {
  version: 'v1',
  createdAt: '2025-01-20',
  description: 'Initial echo agent prompt',
  deprecated: false,

  build: (input) => ({
    systemPrompt: 'You are a helpful assistant that echoes user messages.',
    userPrompt: input.userPrompt,
  }),
};
```

### Example: prompts/index.ts

```typescript
import { v1 } from './v1.js';
import type { PromptRegistry } from '@/core/prompt';

export const PROMPT_VERSIONS: PromptRegistry<{
  userPrompt: string;
  model: string;
}> = {
  v1,
};

export const CURRENT_VERSION = 'v1';
```

---

## AI Provider Abstraction

Capabilities **never import AI SDKs directly**. They use the `AIProvider` interface.

### AIProvider Interface

```typescript
// src/core/ai-provider/ai-provider.types.ts

export interface AIQueryRequest {
  prompt: string;
  systemPrompt?: string;
  model?: AIModel;
  maxTurns?: number;
  maxBudgetUsd?: number;
  timeout?: number;
  permissionMode?: 'allow_all' | 'deny_all';
  mcpServers?: Array<{ name: string; url: string }>;
}

export interface AIQueryResult {
  content: string;
  usage: {
    inputTokens: number;
    outputTokens: number;
    totalTokens: number;
  };
  costUsd: number;
  turns: number;
  terminationReason: 'success' | 'budget_exceeded' | 'timeout' | 'error';
  trace: AIExecutionTrace;
  model?: string;
}

export interface AIProvider {
  query(request: AIQueryRequest): Promise<AIQueryResult>;
}
```

### ClaudeProvider Implementation

```typescript
// src/providers/claude/claude.provider.ts

import Anthropic from '@anthropic-ai/claude-agent-sdk';
import type { AIProvider, AIQueryRequest, AIQueryResult } from '@/core/ai-provider';

export class ClaudeProvider implements AIProvider {
  private client: Anthropic;

  constructor(apiKey?: string) {
    this.client = new Anthropic({ apiKey: apiKey || process.env.ANTHROPIC_API_KEY });
  }

  async query(request: AIQueryRequest): Promise<AIQueryResult> {
    const response = await this.client.messages.create({
      model: this.mapModel(request.model),
      max_tokens: 4096,
      messages: [
        {
          role: 'user',
          content: request.prompt,
        },
      ],
      system: request.systemPrompt,
    });

    return {
      content: this.extractContent(response),
      usage: {
        inputTokens: response.usage.input_tokens,
        outputTokens: response.usage.output_tokens,
        totalTokens: response.usage.input_tokens + response.usage.output_tokens,
      },
      costUsd: this.calculateCost(response),
      turns: 1,
      terminationReason: 'success',
      trace: this.captureTrace(request, response),
      model: request.model,
    };
  }

  // ... helper methods
}
```

### Benefits

- **Testability**: Mock `AIProvider` in tests, not SDK internals
- **Flexibility**: Swap providers (Claude → OpenAI → Local) without changing capabilities
- **Consistency**: Unified response format across all providers
- **Traceability**: All requests captured in `AIExecutionTrace`

---

## Session Model

Sessions track invocations and costs. Each MCP tool call creates/reuses a session.

### Session Types

```typescript
// src/core/session/session.types.ts

export interface Session {
  id: string;
  capability: string;
  startedAt: string;
  completedAt?: string;
  state: 'active' | 'completed' | 'error';
  invocations: Invocation[];
  totalCost: number;
}

export interface Invocation {
  id: string;
  capability: string;
  input: unknown;
  output?: unknown;
  cost?: CostEntry;
  timestamp: string;
  error?: string;
}
```

### SessionManager

```typescript
// src/core/session/session.manager.ts

export class SessionManager {
  createSession(capability: string): Session;
  getSession(sessionId: string): Session | undefined;
  startInvocation(sessionId: string, capability: string): string; // Returns invocationId
  completeInvocation(sessionId: string, invocationId: string, output: unknown, cost: CostEntry): void;
  closeSession(sessionId: string): void;
  closeAll(): Session[]; // Returns closed sessions
}
```

### Recursion Guard

Sessions prevent capabilities from calling themselves:

```typescript
// In CapabilityContext
invokeCapability: async (childCapabilityName, input) => {
  if (childCapabilityName === capability.id) {
    throw new RecursionError('Capability cannot call itself');
  }
  // ... delegate to registry
};
```

---

## Cost Tracking

### CostTracker

```typescript
// src/core/cost/cost.tracker.ts

export class CostTracker {
  recordCost(sessionId: string, invocationId: string, capability: string, entry: CostEntry): void;
  getSessionSummary(sessionId: string): CostSummary;
  getDailySummary(): CostSummary;
}

export interface CostEntry {
  id: string;
  sessionId: string;
  model: AIModel;
  inputTokens: number;
  outputTokens: number;
  costUsd: number;
  timestamp: string;
}

export interface CostSummary {
  totalCostUsd: number;
  totalInputTokens: number;
  totalOutputTokens: number;
  breakdown: Array<{ capability: string; costUsd: number }>;
}
```

### CostReportWriter

Writes daily cost reports to `logs/reports/YYYY-MM-DD-cost-report.json`:

```typescript
// src/core/cost/cost-report.writer.ts

export class CostReportWriter {
  async writeSessionToReport(session: Session, summary: CostSummary): Promise<void>;
  async getDailyTotalCost(): Promise<number>;
}
```

### Budget Enforcement

```typescript
// In CapabilityRegistry.handleCapabilityInvocation()

const dailyTotal = await this.deps.costReportWriter.getDailyTotalCost();
if (dailyTotal >= MAX_DAILY_BUDGET_USD) {
  throw new CapabilityError(`Daily budget limit exceeded: ${dailyTotal}`);
}
```

---

## Prompt Versioning

All prompts are versioned with metadata and sunset dates.

### PromptVersion

```typescript
// src/core/prompt/prompt.types.ts

export interface PromptVersion<TInput = any> {
  version: string;
  createdAt: string;
  description: string;
  deprecated: boolean;
  sunsetDate?: string; // ISO date when this version will be removed
  build: (input: TInput) => { systemPrompt?: string; userPrompt: string };
}

export type PromptRegistry<TInput = any> = Record<string, PromptVersion<TInput>>;
```

### PromptLoader

```typescript
// src/core/prompt/prompt.loader.ts

export class PromptLoader {
  registerCapabilityPrompts<TInput>(
    capabilityId: string,
    registry: PromptRegistry<TInput>,
    currentVersion: string
  ): void;

  getPrompt<TInput>(capabilityId: string, version: string): PromptVersion<TInput>;
}
```

### Prompt Evolution Example

```typescript
// prompts/v1.ts
export const v1: PromptVersion<Input> = {
  version: 'v1',
  createdAt: '2025-01-20',
  description: 'Initial version',
  deprecated: true,
  sunsetDate: '2025-03-01',
  build: (input) => ({ userPrompt: `Echo: ${input.prompt}` }),
};

// prompts/v2.ts
export const v2: PromptVersion<Input> = {
  version: 'v2',
  createdAt: '2025-02-01',
  description: 'Improved with system prompt',
  deprecated: false,
  build: (input) => ({
    systemPrompt: 'You are a helpful assistant.',
    userPrompt: input.prompt,
  }),
};

// prompts/index.ts
export const PROMPT_VERSIONS = { v1, v2 };
export const CURRENT_VERSION = 'v2';
```

---

## Structured Logging

### Logger

NDJSON dual-write: stderr (for Claude Code) + disk files.

```typescript
// src/core/logger/logger.ts

export class Logger {
  info(message: string, context?: LogContext): void;
  debug(message: string, context?: LogContext): void;
  error(message: string, context?: LogContext): void;
  warn(message: string, context?: LogContext): void;

  withContext(context: LogContext): Logger; // Returns new logger with bound context
}
```

### DiskWriter

Dual-write strategy: **combined daily log** + **per-session log files**.

```typescript
// src/core/logger/disk-writer.ts

export class DiskWriter {
  async initialize(): Promise<void>; // Creates logs/, logs/sessions/, logs/reports/

  async openSession(sessionId: string): Promise<void>; // Opens logs/sessions/YYYY-MM-DD-session-{id}.ndjson
  async closeSession(sessionId: string): Promise<void>;

  async write(entry: LogEntry, sessionId?: string): Promise<void>;
  // Writes to:
  // 1. logs/YYYY-MM-DD-combined.ndjson (always)
  // 2. logs/sessions/YYYY-MM-DD-session-{id}.ndjson (if sessionId provided OR entry.context.sessionId exists)

  async closeAll(): Promise<void>; // Flush and close all sessions
}
```

### Session Log Lifecycle

```typescript
// In CapabilityRegistry.handleCapabilityInvocation()

const session = this.deps.sessionManager.createSession(capabilityName);
await this.deps.diskWriter.openSession(session.id); // Open per-session log file

try {
  // ... capability invocation
  await this.deps.diskWriter.closeSession(session.id); // Close session log
} catch (error) {
  await this.deps.diskWriter.closeSession(session.id); // Close on error too
  throw error;
}
```

### Context-Based Session Resolution

The `write()` method resolves sessionId from either:
1. Explicit parameter: `write(entry, sessionId)`
2. Entry context: `write({ ...entry, context: { sessionId: 'ses_123' } })`

This allows loggers created with `withContext({ sessionId })` to automatically write to the correct session file.

---

## Capability Registry

The **orchestrator** that coordinates all framework components.

### CapabilityRegistry

```typescript
// src/core/capability-registry/capability-registry.ts

export class CapabilityRegistry {
  registerCapability(definition: CapabilityDefinition): void;
  getCapability(id: string): CapabilityDefinition | undefined;
  listCapabilities(type?: CapabilityType): CapabilityDefinition[];

  bindToMcpServer(server: McpServer): void; // Registers tools with MCP server

  async handleCapabilityInvocation(capabilityName: string, rawInput: unknown): Promise<McpResponse>;

  async gracefulShutdown(): Promise<void>; // Closes sessions, writes reports, closes disk writer
}
```

### Lifecycle Orchestration

The `handleCapabilityInvocation()` method orchestrates the full lifecycle:

1. **Validation**: Validate input with Zod schema
2. **Budget check**: Ensure daily budget not exceeded
3. **Session creation**: Create session via SessionManager
4. **Open session log**: Call `diskWriter.openSession(session.id)`
5. **Start invocation**: Record invocation start
6. **Context creation**: Build `CapabilityContext` with logger, cost tracker, etc.
7. **Prompt preparation**: Call `preparePromptInput()`
8. **Prompt loading**: Load versioned prompt via PromptLoader
9. **AI query**: Call AI provider with request
10. **Cost recording**: Record tokens and cost
11. **Result processing**: Call `processResult()`
12. **Invocation completion**: Update session with output and cost
13. **Session close**: Close session in SessionManager
14. **Close session log**: Call `diskWriter.closeSession(session.id)`
15. **Cost report**: Write to daily cost report (non-fatal error boundary)
16. **Return response**: Format as MCP response

**Error path**: If any step fails, session and session log are closed before rethrowing.

### CapabilityContext

The context injected into `preparePromptInput` and `processResult`:

```typescript
export interface CapabilityContext {
  session: Session;
  invocation: Invocation;
  logger: {
    info(msg: string, ctx?: LogContext): void;
    debug(msg: string, ctx?: LogContext): void;
    error(msg: string, ctx?: LogContext): void;
    warn(msg: string, ctx?: LogContext): void;
  };
  getSessionCost(): { totalCostUsd: number; totalInputTokens: number; totalOutputTokens: number };
  promptVersion: string;
  providerName: string;
  invokeCapability<TInput, TOutput>(capabilityName: string, input: TInput): Promise<TOutput>;
}
```

---

## Adding a New Capability

**Step-by-step guide:**

### 1. Create capability folder

```bash
mkdir -p src/capabilities/my-capability/{prompts,__tests__}
touch src/capabilities/my-capability/{my-capability.capability.ts,my-capability.schema.ts,my-capability.types.ts,index.ts}
touch src/capabilities/my-capability/prompts/{v1.ts,index.ts}
```

### 2. Define input/output schemas

```typescript
// my-capability.schema.ts
import { z } from 'zod';

export const MyCapabilityInputSchema = z.object({
  task: z.string().min(1).max(1000),
  options: z.object({
    verbose: z.boolean().optional(),
  }).optional(),
});

export const MyCapabilityOutputSchema = z.object({
  result: z.string(),
  metadata: z.object({
    processedAt: z.string(),
    tokensUsed: z.number(),
  }),
});
```

### 3. Define types

```typescript
// my-capability.types.ts
import type { z } from 'zod';
import type { MyCapabilityInputSchema, MyCapabilityOutputSchema } from './my-capability.schema.js';

export type MyCapabilityInput = z.infer<typeof MyCapabilityInputSchema>;
export type MyCapabilityOutput = z.infer<typeof MyCapabilityOutputSchema>;
```

### 4. Create prompt version

```typescript
// prompts/v1.ts
import type { PromptVersion } from '@/core/prompt';

export const v1: PromptVersion<{ task: string; verbose?: boolean }> = {
  version: 'v1',
  createdAt: '2025-01-29',
  description: 'Initial prompt for my-capability',
  deprecated: false,

  build: (input) => ({
    systemPrompt: 'You are a specialized assistant for completing tasks.',
    userPrompt: `Task: ${input.task}${input.verbose ? '\n\nProvide detailed explanation.' : ''}`,
  }),
};

// prompts/index.ts
import { v1 } from './v1.js';
import type { PromptRegistry } from '@/core/prompt';

export const PROMPT_VERSIONS: PromptRegistry<{ task: string; verbose?: boolean }> = { v1 };
export const CURRENT_VERSION = 'v1';
```

### 5. Implement capability

```typescript
// my-capability.capability.ts
import type { CapabilityDefinition } from '@/core/capability-registry';
import { MyCapabilityInputSchema, MyCapabilityOutputSchema } from './my-capability.schema.js';
import { PROMPT_VERSIONS, CURRENT_VERSION } from './prompts/index.js';
import type { MyCapabilityInput, MyCapabilityOutput } from './my-capability.types.js';

export const myCapability: CapabilityDefinition<MyCapabilityInput, MyCapabilityOutput> = {
  id: 'my_capability',
  type: 'tool',
  name: 'My Capability',
  description: 'Does something useful',

  inputSchema: MyCapabilityInputSchema,
  promptRegistry: PROMPT_VERSIONS,
  currentPromptVersion: CURRENT_VERSION,

  defaultRequestOptions: {
    model: 'sonnet',
    maxTurns: 3,
    maxBudgetUsd: 0.50,
  },

  preparePromptInput: (input, context) => {
    context.logger.debug('Preparing prompt input', { task: input.task });
    return {
      task: input.task,
      verbose: input.options?.verbose,
    };
  },

  processResult: async (input, aiResult, context) => {
    const output: MyCapabilityOutput = {
      result: aiResult.content,
      metadata: {
        processedAt: new Date().toISOString(),
        tokensUsed: aiResult.usage.totalTokens,
      },
    };

    return MyCapabilityOutputSchema.parse(output);
  },
};
```

### 6. Export capability

```typescript
// index.ts
export { myCapability } from './my-capability.capability.js';
export * from './my-capability.types.js';
export * from './my-capability.schema.js';
```

### 7. Register in main index

```typescript
// src/capabilities/index.ts
export { echoAgentCapability } from './echo-agent/index.js';
export { myCapability } from './my-capability/index.js'; // Add this

// src/index.ts
import { echoAgentCapability, myCapability } from './capabilities/index.js';

// ...

registry.registerCapability(echoAgentCapability);
registry.registerCapability(myCapability); // Add this
```

### 8. Write tests

```typescript
// __tests__/my-capability.capability.test.ts
import { describe, it, expect } from '@jest/globals';
import { myCapability } from '../my-capability.capability.js';

describe('myCapability', () => {
  it('validates input schema', () => {
    const validInput = { task: 'Do something' };
    const result = myCapability.inputSchema.safeParse(validInput);
    expect(result.success).toBe(true);
  });

  it('rejects invalid input', () => {
    const invalidInput = { task: '' };
    const result = myCapability.inputSchema.safeParse(invalidInput);
    expect(result.success).toBe(false);
  });
});
```

---

## Adding a New AI Provider

**Step-by-step guide:**

### 1. Create provider folder

```bash
mkdir -p src/providers/openai
touch src/providers/openai/{openai.provider.ts,openai.config.ts,index.ts}
```

### 2. Implement AIProvider interface

```typescript
// openai.provider.ts
import OpenAI from 'openai';
import type { AIProvider, AIQueryRequest, AIQueryResult } from '@/core/ai-provider';

export class OpenAIProvider implements AIProvider {
  private client: OpenAI;

  constructor(apiKey?: string) {
    this.client = new OpenAI({ apiKey: apiKey || process.env.OPENAI_API_KEY });
  }

  async query(request: AIQueryRequest): Promise<AIQueryResult> {
    const response = await this.client.chat.completions.create({
      model: this.mapModel(request.model),
      messages: [
        ...(request.systemPrompt ? [{ role: 'system', content: request.systemPrompt }] : []),
        { role: 'user', content: request.prompt },
      ],
      max_tokens: 4096,
    });

    return {
      content: response.choices[0]?.message?.content || '',
      usage: {
        inputTokens: response.usage?.prompt_tokens || 0,
        outputTokens: response.usage?.completion_tokens || 0,
        totalTokens: response.usage?.total_tokens || 0,
      },
      costUsd: this.calculateCost(response),
      turns: 1,
      terminationReason: 'success',
      trace: this.captureTrace(request, response),
      model: request.model,
    };
  }

  private mapModel(model?: string): string {
    const modelMap = {
      haiku: 'gpt-3.5-turbo',
      sonnet: 'gpt-4',
      opus: 'gpt-4-turbo',
    };
    return modelMap[model as keyof typeof modelMap] || 'gpt-3.5-turbo';
  }

  private calculateCost(response: OpenAI.Chat.Completions.ChatCompletion): number {
    // OpenAI pricing logic
    return 0.001; // Placeholder
  }

  private captureTrace(request: AIQueryRequest, response: any): AIExecutionTrace {
    // Capture trace details
    return {
      traceId: crypto.randomUUID(),
      startedAt: new Date().toISOString(),
      request,
      turns: [],
    };
  }
}
```

### 3. Update provider factory

```typescript
// src/core/ai-provider/provider-factory.ts
import { ClaudeProvider } from '@/providers/claude';
import { OpenAIProvider } from '@/providers/openai';
import type { AIProvider } from './ai-provider.types.js';

export function createAIProvider(providerName: string = 'claude'): AIProvider {
  switch (providerName) {
    case 'claude':
      return new ClaudeProvider();
    case 'openai':
      return new OpenAIProvider();
    default:
      throw new Error(`Unknown AI provider: ${providerName}`);
  }
}
```

### 4. Use in index.ts

```typescript
// src/index.ts
const providerName = process.env.AI_PROVIDER || 'claude';
const aiProvider = createAIProvider(providerName);
```

---

## Anti-Patterns

### ❌ OLD: Layered Architecture

```
src/
├── tools/           # Flat folder of all tools
├── schemas/         # Flat folder of all schemas
├── types/           # Flat folder of all types
└── utils/           # Shared utilities
```

**Problems:**
- Tools can't be developed independently
- Shared types create coupling
- No clear ownership boundaries
- Hard to find related code

### ✅ NEW: Capability-Based Architecture

```
src/
├── core/            # Framework internals
├── capabilities/    # Self-contained modules
│   ├── echo-agent/  # Everything for echo-agent
│   └── analyzer/    # Everything for analyzer
└── providers/       # AI provider implementations
```

**Benefits:**
- Capabilities are independent modules
- Easy to add/remove capabilities
- Clear ownership boundaries
- Related code is co-located

---

### ❌ OLD: Direct SDK Imports

```typescript
// DON'T DO THIS
import Anthropic from '@anthropic-ai/claude-agent-sdk';

export const myTool = {
  async execute(input: MyInput) {
    const client = new Anthropic();
    const response = await client.messages.create({ ... });
    return response;
  }
};
```

**Problems:**
- Tightly coupled to SDK
- Hard to test (must mock SDK)
- Can't swap providers
- No unified tracing

### ✅ NEW: Provider Abstraction

```typescript
// DO THIS
import type { CapabilityDefinition } from '@/core/capability-registry';

export const myCapability: CapabilityDefinition = {
  // ... registry handles AI provider via injected dependency
};
```

**Benefits:**
- Loosely coupled
- Easy to test (mock `AIProvider`)
- Swap providers without changing capabilities
- Unified tracing via framework

---

### ❌ OLD: Inline Prompts

```typescript
// DON'T DO THIS
export const myTool = {
  async execute(input: MyInput) {
    const prompt = `Do this: ${input.task}`;
    // ... send prompt
  }
};
```

**Problems:**
- No versioning
- No traceability
- Can't A/B test prompts
- No sunset planning

### ✅ NEW: Versioned Prompts

```typescript
// DO THIS
export const v1: PromptVersion = {
  version: 'v1',
  createdAt: '2025-01-29',
  description: 'Initial version',
  deprecated: false,
  build: (input) => ({ userPrompt: `Do this: ${input.task}` }),
};
```

**Benefits:**
- Full versioning
- Traceability (logs include prompt version)
- Can A/B test versions
- Sunset old versions gracefully

---

### ❌ OLD: Manual Session Management

```typescript
// DON'T DO THIS
let currentSession: Session | null = null;

export const myTool = {
  async execute(input: MyInput) {
    currentSession = createSession();
    // ... do work
    closeSession(currentSession);
  }
};
```

**Problems:**
- Global mutable state
- Hard to test
- No recursion guard
- No cost tracking

### ✅ NEW: Framework-Managed Sessions

```typescript
// DO THIS
export const myCapability: CapabilityDefinition = {
  preparePromptInput: (input, context) => {
    // context.session is provided by framework
    // context.invokeCapability() handles nested calls
    return { ... };
  },
};
```

**Benefits:**
- No global state
- Easy to test (mock context)
- Recursion guard built-in
- Automatic cost tracking

---

## Summary

The capability-based framework provides:

✅ **Self-contained capabilities** - Each capability is a complete module
✅ **AI provider abstraction** - Swap providers without changing capabilities
✅ **Versioned prompts** - Full traceability and A/B testing
✅ **Session management** - Automatic tracking and recursion prevention
✅ **Cost tracking** - Token usage and budget enforcement
✅ **Structured logging** - NDJSON dual-write with per-session files
✅ **Framework orchestration** - Registry handles lifecycle automatically

**Next steps:**
1. Review existing capabilities in `src/capabilities/echo-agent/`
2. Follow the "Adding a New Capability" guide for new features
3. Write tests for all capabilities (unit + integration)
4. Monitor logs in `logs/` for debugging
5. Check cost reports in `logs/reports/` for budget tracking
