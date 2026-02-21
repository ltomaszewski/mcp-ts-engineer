/**
 * Tests for todo-code-writer Zod schemas.
 */

import {
  TodoCodeWriterInputSchema,
  PhasePlanSchema,
  PhaseSchema,
  PhaseFileSchema,
  PhaseEngResultSchema,
  PhaseAuditResultSchema,
  FinalAuditResultSchema,
  CommitResultSchema,
  PhaseEngStepInputSchema,
  PhaseAuditStepInputSchema,
  FinalAuditStepInputSchema,
  CommitStepInputSchema,
  TodoCodeWriterOutputSchema,
  PhaseStatusSchema,
} from "../todo-code-writer.schema.js";

// ---------------------------------------------------------------------------
// TodoCodeWriterInputSchema
// ---------------------------------------------------------------------------

describe("TodoCodeWriterInputSchema", () => {
  describe("valid inputs", () => {
    it("accepts valid spec_path ending in .md with defaults applied", () => {
      const result = TodoCodeWriterInputSchema.safeParse({
        spec_path: "docs/specs/feature.md",
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.spec_path).toBe("docs/specs/feature.md");
        expect(result.data.model).toBe("sonnet");
        expect(result.data.max_phases).toBe(5);
      }
    });

    it("accepts explicit opus model", () => {
      const result = TodoCodeWriterInputSchema.safeParse({
        spec_path: "docs/specs/feature.md",
        model: "opus",
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.model).toBe("opus");
      }
    });

    it("accepts haiku model", () => {
      const result = TodoCodeWriterInputSchema.safeParse({
        spec_path: "docs/specs/feature.md",
        model: "haiku",
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.model).toBe("haiku");
      }
    });

    it("accepts max_phases = 1 (boundary)", () => {
      const result = TodoCodeWriterInputSchema.safeParse({
        spec_path: "docs/specs/feature.md",
        max_phases: 1,
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.max_phases).toBe(1);
      }
    });

    it("accepts max_phases = 10 (boundary)", () => {
      const result = TodoCodeWriterInputSchema.safeParse({
        spec_path: "docs/specs/feature.md",
        max_phases: 10,
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.max_phases).toBe(10);
      }
    });

    it("accepts optional cwd", () => {
      const result = TodoCodeWriterInputSchema.safeParse({
        spec_path: "docs/specs/feature.md",
        cwd: "/some/path",
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.cwd).toBe("/some/path");
      }
    });
  });

  describe("invalid inputs", () => {
    it("rejects empty spec_path", () => {
      const result = TodoCodeWriterInputSchema.safeParse({
        spec_path: "",
      });

      expect(result.success).toBe(false);
    });

    it("rejects spec_path not ending in .md", () => {
      const result = TodoCodeWriterInputSchema.safeParse({
        spec_path: "docs/specs/feature.txt",
      });

      expect(result.success).toBe(false);
    });

    it("rejects invalid model value", () => {
      const result = TodoCodeWriterInputSchema.safeParse({
        spec_path: "docs/specs/feature.md",
        model: "invalid",
      });

      expect(result.success).toBe(false);
    });

    it("rejects max_phases = 0", () => {
      const result = TodoCodeWriterInputSchema.safeParse({
        spec_path: "docs/specs/feature.md",
        max_phases: 0,
      });

      expect(result.success).toBe(false);
    });

    it("rejects max_phases = 11", () => {
      const result = TodoCodeWriterInputSchema.safeParse({
        spec_path: "docs/specs/feature.md",
        max_phases: 11,
      });

      expect(result.success).toBe(false);
    });

    it("rejects max_phases = -1", () => {
      const result = TodoCodeWriterInputSchema.safeParse({
        spec_path: "docs/specs/feature.md",
        max_phases: -1,
      });

      expect(result.success).toBe(false);
    });

    it("rejects max_phases = 2.5 (non-integer)", () => {
      const result = TodoCodeWriterInputSchema.safeParse({
        spec_path: "docs/specs/feature.md",
        max_phases: 2.5,
      });

      expect(result.success).toBe(false);
    });
  });
});

// ---------------------------------------------------------------------------
// PhasePlan, Phase, PhaseFile Schemas
// ---------------------------------------------------------------------------

