# Custom Tools

Create and register custom tools for Claude agents.

---

## Tool Anatomy

A tool consists of:
1. **Name** - Unique identifier
2. **Description** - What the tool does (helps Claude decide when to use it)
3. **Input Schema** - Zod schema (TS) or type hints (Python) defining parameters
4. **Handler** - Async function that executes the tool

---

## TypeScript: `tool()` Function

```typescript
import { tool } from "@anthropic-ai/claude-agent-sdk";
import { z } from "zod";

const myTool = tool({
  name: "tool_name",
  description: "Clear description of what this tool does",
  inputSchema: z.object({
    param1: z.string().describe("Description of param1"),
    param2: z.number().optional().describe("Optional numeric param")
  }),
  handler: async ({ param1, param2 }) => {
    // Tool implementation
    return { result: "..." };
  }
});
```

---

## Python: `@tool` Decorator

```python
from claude_agent_sdk import tool

@tool
def my_tool(param1: str, param2: int = 10) -> dict:
    """Clear description of what this tool does.

    Args:
        param1: Description of param1
        param2: Optional numeric param (default: 10)

    Returns:
        Result dictionary
    """
    return {"result": "..."}
```

---

## Complete Examples

### Weather Tool (TypeScript)

```typescript
import { query, tool } from "@anthropic-ai/claude-agent-sdk";
import { z } from "zod";

const getWeather = tool({
  name: "get_weather",
  description: "Get current weather conditions for a city",
  inputSchema: z.object({
    city: z.string().describe("City name, e.g., 'Tokyo'"),
    units: z.enum(["celsius", "fahrenheit"]).default("celsius")
      .describe("Temperature units")
  }),
  handler: async ({ city, units }) => {
    // In real implementation, call weather API
    const temp = units === "celsius" ? 22 : 72;
    return {
      city,
      temperature: temp,
      units,
      condition: "sunny",
      humidity: 65
    };
  }
});

// Use the tool
for await (const msg of query({
  prompt: "What's the weather in Tokyo?",
  options: { tools: [getWeather] }
})) {
  // Handle messages
}
```

### Database Query Tool (TypeScript)

```typescript
import { tool } from "@anthropic-ai/claude-agent-sdk";
import { z } from "zod";

const queryDatabase = tool({
  name: "query_database",
  description: "Execute a read-only SQL query against the database",
  inputSchema: z.object({
    query: z.string().describe("SQL SELECT query to execute"),
    limit: z.number().max(100).default(10).describe("Max rows to return")
  }),
  handler: async ({ query, limit }) => {
    // Validate query is SELECT only
    if (!query.trim().toLowerCase().startsWith("select")) {
      throw new Error("Only SELECT queries are allowed");
    }

    // Execute query (pseudocode)
    const results = await db.query(`${query} LIMIT ${limit}`);
    return {
      rows: results,
      count: results.length
    };
  }
});
```

### File Operations Tool (Python)

```python
from claude_agent_sdk import tool
import json
from pathlib import Path

@tool
def read_json_file(file_path: str) -> dict:
    """Read and parse a JSON file.

    Args:
        file_path: Path to the JSON file

    Returns:
        Parsed JSON content as dictionary

    Raises:
        FileNotFoundError: If file doesn't exist
        json.JSONDecodeError: If file is not valid JSON
    """
    path = Path(file_path)
    if not path.exists():
        raise FileNotFoundError(f"File not found: {file_path}")

    with open(path) as f:
        return json.load(f)


@tool
def write_json_file(file_path: str, data: dict, indent: int = 2) -> dict:
    """Write data to a JSON file.

    Args:
        file_path: Path to write the file
        data: Dictionary to serialize as JSON
        indent: JSON indentation (default: 2)

    Returns:
        Success status and file path
    """
    path = Path(file_path)
    path.parent.mkdir(parents=True, exist_ok=True)

    with open(path, "w") as f:
        json.dump(data, f, indent=indent)

    return {"success": True, "path": str(path)}
```

---

## Input Schema Best Practices

### Use Descriptive Field Descriptions

```typescript
// Good - Claude understands the parameter
z.string().describe("Full file path including extension, e.g., '/src/index.ts'")

// Bad - No context for Claude
z.string()
```

### Set Sensible Defaults

```typescript
z.object({
  limit: z.number().default(10).describe("Max results"),
  format: z.enum(["json", "csv"]).default("json").describe("Output format")
})
```

