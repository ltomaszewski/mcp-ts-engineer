#!/bin/bash
set -eo pipefail

# =============================================================================
# bootstrap.sh — Scaffold monorepo + Claude Code environment for mcp-ts-engineer
# =============================================================================

# --- Portable relative path (avoids python3 injection) ---
relpath() {
  python3 -c "import os.path,sys; print(os.path.relpath(sys.argv[1], sys.argv[2]))" "$1" "$2"
}

# --- Parse arguments ---
REPO_OWNER=""
REPO_NAME_ARG=""

while [[ $# -gt 0 ]]; do
  case $1 in
    --repo-owner) REPO_OWNER="$2"; shift 2 ;;
    --repo-name)  REPO_NAME_ARG="$2"; shift 2 ;;
    *) echo "Unknown argument: $1"; exit 1 ;;
  esac
done

# --- Detect paths ---
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
SUBMODULE_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"

# Find monorepo root: walk up until we find workspaces, apps/, packages/, or .git
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

# Guard: never operate on filesystem root
if [[ "$MONOREPO_ROOT" == "/" ]]; then
  echo "ERROR: Could not detect monorepo root. Run from within a git repository."
  exit 1
fi

# Compute relative path from monorepo root to submodule
SUBMODULE_REL="$(relpath "$SUBMODULE_DIR" "$MONOREPO_ROOT")"

echo "Monorepo root: $MONOREPO_ROOT"
echo "Submodule:     $SUBMODULE_REL"

# --- Auto-detect project name ---
DIR_NAME="$(basename "$MONOREPO_ROOT")"

# Convert to PascalCase: my-project → MyProject
to_pascal_case() {
  echo "$1" | sed 's/[-_]/ /g' | awk '{for(i=1;i<=NF;i++) $i=toupper(substr($i,1,1)) tolower(substr($i,2))}1' | tr -d ' '
}

PASCAL_NAME="$(to_pascal_case "$DIR_NAME")"
REPO_NAME="$DIR_NAME"
SERVER_NAME="${PASCAL_NAME}TsEngineer"

echo "Project name:  $REPO_NAME ($PASCAL_NAME)"
echo "Server name:   $SERVER_NAME"

# --- Auto-detect repo owner/name from git remote ---
if [[ -z "$REPO_OWNER" ]] || [[ -z "$REPO_NAME_ARG" ]]; then
  REMOTE_URL="$(cd "$MONOREPO_ROOT" && git remote get-url origin 2>/dev/null || echo "")"
  if [[ -n "$REMOTE_URL" ]]; then
    PARSED="$(echo "$REMOTE_URL" | sed -E 's|.*github\.com[:/]([^/]+)/([^/]+?)(\.git)?$|\1/\2|')"
    if [[ -z "$REPO_OWNER" ]]; then
      REPO_OWNER="$(echo "$PARSED" | cut -d'/' -f1)"
    fi
    if [[ -z "$REPO_NAME_ARG" ]]; then
      REPO_NAME_ARG="$(echo "$PARSED" | cut -d'/' -f2)"
    fi
  fi
fi
echo "GitHub:        ${REPO_OWNER:-unknown}/${REPO_NAME_ARG:-unknown}"

# --- Derived values ---
BIN_PATH="${SUBMODULE_REL}/build/bin.js"
MCP_KEY="ts-engineer"
TEMPLATE_DIR="$SUBMODULE_DIR/templates/config"

cd "$MONOREPO_ROOT"

# =============================================================================
# Step 6: Scaffold monorepo root files
# =============================================================================
echo ""
echo "--- Scaffolding root files ---"

scaffold_file() {
  local dest="$1"
  local template="$2"
  if [[ -f "$dest" ]]; then
    echo "  Exists, skipping: $dest"
  else
    cp "$template" "$dest"
    echo "  Created: $dest"
  fi
}

# package.json — needs placeholder replacement
if [[ ! -f "package.json" ]]; then
  sed "s|{{REPO_NAME}}|$REPO_NAME|g" "$TEMPLATE_DIR/package.json.template" > package.json
  echo "  Created: package.json"
else
  echo "  Exists, skipping: package.json"
fi

# turbo.json
scaffold_file "turbo.json" "$TEMPLATE_DIR/turbo.json.template"

# tsconfig.json
scaffold_file "tsconfig.json" "$TEMPLATE_DIR/tsconfig.json.template"