describe("PhasePlanSchema", () => {
  it("accepts valid phase plan with multiple phases", () => {
    const result = PhasePlanSchema.safeParse({
      phases: [
        {
          phase_number: 1,
          purpose: "Setup schema definitions",
          dependencies: ["none"],
          files: [
            {
              path: "src/schema.ts",
              action: "CREATE",
              purpose: "Schema file",
            },
          ],
        },
        {
          phase_number: 2,
          purpose: "Implement feature",
          dependencies: ["1"],
          files: [
            {
              path: "src/feature.ts",
              action: "CREATE",
              purpose: "Feature implementation",
            },
          ],
        },
      ],
    });

    expect(result.success).toBe(true);
  });

  it("accepts empty phases array", () => {
    const result = PhasePlanSchema.safeParse({
      phases: [],
    });

    expect(result.success).toBe(true);
  });

  it("rejects invalid phase_number", () => {
    const result = PhasePlanSchema.safeParse({
      phases: [
        {
          phase_number: "1", // Should be number
          purpose: "Setup",
          dependencies: ["none"],
          files: [],
        },
      ],
    });

    expect(result.success).toBe(false);
  });

  it("rejects invalid action", () => {
    const result = PhaseFileSchema.safeParse({
      path: "src/file.ts",
      action: "INVALID",
      purpose: "Test",
    });

    expect(result.success).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// PhaseEngResultSchema
// ---------------------------------------------------------------------------

describe("PhaseEngResultSchema", () => {
  it("accepts valid success result", () => {
    const result = PhaseEngResultSchema.safeParse({
      status: "success",
      files_modified: ["src/file1.ts", "src/file2.ts"],
      summary: "Implemented feature X",
    });

    expect(result.success).toBe(true);
  });

  it("accepts failed status", () => {
    const result = PhaseEngResultSchema.safeParse({
      status: "failed",
      files_modified: [],
      summary: "Failed to implement",
    });

    expect(result.success).toBe(true);
  });

  it("rejects invalid status", () => {
    const result = PhaseEngResultSchema.safeParse({
      status: "invalid",
      files_modified: [],
      summary: "Test",
    });

    expect(result.success).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// PhaseAuditResultSchema
// ---------------------------------------------------------------------------

describe("PhaseAuditResultSchema", () => {
  it("accepts pass status", () => {
    const result = PhaseAuditResultSchema.safeParse({
      status: "pass",
      issues_found: 0,
      summary: "No issues",
    });

    expect(result.success).toBe(true);
  });

  it("accepts warn status", () => {
    const result = PhaseAuditResultSchema.safeParse({
      status: "warn",
      issues_found: 2,
      summary: "Minor warnings",
    });

    expect(result.success).toBe(true);
  });

  it("accepts fail status", () => {
    const result = PhaseAuditResultSchema.safeParse({
      status: "fail",
      issues_found: 5,
      summary: "Critical issues",
    });

    expect(result.success).toBe(true);
  });

  it("rejects invalid status", () => {
    const result = PhaseAuditResultSchema.safeParse({
      status: "invalid",
      issues_found: 0,
      summary: "Test",
    });

    expect(result.success).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// FinalAuditResultSchema
// ---------------------------------------------------------------------------

describe("FinalAuditResultSchema", () => {
  it("accepts valid final audit result", () => {
    const result = FinalAuditResultSchema.safeParse({
      status: "pass",
      issues_found: 0,
      summary: "All checks passed",
    });

    expect(result.success).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// CommitResultSchema
// ---------------------------------------------------------------------------

describe("CommitResultSchema", () => {
  it("accepts committed=true with SHA", () => {
    const result = CommitResultSchema.safeParse({
      committed: true,
      commit_sha: "abc123",
      commit_message: "feat: add feature",
      files_changed: ["src/file.ts"],
    });

    expect(result.success).toBe(true);
  });

  it("accepts committed=false with null fields", () => {
    const result = CommitResultSchema.safeParse({
      committed: false,
      commit_sha: null,
      commit_message: null,
      files_changed: [],
    });

    expect(result.success).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// Sub-capability Input Schemas
// ---------------------------------------------------------------------------

describe("PhaseEngStepInputSchema", () => {
  it("accepts valid input", () => {
    const result = PhaseEngStepInputSchema.safeParse({
      spec_path: "docs/specs/feature.md",
      phase_plan: { phases: [] },
      current_phase_number: 1,
    });

    expect(result.success).toBe(true);
  });

  it("rejects missing spec_path", () => {
    const result = PhaseEngStepInputSchema.safeParse({
      phase_plan: { phases: [] },
      current_phase_number: 1,
    });

    expect(result.success).toBe(false);
  });

  it("rejects current_phase_number < 1", () => {
    const result = PhaseEngStepInputSchema.safeParse({
      spec_path: "docs/specs/feature.md",
      phase_plan: { phases: [] },
      current_phase_number: 0,
    });

    expect(result.success).toBe(false);
  });
});

describe("PhaseAuditStepInputSchema", () => {
  it("accepts valid input", () => {
    const result = PhaseAuditStepInputSchema.safeParse({
      spec_path: "docs/specs/feature.md",
      phase_number: 1,
      files_modified: ["src/file.ts"],
      eng_summary: "Implemented phase 1",
    });

    expect(result.success).toBe(true);
  });
});

describe("FinalAuditStepInputSchema", () => {
  it("accepts valid input", () => {
    const result = FinalAuditStepInputSchema.safeParse({
      spec_path: "docs/specs/feature.md",
      all_modified_files: ["src/file1.ts", "src/file2.ts"],
    });

    expect(result.success).toBe(true);
  });
});

describe("CommitStepInputSchema", () => {
  it("accepts valid input", () => {
    const result = CommitStepInputSchema.safeParse({
      spec_path: "docs/specs/feature.md",
      files_changed: ["src/file.ts"],
      phase_summaries: ["Phase 1 complete"],
      final_audit_summary: "All good",
    });

    expect(result.success).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// TodoCodeWriterOutputSchema
// ---------------------------------------------------------------------------

// ---------------------------------------------------------------------------
// PhaseStatusSchema
// ---------------------------------------------------------------------------

describe("PhaseStatusSchema", () => {
  it("accepts valid object with all required fields", () => {
    const result = PhaseStatusSchema.safeParse({
      phase_number: 1,
      eng_status: "success",
      audit_status: "pass",
      files_modified: ["src/file1.ts", "src/file2.ts"],
      retry_attempts: 0,
    });

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.phase_number).toBe(1);
      expect(result.data.eng_status).toBe("success");
      expect(result.data.audit_status).toBe("pass");
      expect(result.data.files_modified).toEqual(["src/file1.ts", "src/file2.ts"]);
      expect(result.data.retry_attempts).toBe(0);
    }
  });

  it("accepts eng_status='failed'", () => {
    const result = PhaseStatusSchema.safeParse({
      phase_number: 2,
      eng_status: "failed",
      audit_status: "skipped",
      files_modified: [],
      retry_attempts: 2,
    });

    expect(result.success).toBe(true);
  });

  it("accepts eng_status='skipped'", () => {
    const result = PhaseStatusSchema.safeParse({
      phase_number: 3,
      eng_status: "skipped",
      audit_status: "skipped",
      files_modified: [],
      retry_attempts: 0,
    });

    expect(result.success).toBe(true);
  });

  it("rejects invalid eng_status value", () => {
    const result = PhaseStatusSchema.safeParse({
      phase_number: 1,
      eng_status: "invalid",
      audit_status: "pass",
      files_modified: [],
      retry_attempts: 0,
    });

    expect(result.success).toBe(false);
  });

  it("rejects negative retry_attempts", () => {
    const result = PhaseStatusSchema.safeParse({
      phase_number: 1,
      eng_status: "success",
      audit_status: "pass",
      files_modified: [],
      retry_attempts: -1,
    });

    expect(result.success).toBe(false);
  });

  it("accepts all valid audit_status values", () => {
    const statuses = ["pass", "warn", "fail", "skipped"];

    for (const status of statuses) {
      const result = PhaseStatusSchema.safeParse({
        phase_number: 1,
        eng_status: "success",
        audit_status: status,
        files_modified: [],
        retry_attempts: 0,
      });

      expect(result.success).toBe(true);
    }
  });
});

// ---------------------------------------------------------------------------
// TodoCodeWriterOutputSchema
// ---------------------------------------------------------------------------

describe("TodoCodeWriterOutputSchema", () => {
  it("accepts valid success output", () => {
    const result = TodoCodeWriterOutputSchema.safeParse({
      status: "success",
      phases_completed: 3,
      final_audit_status: "pass",
      commit_sha: "abc123",
      commit_message: "feat: add feature",
      files_changed: ["src/file.ts"],
      session_id: "sess_abc123",
      failed_phase: null,
      failure_reason: null,
      phase_results: [],
    });

    expect(result.success).toBe(true);
  });

  it("accepts null commit fields", () => {
    const result = TodoCodeWriterOutputSchema.safeParse({
      status: "failed",
      phases_completed: 1,
      final_audit_status: "fail",
      commit_sha: null,
      commit_message: null,
      files_changed: [],
      session_id: "sess_abc123",
      failed_phase: null,
      failure_reason: null,
      phase_results: [],
    });

    expect(result.success).toBe(true);
  });

  it("accepts failed_phase=null when no failure", () => {
    const result = TodoCodeWriterOutputSchema.safeParse({
      status: "success",
      phases_completed: 3,
      final_audit_status: "pass",
      commit_sha: "abc123",
      commit_message: "feat: add feature",
      files_changed: ["src/file.ts"],
      failed_phase: null,
      failure_reason: null,
      phase_results: [],
    });

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.failed_phase).toBeNull();
    }
  });

  it("accepts failed_phase=3 when phase fails", () => {
    const result = TodoCodeWriterOutputSchema.safeParse({
      status: "failed",
      phases_completed: 2,
      final_audit_status: "fail",
      commit_sha: null,
      commit_message: null,
      files_changed: [],
      failed_phase: 3,
      failure_reason: "Engineering step failed after max retries",
      phase_results: [],
    });

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.failed_phase).toBe(3);
    }
  });

  it("accepts failure_reason=null when no failure", () => {
    const result = TodoCodeWriterOutputSchema.safeParse({
      status: "success",
      phases_completed: 3,
      final_audit_status: "pass",
      commit_sha: "abc123",
      commit_message: "feat: add feature",
      files_changed: ["src/file.ts"],
      failed_phase: null,
      failure_reason: null,
      phase_results: [],
    });

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.failure_reason).toBeNull();
    }
  });

  it("accepts failure_reason with non-empty string", () => {
    const result = TodoCodeWriterOutputSchema.safeParse({
      status: "failed",
      phases_completed: 1,
      final_audit_status: "fail",
      commit_sha: null,
      commit_message: null,
      files_changed: [],
      failed_phase: 2,
      failure_reason: "Audit step failed with critical issues",
      phase_results: [],
    });

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.failure_reason).toBe("Audit step failed with critical issues");
    }
  });

  it("accepts phase_results array with PhaseStatus objects", () => {
    const result = TodoCodeWriterOutputSchema.safeParse({
      status: "success",
      phases_completed: 2,
      final_audit_status: "pass",
      commit_sha: "abc123",
      commit_message: "feat: add feature",
      files_changed: ["src/file1.ts", "src/file2.ts"],
      failed_phase: null,
      failure_reason: null,
      phase_results: [
        {
          phase_number: 1,
          eng_status: "success",
          audit_status: "pass",
          files_modified: ["src/file1.ts"],
          retry_attempts: 0,
        },
        {
          phase_number: 2,
          eng_status: "success",
          audit_status: "pass",
          files_modified: ["src/file2.ts"],
          retry_attempts: 1,
        },
      ],
    });

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.phase_results).toHaveLength(2);
      expect(result.data.phase_results[0]?.phase_number).toBe(1);
      expect(result.data.phase_results[1]?.retry_attempts).toBe(1);
    }
  });

  it("rejects invalid status", () => {
    const result = TodoCodeWriterOutputSchema.safeParse({
      status: "invalid",
      phases_completed: 0,
      final_audit_status: "pass",
      commit_sha: null,
      commit_message: null,
      files_changed: [],
      session_id: "sess_abc123",
      failed_phase: null,
      failure_reason: null,
      phase_results: [],
    });

    expect(result.success).toBe(false);
  });

  it("rejects negative phases_completed", () => {
    const result = TodoCodeWriterOutputSchema.safeParse({
      status: "success",
      phases_completed: -1,
      final_audit_status: "pass",
      commit_sha: null,
      commit_message: null,
      files_changed: [],
      session_id: "sess_abc123",
      failed_phase: null,
      failure_reason: null,
      phase_results: [],
    });

    expect(result.success).toBe(false);
  });

  it("accepts output without session_id (optional, framework-injected)", () => {
    const result = TodoCodeWriterOutputSchema.safeParse({
      status: "success",
      phases_completed: 3,
      final_audit_status: "pass",
      commit_sha: "abc123",
      commit_message: "feat: add feature",
      files_changed: ["src/file.ts"],
      failed_phase: null,
      failure_reason: null,
      phase_results: [],
    });

    expect(result.success).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// CommitStepInputSchema - New fields
// ---------------------------------------------------------------------------

describe("CommitStepInputSchema - Extended", () => {
  it("accepts objects with partial_run=true", () => {
    const result = CommitStepInputSchema.safeParse({
      spec_path: "docs/specs/feature.md",
      files_changed: ["src/file.ts"],
      phase_summaries: ["Phase 1 complete"],
      final_audit_summary: "All good",
      partial_run: true,
      failure_context: "Phase 3 engineering failed after retries",
    });

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.partial_run).toBe(true);
      expect(result.data.failure_context).toBe("Phase 3 engineering failed after retries");
    }
  });

  it("accepts objects without partial_run (optional)", () => {
    const result = CommitStepInputSchema.safeParse({
      spec_path: "docs/specs/feature.md",
      files_changed: ["src/file.ts"],
      phase_summaries: ["Phase 1 complete"],
      final_audit_summary: "All good",
    });

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.partial_run).toBeUndefined();
      expect(result.data.failure_context).toBeUndefined();
    }
  });

  it("accepts partial_run=false", () => {
    const result = CommitStepInputSchema.safeParse({
      spec_path: "docs/specs/feature.md",
      files_changed: ["src/file.ts"],
      phase_summaries: ["Phase 1 complete", "Phase 2 complete"],
      final_audit_summary: "All good",
      partial_run: false,
    });

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.partial_run).toBe(false);
    }
  });
});
