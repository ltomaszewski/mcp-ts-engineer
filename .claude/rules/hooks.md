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
  "message": "About to push. Have you run /verify?"
}
```

**Remind About Long Commands**
```json
{
  "type": "notify",
  "matcher": "Bash",
  "condition": "command matches 'npm|pnpm|turbo|npx'",
  "message": "Consider using background execution for long-running commands."
}
```

### PostToolUse Hooks

**TypeScript Check After Edit**
```json
{
  "type": "command",
  "matcher": "Edit",
  "condition": "file_path matches '\\.tsx?$'",
  "command": "npm run type-check -w $(dirname $file_path | sed 's|/src.*||') 2>&1 | head -10"
}
```

**Warn Console.log**
```json
{
  "type": "notify",
  "matcher": "Write",
  "condition": "content matches 'console\\.log'",
  "message": "Warning: console.log detected. Remove before commit."
}
```

### Stop Hooks

**Session Save Reminder**
```json
{
  "type": "notify",
  "matcher": "*",
  "condition": "context_percentage > 70",
  "message": "Context at 70%+. Consider /session save or /compact."
}
```

**Audit Console Logs**
```json
{
  "type": "command",
  "matcher": "*",
  "command": "grep -r 'console.log' apps/*/src 2>/dev/null | head -5 | while read line; do echo \"Warning: $line\"; done"
}
```

---

## Configuration Location

Add hooks to `~/.claude/settings.json`:

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
            "message": "Confirm push after /verify?"
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
    ],
    "Stop": [
      {
        "matcher": "*",
        "hooks": [
          {
            "type": "command",
            "command": "~/.claude/hooks/session-end.sh"
          }
        ]
      }
    ]
  }
}
```

---

## Hook Scripts

### session-end.sh

```bash
#!/bin/bash
# Save session state on Claude stop

SESSION_DIR="$HOME/.claude/sessions"
mkdir -p "$SESSION_DIR"

DATE=$(date +%Y-%m-%d)
FILE="$SESSION_DIR/$DATE-session.md"

echo "Session ended: $(date)" >> "$FILE"
echo "---" >> "$FILE"
```

### pre-compact.sh

```bash
#!/bin/bash
# Log context state before compaction

LOG_FILE="$HOME/.claude/compact.log"
echo "$(date): Context compaction triggered" >> "$LOG_FILE"
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

## Project-Specific Hook Examples

### Server Development

```json
{
  "PreToolUse": [{
    "matcher": "Write",
    "hooks": [{
      "type": "notify",
      "condition": "file_path matches 'src/modules/.*\\.ts$'",
      "message": "Remember: Test database compatibility for query operations."
    }]
  }]
}
```

### Mobile Development

```json
{
  "PreToolUse": [{
    "matcher": "Write",
    "hooks": [{
      "type": "notify",
      "condition": "file_path matches 'src/.*\\.tsx?$'",
      "message": "Check: Race condition handling, cleanup in useEffect."
    }]
  }]
}
```

---

## Debugging Hooks

```bash
# View hook execution
export CLAUDE_DEBUG_HOOKS=1

# List configured hooks
cat ~/.claude/settings.json | jq '.hooks'

# Test hook script manually
~/.claude/hooks/session-end.sh
```
