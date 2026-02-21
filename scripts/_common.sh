#!/bin/bash
set -eo pipefail

# =============================================================================
# _common.sh — Shared functions for mcp-ts-engineer scripts
# =============================================================================
# Source this file: source "$(dirname "${BASH_SOURCE[0]}")/_common.sh"

# --- Portable relative path (avoids python3 injection) ---
relpath() {
  python3 -c "import os.path,sys; print(os.path.relpath(sys.argv[1], sys.argv[2]))" "$1" "$2"
}

# --- Convert PascalCase to kebab-case: MyProjectTs → my-project-ts ---
# Mirrors deriveLogDir() in src/config/project-config.ts
to_kebab_case() {
  echo "$1" | sed -E 's/([a-z0-9])([A-Z])/\1-\2/g; s/([A-Z])([A-Z][a-z])/\1-\2/g' | tr '[:upper:]' '[:lower:]'
}

# --- Convert kebab-case to PascalCase: my-project → MyProject ---
to_pascal_case() {
  echo "$1" | sed 's/[-_]/ /g' | awk '{for(i=1;i<=NF;i++) $i=toupper(substr($i,1,1)) tolower(substr($i,2))}1' | tr -d ' '
}

# --- Detect monorepo root: walk up until we find workspaces, apps/, packages/, or .git ---
# Sets MONOREPO_ROOT variable. Exits with error if root resolves to /.
detect_monorepo_root() {
  local start_dir="${1:-$PWD}"
  MONOREPO_ROOT="$start_dir"
  while [[ "$MONOREPO_ROOT" != "/" ]]; do
    local parent
    parent="$(dirname "$MONOREPO_ROOT")"
    if [[ -f "$parent/package.json" ]] && grep -q '"workspaces"' "$parent/package.json" 2>/dev/null; then
      MONOREPO_ROOT="$parent"
      return 0
    fi
    if [[ -d "$parent/packages" ]] || [[ -d "$parent/apps" ]]; then
      MONOREPO_ROOT="$parent"
      return 0
    fi
    if [[ -d "$parent/.git" ]]; then
      MONOREPO_ROOT="$parent"
      return 0
    fi
    MONOREPO_ROOT="$parent"
  done

  if [[ "$MONOREPO_ROOT" == "/" ]]; then
    echo "ERROR: Could not detect monorepo root. Run from within a git repository."
    exit 1
  fi
}

# --- Read a field from package.json (jq preferred, node fallback) ---
read_pkg_field() {
  local pkg_file="$1"
  local field="$2"
  if command -v jq &>/dev/null; then
    jq -r "$field // \"\"" "$pkg_file" 2>/dev/null || echo ""
  else
    local js_field="${field#.}"
    PKG_FILE_ENV="$pkg_file" FIELD_ENV="$js_field" node -e "
      try {
        const p = JSON.parse(require('fs').readFileSync(process.env.PKG_FILE_ENV, 'utf8'));
        const v = p[process.env.FIELD_ENV];
        console.log(typeof v === 'object' ? JSON.stringify(v) : v || '');
      } catch(e) { console.log(''); }
    " 2>/dev/null || echo ""
  fi
}

# --- Idempotent symlink creation ---
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
}
