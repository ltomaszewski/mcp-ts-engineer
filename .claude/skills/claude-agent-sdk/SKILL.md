---
name: claude-agent-sdk
version: "0.2.92"
description: "Anthropic Claude Agent SDK for TypeScript - Messages API, streaming, tool use, MCP integration, hooks."
when_to_use: "Use when building agents, integrating Claude API, or implementing AI features programmatically."
---

# Claude Agent SDK

> Build AI agents using Claude's agentic coding capabilities programmatically.

---

## When to Use

**LOAD THIS SKILL** when user is:
- Building AI agents with Claude programmatically
- Creating custom tools for Claude agents
- Implementing multi-turn conversations with `query()` or V2 sessions
- Adding MCP (Model Context Protocol) servers
- Setting up hooks for tool interception or logging
- Handling streaming responses from Claude
- Configuring agent permissions and sandboxing
- Spawning subagents for parallel tasks

---

## Critical Rules

**ALWAYS:**
1. Use async iteration for `query()` responses — it's an AsyncGenerator
2. Handle all SDKMessage types — `assistant`, `result`, `user`, `system`, `stream_event`
3. Set appropriate permission mode — don't use `bypassPermissions` in production
4. Validate tool inputs with Zod schemas (TS) or type hints (Python)
5. Handle errors gracefully — check `is_error` in result messages
6. Use `systemPrompt: { type: "preset", preset: "claude_code" }` for full Claude Code capabilities
7. Set `maxTurns` and `maxBudgetUsd` for all automated/production queries
8. Use `allowedTools` whitelist (not `disallowedTools`) for security-sensitive agents

**NEVER:**
1. Ignore result messages — they contain cost, duration, and error info
2. Use `any` for SDKMessage — use discriminated union type checking
3. Hardcode API keys — use environment variables
4. Skip hook error handling — failed hooks can crash the agent
5. Mix V1 and V2 interfaces in same session
6. Expose MCP servers without authentication in production
7. Include `Task` in subagent `tools` — subagents cannot spawn sub-subagents
8. Use `bypassPermissions` without `allowDangerouslySkipPermissions: true` and container isolation

---

## Package Information

| Language | Package | Install |
|----------|---------|---------|
| TypeScript | `@anthropic-ai/claude-agent-sdk` | `npm install @anthropic-ai/claude-agent-sdk` |
| Python | `claude-agent-sdk` | `pip install claude-agent-sdk` |

**Note**: The package was renamed from `@anthropic-ai/claude-code`. Update imports if migrating.

---

## Core Patterns

### Basic Query (TypeScript)

```typescript
import { query } from "@anthropic-ai/claude-agent-sdk";

for await (const message of query({
  prompt: "What files are in this directory?",
  options: {
    model: "sonnet",
    allowedTools: ["Glob", "Read"],
    maxTurns: 10,
    systemPrompt: { preset: "claude_code" }
  }
})) {
  if (message.type === "assistant") {
    for (const block of message.message.content) {
      if ("text" in block) console.log(block.text);
    }
  }
  if (message.type === "result") {
    console.log(`Done: ${message.subtype}, cost: $${message.total_cost_usd}`);
  }
}
```

### Basic Query (Python)

```python
from claude_agent_sdk import query

for message in query(
    prompt="What files are in this directory?",
    options={
        "model": "sonnet",
        "allowed_tools": ["Glob", "Read"],
        "max_turns": 10,
        "system_prompt": {"preset": "claude_code"}
    }
):
    if message.type == "assistant":
        for block in message.message.content:
            if hasattr(block, "text"):
                print(block.text)
    elif message.type == "result":
        print(f"Done: {message.subtype}, cost: ${message.total_cost_usd}")
```

### Custom Tool (TypeScript)

```typescript
import { query, tool } from "@anthropic-ai/claude-agent-sdk";
import { z } from "zod";

const weatherTool = tool({
  name: "get_weather",
  description: "Get current weather for a location",
  inputSchema: z.object({
    location: z.string().describe("City name"),
    units: z.enum(["celsius", "fahrenheit"]).default("celsius")
  }),
  handler: async ({ location, units }) => {
    // Fetch weather data
    return { temperature: 22, condition: "sunny", location, units };
  }
});

for await (const msg of query({
  prompt: "What's the weather in Tokyo?",
  options: { tools: [weatherTool] }
})) {
  // Handle messages
}
```

