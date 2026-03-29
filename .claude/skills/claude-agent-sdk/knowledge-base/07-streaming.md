# Streaming Patterns

Handle real-time responses and multi-turn conversations.

---

## Stream Event Flow

```
┌─────────────────┐
│  message_start  │ ── Message begins
└────────┬────────┘
         │
┌────────▼────────┐
│content_block_   │ ── Content block begins
│     start       │    (text, tool_use, thinking)
└────────┬────────┘
         │
┌────────▼────────┐
│content_block_   │ ── Incremental content
│     delta       │    (repeated)
└────────┬────────┘
         │
┌────────▼────────┐
│content_block_   │ ── Content block ends
│     stop        │
└────────┬────────┘
         │
    (repeat for each content block)
         │
┌────────▼────────┐
│  message_delta  │ ── Final usage stats
└────────┬────────┘
         │
┌────────▼────────┐
│  message_stop   │ ── Message complete
└─────────────────┘
```

---

## Basic Streaming

```typescript
import { query } from "@anthropic-ai/claude-agent-sdk";

for await (const message of query({
  prompt: "Explain quantum computing",
  options: { model: "sonnet" }
})) {
  if (message.type === "partial") {
    // Streaming text
    if (message.delta.text) {
      process.stdout.write(message.delta.text);
    }
  } else if (message.type === "assistant") {
    // Complete message
    console.log("\n--- Complete ---");
  } else if (message.type === "result") {
    console.log("\nCost:", message.total_cost_usd);
  }
}
```

---

## SDKPartialAssistantMessage

```typescript
type SDKPartialAssistantMessage = {
  type: "partial";
  uuid: UUID;
  session_id: string;
  delta: {
    type: "text_delta" | "input_json_delta";
    text?: string;           // For text content
    partial_json?: string;   // For tool input JSON
  };
}
```

---

## Collecting Streamed Content

```typescript
let fullText = "";
let currentToolInput = "";

for await (const message of query({ prompt })) {
  if (message.type === "partial") {
    switch (message.delta.type) {
      case "text_delta":
        fullText += message.delta.text ?? "";
        process.stdout.write(message.delta.text ?? "");
        break;

      case "input_json_delta":
        currentToolInput += message.delta.partial_json ?? "";
        break;
    }
  }
}

console.log("\n\nFull response:", fullText);
```

---

## Streaming with Tool Calls

```typescript
interface StreamState {
  text: string;
  currentTool: string | null;
  toolInput: string;
}

const state: StreamState = {
  text: "",
  currentTool: null,
  toolInput: ""
};

for await (const message of query({ prompt, options })) {
  switch (message.type) {
    case "partial":
      if (message.delta.text) {
        state.text += message.delta.text;
        process.stdout.write(message.delta.text);
      }
      if (message.delta.partial_json) {
        state.toolInput += message.delta.partial_json;
      }
      break;

    case "assistant":
      // Tool calls appear in complete assistant message
      for (const block of message.message.content) {
        if ("name" in block) {
          console.log(`\n[Calling ${block.name}]`);
          state.currentTool = block.name;
        }
      }
      break;

    case "user":
      // Tool results
      console.log(`[${state.currentTool} result received]`);
      state.currentTool = null;
      state.toolInput = "";
      break;

    case "result":
      console.log("\n--- Done ---");
      break;
  }
}
```

---

## Streaming Input (Multi-Turn)

For dynamic multi-turn conversations:

```typescript
import { query, SDKUserMessage } from "@anthropic-ai/claude-agent-sdk";

// Generator that yields user messages over time
async function* userMessages(): AsyncGenerator<SDKUserMessage> {
  // First message
  yield {
    type: "user",
    message: { role: "user", content: "Hello, I need help with my code" }
  };

  // Simulate waiting for response, then continue
  await new Promise(resolve => setTimeout(resolve, 5000));

  yield {
    type: "user",
    message: { role: "user", content: "Can you explain that in more detail?" }
  };

  await new Promise(resolve => setTimeout(resolve, 5000));

  yield {
    type: "user",
    message: { role: "user", content: "Thanks, that helps!" }
  };
}

// Use streaming input
for await (const message of query({
  prompt: userMessages(),  // AsyncIterable instead of string
  options: { model: "sonnet" }
})) {
  if (message.type === "partial" && message.delta.text) {
    process.stdout.write(message.delta.text);
  }
}
```

---

## Interactive Streaming Input

```typescript
import * as readline from "readline";

// Create a queue for user input
const inputQueue: string[] = [];
let inputResolver: ((value: string) => void) | null = null;

// Generator that waits for user input
async function* interactiveInput(): AsyncGenerator<SDKUserMessage> {
  while (true) {
    // Wait for user input
    const input = await new Promise<string>(resolve => {
      if (inputQueue.length > 0) {
        resolve(inputQueue.shift()!);
      } else {
        inputResolver = resolve;
      }
    });

    if (input === "/quit") break;

    yield {
      type: "user",
      message: { role: "user", content: input }
    };
  }
}

// Setup readline
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

rl.on("line", (line) => {
  if (inputResolver) {
    inputResolver(line);
    inputResolver = null;
  } else {
    inputQueue.push(line);
  }
});

// Run the conversation
console.log("Chat with Claude (type /quit to exit)");

for await (const message of query({
  prompt: interactiveInput(),
  options: { model: "sonnet" }
})) {
  if (message.type === "partial" && message.delta.text) {
    process.stdout.write(message.delta.text);
  } else if (message.type === "assistant") {
    console.log(); // Newline after response
    process.stdout.write("You: ");
  }
}

rl.close();
```

