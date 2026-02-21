import { readFileSync, existsSync, readdirSync } from 'fs'
import { execSync } from 'child_process'
import { join } from 'path'

const SCRIPTS_DIR = join(process.cwd(), 'scripts')
const TEMPLATES_DIR = join(process.cwd(), 'templates/config')

const SCRIPTS = [
  '_common.sh',
  'bootstrap.sh',
  'create-app.sh',
  'update.sh',
  'setup-issue-labels.sh',
  'setup-worktree.sh',
] as const

function readScript(name: string): string {
  return readFileSync(join(SCRIPTS_DIR, name), 'utf-8')
}

describe('Bootstrap scripts', () => {
  describe.each(SCRIPTS)('%s', (scriptName) => {
    const scriptPath = join(SCRIPTS_DIR, scriptName)

    it('exists', () => {
      expect(existsSync(scriptPath)).toBe(true)
    })

    it('has correct shebang', () => {
      const content = readScript(scriptName)
      expect(content.split('\n')[0]).toBe('#!/bin/bash')
    })

    it('sets -eo pipefail', () => {
      const content = readScript(scriptName)
      expect(content).toContain('set -eo pipefail')
    })

    it('passes bash -n syntax check', () => {
      const result = execSync(`bash -n "${scriptPath}" 2>&1 || true`, {
        encoding: 'utf-8',
      })
      // bash -n prints nothing on success, errors on failure
      expect(result.trim()).toBe('')
    })

    it('does not use readlink -f (macOS incompatible)', () => {
      const content = readScript(scriptName)
      expect(content).not.toMatch(/readlink\s+-f/)
    })

    it('does not use declare -A (requires bash 4+)', () => {
      const content = readScript(scriptName)
      expect(content).not.toMatch(/declare\s+-A/)
    })
  })
})

describe('_common.sh specifics', () => {
  const content = readFileSync(join(SCRIPTS_DIR, '_common.sh'), 'utf-8')

  it('contains to_kebab_case function', () => {
    expect(content).toContain('to_kebab_case()')
  })

  it('contains to_pascal_case function', () => {
    expect(content).toContain('to_pascal_case()')
  })

  it('to_kebab_case mirrors deriveLogDir logic', () => {
    // Verify it uses sed with extended regex for PascalCase splitting
    expect(content).toMatch(/sed.*\[a-z0-9\].*\[A-Z\]/)
  })
})

describe('bootstrap.sh specifics', () => {
  const content = readFileSync(join(SCRIPTS_DIR, 'bootstrap.sh'), 'utf-8')

  it('sources _common.sh', () => {
    expect(content).toContain('source "$SCRIPT_DIR/_common.sh"')
  })

  it('delegates monorepo root detection to _common.sh', () => {
    expect(content).toContain('detect_monorepo_root')
  })

  it('uses env vars for CLAUDE.md multiline replacement', () => {
    expect(content).toContain("os.environ.get('_DIR_STRUCTURE'")
    expect(content).toContain("os.environ.get('_PROJECT_COMMANDS'")
    expect(content).toContain("os.environ.get('_PACKAGES_SECTION'")
    expect(content).toContain("os.environ.get('_SKILLS_LISTING'")
    expect(content).toContain("os.environ.get('_CODEMAPS_TABLE'")
  })

  it('uses consistent PKG_FILE_ENV naming in node fallbacks', () => {
    // No bare PKG_FILE= (without _ENV suffix) passed to node
    const nodeLines = content.split('\n').filter(
      (line) => line.includes('node -e') && line.includes('PKG_FILE')
    )
    for (const line of nodeLines) {
      expect(line).toContain('PKG_FILE_ENV')
    }
  })

  it('skips mcp-ts-engineer in project discovery', () => {
    expect(content).toContain('"mcp-ts-engineer"')
  })

  it('derives LOG_DIR using to_kebab_case (matches deriveLogDir)', () => {
    expect(content).toContain('to_kebab_case')
    expect(content).toContain('LOG_DIR')
    expect(content).not.toContain('SERVER_NAME_LOWER')
  })

  it('uses find with -maxdepth before -type', () => {
    const findCmds = content.match(/find\s+.*-maxdepth.*-type/g) || []
    expect(findCmds.length).toBeGreaterThan(0)
  })

  it('uses MCP_KEY="ts-engineer" (fixed convention)', () => {
    expect(content).toContain('MCP_KEY="ts-engineer"')
  })
})

describe('update.sh specifics', () => {
  const content = readFileSync(join(SCRIPTS_DIR, 'update.sh'), 'utf-8')

  it('sources _common.sh', () => {
    expect(content).toContain('source "$SCRIPT_DIR/_common.sh"')
  })

  it('delegates monorepo root detection to _common.sh', () => {
    expect(content).toContain('detect_monorepo_root')
  })

  it('creates all required .claude subdirectories', () => {
    for (const dir of ['commands', 'skills', 'rules', 'contexts', 'codemaps', 'hooks']) {
      expect(content).toContain(`.claude/${dir}`)
    }
  })

  it('re-checks setup-worktree.sh symlink', () => {
    expect(content).toContain('setup-worktree.sh')
  })

  it('rebuilds submodule with npm install && npm run build', () => {
    expect(content).toMatch(/npm install.*&&.*npm run build/)
  })
})

