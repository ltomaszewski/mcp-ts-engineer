# Formatter Configuration

**Source:** [https://biomejs.dev/formatter/](https://biomejs.dev/formatter/)

---

## Core Formatter Settings

### Overview
The Biome formatter handles **all formatting decisions** for your code. Unlike other linters, Biome does not provide rules for code formatting—only the formatter manages style choices.

**Key Principle:** Formatter outputs are deterministic and conflict-free with linting rules.

---

## Formatter Configuration Options

### formatter.enabled
**Type:** `boolean`  
**Default:** `true`

Enable or disable the Biome formatter.

```json
{
  "formatter": {
    "enabled": false
  }
}
```

**Return:** When disabled, `biome format` and `biome check` skip formatting

---

### formatter.indentStyle
**Type:** `"tab"` | `"space"`  
**Default:** `"tab"`

Choose between tab or space indentation.

```json
{
  "formatter": {
    "indentStyle": "space"
  }
}
```

**Code Example:**
```javascript
// indentStyle: "tab"
function hello() {
→	console.log("indented with tab");
}

// indentStyle: "space"
function hello() {
  console.log("indented with 2 spaces");
}
```

---

### formatter.indentWidth
**Type:** `number`  
**Default:** `2`

Number of spaces/characters per indentation level.

```json
{
  "formatter": {
    "indentStyle": "space",
    "indentWidth": 4
  }
}
```

**Valid Range:** 1-10

---

### formatter.lineWidth
**Type:** `number`  
**Default:** `80`

The maximum line length before Biome wraps code.

```json
{
  "formatter": {
    "lineWidth": 100
  }
}
```

**Valid Range:** 1-320

---

### formatter.lineEnding
**Type:** `"lf"` | `"crlf"` | `"cr"` | `"auto"`  
**Default:** `"auto"`

Control line ending style.

```json
{
  "formatter": {
    "lineEnding": "lf"
  }
}
```

---

### formatter.bracketSpacing
**Type:** `boolean`  
**Default:** `true`

Whether to insert spaces inside object literal brackets.

```json
{
  "formatter": {
    "bracketSpacing": true
  }
}
```

**Code Example:**
```javascript
// bracketSpacing: true
const obj = { a: 1, b: 2 };

// bracketSpacing: false
const obj = {a: 1, b: 2};
```

---

## JavaScript/TypeScript Formatter Options

### javascript.formatter.quoteStyle
**Type:** `"double"` | `"single"`  
**Default:** `"double"`

Quote style for string literals.

```json
{
  "javascript": {
    "formatter": {
      "quoteStyle": "single"
    }
  }
}
```

---

### javascript.formatter.trailingCommas
**Type:** `"all"` | `"es5"` | `"none"`  
**Default:** `"all"`

When to add trailing commas.

```json
{
  "javascript": {
    "formatter": {
      "trailingCommas": "es5"
    }
  }
}
```

---

### javascript.formatter.semicolons
**Type:** `"always"` | `"asNeeded"`  
**Default:** `"always"`

When to add semicolons.

```json
{
  "javascript": {
    "formatter": {
      "semicolons": "asNeeded"
    }
  }
}
```

---

### javascript.formatter.arrowParentheses
**Type:** `"always"` | `"asNeeded"`  
**Default:** `"always"`

Whether to add parentheses around single arrow function parameters.

```json
{
  "javascript": {
    "formatter": {
      "arrowParentheses": "asNeeded"
    }
  }
}
```

---

### javascript.formatter.bracketSameLine
**Type:** `boolean`  
**Default:** `false`

Put closing bracket on same line for multiline JSX/HTML.

```json
{
  "javascript": {
    "formatter": {
      "bracketSameLine": false
    }
  }
}
```

---

## Overrides Strategy

Apply different formatting settings to specific file patterns:

```json
{
  "formatter": {
    "indentStyle": "space",
    "indentWidth": 2
  },
  "overrides": [
    {
      "include": ["generated/**/*.ts"],
      "formatter": {
        "indentWidth": 4
      }
    }
  ]
}
```

---

## Complete Example Configuration

```json
{
  "$schema": "https://biomejs.dev/schemas/1.9.3/schema.json",
  "formatter": {
    "enabled": true,
    "indentStyle": "space",
    "indentWidth": 2,
    "lineWidth": 100,
    "lineEnding": "lf",
    "bracketSpacing": true
  },
  "javascript": {
    "formatter": {
      "quoteStyle": "double",
      "trailingCommas": "all",
      "semicolons": "always",
      "arrowParentheses": "always",
      "bracketSameLine": false
    }
  }
}
```

---

**Document Version:** 2.3.10  
**Last Updated:** December 2024