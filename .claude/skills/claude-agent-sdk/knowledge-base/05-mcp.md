# MCP Integration

Model Context Protocol (MCP) enables Claude to interact with external tools and services.

---

## MCP Architecture

```
┌─────────────────┐     ┌─────────────────┐
│  Claude Agent   │────▶│   MCP Client    │
│    (Host)       │◀────│   (in SDK)      │
└─────────────────┘     └────────┬────────┘
                                 │
                    JSON-RPC over stdio/HTTP
                                 │
                        ┌────────▼────────┐
                        │   MCP Server    │
                        │  (Tools/Data)   │
                        └─────────────────┘
```

---

## Transport Types

### 1. Stdio Transport (Default)

Server runs as subprocess, communicates via stdin/stdout.

```typescript
mcpServers: {
  filesystem: {
    command: "npx",
    args: ["-y", "@anthropic-ai/mcp-server-filesystem", "/path/to/dir"]
  }
}
```

### 2. HTTP/SSE Transport

Server runs as HTTP service with Server-Sent Events.

```typescript
mcpServers: {
  remote: {
    url: "https://mcp.example.com/sse",
    headers: {
      Authorization: "Bearer token"
    }
  }
}
```

### 3. SDK MCP Server (In-Process)

Tools defined in-process, no subprocess needed.

```typescript
import { createSdkMcpServer, tool } from "@anthropic-ai/claude-agent-sdk";

const server = createSdkMcpServer({
  name: "my-tools",
  tools: [
    tool({
      name: "calculate",
      description: "Evaluate math expression",
      inputSchema: z.object({ expr: z.string() }),
      handler: async ({ expr }) => eval(expr)
    })
  ]
});

mcpServers: {
  "my-tools": server
}
```

---

## MCP Server Configuration

### Basic Stdio Server

```typescript
import { query } from "@anthropic-ai/claude-agent-sdk";

for await (const msg of query({
  prompt: "List files in the project",
  options: {
    mcpServers: {
      filesystem: {
        command: "npx",
        args: ["-y", "@anthropic-ai/mcp-server-filesystem", "/project"]
      }
    }
  }
})) {
  // Handle messages
}
```

### With Environment Variables

```typescript
mcpServers: {
  database: {
    command: "node",
    args: ["./mcp-server-db.js"],
    env: {
      DATABASE_URL: process.env.DATABASE_URL,
      NODE_ENV: "production"
    }
  }
}
```

### HTTP Server with Auth

```typescript
mcpServers: {
  api: {
    url: "https://mcp-api.example.com/sse",
    headers: {
      Authorization: `Bearer ${process.env.API_TOKEN}`,
      "X-Client-ID": "my-agent"
    }
  }
}
```

### Multiple Servers

```typescript
mcpServers: {
  filesystem: {
    command: "npx",
    args: ["-y", "@anthropic-ai/mcp-server-filesystem", "/data"]
  },
  database: {
    command: "python",
    args: ["-m", "mcp_server_postgres"],
    env: { POSTGRES_URL: process.env.POSTGRES_URL }
  },
  slack: {
    url: "https://mcp.slack.example.com/sse"
  }
}
```

---

## Tool Naming Convention

MCP tools are namespaced: `mcp__<server-name>__<tool-name>`

| Server Name | Tool Name | Full Tool Name |
|-------------|-----------|----------------|
| `filesystem` | `read_file` | `mcp__filesystem__read_file` |
| `database` | `query` | `mcp__database__query` |
| `slack` | `send_message` | `mcp__slack__send_message` |

---

## Allowing MCP Tools

### Allow All MCP Tools

```typescript
options: {
  mcpServers: { ... },
  // No allowedTools = all available
}
```

### Allow Specific MCP Tools

```typescript
options: {
  mcpServers: { ... },
  allowedTools: [
    "mcp__filesystem__read_file",
    "mcp__filesystem__list_directory",
    "mcp__database__query"
  ]
}
```

### Allow All Tools from a Server

```typescript
options: {
  mcpServers: { ... },
  allowedTools: [
    "mcp__filesystem__*",  // All filesystem tools
    "Read", "Glob"          // Plus built-in tools
  ]
}
```

### Block Specific MCP Tools

```typescript
options: {
  mcpServers: { ... },
  disallowedTools: [
    "mcp__filesystem__delete_file",
    "mcp__database__drop_table"
  ]
}
```

---

## MCP Primitives

### Tools

Functions the agent can call.

```typescript
// MCP server exposes tools
server.setRequestHandler(ListToolsRequestSchema, async () => ({
  tools: [
    {
      name: "search",
      description: "Search documents",
      inputSchema: {
        type: "object",
        properties: {
          query: { type: "string" }
        }
      }
    }
  ]
}));
```

### Resources

Data the agent can read.

