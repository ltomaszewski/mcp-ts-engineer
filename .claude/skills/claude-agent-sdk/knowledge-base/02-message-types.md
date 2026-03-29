# Message Types

Complete reference for SDKMessage types and handling patterns.

---

## SDKMessage Union Type

```typescript
type SDKMessage =
  | SDKAssistantMessage
  | SDKUserMessage
  | SDKUserMessageReplay
  | SDKResultMessage
  | SDKSystemMessage
  | SDKStreamEventMessage       // v0.2: replaces SDKPartialAssistantMessage
  | SDKCompactBoundaryMessage;
```

---

## SDKAssistantMessage

Claude's response containing text and/or tool calls.

```typescript
type SDKAssistantMessage = {
  type: "assistant";
  uuid: UUID;
  session_id: string;
  message: APIAssistantMessage;
  parent_tool_use_id: string | null;
}

// APIAssistantMessage structure
type APIAssistantMessage = {
  role: "assistant";
  content: ContentBlock[];
  model: string;
  stop_reason: string | null;
  stop_sequence: string | null;
  usage: {
    input_tokens: number;
    output_tokens: number;
  };
}
```

### Content Blocks

```typescript
type ContentBlock =
  | TextBlock
  | ThinkingBlock
  | ToolUseBlock
  | ToolResultBlock;

// Text content
type TextBlock = {
  type: "text";
  text: string;
}

// Extended thinking (when enabled)
type ThinkingBlock = {
  type: "thinking";
  thinking: string;
}

// Tool call request
type ToolUseBlock = {
  type: "tool_use";
  id: string;
  name: string;
  input: Record<string, unknown>;
}

// Tool execution result
type ToolResultBlock = {
  type: "tool_result";
  tool_use_id: string;
  content: string | ContentBlock[];
  is_error?: boolean;
}
```

### Handling Assistant Messages

```typescript
for await (const message of query({ prompt })) {
  if (message.type === "assistant") {
    for (const block of message.message.content) {
      switch (block.type) {
        case "text":
          console.log("Claude says:", block.text);
          break;
        case "thinking":
          console.log("Thinking:", block.thinking);
          break;
        case "tool_use":
          console.log(`Calling ${block.name} with:`, block.input);
          break;
      }
    }
  }
}
```

---

## SDKResultMessage

Final message containing execution metadata.

```typescript
type SDKResultMessage = {
  type: "result";
  subtype: string;
  duration_ms: number;
  duration_api_ms: number;
  is_error: boolean;
  num_turns: number;
  session_id: string;
  total_cost_usd?: number;
  usage?: {
    input_tokens: number;
    output_tokens: number;
    cache_creation_input_tokens?: number;
    cache_read_input_tokens?: number;
  };
  result?: string;
  structured_output?: unknown;
  model?: string;                  // v0.2: model used
  permission_denials?: number;     // v0.2: count of denied permissions
}
```

### Result Subtypes

| Subtype | Meaning |
|---------|---------|
| `"success"` | Completed successfully |
| `"error_during_execution"` | Error during agent execution |
| `"error_max_turns"` | Hit max turns limit |
| `"error_budget"` | Hit budget limit |
| `"error_timeout"` | Hit timeout |
| `"interrupted"` | User or system interrupted |

> **v0.2 Note**: Subtypes were refined. `"error"` split into `"error_during_execution"`, `"error_max_turns"`, `"error_budget"`, `"error_timeout"` for more granular error handling.

### Handling Result Messages

```typescript
for await (const message of query({ prompt })) {
  if (message.type === "result") {
    console.log("=== Execution Complete ===");
    console.log("Status:", message.subtype);
    console.log("Duration:", message.duration_ms, "ms");
    console.log("API Duration:", message.duration_api_ms, "ms");
    console.log("Turns:", message.num_turns);
    console.log("Cost: $", message.total_cost_usd?.toFixed(4));

    if (message.is_error) {
      console.error("Error:", message.result);
    }

    if (message.structured_output) {
      console.log("Output:", message.structured_output);
    }
  }
}
```

---

## SDKUserMessage

User input or tool results.

```typescript
type SDKUserMessage = {
  type: "user";
  uuid: UUID;
  session_id: string;
  message: APIUserMessage;
}

type APIUserMessage = {
  role: "user";
  content: string | ContentBlock[];
}
```

---

## SDKSystemMessage

System-level messages.

```typescript
type SDKSystemMessage = {
  type: "system";
  subtype: string;
  message: string;
  data?: unknown;
}
```

### System Subtypes

