/**
 * Tests for error utility functions.
 */

import { extractCauseChain, extractErrorChain, extractErrorInfo } from '../error-utils.js'

describe('extractErrorChain', () => {
  it('should extract message from simple error', () => {
    const error = new Error('Simple error')
    expect(extractErrorChain(error)).toBe('Simple error')
  })

  it('should extract message from non-Error value', () => {
    expect(extractErrorChain('string error')).toBe('string error')
    expect(extractErrorChain(123)).toBe('123')
    expect(extractErrorChain(null)).toBe('null')
    expect(extractErrorChain(undefined)).toBe('undefined')
  })

  it('should include cause in message', () => {
    const cause = new Error('Root cause')
    const error = new Error('Wrapper error', { cause })

    const result = extractErrorChain(error)

    expect(result).toBe('Wrapper error [Caused by: Root cause]')
  })

  it('should handle deeply nested cause chain', () => {
    const root = new Error('Level 3')
    const middle = new Error('Level 2', { cause: root })
    const outer = new Error('Level 1', { cause: middle })

    const result = extractErrorChain(outer)

    expect(result).toBe('Level 1 [Caused by: Level 2 [Caused by: Level 3]]')
  })

  it('should handle non-Error cause', () => {
    const error = new Error('Wrapper', { cause: 'string cause' })

    const result = extractErrorChain(error)

    expect(result).toBe('Wrapper [Caused by: string cause]')
  })

  it('should prevent infinite loops with max depth', () => {
    // Create a chain deeper than MAX_CAUSE_DEPTH (10)
    let error: Error = new Error('Level 15')
    for (let i = 14; i >= 1; i--) {
      error = new Error(`Level ${i}`, { cause: error })
    }

    const result = extractErrorChain(error)

    expect(result).toContain('[Error chain too deep]')
  })
})

describe('extractCauseChain', () => {
  it('should return single-element array for simple error', () => {
    const error = new Error('Simple')

    const result = extractCauseChain(error)

    expect(result).toEqual(['Error: Simple'])
  })

  it('should return array of all causes', () => {
    const root = new Error('Root')
    const middle = new TypeError('Middle')
    ;(middle as Error & { cause: Error }).cause = root
    const outer = new RangeError('Outer')
    ;(outer as Error & { cause: Error }).cause = middle

    const result = extractCauseChain(outer)

    expect(result).toEqual(['RangeError: Outer', 'TypeError: Middle', 'Error: Root'])
  })

  it('should handle non-Error values', () => {
    expect(extractCauseChain('string')).toEqual(['string'])
    expect(extractCauseChain(null)).toEqual([])
    expect(extractCauseChain(undefined)).toEqual([])
  })

  it('should handle non-Error cause in chain', () => {
    const error = new Error('Outer', { cause: 'string cause' })

    const result = extractCauseChain(error)

    expect(result).toEqual(['Error: Outer', 'string cause'])
  })
})

describe('extractErrorInfo', () => {
  it('should extract full info from Error', () => {
    const cause = new Error('Cause')
    const error = new TypeError('Main error', { cause })

    const result = extractErrorInfo(error)

    expect(result.message).toBe('Main error')
    expect(result.type).toBe('TypeError')
    expect(result.fullMessage).toBe('Main error [Caused by: Cause]')
    expect(result.causeChain).toEqual(['TypeError: Main error', 'Error: Cause'])
    expect(result.stack).toBeDefined()
  })

  it('should handle non-Error values', () => {
    const result = extractErrorInfo('string error')

    expect(result.message).toBe('string error')
    expect(result.fullMessage).toBe('string error')
    expect(result.type).toBe('Error')
    expect(result.stack).toBeUndefined()
    expect(result.causeChain).toEqual(['string error'])
  })

  it('should preserve custom error types', () => {
    class CustomError extends Error {
      constructor(message: string) {
        super(message)
        this.name = 'CustomError'
      }
    }

    const error = new CustomError('Custom message')
    const result = extractErrorInfo(error)

    expect(result.type).toBe('CustomError')
  })
})
