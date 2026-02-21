#!/bin/bash
set -eo pipefail

# =============================================================================
# setup-issue-labels.sh — Create GitHub issue labels for monorepo projects
# =============================================================================

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
  echo "ERROR: Could not detect monorepo root."
  exit 1
fi

cd "$MONOREPO_ROOT"

# --- Verify gh auth ---
if ! command -v gh &>/dev/null; then
  echo "Error: gh CLI not found. Install: brew install gh"
  exit 1
fi

if ! gh auth status &>/dev/null 2>&1; then
  echo "Error: Not authenticated. Run: gh auth login"
  exit 1
fi

echo "Setting up GitHub labels..."

# --- Project labels ---
for pkg_json in apps/*/package.json packages/*/package.json; do
  [[ -f "$pkg_json" ]] || continue
  proj_name="$(basename "$(dirname "$pkg_json")")"
  [[ "$proj_name" == "mcp-ts-engineer" ]] && continue
  gh label create "project:$proj_name" --color "0075CA" --force 2>/dev/null || true
  echo "  project:$proj_name"
done

# Add monorepo label
gh label create "project:monorepo" --color "0075CA" --force 2>/dev/null || true
echo "  project:monorepo"

# --- Type labels (bash 3.2 compatible — no associative arrays) ---
for pair in \
  "type:feature 1D76DB" \
  "type:bug D73A4A" \
  "type:refactor A2EEEF" \
  "type:perf FBCA04" \
  "type:chore EDEDED"; do
  label="${pair% *}"
  color="${pair#* }"
  gh label create "$label" --color "$color" --force 2>/dev/null || true
  echo "  $label"
done

# --- Status labels ---
for pair in \
  "status:draft E4E669" \
  "status:ready 0E8A16" \
  "in-progress 0E8A16" \
  "blocked D93F0B"; do
  label="${pair% *}"
  color="${pair#* }"
  gh label create "$label" --color "$color" --force 2>/dev/null || true
  echo "  $label"
done

# --- Priority labels ---
for pair in \
  "priority:critical B60205" \
  "priority:high D93F0B" \
  "priority:medium FBCA04" \
  "priority:low 0E8A16"; do
  label="${pair% *}"
  color="${pair#* }"
  gh label create "$label" --color "$color" --force 2>/dev/null || true
  echo "  $label"
done

echo ""
echo "Labels setup complete!"
