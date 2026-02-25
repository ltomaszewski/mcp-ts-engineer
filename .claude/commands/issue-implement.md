# /issue-implement

End-to-end implementation pipeline: Import GitHub issue → Review spec → Implement with TDD → Finalize → Close issue.

**Progress Tracking:** Marks issue in-progress, comments on each step, handles failures with labels and recovery guidance.

---

## Identity

**Implementation Pipeline Orchestrator** — Chains the full development workflow from GitHub issue to completed code. Uses MCP ts-engineer tools with fresh context per step.

Provides real-time visibility via GitHub issue comments and labels.

---

## Prerequisites

```bash
# Verify repository root
[ -d .git ] || (echo "Error: Not in repository root" && exit 1)

# Capture original directory
ORIGINAL_DIR=$(pwd)

# Verify gh authenticated
gh auth status          # Must be authenticated

# Verify clean working tree
git status --porcelain  # Must be clean (error if dirty)
```

- Not in repo root → Error: `cd to repository root first`
- gh not auth → Error: `Run gh auth login first`
- Dirty tree → Error: `Commit or stash changes first`

**Note:** Steps 7 (Review-Fix Loop) combines the former Steps 7 (PR Review) and 8 (PR Fix Loop) into a single iterative step. The pipeline is now 7 steps.

---

## Constraints

**ALWAYS:**
- Verify prerequisites before Step 1
- Mark issue "in-progress" after Step 1 succeeds
- Comment on issue after every step
- Stop on BLOCKED or failure
- On failure: add "blocked" label, comment error + recovery, leave open
- Use HEREDOC for multi-line gh comments
- Pass `spec_path` as quoted string, `files_changed` as JSON array

**NEVER:**
- Run steps in parallel
- Continue after failure
- Close issue if any step fails
- Retry automatically
- Add labels before Step 1 succeeds
- Loop more than `MAX_REVIEW_FIX_LOOPS` (3) times in Step 7

---

## Arguments

`$ARGUMENTS` — Required

| Format | Example |
|--------|---------|
| Number | `66` |
| Repo#Number | `owner/repo#66` |
| URL | `https://github.com/.../issues/66` |

Empty → `Usage: /issue-implement <number>`

---

## State Variables

| Variable | Source | Used In |
|----------|--------|---------|
| `ORIGINAL_DIR` | Prerequisites | After Step 7 (return) |
| `ISSUE_NUMBER` | Step 1 | All steps |
| `ISSUE_URL` | Step 1 | Output |
| `SPEC_PATH` | Step 1 | Steps 2-5 |
| `PROJECT` | Step 1 | Output |
| `ISSUE_TITLE` | Step 1 | Step 2, Output |
| `SLUG` | Step 2 | Step 2 |
| `RANDOM5` | Step 2 | Step 2 |
| `BRANCH_NAME` | Step 2 | Step 2, Step 6 |
| `WORKTREE_PATH` | Step 2 | Steps 3-6 |
| `ITERATION_COUNT` | Step 3 | Output |
| `PHASE_COUNT` | Step 4 | Output |
| `FILES_CHANGED` | Step 4 | Step 5 |
| `FILE_COUNT` | Step 4 | Output |
| `PR_URL` | Step 6 | Output |
| `PR_NUMBER` | Step 6 | Steps 7-8 |
| `MAX_REVIEW_FIX_LOOPS` | Constant (3) | Step 7 |
| `LOOP_COUNT` | Step 7 | Output |
| `LOOP_STATUS` | Step 7 | Output |
| `REVIEW_COMMENT_URL` | Step 7 | Output |
| `TOTAL_ISSUES_FIXED` | Step 7 | Output |

---

## Pipeline

```
Import → Worktree → Review → Implement → Finalize → Push & PR → Review-Fix Loop
   ↓         ↓         ↓          ↓           ↓          ↓             ↓
+label    comment   comment    comment    comment      PR+          -label
comment  (+blocked) (+blocked) (+blocked) (+blocked)  comment       comment
                                                              (reviewer→fixer) ↻ max 3
```

---

## Labels

| Label | Applied | Removed |
|-------|---------|---------|
| `in-progress` | After Step 1 | After Step 7 |
| `blocked` | On failure | Manual |

---

## Workflow

### Step 1: Import

```
/issue-to-todo $ARGUMENTS
```

**Parse:** `SPEC_PATH`, `ISSUE_NUMBER`, `ISSUE_URL`, `PROJECT`

