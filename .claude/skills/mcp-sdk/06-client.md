# MCP SDK: Client

**Connecting to MCP servers, calling tools, reading resources, and getting prompts.**

---

## Overview

The MCP Client class provides high-level methods to connect to any MCP server and invoke its capabilities. The client handles protocol negotiation, capability discovery, and transport management.

---

## Installation

```bash
npm install @modelcontextprotocol/sdk zod
```

---

## Client Class

### Connecting via stdio

Spawn a server as a subprocess and communicate over stdin/stdout:

```typescript
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";

const transport = new StdioClientTransport({
  command: "node",
  args: ["/path/to/server/build/index.js"],
});

const client = new Client(
  { name: "my-client", version: "1.0.0" },
  { capabilities: {} },
);

await client.connect(transport);
```

### StdioClientTransport Options

| Option | Type | Required | Description |
|--------|------|----------|-------------|
| `command` | `string` | Yes | Executable to spawn |
| `args` | `string[]` | No | Command-line arguments |
| `env` | `Record<string, string>` | No | Environment variables |
| `cwd` | `string` | No | Working directory for the process |

### Connecting via SSE (Legacy)

```typescript
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { SSEClientTransport } from "@modelcontextprotocol/sdk/client/sse.js";

const transport = new SSEClientTransport(
  new URL("http://localhost:3001/sse"),
);

const client = new Client(
  { name: "my-client", version: "1.0.0" },
  { capabilities: {} },
);

await client.connect(transport);
```

### Connecting via Streamable HTTP

```typescript
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StreamableHTTPClientTransport } from "@modelcontextprotocol/sdk/client/streamableHttp.js";

const transport = new StreamableHTTPClientTransport(
  new URL("http://localhost:3001/mcp"),
);

const client = new Client(
  { name: "my-client", version: "1.0.0" },
  { capabilities: {} },
);

await client.connect(transport);
```

---

## Listing Capabilities

### List Tools

```typescript
const { tools } = await client.listTools();

for (const tool of tools) {
  console.error(`Tool: ${tool.name} - ${tool.description}`);
  console.error(`  Input Schema: ${JSON.stringify(tool.inputSchema)}`);
}
```

### List Resources

```typescript
const { resources } = await client.listResources();

for (const resource of resources) {
  console.error(`Resource: ${resource.name} (${resource.uri})`);
}
```

### List Resource Templates

```typescript
const { resourceTemplates } = await client.listResourceTemplates();

for (const template of resourceTemplates) {
  console.error(`Template: ${template.uriTemplate}`);
}
```

### List Prompts

```typescript
const { prompts } = await client.listPrompts();

for (const prompt of prompts) {
  console.error(`Prompt: ${prompt.name} - ${prompt.description}`);
}
```

---

## Calling Tools

```typescript
const result = await client.callTool({
  name: "greet",
  arguments: { name: "Alice" },
});

// Result structure
// {
//   content: [{ type: "text", text: "Hello, Alice!" }],
//   isError: false,
// }

for (const item of result.content) {
  if (item.type === "text") {
    console.error(item.text);
  }
}
```

### callTool Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `name` | `string` | Yes | Tool name to invoke |
| `arguments` | `Record<string, unknown>` | No | Input arguments matching the tool's schema |

### Handling Tool Errors

```typescript
const result = await client.callTool({
  name: "fetch-data",
  arguments: { url: "https://invalid.example.com" },
});

if (result.isError) {
  const errorText = result.content
    .filter((c): c is { type: "text"; text: string } => c.type === "text")
    .map((c) => c.text)
    .join("\n");
  console.error("Tool error:", errorText);
}
```

---

## Reading Resources

```typescript
const result = await client.readResource({
  uri: "file:///project/README.md",
});

for (const content of result.contents) {
  if ("text" in content) {
    console.error(`${content.uri}: ${content.text}`);
  } else if ("blob" in content) {
    console.error(`${content.uri}: [binary data, ${content.blob.length} chars base64]`);
  }
}
```

