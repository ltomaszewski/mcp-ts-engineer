/**
 * Error utility functions for extracting full error chains.
 * Preserves cause information for better debugging.
 */

/**
 * Maximum depth for error cause chain traversal.
 * Prevents infinite loops from circular cause references.
 */
const MAX_CAUSE_DEPTH = 10

/**
 * Extract the full error message including the cause chain.
 * Traverses error.cause recursively to build a complete error message.
 *
 * @param error - The error to extract message from
 * @param depth - Current recursion depth (internal use)
 * @returns Full error message with cause chain
 *
 * @example
 * ```typescript
 * const inner = new Error("Connection refused");
 * const outer = new Error("API call failed", { cause: inner });
 * extractErrorChain(outer);
 * // Returns: "API call failed [Caused by: Connection refused]"
 * ```
 */
export function extractErrorChain(error: unknown, depth = 0): string {
  if (depth >= MAX_CAUSE_DEPTH) {
    return '[Error chain too deep]'
  }

  if (!(error instanceof Error)) {
    return String(error)
  }

  let message = error.message

  // Append cause if present
  if (error.cause !== undefined && error.cause !== null) {
    const causeMessage = extractErrorChain(error.cause, depth + 1)
    message += ` [Caused by: ${causeMessage}]`
  }

  return message
}

/**
 * Extract structured error information for logging.
 * Returns an object with message, type, stack, and cause chain.
 *
 * @param error - The error to extract information from
 * @returns Structured error info object
 */
export function extractErrorInfo(error: unknown): {
  message: string
  fullMessage: string
  type: string
  stack?: string
  causeChain: string[]
} {
  const fullMessage = extractErrorChain(error)
  const causeChain = extractCauseChain(error)

  if (!(error instanceof Error)) {
    return {
      message: String(error),
      fullMessage,
      type: 'Error',
      causeChain,
    }
  }

  return {
    message: error.message,
    fullMessage,
    type: error.constructor.name,
    stack: error.stack,
    causeChain,
  }
}

/**
 * Extract the cause chain as an array of error messages.
 * Useful for structured logging where each cause should be a separate entry.
 *
 * @param error - The error to extract causes from
 * @returns Array of error messages from outermost to innermost
 */
export function extractCauseChain(error: unknown): string[] {
  const chain: string[] = []
  let current: unknown = error
  let depth = 0

  while (current !== undefined && current !== null && depth < MAX_CAUSE_DEPTH) {
    if (current instanceof Error) {
      chain.push(`${current.constructor.name}: ${current.message}`)
      current = current.cause
    } else {
      chain.push(String(current))
      break
    }
    depth++
  }

  return chain
}
