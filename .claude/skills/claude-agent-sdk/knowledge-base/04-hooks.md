# Hooks System

Intercept and customize agent behavior at key execution points.

---

## Hook Events Overview

| Event | When Fired | TypeScript | Python |
|-------|------------|------------|--------|
| `PreToolUse` | Before tool executes | ✓ | ✓ |
| `PostToolUse` | After tool succeeds | ✓ | ✓ |
| `PostToolUseFailure` | After tool fails | ✓ | ✗ |
| `Notification` | Agent sends notification | ✓ | ✓ |
| `UserPromptSubmit` | User submits prompt | ✓ | ✗ |
| `Stop` | Agent stops | ✓ | ✓ |
| `SubagentStart` | Subagent spawns | ✓ | ✗ |
| `SubagentStop` | Subagent completes | ✓ | ✗ |
| `SessionStart` | Session begins | ✓ | ✗ |
| `SessionEnd` | Session ends | ✓ | ✗ |
| `PreCompact` | Before context compaction | ✓ | ✗ |
| `PermissionRequest` | Permission needed | ✓ | ✗ |

---

## Hook Configuration (TypeScript)

```typescript
import { query } from "@anthropic-ai/claude-agent-sdk";

for await (const message of query({
  prompt: "Edit the config file",
  options: {
    hooks: {
      PreToolUse: async (data) => {
        // Return decision
        return { decision: "approve" };
      },
      PostToolUse: async (data) => {
        // Logging, no return needed
        console.log(`Tool ${data.tool_name} completed`);
      },
      Stop: async (data) => {
        console.log("Agent stopped:", data.reason);
      }
    }
  }
})) {
  // Handle messages
}
```

---

## PreToolUse Hook

Intercept tool calls before execution.

### Input Data

```typescript
interface PreToolUseInput {
  session_id: string;
  tool_name: string;
  tool_input: Record<string, unknown>;
}
```

### Return Options

```typescript
// Approve the tool call
return { decision: "approve" };

// Block the tool call
return { decision: "block", reason: "Not allowed" };

// Modify the input
return {
  decision: "approve",
  modified_input: { ...input, sanitized: true }
};

// Skip and provide result directly
return {
  decision: "skip",
  tool_result: "Cached result here"
};
```

### Examples

#### Block Dangerous Operations

```typescript
PreToolUse: async ({ tool_name, tool_input }) => {
  // Block .env file access
  if (tool_name === "Read" || tool_name === "Write" || tool_name === "Edit") {
    const path = tool_input.file_path as string;
    if (path.includes(".env")) {
      return {
        decision: "block",
        reason: "Access to .env files is not allowed"
      };
    }
  }

  // Block rm -rf commands
  if (tool_name === "Bash") {
    const cmd = tool_input.command as string;
    if (cmd.includes("rm -rf")) {
      return {
        decision: "block",
        reason: "Recursive delete not permitted"
      };
    }
  }

  return { decision: "approve" };
}
```

#### Sanitize Inputs

```typescript
PreToolUse: async ({ tool_name, tool_input }) => {
  if (tool_name === "Bash") {
    // Remove sudo from commands
    const cmd = (tool_input.command as string).replace(/sudo\s+/g, "");
    return {
      decision: "approve",
      modified_input: { ...tool_input, command: cmd }
    };
  }
  return { decision: "approve" };
}
```

#### Cache Results

```typescript
const cache = new Map<string, string>();

PreToolUse: async ({ tool_name, tool_input }) => {
  if (tool_name === "WebFetch") {
    const url = tool_input.url as string;
    if (cache.has(url)) {
      return {
        decision: "skip",
        tool_result: cache.get(url)
      };
    }
  }
  return { decision: "approve" };
}
```

---

## PostToolUse Hook

React to successful tool executions.

### Input Data

```typescript
interface PostToolUseInput {
  session_id: string;
  tool_name: string;
  tool_input: Record<string, unknown>;
  tool_result: string;
}
```

### Examples

#### Logging

```typescript
PostToolUse: async ({ tool_name, tool_input, tool_result }) => {
  console.log(`[${new Date().toISOString()}] ${tool_name}`);
  console.log("Input:", JSON.stringify(tool_input, null, 2));
  console.log("Result:", tool_result.substring(0, 200));
}
```

#### Caching

```typescript
PostToolUse: async ({ tool_name, tool_input, tool_result }) => {
  if (tool_name === "WebFetch") {
    cache.set(tool_input.url as string, tool_result);
  }
}
```

#### Metrics

```typescript
const metrics = { toolCalls: 0, byTool: {} as Record<string, number> };

PostToolUse: async ({ tool_name }) => {
  metrics.toolCalls++;
  metrics.byTool[tool_name] = (metrics.byTool[tool_name] || 0) + 1;
}
```

---

## PostToolUseFailure Hook

React to failed tool executions.

### Input Data

```typescript
interface PostToolUseFailureInput {
  session_id: string;
  tool_name: string;
  tool_input: Record<string, unknown>;
  error: string;
}
```

