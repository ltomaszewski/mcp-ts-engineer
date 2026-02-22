# Formatter Configuration

**Source:** https://biomejs.dev/formatter/

---

## Global Formatter Options

All options under the `formatter` key apply to all languages.

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `enabled` | boolean | `true` | Enable/disable formatter |
| `indentStyle` | `"tab"` \| `"space"` | `"tab"` | Indentation character |
| `indentWidth` | number (1-10) | `2` | Spaces per indent level |
| `lineWidth` | number (1-320) | `80` | Max line length before wrapping |
| `lineEnding` | `"lf"` \| `"crlf"` \| `"cr"` | `"lf"` | Line ending style |
| `bracketSpacing` | boolean | `true` | Spaces inside `{ }` |
| `attributePosition` | `"auto"` \| `"multiline"` | `"auto"` | HTML/JSX attribute position |
| `expand` | `"auto"` \| `"always"` \| `"never"` | `"auto"` | When to expand object/array on multiple lines |
| `formatWithErrors` | boolean | `false` | Format files with syntax errors |
| `trailingNewline` | boolean | `true` | Ensure trailing newline |
| `useEditorconfig` | boolean | `false` | Read settings from .editorconfig |
| `includes` | string[] | - | Glob patterns to format |

```json
{
  "formatter": {
    "enabled": true,
    "indentStyle": "space",
    "indentWidth": 2,
    "lineWidth": 100,
    "lineEnding": "lf",
    "bracketSpacing": true
  }
}
```

---

## JavaScript/TypeScript Formatter Options

All options under `javascript.formatter`:

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `enabled` | boolean | `true` | Enable JS/TS formatter |
| `quoteStyle` | `"double"` \| `"single"` | `"double"` | String quote style |
| `jsxQuoteStyle` | `"double"` \| `"single"` | `"double"` | JSX attribute quote style |
| `quoteProperties` | `"asNeeded"` \| `"preserve"` | `"asNeeded"` | Object property quotes |
| `trailingCommas` | `"all"` \| `"es5"` \| `"none"` | `"all"` | Trailing comma behavior |
| `semicolons` | `"always"` \| `"asNeeded"` | `"always"` | Semicolon insertion |
| `arrowParentheses` | `"always"` \| `"asNeeded"` | `"always"` | Arrow function parens |
| `bracketSameLine` | boolean | `false` | Closing bracket on same line |
| `bracketSpacing` | boolean | `true` | Spaces inside `{ }` |
| `operatorLinebreak` | `"after"` \| `"before"` | `"after"` | Operator line break position |
| `attributePosition` | `"auto"` \| `"multiline"` | `"auto"` | JSX attribute position |
| `expand` | `"auto"` \| `"always"` \| `"never"` | `"auto"` | Object/array expansion |
| `indentStyle` | `"tab"` \| `"space"` | (inherits global) | Override indent style |
| `indentWidth` | number | (inherits global) | Override indent width |
| `lineWidth` | number | (inherits global) | Override line width |
| `lineEnding` | string | (inherits global) | Override line ending |

```json
{
  "javascript": {
    "formatter": {
      "quoteStyle": "single",
      "trailingCommas": "all",
      "semicolons": "always",
      "arrowParentheses": "always",
      "bracketSameLine": false,
      "bracketSpacing": true
    }
  }
}
```

---

## JSON Formatter Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `enabled` | boolean | `true` | Enable JSON formatter |
| `trailingCommas` | `"none"` \| `"all"` | `"none"` | Trailing commas in JSON |
| `bracketSpacing` | boolean | `true` | Spaces inside `{ }` |
| `expand` | `"auto"` \| `"always"` \| `"never"` | `"auto"` | Expansion mode |

```json
{
  "json": {
    "parser": {
      "allowComments": true,
      "allowTrailingCommas": true
    },
    "formatter": {
      "enabled": true,
      "trailingCommas": "none"
    }
  }
}
```

---

## CSS Formatter Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `enabled` | boolean | `false` | Enable CSS formatter |
| `quoteStyle` | `"double"` \| `"single"` | `"double"` | CSS string quote style |

```json
{
  "css": {
    "formatter": {
      "enabled": true,
      "quoteStyle": "double"
    }
  }
}
```

---

## GraphQL Formatter Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `enabled` | boolean | `false` | Enable GraphQL formatter |
| `quoteStyle` | `"double"` \| `"single"` | `"double"` | String quote style |

```json
{
  "graphql": {
    "formatter": {
      "enabled": true,
      "quoteStyle": "double"
    }
  }
}
```

---

## HTML Formatter Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `enabled` | boolean | `false` | Enable HTML formatter |
| `attributePosition` | `"auto"` \| `"multiline"` | `"auto"` | Attribute position |
| `bracketSameLine` | boolean | `false` | Closing bracket on same line |
| `whitespaceSensitivity` | `"css"` \| `"strict"` \| `"ignore"` | `"css"` | Whitespace handling |
| `indentScriptAndStyle` | boolean | `false` | Indent script/style tags |
| `selfCloseVoidElements` | `"never"` \| `"always"` | `"never"` | Self-close void elements |

```json
{
  "html": {
    "formatter": {
      "enabled": true,
      "attributePosition": "auto"
    }
  }
}
```

---

## Overrides Strategy

Apply different formatting settings to specific file patterns.

**v2 Change:** Globs are relative to the config file location.

```json
{
  "formatter": {
    "indentStyle": "space",
    "indentWidth": 2
  },
  "overrides": [
    {
      "includes": ["generated/**/*.ts"],
      "formatter": {
        "indentWidth": 4
      }
    },
    {
      "includes": ["**/*.json"],
      "json": {
        "formatter": {
          "expand": "always"
        }
      }
    }
  ]
}
```

---

## Complete Example

```json
{
  "$schema": "https://biomejs.dev/schemas/2.0.0/schema.json",
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
  },
  "json": {
    "formatter": { "enabled": true }
  },
  "css": {
    "formatter": { "enabled": true }
  }
}
```

---

**Version:** 2.x (^2.4.4) | **Source:** https://biomejs.dev/formatter/
