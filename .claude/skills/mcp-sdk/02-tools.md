# MCP SDK: Tools

**Registering tools with input schemas, annotations, output schemas, and error handling.**

---

## Overview

Tools are functions that an LLM can invoke (with user approval) to perform actions: computation, API calls, side effects. Each tool has a unique name, optional description, an input schema defined with Zod, and a handler that returns a `CallToolResult`.

---

## server.tool() Overloads

The `tool()` method has multiple call signatures:

### Minimal (no arguments)

```typescript
server.tool("ping", async () => ({
  content: [{ type: "text", text: "pong" }],
}));
```

### With description

```typescript
server.tool("ping", "Health check that returns pong", async () => ({
  content: [{ type: "text", text: "pong" }],
}));
```

### With description and input schema

```typescript
import { z } from "zod";

server.tool(
  "greet",
  "Greet a user by name",
  { name: z.string().describe("The user's name") },
  async ({ name }, extra) => ({
    content: [{ type: "text", text: `Hello, ${name}!` }],
  }),
);
```

### With description, input schema, and annotations

```typescript
server.tool(
  "delete-file",
  "Delete a file from the filesystem",
  { path: z.string() },
  { destructiveHint: true, idempotentHint: false },
  async ({ path }) => {
    // ... delete logic
    return { content: [{ type: "text", text: `Deleted ${path}` }] };
  },
);
```

### All overload signatures

| Signature | Parameters |
|-----------|-----------|
| `tool(name, cb)` | Name + handler (no args, no description) |
| `tool(name, description, cb)` | Name + description + handler |
| `tool(name, schema, cb)` | Name + input schema + handler |
| `tool(name, description, schema, cb)` | Name + description + schema + handler |
| `tool(name, schema, annotations, cb)` | Name + schema + annotations + handler |
| `tool(name, description, schema, annotations, cb)` | All fields |

### Handler Extra Parameter

All tool callbacks receive an optional second `extra` parameter of type `RequestHandlerExtra`:

```typescript
server.tool("my-tool", "Description", { input: z.string() }, async (args, extra) => {
  // extra provides server request context
  return { content: [{ type: "text", text: args.input }] };
});
```

The `extra` parameter is available but rarely needed for basic tools. It provides access to the underlying server request context.

---

## Input Schema

The input schema is a Zod raw shape object (NOT a `z.object()`). Each key maps to a Zod type:

```typescript
server.tool(
  "calculate-bmi",
  "Calculate Body Mass Index",
  {
    weightKg: z.number().min(1).describe("Weight in kilograms"),
    heightM: z.number().min(0.1).max(3).describe("Height in meters"),
  },
  async ({ weightKg, heightM }) => {
    const bmi = weightKg / (heightM * heightM);
    return {
      content: [{ type: "text", text: `BMI: ${bmi.toFixed(1)}` }],
    };
  },
);
```

### Supported Zod Types

| Zod Type | JSON Schema | Example |
|----------|-------------|---------|
| `z.string()` | `{ "type": "string" }` | `name: z.string()` |
| `z.number()` | `{ "type": "number" }` | `age: z.number().int()` |
| `z.boolean()` | `{ "type": "boolean" }` | `verbose: z.boolean()` |
| `z.enum()` | `{ "enum": [...] }` | `model: z.enum(["fast", "slow"])` |
| `z.array()` | `{ "type": "array" }` | `tags: z.array(z.string())` |
| `z.optional()` | removes from required | `note: z.string().optional()` |

Always add `.describe()` to parameters -- the description appears in the tool's JSON Schema and helps the LLM understand what to pass.

---

## registerTool() (Config-Based)

An alternative registration method using a config object:

```typescript
server.registerTool(
  "calculate-bmi",
  {
    title: "BMI Calculator",
    description: "Calculate Body Mass Index",
    inputSchema: {
      weightKg: z.number(),
      heightM: z.number(),
    },
    outputSchema: {
      bmi: z.number(),
      category: z.string(),
    },
    annotations: { readOnlyHint: true },
  },
  async ({ weightKg, heightM }) => {
    const bmi = weightKg / (heightM * heightM);
    const category = bmi < 18.5 ? "underweight" : bmi < 25 ? "normal" : "overweight";
    const output = { bmi: Number(bmi.toFixed(1)), category };
    return {
      content: [{ type: "text", text: JSON.stringify(output) }],
      structuredContent: output,
    };
  },
);
```

### registerTool Config Properties

| Property | Type | Required | Description |
|----------|------|----------|-------------|
| `title` | `string` | No | Human-readable display name |
| `description` | `string` | No | What the tool does |
| `inputSchema` | `ZodRawShape` | No | Zod schema for input validation |
| `outputSchema` | `ZodRawShape` | No | Zod schema for structured output validation |
| `annotations` | `ToolAnnotations` | No | Behavioral hints for clients |

---

## Tool Annotations

Annotations provide hints about tool behavior to help clients present tools appropriately:

