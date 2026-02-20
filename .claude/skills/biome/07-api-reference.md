# API Reference

**Source:** [https://biomejs.dev](https://biomejs.dev)

---

## Overview

Biome provides programmatic access via `@biomejs/wasm` and `@biomejs/js` packages for JavaScript/TypeScript environments.

---

## Installation

### @biomejs/wasm (WebAssembly)

```bash
npm install --save-dev @biomejs/wasm
```

**Return:** WASM-based Biome for universal JavaScript environments

---

### @biomejs/js (JavaScript Binding)

```bash
npm install --save-dev @biomejs/js
```

**Return:** JavaScript binding for native Biome binary

---

## Basic Usage

### Formatting Code

```javascript
import { format } from "@biomejs/wasm";

const code = `const  x  =  1`;
const formatted = format(code, {
  filepath: "test.js"
});

console.log(formatted);
// Output: const x = 1;
```

**Parameters:**
- `code` (string): Source code to format
- `options` (object): Configuration options
  - `filepath` (string): Virtual file path for language detection

**Return:** Formatted code string

---

### Linting Code

```javascript
import { lint } from "@biomejs/wasm";

const code = `const unused = 1;`;
const diagnostics = lint(code, {
  filepath: "test.js"
});

console.log(diagnostics);
// Output: Array of diagnostic objects
```

**Parameters:**
- `code` (string): Source code to lint
- `options` (object): Configuration options
  - `filepath` (string): File path for language detection

**Return:** Array of diagnostic objects

---

### Parsing Code

```javascript
import { parse } from "@biomejs/wasm";

const code = `function hello() { return 42; }`;
const ast = parse(code, {
  filepath: "test.js"
});

console.log(JSON.stringify(ast, null, 2));
// Output: Abstract Syntax Tree
```

**Parameters:**
- `code` (string): Source code
- `options` (object): Configuration
  - `filepath` (string): File path

**Return:** AST object

---

## Configuration

### Format Options

```javascript
import { format } from "@biomejs/wasm";

const code = `const x=1`;
const options = {
  filepath: "test.js",
  indentStyle: "space",
  indentWidth: 4,
  lineWidth: 120,
  quoteStyle: "single",
  semicolons: "asNeeded"
};

const formatted = format(code, options);
```

---

### Lint Options

```javascript
import { lint } from "@biomejs/wasm";

const code = `const unused = 1;`;
const options = {
  filepath: "test.js",
  rules: {
    correctness: {
      noUnusedVariables: "error"
    }
  }
};

const diagnostics = lint(code, options);
```

---

## Advanced Usage

### TypeScript/JSX Parsing

```javascript
import { parse } from "@biomejs/wasm";

// Automatic language detection via filepath
const jsCode = parse("const x: string = 'hello';", {
  filepath: "test.ts"  // Detected as TypeScript
});

const jsxCode = parse("<Component prop='value' />", {
  filepath: "component.jsx"  // Detected as JSX
});
```

---

### Multi-Language Formatting

```javascript
import { format } from "@biomejs/wasm";

const formats = [
  { filepath: "index.js", code: "const x=1" },
  { filepath: "style.css", code: "body{color:red}" },
  { filepath: "data.json", code: '{"key":"value"}' }
];

formats.forEach(({ filepath, code }) => {
  const formatted = format(code, { filepath });
  console.log(`${filepath}:`, formatted);
});
```

---

## CLI Integration from Node.js

Use Node.js child processes to invoke Biome CLI:

```javascript
import { execSync } from "child_process";

// Format files
const result = execSync("npx biome format --write src/", {
  encoding: "utf-8"
});

// Check with JSON output
const diagnostics = JSON.parse(
  execSync("npx biome lint --reporter=json src/", {
    encoding: "utf-8"
  })
);

console.log(diagnostics);
```

---

## Error Handling

```javascript
import { format } from "@biomejs/wasm";

try {
  const code = "const x = {";  // Syntax error
  const result = format(code, { filepath: "test.js" });
} catch (error) {
  console.error("Format error:", error.message);
}
```

---

## Build Tool Integration

### Webpack Plugin

```javascript
class BiomePlugin {
  apply(compiler) {
    compiler.hooks.compilation.tap("BiomePlugin", (compilation) => {
      compilation.hooks.processAssets.tap(
        { name: "BiomePlugin" },
        (assets) => {
          for (const [filename, source] of Object.entries(assets)) {
            if (filename.endsWith(".js")) {
              const { lint } = require("@biomejs/wasm");
              const diagnostics = lint(source.source(), {
                filepath: filename
              });
              
              if (diagnostics.some(d => d.severity === "error")) {
                compilation.errors.push(
                  new Error(`${filename} has lint errors`)
                );
              }
            }
          }
        }
      );
    });
  }
}

module.exports = BiomePlugin;
```

---

## Performance Considerations

### Memory Usage

WASM module consumes ~50-80MB depending on rules enabled.

```javascript
import { lint } from "@biomejs/wasm";

// Memory-efficient for single file
const diag1 = lint(smallCode, { filepath: "test.js" });
```

---

### Batch Processing

For processing multiple files, use daemon mode:

```bash
npx biome start

# Then use child_process with daemon
node process-files.js
```

**Speed Improvement:** 5-10x faster for repeated operations

---

**Document Version:** 2.3.10  
**Last Updated:** December 2024