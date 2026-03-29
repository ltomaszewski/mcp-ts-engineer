# MCP SDK: Resources

**Exposing data to clients via static URIs and dynamic URI templates.**

---

## Overview

Resources expose read-only data (files, configs, database records) to MCP clients. They are **application-driven**: the host application decides how to present and use them. Resources are identified by unique URIs and can return text or binary content.

---

## server.resource() Overloads

### Static Resource (fixed URI)

```typescript
server.resource(
  "app-config",                       // name (unique identifier)
  "config://app",                      // URI
  async (uri) => ({                    // read handler
    contents: [{
      uri: uri.href,
      mimeType: "application/json",
      text: JSON.stringify({ version: "1.0", debug: false }),
    }],
  }),
);
```

### Static Resource with Metadata

```typescript
server.resource(
  "readme",
  "file:///project/README.md",
  {                                    // ResourceMetadata
    title: "Project README",
    description: "Main project documentation",
    mimeType: "text/markdown",
  },
  async (uri) => ({
    contents: [{
      uri: uri.href,
      mimeType: "text/markdown",
      text: "# My Project\nDocumentation here...",
    }],
  }),
);
```

All resource handlers receive an optional `extra` parameter as the last argument (of type `RequestHandlerExtra`), providing server request context.

### All static overload signatures

| Signature | Parameters |
|-----------|-----------|
| `resource(name, uri, cb)` | Name + URI string + handler |
| `resource(name, uri, metadata, cb)` | Name + URI + metadata + handler |

---

## ResourceMetadata

```typescript
interface ResourceMetadata {
  title?: string;            // Human-readable display name
  description?: string;      // What the resource provides
  mimeType?: string;         // MIME type of content
}
```

Common MIME types:

| Type | MIME |
|------|------|
| Plain text | `text/plain` |
| JSON | `application/json` |
| Markdown | `text/markdown` |
| HTML | `text/html` |
| Binary | `application/octet-stream` |
| Directory | `inode/directory` |

---

## Resource Templates (Dynamic URIs)

Resource templates use URI templates (RFC 6570) for parameterized resources:

```typescript
import { ResourceTemplate } from "@modelcontextprotocol/sdk/server/mcp.js";

server.resource(
  "user-profile",
  new ResourceTemplate("user://{userId}/profile", {
    list: async () => ({
      resources: [
        { uri: "user://123/profile", name: "Alice's Profile" },
        { uri: "user://456/profile", name: "Bob's Profile" },
      ],
    }),
  }),
  { mimeType: "application/json", description: "User profile data" },
  async (uri, { userId }) => ({
    contents: [{
      uri: uri.href,
      mimeType: "application/json",
      text: JSON.stringify({ userId, name: `User ${userId}` }),
    }],
  }),
);
```

### ResourceTemplate Constructor

```typescript
new ResourceTemplate(
  uriTemplate: string,          // RFC 6570 URI template
  callbacks: {
    list: ListCallback | undefined,  // Return available resources
    complete?: {                     // Auto-completion for variables
      [variable: string]: CompleteCallback
    }
  }
)
```

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `uriTemplate` | `string` | Yes | URI with `{variable}` placeholders |
| `callbacks.list` | `function \| undefined` | Yes | Returns array of available resources, or `undefined` for no listing |
| `callbacks.complete` | `object` | No | Autocompletion callbacks per variable |

### URI Template Examples

| Template | Match | Variables |
|----------|-------|-----------|
| `file:///{path}` | `file:///src/index.ts` | `{ path: "src/index.ts" }` |
| `user://{userId}/profile` | `user://123/profile` | `{ userId: "123" }` |
| `db://{collection}/{id}` | `db://users/abc` | `{ collection: "users", id: "abc" }` |

---

## Autocompletion

Add autocompletion for template variables:

```typescript
server.resource(
  "project-file",
  new ResourceTemplate("file:///{path}", {
    list: async () => ({
      resources: [
        { uri: "file:///src/index.ts", name: "index.ts" },
        { uri: "file:///src/server.ts", name: "server.ts" },
      ],
    }),
    complete: {
      path: async (value) => {
        // Return completions based on partial input
        const allPaths = ["src/index.ts", "src/server.ts", "package.json"];
        return allPaths.filter((p) => p.startsWith(value));
      },
    },
  }),
  { mimeType: "text/plain" },
  async (uri, { path }) => ({
    contents: [{
      uri: uri.href,
      text: `Contents of ${path}`,
    }],
  }),
);
```

