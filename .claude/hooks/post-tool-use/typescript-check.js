#!/usr/bin/env node
// TypeScript check after editing .ts/.tsx files

const { execSync } = require('node:child_process')
const fs = require('node:fs')
const path = require('node:path')

let data = ''
process.stdin.on('data', (chunk) => (data += chunk))
process.stdin.on('end', () => {
  const input = JSON.parse(data)
  const filePath = input.tool_input?.file_path

  if (filePath && fs.existsSync(filePath)) {
    // Find nearest tsconfig.json
    let dir = path.dirname(filePath)
    while (dir !== path.dirname(dir) && !fs.existsSync(path.join(dir, 'tsconfig.json'))) {
      dir = path.dirname(dir)
    }

    if (fs.existsSync(path.join(dir, 'tsconfig.json'))) {
      try {
        const result = execSync('npx tsc --noEmit --pretty false 2>&1', {
          cwd: dir,
          encoding: 'utf8',
          stdio: ['pipe', 'pipe', 'pipe'],
        })
        const lines = result
          .split('\n')
          .filter((l) => l.includes(filePath))
          .slice(0, 10)
        if (lines.length) console.error(lines.join('\n'))
      } catch (e) {
        const lines = (e.stdout || '')
          .split('\n')
          .filter((l) => l.includes(filePath))
          .slice(0, 10)
        if (lines.length) console.error(lines.join('\n'))
      }
    }
  }

  console.log(data)
})
