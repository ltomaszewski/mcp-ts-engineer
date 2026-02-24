#!/usr/bin/env node
// Auto-format JS/TS files with Biome after edits

const { execSync } = require('node:child_process')
const fs = require('node:fs')

let data = ''
process.stdin.on('data', (chunk) => (data += chunk))
process.stdin.on('end', () => {
  const input = JSON.parse(data)
  const filePath = input.tool_input?.file_path

  if (filePath && fs.existsSync(filePath)) {
    try {
      execSync(`npx biome format --write "${filePath}"`, {
        stdio: ['pipe', 'pipe', 'pipe'],
      })
    } catch (_e) {
      // Silently ignore format errors
    }
  }

  console.log(data)
})
