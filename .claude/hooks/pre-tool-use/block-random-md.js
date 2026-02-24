#!/usr/bin/env node
// Block creation of random .md files - use docs/ or specs/ instead

const _fs = require('node:fs')

let data = ''
process.stdin.on('data', (chunk) => (data += chunk))
process.stdin.on('end', () => {
  const input = JSON.parse(data)
  const filePath = input.tool_input?.file_path || ''

  // Check if it's a .md or .txt file
  if (/\.(md|txt)$/.test(filePath)) {
    // Allow standard files and docs/specs directories
    const allowed =
      /(README|CLAUDE|AGENTS|CONTRIBUTING)\.md$/.test(filePath) ||
      /docs\/|specs\/|\.claude\//.test(filePath)

    if (!allowed) {
      console.error('[Hook] BLOCKED: Unnecessary documentation file creation')
      console.error(`[Hook] File: ${filePath}`)
      console.error('[Hook] Use docs/ or specs/ for documentation')
      process.exit(1)
    }
  }

  console.log(data)
})
