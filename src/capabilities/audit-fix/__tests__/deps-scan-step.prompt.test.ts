/**
 * Unit tests for deps scan prompt builder (deps-scan.v1.ts).
 * Tests prompt structure, content, and required instructions.
 */

import { DEPS_SCAN_CURRENT_VERSION, depsScanPrompts } from '../prompts/index.js'

describe('depsScanPrompts', () => {
  const promptVersion = depsScanPrompts[DEPS_SCAN_CURRENT_VERSION]

  describe('build()', () => {
    it('userPrompt includes projectPath', () => {
      const input = { projectPath: 'apps/my-server', cwd: '/workspace' }
      const result = promptVersion.build(input)

      expect(result.userPrompt).toContain('apps/my-server')
      expect(result.userPrompt).toContain('<project_path>')
    })

    it('userPrompt instructs to check for package-lock.json', () => {
      const input = { projectPath: 'apps/test' }
      const result = promptVersion.build(input)

      expect(result.userPrompt).toContain('package-lock.json')
      expect(result.userPrompt).toContain('check')
    })

    it('userPrompt instructs to run npm audit --json', () => {
      const input = { projectPath: 'apps/test' }
      const result = promptVersion.build(input)

      expect(result.userPrompt).toContain('npm audit --json')
      expect(result.userPrompt).toContain('cd')
    })

    it('userPrompt instructs to parse severity breakdown', () => {
      const input = { projectPath: 'apps/test' }
      const result = promptVersion.build(input)

      expect(result.userPrompt).toContain('critical')
      expect(result.userPrompt).toContain('high')
      expect(result.userPrompt).toContain('moderate')
      expect(result.userPrompt).toContain('low')
      expect(result.userPrompt).toContain('metadata.vulnerabilities')
    })

    it('userPrompt includes <deps_scan_result> output format requirement', () => {
      const input = { projectPath: 'apps/test' }
      const result = promptVersion.build(input)

      expect(result.userPrompt).toContain('<deps_scan_result>')
      expect(result.userPrompt).toContain('audit_ran')
      expect(result.userPrompt).toContain('vulnerabilities_found')
      expect(result.userPrompt).toContain('vulnerabilities_by_severity')
      expect(result.userPrompt).toContain('audit_json')
    })

    it('systemPrompt uses claude_code preset', () => {
      const input = { projectPath: 'apps/test-project' }
      const result = promptVersion.build(input)

      expect(result.systemPrompt).toHaveProperty('type', 'preset')
      expect(result.systemPrompt).toHaveProperty('preset', 'claude_code')
      expect(result.systemPrompt).toHaveProperty('append')
    })
  })
})