# .gitignore
if [[ ! -f ".gitignore" ]]; then
  cp "$TEMPLATE_DIR/gitignore.template" ".gitignore"
  echo "  Created: .gitignore"
else
  echo "  Exists, skipping: .gitignore"
fi

# =============================================================================
# Step 7: Create directories
# =============================================================================
echo ""
echo "--- Creating directories ---"

for dir in apps packages .claude/commands .claude/skills .claude/rules .claude/contexts .claude/codemaps .claude/hooks scripts docs; do
  mkdir -p "$dir"
done
echo "  Directories ready"

# =============================================================================
# Step 8: Discover projects
# =============================================================================
echo ""
echo "--- Discovering projects ---"

PROJECTS=()
APPS=()
PACKAGES=()

for pkg_json in apps/*/package.json packages/*/package.json; do
  [[ -f "$pkg_json" ]] || continue
  proj_dir="$(dirname "$pkg_json")"
  proj_name="$(basename "$proj_dir")"

  # Skip the submodule itself
  if [[ "$proj_dir" == "$SUBMODULE_REL" ]] || [[ "$proj_name" == "mcp-ts-engineer" ]]; then
    continue
  fi

  PROJECTS+=("$proj_name")
  if [[ "$proj_dir" == apps/* ]]; then
    APPS+=("$proj_name")
  else
    PACKAGES+=("$proj_name")
  fi
  echo "  Found: $proj_dir"
done

if [[ ${#PROJECTS[@]} -eq 0 ]]; then
  echo "  No projects found (empty monorepo)"
fi

# =============================================================================
# Step 9: Create docs/specs/ per project
# =============================================================================
echo ""
echo "--- Creating spec directories ---"

for proj in "${PROJECTS[@]}"; do
  mkdir -p "docs/specs/$proj/todo"
  echo "  docs/specs/$proj/todo/"
done

# =============================================================================
# Step 10: Generate/merge .mcp.json
# =============================================================================
echo ""
echo "--- Configuring .mcp.json ---"

MCP_ENTRY="{\"type\":\"stdio\",\"command\":\"node\",\"args\":[\"$BIN_PATH\"],\"env\":{}}"

if [[ -f ".mcp.json" ]]; then
  # Merge: add ts-engineer entry if not present
  if command -v jq &>/dev/null; then
    if jq -e ".mcpServers[\"$MCP_KEY\"]" .mcp.json &>/dev/null; then
      echo "  .mcp.json already has '$MCP_KEY', skipping"
    else
      jq ".mcpServers[\"$MCP_KEY\"] = $MCP_ENTRY" .mcp.json > .mcp.json.tmp && mv .mcp.json.tmp .mcp.json
      echo "  Merged '$MCP_KEY' into .mcp.json"
    fi
  else
    # Fallback: use node with env vars to avoid injection
    MCP_KEY_ENV="$MCP_KEY" BIN_PATH_ENV="$BIN_PATH" node -e "
      const fs = require('fs');
      const key = process.env.MCP_KEY_ENV;
      const binPath = process.env.BIN_PATH_ENV;
      const mcp = JSON.parse(fs.readFileSync('.mcp.json', 'utf8'));
      if (!mcp.mcpServers[key]) {
        mcp.mcpServers[key] = {type:'stdio',command:'node',args:[binPath],env:{}};
        fs.writeFileSync('.mcp.json', JSON.stringify(mcp, null, 2) + '\n');
        console.log('  Merged ' + key + ' into .mcp.json');
      } else {
        console.log('  .mcp.json already has ' + key + ', skipping');
      }
    "
  fi
else
  sed "s|{{BIN_PATH}}|$BIN_PATH|g" "$TEMPLATE_DIR/mcp.json.template" > .mcp.json
  echo "  Created: .mcp.json"
fi

# =============================================================================
# Step 11: Generate ts-engineer.config.json
# =============================================================================
echo ""
echo "--- Configuring ts-engineer.config.json ---"

if [[ -f "ts-engineer.config.json" ]]; then
  echo "  Exists, skipping: ts-engineer.config.json"
else
  SERVER_NAME_LOWER="$(echo "$SERVER_NAME" | tr '[:upper:]' '[:lower:]')"

  # Build codemaps entries
  CODEMAPS_ENTRIES=""
  for proj in "${PROJECTS[@]}"; do
    if [[ -n "$CODEMAPS_ENTRIES" ]]; then
      CODEMAPS_ENTRIES="$CODEMAPS_ENTRIES,"$'\n'
    fi
    CODEMAPS_ENTRIES="$CODEMAPS_ENTRIES    { \"name\": \"$proj\", \"path\": \".claude/codemaps/$proj.md\" }"
  done
  # Add architecture codemap
  if [[ -n "$CODEMAPS_ENTRIES" ]]; then
    CODEMAPS_ENTRIES="$CODEMAPS_ENTRIES,"$'\n'
  fi
  CODEMAPS_ENTRIES="$CODEMAPS_ENTRIES    { \"name\": \"architecture\", \"path\": \".claude/codemaps/architecture.md\" }"

  # Replace single-line placeholders via sed, then multiline via python3 + env vars
  sed -e "s|{{SERVER_NAME_LOWER}}|$SERVER_NAME_LOWER|g" \
      -e "s|{{SERVER_NAME}}|$SERVER_NAME|g" \
      "$TEMPLATE_DIR/ts-engineer.config.json.template" > ts-engineer.config.json

  export _CODEMAPS_ENTRIES="$CODEMAPS_ENTRIES"
  python3 -c "
import os
content = open('ts-engineer.config.json').read()
content = content.replace('{{CODEMAPS_ENTRIES}}', os.environ.get('_CODEMAPS_ENTRIES', ''))
open('ts-engineer.config.json', 'w').write(content)
"
  unset _CODEMAPS_ENTRIES
  echo "  Created: ts-engineer.config.json"
fi

# =============================================================================
# Step 12: Generate CLAUDE.md
# =============================================================================
echo ""
echo "--- Generating CLAUDE.md ---"

if [[ -f "CLAUDE.md" ]]; then
  echo "  Exists, skipping: CLAUDE.md"
else
  # Build directory structure
  DIR_STRUCTURE="$REPO_NAME/"$'\n'
  for app in "${APPS[@]}"; do
    DIR_STRUCTURE+="├── apps/$app/"$'\n'
  done
  DIR_STRUCTURE+="├── packages/"$'\n'
  for pkg in "${PACKAGES[@]}"; do
    DIR_STRUCTURE+="│   ├── $pkg/"$'\n'
  done
  DIR_STRUCTURE+="│   └── mcp-ts-engineer/  (submodule)"$'\n'
  DIR_STRUCTURE+="├── docs/specs/"$'\n'
  DIR_STRUCTURE+="├── .claude/"$'\n'
  DIR_STRUCTURE+="├── package.json"$'\n'
  DIR_STRUCTURE+="├── turbo.json"$'\n'
  DIR_STRUCTURE+="└── tsconfig.json"

  # Build per-project commands
  PROJECT_COMMANDS=""
  for proj in "${PROJECTS[@]}"; do
    if [[ -d "apps/$proj" ]]; then
      WS="apps/$proj"
    else
      WS="packages/$proj"
    fi
    PROJECT_COMMANDS+="#### $proj (\`$WS\`)"$'\n'
    PROJECT_COMMANDS+='```bash'$'\n'
    PROJECT_COMMANDS+="npm run build -w $WS"$'\n'
    PROJECT_COMMANDS+="npm run test -w $WS"$'\n'
    PROJECT_COMMANDS+="npm run dev -w $WS"$'\n'
    PROJECT_COMMANDS+='```'$'\n\n'
  done

  # Build packages section
  PACKAGES_SECTION=""
  for pkg in "${PACKAGES[@]}"; do
    [[ "$pkg" == "mcp-ts-engineer" ]] && continue
    PKG_NAME="$(PKG_FILE_ENV="packages/$pkg/package.json" PKG_FALLBACK="$pkg" node -e "try{console.log(JSON.parse(require('fs').readFileSync(process.env.PKG_FILE_ENV,'utf8')).name)}catch(e){console.log(process.env.PKG_FALLBACK)}" 2>/dev/null || echo "$pkg")"
    PACKAGES_SECTION+="### $pkg"$'\n'
    PACKAGES_SECTION+="- Workspace: \`packages/$pkg\`"$'\n'
    PACKAGES_SECTION+="- Package name: \`$PKG_NAME\`"$'\n\n'
  done

  if [[ -z "$PACKAGES_SECTION" ]]; then
    PACKAGES_SECTION="_No shared packages yet._"$'\n'
  fi

  # Build skills listing
  SKILLS_LISTING=""
  if [[ -d "$SUBMODULE_DIR/.claude/skills" ]]; then
    for skill_dir in "$SUBMODULE_DIR/.claude/skills"/*/; do
      [[ -d "$skill_dir" ]] || continue
      skill_name="$(basename "$skill_dir")"
      SKILLS_LISTING+="- \`$skill_name\`"$'\n'
    done
  fi
  if [[ -z "$SKILLS_LISTING" ]]; then
    SKILLS_LISTING="_No skills available._"$'\n'
  fi

  # Build codemaps table
  CODEMAPS_TABLE="| Codemap | Path |"$'\n'
  CODEMAPS_TABLE+="|---------|------|"$'\n'
  CODEMAPS_TABLE+="| architecture | \`.claude/codemaps/architecture.md\` |"$'\n'
  for proj in "${PROJECTS[@]}"; do
    CODEMAPS_TABLE+="| $proj | \`.claude/codemaps/$proj.md\` |"$'\n'
  done

  # Read template and replace placeholders
  TEMPLATE="$(cat "$TEMPLATE_DIR/CLAUDE.md.template")"
  TEMPLATE="${TEMPLATE//\{\{PROJECT_NAME\}\}/$PASCAL_NAME}"
  TEMPLATE="${TEMPLATE//\{\{MCP_KEY\}\}/$MCP_KEY}"

  # Write template, then replace multiline placeholders via environment variables
  echo "$TEMPLATE" > CLAUDE.md

  export _DIR_STRUCTURE="$DIR_STRUCTURE"
  export _PROJECT_COMMANDS="$PROJECT_COMMANDS"
  export _PACKAGES_SECTION="$PACKAGES_SECTION"
  export _SKILLS_LISTING="$SKILLS_LISTING"
  export _CODEMAPS_TABLE="$CODEMAPS_TABLE"

  python3 -c "
import os
content = open('CLAUDE.md').read()
replacements = {
    '{{DIRECTORY_STRUCTURE}}': os.environ.get('_DIR_STRUCTURE', ''),
    '{{PROJECT_COMMANDS}}': os.environ.get('_PROJECT_COMMANDS', ''),
    '{{PACKAGES_SECTION}}': os.environ.get('_PACKAGES_SECTION', ''),
    '{{SKILLS_LISTING}}': os.environ.get('_SKILLS_LISTING', ''),
    '{{CODEMAPS_TABLE}}': os.environ.get('_CODEMAPS_TABLE', ''),
}
for k, v in replacements.items():
    content = content.replace(k, v)
open('CLAUDE.md', 'w').write(content)
"

  unset _DIR_STRUCTURE _PROJECT_COMMANDS _PACKAGES_SECTION _SKILLS_LISTING _CODEMAPS_TABLE
  echo "  Created: CLAUDE.md"
fi

# =============================================================================
# Step 13: Symlink setup-worktree.sh
# =============================================================================
echo ""
echo "--- Symlinking scripts ---"

WORKTREE_SCRIPT_REL="$(relpath "$SUBMODULE_DIR/scripts/setup-worktree.sh" "$MONOREPO_ROOT/scripts")"

if [[ -L "scripts/setup-worktree.sh" ]]; then
  echo "  Exists (symlink), skipping: scripts/setup-worktree.sh"
elif [[ -f "scripts/setup-worktree.sh" ]]; then
  echo "  WARNING: scripts/setup-worktree.sh exists as regular file, not overwriting"
else
  ln -s "$WORKTREE_SCRIPT_REL" scripts/setup-worktree.sh
  echo "  Symlinked: scripts/setup-worktree.sh"
fi

# =============================================================================
# Step 14-17: Symlink .claude/ content
# =============================================================================
echo ""
echo "--- Symlinking .claude/ content ---"

# Helper: create symlink for a file
symlink_file() {
  local src="$1"
  local dest="$2"
  local dest_dir
  dest_dir="$(dirname "$dest")"
  local rel_src
  rel_src="$(relpath "$src" "$dest_dir")"

  if [[ -L "$dest" ]]; then
    return 0  # Already a symlink
  elif [[ -f "$dest" ]]; then
    echo "  WARNING: $dest exists as regular file, skipping"
    return 0
  fi
  ln -s "$rel_src" "$dest"
}

# Commands
COMMANDS_LINKED=0
for cmd_file in "$SUBMODULE_DIR/.claude/commands"/*.md; do
  [[ -f "$cmd_file" ]] || continue
  cmd_name="$(basename "$cmd_file")"
  symlink_file "$cmd_file" ".claude/commands/$cmd_name"
  COMMANDS_LINKED=$((COMMANDS_LINKED + 1))
done
echo "  Commands: $COMMANDS_LINKED symlinked"

# Rules
RULES_LINKED=0
for rule_file in "$SUBMODULE_DIR/.claude/rules"/*.md; do
  [[ -f "$rule_file" ]] || continue
  rule_name="$(basename "$rule_file")"
  symlink_file "$rule_file" ".claude/rules/$rule_name"
  RULES_LINKED=$((RULES_LINKED + 1))
done
echo "  Rules: $RULES_LINKED symlinked"

# Contexts
CONTEXTS_LINKED=0
for ctx_file in "$SUBMODULE_DIR/.claude/contexts"/*.md; do
  [[ -f "$ctx_file" ]] || continue
  ctx_name="$(basename "$ctx_file")"
  symlink_file "$ctx_file" ".claude/contexts/$ctx_name"
  CONTEXTS_LINKED=$((CONTEXTS_LINKED + 1))
done
echo "  Contexts: $CONTEXTS_LINKED symlinked"

# Skills (symlink per directory)
SKILLS_LINKED=0
for skill_dir in "$SUBMODULE_DIR/.claude/skills"/*/; do
  [[ -d "$skill_dir" ]] || continue
  skill_name="$(basename "$skill_dir")"
  dest=".claude/skills/$skill_name"
  if [[ -L "$dest" ]]; then
    continue
  elif [[ -d "$dest" ]]; then
    echo "  WARNING: .claude/skills/$skill_name exists as regular directory, skipping"
    continue
  fi
  rel_src="$(relpath "$skill_dir" ".claude/skills")"
  ln -s "$rel_src" "$dest"
  SKILLS_LINKED=$((SKILLS_LINKED + 1))
done
echo "  Skills: $SKILLS_LINKED symlinked"

# =============================================================================
# Step 18: Generate codemaps
# =============================================================================
echo ""
echo "--- Generating codemaps ---"

# Helper: check if jq is available
HAS_JQ=false
if command -v jq &>/dev/null; then
  HAS_JQ=true
fi

read_pkg_field() {
  local pkg_file="$1"
  local field="$2"
  if $HAS_JQ; then
    jq -r "$field // \"\"" "$pkg_file" 2>/dev/null || echo ""
  else
    # Convert jq path to JS property: .name → name, .description → description
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

for proj in "${PROJECTS[@]}"; do
  CODEMAP_FILE=".claude/codemaps/$proj.md"
  if [[ -f "$CODEMAP_FILE" ]]; then
    echo "  Exists, skipping: $CODEMAP_FILE"
    continue
  fi

  if [[ -d "apps/$proj" ]]; then
    PROJ_DIR="apps/$proj"
  else
    PROJ_DIR="packages/$proj"
  fi

  PKG_FILE="$PROJ_DIR/package.json"
  [[ -f "$PKG_FILE" ]] || continue

  PKG_NAME="$(read_pkg_field "$PKG_FILE" ".name")"
  PKG_DESC="$(read_pkg_field "$PKG_FILE" ".description")"
  [[ -z "$PKG_DESC" ]] && PKG_DESC="No description"

  # Get dependencies
  DEPS=""
  if $HAS_JQ; then
    DEPS="$(jq -r '.dependencies // {} | keys[]' "$PKG_FILE" 2>/dev/null | head -20 | sed 's/^/- /')"
    DEV_DEPS="$(jq -r '.devDependencies // {} | keys[]' "$PKG_FILE" 2>/dev/null | head -10 | sed 's/^/- /')"
  else
    DEPS="$(PKG_FILE_ENV="$PKG_FILE" node -e "try{const p=JSON.parse(require('fs').readFileSync(process.env.PKG_FILE_ENV,'utf8'));Object.keys(p.dependencies||{}).slice(0,20).forEach(d=>console.log('- '+d))}catch(e){}" 2>/dev/null)"
    DEV_DEPS="$(PKG_FILE_ENV="$PKG_FILE" node -e "try{const p=JSON.parse(require('fs').readFileSync(process.env.PKG_FILE_ENV,'utf8'));Object.keys(p.devDependencies||{}).slice(0,10).forEach(d=>console.log('- '+d))}catch(e){}" 2>/dev/null)"
  fi

  # Scan directory structure (macOS-compatible flag order)
  DIR_TREE=""
  if [[ -d "$PROJ_DIR/src" ]]; then
    DIR_TREE="$(find "$PROJ_DIR/src" -maxdepth 3 -type d 2>/dev/null | sed "s|$PROJ_DIR/||" | sort)"
  fi

  cat > "$CODEMAP_FILE" << CMEOF
# $PKG_NAME

$PKG_DESC

## Location

\`$PROJ_DIR\`

## Directory Structure

\`\`\`
${DIR_TREE:-"(no src/ directory found)"}
\`\`\`

## Dependencies

${DEPS:-"(none)"}

## Dev Dependencies

${DEV_DEPS:-"(none)"}
CMEOF
  echo "  Created: $CODEMAP_FILE"
done

# Architecture codemap
ARCH_FILE=".claude/codemaps/architecture.md"
if [[ ! -f "$ARCH_FILE" ]]; then
  # Build apps list
  APPS_LIST=""
  if [[ ${#APPS[@]} -gt 0 ]]; then
    for app in "${APPS[@]}"; do
      APPS_LIST+="- \`apps/$app\`"$'\n'
    done
  else
    APPS_LIST="_(none)_"$'\n'
  fi

  # Build packages list
  PKGS_LIST=""
  for pkg in "${PACKAGES[@]}"; do
    PKGS_LIST+="- \`packages/$pkg\`"$'\n'
  done
  PKGS_LIST+="- \`packages/mcp-ts-engineer\` (submodule — MCP server)"$'\n'

  cat > "$ARCH_FILE" << ARCHEOF
# $PASCAL_NAME Architecture

Turborepo monorepo with npm workspaces.

## Apps

$APPS_LIST
## Packages

$PKGS_LIST
## Infrastructure

- **Build**: Turborepo (\`turbo.json\`)
- **Package Manager**: npm workspaces
- **MCP Server**: \`$SUBMODULE_REL\` → key: \`$MCP_KEY\`
- **Specs**: \`docs/specs/{project}/todo/\`
- **Codemaps**: \`.claude/codemaps/\`

## Workflow

1. Capture issue: \`/issue-capture\`
2. Import spec: \`/issue-to-todo\`
3. Review: \`mcp__ts-engineer__todo_reviewer\`
4. Implement: \`mcp__ts-engineer__todo_code_writer\`
5. Finalize: \`mcp__ts-engineer__finalize\`
6. PR: \`/issue-implement\`
ARCHEOF
  echo "  Created: $ARCH_FILE"
else
  echo "  Exists, skipping: $ARCH_FILE"
fi

# =============================================================================
# Step 19: Install root dependencies (must run before submodule build so
#          lifecycle scripts like husky are available)
# =============================================================================
echo ""
echo "--- Installing root dependencies ---"

npm install
echo "  Root dependencies installed"

# =============================================================================
# Step 20: Build submodule
# =============================================================================
echo ""
echo "--- Building submodule ---"

(cd "$SUBMODULE_DIR" && npm run build)
echo "  Submodule built"

# =============================================================================
# Step 21: Setup GitHub labels
# =============================================================================
echo ""
echo "--- Setting up GitHub labels ---"

if command -v gh &>/dev/null && gh auth status &>/dev/null 2>&1; then
  bash "$SUBMODULE_DIR/scripts/setup-issue-labels.sh" 2>/dev/null || echo "  Labels setup skipped (script not found or failed)"
else
  echo "  Skipping labels (gh not authenticated)"
fi

# =============================================================================
# Summary
# =============================================================================
echo ""
echo "============================================="
echo "  Bootstrap complete!"
echo "============================================="
echo ""
echo "  Monorepo:    $REPO_NAME"
echo "  Server:      $SERVER_NAME"
echo "  MCP key:     $MCP_KEY"
echo "  Projects:    ${#PROJECTS[@]} discovered"
echo ""
echo "  Generated:"
echo "    - package.json, turbo.json, tsconfig.json, .gitignore"
echo "    - .mcp.json, ts-engineer.config.json, CLAUDE.md"
echo "    - .claude/ symlinks (commands, skills, rules, contexts)"
echo "    - .claude/codemaps/ (per project)"
echo "    - docs/specs/ (per project)"
echo "    - scripts/setup-worktree.sh (symlink)"
echo ""
echo "  Next steps:"
echo "    git add -A && git commit -m \"chore: initial monorepo setup\""
echo ""
