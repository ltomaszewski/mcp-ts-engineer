import type { PromptRegistry } from "../../../core/prompt/prompt.types.js";
import { orchestratorPromptV1 } from "./orchestrator.v1.js";
import { auditPromptV1 } from "./audit.v1.js";
import { auditPromptV2 } from "./audit.v2.js";
import { testPromptV1 } from "./test.v1.js";
import { codemapPromptV1 } from "./codemap.v1.js";
import { commitPromptV1 } from "./commit.v1.js";
import { readmePromptV1 } from "./readme.v1.js";

/**
 * Orchestrator prompt registry for finalize capability.
 * Analyzes files and plans the finalize workflow.
 */
export const orchestratorPrompts: PromptRegistry = {
  v1: orchestratorPromptV1,
};

/**
 * Audit step prompt registry.
 * Scans files for code quality issues and applies auto-fixes.
 */
export const auditPrompts: PromptRegistry = {
  v1: auditPromptV1,
  v2: auditPromptV2,
};

/**
 * Test step prompt registry.
 * Runs npm test in affected workspaces.
 */
export const testPrompts: PromptRegistry = {
  v1: testPromptV1,
};

/**
 * Codemap step prompt registry.
 * Updates .claude/codemaps/ architecture documentation.
 */
export const codemapPrompts: PromptRegistry = {
  v1: codemapPromptV1,
};

/**
 * Commit step prompt registry.
 * Commits cleanup changes with descriptive message.
 */
export const commitPrompts: PromptRegistry = {
  v1: commitPromptV1,
};

/**
 * README step prompt registry.
 * Updates project README files based on documented feature changes.
 */
export const readmePrompts: PromptRegistry = {
  v1: readmePromptV1,
};

// Current versions for each prompt
export const ORCHESTRATOR_CURRENT_VERSION = "v1";
export const AUDIT_CURRENT_VERSION = "v2";
export const TEST_CURRENT_VERSION = "v1";
export const CODEMAP_CURRENT_VERSION = "v1";
export const COMMIT_CURRENT_VERSION = "v1";
export const README_CURRENT_VERSION = "v1";