```typescript
// MCP server exposes resources
server.setRequestHandler(ListResourcesRequestSchema, async () => ({
  resources: [
    {
      uri: "config://app",
      name: "App Configuration",
      mimeType: "application/json"
    }
  ]
}));
```

### Prompts

Pre-defined prompt templates.

```typescript
// MCP server exposes prompts
server.setRequestHandler(ListPromptsRequestSchema, async () => ({
  prompts: [
    {
      name: "code-review",
      description: "Review code for best practices"
    }
  ]
}));
```

---

## SDK MCP Server (In-Process)

For simple tools without needing a separate process.

```typescript
import { query, createSdkMcpServer, tool } from "@anthropic-ai/claude-agent-sdk";
import { z } from "zod";

// Define tools
const calculator = tool({
  name: "calculate",
  description: "Evaluate a mathematical expression",
  inputSchema: z.object({
    expression: z.string().describe("Math expression like '2 + 2'")
  }),
  handler: async ({ expression }) => {
    try {
      // Use safe evaluation in production!
      return { result: eval(expression) };
    } catch (e) {
      throw new Error(`Invalid expression: ${expression}`);
    }
  }
});

const timestamp = tool({
  name: "get_timestamp",
  description: "Get current timestamp",
  inputSchema: z.object({
    format: z.enum(["iso", "unix"]).default("iso")
  }),
  handler: async ({ format }) => {
    const now = new Date();
    return {
      timestamp: format === "unix" ? now.getTime() : now.toISOString()
    };
  }
});

// Create server
const myServer = createSdkMcpServer({
  name: "utilities",
  tools: [calculator, timestamp]
});

// Use in query
for await (const msg of query({
  prompt: "What's 15 * 23?",
  options: {
    mcpServers: {
      utilities: myServer
    }
  }
})) {
  // Handle messages
}
```

---

## Checking MCP Server Status

```typescript
const q = query({
  prompt: "...",
  options: { mcpServers: { ... } }
});

// Check server status
const status = await q.mcpServerStatus();
console.log(status);
// {
//   filesystem: { connected: true, tools: ["read_file", "write_file", ...] },
//   database: { connected: true, tools: ["query", "execute"] }
// }
```

---

## Error Handling

### Server Connection Errors

```typescript
for await (const message of query({ prompt, options })) {
  if (message.type === "system" && message.subtype === "mcp_error") {
    console.error("MCP Error:", message.message);
    // Handle gracefully - maybe disable that server's tools
  }
}
```

### Tool Execution Errors

```typescript
// MCP tool errors appear in PostToolUseFailure hook
PostToolUseFailure: async ({ tool_name, error }) => {
  if (tool_name.startsWith("mcp__")) {
    console.error(`MCP tool ${tool_name} failed:`, error);
  }
}
```

---

## Security Best Practices

### 1. Principle of Least Privilege

```typescript
// Only allow necessary tools
allowedTools: [
  "mcp__filesystem__read_file",  // Read only, no write
  "mcp__database__query"          // Query only, no execute
]
```

### 2. Validate Server Sources

```typescript
// Only use trusted servers
mcpServers: {
  // Official Anthropic servers
  filesystem: {
    command: "npx",
    args: ["-y", "@anthropic-ai/mcp-server-filesystem", "/safe/path"]
  }
}
```

### 3. Restrict File System Access

```typescript
// Limit to specific directories
mcpServers: {
  project: {
    command: "npx",
    args: ["-y", "@anthropic-ai/mcp-server-filesystem", "/project/src"]
    // Only /project/src accessible, not entire filesystem
  }
}
```

### 4. Use Environment Variables for Secrets

```typescript
mcpServers: {
  database: {
    command: "node",
    args: ["./db-server.js"],
    env: {
      // Never hardcode credentials
      DB_PASSWORD: process.env.DB_PASSWORD
    }
  }
}
```

### 5. Audit Tool Usage

```typescript
// Log all MCP tool calls
PostToolUse: async ({ tool_name, tool_input }) => {
  if (tool_name.startsWith("mcp__")) {
    await auditLog.write({
      timestamp: new Date(),
      tool: tool_name,
      input: tool_input
    });
  }
}
```

---

## Troubleshooting

| Issue | Solution |
|-------|----------|
| "Server not connected" | Check command path, permissions |
| "Tool not found" | Verify tool name matches `mcp__server__tool` |
| "Connection timeout" | Increase timeout, check server startup |
| "Permission denied" | Check `allowedTools` includes the tool |
| Server crashes | Check server logs, memory limits |

### Debug Server Startup

```typescript
mcpServers: {
  debug: {
    command: "node",
    args: ["./server.js", "--verbose"],
    env: {
      DEBUG: "*",
      LOG_LEVEL: "debug"
    }
  }
}
```

---

**Version:** ^0.2.45 | **Source:** https://github.com/anthropics/claude-agent-sdk-typescript
