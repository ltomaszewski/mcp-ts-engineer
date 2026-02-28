#!/bin/bash
set -eo pipefail

# =============================================================================
# create-app.sh — Scaffold a new app in the monorepo from a template
# =============================================================================
# Usage:
#   bash packages/mcp-ts-engineer/scripts/create-app.sh \
#     --type expo-app --name my-mobile-app [--port 3001]

# --- Detect paths ---
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
SUBMODULE_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"

# --- Source shared functions ---
source "$SCRIPT_DIR/_common.sh"

# --- Parse arguments ---
APP_TYPE=""
APP_NAME=""
PORT="3001"

while [[ $# -gt 0 ]]; do
  case $1 in
    --type) APP_TYPE="$2"; shift 2 ;;
    --name) APP_NAME="$2"; shift 2 ;;
    --port) PORT="$2"; shift 2 ;;
    *) echo "Unknown argument: $1"; echo "Usage: create-app.sh --type <type> --name <name> [--port <port>]"; exit 1 ;;
  esac
done

# --- Detect monorepo root ---
detect_monorepo_root "$SUBMODULE_DIR"

echo "Monorepo root: $MONOREPO_ROOT"

# --- Validate registry ---
REGISTRY_FILE="$SUBMODULE_DIR/templates/apps/registry.json"
if [[ ! -f "$REGISTRY_FILE" ]]; then
  echo "ERROR: Registry not found at $REGISTRY_FILE"
  echo "Run bootstrap.sh first."
  exit 1
fi

# --- Validate --type ---
if [[ -z "$APP_TYPE" ]]; then
  echo "ERROR: --type is required"
  echo ""
  echo "Available app types:"
  if command -v jq &>/dev/null; then
    jq -r '.appTypes | to_entries[] | "  \(.key) — \(.value.label): \(.value.description)"' "$REGISTRY_FILE"
  else
    node -e "
      const r = JSON.parse(require('fs').readFileSync('$REGISTRY_FILE', 'utf8'));
      for (const [k, v] of Object.entries(r.appTypes)) {
        console.log('  ' + k + ' — ' + v.label + ': ' + v.description);
      }
    "
  fi
  exit 1
fi

TEMPLATE_DIR="$SUBMODULE_DIR/templates/apps/$APP_TYPE"
if [[ ! -d "$TEMPLATE_DIR" ]]; then
  echo "ERROR: Unknown app type '$APP_TYPE'"
  echo "Available types:"
  ls -1 "$SUBMODULE_DIR/templates/apps/" | grep -v registry.json | sed 's/^/  /'
  exit 1
fi

# --- Validate --name ---
if [[ -z "$APP_NAME" ]]; then
  echo "ERROR: --name is required"
  echo "Name must be lowercase-kebab-case (e.g., my-app)"
  exit 1
fi

if ! echo "$APP_NAME" | grep -qE '^[a-z][a-z0-9-]*$'; then
  echo "ERROR: Invalid app name '$APP_NAME'"
  echo "Name must match /^[a-z][a-z0-9-]*$/ (lowercase letters, numbers, hyphens)"
  exit 1
fi

# --- Check if app already exists ---
APP_DIR="$MONOREPO_ROOT/apps/$APP_NAME"
if [[ -d "$APP_DIR" ]]; then
  echo "ERROR: apps/$APP_NAME already exists"
  exit 1
fi

# --- Derive placeholders ---
REPO_NAME="$(basename "$MONOREPO_ROOT")"
PACKAGE_NAME="@${REPO_NAME}/${APP_NAME}"
PASCAL_NAME="$(to_pascal_case "$APP_NAME")"
EXPO_SLUG="$APP_NAME"
# Bundle ID: com.reponame.appname (strip hyphens, lowercase)
BUNDLE_ID_REPO="$(echo "$REPO_NAME" | tr -d '-')"
BUNDLE_ID_APP="$(echo "$APP_NAME" | tr -d '-')"
BUNDLE_ID="com.${BUNDLE_ID_REPO}.${BUNDLE_ID_APP}"

echo ""
echo "Creating app:"
echo "  Type:      $APP_TYPE"
echo "  Name:      $APP_NAME"
echo "  Package:   $PACKAGE_NAME"
echo "  Pascal:    $PASCAL_NAME"
echo "  Path:      apps/$APP_NAME/"
if [[ "$APP_TYPE" == "nestjs-server" || "$APP_TYPE" == "next-app" ]]; then
  echo "  Port:      $PORT"
fi
echo ""

# --- Process templates ---
echo "--- Processing templates ---"

cd "$MONOREPO_ROOT"

# Walk template directory recursively
while IFS= read -r -d '' template_file; do
  # Get relative path from template dir
  rel_path="${template_file#$TEMPLATE_DIR/}"

  # Determine destination path
  if [[ "$rel_path" == *.template ]]; then
    # Strip .template suffix
    dest_rel="${rel_path%.template}"

    # Special case: swcrc.template → .swcrc (add dot prefix)
    if [[ "$(basename "$dest_rel")" == "swcrc" ]]; then
      dest_rel="$(dirname "$dest_rel")/.swcrc"
    fi

    # Special case: env.example.template → .env.example (add dot prefix)
    if [[ "$(basename "$dest_rel")" == "env.example" ]]; then
      dest_rel="$(dirname "$dest_rel")/.env.example"
    fi

    # Special case: nvmrc.template → .nvmrc (add dot prefix)
    if [[ "$(basename "$dest_rel")" == "nvmrc" ]]; then
      dest_rel="$(dirname "$dest_rel")/.nvmrc"
    fi

    dest_file="apps/$APP_NAME/$dest_rel"
    mkdir -p "$(dirname "$dest_file")"

    # Copy and replace placeholders
    sed -e "s|{{APP_NAME}}|$APP_NAME|g" \
        -e "s|{{PACKAGE_NAME}}|$PACKAGE_NAME|g" \
        -e "s|{{PASCAL_NAME}}|$PASCAL_NAME|g" \
        -e "s|{{EXPO_SLUG}}|$EXPO_SLUG|g" \
        -e "s|{{BUNDLE_ID}}|$BUNDLE_ID|g" \
        -e "s|{{PORT}}|$PORT|g" \
        "$template_file" > "$dest_file"
    echo "  Created: $dest_file"
  else
    # Non-template files: copy as-is
    dest_file="apps/$APP_NAME/$rel_path"
    mkdir -p "$(dirname "$dest_file")"
    cp "$template_file" "$dest_file"
    echo "  Copied:  $dest_file"
  fi
done < <(find "$TEMPLATE_DIR" -type f -print0)

# --- Create spec directory ---
echo ""
echo "--- Creating spec directory ---"
mkdir -p "docs/specs/$APP_NAME/todo"
echo "  Created: docs/specs/$APP_NAME/todo/"

# --- Install dependencies ---
echo ""
echo "--- Installing dependencies ---"
npm install
echo "  Dependencies installed"

# --- Run update.sh ---
echo ""
echo "--- Running update.sh ---"
bash "$SCRIPT_DIR/update.sh"

# --- Summary ---
echo ""
echo "============================================="
echo "  App created successfully!"
echo "============================================="
echo ""
echo "  Type:     $APP_TYPE"
echo "  Name:     $APP_NAME"
echo "  Package:  $PACKAGE_NAME"
echo "  Path:     apps/$APP_NAME/"
echo ""
echo "  Next steps:"
echo "    cd apps/$APP_NAME"
echo "    npm run dev"
echo ""
