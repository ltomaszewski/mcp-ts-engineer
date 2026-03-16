/**
 * Tests for cwd isolation in audit-fix prompts and orchestrator.
 * Verifies FR-1 through FR-4 from issue #161:
 * - FR-1: Prompt templates use cwd ?? monorepoRoot
 * - FR-2: Orchestrator resolves cwd before detectSubmodules/discoverProjects
 * - FR-3: Shell commands use resolved cwd
 * - FR-4: Planner uses resolved cwd for ls commands
 */

import { vi } from 'vitest'
import { initProjectConfig, type ProjectConfig } from '../../../config/project-config.js'
import { resolveCwd, cwdPath } from '../../../core/utils/cwd.js'
import { plannerPromptV1 } from '../prompts/planner.v1.js'
import { commitPromptV1 } from '../prompts/commit.v1.js'
import { testPromptV1 } from '../prompts/test.v1.js'
import { depsScanPromptV1 } from '../prompts/deps-scan.v1.js'
import { depsFixPromptV1 } from '../prompts/deps-fix.v1.js'
import { lintScanPromptV1 } from '../prompts/lint-scan.v1.js'
import { lintFixPromptV1 } from '../prompts/lint-fix.v1.js'
import { auditFixCapability } from '../audit-fix.capability.js'
import type { AuditFixInput } from '../audit-fix.schema.js'

// ---------------------------------------------------------------------------
// Setup: configure monorepoRoot so we can verify fallback behavior
// ---------------------------------------------------------------------------

const MOCK_MONOREPO_ROOT = '/home/user/main-repo'

beforeAll(() => {
  initProjectConfig({
    serverName: 'TestServer',
    serverVersion: '1.0.0',
    logDir: '~/.claude/test/logs/',
    commitTag: '[test]',
    monorepoRoot: MOCK_MONOREPO_ROOT,
    submodulePath: `${MOCK_MONOREPO_ROOT}/packages/mcp-ts-engineer`,
    codemaps: [],
  } satisfies ProjectConfig)
})

// ---------------------------------------------------------------------------
// FR-2: Orchestrator resolves cwd before detectSubmodules / discoverProjects
// ---------------------------------------------------------------------------

describe('FR-2: orchestrator cwd resolution', () => {
  it('preparePromptInput resolves cwd to monorepoRoot when cwd is undefined', () => {
    const input: AuditFixInput = {
      max_iteration_per_project: 3,
      max_total_cap: 10,
    }

    const result = auditFixCapability.preparePromptInput!(input, {} as never)

    expect(result.cwd).toBe(MOCK_MONOREPO_ROOT)
  })

  it('preparePromptInput preserves explicit cwd when provided', () => {
    const worktreeCwd = '/tmp/worktree/health-check'
    const input: AuditFixInput = {
      cwd: worktreeCwd,
      max_iteration_per_project: 3,
      max_total_cap: 10,
    }

    const result = auditFixCapability.preparePromptInput!(input, {} as never)

    expect(result.cwd).toBe(worktreeCwd)
  })
})

// ---------------------------------------------------------------------------
// FR-4: Planner uses resolved cwd for ls commands
// ---------------------------------------------------------------------------

describe('FR-4: planner prompt cwd in ls commands', () => {
  it('uses absolute paths for ls when cwd is provided', () => {
    const cwd = '/tmp/worktree/health-check'
    const result = plannerPromptV1.build({ cwd })

    expect(result.userPrompt).toContain(`ls ${cwd}/apps/`)
    expect(result.userPrompt).toContain(`ls ${cwd}/packages/`)
  })

  it('uses relative ls commands when cwd is not provided', () => {
    const result = plannerPromptV1.build({})

    expect(result.userPrompt).toContain('ls apps/')
    expect(result.userPrompt).toContain('ls packages/')
    expect(result.userPrompt).not.toContain('ls /') // No absolute path prefix
  })

  it('includes cwd in working directory context', () => {
    const cwd = '/tmp/worktree/test'
    const result = plannerPromptV1.build({ cwd })

    expect(result.userPrompt).toContain(`Working directory: ${cwd}`)
  })

  it('skips target project scan when targetProject is set', () => {
    const result = plannerPromptV1.build({
      targetProject: 'apps/my-server',
      cwd: '/tmp/worktree/test',
    })

    expect(result.userPrompt).toContain('apps/my-server')
    expect(result.userPrompt).not.toContain('ls ')
  })
})

// ---------------------------------------------------------------------------
// FR-3: Commit and test prompts use resolved cwd
// ---------------------------------------------------------------------------

describe('FR-3: commit prompt cwd instructions', () => {
  it('includes git cwd instruction when cwd is provided', () => {
    const cwd = '/tmp/worktree/health-check'
    const result = commitPromptV1.build({
      projectPath: 'apps/my-server',
      filesChanged: ['src/main.ts'],
      auditSummary: 'Fixed lint issues',
      sessionId: 'session-123',
      cwd,
    })

    expect(result.userPrompt).toContain(`cd ${cwd}`)
    expect(result.userPrompt).toContain('Run all git commands from the working directory')
  })

  it('omits git cwd instruction when cwd is not provided', () => {
    const result = commitPromptV1.build({
      projectPath: 'apps/my-server',
      filesChanged: ['src/main.ts'],
      auditSummary: 'Fixed lint issues',
      sessionId: 'session-123',
    })

    expect(result.userPrompt).not.toContain('Run all git commands from the working directory')
  })
})

