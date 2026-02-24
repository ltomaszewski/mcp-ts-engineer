import { execSync } from 'node:child_process'
import { existsSync, readFileSync } from 'node:fs'
import { join } from 'node:path'

const SCRIPTS_DIR = join(process.cwd(), 'scripts')
const APPS_TEMPLATES_DIR = join(process.cwd(), 'templates/apps')
const REGISTRY_PATH = join(APPS_TEMPLATES_DIR, 'registry.json')

const CREATE_APP_SCRIPTS = ['_common.sh', 'create-app.sh'] as const

describe('Create-app scripts', () => {
  describe.each(CREATE_APP_SCRIPTS)('%s', (scriptName) => {
    const scriptPath = join(SCRIPTS_DIR, scriptName)

    it('exists', () => {
      expect(existsSync(scriptPath)).toBe(true)
    })

    it('has correct shebang', () => {
      const content = readFileSync(scriptPath, 'utf-8')
      expect(content.split('\n')[0]).toBe('#!/bin/bash')
    })

    it('sets -eo pipefail or is sourced', () => {
      const content = readFileSync(scriptPath, 'utf-8')
      // _common.sh doesn't need set -eo pipefail since it's sourced
      if (scriptName === '_common.sh') {
        expect(content).toContain('_common.sh')
      } else {
        expect(content).toContain('set -eo pipefail')
      }
    })

    it('passes bash -n syntax check', () => {
      const result = execSync(`bash -n "${scriptPath}" 2>&1 || true`, {
        encoding: 'utf-8',
      })
      expect(result.trim()).toBe('')
    })

    it('does not use readlink -f (macOS incompatible)', () => {
      const content = readFileSync(scriptPath, 'utf-8')
      expect(content).not.toMatch(/readlink\s+-f/)
    })

    it('does not use declare -A (requires bash 4+)', () => {
      const content = readFileSync(scriptPath, 'utf-8')
      expect(content).not.toMatch(/declare\s+-A/)
    })
  })
})

describe('_common.sh specifics', () => {
  const content = readFileSync(join(SCRIPTS_DIR, '_common.sh'), 'utf-8')

  it('contains relpath function', () => {
    expect(content).toContain('relpath()')
  })

  it('contains to_pascal_case function', () => {
    expect(content).toContain('to_pascal_case()')
  })

  it('contains detect_monorepo_root function', () => {
    expect(content).toContain('detect_monorepo_root()')
  })

  it('contains symlink_file function', () => {
    expect(content).toContain('symlink_file()')
  })

  it('contains read_pkg_field function', () => {
    expect(content).toContain('read_pkg_field()')
  })

  it('guards against monorepo root resolving to /', () => {
    expect(content).toMatch(/MONOREPO_ROOT.*==.*"\/"/)
  })

  it('uses python3 sys.argv for relpath', () => {
    expect(content).toMatch(/sys\.argv\[1\].*sys\.argv\[2\]/)
  })
})

describe('create-app.sh specifics', () => {
  const content = readFileSync(join(SCRIPTS_DIR, 'create-app.sh'), 'utf-8')

  it('sources _common.sh', () => {
    expect(content).toContain('source "$SCRIPT_DIR/_common.sh"')
  })

  it('calls detect_monorepo_root', () => {
    expect(content).toContain('detect_monorepo_root')
  })

  it('validates app name with regex', () => {
    expect(content).toContain('^[a-z][a-z0-9-]*$')
  })

  it('checks for existing app directory', () => {
    expect(content).toContain('already exists')
  })

  it('uses sed for placeholder replacement', () => {
    expect(content).toContain('{{APP_NAME}}')
    expect(content).toContain('{{PACKAGE_NAME}}')
    expect(content).toContain('{{PASCAL_NAME}}')
  })

  it('handles swcrc.template dot-prefix', () => {
    expect(content).toContain('.swcrc')
  })

  it('handles env.example.template dot-prefix', () => {
    expect(content).toContain('.env.example')
  })

  it('creates spec directory', () => {
    expect(content).toContain('docs/specs/$APP_NAME/todo')
  })

  it('runs npm install', () => {
    expect(content).toContain('npm install')
  })

  it('runs update.sh', () => {
    expect(content).toContain('update.sh')
  })
})

