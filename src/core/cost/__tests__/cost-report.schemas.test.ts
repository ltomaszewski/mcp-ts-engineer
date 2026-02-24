/**
 * Tests for cost report Zod schemas.
 */

import {
  ChildSessionCostEntrySchema,
  DailyCostReportSchema,
  ModelCostBreakdownSchema,
  SessionCostEntrySchema,
  SessionModelBreakdownSchema,
} from '../cost-report.schemas.js'

describe('Cost Report Schemas', () => {
  describe('ChildSessionCostEntrySchema', () => {
    it('validates valid child session cost entry', () => {
      const valid = {
        sid: 'child123456789abcdef0123456789ab',
        capability: 'eng-executor',
        costUsd: 0.05,
        turns: 3,
        inputTokens: 500,
        outputTokens: 250,
      }

      const result = ChildSessionCostEntrySchema.safeParse(valid)
      expect(result.success).toBe(true)
    })

    it('rejects negative cost', () => {
      const invalid = {
        sid: 'child123456789abcdef0123456789ab',
        capability: 'eng-executor',
        costUsd: -0.05,
        turns: 3,
        inputTokens: 500,
        outputTokens: 250,
      }

      const result = ChildSessionCostEntrySchema.safeParse(invalid)
      expect(result.success).toBe(false)
    })

    it('rejects negative turns', () => {
      const invalid = {
        sid: 'child123456789abcdef0123456789ab',
        capability: 'eng-executor',
        costUsd: 0.05,
        turns: -3,
        inputTokens: 500,
        outputTokens: 250,
      }

      const result = ChildSessionCostEntrySchema.safeParse(invalid)
      expect(result.success).toBe(false)
    })

    it('rejects negative tokens', () => {
      const invalid = {
        sid: 'child123456789abcdef0123456789ab',
        capability: 'eng-executor',
        costUsd: 0.05,
        turns: 3,
        inputTokens: -500,
        outputTokens: 250,
      }

      const result = ChildSessionCostEntrySchema.safeParse(invalid)
      expect(result.success).toBe(false)
    })

    it('rejects missing required fields', () => {
      const invalid = {
        sid: 'child123456789abcdef0123456789ab',
        capability: 'eng-executor',
        // missing costUsd, turns, inputTokens, outputTokens
      }

      const result = ChildSessionCostEntrySchema.safeParse(invalid)
      expect(result.success).toBe(false)
    })

    it('validates with commitSha field', () => {
      const valid = {
        sid: 'child123456789abcdef0123456789ab',
        capability: 'eng-executor',
        costUsd: 0.05,
        turns: 3,
        inputTokens: 500,
        outputTokens: 250,
        commitSha: 'abc123def456',
      }

      const result = ChildSessionCostEntrySchema.safeParse(valid)
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.commitSha).toBe('abc123def456')
      }
    })

    it('validates without commitSha field (backward compatibility)', () => {
      const valid = {
        sid: 'child123456789abcdef0123456789ab',
        capability: 'eng-executor',
        costUsd: 0.05,
        turns: 3,
        inputTokens: 500,
        outputTokens: 250,
      }

      const result = ChildSessionCostEntrySchema.safeParse(valid)
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.commitSha).toBeUndefined()
      }
    })

    it('validates with model and status fields', () => {
      const valid = {
        sid: 'child123456789abcdef0123456789ab',
        capability: 'eng-executor',
        costUsd: 0.05,
        turns: 3,
        inputTokens: 500,
        outputTokens: 250,
        model: 'claude-3-5-sonnet-20241022',
        status: 'success' as const,
      }

      const result = ChildSessionCostEntrySchema.safeParse(valid)
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.model).toBe('claude-3-5-sonnet-20241022')
        expect(result.data.status).toBe('success')
      }
    })

    it('applies default values for model and status', () => {
      const minimal = {
        sid: 'child123456789abcdef0123456789ab',
        capability: 'eng-executor',
        costUsd: 0.05,
        turns: 3,
        inputTokens: 500,
        outputTokens: 250,
      }

      const result = ChildSessionCostEntrySchema.safeParse(minimal)
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.model).toBe('unknown')
        expect(result.data.status).toBe('success')
      }
    })

    it('rejects invalid status enum for child', () => {
      const invalid = {
        sid: 'child123456789abcdef0123456789ab',
        capability: 'eng-executor',
        costUsd: 0.05,
        turns: 3,
        inputTokens: 500,
        outputTokens: 250,
        status: 'invalid-status',
      }

      const result = ChildSessionCostEntrySchema.safeParse(invalid)
      expect(result.success).toBe(false)
    })

    it('validates error child session', () => {
      const errorChild = {
        sid: 'child123456789abcdef0123456789ab',
        capability: 'eng-executor',
        costUsd: 0.05,
        turns: 3,
        inputTokens: 500,
        outputTokens: 250,
        model: 'claude-3-5-haiku-20241022',
        status: 'error' as const,
      }

      const result = ChildSessionCostEntrySchema.safeParse(errorChild)
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.status).toBe('error')
        expect(result.data.model).toBe('claude-3-5-haiku-20241022')
      }
    })

    it('accepts valid cache fields in ChildSessionCostEntry (AC-5, AC-13)', () => {
      const validWithCache = {
        sid: 'child123456789abcdef0123456789ab',
        capability: 'eng-executor',
        costUsd: 0.05,
        turns: 3,
        inputTokens: 10000,
        outputTokens: 500,
        model: 'claude-3-5-sonnet-20241022',
        status: 'success' as const,
        promptCacheWrite: 2000,
        promptCacheRead: 7000,
      }

      const result = ChildSessionCostEntrySchema.safeParse(validWithCache)
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.promptCacheWrite).toBe(2000)
        expect(result.data.promptCacheRead).toBe(7000)
      }
    })

    it('accepts missing cache fields in ChildSessionCostEntry (AC-5, AC-10, AC-13)', () => {
      const validWithoutCache = {
        sid: 'child123456789abcdef0123456789ab',
        capability: 'eng-executor',
        costUsd: 0.05,
        turns: 3,
        inputTokens: 500,
        outputTokens: 250,
        model: 'claude-3-5-sonnet-20241022',
        status: 'success' as const,
      }

      const result = ChildSessionCostEntrySchema.safeParse(validWithoutCache)
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.promptCacheWrite).toBeUndefined()
        expect(result.data.promptCacheRead).toBeUndefined()
      }
    })

    it('rejects negative cache tokens (AC-5, AC-13)', () => {
      const invalidNegativeCreation = {
        sid: 'child123456789abcdef0123456789ab',
        capability: 'eng-executor',
        costUsd: 0.05,
        turns: 3,
        inputTokens: 500,
        outputTokens: 250,
        promptCacheWrite: -100,
      }

      const resultCreation = ChildSessionCostEntrySchema.safeParse(invalidNegativeCreation)
      expect(resultCreation.success).toBe(false)

      const invalidNegativeRead = {
        sid: 'child123456789abcdef0123456789ab',
        capability: 'eng-executor',
        costUsd: 0.05,
        turns: 3,
        inputTokens: 500,
        outputTokens: 250,
        promptCacheRead: -200,
      }

      const resultRead = ChildSessionCostEntrySchema.safeParse(invalidNegativeRead)
      expect(resultRead.success).toBe(false)
    })

    it('rejects non-integer cache tokens (AC-5, AC-13)', () => {
      const invalidFloat = {
        sid: 'child123456789abcdef0123456789ab',
        capability: 'eng-executor',
        costUsd: 0.05,
        turns: 3,
        inputTokens: 500,
        outputTokens: 250,
        promptCacheWrite: 100.5,
      }

      const result = ChildSessionCostEntrySchema.safeParse(invalidFloat)
      expect(result.success).toBe(false)
    })

    it('accepts promptVersion field (AC-3)', () => {
      const validWithVersion = {
        sid: 'child123456789abcdef0123456789ab',
        capability: 'eng-executor',
        costUsd: 0.05,
        turns: 3,
        inputTokens: 500,
        outputTokens: 250,
        promptVersion: 'v2',
      }

      const result = ChildSessionCostEntrySchema.safeParse(validWithVersion)
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.promptVersion).toBe('v2')
      }
    })

    it('accepts totalTokensIn and totalTokensOut fields (AC-4, AC-5, AC-12)', () => {
      const validWithTotals = {
        sid: 'child123456789abcdef0123456789ab',
        capability: 'eng-executor',
        costUsd: 0.05,
        turns: 3,
        inputTokens: 1500,
        outputTokens: 800,
        totalTokensIn: 10000,
        totalTokensOut: 800,
      }

      const result = ChildSessionCostEntrySchema.safeParse(validWithTotals)
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.totalTokensIn).toBe(10000)
        expect(result.data.totalTokensOut).toBe(800)
      }
    })

    it('validates all fields are optional except required ones (AC-1, AC-2, AC-3)', () => {
      const minimalValid = {
        sid: 'child123456789abcdef0123456789ab',
        capability: 'eng-executor',
        costUsd: 0.05,
        turns: 3,
        inputTokens: 500,
        outputTokens: 250,
        // No cache fields, promptVersion, totalTokensIn, or totalTokensOut
      }

      const result = ChildSessionCostEntrySchema.safeParse(minimalValid)
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.promptCacheWrite).toBeUndefined()
        expect(result.data.promptCacheRead).toBeUndefined()
        expect(result.data.promptVersion).toBeUndefined()
        expect(result.data.totalTokensIn).toBeUndefined()
        expect(result.data.totalTokensOut).toBeUndefined()
      }
    })
  })

  describe('ModelCostBreakdownSchema', () => {
    it('validates valid model breakdown', () => {
      const valid = {
        inputTokens: 100,
        outputTokens: 50,
        costUsd: 0.01,
        count: 1,
      }

      const result = ModelCostBreakdownSchema.safeParse(valid)
      expect(result.success).toBe(true)
    })

    it('rejects negative values', () => {
      const invalid = {
        inputTokens: -100,
        outputTokens: 50,
        costUsd: 0.01,
        count: 1,
      }

      const result = ModelCostBreakdownSchema.safeParse(invalid)
      expect(result.success).toBe(false)
    })

    it('rejects missing required fields', () => {
      const invalid = {
        inputTokens: 100,
        outputTokens: 50,
      }

      const result = ModelCostBreakdownSchema.safeParse(invalid)
      expect(result.success).toBe(false)
    })
  })

  describe('SessionModelBreakdownSchema', () => {
    it('validates valid session model breakdown', () => {
      const valid = {
        'claude-3-5-sonnet-20241022': {
          inputTokens: 100,
          outputTokens: 50,
          costUsd: 0.01,
          count: 1,
        },
        'claude-3-5-haiku-20241022': {
          inputTokens: 200,
          outputTokens: 100,
          costUsd: 0.005,
          count: 2,
        },
      }

      const result = SessionModelBreakdownSchema.safeParse(valid)
      expect(result.success).toBe(true)
    })

    it('accepts empty object (no models used)', () => {
      const result = SessionModelBreakdownSchema.safeParse({})
      expect(result.success).toBe(true)
    })

    it('rejects invalid model breakdown entries', () => {
      const invalid = {
        'claude-3-5-sonnet-20241022': {
          inputTokens: -100, // negative
          outputTokens: 50,
          costUsd: 0.01,
          count: 1,
        },
      }

      const result = SessionModelBreakdownSchema.safeParse(invalid)
      expect(result.success).toBe(false)
    })
  })

  describe('SessionCostEntrySchema', () => {
    it('validates valid session cost entry with sid (short key)', () => {
      const valid = {
        sid: '0123456789abcdef0123456789abcdef',
        startedAt: '2024-01-15T10:00:00.000Z',
        completedAt: '2024-01-15T10:05:00.000Z',
        totalInputTokens: 1000,
        totalOutputTokens: 500,
        totalCostUsd: 0.05,
        invocationCount: 5,
        byModel: {
          'claude-3-5-sonnet-20241022': {
            inputTokens: 1000,
            outputTokens: 500,
            costUsd: 0.05,
            count: 5,
          },
        },
      }

      const result = SessionCostEntrySchema.safeParse(valid)
      expect(result.success).toBe(true)
    })

    it('validates session ID format (32 hex chars without prefix)', () => {
      const invalidId = {
        sid: 'invalid-session-id',
        startedAt: '2024-01-15T10:00:00.000Z',
        totalInputTokens: 100,
        totalOutputTokens: 50,
        totalCostUsd: 0.01,
        invocationCount: 1,
        byModel: {},
      }

      const result = SessionCostEntrySchema.safeParse(invalidId)
      expect(result.success).toBe(false)
    })

    it('validates ISO 8601 timestamp format', () => {
      const invalidTimestamp = {
        sid: '0123456789abcdef0123456789abcdef',
        startedAt: 'not-a-timestamp',
        totalInputTokens: 100,
        totalOutputTokens: 50,
        totalCostUsd: 0.01,
        invocationCount: 1,
        byModel: {},
      }

      const result = SessionCostEntrySchema.safeParse(invalidTimestamp)
      expect(result.success).toBe(false)
    })

    it('accepts optional completedAt field', () => {
      const withoutCompletedAt = {
        sid: '0123456789abcdef0123456789abcdef',
        startedAt: '2024-01-15T10:00:00.000Z',
        totalInputTokens: 100,
        totalOutputTokens: 50,
        totalCostUsd: 0.01,
        invocationCount: 1,
        byModel: {},
      }

      const result = SessionCostEntrySchema.safeParse(withoutCompletedAt)
      expect(result.success).toBe(true)
    })

    it('rejects negative token counts', () => {
      const invalid = {
        sid: '0123456789abcdef0123456789abcdef',
        startedAt: '2024-01-15T10:00:00.000Z',
        totalInputTokens: -100,
        totalOutputTokens: 50,
        totalCostUsd: 0.01,
        invocationCount: 1,
        byModel: {},
      }

      const result = SessionCostEntrySchema.safeParse(invalid)
      expect(result.success).toBe(false)
    })

    it('validates session with childSessions array', () => {
      const validWithChildren = {
        sid: '0123456789abcdef0123456789abcdef',
        startedAt: '2024-01-15T10:00:00.000Z',
        completedAt: '2024-01-15T10:05:00.000Z',
        totalInputTokens: 1000,
        totalOutputTokens: 500,
        totalCostUsd: 0.05,
        invocationCount: 5,
        byModel: {
          'claude-3-5-sonnet-20241022': {
            inputTokens: 1000,
            outputTokens: 500,
            costUsd: 0.05,
            count: 5,
          },
        },
        childSessions: [
          {
            sid: 'child123456789abcdef0123456789ab',
            capability: 'eng-executor',
            costUsd: 0.03,
            turns: 3,
            inputTokens: 600,
            outputTokens: 300,
          },
          {
            sid: 'child987654321fedcba9876543210fe',
            capability: 'audit-executor',
            costUsd: 0.02,
            turns: 2,
            inputTokens: 400,
            outputTokens: 200,
          },
        ],
      }

      const result = SessionCostEntrySchema.safeParse(validWithChildren)
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.childSessions).toHaveLength(2)
        expect(result.data.childSessions?.[0]?.sid).toBe('child123456789abcdef0123456789ab')
      }
    })

    it('validates session without childSessions (backward compatible)', () => {
      const validWithoutChildren = {
        sid: '0123456789abcdef0123456789abcdef',
        startedAt: '2024-01-15T10:00:00.000Z',
        totalInputTokens: 100,
        totalOutputTokens: 50,
        totalCostUsd: 0.01,
        invocationCount: 1,
        byModel: {},
      }

      const result = SessionCostEntrySchema.safeParse(validWithoutChildren)
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.childSessions).toBeUndefined()
      }
    })

    it('rejects session with invalid childSessions entries', () => {
      const invalidChildren = {
        sid: '0123456789abcdef0123456789abcdef',
        startedAt: '2024-01-15T10:00:00.000Z',
        totalInputTokens: 100,
        totalOutputTokens: 50,
        totalCostUsd: 0.01,
        invocationCount: 1,
        byModel: {},
        childSessions: [
          {
            sid: 'child123',
            capability: 'eng-executor',
            costUsd: -0.03, // negative cost - invalid
            turns: 3,
            inputTokens: 600,
            outputTokens: 300,
          },
        ],
      }

      const result = SessionCostEntrySchema.safeParse(invalidChildren)
      expect(result.success).toBe(false)
    })

    it('validates with commitSha field', () => {
      const validWithCommitSha = {
        sid: '0123456789abcdef0123456789abcdef',
        startedAt: '2024-01-15T10:00:00.000Z',
        completedAt: '2024-01-15T10:05:00.000Z',
        totalInputTokens: 1000,
        totalOutputTokens: 500,
        totalCostUsd: 0.05,
        invocationCount: 5,
        byModel: {
          'claude-3-5-sonnet-20241022': {
            inputTokens: 1000,
            outputTokens: 500,
            costUsd: 0.05,
            count: 5,
          },
        },
        commitSha: 'abc123def456789',
      }

      const result = SessionCostEntrySchema.safeParse(validWithCommitSha)
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.commitSha).toBe('abc123def456789')
      }
    })

    it('validates with all new metadata fields', () => {
      const validWithMetadata = {
        sid: '0123456789abcdef0123456789abcdef',
        startedAt: '2024-01-15T10:00:00.000Z',
        completedAt: '2024-01-15T10:05:00.000Z',
        totalInputTokens: 1000,
        totalOutputTokens: 500,
        totalCostUsd: 0.05,
        invocationCount: 5,
        byModel: {
          'claude-3-5-sonnet-20241022': {
            inputTokens: 1000,
            outputTokens: 500,
            costUsd: 0.05,
            count: 5,
          },
        },
        capability: 'todo-code-writer',
        model: 'claude-3-5-sonnet-20241022',
        status: 'success' as const,
        specHash: 'abc123def4567890',
        input: { spec_path: 'test.md', max_phases: 5 },
        errorType: undefined,
        errorMessage: undefined,
      }

      const result = SessionCostEntrySchema.safeParse(validWithMetadata)
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.capability).toBe('todo-code-writer')
        expect(result.data.model).toBe('claude-3-5-sonnet-20241022')
        expect(result.data.status).toBe('success')
        expect(result.data.specHash).toBe('abc123def4567890')
        expect(result.data.input).toEqual({ spec_path: 'test.md', max_phases: 5 })
      }
    })

    it('applies default values for capability, model, and status', () => {
      const minimal = {
        sid: '0123456789abcdef0123456789abcdef',
        startedAt: '2024-01-15T10:00:00.000Z',
        totalInputTokens: 100,
        totalOutputTokens: 50,
        totalCostUsd: 0.01,
        invocationCount: 1,
        byModel: {},
      }

      const result = SessionCostEntrySchema.safeParse(minimal)
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.capability).toBe('unknown')
        expect(result.data.model).toBe('unknown')
        expect(result.data.status).toBe('success')
      }
    })

    it('rejects invalid status enum value', () => {
      const invalidStatus = {
        sid: '0123456789abcdef0123456789abcdef',
        startedAt: '2024-01-15T10:00:00.000Z',
        totalInputTokens: 100,
        totalOutputTokens: 50,
        totalCostUsd: 0.01,
        invocationCount: 1,
        byModel: {},
        status: 'invalid-status',
      }

      const result = SessionCostEntrySchema.safeParse(invalidStatus)
      expect(result.success).toBe(false)
    })

    it('rejects invalid errorType enum value', () => {
      const invalidErrorType = {
        sid: '0123456789abcdef0123456789abcdef',
        startedAt: '2024-01-15T10:00:00.000Z',
        totalInputTokens: 100,
        totalOutputTokens: 50,
        totalCostUsd: 0.01,
        invocationCount: 1,
        byModel: {},
        errorType: 'invalid-error-type',
      }

      const result = SessionCostEntrySchema.safeParse(invalidErrorType)
      expect(result.success).toBe(false)
    })

    it('accepts optional fields as undefined', () => {
      const withOptionals = {
        sid: '0123456789abcdef0123456789abcdef',
        startedAt: '2024-01-15T10:00:00.000Z',
        totalInputTokens: 100,
        totalOutputTokens: 50,
        totalCostUsd: 0.01,
        invocationCount: 1,
        byModel: {},
        specHash: undefined,
        input: undefined,
        errorType: undefined,
        errorMessage: undefined,
      }

      const result = SessionCostEntrySchema.safeParse(withOptionals)
      expect(result.success).toBe(true)
    })

    it('accepts input field with nested objects and arrays', () => {
      const withNestedInput = {
        sid: '0123456789abcdef0123456789abcdef',
        startedAt: '2024-01-15T10:00:00.000Z',
        totalInputTokens: 100,
        totalOutputTokens: 50,
        totalCostUsd: 0.01,
        invocationCount: 1,
        byModel: {},
        input: {
          spec_path: 'test.md',
          max_phases: 5,
          nested: { deep: { value: 'test' } },
          array: [1, 2, 3],
        },
      }

      const result = SessionCostEntrySchema.safeParse(withNestedInput)
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.input).toEqual({
          spec_path: 'test.md',
          max_phases: 5,
          nested: { deep: { value: 'test' } },
          array: [1, 2, 3],
        })
      }
    })

    it('accepts errorMessage with long strings', () => {
      const longMessage = 'A'.repeat(2000)
      const withLongError = {
        sid: '0123456789abcdef0123456789abcdef',
        startedAt: '2024-01-15T10:00:00.000Z',
        totalInputTokens: 100,
        totalOutputTokens: 50,
        totalCostUsd: 0.01,
        invocationCount: 1,
        byModel: {},
        errorMessage: longMessage,
      }

      const result = SessionCostEntrySchema.safeParse(withLongError)
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.errorMessage).toBe(longMessage)
      }
    })

    it('validates error session with all error fields', () => {
      const errorSession = {
        sid: '0123456789abcdef0123456789abcdef',
        startedAt: '2024-01-15T10:00:00.000Z',
        completedAt: '2024-01-15T10:05:00.000Z',
        totalInputTokens: 1000,
        totalOutputTokens: 500,
        totalCostUsd: 0.05,
        invocationCount: 5,
        byModel: {
          'claude-3-5-sonnet-20241022': {
            inputTokens: 1000,
            outputTokens: 500,
            costUsd: 0.05,
            count: 5,
          },
        },
        capability: 'todo-code-writer',
        model: 'claude-3-5-sonnet-20241022',
        status: 'error' as const,
        specHash: 'abc123def4567890',
        input: { spec_path: 'test.md' },
        errorType: 'timeout' as const,
        errorMessage: 'Timeout after 60 seconds',
      }

      const result = SessionCostEntrySchema.safeParse(errorSession)
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.status).toBe('error')
        expect(result.data.errorType).toBe('timeout')
        expect(result.data.errorMessage).toBe('Timeout after 60 seconds')
      }
    })

    it('accepts valid cache fields in SessionCostEntry (AC-6, AC-7, AC-13)', () => {
      const validWithCache = {
        sid: '0123456789abcdef0123456789abcdef',
        startedAt: '2024-01-15T10:00:00.000Z',
        totalInputTokens: 10000,
        totalOutputTokens: 500,
        totalCostUsd: 0.05,
        invocationCount: 1,
        byModel: {},
        totalPromptCacheWrite: 2000,
        totalPromptCacheRead: 7000,
        cacheHitRate: 0.7,
      }

      const result = SessionCostEntrySchema.safeParse(validWithCache)
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.totalPromptCacheWrite).toBe(2000)
        expect(result.data.totalPromptCacheRead).toBe(7000)
        expect(result.data.cacheHitRate).toBe(0.7)
      }
    })

    it('rejects cache hit rate outside 0-1 range (AC-7, AC-13)', () => {
      const tooHigh = {
        sid: '0123456789abcdef0123456789abcdef',
        startedAt: '2024-01-15T10:00:00.000Z',
        totalInputTokens: 100,
        totalOutputTokens: 50,
        totalCostUsd: 0.01,
        invocationCount: 1,
        byModel: {},
        cacheHitRate: 1.5,
      }

      const resultHigh = SessionCostEntrySchema.safeParse(tooHigh)
      expect(resultHigh.success).toBe(false)

      const tooLow = {
        sid: '0123456789abcdef0123456789abcdef',
        startedAt: '2024-01-15T10:00:00.000Z',
        totalInputTokens: 100,
        totalOutputTokens: 50,
        totalCostUsd: 0.01,
        invocationCount: 1,
        byModel: {},
        cacheHitRate: -0.1,
      }

      const resultLow = SessionCostEntrySchema.safeParse(tooLow)
      expect(resultLow.success).toBe(false)
    })

    it('accepts cache hit rate edge values (0, 0.5, 1) (AC-7, AC-13)', () => {
      const zero = {
        sid: '0123456789abcdef0123456789abcdef',
        startedAt: '2024-01-15T10:00:00.000Z',
        totalInputTokens: 100,
        totalOutputTokens: 50,
        totalCostUsd: 0.01,
        invocationCount: 1,
        byModel: {},
        cacheHitRate: 0,
      }

      expect(SessionCostEntrySchema.safeParse(zero).success).toBe(true)

      const half = { ...zero, cacheHitRate: 0.5 }
      expect(SessionCostEntrySchema.safeParse(half).success).toBe(true)

      const one = { ...zero, cacheHitRate: 1 }
      expect(SessionCostEntrySchema.safeParse(one).success).toBe(true)
    })
  })

  describe('DailyCostReportSchema', () => {
    it('validates valid daily cost report', () => {
      const valid = {
        date: '2024-01-15',
        totalCostUsd: 0.15,
        totalSessions: 3,
        sessions: [
          {
            sid: '0123456789abcdef0123456789abcdef',
            startedAt: '2024-01-15T10:00:00.000Z',
            completedAt: '2024-01-15T10:05:00.000Z',
            totalInputTokens: 1000,
            totalOutputTokens: 500,
            totalCostUsd: 0.05,
            invocationCount: 5,
            byModel: {
              'claude-3-5-sonnet-20241022': {
                inputTokens: 1000,
                outputTokens: 500,
                costUsd: 0.05,
                count: 5,
              },
            },
          },
        ],
        aggregatedByModel: {
          'claude-3-5-sonnet-20241022': {
            inputTokens: 1000,
            outputTokens: 500,
            costUsd: 0.05,
            count: 5,
          },
        },
      }

      const result = DailyCostReportSchema.safeParse(valid)
      expect(result.success).toBe(true)
    })

    it('validates date format (YYYY-MM-DD)', () => {
      const invalidDate = {
        date: '01/15/2024', // Wrong format
        totalCostUsd: 0.05,
        totalSessions: 1,
        sessions: [],
        aggregatedByModel: {},
      }

      const result = DailyCostReportSchema.safeParse(invalidDate)
      expect(result.success).toBe(false)
    })

    it('accepts empty sessions array', () => {
      const emptyReport = {
        date: '2024-01-15',
        totalCostUsd: 0,
        totalSessions: 0,
        sessions: [],
        aggregatedByModel: {},
      }

      const result = DailyCostReportSchema.safeParse(emptyReport)
      expect(result.success).toBe(true)
    })

    it('rejects negative total cost', () => {
      const invalid = {
        date: '2024-01-15',
        totalCostUsd: -0.05,
        totalSessions: 1,
        sessions: [],
        aggregatedByModel: {},
      }

      const result = DailyCostReportSchema.safeParse(invalid)
      expect(result.success).toBe(false)
    })

    it('rejects missing required fields', () => {
      const invalid = {
        date: '2024-01-15',
        totalCostUsd: 0.05,
        // Missing totalSessions, sessions, aggregatedByModel
      }

      const result = DailyCostReportSchema.safeParse(invalid)
      expect(result.success).toBe(false)
    })
  })
})