---

## registerResource() (Config-Based)

An alternative registration using a config object:

```typescript
// Static resource
server.registerResource(
  "config",
  "config://app",
  {
    title: "Application Config",
    description: "Application configuration data",
    mimeType: "text/plain",
  },
  async (uri) => ({
    contents: [{ uri: uri.href, text: "App configuration here" }],
  }),
);

// Template resource
server.registerResource(
  "user-profile",
  new ResourceTemplate("user://{userId}/profile", {
    list: async () => ({
      resources: [
        { uri: "user://123/profile", name: "Alice" },
        { uri: "user://456/profile", name: "Bob" },
      ],
    }),
  }),
  {
    title: "User Profile",
    description: "User profile data",
    mimeType: "application/json",
  },
  async (uri, { userId }) => ({
    contents: [{
      uri: uri.href,
      text: JSON.stringify({ userId, name: "Example User" }),
    }],
  }),
);
```

---

## Read Handler Return Type

The read handler must return `ReadResourceResult`:

```typescript
interface ReadResourceResult {
  contents: Array<TextResourceContents | BlobResourceContents>;
}

// Text content
interface TextResourceContents {
  uri: string;
  mimeType?: string;
  text: string;
}

// Binary content
interface BlobResourceContents {
  uri: string;
  mimeType?: string;
  blob: string;  // base64-encoded binary data
}
```

### Text Content Example

```typescript
async (uri) => ({
  contents: [{
    uri: uri.href,
    mimeType: "application/json",
    text: JSON.stringify({ status: "ok" }),
  }],
})
```

### Binary Content Example

```typescript
import { readFile } from "fs/promises";

async (uri, { path }) => {
  const data = await readFile(path);
  return {
    contents: [{
      uri: uri.href,
      mimeType: "image/png",
      blob: data.toString("base64"),
    }],
  };
}
```

### Multiple Contents

A single read can return multiple content items:

```typescript
async (uri) => ({
  contents: [
    { uri: "file:///a.txt", text: "File A" },
    { uri: "file:///b.txt", text: "File B" },
  ],
})
```

---

## Common URI Schemes

| Scheme | Use | Example |
|--------|-----|---------|
| `file://` | Filesystem-like resources | `file:///project/src/main.ts` |
| `https://` | Web-accessible resources | `https://api.example.com/data` |
| `git://` | Git version control | `git://repo/branch/path` |
| Custom | Application-specific | `config://app`, `db://users/123` |

Custom URI schemes must follow RFC 3986.

---

## Resource Annotations

Resources support optional annotations for client hints:

```typescript
{
  uri: "file:///project/README.md",
  name: "README.md",
  mimeType: "text/markdown",
  annotations: {
    audience: ["user"],           // "user", "assistant", or both
    priority: 0.8,                // 0.0 (optional) to 1.0 (required)
    lastModified: "2025-01-12T15:00:58Z",
  },
}
```

| Annotation | Type | Description |
|------------|------|-------------|
| `audience` | `("user" \| "assistant")[]` | Who the resource is intended for |
| `priority` | `number` (0-1) | Importance: 1 = required, 0 = optional |
| `lastModified` | `string` (ISO 8601) | When the resource was last modified |

---

## Dynamic Resource Management

Resources can be added or removed at runtime:

```typescript
const registered = server.resource("temp", "temp://data", async () => ({
  contents: [{ uri: "temp://data", text: "temporary" }],
}));

// Remove later
registered.remove();

// Notify clients
server.sendResourceListChanged();
```

---

## Error Handling

Return JSON-RPC errors for resource failures:

| Error | Code | When |
|-------|------|------|
| Resource not found | `-32002` | URI doesn't match any resource |
| Internal error | `-32603` | Handler throws an exception |

The SDK handles error propagation automatically when your handler throws.

---

**See Also**: [02-tools.md](02-tools.md), [04-prompts.md](04-prompts.md), [01-server-basics.md](01-server-basics.md)
**Source**: https://modelcontextprotocol.io/specification/2025-06-18/server/resources and https://github.com/modelcontextprotocol/typescript-sdk/blob/v1.x/src/server/mcp.ts
**Version**: 1.28.0
