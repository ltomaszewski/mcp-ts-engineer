#!/bin/bash
set -eo pipefail

# =============================================================================
# update.sh — Re-sync host repo after submodule update
# =============================================================================

# --- Portable relative path ---
relpath() {
  python3 -c "import os.path,sys; print(os.path.relpath(sys.argv[1], sys.argv[2]))" "$1" "$2"
}

# --- Detect paths ---
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
SUBMODULE_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"

# Find monorepo root (same algorithm as bootstrap.sh)
MONOREPO_ROOT="$SUBMODULE_DIR"
while [[ "$MONOREPO_ROOT" != "/" ]]; do
  PARENT="$(dirname "$MONOREPO_ROOT")"
  if [[ -f "$PARENT/package.json" ]] && grep -q '"workspaces"' "$PARENT/package.json" 2>/dev/null; then
    MONOREPO_ROOT="$PARENT"
    break
  fi
  if [[ -d "$PARENT/packages" ]] || [[ -d "$PARENT/apps" ]]; then
    MONOREPO_ROOT="$PARENT"
    break
  fi
  if [[ -d "$PARENT/.git" ]]; then
    MONOREPO_ROOT="$PARENT"
    break
  fi
  MONOREPO_ROOT="$PARENT"
done

if [[ "$MONOREPO_ROOT" == "/" ]]; then
  echo "ERROR: Could not detect monorepo root. Run from within a git repository."
  exit 1
fi

SUBMODULE_REL="$(relpath "$SUBMODULE_DIR" "$MONOREPO_ROOT")"

echo "Monorepo root: $MONOREPO_ROOT"
echo "Submodule:     $SUBMODULE_REL"

cd "$MONOREPO_ROOT"

# --- Ensure directories exist ---
mkdir -p .claude/commands .claude/skills .claude/rules .claude/contexts .claude/codemaps .claude/hooks

# --- Helper: create symlink ---
symlink_file() {
  local src="$1"
  local dest="$2"
  local dest_dir
  dest_dir="$(dirname "$dest")"
  local rel_src
  rel_src="$(relpath "$src" "$dest_dir")"

  if [[ -L "$dest" ]]; then
    return 0
  elif [[ -f "$dest" ]] || [[ -d "$dest" ]]; then
    echo "  WARNING: $dest exists as regular file/dir, skipping"
    return 0
  fi
  ln -s "$rel_src" "$dest"
  echo "  NEW: $dest"
}

# --- Update command symlinks ---
echo ""
echo "--- Updating command symlinks ---"
for cmd_file in "$SUBMODULE_DIR/.claude/commands"/*.md; do
  [[ -f "$cmd_file" ]] || continue
  cmd_name="$(basename "$cmd_file")"
  symlink_file "$cmd_file" ".claude/commands/$cmd_name"
done

# --- Update rule symlinks ---
echo ""
echo "--- Updating rule symlinks ---"
for rule_file in "$SUBMODULE_DIR/.claude/rules"/*.md; do
  [[ -f "$rule_file" ]] || continue
  rule_name="$(basename "$rule_file")"
  symlink_file "$rule_file" ".claude/rules/$rule_name"
done

# --- Update context symlinks ---
echo ""
echo "--- Updating context symlinks ---"
for ctx_file in "$SUBMODULE_DIR/.claude/contexts"/*.md; do
  [[ -f "$ctx_file" ]] || continue
  ctx_name="$(basename "$ctx_file")"
  symlink_file "$ctx_file" ".claude/contexts/$ctx_name"
done

# --- Update skill symlinks ---
echo ""
echo "--- Updating skill symlinks ---"
for skill_dir in "$SUBMODULE_DIR/.claude/skills"/*/; do
  [[ -d "$skill_dir" ]] || continue
  skill_name="$(basename "$skill_dir")"
  dest=".claude/skills/$skill_name"
  if [[ -L "$dest" ]]; then
    continue
  elif [[ -d "$dest" ]]; then
    echo "  WARNING: $dest exists as regular directory, skipping"
    continue
  fi
  rel_src="$(relpath "$skill_dir" ".claude/skills")"
  ln -s "$rel_src" "$dest"
  echo "  NEW: .claude/skills/$skill_name"
done

# --- Re-check setup-worktree.sh symlink ---
echo ""
echo "--- Checking setup-worktree.sh symlink ---"
WORKTREE_SCRIPT_DEST="scripts/setup-worktree.sh"
if [[ -L "$WORKTREE_SCRIPT_DEST" ]]; then
  : # symlink exists
elif [[ -f "$WORKTREE_SCRIPT_DEST" ]]; then
  echo "  WARNING: $WORKTREE_SCRIPT_DEST exists as regular file, skipping"
else
  mkdir -p scripts
  WORKTREE_SCRIPT_SRC="$SUBMODULE_DIR/scripts/setup-worktree.sh"
  if [[ -f "$WORKTREE_SCRIPT_SRC" ]]; then
    WORKTREE_REL="$(relpath "$WORKTREE_SCRIPT_SRC" "scripts")"
    ln -s "$WORKTREE_REL" "$WORKTREE_SCRIPT_DEST"
    echo "  NEW: $WORKTREE_SCRIPT_DEST"
  fi
fi

# --- Discover new projects ---
echo ""
echo "--- Checking for new projects ---"
for pkg_json in apps/*/package.json packages/*/package.json; do
  [[ -f "$pkg_json" ]] || continue
  proj_dir="$(dirname "$pkg_json")"
  proj_name="$(basename "$proj_dir")"

  [[ "$proj_name" == "mcp-ts-engineer" ]] && continue

  if [[ ! -d "docs/specs/$proj_name/todo" ]]; then
    mkdir -p "docs/specs/$proj_name/todo"
    echo "  NEW: docs/specs/$proj_name/todo/"
  fi
done

# --- Rebuild submodule ---
echo ""
echo "--- Rebuilding submodule ---"
(cd "$SUBMODULE_DIR" && npm install && npm run build)

echo ""
echo "Update complete!"
echo "Run 'git status' to see changes."
