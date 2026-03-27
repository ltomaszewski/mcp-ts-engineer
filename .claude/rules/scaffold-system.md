---
globs: templates/**, scripts/**, __tests__/create-app-scripts*, __tests__/bootstrap-scripts*
---

# App Scaffold System

The `create-app.sh` script scaffolds new apps in the monorepo from templates. Registry-driven: adding a new app type requires only a new template directory and a registry entry — no script changes.

## Architecture

```
scripts/
├── _common.sh           # Shared functions (sourced by all scripts)
├── create-app.sh        # Main scaffold script
├── bootstrap.sh         # Initial monorepo setup
└── update.sh            # Re-sync after submodule update

templates/apps/
├── registry.json        # App type definitions
├── expo-app/            # React Native (Expo) template
├── nestjs-server/       # NestJS backend template
├── mcp-server/          # MCP server template
└── next-app/            # Next.js frontend template
```

## Usage

```bash
bash packages/mcp-ts-engineer/scripts/create-app.sh \
  --type <app-type> --name <app-name> [--port <port>]

# Claude Code commands
/create-app
/create-app expo-app my-mobile
/create-app nestjs-server my-api
/create-app mcp-server my-agent
/create-app next-app my-web
```

## Script Flow (`create-app.sh`)

1. Parse args: `--type`, `--name`, optional `--port` (default: 3001)
2. Source `_common.sh`, detect monorepo root
3. Validate: type in `registry.json`, name matches `/^[a-z][a-z0-9-]*$/`, `apps/<name>` doesn't exist
4. Derive placeholders: `APP_NAME`, `PACKAGE_NAME`, `PASCAL_NAME`, `EXPO_SLUG`, `BUNDLE_ID`, `PORT`
5. Walk `templates/apps/<type>/` recursively:
   - `.template` files → copy with suffix stripped, run `sed` placeholder replacement
   - `swcrc.template` → `.swcrc`, `env.example.template` → `.env.example`, `nvmrc.template` → `.nvmrc`
   - Other files (`.gitkeep`) → copy as-is
6. Create `docs/specs/<name>/todo/`
7. Run `npm install` + `update.sh`

## Available App Types

| Type | Label | Test Runner | Key Stack |
|------|-------|-------------|-----------|
| `expo-app` | React Native (Expo) | Jest (`jest-expo`) | Expo SDK 55, NativeWind v5, Expo Router, Zustand, TanStack Query |
| `nestjs-server` | NestJS Backend | Vitest (`unplugin-swc`) | NestJS v11, GraphQL (Yoga), MongoDB (Mongoose), JWT auth |
| `mcp-server` | MCP Server | Vitest | Claude Agent SDK, MCP SDK, ESM, Zod |
| `next-app` | Next.js Web App | Vitest (`jsdom`) | Next.js 15, React 19, TanStack Query, Better Auth, shadcn/ui, Tailwind v4 |

## Template Placeholders

All `.template` files use `{{PLACEHOLDER}}` syntax (processed via `sed`):

| Placeholder | Source | Example |
|---|---|---|
| `{{APP_NAME}}` | `--name` arg | `my-app` |
| `{{PACKAGE_NAME}}` | `@${REPO_NAME}/${APP_NAME}` | `@my-project/my-app` |
| `{{PASCAL_NAME}}` | PascalCase of APP_NAME | `MyApp` |
| `{{EXPO_SLUG}}` | Same as APP_NAME | `my-app` |
| `{{BUNDLE_ID}}` | `com.${REPO}.${APP}` (stripped hyphens) | `com.myproject.myapp` |
| `{{PORT}}` | `--port` or `3001` | `3001` |

## Per-App Scripts

| Script | expo-app | nestjs-server | mcp-server | next-app |
|---|---|---|---|---|
| `dev` | `expo start` | `tsx watch src/main.ts` | `tsx src/index.ts` | `next dev --turbopack` |
| `build` | `tsc` | `tsc -p tsconfig.build.json` | `rm -rf build && tsc` | `next build` |
| `test` | `jest` | `vitest run` | `vitest run` | `vitest run` |
| `lint` | `biome check .` | `biome check .` | `biome check .` | `biome check .` |

## Shared Shell Functions (`_common.sh`)

| Function | Purpose |
|----------|---------|
| `relpath()` | Portable relative path via python3 |
| `to_pascal_case()` | `kebab-case` → `PascalCase` |
| `detect_monorepo_root()` | Walk-up detection, sets `$MONOREPO_ROOT` |
| `read_pkg_field()` | Read JSON field via jq or node fallback |
| `symlink_file()` | Idempotent symlink creation |

## Adding a New App Type

No script changes needed:

1. `mkdir -p templates/apps/<type>/src`
2. Add entry to `templates/apps/registry.json`
3. Add `.template` files with `{{PLACEHOLDER}}` markers
4. Special naming: `swcrc.template` → `.swcrc`, `env.example.template` → `.env.example`
5. Add tests in `__tests__/create-app-scripts.test.ts`