**Fetch title:**
```bash
ISSUE_TITLE=$(gh issue view $ISSUE_NUMBER --json title -q .title)
if [ -z "$ISSUE_TITLE" ]; then
  echo "Error: Failed to fetch issue title"
  exit 1
fi
```

**On success:**
```bash
# Create labels if missing
gh label create "in-progress" --color "0E8A16" 2>/dev/null || true
gh label create "blocked" --color "D93F0B" 2>/dev/null || true

# Mark in-progress
gh issue edit $ISSUE_NUMBER --add-label "in-progress"

# Comment
gh issue comment $ISSUE_NUMBER --body "$(cat <<EOF
🚀 **Implementation started**

Spec: \`$SPEC_PATH\`
Project: \`$PROJECT\`

| Step | Status |
|------|--------|
| Import | ✅ |
| Worktree | ⏳ |
| Review | ⏳ |
| Implement | ⏳ |
| Finalize | ⏳ |
| Push & PR | ⏳ |
| Review-Fix Loop | ⏳ |
EOF
)"
```

**Console:**
```
✓ Step 1/7: Imported #$ISSUE_NUMBER — $ISSUE_TITLE
  Spec: $SPEC_PATH
```

**On failure:** STOP (no GitHub action)

---

### Step 2: Worktree

**Generate slug from ISSUE_TITLE:**
```bash
# Remove [project] prefix
SLUG=$(echo "$ISSUE_TITLE" | sed 's/^\[[^]]*\]\s*//')

# Remove type prefix
SLUG=$(echo "$SLUG" | sed 's/^(feat|fix|chore|refactor|docs|test|perf|ci):\s*//')

# Lowercase
SLUG=$(echo "$SLUG" | tr '[:upper:]' '[:lower:]')

# Replace non-alphanumeric with dash
SLUG=$(echo "$SLUG" | sed 's/[^a-z0-9]/-/g')

# Collapse multiple dashes
SLUG=$(echo "$SLUG" | sed 's/--*/-/g')

# Trim leading/trailing dashes
SLUG=$(echo "$SLUG" | sed 's/^-//;s/-$//')

# Truncate to 30 chars
SLUG=$(echo "$SLUG" | cut -c1-30 | sed 's/-$//')
```

**Generate branch and worktree variables:**
```bash
RANDOM5=$(tr -dc 'a-z0-9' < /dev/urandom | head -c 5)
BRANCH_NAME="claude/issue-${ISSUE_NUMBER}-${SLUG}-${RANDOM5}"
WORKTREE_PATH=".worktrees/issue-${ISSUE_NUMBER}-${SLUG}"
```

**Check for existing branch (re-run detection):**
```bash
EXISTING=$(gh issue develop --list $ISSUE_NUMBER 2>/dev/null | head -1 | awk '{print $1}')

if [ -n "$EXISTING" ]; then
  # Re-run case: branch already exists
  BRANCH_NAME=$EXISTING

  # Check for existing worktree
  EXISTING_WT=$(git worktree list | grep "$BRANCH_NAME" | awk '{print $1}')

  if [ -n "$EXISTING_WT" ]; then
    # Worktree already exists, reuse but STILL run setup
    WORKTREE_PATH=$EXISTING_WT
    echo "⟲ Reusing existing worktree: $WORKTREE_PATH"
    cd "$WORKTREE_PATH" && git submodule update --init --recursive && echo "n" | ./scripts/setup-worktree.sh
  else
    # Branch exists but worktree doesn't, create worktree
    git worktree add "$WORKTREE_PATH" "$BRANCH_NAME"
    cd "$WORKTREE_PATH" && git submodule update --init --recursive && echo "n" | ./scripts/setup-worktree.sh
  fi
else
  # Fresh run: create branch and worktree
  git checkout main && git pull origin main
  gh issue develop $ISSUE_NUMBER --name "$BRANCH_NAME" --base main
  git worktree add "$WORKTREE_PATH" "$BRANCH_NAME"
  cd "$WORKTREE_PATH" && git submodule update --init --recursive && echo "n" | ./scripts/setup-worktree.sh
fi
```

**Change working directory (CRITICAL):**
```bash
cd "$WORKTREE_PATH"
```

**On success:**
```bash
gh issue comment $ISSUE_NUMBER --body "$(cat <<EOF
📊 **Step 2/7: Worktree**

✅ Created worktree at \`$WORKTREE_PATH\`
Branch: \`$BRANCH_NAME\`
EOF
)"
```

