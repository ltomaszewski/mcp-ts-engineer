import type { CapabilityDefinition, CapabilityContext } from "../../core/capability-registry/capability-registry.types.js";
import type { AIQueryResult } from "../../core/ai-provider/ai-provider.types.js";
import type { PromptRegistry, PromptVersion } from "../../core/prompt/prompt.types.js";
import { parseXmlBlock, parseJsonSafe } from "../../core/utils/index.js";
import {
  ValidateStepInputSchema,
  ValidateStepOutputSchema,
  VALIDATE_OUTPUT_JSON_SCHEMA,
} from "./pr-reviewer.schema.js";
import type { ValidateStepInput, ValidateStepOutput } from "./pr-reviewer.schema.js";

const VALIDATE_PROMPT_V1: PromptVersion = {
  version: "v1",
  createdAt: "2026-02-14",
  description: "Validate issues with confidence scoring and filtering",
  deprecated: false,
  sunsetDate: undefined,
  build: (input: unknown) => {
    const data = input as ValidateStepInput;
    return {
      systemPrompt: { type: "preset" as const, preset: "claude_code" as const },
      userPrompt: `# Validate Review Issues

You are validating ${data.issues.length} issues from ${data.agent_results.length} review agent(s).

## Issues to Validate

${data.issues
  .map(
    (issue, i) => `${i + 1}. [${issue.severity}] ${issue.file_path}:${issue.line ?? "?"}
   Title: ${issue.title}
   Category: ${issue.category ?? "general"}
   Details: ${issue.details}
   Auto-fixable: ${issue.auto_fixable}
   Current confidence: ${issue.confidence}`
  )
  .join("\n\n")}

## Your Tasks

1. **Confidence Scoring** (0-100):
   - Base score from severity: CRITICAL=90, HIGH=80, MEDIUM=70, LOW=60
   - +15 if issue reported by 2+ agents (compare across agent_results)
   - +10 if issue has concrete line number and file
   - -20 if description is vague
   - -15 if likely false positive

2. **Filter Issues**:
   - Keep only issues with confidence >= 70
   - Discard likely false positives

3. **Classify**:
   - auto_fixable: Linting, formatting, simple refactors
   - manual: Logic changes, architectural decisions

## Output Format

Respond with JSON:
\`\`\`json
{
  "issues": [/* all validated issues with updated confidence */],
  "auto_fixable": [/* subset where auto_fixable is true */],
  "manual": [/* subset where auto_fixable is false */],
  "filtered_count": 2
}
\`\`\`

Each issue must have: severity, category, title, file_path, line, details, suggestion, auto_fixable, confidence.

Begin validation now.`,
    };
  },
};

const PROMPT_VERSIONS: PromptRegistry = { v1: VALIDATE_PROMPT_V1 };
const CURRENT_VERSION = "v1";

export const prValidateStepCapability: CapabilityDefinition<
  ValidateStepInput,
  ValidateStepOutput
> = {
  id: "pr_validate_step",
  type: "tool",
  visibility: "internal",
  name: "PR Validate Step",
  description: "Apply confidence scoring and filter issues by threshold",
  inputSchema: ValidateStepInputSchema,
  promptRegistry: PROMPT_VERSIONS,
  currentPromptVersion: CURRENT_VERSION,
  defaultRequestOptions: {
    model: "haiku",
    maxTurns: 10,
    maxBudgetUsd: 0.5,
    tools: { type: "preset", preset: "claude_code" },
    permissionMode: "bypassPermissions",
    allowDangerouslySkipPermissions: true,
    settingSources: ["user", "project"],
    outputSchema: VALIDATE_OUTPUT_JSON_SCHEMA,
  },
  preparePromptInput: (input: ValidateStepInput, _context: CapabilityContext) => input,
  processResult: (
    input: ValidateStepInput,
    aiResult: AIQueryResult,
    _context: CapabilityContext
  ): ValidateStepOutput => {
    // Passthrough fallback: keep all issues, split by auto_fixable
    const passThroughFallback = (): ValidateStepOutput => {
      const autoFixable = input.issues.filter((i) => i.auto_fixable);
      const manual = input.issues.filter((i) => !i.auto_fixable);
      return { issues: input.issues, auto_fixable: autoFixable, manual, filtered_count: 0 };
    };

    // Strategy 1: SDK structured output
    if (aiResult.structuredOutput) {
      const validated = ValidateStepOutputSchema.safeParse(aiResult.structuredOutput);
      if (validated.success) return validated.data;
    }

    // Strategy 2: XML block fallback
    const xmlContent = parseXmlBlock(aiResult.content, "validate_result");
    if (xmlContent) return parseJsonSafe(xmlContent, ValidateStepOutputSchema, passThroughFallback());

    return passThroughFallback();
  },
};
