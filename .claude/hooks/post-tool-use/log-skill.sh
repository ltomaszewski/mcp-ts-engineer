#!/bin/bash
# Log which skill was loaded after Skill tool invocation
# Gives visibility into skill activation without forcing anything

SKILL_NAME="${CLAUDE_TOOL_INPUT_skill:-unknown}"
echo "[Skill] Loaded: $SKILL_NAME" >&2
