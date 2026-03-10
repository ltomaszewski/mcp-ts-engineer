/**
 * Shared types for capability invocation handling.
 * Extracted to avoid circular imports when splitting invocation-handler.ts.
 */

/** MCP tool response shape */
export type McpToolResponse = {
  content: Array<{ type: 'text'; text: string }>
  isError?: boolean
}
