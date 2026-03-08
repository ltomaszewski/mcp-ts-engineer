# Contributing

Thanks for your interest in contributing to mcp-ts-engineer. This document covers the process for contributing to this project.

## Getting Started

### Prerequisites

- Node.js >= 22.0.0
- npm
- Claude Code CLI (authenticated via `claude login`)
- GitHub CLI (`gh`) for PR-related tools

### Setup

```bash
git clone https://github.com/ltomaszewski/mcp-ts-engineer.git
cd mcp-ts-engineer
npm install
npm run build
npm test
```

### Verify Everything Works

```bash
npm run build        # TypeScript compiles cleanly
npm test             # All tests pass
npm run lint         # No lint errors
```

## Development Workflow

### 1. Branch from main

```bash
git checkout main
git pull origin main
git checkout -b feat/your-feature
```

### 2. Follow TDD

Write tests first, then implementation:

```bash
npm run test:watch   # Watch mode during development
```

### 3. Commit conventions

We use [Conventional Commits](https://www.conventionalcommits.org/):

```
<type>(<scope>): <description>
```

Types: `feat`, `fix`, `refactor`, `docs`, `test`, `chore`, `perf`, `ci`

Examples:
```
feat(core): add session cost tracking
fix(provider): resolve timeout in claude provider
test(echo-agent): add integration tests
```

### 4. Quality checks before PR

```bash
npm run build          # Types compile
npm test               # All tests pass
npm run lint           # No lint issues
npm run test:coverage  # Coverage >= 80%
```

## Project Structure

```
src/
├── config/              # Configuration constants
├── core/                # Framework (logger, session, cost, prompt, registry)
├── providers/           # AI provider implementations (Claude)
├── capabilities/        # MCP tool implementations
├── shared/              # Shared utilities
└── index.ts             # Entry point
```

### Adding a New Capability

Each capability is a self-contained module:

```
src/capabilities/my-capability/
├── my-capability.capability.ts   # Handler + definition
├── my-capability.schema.ts       # Zod input/output schemas
├── my-capability.types.ts        # TypeScript types
├── prompts/v1.ts                 # Versioned prompts
├── __tests__/                    # Tests
└── index.ts                      # Exports
```

See `CLAUDE.md` for the full capability creation guide.

### Adding a New App Template

The template system is registry-driven — no script changes needed:

1. Create `templates/apps/<type>/`
2. Add entry to `templates/apps/registry.json`
3. Add `.template` files with `{{PLACEHOLDER}}` markers
4. Add tests in `__tests__/create-app-scripts.test.ts`

## Code Style

- **Files**: < 300 lines (soft limit)
- **Functions**: < 50 lines (prefer 20-30)
- **Nesting**: Max 3 levels deep
- **Types**: Explicit return types on exports
- **Immutability**: Prefer spread over mutation for shared state
- **Errors**: Log with context, never empty catch blocks
- **Formatting**: Biome (not ESLint/Prettier)

See `.claude/rules/coding-style.md` for full details.

## Testing

- **Framework**: Vitest
- **Coverage target**: 80% lines/statements/functions
- **Test location**: `__tests__/` directories co-located with source
- **Isolation**: Each test sets up its own data, no shared mutable state
- **Mocking**: Use `vi.mock()` for external services, `vi.useFakeTimers()` for time

## Pull Requests

### PR title format

```
<type>(<scope>): <description>
```

Keep under 70 characters. Use the body for details.

### PR body template

```markdown
## Summary
- [What changed and why]

## Test plan
- [ ] Unit tests added/updated
- [ ] All tests pass
- [ ] Coverage >= 80%
```

### Review process

1. All CI checks must pass
2. At least one approval required
3. Address all review comments before merge

## Reporting Issues

- **Bugs**: Use the bug report issue template
- **Features**: Use the feature request issue template
- **Security**: See [SECURITY.md](SECURITY.md) — do not open public issues

## License

By contributing, you agree that your contributions will be licensed under the [MIT License](LICENSE).