**Console:** `✓ Step 2/7: Worktree at $WORKTREE_PATH`

**On failure:**
```bash
gh issue edit $ISSUE_NUMBER --add-label "blocked"
gh issue comment $ISSUE_NUMBER --body "$(cat <<EOF
❌ **Step 2/7: Worktree setup failed**

\`\`\`
$ERROR
\`\`\`

**Manual setup:**
\`\`\`bash
cd $WORKTREE_PATH
./scripts/setup-worktree.sh
\`\`\`

Remove \`blocked\` label after fixing, then re-run.
EOF
)"
```

**Console:** `✗ Step 2/7: Failed` → STOP

---

### Step 3: Review

```
mcp__ts-engineer__todo_reviewer spec_path="$SPEC_PATH" iterations=3 cwd="$WORKTREE_PATH"
```

**On READY:**
```bash
gh issue comment $ISSUE_NUMBER --body "$(cat <<EOF
📊 **Step 3/7: Review**

✅ READY — $ITERATION_COUNT iterations
EOF
)"
```

**Console:** `✓ Step 3/7: Review passed`

**On BLOCKED:**
```bash
gh issue edit $ISSUE_NUMBER --add-label "blocked"
gh issue comment $ISSUE_NUMBER --body "$(cat <<EOF
❌ **Step 3/7: Review BLOCKED**

$BLOCKER_LIST

**Fix:** Edit \`$SPEC_PATH\`, remove \`blocked\` label, re-run
EOF
)"
```

**Console:** `✗ Step 3/7: BLOCKED` → STOP

---

### Step 4: Implement

```
mcp__ts-engineer__todo_code_writer spec_path="$SPEC_PATH" max_phases=5 cwd="$WORKTREE_PATH"
```

**Parse:** `FILES_CHANGED`, `PHASE_COUNT`, `FILE_COUNT`

**On success:**
```bash
gh issue comment $ISSUE_NUMBER --body "$(cat <<EOF
📊 **Step 4/7: Implementation**

✅ Complete — $PHASE_COUNT phases, $FILE_COUNT files
EOF
)"
```

**Console:** `✓ Step 4/7: $PHASE_COUNT phases, $FILE_COUNT files`

**On failure:**
```bash
gh issue edit $ISSUE_NUMBER --add-label "blocked"
gh issue comment $ISSUE_NUMBER --body "$(cat <<EOF
❌ **Step 4/7: Implementation failed**

\`\`\`
$ERROR
\`\`\`

**Fix:** Resolve error, run \`audit_fix\`, remove \`blocked\`, re-run
EOF
)"
```

**Console:** `✗ Step 4/7: Failed` → STOP

---

### Step 5: Finalize

```
mcp__ts-engineer__finalize files_changed=$FILES_JSON spec_path="$SPEC_PATH" cwd="$WORKTREE_PATH"
```

**On success:**
```bash
gh issue comment $ISSUE_NUMBER --body "$(cat <<EOF
📊 **Step 5/7: Finalization**

✅ Audit passed, tests passed, spec marked IMPLEMENTED
EOF
)"
```

**Console:** `✓ Step 5/7: Finalized`

**On failure:**
```bash
gh issue edit $ISSUE_NUMBER --add-label "blocked"
gh issue comment $ISSUE_NUMBER --body "$(cat <<EOF
❌ **Step 5/7: Finalization failed**

\`\`\`
$ERROR
\`\`\`

**Fix:** Run \`audit_fix\`, fix tests, remove \`blocked\`, re-run
EOF
)"
```

**Console:** `✗ Step 5/7: Failed` → STOP

---

### Step 6: Push & PR

**Push from within the worktree:**
```bash
git push -u origin "$BRANCH_NAME"
```

**Check if PR already exists (re-run case):**
```bash
EXISTING_PR=$(gh pr list --head "$BRANCH_NAME" --state open --json url -q '.[0].url')

if [ -n "$EXISTING_PR" ]; then
  # Re-run: PR exists, force-push updates
  PR_URL=$EXISTING_PR
  git push origin "$BRANCH_NAME" --force-with-lease
else
  # Fresh run: create PR
  PR_URL=$(gh pr create \
    --title "$ISSUE_TITLE" \
    --base main \
    --head "$BRANCH_NAME" \
    --body "$(cat <<EOF
## Summary

Closes #$ISSUE_NUMBER

Automated implementation via /issue-implement.

| Step | Result |
|------|--------|
| Import | Spec \`$SPEC_PATH\` |
| Worktree | \`$WORKTREE_PATH\` on \`$BRANCH_NAME\` |
| Review | $ITERATION_COUNT iterations |
| Implement | $PHASE_COUNT phases, $FILE_COUNT files |
| Finalize | Audit + tests passed |

## Files Changed
$FILES_CHANGED_LIST

## Test Plan
- [ ] Review code changes
- [ ] Verify CI passes
- [ ] Merge when approved (auto-closes #$ISSUE_NUMBER)
EOF
)")
fi
```

