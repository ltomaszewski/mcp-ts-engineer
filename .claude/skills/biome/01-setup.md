# Setup & Installation

**Source:** [https://biomejs.dev/guides/getting-started/](https://biomejs.dev/guides/getting-started/)

---

## Installation Methods

### 1. NPM (Recommended for Projects)

Install Biome as a development dependency:

```bash
npm install --save-dev @biomejs/biome
```

**Parameters:**
- `--save-dev` (or `-D`): Adds package to `devDependencies`

**Equivalent for other package managers:**

```bash
# Yarn
yarn add --dev @biomejs/biome

# pnpm
pnpm add -D @biomejs/biome

# Bun
bun add -D @biomejs/biome
```

**Source URL:** [https://www.npmjs.com/package/@biomejs/biome](https://www.npmjs.com/package/@biomejs/biome)

---

### 2. Standalone Executable (No Node.js Required)

Download pre-built binaries for your platform:

```bash
# macOS (Apple Silicon)
curl -L https://github.com/biomejs/biome/releases/download/cli%2Fv2.3.10/biome-aarch64-apple-darwin -o biome
chmod +x biome
./biome --version

# macOS (Intel)
curl -L https://github.com/biomejs/biome/releases/download/cli%2Fv2.3.10/biome-x86_64-apple-darwin -o biome

# Linux (x86_64)
curl -L https://github.com/biomejs/biome/releases/download/cli%2Fv2.3.10/biome-x86_64-unknown-linux-gnu -o biome

# Windows (PowerShell)
Invoke-WebRequest -Uri "https://github.com/biomejs/biome/releases/download/cli%2Fv2.3.10/biome-x86_64-pc-windows-msvc.exe" -OutFile "biome.exe"
```

**Return:** Executable file that runs without Node.js runtime

**Source URL:** [https://github.com/biomejs/biome/releases](https://github.com/biomejs/biome/releases)

---

### 3. Global Installation (via npm)

```bash
npm install --global @biomejs/biome
biome --version
```

---

## Project Initialization

### Initialize with Zero Configuration

```bash
npx biome init
```

**Return:** Creates `biome.json` with recommended settings

---

### Initialize with JSONC Format

```bash
npx biome init --jsonc
```

**Return:** Creates `biome.jsonc` instead of `biome.json`

---

## Zero-Configuration Usage

Biome works out-of-the-box without a configuration file using intelligent defaults:

### Default Formatter Settings
```
- Indentation: tab
- Indent Width: 2
- Line Width: 80
- Line Ending: lf (auto on Windows)
- Quote Style: double
- Trailing Commas: all
- Semicolons: always
- Bracket Spacing: true
```

### Default Linter Settings
```
- Recommended rules enabled by default
- Rules vary by detected language/dependencies
- Severity levels: error/warn/info based on rule group
```

---

## First-Time Setup Checklist

### 1. Install Package
```bash
npm install --save-dev @biomejs/biome
```

### 2. Generate Configuration (Optional)
```bash
npx biome init
```

### 3. Verify Installation
```bash
npx biome --version
# Output: CLI v2.3.10
```

### 4. Run First Check
```bash
npx biome check .
```

### 5. (Optional) Set Up Editor Integration
See Integration Guides for VS Code, WebStorm, VIM setup.

---

## Configuration File Location

### Auto-Discovery Strategy

Biome searches for configuration files in this order:

1. **Current working directory** - `biome.json` or `biome.jsonc`
2. **Parent directories** - Walks up until a config file is found
3. **Default configuration** - Uses built-in defaults if no file found

---

## Next Steps

- **Configure formatting rules:** See Formatter Configuration
- **Configure linting rules:** See Linter Configuration
- **Use CLI commands:** See CLI Reference
- **Integrate with editor:** See Integration Guides
- **Migrate from ESLint/Prettier:** See Migration & Recipes

---

## Troubleshooting

### Issue: Command not found
```bash
# Solution: Use full path via npx
npx biome --version

# Or install globally
npm install --global @biomejs/biome
biome --version
```

### Issue: Configuration file not found
```bash
# Solution: Check file location
cat biome.json  # Verify file exists

# Or specify explicitly
npx biome check --config-path=./biome.json .
```

---

**Document Version:** 2.3.10  
**Last Updated:** December 2024