| Subtype | When |
|---------|------|
| `"init"` | Session initialized |
| `"mcp_connected"` | MCP server connected |
| `"mcp_error"` | MCP server error |
| `"permission_request"` | Permission needed |
| `"task_started"` | Subagent task started (v0.2.45+) |
| `"task_notification"` | Subagent task notification (v0.2.47+) |
| `"config_change"` | Configuration changed (v0.2.49+) |

---

## SDKStreamEventMessage (v0.2)

Streaming chunk during response generation. Requires `includePartialMessages: true` in options.

> **v0.2 Migration**: Type changed from `"partial"` to `"stream_event"`. The old `SDKPartialAssistantMessage` with `type: "partial"` is replaced.

```typescript
type SDKStreamEventMessage = {
  type: "stream_event";
  uuid: UUID;
  session_id: string;
  event: {
    type: "content_block_delta";
    index: number;
    delta: {
      type: "text_delta" | "input_json_delta";
      text?: string;
      partial_json?: string;
    };
  };
}
```

### Handling Stream Events

```typescript
for await (const message of query({
  prompt,
  options: { includePartialMessages: true }
})) {
  if (message.type === "stream_event") {
    if (message.event.delta.text) {
      process.stdout.write(message.event.delta.text);
    }
  }
}
```

---

## SDKCompactBoundaryMessage

Marks context compaction points.

```typescript
type SDKCompactBoundaryMessage = {
  type: "compact_boundary";
  summary: string;
  compacted_turns: number;
}
```

---

## Complete Message Handler Pattern

```typescript
async function processQuery(prompt: string) {
  const result = {
    responses: [] as string[],
    toolCalls: [] as { name: string; input: unknown }[],
    cost: 0,
    turns: 0,
    error: null as string | null
  };

  for await (const message of query({ prompt })) {
    switch (message.type) {
      case "assistant":
        for (const block of message.message.content) {
          if ("text" in block) {
            result.responses.push(block.text);
          } else if ("name" in block) {
            result.toolCalls.push({
              name: block.name,
              input: block.input
            });
          }
        }
        break;

      case "result":
        result.cost = message.total_cost_usd ?? 0;
        result.turns = message.num_turns;
        if (message.is_error) {
          result.error = message.result ?? "Unknown error";
        }
        break;

      case "stream_event":
        // Handle streaming (requires includePartialMessages: true)
        if (message.event.delta.text) {
          result.responses.push(message.event.delta.text);
        }
        break;

      case "system":
        console.log(`[System ${message.subtype}]:`, message.message);
        break;

      case "user":
        // Usually tool results, handled automatically
        break;

      case "compact_boundary":
        console.log(`Context compacted: ${message.compacted_turns} turns`);
        break;
    }
  }

  return result;
}
```

---

## Python Message Handling

```python
from claude_agent_sdk import query

for message in query(prompt="Hello"):
    if message.type == "assistant":
        for block in message.message.content:
            if hasattr(block, "text"):
                print("Text:", block.text)
            elif hasattr(block, "name"):
                print(f"Tool: {block.name}({block.input})")

    elif message.type == "result":
        print(f"Done: {message.subtype}")
        print(f"Cost: ${message.total_cost_usd:.4f}")
        if message.is_error:
            print(f"Error: {message.result}")

    elif message.type == "stream_event":
        if hasattr(message.event.delta, "text"):
            print(message.event.delta.text, end="", flush=True)
```

---

## Type Guards (TypeScript)

```typescript
function isAssistantMessage(m: SDKMessage): m is SDKAssistantMessage {
  return m.type === "assistant";
}

function isResultMessage(m: SDKMessage): m is SDKResultMessage {
  return m.type === "result";
}

function isTextBlock(b: ContentBlock): b is TextBlock {
  return b.type === "text";
}

function isToolUseBlock(b: ContentBlock): b is ToolUseBlock {
  return b.type === "tool_use";
}

// Usage
for await (const message of query({ prompt })) {
  if (isAssistantMessage(message)) {
    for (const block of message.message.content) {
      if (isTextBlock(block)) {
        console.log(block.text);
      }
    }
  }
}
```

---

## Best Practices

1. **Always handle `result` messages** - they contain important metadata
2. **Check `is_error` in result** - don't assume success
3. **Use discriminated unions** - leverage TypeScript's type narrowing
4. **Handle `stream_event` for UX** - show streaming output to users (requires `includePartialMessages: true`)
5. **Log `system` messages** - useful for debugging MCP and permissions

---

**Version:** ~0.2.86 | **Source:** https://github.com/anthropics/claude-agent-sdk-typescript
