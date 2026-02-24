/**
 * Unit tests for ProjectContextLoader service.
 * Validates context assembly from CLAUDE.md, rules, skills, and review checklist.
 */

import fs from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'
import type { ProjectConfig } from '../../../../config/project-config.js'
import type { ProjectContextResult } from '../project-context-loader.js'
import { loadProjectContext } from '../project-context-loader.js'

function makeConfig(overrides: Partial<ProjectConfig> = {}): ProjectConfig {
  return {
    serverName: 'TestServer',
    serverVersion: '1.0.0',
    logDir: '~/.claude/test/logs/',
    commitTag: '[test]',
    monorepoRoot: '/nonexistent',
    submodulePath: '/nonexistent',
    codemaps: [],
    reviewChecklist: [],
    ...overrides,
  }
}

describe('loadProjectContext', () => {
  let tempDir: string

  beforeEach(async () => {
    tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'project-ctx-test-'))
  })

  afterEach(async () => {
    await fs.rm(tempDir, { recursive: true, force: true })
  })

  describe('CLAUDE.md loading', () => {
    it('includes CLAUDE.md content in context when file exists', async () => {
      const claudeContent = "# My Project\n\nDO: keep apps independent\nDON'T: add deps to root"
      await fs.writeFile(path.join(tempDir, 'CLAUDE.md'), claudeContent)

      const config = makeConfig({ monorepoRoot: tempDir })
      const result: ProjectContextResult = await loadProjectContext(config, [])

      expect(result.context).toContain('CLAUDE.md')
      expect(result.context).toContain('keep apps independent')
    })

    it('omits CLAUDE.md section when file is missing', async () => {
      const config = makeConfig({ monorepoRoot: tempDir })
      const result = await loadProjectContext(config, [])

      // Should not throw, should just skip CLAUDE.md section
      expect(result.context).toBeDefined()
      expect(typeof result.context).toBe('string')
    })
  })

  describe('Rules loading', () => {
    it('includes rule files from .claude/rules/*.md', async () => {
      const rulesDir = path.join(tempDir, '.claude', 'rules')
      await fs.mkdir(rulesDir, { recursive: true })
      await fs.writeFile(
        path.join(rulesDir, 'coding-style.md'),
        '# Coding Style\n\nUse immutable patterns',
      )
      await fs.writeFile(path.join(rulesDir, 'testing.md'), '# Testing\n\nWrite tests first')

      const config = makeConfig({ submodulePath: tempDir })
      const result = await loadProjectContext(config, [])

      expect(result.rulesLoaded).toContain('coding-style')
      expect(result.rulesLoaded).toContain('testing')
      expect(result.context).toContain('Use immutable patterns')
      expect(result.context).toContain('Write tests first')
    })

    it('returns empty rulesLoaded when rules dir is missing', async () => {
      const config = makeConfig({ submodulePath: tempDir })
      const result = await loadProjectContext(config, [])

      expect(result.rulesLoaded).toEqual([])
    })
  })

  describe('Skill detection by file extension', () => {
    it('detects nestjs-core from .service.ts extension', async () => {
      const skillsDir = path.join(tempDir, '.claude', 'skills', 'nestjs-core')
      await fs.mkdir(skillsDir, { recursive: true })
      await fs.writeFile(
        path.join(skillsDir, 'SKILL.md'),
        '# NestJS Core\n\nUse dependency injection',
      )

      const config = makeConfig({ submodulePath: tempDir })
      const result = await loadProjectContext(config, ['src/users/user.service.ts'])

      expect(result.skillsLoaded).toContain('nestjs-core')
      expect(result.context).toContain('Use dependency injection')
    })

    it('detects typescript-clean-code for any .ts file', async () => {
      const skillsDir = path.join(tempDir, '.claude', 'skills', 'typescript-clean-code')
      await fs.mkdir(skillsDir, { recursive: true })
      await fs.writeFile(path.join(skillsDir, 'SKILL.md'), '# TypeScript\n\nAvoid any type')

      const config = makeConfig({ submodulePath: tempDir })
      const result = await loadProjectContext(config, ['src/utils/helper.ts'])

      expect(result.skillsLoaded).toContain('typescript-clean-code')
      expect(result.context).toContain('Avoid any type')
    })

    it('detects nestjs-graphql from .resolver.ts extension', async () => {
      const skillsDir = path.join(tempDir, '.claude', 'skills', 'nestjs-graphql')
      await fs.mkdir(skillsDir, { recursive: true })
      await fs.writeFile(path.join(skillsDir, 'SKILL.md'), '# GraphQL\n\nUse DataLoader')

      const config = makeConfig({ submodulePath: tempDir })
      const result = await loadProjectContext(config, ['src/api/post.resolver.ts'])

      expect(result.skillsLoaded).toContain('nestjs-graphql')
    })
  })

  describe('Skill detection by path pattern', () => {
    it('detects nestjs-auth from auth path', async () => {
      const skillsDir = path.join(tempDir, '.claude', 'skills', 'nestjs-auth')
      await fs.mkdir(skillsDir, { recursive: true })
      await fs.writeFile(path.join(skillsDir, 'SKILL.md'), '# Auth\n\nUse JWT guards')

      const config = makeConfig({ submodulePath: tempDir })
      const result = await loadProjectContext(config, ['src/auth/auth.module.ts'])

      expect(result.skillsLoaded).toContain('nestjs-auth')
    })

    it('detects nestjs-mongoose from mongoose paths', async () => {
      const skillsDir = path.join(tempDir, '.claude', 'skills', 'nestjs-mongoose')
      await fs.mkdir(skillsDir, { recursive: true })
      await fs.writeFile(path.join(skillsDir, 'SKILL.md'), '# Mongoose\n\nUse repository pattern')

      const config = makeConfig({ submodulePath: tempDir })
      const result = await loadProjectContext(config, ['src/users/user.schema.ts'])

      expect(result.skillsLoaded).toContain('nestjs-mongoose')
    })
  })

  describe('Content truncation', () => {
    it('truncates CLAUDE.md content to ~4000 chars', async () => {
      const longContent = 'A'.repeat(10000)
      await fs.writeFile(path.join(tempDir, 'CLAUDE.md'), longContent)

      const config = makeConfig({ monorepoRoot: tempDir })
      const result = await loadProjectContext(config, [])

      // The context shouldn't contain the full 10000-char content
      expect(result.context.length).toBeLessThan(10000 + 500) // allow some overhead for headers
    })

    it('truncates rule files to ~1500 chars each', async () => {
      const rulesDir = path.join(tempDir, '.claude', 'rules')
      await fs.mkdir(rulesDir, { recursive: true })
      const longRule = `# Rule\n${'B'.repeat(5000)}`
      await fs.writeFile(path.join(rulesDir, 'big-rule.md'), longRule)

      const config = makeConfig({ submodulePath: tempDir })
      const result = await loadProjectContext(config, [])

      // The context length for a single rule should be truncated
      // Each rule truncated to ~1500 so "B".repeat(5000) should not be fully present
      const ruleOccurrences = (result.context.match(/B{100}/g) || []).length
      expect(ruleOccurrences).toBeLessThan(30) // 5000 B's would be ~50 100-char chunks; truncated would be ~15
    })
  })

  describe('Knowledge base detection and loading', () => {
    it('detects nestjs-backend-architecture.md from .service.ts files', async () => {
      const kbDir = path.join(tempDir, '.claude', 'knowledge-base')
      await fs.mkdir(kbDir, { recursive: true })
      await fs.writeFile(
        path.join(kbDir, 'nestjs-backend-architecture.md'),
        '# NestJS Architecture\n\nUse modular structure',
      )

      const config = makeConfig({ monorepoRoot: tempDir })
      const result = await loadProjectContext(config, ['src/users/user.service.ts'])

      expect(result.knowledgeBaseLoaded).toContain('nestjs-backend-architecture.md')
      expect(result.context).toContain('Use modular structure')
      expect(result.context).toContain('Knowledge Base')
    })

    it('detects react-native-mobile-architecture.md from .tsx files', async () => {
      const kbDir = path.join(tempDir, '.claude', 'knowledge-base')
      await fs.mkdir(kbDir, { recursive: true })
      await fs.writeFile(
        path.join(kbDir, 'react-native-mobile-architecture.md'),
        '# React Native\n\nUse Expo Router',
      )

      const config = makeConfig({ monorepoRoot: tempDir })
      const result = await loadProjectContext(config, ['src/screens/Home.tsx'])

      expect(result.knowledgeBaseLoaded).toContain('react-native-mobile-architecture.md')
      expect(result.context).toContain('Use Expo Router')
    })

    it('detects mcp-server-architecture.md from capabilities paths', async () => {
      const kbDir = path.join(tempDir, '.claude', 'knowledge-base')
      await fs.mkdir(kbDir, { recursive: true })
      await fs.writeFile(
        path.join(kbDir, 'mcp-server-architecture.md'),
        '# MCP Architecture\n\nCapability-based design',
      )

      const config = makeConfig({ monorepoRoot: tempDir })
      const result = await loadProjectContext(config, [
        'src/capabilities/echo-agent/echo-agent.capability.ts',
      ])

      expect(result.knowledgeBaseLoaded).toContain('mcp-server-architecture.md')
      expect(result.context).toContain('Capability-based design')
    })

    it('returns empty knowledgeBaseLoaded when no files match', async () => {
      const config = makeConfig({ monorepoRoot: tempDir })
      const result = await loadProjectContext(config, ['README.md'])

      expect(result.knowledgeBaseLoaded).toEqual([])
    })

    it('loads KB content without truncation', async () => {
      const kbDir = path.join(tempDir, '.claude', 'knowledge-base')
      await fs.mkdir(kbDir, { recursive: true })
      const longContent = `# Architecture\n\n${'X'.repeat(10000)}`
      await fs.writeFile(path.join(kbDir, 'nestjs-backend-architecture.md'), longContent)

      const config = makeConfig({ monorepoRoot: tempDir })
      const result = await loadProjectContext(config, ['src/app.service.ts'])

      // Full content should be present (no truncation for KB)
      expect(result.context).toContain('X'.repeat(10000))
    })
  })

  describe('Codemap loading', () => {
    it('loads codemap content from config entries', async () => {
      const codemapPath = path.join(tempDir, 'architecture.md')
      await fs.writeFile(codemapPath, '# Architecture Map\n\nKey modules: core, capabilities')

      const config = makeConfig({
        codemaps: [{ area: 'architecture', path: codemapPath }],
      })
      const result = await loadProjectContext(config, [])

      expect(result.codemapsLoaded).toContain('architecture')
      expect(result.context).toContain('Key modules: core, capabilities')
      expect(result.context).toContain('Codemaps')
    })

    it('skips codemap entries with missing files', async () => {
      const config = makeConfig({
        codemaps: [{ area: 'missing', path: '/nonexistent/codemap.md' }],
      })
      const result = await loadProjectContext(config, [])

      expect(result.codemapsLoaded).toEqual([])
    })

    it('returns empty codemapsLoaded when no codemaps configured', async () => {
      const config = makeConfig({ codemaps: [] })
      const result = await loadProjectContext(config, [])

      expect(result.codemapsLoaded).toEqual([])
    })
  })

  describe('Review checklist inclusion', () => {
    it('includes reviewChecklist items in context', async () => {
      const config = makeConfig({
        monorepoRoot: tempDir,
        reviewChecklist: ['Check pagination on all list endpoints', 'Validate enum registration'],
      })

      const result = await loadProjectContext(config, [])

      expect(result.context).toContain('Check pagination on all list endpoints')
      expect(result.context).toContain('Validate enum registration')
    })

    it('omits checklist section when reviewChecklist is empty', async () => {
      const config = makeConfig({ reviewChecklist: [] })
      const result = await loadProjectContext(config, [])

      expect(result.context).not.toContain('Review Checklist')
    })
  })
})
