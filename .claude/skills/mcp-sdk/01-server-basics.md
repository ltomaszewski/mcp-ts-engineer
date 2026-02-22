# MCP SDK: Server Basics

**Creating, configuring, and running MCP servers with the TypeScript SDK v1.x.**

---

## Installation

```bash
npm install @modelcontextprotocol/sdk zod
```

Zod is a required peer dependency (v3.25+). The SDK handles Zod schema conversion internally.

---

## McpServer Class

The high-level `McpServer` class handles capability registration and protocol management.

### Constructor

```typescript
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";

const server = new McpServer(
  { name: "my-server", version: "1.0.0" },  // Implementation info (required)
  { capabilities: { logging: {} } }          // ServerOptions (optional)
);
```

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `serverInfo.name` | `string` | Yes | Unique server identifier |
| `serverInfo.version` | `string` | Yes | Server version (semver) |
| `options.capabilities` | `ServerCapabilities` | No | Explicit capability declarations |

### Server Capabilities

Capabilities are auto-detected from registrations, but can be declared explicitly:

```typescript
const server = new McpServer(
  { name: "my-server", version: "1.0.0" },
  {
    capabilities: {
      logging: {},                           // Enable server-side logging
      tools: { listChanged: true },          // Notify clients of tool list changes
      resources: {
        subscribe: true,                     // Allow resource subscriptions
        listChanged: true,                   // Notify clients of resource list changes
      },
      prompts: { listChanged: true },        // Notify clients of prompt list changes
    },
  }
);
```

---

## Server Lifecycle

### Connecting a Transport

```typescript
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";

const transport = new StdioServerTransport();
await server.connect(transport);
```

Register all tools, resources, and prompts BEFORE calling `connect()`. The connection starts the JSON-RPC message loop immediately.

### Checking Connection Status

```typescript
if (server.isConnected()) {
  console.error("Server is connected and handling requests");
}
```

### Closing the Server

```typescript
await server.close();
```

Closes the transport and cleans up resources. The server can be reconnected to a new transport after closing.

---

## Complete stdio Server Example

```typescript
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";

const server = new McpServer({
  name: "example-server",
  version: "1.0.0",
});

// Register a tool
server.tool(
  "add",
  "Add two numbers",
  { a: z.number(), b: z.number() },
  async ({ a, b }) => ({
    content: [{ type: "text", text: String(a + b) }],
  }),
);

// Connect and run
async function main(): Promise<void> {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("Server running on stdio");
}

main().catch((error) => {
  console.error("Fatal error:", error);
  process.exit(1);
});
```

---

## Logging

### Server-Side Logging (to client)

Declare the `logging` capability, then use the underlying `Server` instance:

```typescript
const server = new McpServer(
  { name: "my-server", version: "1.0.0" },
  { capabilities: { logging: {} } },
);

// Access the low-level Server for logging
server.server.sendLoggingMessage({
  level: "info",
  logger: "my-server",
  data: "Server initialized",
});
```

Log levels (in order): `debug`, `info`, `notice`, `warning`, `error`, `critical`, `alert`, `emergency`.

### Stdio Logging Constraints

| Output | Use | Notes |
|--------|-----|-------|
| `stdout` | JSON-RPC only | NEVER write non-protocol data here |
| `stderr` | Developer logs | Safe for `console.error()` |
| MCP logging | Client-visible | Via `sendLoggingMessage()` |

---

## Notification Methods

Notify connected clients of changes:

```typescript
// Notify that the tool list changed
server.sendToolListChanged();

// Notify that the resource list changed
server.sendResourceListChanged();

// Notify that the prompt list changed
server.sendPromptListChanged();
```

These are useful when tools, resources, or prompts are added/removed dynamically at runtime.

---

## Project Structure (Recommended)

Based on the monorepo's MCP server template (`templates/apps/mcp-server/`):

```
src/
  index.ts              # Entry point: creates transport, connects server
  server.ts             # Server factory: creates McpServer, registers capabilities
  capabilities/
    index.ts            # Registers all capabilities with the server
    echo/
      echo.capability.ts  # Tool handler implementation
      echo.schema.ts      # Zod input schema
      __tests__/
        echo.schema.test.ts
```

### Entry Point (`index.ts`)

```typescript
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { createServer } from "./server.js";

async function main(): Promise<void> {
  const server = createServer();
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("MCP server running on stdio");
}

main().catch((error) => {
  console.error("Fatal error:", error);
  process.exit(1);
});
```

### Server Factory (`server.ts`)

```typescript
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { registerCapabilities } from "./capabilities/index.js";

export function createServer(): McpServer {
  const server = new McpServer({
    name: "my-server",
    version: "0.1.0",
  });

  registerCapabilities(server);
  return server;
}
```

### Capability Hub (`capabilities/index.ts`)

```typescript
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { registerEcho } from "./echo/echo.capability.js";

export function registerCapabilities(server: McpServer): void {
  registerEcho(server);
}
```

---

## Graceful Shutdown

```typescript
process.on("SIGINT", async () => {
  console.error("Shutting down...");
  await server.close();
  process.exit(0);
});

process.on("SIGTERM", async () => {
  console.error("Shutting down...");
  await server.close();
  process.exit(0);
});
```

---

## Package Configuration

For an MCP server that runs via `node`:

```json
{
  "type": "module",
  "bin": { "my-server": "./build/index.js" },
  "scripts": {
    "build": "tsc",
    "start": "node build/index.js",
    "dev": "tsx src/index.ts"
  }
}
```

### TypeScript Configuration

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "Node16",
    "moduleResolution": "Node16",
    "outDir": "./build",
    "rootDir": "./src",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true
  },
  "include": ["src/**/*"]
}
```

---

**See Also**: [02-tools.md](02-tools.md), [03-resources.md](03-resources.md), [05-transports.md](05-transports.md)
**Source**: https://modelcontextprotocol.io/docs/develop/build-server and https://github.com/modelcontextprotocol/typescript-sdk/blob/v1.x/README.md
**Version**: 1.x
