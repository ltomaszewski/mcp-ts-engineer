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
import { plannerPromptV1 } from '../prompts/planner.v1.js'
import { commitPromptV1 } from '../prompts/commit.v1.js'
import { testPromptV1 } from '../prompts/test.v1.js'
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
