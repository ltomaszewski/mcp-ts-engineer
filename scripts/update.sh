#!/bin/bash
set -eo pipefail

# =============================================================================
# update.sh — Re-sync host repo after submodule update
# =============================================================================

# --- Detect paths ---
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
SUBMODULE_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"

# --- Source shared functions ---
source "$SCRIPT_DIR/_common.sh"

# --- Detect monorepo root ---
detect_monorepo_root "$SUBMODULE_DIR"

SUBMODULE_REL="$(relpath "$SUBMODULE_DIR" "$MONOREPO_ROOT")"

echo "Monorepo root: $MONOREPO_ROOT"
echo "Submodule:     $SUBMODULE_REL"

cd "$MONOREPO_ROOT"

# --- Ensure directories exist ---
mkdir -p .claude/commands .claude/skills .claude/rules .claude/contexts .claude/codemaps .claude/hooks .claude/knowledge-base .claude/agents

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

# --- Update knowledge-base symlinks ---
echo ""
echo "--- Updating knowledge-base symlinks ---"
for kb_file in "$SUBMODULE_DIR/.claude/knowledge-base"/*.md; do
  [[ -f "$kb_file" ]] || continue
  kb_name="$(basename "$kb_file")"
  symlink_file "$kb_file" ".claude/knowledge-base/$kb_name"
done

# --- Update agent symlinks ---
echo ""
echo "--- Updating agent symlinks ---"
for agent_file in "$SUBMODULE_DIR/.claude/agents"/*.md; do
  [[ -f "$agent_file" ]] || continue
  agent_name="$(basename "$agent_file")"
  symlink_file "$agent_file" ".claude/agents/$agent_name"
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

  [[ "$proj_name" == "mcp-ts-engineer" || "$proj_name" == "claude-code" ]] && continue

  if [[ ! -d "docs/specs/$proj_name/todo" ]]; then
    mkdir -p "docs/specs/$proj_name/todo"
    echo "  NEW: docs/specs/$proj_name/todo/"
  fi
done

# --- Ensure MCP tool permissions ---
echo ""
echo "--- Ensuring MCP tool permissions ---"

MCP_KEY="ts-engineer"
ensure_mcp_permissions "$MCP_KEY" ".claude/settings.local.json"

# --- Rebuild submodule ---
echo ""
echo "--- Rebuilding submodule ---"
(cd "$SUBMODULE_DIR" && npm install && npm run build)

echo ""
echo "Update complete!"
echo "Run 'git status' to see changes."