### Example

```typescript
PostToolUseFailure: async ({ tool_name, tool_input, error }) => {
  console.error(`Tool ${tool_name} failed:`, error);

  // Send to error tracking
  await errorTracker.capture({
    type: "tool_failure",
    tool: tool_name,
    input: tool_input,
    error
  });
}
```

---

## Stop Hook

React when the agent stops.

### Input Data

```typescript
interface StopInput {
  session_id: string;
  reason: "success" | "error" | "interrupted" | "max_turns" | "budget_exceeded";
  result?: string;
}
```

### Example

```typescript
Stop: async ({ session_id, reason, result }) => {
  console.log(`Session ${session_id} ended: ${reason}`);

  if (reason === "error") {
    await alerting.notify(`Agent error: ${result}`);
  }

  // Cleanup
  await cleanup(session_id);
}
```

---

## Notification Hook

Handle agent notifications.

### Input Data

```typescript
interface NotificationInput {
  session_id: string;
  type: string;
  message: string;
  data?: unknown;
}
```

### Example

```typescript
Notification: async ({ type, message, data }) => {
  switch (type) {
    case "progress":
      updateProgressBar(data.percentage);
      break;
    case "warning":
      console.warn(message);
      break;
    case "info":
      console.log(message);
      break;
  }
}
```

---

## SubagentStart / SubagentStop Hooks

Track subagent lifecycle.

```typescript
SubagentStart: async ({ session_id, parent_session_id, task }) => {
  console.log(`Subagent ${session_id} started for: ${task}`);
},

SubagentStop: async ({ session_id, parent_session_id, result }) => {
  console.log(`Subagent ${session_id} completed:`, result.subtype);
}
```

---

## PermissionRequest Hook

Handle permission requests programmatically.

```typescript
PermissionRequest: async ({ session_id, tool_name, tool_input, reason }) => {
  // Auto-approve certain patterns
  if (tool_name === "Read" && tool_input.file_path.startsWith("/safe/")) {
    return { decision: "approve" };
  }

  // Auto-deny dangerous patterns
  if (tool_name === "Bash" && tool_input.command.includes("sudo")) {
    return { decision: "deny", reason: "sudo not allowed" };
  }

  // Prompt user for others
  const userDecision = await promptUser(
    `Allow ${tool_name} on ${tool_input.file_path}?`
  );
  return { decision: userDecision ? "approve" : "deny" };
}
```

---

## Python Hooks

```python
from claude_agent_sdk import query

def pre_tool_use(data):
    """Block .env file access."""
    if data.tool_name in ("Read", "Write", "Edit"):
        if ".env" in data.tool_input.get("file_path", ""):
            return {"decision": "block", "reason": ".env access denied"}
    return {"decision": "approve"}

def post_tool_use(data):
    """Log tool completions."""
    print(f"Tool {data.tool_name} completed")

def on_stop(data):
    """Handle agent stop."""
    print(f"Agent stopped: {data.reason}")

for message in query(
    prompt="Read the config",
    options={
        "hooks": {
            "PreToolUse": pre_tool_use,
            "PostToolUse": post_tool_use,
            "Stop": on_stop
        }
    }
):
    pass
```

---

## Hook Best Practices

### 1. Keep Hooks Fast

Hooks block execution. Keep them quick.

```typescript
// Good - quick check
PreToolUse: async ({ tool_name }) => {
  return blockedTools.has(tool_name)
    ? { decision: "block" }
    : { decision: "approve" };
}

// Bad - slow external call in critical path
PreToolUse: async ({ tool_name }) => {
  const allowed = await fetch("https://api.example.com/check");  // Slow!
  return { decision: allowed ? "approve" : "block" };
}
```

### 2. Handle Errors in Hooks

```typescript
PreToolUse: async (data) => {
  try {
    return await checkPermissions(data);
  } catch (error) {
    console.error("Hook error:", error);
    // Fail closed - deny on error
    return { decision: "block", reason: "Permission check failed" };
  }
}
```

### 3. Use Hooks for Cross-Cutting Concerns

- **Logging**: PostToolUse for audit trails
- **Caching**: PreToolUse to skip, PostToolUse to store
- **Security**: PreToolUse to block dangerous operations
- **Metrics**: All hooks for observability

### 4. Don't Overuse Hooks

Use hooks for:
- Security controls
- Logging/metrics
- Caching
- Resource cleanup

Don't use hooks for:
- Business logic (put in tools instead)
- Complex transformations (use custom tools)
- UI updates (use message handling)

---

## Debugging Hooks

```typescript
// Verbose hook for debugging
PreToolUse: async (data) => {
  console.log("=== PreToolUse ===");
  console.log("Tool:", data.tool_name);
  console.log("Input:", JSON.stringify(data.tool_input, null, 2));

  const decision = await actualCheck(data);

  console.log("Decision:", decision);
  return decision;
}
```
