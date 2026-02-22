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
| `mcpServerStatus()` | Get MCP server status |
| `reconnectMcpServer(name)` | Reconnect a disconnected MCP server |
| `toggleMcpServer(name, enabled)` | Enable/disable an MCP server |
| `accountInfo()` | Get account information |

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
  sandbox?: SandboxConfig;

  // Plugins
  plugins?: PluginConfig[];

  // Session
  sessionId?: string;
  resumeSession?: string;
  forkSession?: string;       // v0.2: Fork from existing session

  // File Checkpointing
  enableFileCheckpointing?: boolean;  // v0.2: Enable rewindFiles(uuid)

  // Structured Output
  outputSchema?: JSONSchema;
  outputFormat?: "json" | "text";     // v0.2: Control output format

  // Debugging
  debug?: boolean;             // v0.2: Enable debug logging
  debugFile?: string;          // v0.2: Write debug logs to file

  // Beta Features
  betas?: string[];            // v0.2: Opt into beta features
}
```

> **v0.2 Migration Notes:**
> - `systemPrompt` preset syntax changed: use `{ type: "preset", preset: "claude_code" }` instead of `{ preset: "claude_code" }` (old form still works but is deprecated)
> - Settings are **not auto-loaded** from disk. Pass `settingSources: ["user", "project", "local"]` to load `.claude/settings.json` files
> - `subagents` renamed to `agents`
> - `tools` accepts an empty array `[]` to disable all custom tools, or `"preset"` for built-in tool set

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
const outputSchema = {
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
};

for await (const message of query({
  prompt: "Review the code",
  options: { outputSchema }
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

**Version:** ^0.2.45 | **Source:** https://github.com/anthropics/claude-agent-sdk-typescript
