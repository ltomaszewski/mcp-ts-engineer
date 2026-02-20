# Integration Guides

**Source:** [https://biomejs.dev/guides/](https://biomejs.dev/guides/)

---

## Editor Integration Overview

Biome provides first-class support for popular editors via LSP (Language Server Protocol).

---

## VS Code Integration

### Installation

1. **Install Biome:**
```bash
npm install --save-dev @biomejs/biome
```

2. **Install the official extension:**
   - Open VS Code Extensions
   - Search "Biomejs"
   - Install "Biome" by Biomejs
   - [Marketplace Link](https://marketplace.visualstudio.com/items?itemName=biomejs.biome)

---

### Configuration

#### settings.json

Configure in `.vscode/settings.json`:

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
      "source.fixAll.biome": "explicit"
    }
  },
  "[json]": {
    "editor.defaultFormatter": "biomejs.biome",
    "editor.formatOnSave": true
  }
}
```

---

### Features

- **Real-time diagnostics** - Linting errors/warnings as you type
- **Format on save** - Auto-format with `editor.formatOnSave`
- **Code actions** - Quick fixes via lightbulb menu
- **Hover information** - Details on diagnostics

---

## WebStorm / IntelliJ Integration

### Installation

1. **Install Biome:**
```bash
npm install --save-dev @biomejs/biome
```

2. **Configure in WebStorm:**
   - Go to Settings → Languages & Frameworks → JavaScript → Code Quality Tools → Biome
   - Enable Biome
   - Set Biome path to `./node_modules/.bin/biome`

---

## Vim/Neovim Integration

### Installation via conform.nvim

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

## Sublime Text Integration

Install LSP package:

1. **Install LSP client:**
   - Package Control → Install Package → LSP

2. **Configure LSP:**
```json
{
  "clients": {
    "biome": {
      "enabled": true,
      "command": ["biome", "lsp-proxy"],
      "languages": [
        {
          "languageId": "javascript",
          "scopes": ["source.js"],
          "syntaxes": ["Packages/Babel/JavaScript.sublime-syntax"]
        }
      ]
    }
  }
}
```

---

## Continuous Integration

### GitHub Actions

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
          node-version: 18
      - run: npm ci
      - run: npx biome ci
```

---

### GitLab CI

```yaml
biome:
  stage: lint
  image: node:18
  script:
    - npm ci
    - npx biome ci
```

---

### Pre-commit Hook

Create `.git/hooks/pre-commit`:

```bash
#!/bin/bash
npx biome check --staged
if [ $? -ne 0 ]; then
  echo "❌ Biome checks failed"
  exit 1
fi
```

Enable:
```bash
chmod +x .git/hooks/pre-commit
```

---

### Husky Setup

```bash
npm install --save-dev husky
npx husky install
npx husky add .husky/pre-commit "npx biome check --staged"
```

---

## Watch Mode Setup

### Using nodemon

```json
{
  "nodemon": {
    "watch": ["src"],
    "ext": "js,ts",
    "exec": "npx biome check --write"
  }
}
```

---

## Docker Integration

### Dockerfile

```dockerfile
FROM node:18-alpine

WORKDIR /app
COPY package*.json ./
RUN npm ci

COPY . .

RUN npx biome ci

CMD ["npm", "start"]
```

---

## Performance Optimization

### Enable Daemon Mode

```bash
# Terminal 1: Start daemon
npx biome start

# Terminal 2-N: Use daemon
npx biome check --use-server .

# Cleanup
npx biome stop
```

**Performance Gain:** 2-5x faster for repeated operations

---

## Best Practices

1. **Use official extension** - For best experience, use first-party VS Code extension
2. **Commit configuration** - Check `biome.json` in version control
3. **Document team setup** - Include editor config in README
4. **Use pre-commit hooks** - Prevent bad code from entering repository
5. **Enable daemon mode** - For better performance on repeated operations

---

**Document Version:** 2.3.10  
**Last Updated:** December 2024