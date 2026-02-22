# Integration Guides

**Source:** https://biomejs.dev/guides/

---

## VS Code Integration

### Installation

1. Install Biome: `npm install --save-dev @biomejs/biome`
2. Install the official VS Code extension: search "Biomejs" in Extensions

### Configuration (.vscode/settings.json)

```json
{
  "editor.defaultFormatter": "biomejs.biome",
  "editor.formatOnSave": true,
  "[javascript]": {
    "editor.defaultFormatter": "biomejs.biome",
    "editor.codeActionsOnSave": {
      "source.fixAll.biome": "explicit",
      "source.organizeImports.biome": "explicit"
    }
  },
  "[typescript]": {
    "editor.defaultFormatter": "biomejs.biome",
    "editor.codeActionsOnSave": {
      "source.fixAll.biome": "explicit",
      "source.organizeImports.biome": "explicit"
    }
  },
  "[json]": {
    "editor.defaultFormatter": "biomejs.biome",
    "editor.formatOnSave": true
  },
  "[css]": {
    "editor.defaultFormatter": "biomejs.biome"
  }
}
```

### Features

- Real-time diagnostics as you type
- Format on save
- Code actions via lightbulb menu
- Hover information on diagnostics
- Organize imports on save

---

## WebStorm / IntelliJ

1. Install Biome: `npm install --save-dev @biomejs/biome`
2. Settings -> Languages & Frameworks -> JavaScript -> Code Quality Tools -> Biome
3. Enable Biome, set path to `./node_modules/.bin/biome`

---

## Vim/Neovim (conform.nvim)

```lua
require("conform").setup({
  formatters_by_ft = {
    javascript = { "biome" },
    typescript = { "biome" },
    json = { "biome" },
    css = { "biome" },
  },
  formatters = {
    biome = {
      command = "biome",
      args = { "format", "--stdin-file-path", "$FILENAME" },
    },
  },
})
```

---

## GitHub Actions

```yaml
name: Biome

on:
  push:
    branches: [main]
  pull_request:

jobs:
  biome:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 22
      - run: npm ci
      - run: npx biome ci --reporter=github .
```

The `--reporter=github` flag enables inline annotations on PR diffs.

---

## GitLab CI

```yaml
biome:
  stage: lint
  image: node:22
  script:
    - npm ci
    - npx biome ci --reporter=gitlab .
```

---

## Pre-commit Hook (Manual)

```bash
#!/bin/bash
# .git/hooks/pre-commit
npx biome check --staged
if [ $? -ne 0 ]; then
  echo "Biome checks failed"
  exit 1
fi
```

```bash
chmod +x .git/hooks/pre-commit
```

---

## Pre-commit Hook (Husky)

```bash
npm install --save-dev husky
npx husky install
npx husky add .husky/pre-commit "npx biome check --staged"
```

---

## Pre-commit Hook (lint-staged)

```json
{
  "lint-staged": {
    "*.{js,ts,tsx,json,css}": ["biome check --write --no-errors-on-unmatched"]
  }
}
```

---

## Docker

```dockerfile
FROM node:22-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npx biome ci
CMD ["npm", "start"]
```

---

## Daemon Mode

For faster repeated operations in development:

```bash
npx biome start                    # Start daemon
npx biome check --use-server .     # Use daemon (2-5x faster)
npx biome stop                     # Stop daemon
```

---

## Package.json Scripts

```json
{
  "scripts": {
    "lint": "biome check .",
    "lint:fix": "biome check --write .",
    "format": "biome format --write .",
    "check:ci": "biome ci ."
  }
}
```

---

**Version:** 2.x (^2.4.4) | **Source:** https://biomejs.dev/guides/