**Extract PR number:**
```bash
PR_NUMBER=$(echo "$PR_URL" | grep -oE '[0-9]+$')
```

**Comment on issue with PR link:**
```bash
gh issue comment $ISSUE_NUMBER --body "PR ready for review: $PR_URL"
```

**Console:** `✓ Step 6/7: PR created at $PR_URL`

**On push failure:**
```bash
gh issue edit $ISSUE_NUMBER --add-label "blocked"
gh issue comment $ISSUE_NUMBER --body "$(cat <<EOF
❌ **Step 6/7: Push failed**

\`\`\`
$ERROR
\`\`\`

**Manual push:**
\`\`\`bash
cd $WORKTREE_PATH
git push -u origin $BRANCH_NAME
\`\`\`

Remove \`blocked\` label after fixing, then re-run.
EOF
)"
```

**On PR creation failure (push succeeded):**
```bash
echo "⚠ Warning: Push succeeded but PR creation failed"
echo "  Create PR manually: gh pr create --head $BRANCH_NAME"
```

---

### Step 7: Review-Fix Loop

Combined review → fix → re-review loop. Ensures pr_reviewer always posts the final status comment.

```bash
MAX_REVIEW_FIX_LOOPS=3
LOOP_COUNT=0
TOTAL_ISSUES_FIXED=0
LOOP_STATUS="pending"
REVIEW_COMMENT_URL=""
```

**Loop:**
```
while LOOP_COUNT < MAX_REVIEW_FIX_LOOPS:

    LOOP_COUNT++

    ## 7a. Review
    mcp__ts-engineer__pr_reviewer pr="$PR_NUMBER" mode="review-fix"

    Parse output:
    - REVIEW_ISSUES — total issues found (issues_found)
    - REVIEW_CRITICAL — critical count (critical_count)
    - REVIEW_HIGH — high count (high_count)
    - REVIEW_COMMENT_URL — review comment URL (comment_url)

    ## 7b. Check if approved
    if REVIEW_CRITICAL == 0 AND REVIEW_HIGH == 0:
      LOOP_STATUS="approved"
      break

    ## 7c. Fix
    mcp__ts-engineer__pr_fixer pr="$PR_NUMBER" cwd="$WORKTREE_PATH"

    TOTAL_ISSUES_FIXED += FIXER_RESULT.issues_resolved

    Parse FIXER_RESULT.status:
      "success"        → continue (re-review to verify)
      "nothing_to_fix" → LOOP_STATUS="nothing_to_fix", break
      "failed"         → LOOP_STATUS="failed",         break
      "partial"        → continue (re-review remaining)

    ## 7d. Comment on issue per iteration
    gh issue comment $ISSUE_NUMBER --body "$(cat <<EOF
    🔄 **Step 7: Review-Fix iteration $LOOP_COUNT/$MAX_REVIEW_FIX_LOOPS**

    Review: $REVIEW_ISSUES issues (Critical: $REVIEW_CRITICAL, High: $REVIEW_HIGH)
    Fixer: $FIXER_RESULT.issues_resolved resolved this iteration
    Total fixed: $TOTAL_ISSUES_FIXED
    EOF
    )"
```

**After loop exits — final review:**

If loop exited via max iterations or fixer failure (not "approved"), run one final review to post accurate status:
```
if LOOP_STATUS != "approved":
    mcp__ts-engineer__pr_reviewer pr="$PR_NUMBER" mode="review-fix"
    Parse REVIEW_COMMENT_URL from result

    if REVIEW_CRITICAL == 0 AND REVIEW_HIGH == 0:
      LOOP_STATUS="approved"
    else:
      LOOP_STATUS="changes_requested"
```

