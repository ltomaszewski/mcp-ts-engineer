# Query API & Options

Complete reference for the `query()` function and configuration options.

---

## Function Signature

### TypeScript

```typescript
function query({
  prompt,
  options
}: {
  prompt: string | AsyncIterable<SDKUserMessage>;
  options?: Options;
}): Query
```

### Python

```python
def query(
    prompt: str | Iterable[Message],
    *,
    options: Options | None = None
) -> Iterator[Message]
```

---

## Return Type: Query

The `Query` object extends `AsyncGenerator<SDKMessage, void>` with additional methods:

| Method | Description |
|--------|-------------|
| `interrupt()` | Interrupt current operation |
| `rewindFiles(uuid)` | Rewind file changes to a checkpoint (requires `enableFileCheckpointing: true`) |
| `setPermissionMode(mode)` | Change permission mode |
| `setModel(model)` | Change model |
| `setMaxThinkingTokens(n)` | Set thinking token limit |
| `supportedCommands()` | Get supported commands |
| `supportedModels()` | Get available models |
| `supportedAgents()` | Get available subagent definitions (v0.2.75+) |
| `mcpServerStatus()` | Get MCP server status with `capabilities` field |
| `reconnectMcpServer(name)` | Reconnect a disconnected MCP server |
| `toggleMcpServer(name, enabled)` | Enable/disable an MCP server |
| `enableChannel(name)` | Enable an MCP server channel (v0.2.75+) |
| `accountInfo()` | Get account information |
| `getSettings()` | Get runtime-resolved settings including `applied` model and effort (v0.2.83+) |
| `reloadPlugins()` | Reload plugins and refresh commands/agents/MCP status (v0.2.86+) |

---

## Options Interface (Complete)

```typescript
interface Options {
  // Model Configuration
  model?: "sonnet" | "opus" | "haiku" | "inherit";
  fallbackModel?: string;
  maxThinkingTokens?: number;

  // Tool Configuration
  allowedTools?: string[];          // Allowlist of tool names
  disallowedTools?: string[];       // Blocklist of tool names
  tools?: Tool[] | "preset" | [];   // Custom tools, preset set, or empty array

  // Prompts
  systemPrompt?: string | { type: "preset"; preset: "claude_code" };
  appendSystemPrompt?: string;
  settingSources?: ("user" | "project" | "local")[];  // v0.2: Settings not auto-loaded

  // Execution Limits
  maxTurns?: number;
  maxBudgetUsd?: number;
  timeout?: number;

  // Permissions
  permissionMode?: PermissionMode;
  permissions?: PermissionConfig;

  // MCP Servers
  mcpServers?: Record<string, MCPServerConfig>;

  // Working Directory
  cwd?: string;

  // Hooks
  hooks?: HooksConfig;

  // Subagent / Agent Configuration
  agents?: Record<string, AgentDefinition>;  // v0.2: renamed from "subagents"

  // Sandbox
  sandbox?: SandboxSettings;

  // Plugins
  plugins?: SdkPluginConfig[];   // { type: "local", path: "./my-plugin" }

  // Session
  resume?: string;             // Session ID to resume
  resumeSessionAt?: string;    // Resume at specific message UUID
  forkSession?: boolean;       // Fork on resume instead of continuing
  continue?: boolean;          // Continue most recent conversation

  // File Checkpointing
  enableFileCheckpointing?: boolean;  // Enable rewindFiles(uuid)

  // Structured Output
  outputFormat?: { type: "json_schema"; schema: JSONSchema };

  // Permissions
  canUseTool?: CanUseTool;     // Custom permission callback
  allowDangerouslySkipPermissions?: boolean;  // Required for bypassPermissions

  // Beta Features
  betas?: SdkBeta[];           // e.g., ["context-1m-2025-08-07"]

  // Runtime
  executable?: "bun" | "deno" | "node";
  executableArgs?: string[];
  env?: Dict<string>;
  stderr?: (data: string) => void;
  includePartialMessages?: boolean;  // Include stream_event messages
  additionalDirectories?: string[];
}
```

> **v0.2 Migration Notes:**
> - `systemPrompt` preset syntax: `{ type: "preset", preset: "claude_code" }` with optional `append` field for extending
> - Settings are **not auto-loaded**. Pass `settingSources: ["user", "project", "local"]` to load `.claude/settings.json`. Must include `"project"` to load CLAUDE.md files
> - `subagents` renamed to `agents` with new `AgentDefinition` type (requires `description` + `prompt`)
> - `tools` accepts string array or `{ type: "preset", preset: "claude_code" }`
> - `outputSchema`/`outputFormat` replaced by `outputFormat: { type: "json_schema", schema }` for structured outputs
> - `resumeSession` replaced by `resume` (session ID) + optional `forkSession: boolean`
> - `permissionMode: "bypassPermissions"` now requires `allowDangerouslySkipPermissions: true`
> - `includePartialMessages: true` yields `type: "stream_event"` instead of `type: "partial"`

