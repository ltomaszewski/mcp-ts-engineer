#!/bin/bash

# Patch script for Claude Agent SDK cache_control bug fix
# Applies cache_control only to the last system prompt block instead of all blocks
# See: https://github.com/anthropics/claude-agent-sdk-typescript/issues/89

set -e

CLI_FILE="node_modules/@anthropic-ai/claude-agent-sdk/cli.js"

# Check if cli.js exists
if [ ! -f "$CLI_FILE" ]; then
  echo "WARNING: Could not find cli.js to patch — SDK structure may have changed" >&2
  exit 0
fi

# Check if file is writable
if [ ! -w "$CLI_FILE" ]; then
  echo "ERROR: Unable to write to cli.js" >&2
  exit 1
fi

# Create a backup (for debugging purposes, removed after successful patch)
CLI_BACKUP="${CLI_FILE}.backup"
cp "$CLI_FILE" "$CLI_BACKUP"

# Patch 1: Add _idx and _arr parameters to .map() call
# Before: .map((B)=>{ ... })
# After:  .map((B,_idx,_arr)=>{ ... })
if sed -i '' 's/\.map(\(B\))/\.map(\(B\),_idx,_arr)/g' "$CLI_FILE" 2>/dev/null || \
   sed -i 's/\.map(\(B\))/\.map(\(B\),_idx,_arr)/g' "$CLI_FILE" 2>/dev/null; then
  true  # sed succeeded
else
  # Restore backup if sed fails
  mv "$CLI_BACKUP" "$CLI_FILE"
  echo "WARNING: Cache control pattern not found in cli.js — SDK may have been updated with a fix" >&2
  exit 0
fi

# Patch 2: Add condition to only apply cache_control when _idx===_arr.length-1
# Before: ...Q&&!G?{cache_control:...
# After:  ...Q&&!G&&_idx===_arr.length-1?{cache_control:...
if ! sed -i '' 's/Q&&!G?{cache_control/Q\&\&!G\&\&_idx===_arr.length-1?{cache_control/g' "$CLI_FILE" 2>/dev/null && \
   ! sed -i 's/Q&&!G?{cache_control/Q\&\&!G\&\&_idx===_arr.length-1?{cache_control/g' "$CLI_FILE" 2>/dev/null; then
  # Restore backup if second sed fails
  mv "$CLI_BACKUP" "$CLI_FILE"
  echo "WARNING: Cache control pattern not found in cli.js — SDK may have been updated with a fix" >&2
  exit 0
fi

# Verify patch was applied by checking for the condition
if grep -q '_idx===_arr.length-1' "$CLI_FILE" 2>/dev/null; then
  # Remove backup on successful patch
  rm -f "$CLI_BACKUP"
  exit 0
else
  # Restore backup if verification fails
  mv "$CLI_BACKUP" "$CLI_FILE"
  echo "WARNING: Cache control pattern not found in cli.js — SDK may have been updated with a fix" >&2
  exit 0
fi
