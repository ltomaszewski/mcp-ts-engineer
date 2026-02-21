#!/bin/bash
set -eo pipefail

# Resolve symlinks portably (macOS readlink has no -f flag)
resolve_symlink() {
  local target="$1"
  while [[ -L "$target" ]]; do
    local dir
    dir="$(cd "$(dirname "$target")" && pwd)"
    target="$(readlink "$target")"
    [[ "$target" != /* ]] && target="$dir/$target"
  done
  echo "$(cd "$(dirname "$target")" && pwd)"
}

SCRIPT_SOURCE="$(resolve_symlink "${BASH_SOURCE[0]}")"
WORKTREE_ROOT="$(cd "$SCRIPT_SOURCE/.." && pwd)"
cd "$WORKTREE_ROOT"

echo "Setting up worktree: $WORKTREE_ROOT"

# Step 1: Install dependencies
echo "Step 1/3: Installing dependencies..."
npm install

# Step 2: Build all workspace packages via turbo
echo "Step 2/3: Building workspace packages..."
npx turbo run build

# Step 3: Auto-detect and build non-turbo packages
echo "Step 3/3: Additional builds..."
# Scan for plugin packages with separate tsconfig (e.g., expo-live-activity)
for extra_tsconfig in packages/*/plugin/tsconfig.json; do
  [[ -f "$extra_tsconfig" ]] || continue
  echo "  Building: $extra_tsconfig"
  npx tsc --project "$extra_tsconfig"
done

# Source repo-specific extra steps if they exist
# NOTE: This executes in the current shell context — only source trusted files
if [[ -f "$WORKTREE_ROOT/scripts/setup-worktree-extra.sh" ]]; then
  echo "  Running repo-specific extra setup..."
  source "$WORKTREE_ROOT/scripts/setup-worktree-extra.sh"
fi

echo ""
echo "Worktree setup complete!"