---

## Model Selection

| Model | Best For | Cost |
|-------|----------|------|
| `haiku` | Fast, simple tasks | Lowest |
| `sonnet` | General development (default) | Medium |
| `opus` | Complex reasoning, architecture | Highest |
| `inherit` | Inherit from parent (subagents) | - |

```typescript
// Use haiku for quick lookups
query({ prompt: "List files", options: { model: "haiku" } })

// Use opus for complex analysis
query({ prompt: "Analyze architecture", options: { model: "opus" } })
```

---

## System Prompt Configuration

### Minimal (Default)

```typescript
// SDK uses minimal system prompt by default (NOT the full Claude Code prompt)
// v0.2: System prompt is NOT loaded by default — you must explicitly set it
query({ prompt: "Hello" })
```

### Full Claude Code Prompt

```typescript
// Include full Claude Code capabilities — must be explicitly set in v0.2
query({
  prompt: "Refactor this module",
  options: {
    systemPrompt: { type: "preset", preset: "claude_code" }
  }
})
```

### Custom System Prompt

```typescript
// Your own system prompt
query({
  prompt: "...",
  options: {
    systemPrompt: "You are a code review expert. Be concise and direct."
  }
})
```

### Append to Default

```typescript
// Add to preset prompt without replacing
query({
  prompt: "...",
  options: {
    systemPrompt: { type: "preset", preset: "claude_code" },
    appendSystemPrompt: "Always explain your reasoning step by step."
  }
})
```

---

## Tool Configuration

### Allow Specific Tools

```typescript
query({
  prompt: "Read the config file",
  options: {
    allowedTools: ["Read", "Glob"]
  }
})
```

### Block Specific Tools

```typescript
query({
  prompt: "Analyze the codebase",
  options: {
    disallowedTools: ["Bash", "Write", "Edit"]
  }
})
```

### MCP Tool Patterns

```typescript
// Allow all tools from an MCP server
allowedTools: ["mcp__filesystem__*"]

// Allow specific MCP tool
allowedTools: ["mcp__database__query"]

// Block MCP tools
disallowedTools: ["mcp__dangerous__*"]
```

---

## Execution Limits

### Max Turns

```typescript
// Limit conversation turns
query({
  prompt: "Implement feature X",
  options: {
    maxTurns: 50  // Stop after 50 turns
  }
})
```

### Budget Limit

```typescript
// Limit cost
query({
  prompt: "Large refactoring task",
  options: {
    maxBudgetUsd: 5.00  // Stop if cost exceeds $5
  }
})
```

### Timeout

```typescript
// Limit execution time
query({
  prompt: "Quick task",
  options: {
    timeout: 60000  // 60 seconds
  }
})
```

---

## Permission Modes

### Default Mode

```typescript
// Prompts for approval on sensitive operations
query({
  prompt: "Edit files",
  options: { permissionMode: "default" }
})
```

### Accept Edits Mode

```typescript
// Auto-approve file edits (common for automation)
query({
  prompt: "Refactor module",
  options: { permissionMode: "acceptEdits" }
})
```

### Plan Mode

```typescript
// Planning only, no execution
query({
  prompt: "Plan the refactoring",
  options: { permissionMode: "plan" }
})
```

### Bypass Permissions (Dangerous)

```typescript
// Skip all permission checks - USE WITH CAUTION
query({
  prompt: "...",
  options: { permissionMode: "bypassPermissions" }
})
```

---

## Structured Output

```typescript
for await (const message of query({
  prompt: "Review the code",
  options: {
    outputFormat: {
      type: "json_schema",
      schema: {
        type: "object",
        properties: {
          summary: { type: "string" },
          issues: {
            type: "array",
            items: {
              type: "object",
              properties: {
                severity: { type: "string", enum: ["high", "medium", "low"] },
                message: { type: "string" },
                file: { type: "string" }
              }
            }
          }
        }
      }
    }
  }
})) {
  if (message.type === "result" && message.structured_output) {
    const review = message.structured_output as ReviewResult;
    console.log(review.summary);
  }
}
```

---

## Sandbox Configuration