---

## Progress Tracking

```typescript
interface Progress {
  chunks: number;
  characters: number;
  toolCalls: number;
  startTime: number;
}

const progress: Progress = {
  chunks: 0,
  characters: 0,
  toolCalls: 0,
  startTime: Date.now()
};

for await (const message of query({ prompt })) {
  if (message.type === "partial" && message.delta.text) {
    progress.chunks++;
    progress.characters += message.delta.text.length;

    // Update progress display
    process.stderr.write(
      `\r[Chunks: ${progress.chunks}, Chars: ${progress.characters}]`
    );

    process.stdout.write(message.delta.text);
  }

  if (message.type === "assistant") {
    for (const block of message.message.content) {
      if ("name" in block) {
        progress.toolCalls++;
      }
    }
  }

  if (message.type === "result") {
    const duration = (Date.now() - progress.startTime) / 1000;
    console.log(`\n\nStats: ${progress.characters} chars in ${duration}s`);
    console.log(`Tool calls: ${progress.toolCalls}`);
    console.log(`Cost: $${message.total_cost_usd?.toFixed(4)}`);
  }
}
```

---

## Buffered Streaming

Buffer content before displaying:

```typescript
const BUFFER_SIZE = 10; // chars
let buffer = "";

for await (const message of query({ prompt })) {
  if (message.type === "partial" && message.delta.text) {
    buffer += message.delta.text;

    // Flush when buffer is full or on word boundary
    if (buffer.length >= BUFFER_SIZE || buffer.endsWith(" ")) {
      process.stdout.write(buffer);
      buffer = "";
    }
  } else if (message.type === "assistant") {
    // Flush remaining buffer
    if (buffer) {
      process.stdout.write(buffer);
      buffer = "";
    }
    console.log();
  }
}
```

---

## Streaming to UI (React)

```typescript
import { useState, useCallback } from "react";
import { query } from "@anthropic-ai/claude-agent-sdk";

function useStreamingChat() {
  const [messages, setMessages] = useState<string[]>([]);
  const [isStreaming, setIsStreaming] = useState(false);
  const [currentResponse, setCurrentResponse] = useState("");

  const sendMessage = useCallback(async (prompt: string) => {
    setIsStreaming(true);
    setCurrentResponse("");
    setMessages(prev => [...prev, `You: ${prompt}`]);

    let response = "";

    for await (const message of query({
      prompt,
      options: { model: "sonnet" }
    })) {
      if (message.type === "partial" && message.delta.text) {
        response += message.delta.text;
        setCurrentResponse(response);
      }

      if (message.type === "result") {
        setMessages(prev => [...prev, `Claude: ${response}`]);
        setCurrentResponse("");
        setIsStreaming(false);
      }
    }
  }, []);

  return { messages, currentResponse, isStreaming, sendMessage };
}
```

---

## Python Streaming

```python
from claude_agent_sdk import query

for message in query(
    prompt="Explain machine learning",
    options={"model": "sonnet"}
):
    if message.type == "partial":
        if hasattr(message.delta, "text") and message.delta.text:
            print(message.delta.text, end="", flush=True)

    elif message.type == "assistant":
        print()  # Newline after response

    elif message.type == "result":
        print(f"\nCost: ${message.total_cost_usd:.4f}")
```

---

## Best Practices

### 1. Always Handle Partial Messages

```typescript
// Good - handles streaming
if (message.type === "partial" && message.delta.text) {
  process.stdout.write(message.delta.text);
}

// Bad - only handles complete messages (misses streaming)
if (message.type === "assistant") {
  console.log(message.message.content);
}
```

### 2. Use Flush for Real-Time Output

```typescript
// Node.js
process.stdout.write(text); // No buffering

// Browser/React
setCurrentResponse(prev => prev + text); // Immediate state update
```

### 3. Track Both Partial and Complete

```typescript
let streamedText = "";

for await (const message of query({ prompt })) {
  if (message.type === "partial" && message.delta.text) {
    streamedText += message.delta.text;
    // Show streaming
  }

  if (message.type === "assistant") {
    // Verify: streamedText should equal full response
    // Use complete message for final processing
  }
}
```

### 4. Handle Interruption

```typescript
const q = query({ prompt });

// Later, if needed
q.interrupt();

// The loop will exit with result.subtype === "interrupted"
```

---

**Version:** ~0.2.86 | **Source:** https://github.com/anthropics/claude-agent-sdk-typescript
