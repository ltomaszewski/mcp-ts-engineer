# API Reference

**Source:** https://github.com/biomejs/biome/tree/main/packages/@biomejs/js-api

---

## Overview

Biome provides programmatic access via the `@biomejs/js-api` package, which uses WebAssembly bindings to run Biome's Rust core in JavaScript environments. The API supports formatting, linting, and diagnostics.

**Status:** The JS API is currently in alpha and not yet considered stable for production use. For most workflows, prefer the CLI.

---

## Installation

### @biomejs/js-api + WASM Peer Dependency

```bash
npm install @biomejs/js-api @biomejs/wasm-nodejs
```

Three WASM distribution targets are available as peer dependencies:

| Package | Environment | Notes |
|---------|-------------|-------|
| `@biomejs/wasm-nodejs` | Node.js | Uses `fs` API for WASM loading |
| `@biomejs/wasm-bundler` | Bundlers (webpack, Vite) | Direct WASM imports |
| `@biomejs/wasm-web` | Browsers | Uses `fetch` API for WASM loading |

---

## Import Paths

Each environment has a dedicated import path:

```typescript
// Node.js
import { Biome } from "@biomejs/js-api/nodejs";

// Bundler (webpack, Vite)
import { Biome, Distribution } from "@biomejs/js-api/bundler";

// Web / Browser
import { Biome, Distribution } from "@biomejs/js-api/web";
```

---

## Core API Methods

### Project Management

#### openProject

Opens a project directory for processing.

```typescript
const project = biome.openProject("/path/to/project");
// Returns: { projectKey: string }
```

| Parameter | Type | Description |
|-----------|------|-------------|
| `path` | `string` | Absolute path to the project root |

**Returns:** `{ projectKey: string }` -- identifier for subsequent operations.

---

#### applyConfiguration

Applies configuration programmatically instead of reading `biome.json`.

```typescript
biome.applyConfiguration(projectKey, {
  formatter: {
    indentStyle: "space",
    indentWidth: 2,
    lineWidth: 100,
  },
  linter: {
    rules: {
      recommended: true,
    },
  },
});
```

| Parameter | Type | Description |
|-----------|------|-------------|
| `projectKey` | `string` | Project identifier from `openProject` |
| `config` | `object` | Biome configuration (same schema as `biome.json`) |

---

### Formatting

#### formatContent

Formats source code according to Biome rules.

```typescript
const result = biome.formatContent(projectKey, code, {
  filePath: "src/index.ts",
});
console.log(result.content);
```

| Parameter | Type | Description |
|-----------|------|-------------|
| `projectKey` | `string` | Project identifier |
| `content` | `string` | Source code to format |
| `options.filePath` | `string` | Virtual file path (for language detection) |

**Returns:** `{ content: string }` -- the formatted code.

---

### Linting

#### lintContent

Analyzes code and returns diagnostics.

```typescript
const result = biome.lintContent(projectKey, code, {
  filePath: "src/index.ts",
});

for (const diagnostic of result.diagnostics) {
  console.log(diagnostic.message);
}
```

| Parameter | Type | Description |
|-----------|------|-------------|
| `projectKey` | `string` | Project identifier |
| `content` | `string` | Source code to lint |
| `options.filePath` | `string` | Virtual file path (for language/rule detection) |

**Returns:** `{ diagnostics: Diagnostic[] }` -- array of diagnostic objects.

---

### Diagnostics Display

#### printDiagnostics

Converts diagnostic objects into formatted HTML for display.

```typescript
const html = biome.printDiagnostics(result.diagnostics, {
  filePath: "src/index.ts",
  fileSource: code,
});
```

| Parameter | Type | Description |
|-----------|------|-------------|
| `diagnostics` | `Diagnostic[]` | Array from `lintContent` |
| `options.filePath` | `string` | File path for display |
| `options.fileSource` | `string` | Original source for context |

**Returns:** `string` -- HTML-formatted diagnostic output.

---

## Complete Node.js Example

```typescript
import { Biome } from "@biomejs/js-api/nodejs";

async function main(): Promise<void> {
  const biome = new Biome();

  // Open project
  const { projectKey } = biome.openProject(".");

  // Apply configuration
  biome.applyConfiguration(projectKey, {
    formatter: {
      indentStyle: "space",
      indentWidth: 2,
    },
    linter: {
      rules: {
        recommended: true,
        correctness: {
          noUnusedVariables: "error",
        },
      },
    },
  });

  // Format code
  const code = `const  x  =  1;\nconst unused = 2;`;
  const formatted = biome.formatContent(projectKey, code, {
    filePath: "test.ts",
  });
  console.log("Formatted:", formatted.content);

  // Lint code
  const linted = biome.lintContent(projectKey, code, {
    filePath: "test.ts",
  });

  for (const diagnostic of linted.diagnostics) {
    console.log("Issue:", diagnostic.message);
  }
}

main();
```

---

## CLI Integration from Node.js

For production use, prefer invoking the CLI via child processes:

```typescript
import { execSync } from "node:child_process";

// Format files
execSync("npx biome format --write src/", { encoding: "utf-8" });

// Lint with JSON output
const output = execSync("npx biome lint --reporter=json src/", {
  encoding: "utf-8",
});
const diagnostics = JSON.parse(output);

// CI check (read-only, exits non-zero on violations)
execSync("npx biome ci .", { encoding: "utf-8" });
```

---

## Daemon Mode for Performance

For repeated operations, use the daemon for 2-5x speedup:

```bash
npx biome start                    # Start daemon
npx biome check --use-server .     # Use daemon (faster)
npx biome stop                     # Stop daemon
```

The daemon keeps Biome's Rust binary loaded in memory, eliminating startup cost on each invocation. The `--use-server` flag connects to the running daemon instead of spawning a new process.

---

## Architecture Notes

### Parser (CST)

Biome uses a Concrete Syntax Tree that preserves all program information including trivia (spaces, tabs, comments). The parser is resilient -- it recovers from syntax errors and uses "Bogus" nodes to protect consumers from incorrect syntax.

### File Scanner

The scanner performs three functions:
- Discovers nested `biome.json`/`biome.jsonc` configs in monorepos
- Locates `.gitignore` files when `vcs.useIgnoreFile` is enabled
- Indexes `package.json` manifests for domain rule auto-detection

### Daemon

The daemon is a long-running server that Biome spawns in the background. It processes requests from editors (via LSP) and CLI commands (via `--use-server`). Uses a server-client model over a socket.

---

## Language Detection

The `filePath` parameter determines language detection:

| Extension | Language |
|-----------|----------|
| `.js`, `.mjs`, `.cjs` | JavaScript |
| `.jsx` | JSX |
| `.ts`, `.mts`, `.cts` | TypeScript |
| `.tsx` | TSX |
| `.json`, `.jsonc` | JSON |
| `.css` | CSS |
| `.graphql`, `.gql` | GraphQL |
| `.html` | HTML |

---

## When to Use JS API vs CLI

| Use Case | Recommended |
|----------|-------------|
| CI pipelines | CLI (`biome ci`) |
| Pre-commit hooks | CLI (`biome check --staged`) |
| Editor integration | LSP (built-in) |
| Build tool plugins | CLI via child process |
| Custom tooling / analysis | JS API (`@biomejs/js-api`) |
| Batch file processing | CLI with daemon (`--use-server`) |

**Recommendation:** Use the CLI for all standard workflows. Reserve the JS API for custom tooling where you need programmatic control over individual file processing.

---

**Version:** 2.x (^2.4.4) | **Source:** https://biomejs.dev/ , https://github.com/biomejs/biome/tree/main/packages/@biomejs/js-api
