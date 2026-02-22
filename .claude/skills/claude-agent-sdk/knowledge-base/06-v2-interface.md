# V2 Interface (Preview)

Simplified session-based API for multi-turn conversations.

> **Warning**: V2 is an unstable preview. APIs may change based on feedback.

---

## V1 vs V2 Comparison

| Aspect | V1 (`query()`) | V2 (`createSession()`) |
|--------|----------------|------------------------|
| API Style | Async generator | Session object |
| Multi-turn | Streaming input | `send()`/`stream()` calls |
| State | Manual tracking | Session manages |
| Complexity | More flexible | Simpler |
| Features | Full feature set | Some limitations |

---

## Creating a Session

```typescript
import { unstable_v2_createSession } from "@anthropic-ai/claude-agent-sdk";

const session = unstable_v2_createSession({
  model: "sonnet",
  systemPrompt: { preset: "claude_code" },
  allowedTools: ["Read", "Glob", "Grep"],
  maxTurns: 50
});
```

---

## Non-Streaming: `send()`

Wait for complete response.

```typescript
const session = unstable_v2_createSession({ model: "sonnet" });

// First turn
const response1 = await session.send("What files are in this directory?");
console.log(response1.text);
console.log("Cost:", response1.cost_usd);

// Second turn (maintains context)
const response2 = await session.send("Show me the package.json");
console.log(response2.text);

// Third turn
const response3 = await session.send("What version of React is used?");
console.log(response3.text);
```

### Response Object

```typescript
interface SendResponse {
  text: string;              // Claude's text response
  tool_calls: ToolCall[];    // Tools that were called
  cost_usd: number;          // Cost of this turn
  turns: number;             // Cumulative turns
  session_id: string;        // Session identifier
}
```

---

## Streaming: `stream()`

Get responses as they're generated.

```typescript
const session = unstable_v2_createSession({ model: "sonnet" });

// Stream response
for await (const chunk of session.stream("Explain the codebase structure")) {
  process.stdout.write(chunk.text);
}
console.log(); // Newline after streaming

// Can mix streaming and non-streaming
const summary = await session.send("Summarize that in one sentence");
console.log(summary.text);
```

### Stream Chunk Object

```typescript
interface StreamChunk {
  text: string;           // Incremental text
  done: boolean;          // Is this the last chunk?
  tool_call?: ToolCall;   // Tool being called (if any)
}
```

---

## Session Configuration

```typescript
const session = unstable_v2_createSession({
  // Model
  model: "sonnet",                    // or "opus", "haiku"

  // System prompt
  systemPrompt: { preset: "claude_code" },  // Full Claude Code
  // or
  systemPrompt: "You are a code reviewer",  // Custom

  // Tools
  allowedTools: ["Read", "Glob"],     // Whitelist
  disallowedTools: ["Bash"],          // Blacklist
  tools: [customTool],                // Custom tools

  // Limits
  maxTurns: 100,
  maxBudgetUsd: 5.0,

  // MCP
  mcpServers: {
    filesystem: { command: "...", args: ["..."] }
  },

  // Working directory
  cwd: "/path/to/project"
});
```

---

## Multi-Turn Conversation Pattern

```typescript
const session = unstable_v2_createSession({
  model: "sonnet",
  systemPrompt: { preset: "claude_code" }
});

// Interactive conversation
async function chat(userMessage: string): Promise<string> {
  const response = await session.send(userMessage);
  return response.text;
}

// Example flow
await chat("I need to refactor the auth module");
await chat("Start with the login function");
await chat("Now update the tests");
await chat("Create a summary of changes");
```

---

## Error Handling

```typescript
const session = unstable_v2_createSession({ model: "sonnet" });

try {
  const response = await session.send("Do something risky");
  console.log(response.text);
} catch (error) {
  if (error.code === "BUDGET_EXCEEDED") {
    console.log("Ran out of budget");
  } else if (error.code === "MAX_TURNS") {
    console.log("Hit turn limit");
  } else if (error.code === "PERMISSION_DENIED") {
    console.log("Permission denied:", error.message);
  } else {
    throw error;
  }
}
```

---

## Session State

```typescript
const session = unstable_v2_createSession({ model: "sonnet" });

// Get session info
console.log("Session ID:", session.sessionId);
console.log("Total turns:", session.turns);
console.log("Total cost:", session.totalCostUsd);

// After some turns
await session.send("Hello");
await session.send("Do something");

console.log("Turns now:", session.turns);  // 2
```

---

## Combining with Tools

```typescript
import { unstable_v2_createSession, tool } from "@anthropic-ai/claude-agent-sdk";
import { z } from "zod";

const getWeather = tool({
  name: "get_weather",
  description: "Get weather for a city",
  inputSchema: z.object({ city: z.string() }),
  handler: async ({ city }) => ({ temp: 22, city })
});

const session = unstable_v2_createSession({
  model: "sonnet",
  tools: [getWeather]
});

const response = await session.send("What's the weather in Tokyo?");
console.log(response.text);
console.log("Tools called:", response.tool_calls);
```

---

## V2 Limitations

Current V2 preview limitations:

| Feature | V1 | V2 |
|---------|----|----|
| Session forking | ✓ | ✗ |
| File rewinding | ✓ | ✗ |
| Interruption | ✓ | Limited |
| All hook events | ✓ | Subset |
| Streaming input | ✓ | ✗ |

---

## Migration from V1 to V2

### V1 Pattern

```typescript
// V1: Async generator
for await (const message of query({
  prompt: "Hello",
  options: { model: "sonnet" }
})) {
  if (message.type === "assistant") {
    for (const block of message.message.content) {
      if ("text" in block) console.log(block.text);
    }
  }
}
```

### V2 Equivalent

```typescript
// V2: Session-based
const session = unstable_v2_createSession({ model: "sonnet" });
const response = await session.send("Hello");
console.log(response.text);
```

### Multi-turn V1

```typescript
// V1: Streaming input for multi-turn
async function* conversation() {
  yield { role: "user", content: "Hello" };
  // Wait for response...
  yield { role: "user", content: "Tell me more" };
}

for await (const msg of query({ prompt: conversation() })) {
  // Handle messages
}
```

### Multi-turn V2

```typescript
// V2: Simple sequential calls
const session = unstable_v2_createSession({ model: "sonnet" });
await session.send("Hello");
await session.send("Tell me more");
```

---

## When to Use V2

**Use V2 for:**
- Simple multi-turn conversations
- Interactive CLI tools
- Chatbot-style applications
- Quick prototypes

**Stick with V1 for:**
- Complex streaming needs
- Session forking
- File rewinding
- Full hook support
- Production systems (until V2 stabilizes)

---

## Example: Interactive Code Assistant

```typescript
import { unstable_v2_createSession } from "@anthropic-ai/claude-agent-sdk";
import * as readline from "readline";

const session = unstable_v2_createSession({
  model: "sonnet",
  systemPrompt: { preset: "claude_code" },
  cwd: process.cwd()
});

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

console.log("Code Assistant (type 'exit' to quit)");
console.log("---");

function prompt() {
  rl.question("You: ", async (input) => {
    if (input.toLowerCase() === "exit") {
      console.log(`\nSession cost: $${session.totalCostUsd.toFixed(4)}`);
      rl.close();
      return;
    }

    process.stdout.write("Assistant: ");
    for await (const chunk of session.stream(input)) {
      process.stdout.write(chunk.text);
    }
    console.log("\n");

    prompt();
  });
}

prompt();
```

---

**Version:** ^0.2.45 | **Source:** https://github.com/anthropics/claude-agent-sdk-typescript
