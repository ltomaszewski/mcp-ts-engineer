/**
 * Unit tests for lint scan prompt builder (lint-scan.v1.ts).
 * Tests prompt structure, content, and required instructions.
 */

import { LINT_SCAN_CURRENT_VERSION, lintScanPrompts } from '../prompts/index.js'

describe('lintScanPrompts', () => {
  const promptVersion = lintScanPrompts[LINT_SCAN_CURRENT_VERSION]

  describe('build()', () => {
    it('returns BuiltPrompt with systemPrompt and userPrompt', () => {
      const input = { projectPath: 'apps/test-project', cwd: '/test/cwd' }
      const result = promptVersion.build(input)

      expect(result).toHaveProperty('systemPrompt')
      expect(result).toHaveProperty('userPrompt')
      expect(typeof result.userPrompt).toBe('string')
    })

    it('systemPrompt uses claude_code preset', () => {
      const input = { projectPath: 'apps/test-project' }
      const result = promptVersion.build(input)

      expect(result.systemPrompt).toHaveProperty('type', 'preset')
      expect(result.systemPrompt).toHaveProperty('preset', 'claude_code')
      expect(result.systemPrompt).toHaveProperty('append')
    })

    it('userPrompt includes project path', () => {
      const input = { projectPath: 'apps/my-server', cwd: '/workspace' }
      const result = promptVersion.build(input)

      expect(result.userPrompt).toContain('apps/my-server')
      expect(result.userPrompt).toContain('<project_path>')
    })

    it('userPrompt instructs to read package.json', () => {
      const input = { projectPath: 'apps/test' }
      const result = promptVersion.build(input)

      expect(result.userPrompt).toContain('package.json')
      expect(result.userPrompt).toContain('Read')
    })

    it('userPrompt instructs to check for lint script', () => {
      const input = { projectPath: 'apps/test' }
      const result = promptVersion.build(input)

      expect(result.userPrompt).toContain('lint script')
      expect(result.userPrompt).toContain('scripts')
    })

    it('userPrompt instructs to run npm run lint', () => {
      const input = { projectPath: 'apps/test' }
      const result = promptVersion.build(input)

      expect(result.userPrompt).toContain('npm run lint')
    })

    it('userPrompt includes <lint_scan_result> output format', () => {
      const input = { projectPath: 'apps/test' }
      const result = promptVersion.build(input)

      expect(result.userPrompt).toContain('<lint_scan_result>')
      expect(result.userPrompt).toContain('lint_available')
      expect(result.userPrompt).toContain('lint_passed')
      expect(result.userPrompt).toContain('error_count')
      expect(result.userPrompt).toContain('files_with_lint_errors')
    })
  })
})
