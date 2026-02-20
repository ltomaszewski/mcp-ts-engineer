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
| `rewindFiles()` | Rewind file changes |
| `setPermissionMode(mode)` | Change permission mode |
| `setModel(model)` | Change model |
| `setMaxThinkingTokens(n)` | Set thinking token limit |
| `supportedCommands()` | Get supported commands |
| `supportedModels()` | Get available models |
| `mcpServerStatus()` | Get MCP server status |
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
  allowedTools?: string[];
  disallowedTools?: string[];
  tools?: Tool[];

  // Prompts
  systemPrompt?: string | { preset: "claude_code" };
  appendSystemPrompt?: string;

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

  // Subagent Configuration
  subagents?: Record<string, AgentDefinition>;

  // Sandbox
  sandbox?: SandboxConfig;

  // Session
  sessionId?: string;
  resumeSession?: string;

  // Structured Output
  outputSchema?: JSONSchema;
}
```

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
// SDK uses minimal system prompt by default
query({ prompt: "Hello" })
```

### Full Claude Code Prompt

```typescript
// Include full Claude Code capabilities
query({
  prompt: "Refactor this module",
  options: {
    systemPrompt: { preset: "claude_code" }
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
// Add to default prompt without replacing
query({
  prompt: "...",
  options: {
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
      enabled: true,
      allowedPaths: ["/project/src", "/project/tests"],
      networkAccess: false
    }
  }
})
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
        "system_prompt": {"preset": "claude_code"},
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
4. **Use `systemPrompt: { preset: "claude_code" }`** when you need full capabilities
5. **Set `cwd`** explicitly rather than relying on process working directory
