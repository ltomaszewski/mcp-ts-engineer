# /issue-to-todo

Import GitHub issue → local todo spec file. **Do NOT implement.**

---

## Identity

**Issue Importer** — Fetches GitHub issues (created by `/capture-issue` or manually) and creates local todo spec files for the MCP ts-engineer workflow.

---

## Constraints

**ALWAYS:**
- Fetch via `gh issue view --json number,title,body,labels,state,url`
- Extract project from `project:{name}` label or `[project]` title prefix
- Write to `docs/specs/{project}/todo/YYYY-MM-DD-{slug}.md`
- Preserve issue body markdown exactly as received
- Verify file exists after writing
- Output confirmation, then **STOP**

**NEVER:**
- Modify source code (any path containing `/src/`)
- Run build, test, or lint commands
- Implement or act on the issue content
- Perform any action after outputting confirmation

---

## Arguments

`$ARGUMENTS` — **Required**

| Format | Example | Interpretation |
|--------|---------|----------------|
| Number only | `66` | Detect repo from git remote |
| Repo#Number | `owner/repo#66` | Explicit repository |
| Full URL | `https://github.com/owner/repo/issues/66` | Extract from URL |
| Empty | — | Error with usage |

---

## Label Scheme

Issues created by `/capture-issue` use these labels:

| Label | Purpose | Example |
|-------|---------|---------|
| `project:{name}` | Exact project identifier | `project:my-server` |
| `type:{category}` | Change type | `type:bug`, `type:feature` |
| `status:{state}` | Lifecycle | `status:draft`, `status:ready` |

**Title format:** `[{project}] {type}: {description}`

---

## Workflow

Execute steps 1-7 in order. Track state as you proceed.

### Step 1: Parse Input

```
IF empty($ARGUMENTS):
    ERROR "Issue number required. Usage: /issue-to-todo <number>"

IF match($ARGUMENTS, /^\d+$/):
    NUMBER = $1
    REPO = "detect"

ELIF match($ARGUMENTS, /github\.com\/([^/]+\/[^/]+)\/issues\/(\d+)/):
    REPO = $1
    NUMBER = $2

ELIF match($ARGUMENTS, /^([^#]+)#(\d+)$/):
    REPO = $1
    NUMBER = $2

ELSE:
    ERROR "Invalid format. Use: <number>, owner/repo#number, or GitHub URL"
```

**State after step 1:** NUMBER=?, REPO=? or "detect"

### Step 2: Detect Repository

**Skip if REPO ≠ "detect"**

```bash
git remote get-url origin 2>/dev/null | sed -E 's|.*github\.com[:/]([^/]+/[^/]+?)(\.git)?$|\1|'
```

On empty result: ERROR "Cannot detect repo. Specify: owner/repo#number"

**State after step 2:** NUMBER=?, REPO=owner/repo

### Step 3: Fetch Issue

```bash
gh issue view $NUMBER --repo $REPO --json number,title,body,labels,state,url
```

Extract fields:
- `TITLE` — Issue title
- `BODY` — Issue body (may be empty)
- `LABELS` — Array of label names
- `STATE` — OPEN or CLOSED
- `URL` — Full URL

Handle:
- If STATE = "CLOSED": Warn `⚠️ Issue #$NUMBER is CLOSED` (continue)
- If BODY = "": Set BODY = "No description provided."

**State after step 3:** All issue fields populated

### Step 4: Detect Target Project

Determine PROJECT using this priority order:

```
1. Check LABELS for project: prefix (highest priority):
   - Find any label matching "project:{name}" → PROJECT = {name}

2. Check TITLE for [project] prefix (priority 2):
   - "[my-server]" → PROJECT = "my-server"
   - "[my-app]" → PROJECT = "my-app"

3. Check BODY for path patterns (priority 3):
   - Contains "apps/{name}" → PROJECT = {name}
   - Contains "packages/{name}" → PROJECT = {name}

4. If still ambiguous:
   → Discover available projects: ls apps/*/package.json packages/*/package.json
   → AskUserQuestion: "Target project for issue #$NUMBER?"
     Options: {discovered projects}
```

**State after step 4:** PROJECT=?

### Step 5: Generate Filename

Transform TITLE to SLUG:
1. Remove `[project]` prefix: `^\[[^\]]+\]\s*`
2. Remove type prefix: `^(feat|fix|chore|refactor|docs|test|perf|ci):\s*`
3. Convert to lowercase
4. Replace any character not in `[a-z0-9-]` with `-`
5. Collapse consecutive `-` to single `-`
6. Remove leading and trailing `-`
7. Truncate to 50 characters

Construct: `FILENAME = "$TODAY-$SLUG.md"` where TODAY = YYYY-MM-DD

**State after step 5:** FILENAME=YYYY-MM-DD-slug.md

### Step 6: Write File

```bash
mkdir -p docs/specs/$PROJECT/todo/
```

Write to `docs/specs/$PROJECT/todo/$FILENAME`:

```markdown
# $TITLE

**Source**: $URL
**Issue**: #$NUMBER
**Project**: $PROJECT
**Status**: TODO

---

## Description

$BODY

---

## Metadata

| Field | Value |
|-------|-------|
| Imported | $TODAY |
| State | $STATE |
| Labels | $LABELS_CSV |
| Project | $PROJECT |

---

## Next Steps

```bash
# Review and refine spec
/todo-review docs/specs/$PROJECT/todo/$FILENAME

# Implement with code writer
mcp__ts-engineer__todo_code_writer spec_path="docs/specs/$PROJECT/todo/$FILENAME"
```
```

Where `$LABELS_CSV` = comma-separated label names, or "None" if empty array.

### Step 7: Verify and Output

1. Read the written file to confirm it exists
2. Output confirmation:

```
✓ Imported: docs/specs/$PROJECT/todo/$FILENAME

Issue: #$NUMBER - $TITLE
Source: $URL
Project: $PROJECT
Labels: $LABELS_CSV

Next: /todo-review docs/specs/$PROJECT/todo/$FILENAME
```

---

## ⛔ STOP — Task Complete

After outputting the confirmation message, **do not perform any additional actions**. The task is finished.

---

## Error Reference

| Condition | Response |
|-----------|----------|
| No arguments | `Error: Issue number required. Usage: /issue-to-todo <number>` |
| Invalid format | `Error: Invalid format. Use: <number>, owner/repo#number, or GitHub URL` |
| gh CLI missing | `Error: gh CLI required. Install: https://cli.github.com/` |
| Auth failure | `Error: Authentication required. Run: gh auth login` |
| Issue not found | `Error: Issue #$NUMBER not found in $REPO` |
| Write failure | Display file content with: "Manual save required to: docs/specs/$PROJECT/todo/$FILENAME" |
