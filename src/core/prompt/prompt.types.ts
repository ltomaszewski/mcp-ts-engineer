/**
 * Prompt management type definitions.
 * Prompts support versioning for A/B testing and rollback.
 */

/** Preset system prompt configuration (e.g., Claude Code built-in prompt) */
export interface PresetSystemPrompt {
  type: 'preset'
  preset: 'claude_code'
  /** Optional text appended after the preset prompt */
  append?: string
}

/** System prompt value — either a plain string or a preset reference */
export type SystemPromptValue = string | PresetSystemPrompt

/** Built prompt with system and user messages */
export interface BuiltPrompt {
  /** Optional system prompt (string or preset reference) */
  systemPrompt?: SystemPromptValue
  /** Required user prompt */
  userPrompt: string
}

/** Prompt version with build function and metadata */
export interface PromptVersion {
  /** Version identifier (e.g., "v1", "v2") */
  version: string
  /** When this version was created */
  createdAt: string
  /** Human-readable description */
  description: string
  /** Whether this version is deprecated */
  deprecated: boolean
  /** Optional sunset date (ISO 8601) - error if used after this date */
  sunsetDate?: string
  /** Build prompt from input data */
  build: (input: unknown) => BuiltPrompt
}

/** Prompt registry for a capability */
export interface PromptRegistry {
  /** Map of version IDs to PromptVersion instances */
  [version: string]: PromptVersion
}

/** Prompt configuration with versioning */
export interface PromptConfig {
  /** Prompt identifier */
  id: string
  /** Human-readable name */
  name: string
  /** Description of prompt purpose */
  description: string
  /** All versions of this prompt */
  versions: PromptVersion[]
  /** Tags for categorization */
  tags?: string[]
}
