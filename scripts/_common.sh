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

# --- Ensure MCP tool permissions in .claude/settings.local.json ---
# Adds allow entries for all public MCP capabilities so they execute without
# permission prompts (headless/autonomous mode).
#
# Arguments:
#   $1 — MCP key (e.g. "ts-engineer"), used to build "mcp__<key>__<id>" tool names
#   $2 — Path to settings.local.json (relative to cwd)
#
# Public capability IDs are listed here. When a new public capability is added
# to src/capabilities/, add its id to this list.
ensure_mcp_permissions() {
  local mcp_key="$1"
  local settings_file="$2"

  # All public MCP capability IDs (visibility != 'internal')
  local capability_ids=(
    echo_agent
    audit_fix
    todo_reviewer
    todo_code_writer
    finalize
    pr_reviewer
    pr_fixer
  )

  # Build fully-qualified tool names: mcp__<key>__<id>
  local mcp_tools=()
  for id in "${capability_ids[@]}"; do
    mcp_tools+=("mcp__${mcp_key}__${id}")
  done

  local has_jq=false
  command -v jq &>/dev/null && has_jq=true

  if [[ -f "$settings_file" ]]; then
    # File exists — merge missing permissions
    local added=0
    for tool in "${mcp_tools[@]}"; do
      if $has_jq; then
        if ! jq -e ".permissions.allow | index(\"$tool\")" "$settings_file" &>/dev/null; then
          jq ".permissions.allow += [\"$tool\"]" "$settings_file" > "${settings_file}.tmp" \
            && mv "${settings_file}.tmp" "$settings_file"
          added=$((added + 1))
        fi
      else
        local result
        result=$(TOOL_ENV="$tool" SETTINGS_ENV="$settings_file" node -e "
          const fs = require('fs');
          const tool = process.env.TOOL_ENV;
          const path = process.env.SETTINGS_ENV;
          const s = JSON.parse(fs.readFileSync(path, 'utf8'));
          if (!s.permissions) s.permissions = {};
          if (!s.permissions.allow) s.permissions.allow = [];
          if (!s.permissions.allow.includes(tool)) {
            s.permissions.allow.push(tool);
            fs.writeFileSync(path, JSON.stringify(s, null, 2) + '\n');
            process.stdout.write('added');
          }
        " 2>/dev/null || echo "")
        [[ "$result" == "added" ]] && added=$((added + 1))
      fi
    done
    if [[ $added -gt 0 ]]; then
      echo "  Added $added MCP tool permissions to $settings_file"
    else
      echo "  All MCP tool permissions already configured"
    fi
  else
    # File doesn't exist — create with MCP permissions
    if $has_jq; then
      local tools_json
      tools_json=$(printf '%s\n' "${mcp_tools[@]}" | jq -R . | jq -s .)
      jq -n --argjson tools "$tools_json" \
        '{permissions:{allow:$tools,deny:[],ask:[]}}' > "$settings_file"
    else
      TOOLS_JSON_ENV="$(printf '"%s",' "${mcp_tools[@]}" | sed 's/,$//')" \
      SETTINGS_ENV="$settings_file" node -e "
        const fs = require('fs');
        const tools = JSON.parse('[' + process.env.TOOLS_JSON_ENV + ']');
        fs.writeFileSync(process.env.SETTINGS_ENV,
          JSON.stringify({permissions:{allow:tools,deny:[],ask:[]}}, null, 2) + '\n');
      "
    fi
    echo "  Created: $settings_file with ${#mcp_tools[@]} MCP tool permissions"
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
    # Recreate if symlink is broken or points to wrong target
    local current_target
    current_target="$(readlink "$dest")"
    if [[ "$current_target" == "$rel_src" ]] && [[ -e "$dest" ]]; then
      return 0
    fi
    rm "$dest"
    ln -s "$rel_src" "$dest"
    echo "  FIXED: $dest -> $rel_src"
    return 0
  elif [[ -f "$dest" ]] || [[ -d "$dest" ]]; then
    echo "  WARNING: $dest exists as regular file/dir, skipping"
    return 0
  fi
  ln -s "$rel_src" "$dest"
}
