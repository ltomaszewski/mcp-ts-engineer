---
name: mcp-sdk
description: Model Context Protocol SDK v1.x - MCP servers, tools, resources, prompts, transports, Zod schema validation. Use when building MCP servers, defining tools, exposing resources, creating prompts, or configuring stdio/HTTP transports.
---

# MCP SDK v1.x

> TypeScript SDK for building Model Context Protocol servers that expose tools, resources, and prompts to AI clients like Claude.

---

## When to Use

**LOAD THIS SKILL** when user is:
- Building or modifying an MCP server with tools, resources, or prompts
- Defining tool input schemas with Zod for MCP tool registration
- Implementing MCP transports (stdio, Streamable HTTP, SSE)
- Registering resources with static URIs or dynamic URI templates
- Creating prompt templates with argument schemas
- Connecting an MCP client to a server

---

## Critical Rules

**ALWAYS:**
1. Use `@modelcontextprotocol/sdk` as the single package import (v1.x) -- v2 splits into separate packages but v1.x is one package
2. Pass Zod raw shape (e.g., `{ name: z.string() }`) to `server.tool()`, not a `z.object()` -- the SDK wraps it internally. Alternatively, use `server.registerTool()` which also accepts full Zod schemas in `inputSchema`
3. Use `console.error()` for logging in stdio servers -- `console.log()` writes to stdout and corrupts JSON-RPC messages
4. Return `{ content: [{ type: 'text', text: string }] }` from tool handlers -- this is the required `CallToolResult` format
5. Call `await server.connect(transport)` after registering all capabilities -- connection starts the message loop

**NEVER:**
1. Use `console.log()` in stdio-based servers -- corrupts the JSON-RPC protocol stream, breaks the server silently
2. Import from `@modelcontextprotocol/server` or `@modelcontextprotocol/client` in v1.x -- those are v2 package names; use `@modelcontextprotocol/sdk/server/mcp.js` and `@modelcontextprotocol/sdk/client/index.js`

---

## Core Patterns

### Basic Server with Tool (stdio)

```typescript
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";

const server = new McpServer({ name: "my-server", version: "1.0.0" });

server.tool("greet", "Greet a user by name", { name: z.string() }, async ({ name }) => ({
  content: [{ type: "text", text: `Hello, ${name}!` }],
}));

const transport = new StdioServerTransport();
await server.connect(transport);
```

### Resource Provider (static URI)

```typescript
server.resource("readme", "file:///project/README.md", { mimeType: "text/markdown" }, async (uri) => ({
  contents: [{ uri: uri.href, mimeType: "text/markdown", text: "# My Project\n..." }],
}));
```

### Resource Provider (URI template)

```typescript
import { ResourceTemplate } from "@modelcontextprotocol/sdk/server/mcp.js";

server.resource(
  "user-profile",
  new ResourceTemplate("user://{userId}/profile", { list: undefined }),
  { mimeType: "application/json" },
  async (uri, { userId }) => ({
    contents: [{ uri: uri.href, text: JSON.stringify({ userId, name: "Alice" }) }],
  }),
);
```

### Prompt Template

```typescript
server.prompt("review-code", "Review code for best practices", { code: z.string() }, ({ code }) => ({
  messages: [{ role: "user", content: { type: "text", text: `Please review:\n\n${code}` } }],
}));
```

---

## Anti-Patterns

**BAD** -- Passing z.object() to server.tool() instead of shape:
```typescript
const schema = z.object({ name: z.string() });
server.tool("greet", "Greet", schema, async ({ name }) => { ... }); // TypeError
```

**GOOD** -- Pass the Zod raw shape (object literal with z.* values):
```typescript
server.tool("greet", "Greet", { name: z.string() }, async ({ name }) => { ... });
```

**BAD** -- Using console.log in stdio server:
```typescript
console.log("Server started"); // Corrupts JSON-RPC stream
```

**GOOD** -- Use console.error for logging:
```typescript
console.error("Server started"); // Safe: writes to stderr
```

**BAD** -- Missing content array wrapper in tool result:
```typescript
server.tool("hello", async () => ({ text: "Hello" })); // Wrong shape
```

**GOOD** -- Return proper CallToolResult:
```typescript
server.tool("hello", async () => ({
  content: [{ type: "text", text: "Hello" }],
}));
```

---

## Quick Reference

| Task | API | Example |
|------|-----|---------|
| Create server | `new McpServer()` | `new McpServer({ name: "x", version: "1.0.0" })` |
| Register tool | `server.tool()` | `server.tool("name", "desc", { arg: z.string() }, handler)` |
| Register tool (config) | `server.registerTool()` | `server.registerTool("name", { description, inputSchema }, handler)` |
| Register resource | `server.resource()` | `server.resource("name", "uri://path", metadata, handler)` |
| Register prompt | `server.prompt()` | `server.prompt("name", "desc", { arg: z.string() }, handler)` |
| Connect stdio | `StdioServerTransport` | `await server.connect(new StdioServerTransport())` |
| Connect HTTP | `SSEServerTransport` | See [05-transports.md](05-transports.md) |
| Resource template | `ResourceTemplate` | `new ResourceTemplate("u://{id}", { list: undefined })` |
| Tool annotations | `ToolAnnotations` | `server.tool("name", "desc", schema, annotations, handler)` |
| Send log | `server.server.sendLoggingMessage()` | See [01-server-basics.md](01-server-basics.md) |
| Close server | `server.close()` | `await server.close()` |

---

## Deep Dive References

Load additional context when needed:

| When you need | Load |
|---------------|------|
| Server creation, lifecycle, logging, shutdown | [01-server-basics.md](01-server-basics.md) |
| Tool registration, schemas, annotations, errors | [02-tools.md](02-tools.md) |
| Resources, URI templates, subscriptions | [03-resources.md](03-resources.md) |
| Prompt registration, arguments, messages | [04-prompts.md](04-prompts.md) |
| Transports: stdio, SSE, Streamable HTTP | [05-transports.md](05-transports.md) |
| MCP Client: connecting, calling tools/resources | [06-client.md](06-client.md) |
| Advanced: low-level Server, middleware, sampling | *(not yet created)* |

---

**Version:** 1.x (latest: 1.27.0) | **Source:** https://modelcontextprotocol.io/ and https://github.com/modelcontextprotocol/typescript-sdk
