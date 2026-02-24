/**
 * Unit tests for deps fix prompt builder (deps-fix.v1.ts).
 * Tests prompt structure, content, and required instructions.
 */

import { DEPS_FIX_CURRENT_VERSION, depsFixPrompts } from '../prompts/index.js'

describe('depsFixPrompts', () => {
  const promptVersion = depsFixPrompts[DEPS_FIX_CURRENT_VERSION]

  describe('build()', () => {
    it('userPrompt includes projectPath and vulnerabilitiesFound', () => {
      const input = {
        projectPath: 'apps/my-server',
        vulnerabilitiesFound: 10,
        cwd: '/workspace',
      }
      const result = promptVersion.build(input)

      expect(result.userPrompt).toContain('apps/my-server')
      expect(result.userPrompt).toContain('10')
      expect(result.userPrompt).toContain('<project_path>')
      expect(result.userPrompt).toContain('<vulnerabilities_found>')
    })

    it('userPrompt instructs to run npm audit fix', () => {
      const input = { projectPath: 'apps/test', vulnerabilitiesFound: 5 }
      const result = promptVersion.build(input)

      expect(result.userPrompt).toContain('npm audit fix')
      expect(result.userPrompt).toContain('cd')
    })

    it('userPrompt instructs to track modified files using git status', () => {
      const input = { projectPath: 'apps/test', vulnerabilitiesFound: 3 }
      const result = promptVersion.build(input)

      expect(result.userPrompt).toContain('git status')
      expect(result.userPrompt).toContain('package.json')
      expect(result.userPrompt).toContain('package-lock.json')
      expect(result.userPrompt).toContain('files_modified')
    })

    it('userPrompt instructs to run post-verification npm audit --json', () => {
      const input = { projectPath: 'apps/test', vulnerabilitiesFound: 8 }
      const result = promptVersion.build(input)

      expect(result.userPrompt).toContain('post-verification')
      expect(result.userPrompt).toContain('npm audit --json')
      expect(result.userPrompt).toContain('remaining vulnerabilities')
    })

    it('userPrompt includes <deps_fix_result> output format requirement', () => {
      const input = { projectPath: 'apps/test', vulnerabilitiesFound: 7 }
      const result = promptVersion.build(input)

      expect(result.userPrompt).toContain('<deps_fix_result>')
      expect(result.userPrompt).toContain('fix_ran')
      expect(result.userPrompt).toContain('vulnerabilities_fixed')
      expect(result.userPrompt).toContain('vulnerabilities_remaining')
      expect(result.userPrompt).toContain('files_modified')
      expect(result.userPrompt).toContain('fix_summary')
    })

    it('userPrompt calculates vulnerabilities_fixed correctly (initial - remaining)', () => {
      const input = { projectPath: 'apps/test', vulnerabilitiesFound: 10 }
      const result = promptVersion.build(input)

      expect(result.userPrompt).toContain('vulnerabilities_fixed')
      expect(result.userPrompt).toContain('remaining count')
      expect(result.userPrompt).toContain('10')
    })
  })
})