### Use Enums for Fixed Options

```typescript
z.object({
  severity: z.enum(["low", "medium", "high", "critical"])
    .describe("Issue severity level"),
  status: z.enum(["open", "in_progress", "resolved", "closed"])
    .describe("Current status")
})
```

### Nested Objects

```typescript
z.object({
  user: z.object({
    name: z.string(),
    email: z.string().email()
  }).describe("User information"),
  options: z.object({
    notify: z.boolean().default(true),
    priority: z.number().min(1).max(5).default(3)
  }).optional().describe("Optional settings")
})
```

---

## Error Handling in Tools

### Throw Descriptive Errors

```typescript
const myTool = tool({
  name: "my_tool",
  inputSchema: z.object({ id: z.string() }),
  handler: async ({ id }) => {
    const item = await db.find(id);

    if (!item) {
      throw new Error(`Item with ID '${id}' not found`);
    }

    if (!item.isAccessible) {
      throw new Error(`Access denied to item '${id}'`);
    }

    return item;
  }
});
```

### Return Error Objects (Alternative)

```typescript
handler: async ({ id }) => {
  try {
    const result = await riskyOperation(id);
    return { success: true, data: result };
  } catch (error) {
    return {
      success: false,
      error: error.message,
      code: error.code
    };
  }
}
```

---

## Async Tools

Tools can perform async operations:

```typescript
const fetchData = tool({
  name: "fetch_data",
  description: "Fetch data from an API endpoint",
  inputSchema: z.object({
    url: z.string().url(),
    method: z.enum(["GET", "POST"]).default("GET")
  }),
  handler: async ({ url, method }) => {
    const response = await fetch(url, { method });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    return await response.json();
  }
});
```

---

## Registering Multiple Tools

```typescript
import { query, tool } from "@anthropic-ai/claude-agent-sdk";

const tools = [
  tool({
    name: "tool_a",
    description: "First tool",
    inputSchema: z.object({ input: z.string() }),
    handler: async ({ input }) => ({ result: input.toUpperCase() })
  }),
  tool({
    name: "tool_b",
    description: "Second tool",
    inputSchema: z.object({ value: z.number() }),
    handler: async ({ value }) => ({ doubled: value * 2 })
  }),
  tool({
    name: "tool_c",
    description: "Third tool",
    inputSchema: z.object({ items: z.array(z.string()) }),
    handler: async ({ items }) => ({ count: items.length })
  })
];

for await (const msg of query({
  prompt: "Use the tools to process data",
  options: { tools }
})) {
  // Handle messages
}
```

---

## Tool Visibility

Control which tools Claude can use:

```typescript
// Only allow specific tools
options: {
  tools: [toolA, toolB, toolC],
  allowedTools: ["tool_a", "tool_b"]  // tool_c not available
}

// Block specific tools
options: {
  tools: [toolA, toolB, toolC],
  disallowedTools: ["tool_c"]  // Only tool_a and tool_b available
}
```

---

## MCP vs SDK Tools

| Feature | SDK Tools (`tool()`) | MCP Tools |
|---------|---------------------|-----------|
| Definition | In-process | Separate process |
| Communication | Direct function call | JSON-RPC |
| State | Shared with agent | Isolated |
| Best for | Simple, stateless tools | Complex, stateful services |
| Setup | Import and use | Server configuration |

### When to Use SDK Tools

- Simple transformations
- Stateless operations
- In-memory computations
- Quick integrations

### When to Use MCP

- Database connections
- Long-running services
- Complex state management
- Shared across multiple agents

---

## Testing Tools

```typescript
import { describe, it, expect } from "vitest";

describe("getWeather tool", () => {
  it("returns weather data for valid city", async () => {
    const result = await getWeather.handler({
      city: "Tokyo",
      units: "celsius"
    });

    expect(result).toEqual({
      city: "Tokyo",
      temperature: expect.any(Number),
      units: "celsius",
      condition: expect.any(String),
      humidity: expect.any(Number)
    });
  });

  it("throws for invalid city", async () => {
    await expect(
      getWeather.handler({ city: "", units: "celsius" })
    ).rejects.toThrow("City name required");
  });
});
```

---

**Version:** 0.2.92 | **Source:** https://github.com/anthropics/claude-agent-sdk-typescript