### Custom Tool (Python)

```python
from claude_agent_sdk import query, tool

@tool
def get_weather(location: str, units: str = "celsius") -> dict:
    """Get current weather for a location.

    Args:
        location: City name
        units: Temperature units (celsius or fahrenheit)
    """
    return {"temperature": 22, "condition": "sunny", "location": location}

for message in query(
    prompt="What's the weather in Tokyo?",
    options={"tools": [get_weather]}
):
    # Handle messages
    pass
```

### Message Type Handling

```typescript
for await (const message of query({ prompt })) {
  switch (message.type) {
    case "assistant":
      // Claude's response with content blocks
      for (const block of message.message.content) {
        if ("text" in block) console.log("Text:", block.text);
        if ("name" in block) console.log("Tool call:", block.name);
      }
      break;

    case "result":
      // Final result with metadata
      console.log("Status:", message.subtype);
      console.log("Cost:", message.total_cost_usd);
      console.log("Turns:", message.num_turns);
      if (message.is_error) console.error("Error:", message.result);
      break;

    case "user":
      // Tool results or user input
      console.log("User message:", message);
      break;

    case "system":
      // System messages
      console.log("System:", message);
      break;
  }
}
```

### Multi-Turn with Streaming Input

```typescript
import { query } from "@anthropic-ai/claude-agent-sdk";

async function* conversationStream() {
  yield { role: "user", content: "Hello, I need help with my code" };
  // Wait for response, then continue
  yield { role: "user", content: "Can you explain that part again?" };
}

for await (const message of query({
  prompt: conversationStream(),
  options: { model: "sonnet" }
})) {
  // Handle multi-turn conversation
}
```

### V2 Interface (Preview)

```typescript
import { unstable_v2_createSession } from "@anthropic-ai/claude-agent-sdk";

const session = unstable_v2_createSession({
  model: "sonnet",
  systemPrompt: { preset: "claude_code" }
});

// Non-streaming
const response = await session.send("What files are here?");
console.log(response.text);

// Streaming
for await (const chunk of session.stream("Explain the code")) {
  process.stdout.write(chunk.text);
}
```

### Subagent Pattern (v0.2: `agents`, not `subagents`)

```typescript
import { query } from "@anthropic-ai/claude-agent-sdk";

// Define agents (v0.2: renamed from "subagents")
const agents = {
  "code-reviewer": {
    description: "Reviews code for quality, security, and maintainability",
    prompt: "You are an expert code reviewer. Focus on quality, security, and maintainability.",
    model: "sonnet",
    tools: ["Read", "Glob", "Grep"]
  },
  "test-writer": {
    description: "Writes comprehensive unit tests following TDD principles",
    prompt: "You write comprehensive unit tests following TDD principles.",
    model: "sonnet",
    tools: ["Read", "Write", "Glob", "Bash"]
  }
};

// Main agent can spawn subagents via Task tool
for await (const message of query({
  prompt: "Review the auth module and write tests for it",
  options: {
    systemPrompt: { type: "preset", preset: "claude_code" },
    allowedTools: ["Task", "Read", "Glob"],
    agents
  }
})) {
  // Handle messages including subagent results
}
```

### Parallel Agent Execution

```typescript
// Run multiple agents in parallel
const tasks = [
  query({ prompt: "Analyze security of auth/", options: { model: "opus" } }),
  query({ prompt: "Check test coverage", options: { model: "haiku" } }),
  query({ prompt: "Review documentation", options: { model: "sonnet" } })
];

// Process all in parallel
for await (const message of Promise.race(tasks)) {
  // Handle messages from whichever completes first
}

// Or collect all results
const results = await Promise.all(
  tasks.map(async (task) => {
    const messages = [];
    for await (const msg of task) messages.push(msg);
    return messages;
  })
);
```

---

