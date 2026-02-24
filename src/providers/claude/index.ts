/**
 * Claude provider exports.
 */

export type { SDKQueryFunction } from './claude.provider.js'
export { ClaudeProvider } from './claude.provider.js'
export type { QueryAccumulator } from './message-handlers.js'
export {
  createInitialAccumulator,
  extractContentBlocks,
  processAssistantMessage,
  processResultMessage,
  processUserMessage,
} from './message-handlers.js'
export type {
  SDKAssistantMessage,
  SDKMessage,
  SDKResultMessage,
  SDKUserMessage,
} from './sdk-message.types.js'
export {
  isAssistantMessage,
  isResultMessage,
  isUserMessage,
} from './sdk-message.types.js'
