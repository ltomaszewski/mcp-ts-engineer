/**
 * Tests for tdd-scan-step sub-capability definition.
 */

import { tddScanStepCapability } from "../tdd-scan-step.capability.js";
import type { TddScanStepInput } from "../todo-reviewer.schema.js";
import {
  createMockContext,
  VALID_REVIEW_SUMMARY,
} from "./test-helpers.js";

describe("tddScanStepCapability", () => {
  describe("definition metadata", () => {
    it("has correct id", () => {
      expect(tddScanStepCapability.id).toBe("todo_tdd_scan_step");
    });

    it("has correct type", () => {
      expect(tddScanStepCapability.type).toBe("tool");
    });

    it("defaults to opus model", () => {
      expect(tddScanStepCapability.defaultRequestOptions?.model).toBe("opus");
    });

    it("has prompt registry with v1", () => {
      expect(tddScanStepCapability.promptRegistry).toBeDefined();
      expect(tddScanStepCapability.promptRegistry.v1).toBeDefined();
    });

    it("has current prompt version v1", () => {
      expect(tddScanStepCapability.currentPromptVersion).toBe("v1");
    });

    it("has internal visibility", () => {
      expect(tddScanStepCapability.visibility).toBe("internal");
    });
  });

  describe("preparePromptInput", () => {
    it("extracts specPath, reviewSummary, and cwd", () => {
      const input: TddScanStepInput = {
        spec_path: "docs/specs/feature.md",
        review_summary: VALID_REVIEW_SUMMARY,
        cwd: "/some/path",
      };
      const context = createMockContext();

      const result = tddScanStepCapability.preparePromptInput(input, context);

      expect(result).toEqual({
        specPath: "docs/specs/feature.md",
        reviewSummary: VALID_REVIEW_SUMMARY,
        cwd: "/some/path",
      });
    });
  });
});