## Options Reference

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `model` | `string` | CLI default | Model to use (`"sonnet"`, `"opus"`, `"haiku"`) |
| `systemPrompt` | `string \| { type: "preset", preset: "claude_code", append?: string }` | minimal | System prompt |
| `allowedTools` | `string[]` | all | Tools agent can use |
| `disallowedTools` | `string[]` | `[]` | Tools to block |
| `tools` | `string[] \| { type: "preset", preset: "claude_code" } \| []` | `undefined` | Strict tool set: `["Bash","Read"]` = allowlist; `[]` = none; preset = all |
| `maxTurns` | `number` | `undefined` | Max conversation turns |
| `maxBudgetUsd` | `number` | `undefined` | Max cost in USD |
| `permissionMode` | `PermissionMode` | `"default"` | Permission behavior |
| `cwd` | `string` | `process.cwd()` | Working directory |
| `mcpServers` | `Record<string, McpServerConfig>` | `{}` | MCP server configs |
| `agents` | `Record<string, AgentDefinition>` | `undefined` | Subagent definitions |
| `settingSources` | `("user" \| "project" \| "local")[]` | `[]` | Settings to load from disk |
| `enableFileCheckpointing` | `boolean` | `false` | Enable `rewindFiles()` |
| `outputFormat` | `{ type: "json_schema", schema: JSONSchema }` | `undefined` | Structured output format |
| `sandbox` | `SandboxSettings` | `undefined` | Sandbox configuration |
| `plugins` | `SdkPluginConfig[]` | `[]` | Custom plugins |
| `betas` | `SdkBeta[]` | `[]` | Beta features (e.g., `"context-1m-2025-08-07"`) |
| `canUseTool` | `CanUseTool` | `undefined` | Custom permission function |
| `allowDangerouslySkipPermissions` | `boolean` | `false` | Required when using `bypassPermissions` |
| `includePartialMessages` | `boolean` | `false` | Include streaming `stream_event` messages |
| `agentProgressSummaries` | `boolean` | `false` | Enable periodic AI-generated progress summaries for subagents |
| `includeHookEvents` | `boolean` | `false` | Enable hook lifecycle messages (`hook_started`, `hook_progress`, `hook_response`) (v0.2.89+) |

### Permission Modes

| Mode | Behavior |
|------|----------|
| `"default"` | Prompts for approval on sensitive operations |
| `"acceptEdits"` | Auto-approve file edits |
| `"bypassPermissions"` | Skip all permission checks (dangerous) |
| `"plan"` | Planning mode, no execution |
| `"auto"` | Automatic permission decisions based on context (v0.2.91+) |

---

## Hook Events

| Event | When | Available |
|-------|------|-----------|
| `PreToolUse` | Before tool executes | TS ✓ Python ✓ |
| `PostToolUse` | After tool succeeds | TS ✓ Python ✓ |
| `PostToolUseFailure` | After tool fails | TS ✓ Python ✗ |
| `Notification` | Agent sends notification | TS ✓ Python ✓ |
| `UserPromptSubmit` | User submits prompt | TS ✓ Python ✗ |
| `Stop` | Agent stops | TS ✓ Python ✓ |
| `SubagentStart` | Subagent spawns | TS ✓ Python ✗ |
| `SubagentStop` | Subagent completes | TS ✓ Python ✗ |
| `ConfigChange` | Config/settings changed | TS ✓ Python ✗ |

### Hook Example (TypeScript)

```typescript
for await (const message of query({
  prompt: "Edit config.json",
  options: {
    hooks: {
      PreToolUse: async ({ tool_name, tool_input }) => {
        if (tool_name === "Write" && tool_input.file_path.includes(".env")) {
          return { decision: "block", reason: "Cannot modify .env files" };
        }
        return { decision: "approve" };
      },
      PostToolUse: async ({ tool_name, tool_result }) => {
        console.log(`Tool ${tool_name} completed:`, tool_result);
      }
    }
  }
})) {
  // Handle messages
}
```

---

## MCP Integration

### Stdio MCP Server

```typescript
const options = {
  mcpServers: {
    filesystem: {
      command: "npx",
      args: ["-y", "@anthropic-ai/mcp-server-filesystem", "/path/to/dir"],
      env: { NODE_ENV: "production" }
    }
  }
};
```

### SDK MCP Server