**Quality gate summary:**
```bash
gh issue comment $ISSUE_NUMBER --body "$(cat <<EOF
📊 **Step 7: Review-Fix Loop**

$(if [ "$LOOP_STATUS" = "approved" ]; then
  echo "✅ PR approved — no critical/high issues"
elif [ "$LOOP_STATUS" = "changes_requested" ]; then
  echo "⚠️ Changes requested — issues remain after $MAX_REVIEW_FIX_LOOPS iterations"
elif [ "$LOOP_STATUS" = "nothing_to_fix" ]; then
  echo "⏭️ Nothing to fix"
else
  echo "❌ Fix loop failed"
fi)

Iterations: $LOOP_COUNT/$MAX_REVIEW_FIX_LOOPS
Total issues fixed: $TOTAL_ISSUES_FIXED
Review comment: $REVIEW_COMMENT_URL
EOF
)"
```

**Console:**
- Approved: `✓ Step 7: PR approved ($TOTAL_ISSUES_FIXED fixed in $LOOP_COUNT iterations)`
- Changes requested: `⚠ Step 7: $TOTAL_ISSUES_FIXED fixed but issues remain after $LOOP_COUNT iterations`
- Failed: `✗ Step 7: Fix loop failed`

**On reviewer failure:**
```bash
gh issue edit $ISSUE_NUMBER --add-label "blocked"
gh issue comment $ISSUE_NUMBER --body "$(cat <<EOF
❌ **Step 7: Review-Fix failed**

\`\`\`
$ERROR
\`\`\`

**Recovery:** Remove \`blocked\` label and re-run. Step 7 always runs fresh since it assesses current PR state.
EOF
)"
```

**Console:** `✗ Step 7: Failed` → STOP

---

### Cleanup: Deferred Actions

**After Step 7 completes:**

**Remove in-progress label:**
```bash
gh issue edit $ISSUE_NUMBER --remove-label "in-progress"
```

**Return to original directory:**
```bash
cd "$ORIGINAL_DIR"
```

---

## Re-Running After Failure

1. Issue has labels: `in-progress`, `blocked`
2. Fix reported error (in worktree if applicable)
3. Remove blocked: `gh issue edit N --remove-label "blocked"`
4. Re-run: `/issue-implement N`

Pipeline detects existing spec, worktree, and branch. Reuses them and continues.

**Re-run scenarios:**
- Existing branch + worktree → Reuses both, skips creation
- Existing branch, no worktree → Creates worktree, runs setup
- Existing PR → Force-pushes updates to same PR
- Step 7 always runs fresh since it assesses current PR state

---

## Final Output

```
═══════════════════════════════════════════════════════════════════
 ✅ IMPLEMENTATION COMPLETE
═══════════════════════════════════════════════════════════════════

Issue:     #$ISSUE_NUMBER — $ISSUE_URL
Spec:      $SPEC_PATH
Project:   $PROJECT
Worktree:  $WORKTREE_PATH
PR:        $PR_URL

  ✓ Import      → Spec created
  ✓ Worktree    → Isolated branch
  ✓ Review      → $ITERATION_COUNT iterations
  ✓ Implement   → $PHASE_COUNT phases, $FILE_COUNT files
  ✓ Finalize    → Passed
  ✓ Push & PR   → Ready for review
  ✓ Review-Fix  → $LOOP_STATUS ($TOTAL_ISSUES_FIXED fixed in $LOOP_COUNT iterations)

Worktree kept at $WORKTREE_PATH for fixes if needed.

═══════════════════════════════════════════════════════════════════
```

---

## Error Reference

| Step | Error | Fix | GitHub |
|------|-------|-----|--------|
| 0 | Not in repo root | `cd` to repo root | — |
| 0 | gh not auth | `gh auth login` | — |
| 0 | Dirty tree | Commit or stash | — |
| 1 | No args | Add issue number | — |
| 2 | Worktree setup | Manual setup in worktree | +blocked |
| 3 | Review BLOCKED | Edit spec | +blocked |
| 4 | Implementation | Fix, audit_fix | +blocked |
| 5 | Finalization | audit_fix, test | +blocked |
| 6 | Push failed | Manual push | +blocked |
| 6 | PR creation | Create manually (push OK) | Warning only |
| 7 | Review-Fix failed | Remove `blocked`, re-run | +blocked |
| 7 | Max iterations | Review remaining issues manually | Warning |

---

## Related

| Command | Purpose |
|---------|---------|
| `/issue-to-todo` | Import only |
| `/issue-capture` | Create issue |
| `/worktree-add` | Manual worktree management |
| `todo_reviewer` | Review only |
| `todo_code_writer` | Implement only |
| `finalize` | Finalize only |
| `audit_fix` | Fix violations |
| `pr_reviewer` | PR review only |
| `pr_fixer` | PR fix only |
