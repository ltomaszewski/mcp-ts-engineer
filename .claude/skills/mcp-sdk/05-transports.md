# MCP SDK: Transports

**stdio, SSE, and Streamable HTTP transport configuration.**

---

## Overview

MCP uses JSON-RPC over a transport layer. The protocol defines two standard transports:

1. **stdio** -- communication over standard input/output (local process spawning)
2. **Streamable HTTP** -- HTTP POST/GET with optional SSE streaming (remote servers)

A deprecated **HTTP+SSE** transport exists for backward compatibility.

---

## stdio Transport

The most common transport for local MCP servers (Claude Desktop, Claude Code CLI).

### How It Works

- Client launches the MCP server as a subprocess
- Server reads JSON-RPC from `stdin`, writes responses to `stdout`
- Messages are newline-delimited, MUST NOT contain embedded newlines
- `stderr` is available for logging (safe to use `console.error()`)

### Server Setup

```typescript
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";

const server = new McpServer({ name: "my-server", version: "1.0.0" });

// Register tools, resources, prompts...

const transport = new StdioServerTransport();
await server.connect(transport);
console.error("Server running on stdio");  // stderr is safe
```

### Client Configuration (Claude Desktop)

```json
{
  "mcpServers": {
    "my-server": {
      "command": "node",
      "args": ["/absolute/path/to/build/index.js"]
    }
  }
}
```

Config file location:
- macOS: `~/Library/Application Support/Claude/claude_desktop_config.json`
- Windows: `%AppData%\Claude\claude_desktop_config.json`

### stdio Constraints

| Rule | Rationale |
|------|-----------|
| NEVER write non-MCP data to `stdout` | Corrupts JSON-RPC stream |
| NEVER use `console.log()` | Writes to stdout by default |
| Use `console.error()` for logging | Writes to stderr, safe |
| Messages must be newline-delimited | Protocol requirement |

---

## SSE Server Transport (HTTP+SSE, Legacy)

The older transport using Server-Sent Events. Still supported for backward compatibility.

### Server Setup

```typescript
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { SSEServerTransport } from "@modelcontextprotocol/sdk/server/sse.js";
import express from "express";

const app = express();
app.use(express.json());
const server = new McpServer({ name: "my-server", version: "1.0.0" });

// Register capabilities...

let transport: SSEServerTransport;

app.get("/sse", async (req, res) => {
  transport = new SSEServerTransport("/message", res);
  await server.connect(transport);
});

app.post("/message", async (req, res) => {
  await transport.handlePostMessage(req, res, req.body);
});

app.listen(3001, () => {
  console.error("SSE server running on port 3001");
});
```

### SSEServerTransport Constructor

```typescript
new SSEServerTransport(
  messagePath: string,          // POST endpoint path for client messages
  response: ServerResponse,     // Express response object for SSE stream
  options?: SSEServerTransportOptions // Optional config (e.g., DNS rebinding protection)
)
```

| Parameter | Type | Description |
|-----------|------|-------------|
| `messagePath` | `string` | URL path where client POSTs JSON-RPC messages |
| `response` | `ServerResponse` | Node.js HTTP response for SSE streaming |
| `options` | `SSEServerTransportOptions` | Optional config for validation |

### SSEServerTransport Methods

| Method | Description |
|--------|-------------|
| `handlePostMessage(req, res, body?)` | Process incoming JSON-RPC POST (pass `req.body` as third arg) |
| `handleMessage(message)` | Handle a JSON-RPC message from any source |

---

## Streamable HTTP Transport

The recommended transport for remote servers (v1.x late additions). Supports request/response, SSE streaming, and session management.

### Server Setup with Express

```typescript
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import express from "express";
import { randomUUID } from "crypto";

const app = express();
app.use(express.json());

const server = new McpServer({ name: "my-server", version: "1.0.0" });
// Register capabilities...

const transport = new StreamableHTTPServerTransport({
  sessionIdGenerator: () => randomUUID(),
});

await server.connect(transport);

// Handle all MCP requests on a single endpoint
// handleRequest(req, res, parsedBody?) -- pass req.body as third arg when using express.json()
app.post("/mcp", async (req, res) => {
  await transport.handleRequest(req, res, req.body);
});

app.get("/mcp", async (req, res) => {
  await transport.handleRequest(req, res);
});

app.delete("/mcp", async (req, res) => {
  await transport.handleRequest(req, res);
});

app.listen(3001, () => {
  console.error("Streamable HTTP server on port 3001");
});
```

