---
name: continuous-learning
description: "Extract reusable patterns from Claude Code sessions and save as learned skills."
when_to_use: "Use when session end hook triggers pattern evaluation, running /learn, or reviewing session logs."
---

# Continuous Learning Skill

> Automatically evaluates sessions on end to extract reusable patterns saved as learned skills.

## When to Use

**LOAD THIS SKILL** when:
- Session end hook triggers pattern evaluation
- User runs `/learn` for manual extraction
- Reviewing session logs for extractable patterns

## How It Works

1. **Stop Hook** — `evaluate-session.sh` runs at session end
2. **Pattern Detection** — Identifies extractable patterns if session has 10+ messages
3. **Skill Extraction** — Saves patterns to `.claude/skills/learned/`

## Core Behaviors

### ALWAYS
- Wait for session to have 10+ messages before evaluating
- Ask user confirmation before saving any skill
- Include concrete examples in extracted skills
- Reference specific project files/modules

### NEVER
- Extract trivial fixes (typos, simple syntax)
- Extract one-time external issues (API outages)
- Save skills without user confirmation
- Include sensitive data in skills

## Pattern Types

| Pattern | Description | Examples |
|---------|-------------|---------------------|
| `error_resolution` | How errors were resolved | Database query fixes |
| `debugging_techniques` | Effective debugging | Framework-specific issues |
| `workarounds` | Framework quirks | Platform limitations |
| `project_specific` | Codebase conventions | Module patterns |

## Patterns

### Extracting Error Resolution

```markdown
# CosmosDB Lookup Workaround

**Extracted:** 2026-01-25
**Context:** MongoDB aggregation in CosmosDB

## Problem

$lookup with pipeline not supported in CosmosDB MongoDB API.

## Solution

Use read-then-join pattern instead of aggregation:
1. Query parent documents
2. Collect IDs
3. Query children with $in
4. Join in application code

## Example

```typescript
// Instead of $lookup pipeline
const users = await this.userModel.find({ status: 'active' });
const userIds = users.map(u => u._id);
const kids = await this.kidModel.find({ userId: { $in: userIds } });
```
```

### Extracting Debugging Technique

```markdown
# React Native Keyboard Form Pattern

**Extracted:** 2026-01-25
**Context:** Forms with keyboard in React Native

## Problem

Keyboard overlaps form inputs, content not scrollable.

## Solution

Combine KeyboardAwareScrollView with useKeyboardManager hook.

## Example

```typescript
<KeyboardAwareScrollView bottomOffset={20}>
  <Pressable onPress={Keyboard.dismiss}>
    <FormContent />
  </Pressable>
</KeyboardAwareScrollView>
```
```

## Anti-Patterns

### DON'T: Extract trivial fixes

```markdown
# BAD - Too trivial
**Problem:** Missing semicolon caused error
**Solution:** Added semicolon

# GOOD - Valuable pattern
**Problem:** ESLint rule conflict with Biome
**Solution:** Configure both tools with shared base config
```

### DON'T: Extract one-time issues

```markdown
# BAD - One-time external issue
**Problem:** GitHub API returned 503
**Solution:** Waited and retried

# GOOD - Reusable workaround
**Problem:** GitHub API rate limiting
**Solution:** Implement exponential backoff with jitter
```

## Configuration

Edit `config.json`:

```json
{
  "min_session_length": 10,
  "learned_skills_path": ".claude/skills/learned/",
  "patterns_to_detect": [
    "error_resolution",
    "debugging_techniques",
    "workarounds",
    "project_specific"
  ],
  "ignore_patterns": [
    "simple_typos",
    "one_time_fixes",
    "external_api_issues"
  ]
}
```

## Hook Setup

Configured in `.claude/settings.json`:

```json
{
  "hooks": {
    "Stop": [{
      "matcher": "*",
      "hooks": [{
        "type": "command",
        "command": "\"$CLAUDE_PROJECT_DIR\"/.claude/hooks/stop/evaluate-session.sh"
      }]
    }]
  }
}
```

## Quick Reference

| Trigger | Action | Output |
|---------|--------|--------|
| Session end (10+ msgs) | Auto-evaluate | Prompt for extraction |
| `/learn` command | Manual extraction | Draft skill for approval |
| User confirms | Save skill | `.claude/skills/learned/*.md` |

## Related

- `/learn` command — Manual pattern extraction mid-session
- `.claude/skills/learned/` — Storage location for extracted skills
- `evaluate-session.sh` — Stop hook that triggers evaluation