describe('App template registry', () => {
  it('registry.json exists', () => {
    expect(existsSync(REGISTRY_PATH)).toBe(true)
  })

  it('is valid JSON', () => {
    const content = readFileSync(REGISTRY_PATH, 'utf-8')
    expect(() => JSON.parse(content)).not.toThrow()
  })

  it('contains all three app types', () => {
    const registry = JSON.parse(readFileSync(REGISTRY_PATH, 'utf-8'))
    expect(registry.appTypes).toHaveProperty('expo-app')
    expect(registry.appTypes).toHaveProperty('nestjs-server')
    expect(registry.appTypes).toHaveProperty('mcp-server')
  })

  it('each app type has label and description', () => {
    const registry = JSON.parse(readFileSync(REGISTRY_PATH, 'utf-8'))
    for (const [, value] of Object.entries(registry.appTypes)) {
      const appType = value as { label: string; description: string }
      expect(appType.label).toBeDefined()
      expect(appType.description).toBeDefined()
      expect(typeof appType.label).toBe('string')
      expect(typeof appType.description).toBe('string')
    }
  })
})

describe('App template directories', () => {
  const APP_TYPES = ['expo-app', 'nestjs-server', 'mcp-server'] as const

  describe.each(APP_TYPES)('%s', (appType) => {
    const templateDir = join(APPS_TEMPLATES_DIR, appType)

    it('template directory exists', () => {
      expect(existsSync(templateDir)).toBe(true)
    })

    it('has package.json.template with {{PACKAGE_NAME}}', () => {
      const pkgTemplate = join(templateDir, 'package.json.template')
      expect(existsSync(pkgTemplate)).toBe(true)
      const content = readFileSync(pkgTemplate, 'utf-8')
      expect(content).toContain('{{PACKAGE_NAME}}')
    })

    it('has tsconfig.json.template', () => {
      expect(existsSync(join(templateDir, 'tsconfig.json.template'))).toBe(true)
    })

    it('has biome.json.template', () => {
      expect(existsSync(join(templateDir, 'biome.json.template'))).toBe(true)
    })
  })

  it('expo-app has jest.config.js.template (not vitest)', () => {
    expect(existsSync(join(APPS_TEMPLATES_DIR, 'expo-app/jest.config.js.template'))).toBe(true)
  })

  it('nestjs-server has vitest.config.ts.template', () => {
    expect(existsSync(join(APPS_TEMPLATES_DIR, 'nestjs-server/vitest.config.ts.template'))).toBe(
      true,
    )
  })

  it('mcp-server has vitest.config.ts.template', () => {
    expect(existsSync(join(APPS_TEMPLATES_DIR, 'mcp-server/vitest.config.ts.template'))).toBe(true)
  })

  it('nestjs-server has swcrc.template', () => {
    expect(existsSync(join(APPS_TEMPLATES_DIR, 'nestjs-server/swcrc.template'))).toBe(true)
  })

  it('nestjs-server has health.resolver.ts.template for GraphQL Query root', () => {
    expect(
      existsSync(
        join(APPS_TEMPLATES_DIR, 'nestjs-server/src/modules/health/health.resolver.ts.template'),
      ),
    ).toBe(true)
  })

  it('nestjs-server health module registers HealthResolver', () => {
    const content = readFileSync(
      join(APPS_TEMPLATES_DIR, 'nestjs-server/src/modules/health/health.module.ts.template'),
      'utf-8',
    )
    expect(content).toContain('HealthResolver')
  })

  it('nestjs-server includes @graphql-yoga/nestjs dependency', () => {
    const content = readFileSync(
      join(APPS_TEMPLATES_DIR, 'nestjs-server/package.json.template'),
      'utf-8',
    )
    expect(content).toContain('@graphql-yoga/nestjs')
  })

  it('expo-app has app/_layout.tsx.template', () => {
    expect(existsSync(join(APPS_TEMPLATES_DIR, 'expo-app/app/_layout.tsx.template'))).toBe(true)
  })

  it('expo-app has placeholder asset PNGs referenced by app.json', () => {
    const assets = ['icon.png', 'splash.png', 'adaptive-icon.png', 'favicon.png']
    for (const asset of assets) {
      expect(existsSync(join(APPS_TEMPLATES_DIR, `expo-app/assets/${asset}`))).toBe(true)
    }
  })

  it('mcp-server has src/server.ts.template', () => {
    expect(existsSync(join(APPS_TEMPLATES_DIR, 'mcp-server/src/server.ts.template'))).toBe(true)
  })
})

describe('Command files', () => {
  const COMMANDS_DIR = join(process.cwd(), '.claude/commands')

  it('create-app.md exists', () => {
    expect(existsSync(join(COMMANDS_DIR, 'create-app.md'))).toBe(true)
  })

  it('create-app.md references registry.json', () => {
    const content = readFileSync(join(COMMANDS_DIR, 'create-app.md'), 'utf-8')
    expect(content).toContain('registry.json')
  })

  it('create-app.md references create-app.sh', () => {
    const content = readFileSync(join(COMMANDS_DIR, 'create-app.md'), 'utf-8')
    expect(content).toContain('create-app.sh')
  })
})
