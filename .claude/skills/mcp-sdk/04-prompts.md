# MCP SDK: Prompts

**Registering reusable prompt templates with argument schemas.**

---

## Overview

Prompts are pre-written templates that help users accomplish specific tasks. They are **user-controlled**: the host application surfaces them (e.g., as slash commands), and the user explicitly selects one. Prompts return structured messages that are sent to the LLM.

---

## server.prompt() Overloads

### Minimal (no arguments)

```typescript
server.prompt(
  "explain-code",
  () => ({
    messages: [{
      role: "user",
      content: { type: "text", text: "Explain this code in detail." },
    }],
  }),
);
```

### With description

```typescript
server.prompt(
  "explain-code",
  "Ask the LLM to explain code",
  () => ({
    messages: [{
      role: "user",
      content: { type: "text", text: "Explain this code in detail." },
    }],
  }),
);
```

### With description and argument schema

```typescript
import { z } from "zod";

server.prompt(
  "review-code",
  "Review code for best practices",
  { code: z.string().describe("The code to review") },
  ({ code }) => ({
    messages: [{
      role: "user",
      content: {
        type: "text",
        text: `Please review this code for best practices:\n\n${code}`,
      },
    }],
  }),
);
```

### All overload signatures

| Signature | Parameters |
|-----------|-----------|
| `prompt(name, cb)` | Name + handler (no args, no description) |
| `prompt(name, description, cb)` | Name + description + handler |
| `prompt(name, argsSchema, cb)` | Name + args schema + handler |
| `prompt(name, description, argsSchema, cb)` | All fields |

---

## Argument Schema

Like tools, prompt arguments use a Zod raw shape:

```typescript
server.prompt(
  "generate-test",
  "Generate unit tests for a function",
  {
    code: z.string().describe("The function to test"),
    framework: z.enum(["vitest", "jest"]).describe("Test framework").optional(),
    coverage: z.boolean().describe("Include coverage assertions").optional(),
  },
  ({ code, framework = "vitest", coverage = false }) => ({
    messages: [{
      role: "user",
      content: {
        type: "text",
        text: [
          `Generate ${framework} unit tests for this function:`,
          "",
          "```typescript",
          code,
          "```",
          "",
          coverage ? "Include assertions for 80% coverage." : "",
        ].join("\n"),
      },
    }],
  }),
);
```

---

## registerPrompt() (Config-Based)

An alternative registration using a config object:

```typescript
server.registerPrompt(
  "review-code",
  {
    title: "Code Review",
    description: "Review code for best practices",
    argsSchema: {
      code: z.string(),
      language: z.enum(["typescript", "python", "rust"]).optional(),
    },
  },
  ({ code, language }) => ({
    messages: [{
      role: "user",
      content: {
        type: "text",
        text: `Review this ${language ?? "code"}:\n\n${code}`,
      },
    }],
  }),
);
```

### registerPrompt Config Properties

| Property | Type | Required | Description |
|----------|------|----------|-------------|
| `title` | `string` | No | Human-readable display name |
| `description` | `string` | No | What the prompt does |
| `argsSchema` | `PromptArgsRawShape` | No | Zod schema for arguments |

---

## GetPromptResult (Return Type)

The prompt handler must return a `GetPromptResult`:

```typescript
interface GetPromptResult {
  description?: string;
  messages: PromptMessage[];
}

interface PromptMessage {
  role: "user" | "assistant";
  content: TextContent | ImageContent | AudioContent | EmbeddedResource;
}
```

---

## Message Content Types

### Text Content

```typescript
{
  role: "user",
  content: { type: "text", text: "Your prompt text here" },
}
```

### Image Content

```typescript
{
  role: "user",
  content: {
    type: "image",
    data: base64EncodedImage,
    mimeType: "image/png",
  },
}
```

### Audio Content

```typescript
{
  role: "user",
  content: {
    type: "audio",
    data: base64EncodedAudio,
    mimeType: "audio/wav",
  },
}
```

### Embedded Resource

```typescript
{
  role: "user",
  content: {
    type: "resource",
    resource: {
      uri: "file:///project/src/main.ts",
      mimeType: "text/typescript",
      text: "const x = 1;",
    },
  },
}
```

---

## Multi-Message Prompts

Prompts can return multiple messages to set up a conversation:

```typescript
server.prompt(
  "code-assistant",
  "Set up a coding assistant context",
  { language: z.string(), task: z.string() },
  ({ language, task }) => ({
    description: `${language} coding assistant for ${task}`,
    messages: [
      {
        role: "user",
        content: {
          type: "text",
          text: `You are an expert ${language} developer. I need help with ${task}.`,
        },
      },
      {
        role: "assistant",
        content: {
          type: "text",
          text: `I'm ready to help with ${task} in ${language}. Please share the relevant code or describe what you need.`,
        },
      },
      {
        role: "user",
        content: {
          type: "text",
          text: "Here's the code I'm working with:",
        },
      },
    ],
  }),
);
```

---

## Prompts with Embedded Resources

Include server resources directly in prompt messages:

```typescript
server.prompt(
  "review-project",
  "Review project structure and code",
  { projectPath: z.string() },
  async ({ projectPath }) => {
    const readme = await readFile(`${projectPath}/README.md`, "utf-8");
    const mainCode = await readFile(`${projectPath}/src/index.ts`, "utf-8");

    return {
      description: "Project review with embedded files",
      messages: [
        {
          role: "user",
          content: {
            type: "resource",
            resource: {
              uri: `file://${projectPath}/README.md`,
              mimeType: "text/markdown",
              text: readme,
            },
          },
        },
        {
          role: "user",
          content: {
            type: "resource",
            resource: {
              uri: `file://${projectPath}/src/index.ts`,
              mimeType: "text/typescript",
              text: mainCode,
            },
          },
        },
        {
          role: "user",
          content: {
            type: "text",
            text: "Please review the project structure and code quality.",
          },
        },
      ],
    };
  },
);
```

---

## Autocompletion for Prompt Arguments

Use the `completable()` wrapper for argument autocompletion:

```typescript
import { completable } from "@modelcontextprotocol/sdk/server/completable.js";

server.registerPrompt(
  "review-code",
  {
    title: "Code Review",
    argsSchema: {
      language: completable(
        z.string().describe("Programming language"),
        (value) =>
          ["typescript", "javascript", "python", "rust", "go"]
            .filter((lang) => lang.startsWith(value)),
      ),
    },
  },
  ({ language }) => ({
    messages: [{
      role: "user",
      content: { type: "text", text: `Review this ${language} code:` },
    }],
  }),
);
```

The `completable()` function wraps a Zod schema with an autocompletion callback that the client can call to get suggestions.

---

## Dynamic Prompt Management

```typescript
const registered = server.prompt("temp-prompt", () => ({
  messages: [{ role: "user", content: { type: "text", text: "Temporary" } }],
}));

// Remove later
registered.remove();

// Notify clients
server.sendPromptListChanged();
```

---

## Error Handling

| Error | JSON-RPC Code | When |
|-------|---------------|------|
| Invalid prompt name | `-32602` | Name doesn't match any registered prompt |
| Missing required args | `-32602` | Required arguments not provided |
| Internal error | `-32603` | Handler throws an exception |

---

**See Also**: [02-tools.md](02-tools.md), [03-resources.md](03-resources.md), [01-server-basics.md](01-server-basics.md)
**Source**: https://modelcontextprotocol.io/specification/2025-06-18/server/prompts and https://github.com/modelcontextprotocol/typescript-sdk/blob/v1.x/src/server/mcp.ts
**Version**: 1.x
