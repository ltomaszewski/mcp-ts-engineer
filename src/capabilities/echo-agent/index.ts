/**
 * Echo agent capability exports.
 */

export type { EchoAgentInput, EchoAgentOutput } from "./echo-agent.schema.js";
export {
  PROMPT_VERSIONS,
  CURRENT_VERSION,
  currentPrompt,
} from "./prompts/index.js";
export { echoAgentCapability } from "./echo-agent.capability.js";
export {
  EchoAgentInputSchema,
  EchoAgentOutputSchema,
} from "./echo-agent.schema.js";