### readResource Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `uri` | `string` | Yes | Resource URI to read |

---

## Getting Prompts

```typescript
const result = await client.getPrompt({
  name: "review-code",
  arguments: {
    code: "function add(a, b) { return a + b; }",
  },
});

// Result contains messages ready for the LLM
for (const message of result.messages) {
  console.error(`[${message.role}]: ${JSON.stringify(message.content)}`);
}
```

### getPrompt Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `name` | `string` | Yes | Prompt name |
| `arguments` | `Record<string, string>` | No | Arguments matching the prompt's schema |

---

## Autocompletion

Request completions for prompt or resource template arguments:

```typescript
const completions = await client.complete({
  ref: { type: "ref/prompt", name: "review-code" },
  argument: { name: "language", value: "type" },
});

// completions.completion.values = ["typescript"]
console.error("Suggestions:", completions.completion.values);
```

---

## Subscribing to Resource Changes

```typescript
// Subscribe to updates
await client.subscribeResource({ uri: "file:///project/config.json" });

// Listen for notifications
client.setNotificationHandler(
  "notifications/resources/updated",
  async (notification) => {
    const { uri } = notification.params;
    console.error(`Resource updated: ${uri}`);
    // Re-read the resource
    const result = await client.readResource({ uri });
    // Process updated content...
  },
);
```

---

## Client Lifecycle

### Disconnecting

```typescript
await client.close();
```

### Ping

Check if the server is responsive:

```typescript
await client.ping();
```

---

## Complete Client Example

```typescript
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";

async function main(): Promise<void> {
  const transport = new StdioClientTransport({
    command: "node",
    args: ["./build/index.js"],
  });

  const client = new Client(
    { name: "test-client", version: "1.0.0" },
    { capabilities: {} },
  );

  await client.connect(transport);

  // Discover tools
  const { tools } = await client.listTools();
  console.error(`Found ${tools.length} tools`);

  // Call a tool
  if (tools.length > 0) {
    const result = await client.callTool({
      name: tools[0].name,
      arguments: { message: "Hello from client" },
    });
    console.error("Result:", JSON.stringify(result.content));
  }

  // Discover and read resources
  const { resources } = await client.listResources();
  for (const resource of resources) {
    const data = await client.readResource({ uri: resource.uri });
    console.error(`Resource ${resource.name}:`, data.contents[0]);
  }

  // Get a prompt
  const { prompts } = await client.listPrompts();
  if (prompts.length > 0) {
    const prompt = await client.getPrompt({
      name: prompts[0].name,
      arguments: {},
    });
    console.error("Prompt messages:", prompt.messages.length);
  }

  await client.close();
}

main().catch(console.error);
```

---

## Client API Summary

| Method | Returns | Description |
|--------|---------|-------------|
| `connect(transport)` | `Promise<void>` | Connect to server |
| `close()` | `Promise<void>` | Disconnect |
| `ping()` | `Promise<void>` | Check server responsiveness |
| `listTools()` | `Promise<ListToolsResult>` | List available tools |
| `callTool(params)` | `Promise<CallToolResult>` | Invoke a tool |
| `listResources()` | `Promise<ListResourcesResult>` | List available resources |
| `listResourceTemplates()` | `Promise<ListResourceTemplatesResult>` | List resource templates |
| `readResource(params)` | `Promise<ReadResourceResult>` | Read a resource |
| `subscribeResource(params)` | `Promise<void>` | Subscribe to resource updates |
| `listPrompts()` | `Promise<ListPromptsResult>` | List available prompts |
| `getPrompt(params)` | `Promise<GetPromptResult>` | Get prompt messages |
| `complete(params)` | `Promise<CompleteResult>` | Get autocompletions |

---

**See Also**: [05-transports.md](05-transports.md), [01-server-basics.md](01-server-basics.md)
**Source**: https://github.com/modelcontextprotocol/typescript-sdk/blob/v1.x/README.md
**Version**: 1.29.0
