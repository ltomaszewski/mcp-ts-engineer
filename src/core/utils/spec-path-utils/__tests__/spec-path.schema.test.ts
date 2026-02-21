/**
 * Unit tests for PathFixStepInput and PathFixStepOutput schemas.
 */

import {
  PathFixStepInputSchema,
  PathFixStepOutputSchema,
} from "../spec-path.schema.js";

describe("PathFixStepInputSchema", () => {
  it("accepts valid input with all required fields", () => {
    const input = {
      spec_path: "docs/specs/test.md",
      spec_content: "# Test Spec\n\nSome content",
      target_app: "mcp-ts-engineer",
      uncorrectable_paths: ["core/utils/index.ts", "lib/helpers.ts"],
      cwd: "/Users/dev/project",
    };

    const result = PathFixStepInputSchema.safeParse(input);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data).toEqual(input);
    }
  });

  it("accepts valid input without optional cwd field", () => {
    const input = {
      spec_path: "docs/specs/test.md",
      spec_content: "# Test Spec",
      target_app: "mcp-ts-engineer",
      uncorrectable_paths: ["core/utils/index.ts"],
    };

    const result = PathFixStepInputSchema.safeParse(input);
    expect(result.success).toBe(true);
  });

  it("rejects input with empty spec_path", () => {
    const input = {
      spec_path: "",
      spec_content: "# Test",
      target_app: "mcp-ts-engineer",
      uncorrectable_paths: ["core/utils/index.ts"],
    };

    const result = PathFixStepInputSchema.safeParse(input);
    expect(result.success).toBe(false);
  });

  it("rejects input with empty spec_content", () => {
    const input = {
      spec_path: "docs/specs/test.md",
      spec_content: "",
      target_app: "mcp-ts-engineer",
      uncorrectable_paths: ["core/utils/index.ts"],
    };

    const result = PathFixStepInputSchema.safeParse(input);
    expect(result.success).toBe(false);
  });

  it("rejects input with empty target_app", () => {
    const input = {
      spec_path: "docs/specs/test.md",
      spec_content: "# Test",
      target_app: "",
      uncorrectable_paths: ["core/utils/index.ts"],
    };

    const result = PathFixStepInputSchema.safeParse(input);
    expect(result.success).toBe(false);
  });

  it("rejects input with empty uncorrectable_paths array", () => {
    const input = {
      spec_path: "docs/specs/test.md",
      spec_content: "# Test",
      target_app: "mcp-ts-engineer",
      uncorrectable_paths: [],
    };

    const result = PathFixStepInputSchema.safeParse(input);
    expect(result.success).toBe(false);
  });

  it("rejects input with missing required fields", () => {
    const input = {
      spec_path: "docs/specs/test.md",
    };

    const result = PathFixStepInputSchema.safeParse(input);
    expect(result.success).toBe(false);
  });
});

describe("PathFixStepOutputSchema", () => {
  it("accepts SUCCESS status with corrections", () => {
    const output = {
      status: "SUCCESS",
      corrections: [
        {
          original: "core/utils/index.ts",
          corrected: "apps/mcp-ts-engineer/src/core/utils/index.ts",
          confidence: "high",
        },
      ],
      remaining_uncorrectable: [],
      corrected_content: "# Fixed content",
    };

    const result = PathFixStepOutputSchema.safeParse(output);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data).toEqual(output);
    }
  });

  it("accepts PARTIAL status with remaining uncorrectable", () => {
    const output = {
      status: "PARTIAL",
      corrections: [
        {
          original: "core/utils/index.ts",
          corrected: "apps/mcp-ts-engineer/src/core/utils/index.ts",
          confidence: "medium",
        },
      ],
      remaining_uncorrectable: ["unknown/file.ts"],
      corrected_content: "# Partially fixed",
    };

    const result = PathFixStepOutputSchema.safeParse(output);
    expect(result.success).toBe(true);
  });

  it("accepts FAILED status with no corrections", () => {
    const output = {
      status: "FAILED",
      corrections: [],
      remaining_uncorrectable: ["core/utils/index.ts", "lib/helpers.ts"],
      corrected_content: "",
    };

    const result = PathFixStepOutputSchema.safeParse(output);
    expect(result.success).toBe(true);
  });

  it("validates confidence levels (high, medium, low)", () => {
    const outputHigh = {
      status: "SUCCESS",
      corrections: [
        {
          original: "core/utils/index.ts",
          corrected: "apps/mcp-ts-engineer/src/core/utils/index.ts",
          confidence: "high",
        },
      ],
      remaining_uncorrectable: [],
      corrected_content: "# Content",
    };

    const outputMedium = { ...outputHigh, corrections: [{ ...outputHigh.corrections[0], confidence: "medium" }] };
    const outputLow = { ...outputHigh, corrections: [{ ...outputHigh.corrections[0], confidence: "low" }] };

    expect(PathFixStepOutputSchema.safeParse(outputHigh).success).toBe(true);
    expect(PathFixStepOutputSchema.safeParse(outputMedium).success).toBe(true);
    expect(PathFixStepOutputSchema.safeParse(outputLow).success).toBe(true);
  });

  it("rejects invalid confidence level", () => {
    const output = {
      status: "SUCCESS",
      corrections: [
        {
          original: "core/utils/index.ts",
          corrected: "apps/mcp-ts-engineer/src/core/utils/index.ts",
          confidence: "invalid",
        },
      ],
      remaining_uncorrectable: [],
      corrected_content: "# Content",
    };

    const result = PathFixStepOutputSchema.safeParse(output);
    expect(result.success).toBe(false);
  });

  it("rejects invalid status", () => {
    const output = {
      status: "UNKNOWN",
      corrections: [],
      remaining_uncorrectable: [],
      corrected_content: "",
    };

    const result = PathFixStepOutputSchema.safeParse(output);
    expect(result.success).toBe(false);
  });

  it("rejects output with missing required fields", () => {
    const output = {
      status: "SUCCESS",
      corrections: [],
    };

    const result = PathFixStepOutputSchema.safeParse(output);
    expect(result.success).toBe(false);
  });
});
