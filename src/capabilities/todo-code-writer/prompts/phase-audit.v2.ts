/**
 * Phase audit step prompt version 2.
 * Re-exports shared audit prompt builder from src/shared/prompts/audit-prompt.v2.ts
 *
 * This file exists for backward compatibility. Original implementation
 * moved to shared location for reuse across capabilities.
 */

import type { PromptVersion } from "../../../core/prompt/prompt.types.js";
import {
  buildAuditPromptV2,
  type AuditPromptInput as SharedAuditPromptInput,
} from "../../../shared/prompts/audit-prompt.v2.js";

/** Extended input shape for the phase audit v2 prompt build function. */
export interface PhaseAuditV2PromptInput {
  specPath: string;
  phaseNumber: number;
  filesModified: string[];
  engSummary: string;
  detectedTechnologies?: string[];
  /** Raw dependency names from package.json (for precise skill resolution). */
  detectedDependencies?: string[];
  cwd?: string;
}

/** Version 2: Phase audit with skill loading based on detected technologies */
export const phaseAuditPromptV2: PromptVersion = {
  version: "v2",
  createdAt: "2026-02-01",
  description:
    "Phase audit v2: loads skills via Skill tool before auditing, using detected technologies for skill resolution",
  deprecated: false,
  sunsetDate: undefined,
  build: (input: unknown) => {
    const typedInput = input as PhaseAuditV2PromptInput;

    // Convert to shared format (using "spec" mode)
    const sharedInput: SharedAuditPromptInput = {
      mode: "spec",
      specPath: typedInput.specPath,
      phaseNumber: typedInput.phaseNumber,
      filesModified: typedInput.filesModified,
      engSummary: typedInput.engSummary,
      detectedTechnologies: typedInput.detectedTechnologies,
      detectedDependencies: typedInput.detectedDependencies,
      cwd: typedInput.cwd,
    };

    return buildAuditPromptV2(sharedInput);
  },
};