```typescript
interface ToolAnnotations {
  title?: string;
  readOnlyHint?: boolean;       // Tool only reads data, no side effects
  destructiveHint?: boolean;    // Tool may cause irreversible changes
  idempotentHint?: boolean;     // Repeated calls with same args produce same result
  openWorldHint?: boolean;      // Tool interacts with external systems
}
```

| Annotation | Default | When to use |
|------------|---------|-------------|
| `readOnlyHint` | `false` | Database queries, file reads, API GETs |
| `destructiveHint` | `true` | File deletion, database mutations, sending emails |
| `idempotentHint` | `false` | PUT operations, deterministic computations |
| `openWorldHint` | `true` | External API calls, network operations |

---

## CallToolResult (Return Type)

Every tool handler must return a `CallToolResult`:

```typescript
interface CallToolResult {
  content: Array<TextContent | ImageContent | AudioContent | ResourceLink | EmbeddedResource>;
  isError?: boolean;              // Mark result as an error
  structuredContent?: unknown;    // Structured output matching outputSchema
}
```

### Text Content

```typescript
return {
  content: [{ type: "text", text: "Operation completed successfully" }],
};
```

### Multiple Content Items

```typescript
return {
  content: [
    { type: "text", text: "File processed" },
    { type: "text", text: `Size: ${size} bytes` },
  ],
};
```

### Image Content

```typescript
return {
  content: [{
    type: "image",
    data: base64EncodedData,
    mimeType: "image/png",
  }],
};
```

### Resource Link

```typescript
return {
  content: [{
    type: "resource_link",
    uri: "file:///projects/readme.md",
    name: "README",
    mimeType: "text/markdown",
  }],
};
```

---

## Error Handling

### Tool Execution Errors

Return errors within the tool result using `isError: true`:

```typescript
server.tool(
  "fetch-data",
  "Fetch data from URL",
  { url: z.string().url() },
  async ({ url }) => {
    try {
      const response = await fetch(url);
      if (!response.ok) {
        return {
          content: [{ type: "text", text: `HTTP ${response.status}: ${response.statusText}` }],
          isError: true,
        };
      }
      const data = await response.text();
      return { content: [{ type: "text", text: data }] };
    } catch (error) {
      return {
        content: [{ type: "text", text: `Failed to fetch: ${error instanceof Error ? error.message : String(error)}` }],
        isError: true,
      };
    }
  },
);
```

### Error Types

| Error Type | Mechanism | Use Case |
|------------|-----------|----------|
| Validation error | Automatic (Zod) | Invalid input arguments |
| Tool execution error | `isError: true` in result | API failures, business logic errors |
| Protocol error | Thrown exception | Unknown tool, server error |

The SDK automatically validates inputs against the Zod schema and returns a JSON-RPC error if validation fails.

---

## Structured Output

When using `outputSchema`, return both `content` and `structuredContent`:

```typescript
server.registerTool(
  "get-weather",
  {
    description: "Get weather data",
    inputSchema: { location: z.string() },
    outputSchema: {
      temperature: z.number(),
      conditions: z.string(),
    },
  },
  async ({ location }) => {
    const data = { temperature: 22.5, conditions: "Partly cloudy" };
    return {
      content: [{ type: "text", text: JSON.stringify(data) }],
      structuredContent: data,
    };
  },
);
```

When providing `outputSchema`, the server MUST return `structuredContent` that conforms to the schema.

---

## Extracting Schema for Reuse

For the monorepo pattern, define schemas in separate files:

```typescript
// echo.schema.ts
import { z } from "zod";

export const EchoInputSchema = z.object({
  message: z.string().min(1).max(10000).describe("The message to echo back"),
});

export type EchoInput = z.infer<typeof EchoInputSchema>;
```

```typescript
// echo.capability.ts
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { EchoInputSchema } from "./echo.schema.js";

export function registerEcho(server: McpServer): void {
  server.tool(
    "echo",
    "Echo back the provided message",
    EchoInputSchema.shape,  // Pass .shape, not the z.object itself
    async ({ message }) => ({
      content: [{ type: "text", text: message }],
    }),
  );
}
```

The key pattern: define schema as `z.object({...})`, then pass `schema.shape` to `server.tool()`.

---

## Dynamic Tool Registration

Tools can be added or removed at runtime:

```typescript
// Add a tool after server starts
const registered = server.tool("dynamic-tool", "A dynamic tool", async () => ({
  content: [{ type: "text", text: "Dynamic!" }],
}));

// Remove the tool later
registered.remove();

// Notify clients of the change
server.sendToolListChanged();
```

The `tool()` and `registerTool()` methods return a `RegisteredTool` object with a `remove()` method.

---

**See Also**: [01-server-basics.md](01-server-basics.md), [03-resources.md](03-resources.md)
**Source**: https://modelcontextprotocol.io/specification/2025-06-18/server/tools and https://github.com/modelcontextprotocol/typescript-sdk/blob/v1.x/src/server/mcp.ts
**Version**: 1.29.0
