# Biome Skill -- Summary

**Version:** 2.x (^2.4.4)
**Source:** https://biomejs.dev/

---

## Files

| File | Lines | Content |
|------|-------|---------|
| `SKILL.md` | ~265 | Entry point: critical rules, core patterns, anti-patterns, quick reference |
| `00-master-index.md` | ~110 | Navigation hub, use-case routing, core concepts |
| `01-setup.md` | ~120 | Installation, init, zero-config, monorepo pattern |
| `02-formatter-config.md` | ~235 | All formatter options: global, JS, JSON, CSS, GraphQL, HTML |
| `03-linter-config.md` | ~295 | 450+ rules, 8 groups, domains, suppression, assists, plugins |
| `04-configuration.md` | ~300 | biome.json full schema, files, vcs, overrides, extends |
| `05-cli-reference.md` | ~230 | All 14 commands, flags, reporters, daemon, exit codes |
| `06-integration-guides.md` | ~200 | VS Code, WebStorm, Vim, GitHub Actions, GitLab, hooks, Docker |
| `07-api-reference.md` | ~230 | @biomejs/js-api, WASM, format/lint methods, daemon architecture |
| `08-migration-recipes.md` | ~325 | ESLint/Prettier migration, rule mappings, project recipes |

---

## Key v2 Changes Documented

- `organizeImports` replaced by `assists` section
- `ignore`/`include` replaced by `includes` field
- Globs relative to config file (no auto `**/` prepend)
- CSS, GraphQL, HTML support now stable
- `biome search` with GritQL patterns
- Plugin system via GritQL
- Domains auto-detected from package.json
- File-level and range suppression comments
- New reporters: github, gitlab, junit, sarif, checkstyle, rdjson
- Style rules default to `warn`
- `linter.rules.all` removed

---

## What Each File Covers

**SKILL.md** -- Start here. Critical rules (5 ALWAYS, 5 NEVER), v2 migration notes, basic config pattern, CLI cheatsheet, suppression comment syntax, VS Code settings, anti-patterns.

**00-master-index.md** -- Module navigation with use-case routing table. Core concepts: three-in-one toolchain, safe/unsafe fixes, config resolution, domains, suppression comments.

**01-setup.md** -- Installation via npm/yarn/pnpm/bun/standalone binary. `biome init` for config creation. Zero-config defaults tables. Config file resolution. Monorepo root pattern.

**02-formatter-config.md** -- All formatter options with parameter tables. Global options (indent, lineWidth, lineEnding). Per-language: JavaScript (14 options), JSON, CSS, GraphQL, HTML. Override strategy with glob patterns.

**03-linter-config.md** -- Rule groups with key rules tables: a11y, complexity, correctness, performance, security, style, suspicious. Domains: react, test, nextjs, solid. Safe/unsafe fixes. Suppression comment formats. Assists and plugin configuration.

**04-configuration.md** -- Complete biome.json schema. Top-level keys table. Sections: files, vcs, assist, javascript, css, graphql, html, overrides, extends. Environment variables. Complete example config.

**05-cli-reference.md** -- All 14 commands with flag tables: check, lint, format, ci, init, migrate, search, start, stop, version, rage, explain, clean, lsp-proxy. Global options. All 10 reporter formats. Exit codes.

**06-integration-guides.md** -- VS Code settings.json config. WebStorm setup. Vim/Neovim with conform.nvim. GitHub Actions with `--reporter=github`. GitLab CI. Pre-commit hooks (manual, husky, lint-staged). Docker. Daemon mode. package.json scripts.

**07-api-reference.md** -- @biomejs/js-api with WASM peer deps (nodejs, bundler, web). Core methods: openProject, applyConfiguration, formatContent, lintContent, printDiagnostics. CLI integration from Node.js. Daemon architecture. Language detection table.

**08-migration-recipes.md** -- Step-by-step ESLint migration (5 steps). Prettier migration (3 steps). ESLint core rule mapping table. TypeScript-ESLint mapping table. React plugin mapping table. Project recipes: React, TypeScript strict, Next.js, NestJS, monorepo. Troubleshooting. Pre-migration checklist.

---

**Version:** 2.x (^2.4.4) | **Source:** https://biomejs.dev/