describe('FR-3: test prompt cwd instructions', () => {
  it('includes cwd instruction when cwd is provided', () => {
    const cwd = '/tmp/worktree/health-check'
    const result = testPromptV1.build({
      project_path: 'apps/my-server',
      workspaces: ['apps/my-server'],
      cwd,
    })

    expect(result.userPrompt).toContain(`cd ${cwd}`)
    expect(result.userPrompt).toContain('Run all commands from the working directory')
  })

  it('omits cwd instruction when cwd is not provided', () => {
    const result = testPromptV1.build({
      project_path: 'apps/my-server',
      workspaces: ['apps/my-server'],
    })

    expect(result.userPrompt).not.toContain('Run all commands from the working directory')
  })
})

// ---------------------------------------------------------------------------
// Shared helpers: resolveCwd and cwdPath
// ---------------------------------------------------------------------------

describe('resolveCwd helper', () => {
  it('returns cwd when provided', () => {
    expect(resolveCwd('/tmp/worktree')).toBe('/tmp/worktree')
  })

  it('falls back to monorepoRoot when cwd is undefined', () => {
    expect(resolveCwd(undefined)).toBe(MOCK_MONOREPO_ROOT)
  })
})

describe('cwdPath helper', () => {
  it('joins root and relative path', () => {
    expect(cwdPath('/tmp/worktree', 'apps/my-server')).toBe('/tmp/worktree/apps/my-server')
  })
})

// ---------------------------------------------------------------------------
// FR-3: Deps scan prompt uses resolved cwd for shell commands
// ---------------------------------------------------------------------------

describe('FR-3: deps-scan prompt cwd paths', () => {
  it('uses absolute path in standalone cd command when cwd is provided', () => {
    const cwd = '/tmp/worktree/health-check'
    const result = depsScanPromptV1.build({ projectPath: 'apps/my-server', cwd })

    expect(result.userPrompt).toContain(`cd '${cwd}/apps/my-server'`)
    expect(result.userPrompt).toContain(`${cwd}/package-lock.json`)
  })

  it('falls back to monorepoRoot in standalone cd command when cwd is omitted', () => {
    const result = depsScanPromptV1.build({ projectPath: 'apps/my-server' })

    expect(result.userPrompt).toContain(`cd '${MOCK_MONOREPO_ROOT}/apps/my-server'`)
    expect(result.userPrompt).toContain(`${MOCK_MONOREPO_ROOT}/package-lock.json`)
  })
})

// ---------------------------------------------------------------------------
// FR-3: Deps fix prompt uses resolved cwd for shell commands
// ---------------------------------------------------------------------------

describe('FR-3: deps-fix prompt cwd paths', () => {
  it('uses absolute path in standalone cd commands when cwd is provided', () => {
    const cwd = '/tmp/worktree/health-check'
    const result = depsFixPromptV1.build({
      projectPath: 'apps/my-server',
      vulnerabilitiesFound: 5,
      cwd,
    })

    expect(result.userPrompt).toContain(`cd '${cwd}/apps/my-server'`)
    expect(result.userPrompt).toContain(`${cwd}/package-lock.json`)
  })

  it('falls back to monorepoRoot in standalone cd commands when cwd is omitted', () => {
    const result = depsFixPromptV1.build({
      projectPath: 'apps/my-server',
      vulnerabilitiesFound: 5,
    })

    expect(result.userPrompt).toContain(`cd '${MOCK_MONOREPO_ROOT}/apps/my-server'`)
    expect(result.userPrompt).toContain(`${MOCK_MONOREPO_ROOT}/package-lock.json`)
  })
})

// ---------------------------------------------------------------------------
// FR-3: Lint scan prompt uses resolved cwd for shell commands
// ---------------------------------------------------------------------------

describe('FR-3: lint-scan prompt cwd paths', () => {
  it('uses absolute path in cd command when cwd is provided', () => {
    const cwd = '/tmp/worktree/health-check'
    const result = lintScanPromptV1.build({ projectPath: 'apps/my-server', cwd })

    expect(result.userPrompt).toContain(`cd '${cwd}/apps/my-server'`)
  })

  it('falls back to monorepoRoot in cd command when cwd is omitted', () => {
    const result = lintScanPromptV1.build({ projectPath: 'apps/my-server' })

    expect(result.userPrompt).toContain(`cd '${MOCK_MONOREPO_ROOT}/apps/my-server'`)
  })
})

// ---------------------------------------------------------------------------
// FR-3: Lint fix prompt uses cwd in WORKING DIRECTORY rule
// ---------------------------------------------------------------------------

describe('FR-3: lint-fix prompt cwd rule', () => {
  it('includes WORKING DIRECTORY rule when cwd is provided', () => {
    const cwd = '/tmp/worktree/health-check'
    const result = lintFixPromptV1.build({
      projectPath: 'apps/my-server',
      lintReport: 'error: unused import',
      filesWithLintErrors: ['src/file.ts'],
      cwd,
    })

    expect(result.userPrompt).toContain(`WORKING DIRECTORY`)
    expect(result.userPrompt).toContain(cwd)
  })

  it('omits WORKING DIRECTORY rule when cwd is not provided', () => {
    const result = lintFixPromptV1.build({
      projectPath: 'apps/my-server',
      lintReport: 'error: unused import',
      filesWithLintErrors: ['src/file.ts'],
    })

    expect(result.userPrompt).not.toContain('WORKING DIRECTORY')
  })
})
