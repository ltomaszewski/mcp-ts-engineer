/**
 * Claude provider exports.
 */

export { ClaudeProvider } from "./claude.provider.js";
export type { SDKQueryFunction } from "./claude.provider.js";
export type {
  SDKMessage,
  SDKAssistantMessage,
  SDKUserMessage,
  SDKResultMessage,
} from "./sdk-message.types.js";
export {
  isAssistantMessage,
  isUserMessage,
  isResultMessage,
} from "./sdk-message.types.js";
export {
  createInitialAccumulator,
  extractContentBlocks,
  processAssistantMessage,
  processUserMessage,
  processResultMessage,
} from "./message-handlers.js";
export type { QueryAccumulator } from "./message-handlers.js";