### StreamableHTTPServerTransport Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `sessionIdGenerator` | `() => string \| undefined` | Required | Returns session ID or `undefined` for stateless |
| `enableJsonResponse` | `boolean` | `false` | Return JSON instead of SSE (no streaming) |
| `eventStore` | `EventStore` | `undefined` | Optional event store for resumability support |
| `onsessioninitialized` | `(sessionId: string) => void` | `undefined` | Called when server initializes a new session |

### Stateful vs Stateless

```typescript
// Stateful: sessions tracked by server
const transport = new StreamableHTTPServerTransport({
  sessionIdGenerator: () => randomUUID(),
});

// Stateless: no session management
const transport = new StreamableHTTPServerTransport({
  sessionIdGenerator: undefined,
});

// JSON-only mode: no SSE streaming
const transport = new StreamableHTTPServerTransport({
  sessionIdGenerator: () => randomUUID(),
  enableJsonResponse: true,
});
```

### Session Management

When a session ID generator is provided:
- Server assigns `Mcp-Session-Id` header in the `InitializeResult` response
- Client MUST include `Mcp-Session-Id` in all subsequent requests
- Server can terminate sessions (returns HTTP 404 for expired sessions)
- Client can delete sessions via HTTP DELETE to the MCP endpoint

---

## Transport Comparison

| Feature | stdio | SSE (Legacy) | Streamable HTTP |
|---------|-------|-------------|-----------------|
| Use case | Local CLI tools | Remote servers (legacy) | Remote servers (recommended) |
| Connection | Subprocess | HTTP GET + POST | HTTP POST + GET |
| Streaming | N/A (bidirectional pipe) | SSE (server to client) | Optional SSE |
| Sessions | Implicit (one per process) | Manual | Built-in |
| Authentication | Process-level | Custom | OAuth/custom |
| Multiple clients | No (1:1) | Yes | Yes |
| Resumability | N/A | No | Optional (event IDs) |

---

## Custom Transports

The SDK supports custom transports by implementing the `Transport` interface:

```typescript
import { Transport } from "@modelcontextprotocol/sdk/shared/transport.js";

class CustomTransport implements Transport {
  sessionId?: string;

  async start(): Promise<void> {
    // Initialize transport
  }

  async send(message: JSONRPCMessage): Promise<void> {
    // Send message to other side
  }

  async close(): Promise<void> {
    // Clean up
  }

  // Event handlers set by the SDK
  onclose?: () => void;
  onerror?: (error: Error) => void;
  onmessage?: (message: JSONRPCMessage) => void;
}
```

### Transport Interface

| Method/Property | Type | Description |
|----------------|------|-------------|
| `sessionId` | `string \| undefined` | Session ID for this connection |
| `start()` | `() => Promise<void>` | Initialize the transport |
| `send(message, options?)` | `(msg: JSONRPCMessage, opts?) => Promise<void>` | Send a JSON-RPC message |
| `close()` | `() => Promise<void>` | Close the transport |
| `onclose` | `() => void` | Called when transport closes |
| `onerror` | `(error: Error) => void` | Called on transport error |
| `onmessage` | `(message: JSONRPCMessage) => void` | Called when message received |

---

## Security: DNS Rebinding Protection

For HTTP-based transports, validate the `Origin` header to prevent DNS rebinding attacks:

```typescript
const ALLOWED_ORIGINS = ["http://localhost:3001", "https://myapp.example.com"];

app.use((req, res, next) => {
  const origin = req.headers.origin;
  if (origin && !ALLOWED_ORIGINS.includes(origin)) {
    res.status(403).send("Forbidden");
    return;
  }
  next();
});
```

Rules:
- Servers MUST validate the `Origin` header on all incoming connections
- When running locally, bind to `127.0.0.1` (not `0.0.0.0`)
- Implement proper authentication for all connections

---

## When to Use Which Transport

| Scenario | Transport | Why |
|----------|-----------|-----|
| Claude Desktop integration | stdio | Standard for local servers |
| Claude Code CLI | stdio | Process-based invocation |
| Remote API server | Streamable HTTP | Multiple clients, sessions |
| Browser client | Streamable HTTP | HTTP-based, CORS support |
| Backward compat with older clients | SSE (legacy) | Some clients only support SSE |
| Testing | stdio | Simplest to set up |

---

**See Also**: [01-server-basics.md](01-server-basics.md), [06-client.md](06-client.md)
**Source**: https://modelcontextprotocol.io/specification/2025-06-18/basic/transports and https://github.com/modelcontextprotocol/typescript-sdk/blob/v1.x/README.md
**Version**: 1.28.0
