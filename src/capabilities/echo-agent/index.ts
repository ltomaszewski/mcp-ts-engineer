/**
 * Echo agent capability exports.
 */

export { echoAgentCapability } from './echo-agent.capability.js'
export type { EchoAgentInput, EchoAgentOutput } from './echo-agent.schema.js'
export {
  EchoAgentInputSchema,
  EchoAgentOutputSchema,
} from './echo-agent.schema.js'
export {
  CURRENT_VERSION,
  currentPrompt,
  PROMPT_VERSIONS,
} from './prompts/index.js'
