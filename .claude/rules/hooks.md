# Hooks Configuration

Guidelines for Claude Code hooks.

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

## Recommended Hooks

### PreToolUse Hooks

**Block Unnecessary Files**
```json
{
  "type": "intercept",
  "matcher": "Write",
  "condition": "file_path matches '\\.md$' and file_path not in [CLAUDE.md, README.md]",
  "message": "Creating new .md files is discouraged. Use existing docs or skip."
}
```

**Review Before Push**
```json
{
  "type": "confirm",
  "matcher": "Bash",
  "condition": "command matches 'git push'",
  "message": "About to push. Have you verified tests pass?"
}
```

### PostToolUse Hooks

**TypeScript Check After Edit**
```json
{
  "type": "command",
  "matcher": "Edit",
  "condition": "file_path matches '\\.tsx?$'",
  "command": "npx tsc --noEmit --pretty false 2>&1 | head -10"
}
```

### Stop Hooks

**Session Save Reminder**
```json
{
  "type": "notify",
  "matcher": "*",
  "condition": "context_percentage > 70",
  "message": "Context at 70%+. Consider /compact."
}
```

---

## Configuration Location

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

## Best Practices

**DO:**
- Keep hooks lightweight (fast execution)
- Use for reminders, not enforcement
- Log important events
- Test hooks before deploying

**DON'T:**
- Block on long-running commands
- Add hooks that break workflow
- Duplicate linter/formatter work
- Over-notify (causes fatigue)

---

## Debugging Hooks

```bash
# View hook execution
export CLAUDE_DEBUG_HOOKS=1

# List configured hooks
cat .claude/settings.json | jq '.hooks'

# Test hook script manually
node .claude/hooks/post-tool-use/typescript-check.js
```