```typescript
import { createSdkMcpServer, tool } from "@anthropic-ai/claude-agent-sdk";
import { z } from "zod";

const server = createSdkMcpServer({
  name: "my-tools",
  tools: [
    tool({
      name: "calculate",
      description: "Perform calculation",
      inputSchema: z.object({ expression: z.string() }),
      handler: async ({ expression }) => eval(expression)
    })
  ]
});

const options = {
  mcpServers: {
    "my-tools": server
  }
};
```

### Tool Naming Convention

MCP tools are exposed as: `mcp__<server-name>__<tool-name>`

```typescript
// Allow specific MCP tool
allowedTools: ["mcp__filesystem__read_file"]

// Allow all tools from server
allowedTools: ["mcp__filesystem__*"]
```

---

## Built-in Tools

| Tool | Description |
|------|-------------|
| `Read` | Read file contents |
| `Write` | Write/create files |
| `Edit` | Edit existing files |
| `Bash` | Execute shell commands |
| `Glob` | File pattern matching |
| `Grep` | Search file contents |
| `WebFetch` | Fetch web content |
| `WebSearch` | Search the web |
| `Task` | Spawn subagents (orchestrator only, never in subagent tools) |
| `TodoWrite` | Task tracking |
| `NotebookEdit` | Jupyter notebooks |
| `AskUserQuestion` | Request input from user (must opt-in via `tools` option) |

---

## Anti-Patterns

| Bad | Good | Why |
|-----|------|-----|
| `for await (const m of query(...)) {}` without type checks | Use `switch(message.type)` | Miss important message types |
| `permissionMode: "bypassPermissions"` | `permissionMode: "acceptEdits"` | Security risk |
| Hardcoded `ANTHROPIC_API_KEY` | `process.env.ANTHROPIC_API_KEY` | Secret exposure |
| Ignoring `result.is_error` | Check and handle errors | Silent failures |
| `tool({ inputSchema: {} })` | Use Zod schema | No input validation |
| Mixing V1 `query()` with V2 `session` | Use one interface per session | State conflicts |

---

## Authentication

### Automatic (Recommended)

If you've authenticated Claude Code CLI (`claude`), the SDK uses that automatically.

### API Key

```bash
# .env
ANTHROPIC_API_KEY=your-api-key
```

### Cloud Providers

| Provider | Environment Variable |
|----------|---------------------|
| Amazon Bedrock | `CLAUDE_CODE_USE_BEDROCK=1` |
| Google Vertex AI | `CLAUDE_CODE_USE_VERTEX=1` |
| Microsoft Azure | `CLAUDE_CODE_USE_FOUNDRY=1` |

---

## Deep Dive References

| Topic | File |
|-------|------|
| Query API & Options | `knowledge-base/01-query-api.md` |
| Message Types | `knowledge-base/02-message-types.md` |
| Custom Tools | `knowledge-base/03-custom-tools.md` |
| Hooks System | `knowledge-base/04-hooks.md` |
| MCP Integration | `knowledge-base/05-mcp.md` |
| V2 Interface | `knowledge-base/06-v2-interface.md` |
| Streaming Patterns | `knowledge-base/07-streaming.md` |

---

## Quick Troubleshooting

| Issue | Solution |
|-------|----------|
| "Tool not found" | Check `allowedTools` includes the tool |
| "Permission denied" | Adjust `permissionMode` or add to `allowedTools` |
| MCP tools not available | Verify server config, check `mcpServerStatus()` |
| High costs | Set `maxBudgetUsd`, reduce `maxTurns` |
| Slow responses | Use `haiku` model for simple tasks |
| Hook not firing | Check hook event name spelling |

---

## Quick Reference

| Task | Pattern | Example |
|------|---------|---------|
| Basic query | `query({ prompt })` | `for await (const m of query({ prompt }))` |
| With options | `options: {}` | `model, allowedTools, maxTurns` |
| Custom tool | `tool({})` | `name, description, inputSchema, handler` |
| Hook | `hooks: {}` | `PreToolUse, PostToolUse, Stop` |
| MCP server | `mcpServers: {}` | `{ command, args }` or `{ url }` |
| V2 session | `unstable_v2_createSession` | `session.send()`, `session.stream()` |
| Agents | `agents: {}` | Named agent definitions (v0.2) |
| Pre-warm | `startup()` | Pre-warm CLI subprocess before first `query()` (v0.2.89+) |
| Subagent history | `listSubagents()` | List subagent sessions from a session (v0.2.89+) |
| Context usage | `getContextUsage()` | Get context window usage breakdown (v0.2.86+) |

