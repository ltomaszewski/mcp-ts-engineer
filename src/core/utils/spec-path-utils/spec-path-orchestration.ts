/**
 * Orchestration utility for spec path validation and correction.
 * Three-tier correction strategy:
 * 1. Deterministic pattern matching (fast, free)
 * 2. Filesystem validation (fast, free)
 * 3. AI-assisted correction (slow, ~$0.10-0.50)
 */

import { readFileSync, writeFileSync, existsSync } from "fs";
import { join } from "path";
import type { CapabilityContext } from "../../capability-registry/capability-registry.types.js";
import { ValidationError } from "../../errors.js";
import { extractFilePaths } from "./spec-path-extraction.js";
import { correctSpecPaths } from "./spec-path-correction.js";
import type { PathFixStepInput, PathFixStepOutput } from "./spec-path.schema.js";

/**
 * Validates and corrects spec paths using a three-tier strategy.
 *
 * Tier 1: Deterministic correction via existing correctSpecPaths
 * Tier 2: Filesystem check for uncorrectable paths
 * Tier 3: AI-assisted correction as final fallback
 *
 * @param specPath - Path to the spec file
 * @param targetApp - Target app/package name (e.g., 'mcp-ts-engineer')
 * @param context - Capability context for invoking sub-capabilities and logging
 * @param cwd - Working directory (defaults to process.cwd())
 * @throws ValidationError if all three tiers fail and uncorrectable paths remain
 *
 * @public
 * @remarks
 * This function is the main entry point for path correction orchestration.
 * It writes corrected content back to the spec file if corrections are applied.
 *
 * @example
 * ```ts
 * await validateAndCorrectSpecPaths(
 *   'docs/specs/mcp-ts-engineer/feature.md',
 *   'mcp-ts-engineer',
 *   context
 * );
 * ```
 */
export async function validateAndCorrectSpecPaths(
  specPath: string,
  targetApp: string,
  context: CapabilityContext,
  cwd?: string,
): Promise<void> {
  const workingDir = cwd || process.cwd();

  // Read spec file content
  let specContent: string;
  try {
    specContent = readFileSync(join(workingDir, specPath), "utf-8");
  } catch (error) {
    throw new ValidationError(`Failed to read spec file: ${specPath}`, {
      cause: error,
    });
  }

  // Tier 1: Deterministic correction
  const correctionResult = correctSpecPaths(specContent, targetApp);

  if (correctionResult.corrections.length > 0) {
    // Write corrected content to file
    writeFileSync(
      join(workingDir, specPath),
      correctionResult.correctedContent
    );

    // Log corrections
    for (const correction of correctionResult.corrections) {
      context.logger.info("Path corrected (deterministic)", {
        original: correction.original,
        corrected: correction.corrected,
        method: "deterministic",
      });
    }
  }

  let remaining = correctionResult.uncorrectable;
  let currentContent = correctionResult.correctedContent;

  // If no uncorrectable paths remain, we're done
  if (remaining.length === 0) {
    return;
  }

  // Tier 2: Filesystem check
  const filesystemCorrections: Array<{ original: string; corrected: string }> =
    [];

  for (const uncorrectablePath of remaining) {
    const candidatePath = `apps/${targetApp}/src/${uncorrectablePath}`;
    const fullPath = join(workingDir, candidatePath);

    if (existsSync(fullPath)) {
      filesystemCorrections.push({
        original: uncorrectablePath,
        corrected: candidatePath,
      });

      // Apply correction to content
      currentContent = currentContent.replace(
        new RegExp(escapeRegExp(uncorrectablePath), "g"),
        candidatePath
      );

      context.logger.info("Path corrected (filesystem check)", {
        original: uncorrectablePath,
        corrected: candidatePath,
        method: "filesystem",
      });
    }
  }

  if (filesystemCorrections.length > 0) {
    // Write corrected content to file
    writeFileSync(join(workingDir, specPath), currentContent);

    // Update remaining uncorrectable
    remaining = remaining.filter(
      (p) => !filesystemCorrections.some((c) => c.original === p)
    );
  }

  // If no uncorrectable paths remain, we're done
  if (remaining.length === 0) {
    return;
  }

  // Tier 3: AI-assisted correction (non-blocking fallback)
  try {
    context.logger.info("Invoking AI path fix step", {
      remaining_count: remaining.length,
      remaining_paths: remaining,
    });

    const aiInput: PathFixStepInput = {
      spec_path: specPath,
      spec_content: currentContent,
      target_app: targetApp,
      uncorrectable_paths: remaining,
      cwd: workingDir,
    };

    const aiResult = (await context.invokeCapability(
      "todo_path_fix_step",
      aiInput
    )) as PathFixStepOutput;

    if (aiResult.status === "SUCCESS" || aiResult.status === "PARTIAL") {
      // Write corrected content to file
      if (aiResult.corrected_content.length > 0) {
        writeFileSync(
          join(workingDir, specPath),
          aiResult.corrected_content
        );
      }

      // Log corrections
      for (const correction of aiResult.corrections) {
        context.logger.info("Path corrected (AI)", {
          original: correction.original,
          corrected: correction.corrected,
          confidence: correction.confidence,
          method: "ai",
        });
      }

      // Update remaining uncorrectable
      remaining = aiResult.remaining_uncorrectable;
    } else {
      // AI returned FAILED status
      context.logger.warn("AI path fix returned FAILED status", {
        remaining: aiResult.remaining_uncorrectable,
      });
    }
  } catch (error) {
    // AI fix threw an exception - log and continue to throw original error
    context.logger.warn("AI path fix failed with exception", {
      error: error instanceof Error ? error.message : String(error),
    });
  }

  // If uncorrectable paths still remain after all three tiers, throw error
  if (remaining.length > 0) {
    throw new ValidationError(`Invalid paths in spec: ${remaining.join(", ")}`);
  }
}

/**
 * Escapes special regex characters in a string.
 *
 * @param str - String to escape
 * @returns Escaped string safe for use in RegExp
 */
function escapeRegExp(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
