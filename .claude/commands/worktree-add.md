# /worktree-add

Create git worktree for isolated development. Auto-cleans merged worktrees.

$ARGUMENTS

---

<context>
- Path: `.worktrees/<slug>`
- Branch: `claude/<slug>-<random5>` (random5 = 5 chars from a-z0-9)
- Repo type: Monorepo (requires setup after creation)
</context>

<rules>
NEVER remove unless: PR is MERGED **and** worktree is clean
NEVER create unless: main is clean and updated
ALWAYS: gather all state before any destructive action
ALWAYS: report every worktree (Removed/Skipped/Kept)
</rules>

<phase1_cleanup>

## 1. List Worktrees
```bash
git worktree list | grep "\.worktrees/"
```
No output → skip to Phase 2

## 2. For Each Worktree, Collect:

| Data | Command | Parse |
|------|---------|-------|
| branch | (from list output) | Text in `[brackets]`; skip if `(detached HEAD)` |
| pr | `gh pr list --head <branch> --state all --json number,state --limit 1` | `[0].state` or null |
| dirty | `git -C <path> status --porcelain` | non-empty = dirty |

## 3. After Collecting ALL, Apply:

```
         ┌─ MERGED ─┬─ clean → REMOVE
PR state─┤          └─ dirty → SKIP (warn)
         └─ other ──────────→ KEEP
```

**REMOVE commands:**
```bash
git worktree remove <path> --force
git branch -D <branch>
git push origin --delete <branch> 2>/dev/null || true
```

</phase1_cleanup>

<phase2_create>

## 1. Validate Input
Empty `$ARGUMENTS` → ask: "What is the purpose of this worktree?"

## 2. Generate Slug
`$ARGUMENTS` → lowercase → `[^a-z0-9]` to `-` → collapse `--` → trim `-` → max 30 chars

## 3. Update Main
```bash
git checkout main && git pull origin main
```
Dirty main → stop with error

## 4. Create
```bash
git worktree add .worktrees/<slug> -b claude/<slug>-<random5>
```
Path exists → new random5 → retry

## 5. Run Setup Script (MANDATORY — NEVER SKIP)
```bash
cd .worktrees/<slug> && echo "n" | ./scripts/setup-worktree.sh
```
This step is REQUIRED. ALWAYS run it. No exceptions.

</phase2_create>

<output>
```
Cleanup:
  Removed: .worktrees/foo (PR #12 merged)
  Skipped: .worktrees/bar (uncommitted changes)
  Kept: .worktrees/baz (PR #8 closed)
  Kept: .worktrees/qux (PR #15 open)
  Kept: .worktrees/xyz (no PR)

Created:
  Path: .worktrees/<slug>
  Branch: claude/<slug>-<random5>
  Setup: ✅ scripts/setup-worktree.sh completed
```

- Omit `Cleanup:` if no worktrees exist
- Order: Removed → Skipped → Kept
</output>

<errors>
| Condition | Action |
|-----------|--------|
| No arguments | Ask: "What is the purpose of this worktree?" |
| Main dirty | Stop: "Main has uncommitted changes. Run `git stash` or commit first." |
| Path exists | Regenerate random suffix, retry |
| `gh` fails | Treat as no PR |
| Remove fails | Warn, continue to next |
| Create fails | Stop, show git error |
</errors>
</output>
