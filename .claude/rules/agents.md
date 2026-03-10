# MCP Tool Orchestration

Guidelines for effective use of MCP tools from `mcp-ts-engineer`.

---

## Available MCP Tools

| Tool | Purpose | When to Use |
|------|---------|-------------|
| `mcp__ts-engineer__todo_reviewer` | Review and validate spec files | Before implementation, spec quality gate |
| `mcp__ts-engineer__todo_code_writer` | TDD implementation from spec | Feature implementation from reviewed specs |
| `mcp__ts-engineer__finalize` | Audit, test, codemap, commit | After implementation, final quality gate |
| `mcp__ts-engineer__audit_fix` | Fix lint/type/test violations | Code quality cleanup |
| `mcp__ts-engineer__pr_reviewer` | Comprehensive PR review | Before merging PRs |
| `mcp__ts-engineer__echo_agent` | Test agent connectivity | Verify MCP server is working |

---

## Proactive Tool Usage

**Use MCP tools WITHOUT waiting for user prompt:**

| Trigger | MCP Tool | Action |
|---------|----------|--------|
| New spec created | `todo_reviewer` | Validate spec structure and TDD coverage |
| Spec reviewed and ready | `todo_code_writer` | TDD implementation from spec |
| Code just written | `finalize` | Audit, test, update codemaps, commit |
| Lint/type/test failures | `audit_fix` | Auto-fix violations |
| PR ready for review | `pr_reviewer` | Comprehensive code review |

---

## Spec-Driven Workflow

Chain MCP tools for feature implementation:

```
todo_reviewer
    ↓ Validated spec (DRAFT → IN_REVIEW)
todo_code_writer
    ↓ Code + tests (IN_REVIEW → READY)
finalize
    ↓ Audit + codemaps + commit (READY → IMPLEMENTED)
```

---

## Tool Parameters

### `todo_reviewer`
- `spec_path` (required): Path to the spec markdown file
- `iterations` (optional): Review-validate cycles (1-10, default 3)
- `model` (optional): "opus" or "sonnet" (default "sonnet")

### `todo_code_writer`
- `spec_path` (required): Path to the spec markdown file
- `max_phases` (optional): Implementation phases (1-10, default 5)
- `model` (optional): "opus", "sonnet", or "haiku" (default "sonnet")

### `finalize`
- `files_changed` (required): List of modified file paths
- `spec_path` (optional): Spec to mark as IMPLEMENTED
- `skip_codemaps` (optional): Skip codemap updates

### `audit_fix`
- `project` (optional): Specific project to audit
- `spec_path` (optional): Spec for context
- `exclude` (optional): Array of project paths to exclude
- `max_iteration_per_project` (optional): Fix iterations per project (1-10, default 3)

### `pr_reviewer`
- `pr` (required): PR number or URL
- `mode` (optional): "review-only" or "review-fix" (default "review-only")
- `budget` (optional): Cost budget limit

---

## Error Handling

When an MCP tool fails:

1. Check if input parameters were correct
2. Verify the spec file exists and has correct format
3. Check if the target project builds and tests pass
4. Review MCP server logs for details
5. Retry with adjusted parameters

---

## Best Practices

**DO:**
- Follow the spec lifecycle: DRAFT → IN_REVIEW → READY → IMPLEMENTED
- Provide accurate `files_changed` to `finalize`
- Use `todo_reviewer` before `todo_code_writer`
- Run `audit_fix` when lint/type issues accumulate
- Use `pr_reviewer` before merging

**DON'T:**
- Skip `todo_reviewer` and go straight to `todo_code_writer`
- Forget to pass `spec_path` to `finalize` for spec workflows
- Ignore `pr_reviewer` findings
- Run `todo_code_writer` on DRAFT specs (review first)
