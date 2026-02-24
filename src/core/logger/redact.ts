/**
 * Redaction utility for removing sensitive data from logs.
 * Uses iterative traversal with cycle detection to safely handle complex objects.
 */

import { REDACT_MAX_INPUT_MB } from '../../config/constants.js'

/** Sensitive patterns to redact */
const SENSITIVE_PATTERNS = [
  /sk-ant-[a-zA-Z0-9-]{10,}/g, // Anthropic API keys (sk-ant-...)
  /sk-[a-zA-Z0-9]{20,}/g, // Generic sk- keys
  /Bearer\s+[a-zA-Z0-9._-]+/gi, // Bearer tokens
  /api[_-]?key["\s:=]+[a-zA-Z0-9._-]+"/gi, // Generic API keys with quotes
  /"password"\s*:\s*"[^"]+"/gi, // Password fields in JSON
  /"token"\s*:\s*"[^"]+"/gi, // Token fields in JSON
] as const

const REDACTED = '[REDACTED]'
const MAX_DEPTH = 20
const MAX_NODES = 10000

/**
 * Redact sensitive information from a value.
 * Handles strings, objects, arrays with cycle detection and depth limits.
 *
 * @param value - Value to redact (any type)
 * @returns Redacted copy of the value
 */
export function redactSensitive(value: unknown): unknown {
  // Quick size check to prevent excessive memory usage
  const estimatedSize = estimateSize(value)
  const maxBytes = REDACT_MAX_INPUT_MB * 1024 * 1024
  if (estimatedSize > maxBytes) {
    return '[REDACTED: Input too large]'
  }

  // Handle primitives directly
  if (typeof value === 'string') {
    return redactString(value)
  }

  if (value === null || value === undefined) {
    return value
  }

  if (typeof value !== 'object') {
    return value // number, boolean, symbol, function, bigint
  }

  // Use iterative traversal for objects/arrays
  return redactObject(value)
}

/**
 * Redact sensitive patterns from a string.
 * @param str - String to redact
 * @returns Redacted string
 */
function redactString(str: string): string {
  let result = str
  for (const pattern of SENSITIVE_PATTERNS) {
    result = result.replace(pattern, REDACTED)
  }
  return result
}

/**
 * Estimate size of a value in bytes (rough approximation).
 * @param value - Value to estimate
 * @returns Estimated size in bytes
 */
function estimateSize(value: unknown): number {
  if (typeof value === 'string') {
    return value.length * 2 // UTF-16 encoding
  }
  if (typeof value === 'number' || typeof value === 'boolean') {
    return 8
  }
  if (value === null || value === undefined) {
    return 0
  }
  if (typeof value === 'object') {
    // Very rough estimate: try JSON.stringify, fallback to conservative estimate
    try {
      return JSON.stringify(value).length
    } catch {
      // Circular reference or unserializable - use conservative estimate
      return 1000 // 1KB default for complex objects
    }
  }
  return 0
}

/**
 * Redact an object or array using iterative traversal.
 * Uses explicit stack to avoid recursion limits and WeakSet for cycle detection.
 *
 * Note: This function exceeds the 50-line guideline (~83 lines).
 * Exception: The iterative traversal algorithm with cycle detection requires
 * tightly coupled state (seen WeakSet, stack, nodeCount, depth). Extracting
 * helpers would create artificial boundaries and reduce readability.
 *
 * @param root - Object or array to redact
 * @returns Redacted copy
 */
function redactObject(root: object): unknown {
  const seen = new WeakSet<object>()
  const stack: Array<{
    source: object
    target: Record<string, unknown> | unknown[]
    depth: number
  }> = []

  // Determine if root is array or object
  const isRootArray = Array.isArray(root)
  const rootTarget: Record<string, unknown> | unknown[] = isRootArray ? [] : {}

  stack.push({ source: root, target: rootTarget, depth: 0 })
  seen.add(root)

  let nodeCount = 0

  while (stack.length > 0) {
    const frame = stack.pop()
    if (!frame) break

    const { source, target, depth } = frame
    nodeCount++

    if (nodeCount > MAX_NODES) {
      return '[REDACTED: Too many nodes]'
    }

    if (depth > MAX_DEPTH) {
      continue // Skip this subtree
    }

    // Process based on type
    if (Array.isArray(source)) {
      const targetArray = target as unknown[]
      for (let i = 0; i < source.length; i++) {
        const item = source[i]
        if (typeof item === 'string') {
          targetArray[i] = redactString(item)
        } else if (item === null || item === undefined) {
          targetArray[i] = item
        } else if (typeof item === 'object') {
          if (seen.has(item)) {
            targetArray[i] = '[CIRCULAR]'
          } else {
            const newTarget = Array.isArray(item) ? [] : {}
            targetArray[i] = newTarget
            seen.add(item)
            stack.push({ source: item, target: newTarget, depth: depth + 1 })
          }
        } else {
          targetArray[i] = item // primitive
        }
      }
    } else {
      // Object
      const targetObj = target as Record<string, unknown>
      for (const key in source) {
        if (!Object.hasOwn(source, key)) continue

        const value = (source as Record<string, unknown>)[key]

        if (typeof value === 'string') {
          targetObj[key] = redactString(value)
        } else if (value === null || value === undefined) {
          targetObj[key] = value
        } else if (typeof value === 'object') {
          if (seen.has(value)) {
            targetObj[key] = '[CIRCULAR]'
          } else {
            const newTarget = Array.isArray(value) ? [] : {}
            targetObj[key] = newTarget
            seen.add(value)
            stack.push({ source: value, target: newTarget, depth: depth + 1 })
          }
        } else {
          targetObj[key] = value // primitive
        }
      }
    }
  }

  return rootTarget
}
