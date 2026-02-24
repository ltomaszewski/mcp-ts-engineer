import { vi } from 'vitest'
/**
 * Tests for ClaudeProvider PresetTools and appendSystemPrompt handling.
 */

import { ClaudeProvider } from '../claude.provider.js'
import { assistantMsg, type MockSDKMessage, successResult, textBlock } from './test-helpers.js'

describe('ClaudeProvider', () => {
  describe('enhanced PresetTools and appendSystemPrompt', () => {
    it('should pass preset tools with customTools: set options.tools to customTools array', async () => {
      const customTools = [{ name: 'custom_tool', description: 'Custom tool', inputSchema: {} }]
      const messages: MockSDKMessage[] = [assistantMsg([textBlock('Done')]), successResult()]

      let capturedOptions: Record<string, unknown> | undefined
      const mockQuery = vi.fn(async function* (params: {
        prompt: string
        options: Record<string, unknown>
      }) {
        capturedOptions = params.options
        for (const message of messages) {
          yield message
        }
      })

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const provider = new ClaudeProvider(mockQuery as any)

      await provider.query({
        prompt: 'Test',
        tools: {
          type: 'preset',
          preset: 'claude_code',
          customTools,
        },
      })

      expect(capturedOptions?.tools).toEqual(customTools)
    })

    it('should extract allowedTools from PresetTools to SDK options', async () => {
      const messages: MockSDKMessage[] = [assistantMsg([textBlock('Done')]), successResult()]

      let capturedOptions: Record<string, unknown> | undefined
      const mockQuery = vi.fn(async function* (params: {
        prompt: string
        options: Record<string, unknown>
      }) {
        capturedOptions = params.options
        for (const message of messages) {
          yield message
        }
      })

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const provider = new ClaudeProvider(mockQuery as any)

      await provider.query({
        prompt: 'Test',
        tools: {
          type: 'preset',
          preset: 'claude_code',
          allowedTools: ['read', 'write'],
        },
      })

      expect(capturedOptions?.allowedTools).toEqual(['read', 'write'])
    })

    it('should extract disallowedTools from PresetTools to SDK options', async () => {
      const messages: MockSDKMessage[] = [assistantMsg([textBlock('Done')]), successResult()]

      let capturedOptions: Record<string, unknown> | undefined
      const mockQuery = vi.fn(async function* (params: {
        prompt: string
        options: Record<string, unknown>
      }) {
        capturedOptions = params.options
        for (const message of messages) {
          yield message
        }
      })

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const provider = new ClaudeProvider(mockQuery as any)

      await provider.query({
        prompt: 'Test',
        tools: {
          type: 'preset',
          preset: 'claude_code',
          disallowedTools: ['bash', 'edit'],
        },
      })

      expect(capturedOptions?.disallowedTools).toEqual(['bash', 'edit'])
    })

    it('should compose appendSystemPrompt from PresetSystemPrompt.append and request.appendSystemPrompt', async () => {
      const messages: MockSDKMessage[] = [assistantMsg([textBlock('Done')]), successResult()]

      let capturedOptions: Record<string, unknown> | undefined
      const mockQuery = vi.fn(async function* (params: {
        prompt: string
        options: Record<string, unknown>
      }) {
        capturedOptions = params.options
        for (const message of messages) {
          yield message
        }
      })

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const provider = new ClaudeProvider(mockQuery as any)

      await provider.query({
        prompt: 'Test',
        systemPrompt: {
          type: 'preset',
          preset: 'claude_code',
          append: 'Additional context from preset',
        },
        appendSystemPrompt: 'Extra instructions from request',
      })

      expect(capturedOptions?.appendSystemPrompt).toBe(
        'Additional context from preset\n\nExtra instructions from request',
      )
    })

    it('should pass appendSystemPrompt through when no PresetSystemPrompt.append', async () => {
      const messages: MockSDKMessage[] = [assistantMsg([textBlock('Done')]), successResult()]

      let capturedOptions: Record<string, unknown> | undefined
      const mockQuery = vi.fn(async function* (params: {
        prompt: string
        options: Record<string, unknown>
      }) {
        capturedOptions = params.options
        for (const message of messages) {
          yield message
        }
      })

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const provider = new ClaudeProvider(mockQuery as any)

      await provider.query({
        prompt: 'Test',
        appendSystemPrompt: 'Just request instructions',
      })

      expect(capturedOptions?.appendSystemPrompt).toBe('Just request instructions')
    })

    it('should extract PresetSystemPrompt.append as appendSystemPrompt when no request.appendSystemPrompt', async () => {
      const messages: MockSDKMessage[] = [assistantMsg([textBlock('Done')]), successResult()]

      let capturedOptions: Record<string, unknown> | undefined
      const mockQuery = vi.fn(async function* (params: {
        prompt: string
        options: Record<string, unknown>
      }) {
        capturedOptions = params.options
        for (const message of messages) {
          yield message
        }
      })

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const provider = new ClaudeProvider(mockQuery as any)

      await provider.query({
        prompt: 'Test',
        systemPrompt: {
          type: 'preset',
          preset: 'claude_code',
          append: 'Only preset append',
        },
      })

      expect(capturedOptions?.appendSystemPrompt).toBe('Only preset append')
    })

    it('should preserve backward compat: plain preset tools pass through to options.tools', async () => {
      const messages: MockSDKMessage[] = [assistantMsg([textBlock('Done')]), successResult()]

      let capturedOptions: Record<string, unknown> | undefined
      const mockQuery = vi.fn(async function* (params: {
        prompt: string
        options: Record<string, unknown>
      }) {
        capturedOptions = params.options
        for (const message of messages) {
          yield message
        }
      })

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const provider = new ClaudeProvider(mockQuery as any)

      await provider.query({
        prompt: 'Test',
        tools: {
          type: 'preset',
          preset: 'claude_code',
        },
      })

      expect(capturedOptions?.tools).toEqual({
        type: 'preset',
        preset: 'claude_code',
      })
    })

    it('should not set options.tools when customTools is empty array', async () => {
      const messages: MockSDKMessage[] = [assistantMsg([textBlock('Done')]), successResult()]

      let capturedOptions: Record<string, unknown> | undefined
      const mockQuery = vi.fn(async function* (params: {
        prompt: string
        options: Record<string, unknown>
      }) {
        capturedOptions = params.options
        for (const message of messages) {
          yield message
        }
      })

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const provider = new ClaudeProvider(mockQuery as any)

      await provider.query({
        prompt: 'Test',
        tools: {
          type: 'preset',
          preset: 'claude_code',
          customTools: [],
        },
      })

      // Should still have the preset object since customTools is empty
      expect(capturedOptions?.tools).toEqual({
        type: 'preset',
        preset: 'claude_code',
      })
    })
  })
})