describe('setup-issue-labels.sh specifics', () => {
  const content = readFileSync(join(SCRIPTS_DIR, 'setup-issue-labels.sh'), 'utf-8')

  it('creates project labels', () => {
    expect(content).toContain('project:')
  })

  it('creates type labels', () => {
    for (const type of ['feature', 'bug', 'refactor', 'perf', 'chore']) {
      expect(content).toContain(`type:${type}`)
    }
  })

  it('creates status labels', () => {
    for (const status of ['draft', 'ready']) {
      expect(content).toContain(`status:${status}`)
    }
    expect(content).toContain('in-progress')
    expect(content).toContain('blocked')
  })

  it('creates priority labels', () => {
    for (const priority of ['critical', 'high', 'medium', 'low']) {
      expect(content).toContain(`priority:${priority}`)
    }
  })

  it('skips mcp-ts-engineer in project discovery', () => {
    expect(content).toContain('mcp-ts-engineer')
  })
})

describe('setup-worktree.sh specifics', () => {
  const content = readFileSync(join(SCRIPTS_DIR, 'setup-worktree.sh'), 'utf-8')

  it('determines root from symlink location (pre-resolution)', () => {
    // Must use dirname of BASH_SOURCE directly, NOT resolve_symlink
    expect(content).toContain('dirname "${BASH_SOURCE[0]}"')
    expect(content).not.toContain('resolve_symlink')
  })

  it('runs npm install', () => {
    expect(content).toContain('npm install')
  })

  it('runs turbo build', () => {
    expect(content).toContain('npx turbo run build')
  })

  it('scans for plugin tsconfigs', () => {
    expect(content).toContain('plugin/tsconfig.json')
  })

  it('sources setup-worktree-extra.sh if present', () => {
    expect(content).toContain('setup-worktree-extra.sh')
    expect(content).toContain('source')
  })
})

describe('Config templates', () => {
  const EXPECTED_TEMPLATES = [
    'biome.json.template',
    'package.json.template',
    'turbo.json.template',
    'tsconfig.json.template',
    'vitest.config.ts.template',
    'gitignore.template',
    'mcp.json.template',
    'ts-engineer.config.json.template',
    'CLAUDE.md.template',
  ] as const

  it.each(EXPECTED_TEMPLATES)('%s exists', (templateName) => {
    expect(existsSync(join(TEMPLATES_DIR, templateName))).toBe(true)
  })

  it('package.json.template has {{REPO_NAME}} placeholder', () => {
    const content = readFileSync(join(TEMPLATES_DIR, 'package.json.template'), 'utf-8')
    expect(content).toContain('{{REPO_NAME}}')
  })

  it('mcp.json.template has {{BIN_PATH}} placeholder', () => {
    const content = readFileSync(join(TEMPLATES_DIR, 'mcp.json.template'), 'utf-8')
    expect(content).toContain('{{BIN_PATH}}')
  })

  it('ts-engineer.config.json.template has required placeholders', () => {
    const content = readFileSync(join(TEMPLATES_DIR, 'ts-engineer.config.json.template'), 'utf-8')
    expect(content).toContain('{{SERVER_NAME}}')
    expect(content).toContain('{{LOG_DIR}}')
    expect(content).toContain('{{CODEMAPS_ENTRIES}}')
  })

  it('CLAUDE.md.template has required placeholders', () => {
    const content = readFileSync(join(TEMPLATES_DIR, 'CLAUDE.md.template'), 'utf-8')
    for (const placeholder of [
      '{{PROJECT_NAME}}',
      '{{MCP_KEY}}',
      '{{DIRECTORY_STRUCTURE}}',
      '{{PROJECT_COMMANDS}}',
      '{{PACKAGES_SECTION}}',
      '{{SKILLS_LISTING}}',
      '{{CODEMAPS_TABLE}}',
    ]) {
      expect(content).toContain(placeholder)
    }
  })

  it('CLAUDE.md.template does not contain CI/CD section', () => {
    const content = readFileSync(join(TEMPLATES_DIR, 'CLAUDE.md.template'), 'utf-8')
    expect(content).not.toContain('## CI/CD')
    expect(content).not.toContain('ci.yml')
  })

  it('turbo.json.template has no placeholders', () => {
    const content = readFileSync(join(TEMPLATES_DIR, 'turbo.json.template'), 'utf-8')
    expect(content).not.toMatch(/\{\{.*?\}\}/)
  })

  it('tsconfig.json.template has no placeholders', () => {
    const content = readFileSync(join(TEMPLATES_DIR, 'tsconfig.json.template'), 'utf-8')
    expect(content).not.toMatch(/\{\{.*?\}\}/)
  })

  it('gitignore.template has no placeholders', () => {
    const content = readFileSync(join(TEMPLATES_DIR, 'gitignore.template'), 'utf-8')
    expect(content).not.toMatch(/\{\{.*?\}\}/)
  })

  it('contains no extra template files', () => {
    const actual = readdirSync(TEMPLATES_DIR).filter((f) => f.endsWith('.template')).sort()
    expect(actual).toEqual([...EXPECTED_TEMPLATES].sort())
  })
})

describe('Command files', () => {
  const COMMANDS_DIR = join(process.cwd(), '.claude/commands')
  const COMMANDS = [
    'worktree-add.md',
    'issue-capture.md',
    'issue-implement.md',
    'issue-to-todo.md',
  ] as const

  it.each(COMMANDS)('%s exists', (cmdName) => {
    expect(existsSync(join(COMMANDS_DIR, cmdName))).toBe(true)
  })

  it('no command files reference mcp__software-house__', () => {
    for (const cmdName of COMMANDS) {
      const content = readFileSync(join(COMMANDS_DIR, cmdName), 'utf-8')
      expect(content).not.toContain('mcp__software-house__')
    }
  })

  it('implementation commands use mcp__ts-engineer__ prefix', () => {
    const implCmd = readFileSync(join(COMMANDS_DIR, 'issue-implement.md'), 'utf-8')
    expect(implCmd).toContain('mcp__ts-engineer__')
  })
})