```typescript
query({
  prompt: "Run tests",
  options: {
    sandbox: {
      type: "docker",          // v0.2: explicit sandbox type
      enabled: true,
      allowedPaths: ["/project/src", "/project/tests"],
      networkAccess: false
    }
  }
})
```

---

## File Checkpointing

Enable file checkpointing to rewind file changes to any point during execution.

```typescript
const q = query({
  prompt: "Refactor the codebase",
  options: {
    enableFileCheckpointing: true   // v0.2: required to use rewindFiles()
  }
});

for await (const message of q) {
  if (message.type === "assistant") {
    // Each assistant message has a uuid that can be used as checkpoint
    console.log("Checkpoint UUID:", message.uuid);
  }
}

// Rewind all file changes to a specific checkpoint
await q.rewindFiles("checkpoint-uuid-here");
```
```

---

## Session Management

### New Session

```typescript
// Each query creates a new session by default
const q = query({ prompt: "Start task" });
// Session ID available in result message
```

### Resume Session

```typescript
// Continue previous session
query({
  prompt: "Continue where we left off",
  options: {
    resumeSession: "session-id-from-previous"
  }
})
```

### Fork Session (v0.2)

```typescript
// Fork from an existing session (branch the conversation)
query({
  prompt: "Try an alternative approach",
  options: {
    forkSession: "session-id-to-fork-from"
  }
})
```

---

## Working Directory

```typescript
// Set working directory for file operations
query({
  prompt: "Read package.json",
  options: {
    cwd: "/path/to/project"
  }
})
```

---

## Python-Specific Options

```python
from claude_agent_sdk import query

for message in query(
    prompt="Hello",
    options={
        "model": "sonnet",
        "allowed_tools": ["Read", "Glob"],  # snake_case in Python
        "max_turns": 10,
        "max_budget_usd": 1.0,
        "system_prompt": {"type": "preset", "preset": "claude_code"},  # v0.2 syntax
        "setting_sources": ["user", "project", "local"],  # v0.2: must explicitly load
        "permission_mode": "acceptEdits",
        "cwd": "/path/to/project"
    }
):
    pass
```

---

## Session History: `getSessionMessages()` (v0.2.80+)

Read a session's conversation history from its transcript file.

```typescript
import { getSessionMessages } from "@anthropic-ai/claude-agent-sdk";

// Read all messages from a session
const messages = await getSessionMessages(sessionId);

// With pagination
const page = await getSessionMessages(sessionId, {
  limit: 50,
  offset: 0
});

for (const msg of page) {
  console.log(msg.type, msg);
}
```

**Note**: v0.2.81 fixed a bug where parallel tool results were dropped. Sessions with parallel tool calls now correctly return all `tool_use`/`tool_result` pairs.

---

## Strict Tool Configuration: `tools` Option (v0.2.65+)

The `tools` option provides a strict allowlist of built-in tools, distinct from `allowedTools`:

```typescript
// Strict allowlist: ONLY these built-in tools are available
query({
  prompt: "...",
  options: {
    tools: ["Bash", "Read", "Edit"],  // Only these 3 built-in tools
  }
})

// Disable all built-in tools (only custom/MCP tools available)
query({
  prompt: "...",
  options: {
    tools: [],  // No built-in tools
    mcpServers: { myServer: { command: "..." } }
  }
})

// All default tools
query({
  prompt: "...",
  options: {
    tools: { type: "preset", preset: "claude_code" }
  }
})

// Opt-in to AskUserQuestion (v0.2.62+)
query({
  prompt: "...",
  options: {
    tools: ["Bash", "Read", "Edit", "AskUserQuestion"]
  }
})
```

---

## Best Practices

1. **Always set `maxTurns`** for automated pipelines to prevent runaway costs
2. **Use `maxBudgetUsd`** for production deployments
3. **Prefer `allowedTools`** over `disallowedTools` for security (whitelist)
4. **Explicitly set `systemPrompt`** -- v0.2 does NOT load the Claude Code prompt by default. Use `systemPrompt: { type: "preset", preset: "claude_code" }` when you need full capabilities
5. **Pass `settingSources`** if you need settings from `.claude/settings.json` loaded (not auto-loaded in v0.2)
6. **Set `cwd`** explicitly rather than relying on process working directory
7. **Enable `enableFileCheckpointing`** when you need the ability to rewind file changes
8. **Use `debug: true` or `debugFile`** during development for detailed execution logs

---

**Version:** ~0.2.86 | **Source:** https://github.com/anthropics/claude-agent-sdk-typescript
