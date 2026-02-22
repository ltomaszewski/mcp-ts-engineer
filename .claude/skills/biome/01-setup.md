# Setup & Installation

**Source:** https://biomejs.dev/guides/getting-started/

---

## Installation Methods

### NPM (Recommended)

```bash
npm install --save-dev @biomejs/biome

# Yarn
yarn add --dev @biomejs/biome

# pnpm
pnpm add -D @biomejs/biome

# Bun
bun add -D @biomejs/biome
```

### Standalone Executable (No Node.js Required)

Pre-built binaries available from GitHub releases:

```bash
# macOS (Apple Silicon)
curl -L https://github.com/biomejs/biome/releases/latest/download/biome-aarch64-apple-darwin -o biome
chmod +x biome

# macOS (Intel)
curl -L https://github.com/biomejs/biome/releases/latest/download/biome-x86_64-apple-darwin -o biome

# Linux (x86_64)
curl -L https://github.com/biomejs/biome/releases/latest/download/biome-x86_64-unknown-linux-gnu -o biome
```

**Source:** https://github.com/biomejs/biome/releases

### Global Installation

```bash
npm install --global @biomejs/biome
biome --version
```

---

## Project Initialization

### Create Config with Defaults

```bash
npx biome init          # Creates biome.json
npx biome init --jsonc  # Creates biome.jsonc (supports comments)
```

### Verify Installation

```bash
npx biome --version
# Output: CLI v2.x.x
```

### First Check

```bash
npx biome check .
```

---

## Zero-Configuration Defaults

Biome works out-of-the-box without a configuration file:

### Default Formatter Settings

| Option | Default |
|--------|---------|
| `indentStyle` | `"tab"` |
| `indentWidth` | `2` |
| `lineWidth` | `80` |
| `lineEnding` | `"lf"` |
| `bracketSpacing` | `true` |
| `trailingNewline` | `true` |

### Default JavaScript Formatter Settings

| Option | Default |
|--------|---------|
| `quoteStyle` | `"double"` |
| `trailingCommas` | `"all"` |
| `semicolons` | `"always"` |
| `arrowParentheses` | `"always"` |
| `bracketSameLine` | `false` |

### Default Linter Settings

| Setting | Default |
|---------|---------|
| `recommended` | `true` |
| Style rules severity | `warn` (v2 change) |
| Domain auto-detection | From `package.json` dependencies |

---

## Configuration File Resolution

### Auto-Discovery Strategy

1. **Working directory** -- `biome.json` or `biome.jsonc`
2. **Parent directories** -- Walks up until `"root": true` found
3. **Default configuration** -- Built-in defaults if no file found

### v2 Monorepo Pattern

```
monorepo/
  biome.json          <- root: true (shared rules)
  apps/
    web/
      biome.json      <- root: false (inherits parent, adds overrides)
    api/
      biome.json      <- root: false
```

---

## Troubleshooting

### Command not found

```bash
# Use npx prefix
npx biome --version

# Or install globally
npm install --global @biomejs/biome
```

### Configuration not found

```bash
# Specify explicitly
npx biome check --config-path=./biome.json .
```

---

**Version:** 2.x (^2.4.4) | **Source:** https://biomejs.dev/guides/getting-started/
