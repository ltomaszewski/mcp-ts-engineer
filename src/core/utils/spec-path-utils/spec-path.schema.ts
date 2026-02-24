/**
 * Zod schemas for path fix sub-capability input and output.
 * Defines validation schemas for AI-assisted path correction.
 */

import { z } from 'zod'

/**
 * Input schema for the path fix sub-capability.
 * Receives the spec path, content, target app, and uncorrectable paths.
 */
export const PathFixStepInputSchema = z.object({
  spec_path: z
    .string()
    .min(1, 'spec_path is required')
    .describe('Path to the spec file with uncorrectable paths'),
  spec_content: z
    .string()
    .min(1, 'spec_content is required')
    .describe('Full content of the spec file'),
  target_app: z
    .string()
    .min(1, 'target_app is required')
    .describe("Target app or package name (e.g., 'mcp-ts-engineer')"),
  uncorrectable_paths: z
    .array(z.string())
    .min(1, 'At least one uncorrectable path required')
    .describe('List of paths that could not be corrected deterministically'),
  cwd: z
    .string()
    .optional()
    .describe('Working directory for tool execution (defaults to process.cwd())'),
})

/**
 * Output schema for the path fix sub-capability.
 * Describes the corrections made and any remaining uncorrectable paths.
 */
export const PathFixStepOutputSchema = z.object({
  status: z
    .enum(['SUCCESS', 'PARTIAL', 'FAILED'])
    .describe(
      'Overall path correction result: SUCCESS (all fixed), PARTIAL (some fixed), FAILED (none fixed)',
    ),
  corrections: z
    .array(
      z.object({
        original: z.string().describe('Original uncorrectable path'),
        corrected: z.string().describe('Corrected monorepo-rooted path'),
        confidence: z
          .enum(['high', 'medium', 'low'])
          .describe(
            'Confidence level: high (file found), medium (inferred from patterns), low (uncertain)',
          ),
      }),
    )
    .describe('List of path corrections made'),
  remaining_uncorrectable: z
    .array(z.string())
    .describe('Paths that could not be corrected even with AI assistance'),
  corrected_content: z.string().describe('Spec content with corrected paths applied'),
})

/**
 * Inferred TypeScript type for path fix input.
 */
export type PathFixStepInput = z.infer<typeof PathFixStepInputSchema>

/**
 * Inferred TypeScript type for path fix output.
 */
export type PathFixStepOutput = z.infer<typeof PathFixStepOutputSchema>