---

## Resources

- [TypeScript SDK Docs](https://platform.claude.com/docs/en/agent-sdk/typescript)
- [Python SDK Docs](https://platform.claude.com/docs/en/agent-sdk/python)
- [GitHub - TypeScript](https://github.com/anthropics/claude-agent-sdk-typescript)
- [GitHub - Python](https://github.com/anthropics/claude-agent-sdk-python)
- [Examples Repository](https://github.com/anthropics/claude-agent-sdk-demos)

---

**Version:** 0.2.92 | **Source:** https://github.com/anthropics/claude-agent-sdk-typescript

### v0.2.86-0.2.92 Notable Changes

- **v0.2.92**: Parity with Claude Code v2.1.92
- **v0.2.91**: `terminal_reason` field on result messages (`completed`, `aborted_tools`, `max_turns`, `blocking_limit`); `"auto"` added to `PermissionMode` type; **Breaking**: `sandbox.failIfUnavailable` now defaults to `true` when `enabled: true` — set `failIfUnavailable: false` for graceful degradation
- **v0.2.89**: `startup()` to pre-warm CLI subprocess (~20x faster first query); `includeSystemMessages` option for `getSessionMessages()`; `listSubagents()` and `getSubagentMessages()` for subagent history; `includeHookEvents` for hook lifecycle messages; fixed `ERR_STREAM_WRITE_AFTER_END` errors; fixed Zod v4 `.describe()` metadata dropped from `createSdkMcpServer`; fixed error result messages not setting `is_error: true`; fixed MCP servers stuck in failed state after connection race
- **v0.2.86**: `getContextUsage()` for context window usage breakdown; `session_id` optional in `SDKUserMessage`; fixed TypeScript types resolving to `any`; `reloadPlugins()` SDK method

### v0.2.50-0.2.85 Notable Changes

- **v0.2.84**: `seed_read_state` control subtype to seed `readFileState` with `{path, mtime}` so `Edit` works after the originating `Read` was removed from context; `session_state_changed` events now opt-in via `CLAUDE_CODE_EMIT_SESSION_STATE_EVENTS=1`
- **v0.2.83**: `agentProgressSummaries` option for periodic AI-generated progress summaries on `task_progress` events; `getSettings()` with `applied` section showing runtime-resolved model and effort values
- **v0.2.81**: Fixed `getSessionMessages()` dropping parallel tool results — all `tool_use`/`tool_result` pairs now returned
- **v0.2.80**: `getSessionMessages()` function for reading session conversation history from transcript files (supports pagination via `limit`/`offset`)
- **v0.2.77**: `api_retry` system messages exposing attempt count, max retries, delay, and error status
- **v0.2.75**: `supportedAgents()` method on `Query` to list available subagents; `enableChannel()` method + `capabilities` field on `McpServerStatus`
- **v0.2.72**: `agent_id` and `agent_type` fields added to hook event `BaseHookInput` (populated for subagent hooks)
- **v0.2.70**: Exported `EffortLevel` type (`"low" | "medium" | "high" | "max"`) for consumers
- **v0.2.68**: Default effort changed to `"medium"` for Sonnet 4.6 (was `"high"`); use `maxThinkingTokens` or effort options to override
- **v0.2.65**: `tools` option for strict tool allowlists: `["Bash","Read"]`, `[]` for none, or `{ type: "preset", preset: "claude_code" }` for all defaults
- **v0.2.62**: `AskUserQuestion` tool support (opt-in via `tools` option)
- **v0.2.55**: V2 session `receive()` renamed to `stream()` for consistency with Anthropic SDK patterns
- **v0.2.50**: `ConfigChange` hook event; model info includes `supportsEffort`, `supportedEffortLevels`; `canUseTool` custom permission callback
- **v0.2.45**: Claude Sonnet 4.6 support; `task_started` system message; `subagents` renamed to `agents`; `settingSources` must be explicitly passed; `systemPrompt` preset syntax: `{ type: "preset", preset: "claude_code" }`; `bypassPermissions` now requires `allowDangerouslySkipPermissions: true`
