---
name: hooks
description: Claude Code hooks configuration - PreToolUse, PostToolUse, Stop hooks, settings.json setup, debugging. Use when configuring hooks, setting up automation, or debugging hook behavior.
---

# Hooks Configuration

> Configure Claude Code hooks for automation and workflow control.

---

## When to Use

**LOAD THIS SKILL** when user is:
- Configuring Claude Code hooks in `.claude/settings.json`
- Setting up pre/post tool automation
- Debugging hook execution issues

---

## Hook Types

| Hook | Trigger | Use Case |
|------|---------|----------|
| `PreToolUse` | Before tool executes | Validation, reminders |
| `PostToolUse` | After tool completes | Formatting, checks |
| `UserPromptSubmit` | On message send | Context loading |
| `Stop` | Claude finishes | Audits, session save |
| `PreCompact` | Before compaction | State preservation |

---

## Configuration

Add hooks to `.claude/settings.json`:

```json
{
  "hooks": {
    "PreToolUse": [
      {
        "matcher": "Bash",
        "hooks": [
          {
            "type": "confirm",
            "condition": "command matches 'git push'",
            "message": "Confirm push after verification?"
          }
        ]
      }
    ],
    "PostToolUse": [
      {
        "matcher": "Edit",
        "hooks": [
          {
            "type": "notify",
            "condition": "file_path matches '\\.ts$'",
            "message": "TypeScript file edited. Run type-check."
          }
        ]
      }
    ]
  }
}
```

---

## Example Hooks

**Block unnecessary .md files (PreToolUse):**
```json
{ "type": "intercept", "matcher": "Write", "condition": "file_path matches '\\.md$'" }
```

**TypeScript check after edit (PostToolUse):**
```json
{ "type": "command", "matcher": "Edit", "command": "npx tsc --noEmit --pretty false 2>&1 | head -10" }
```

---

## Best Practices

- Keep hooks lightweight (fast execution)
- Use for reminders, not enforcement
- Don't block on long-running commands
- Don't duplicate linter/formatter work

## Debugging

```bash
export CLAUDE_DEBUG_HOOKS=1           # View hook execution
cat .claude/settings.json | jq '.hooks'  # List hooks
```
