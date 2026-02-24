/**
 * Tests for echo-agent Zod schemas.
 */

import { EchoAgentInputSchema, EchoAgentOutputSchema } from '../echo-agent.schema.js'

describe('EchoAgentInputSchema', () => {
  describe('valid inputs', () => {
    it('accepts valid prompt with haiku model', () => {
      const result = EchoAgentInputSchema.safeParse({
        prompt: 'Hello, world!',
        model: 'haiku',
      })

      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.prompt).toBe('Hello, world!')
        expect(result.data.model).toBe('haiku')
      }
    })

    it('accepts valid prompt with sonnet model', () => {
      const result = EchoAgentInputSchema.safeParse({
        prompt: 'Test prompt',
        model: 'sonnet',
      })

      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.model).toBe('sonnet')
      }
    })

    it('applies default model when not provided', () => {
      const result = EchoAgentInputSchema.safeParse({
        prompt: 'Test prompt',
      })

      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.model).toBe('haiku')
      }
    })

    it('accepts maximum length prompt', () => {
      const longPrompt = 'a'.repeat(10000)
      const result = EchoAgentInputSchema.safeParse({
        prompt: longPrompt,
        model: 'haiku',
      })

      expect(result.success).toBe(true)
    })
  })

  describe('invalid inputs', () => {
    it('rejects empty prompt', () => {
      const result = EchoAgentInputSchema.safeParse({
        prompt: '',
        model: 'haiku',
      })

      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.issues[0]?.message).toContain('Prompt is required')
      }
    })

    it('rejects prompt exceeding maximum length', () => {
      const tooLongPrompt = 'a'.repeat(10001)
      const result = EchoAgentInputSchema.safeParse({
        prompt: tooLongPrompt,
        model: 'haiku',
      })

      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.issues[0]?.message).toContain('maximum length')
      }
    })

    it('rejects invalid model', () => {
      const result = EchoAgentInputSchema.safeParse({
        prompt: 'Test',
        model: 'gpt-4',
      })

      expect(result.success).toBe(false)
    })

    it('rejects missing prompt', () => {
      const result = EchoAgentInputSchema.safeParse({
        model: 'haiku',
      })

      expect(result.success).toBe(false)
    })

    it('rejects non-string prompt', () => {
      const result = EchoAgentInputSchema.safeParse({
        prompt: 123,
        model: 'haiku',
      })

      expect(result.success).toBe(false)
    })
  })
})

describe('EchoAgentOutputSchema', () => {
  it('accepts valid output', () => {
    const result = EchoAgentOutputSchema.safeParse({
      response: 'Test response',
      cost_usd: 0.000123,
      turns: 1,
      session_id: 'sess_abc123',
    })

    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.response).toBe('Test response')
      expect(result.data.cost_usd).toBe(0.000123)
      expect(result.data.turns).toBe(1)
      expect(result.data.session_id).toBe('sess_abc123')
    }
  })

  it('rejects missing response', () => {
    const result = EchoAgentOutputSchema.safeParse({
      cost_usd: 0.001,
      turns: 1,
      session_id: 'sess_abc123',
    })

    expect(result.success).toBe(false)
  })

  it('rejects non-integer turns', () => {
    const result = EchoAgentOutputSchema.safeParse({
      response: 'Test',
      cost_usd: 0.001,
      turns: 1.5,
      session_id: 'sess_abc123',
    })

    expect(result.success).toBe(false)
  })

  it('rejects non-number cost', () => {
    const result = EchoAgentOutputSchema.safeParse({
      response: 'Test',
      cost_usd: 'free',
      turns: 1,
      session_id: 'sess_abc123',
    })

    expect(result.success).toBe(false)
  })

  it('accepts output without session_id (optional, framework-injected)', () => {
    const result = EchoAgentOutputSchema.safeParse({
      response: 'Test',
      cost_usd: 0.001,
      turns: 1,
    })

    expect(result.success).toBe(true)
  })
})
