/**
 * Tests for finalize Zod schemas.
 */

import {
  FinalizeInputSchema,
  FinalizePlanSchema,
  AuditResultSchema,
  TestResultSchema,
  CodemapResultSchema,
  ReadmeResultSchema,
  FinalizeCommitResultSchema,
  FinalizeOutputSchema,
  AuditStepInputSchema,
  TestStepInputSchema,
  CodemapStepInputSchema,
  ReadmeStepInputSchema,
  CommitStepInputSchema,
} from "../finalize.schema.js";

// ---------------------------------------------------------------------------
// FinalizeInputSchema
// ---------------------------------------------------------------------------

describe("FinalizeInputSchema", () => {
  describe("valid inputs", () => {
    it("accepts valid files_changed with defaults applied", () => {
      const result = FinalizeInputSchema.safeParse({
        files_changed: ["src/file.ts"],
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.files_changed).toEqual(["src/file.ts"]);
        expect(result.data.skip_tests).toBe(false);
        expect(result.data.skip_codemaps).toBe(false);
        expect(result.data.cwd).toBeUndefined();
      }
    });

    it("accepts multiple files_changed", () => {
      const result = FinalizeInputSchema.safeParse({
        files_changed: ["src/file1.ts", "src/file2.ts", "src/file3.ts"],
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.files_changed).toHaveLength(3);
      }
    });

    it("accepts optional cwd", () => {
      const result = FinalizeInputSchema.safeParse({
        files_changed: ["src/file.ts"],
        cwd: "/some/path",
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.cwd).toBe("/some/path");
      }
    });

    it("accepts skip_tests=true", () => {
      const result = FinalizeInputSchema.safeParse({
        files_changed: ["src/file.ts"],
        skip_tests: true,
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.skip_tests).toBe(true);
      }
    });

    it("accepts skip_codemaps=true", () => {
      const result = FinalizeInputSchema.safeParse({
        files_changed: ["src/file.ts"],
        skip_codemaps: true,
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.skip_codemaps).toBe(true);
      }
    });

    it("accepts both skip flags", () => {
      const result = FinalizeInputSchema.safeParse({
        files_changed: ["src/file.ts"],
        skip_tests: true,
        skip_codemaps: true,
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.skip_tests).toBe(true);
        expect(result.data.skip_codemaps).toBe(true);
      }
    });

    it("accepts skip_readmes=true", () => {
      const result = FinalizeInputSchema.safeParse({
        files_changed: ["src/file.ts"],
        skip_readmes: true,
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.skip_readmes).toBe(true);
      }
    });

    it("applies default false for skip_readmes", () => {
      const result = FinalizeInputSchema.safeParse({
        files_changed: ["src/file.ts"],
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.skip_readmes).toBe(false);
      }
    });
  });

  describe("invalid inputs", () => {
    it("rejects empty files_changed array", () => {
      const result = FinalizeInputSchema.safeParse({
        files_changed: [],
      });

      expect(result.success).toBe(false);
    });

    it("rejects missing files_changed", () => {
      const result = FinalizeInputSchema.safeParse({});

      expect(result.success).toBe(false);
    });

    it("rejects non-string array items in files_changed", () => {
      const result = FinalizeInputSchema.safeParse({
        files_changed: ["src/file.ts", 123, "src/file2.ts"],
      });

      expect(result.success).toBe(false);
    });

    it("rejects non-boolean skip_tests", () => {
      const result = FinalizeInputSchema.safeParse({
        files_changed: ["src/file.ts"],
        skip_tests: "true",
      });

      expect(result.success).toBe(false);
    });

    it("rejects non-boolean skip_codemaps", () => {
      const result = FinalizeInputSchema.safeParse({
        files_changed: ["src/file.ts"],
        skip_codemaps: "false",
      });

      expect(result.success).toBe(false);
    });

    it("rejects non-boolean skip_readmes", () => {
      const result = FinalizeInputSchema.safeParse({
        files_changed: ["src/file.ts"],
        skip_readmes: "true",
      });

      expect(result.success).toBe(false);
    });
  });
});

// ---------------------------------------------------------------------------
// FinalizePlanSchema
// ---------------------------------------------------------------------------

describe("FinalizePlanSchema", () => {
  it("accepts valid plan with workspace and codemap arrays", () => {
    const result = FinalizePlanSchema.safeParse({
      workspaces: ["apps/my-server"],
      codemap_areas: ["server"],
    });

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.workspaces).toEqual(["apps/my-server"]);
      expect(result.data.codemap_areas).toEqual(["server"]);
    }
  });

  it("accepts empty arrays", () => {
    const result = FinalizePlanSchema.safeParse({
      workspaces: [],
      codemap_areas: [],
    });

    expect(result.success).toBe(true);
  });

  it("rejects missing workspaces field", () => {
    const result = FinalizePlanSchema.safeParse({
      codemap_areas: ["server"],
    });

    expect(result.success).toBe(false);
  });

  it("rejects missing codemap_areas field", () => {
    const result = FinalizePlanSchema.safeParse({
      workspaces: ["apps/server"],
    });

    expect(result.success).toBe(false);
  });

  it("rejects non-string array items in workspaces", () => {
    const result = FinalizePlanSchema.safeParse({
      workspaces: [123],
      codemap_areas: [],
    });

    expect(result.success).toBe(false);
  });

  it("rejects non-array workspaces", () => {
    const result = FinalizePlanSchema.safeParse({
      workspaces: "apps/my-server",
      codemap_areas: [],
    });

    expect(result.success).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// AuditResultSchema
// ---------------------------------------------------------------------------

describe("AuditResultSchema", () => {
  it("accepts pass status", () => {
    const result = AuditResultSchema.safeParse({
      status: "pass",
      fixes_applied: 0,
      issues_remaining: 0,
      tsc_passed: true,
      summary: "All checks passed",
    });

    expect(result.success).toBe(true);
  });

  it("accepts warn status", () => {
    const result = AuditResultSchema.safeParse({
      status: "warn",
      fixes_applied: 2,
      issues_remaining: 1,
      tsc_passed: true,
      summary: "Minor warnings",
    });

    expect(result.success).toBe(true);
  });

  it("accepts fail status", () => {
    const result = AuditResultSchema.safeParse({
      status: "fail",
      fixes_applied: 3,
      issues_remaining: 5,
      tsc_passed: false,
      summary: "Critical issues",
    });

    expect(result.success).toBe(true);
  });

  it("rejects invalid status", () => {
    const result = AuditResultSchema.safeParse({
      status: "invalid",
      fixes_applied: 0,
      issues_remaining: 0,
      tsc_passed: true,
      summary: "Test",
    });

    expect(result.success).toBe(false);
  });

  it("rejects negative fixes_applied", () => {
    const result = AuditResultSchema.safeParse({
      status: "pass",
      fixes_applied: -1,
      issues_remaining: 0,
      tsc_passed: true,
      summary: "Test",
    });

    expect(result.success).toBe(false);
  });

  it("rejects non-integer fixes_applied", () => {
    const result = AuditResultSchema.safeParse({
      status: "pass",
      fixes_applied: 2.5,
      issues_remaining: 0,
      tsc_passed: true,
      summary: "Test",
    });

    expect(result.success).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// TestResultSchema
// ---------------------------------------------------------------------------

describe("TestResultSchema", () => {
  it("accepts passed=true with workspaces", () => {
    const result = TestResultSchema.safeParse({
      passed: true,
      workspaces_tested: ["apps/my-server", "packages/core"],
      summary: "All tests passed",
    });

    expect(result.success).toBe(true);
  });

  it("accepts passed=false", () => {
    const result = TestResultSchema.safeParse({
      passed: false,
      workspaces_tested: ["apps/my-server"],
      summary: "Tests failed",
    });

    expect(result.success).toBe(true);
  });

  it("accepts empty workspaces_tested array", () => {
    const result = TestResultSchema.safeParse({
      passed: true,
      workspaces_tested: [],
      summary: "No workspaces to test",
    });

    expect(result.success).toBe(true);
  });

  it("rejects non-boolean passed", () => {
    const result = TestResultSchema.safeParse({
      passed: "true",
      workspaces_tested: [],
      summary: "Test",
    });

    expect(result.success).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// CodemapResultSchema
// ---------------------------------------------------------------------------

describe("CodemapResultSchema", () => {
  it("accepts updated=true with codemaps_changed", () => {
    const result = CodemapResultSchema.safeParse({
      updated: true,
      codemaps_changed: [".claude/codemaps/feature.md"],
      summary: "Updated feature codemap",
    });

    expect(result.success).toBe(true);
  });

  it("accepts updated=false", () => {
    const result = CodemapResultSchema.safeParse({
      updated: false,
      codemaps_changed: [],
      summary: "No changes needed",
    });

    expect(result.success).toBe(true);
  });

  it("accepts empty codemaps_changed array", () => {
    const result = CodemapResultSchema.safeParse({
      updated: true,
      codemaps_changed: [],
      summary: "Updated",
    });

    expect(result.success).toBe(true);
  });

  it("rejects non-boolean updated", () => {
    const result = CodemapResultSchema.safeParse({
      updated: "true",
      codemaps_changed: [],
      summary: "Test",
    });

    expect(result.success).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// ReadmeResultSchema
// ---------------------------------------------------------------------------

describe("ReadmeResultSchema", () => {
  it("accepts valid result with all fields", () => {
    const result = ReadmeResultSchema.safeParse({
      updated: true,
      readmes_changed: ["apps/my-server/README.md", "packages/types/README.md"],
      summary: "Updated 2 READMEs",
    });

    expect(result.success).toBe(true);
  });

  it("accepts empty readmes_changed array", () => {
    const result = ReadmeResultSchema.safeParse({
      updated: false,
      readmes_changed: [],
      summary: "No changes needed",
    });

    expect(result.success).toBe(true);
  });

  it("rejects invalid updated type", () => {
    const result = ReadmeResultSchema.safeParse({
      updated: "true",
      readmes_changed: [],
      summary: "Test",
    });

    expect(result.success).toBe(false);
  });

  it("rejects missing summary", () => {
    const result = ReadmeResultSchema.safeParse({
      updated: false,
      readmes_changed: [],
    });

    expect(result.success).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// FinalizeCommitResultSchema
// ---------------------------------------------------------------------------

describe("FinalizeCommitResultSchema", () => {
  it("accepts committed=true with SHA and message", () => {
    const result = FinalizeCommitResultSchema.safeParse({
      committed: true,
      commit_sha: "abc123def456",
      commit_message: "chore: finalize audit fixes",
      files_committed: ["src/file.ts", ".claude/codemaps/feature.md"],
    });

    expect(result.success).toBe(true);
  });

  it("accepts committed=false with null fields", () => {
    const result = FinalizeCommitResultSchema.safeParse({
      committed: false,
      commit_sha: null,
      commit_message: null,
      files_committed: [],
    });

    expect(result.success).toBe(true);
  });

  it("accepts nullable commit_sha", () => {
    const result = FinalizeCommitResultSchema.safeParse({
      committed: false,
      commit_sha: null,
      commit_message: "No commit",
      files_committed: [],
    });

    expect(result.success).toBe(true);
  });

  it("rejects non-boolean committed", () => {
    const result = FinalizeCommitResultSchema.safeParse({
      committed: "true",
      commit_sha: null,
      commit_message: null,
      files_committed: [],
    });

    expect(result.success).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// Sub-capability Input Schemas
// ---------------------------------------------------------------------------

describe("AuditStepInputSchema", () => {
  it("accepts valid input", () => {
    const result = AuditStepInputSchema.safeParse({
      files_changed: ["src/file.ts"],
      cwd: "/some/path",
    });

    expect(result.success).toBe(true);
  });

  it("accepts without cwd", () => {
    const result = AuditStepInputSchema.safeParse({
      files_changed: ["src/file.ts"],
    });

    expect(result.success).toBe(true);
  });

  it("rejects empty files_changed array", () => {
    const result = AuditStepInputSchema.safeParse({
      files_changed: [],
    });

    expect(result.success).toBe(false);
  });
});

describe("TestStepInputSchema", () => {
  it("accepts valid input", () => {
    const result = TestStepInputSchema.safeParse({
      workspaces: ["apps/my-server"],
      cwd: "/some/path",
    });

    expect(result.success).toBe(true);
  });

  it("accepts without cwd", () => {
    const result = TestStepInputSchema.safeParse({
      workspaces: ["apps/my-server"],
    });

    expect(result.success).toBe(true);
  });

  it("rejects empty workspaces array", () => {
    const result = TestStepInputSchema.safeParse({
      workspaces: [],
    });

    expect(result.success).toBe(false);
  });
});

describe("CodemapStepInputSchema", () => {
  it("accepts valid input", () => {
    const result = CodemapStepInputSchema.safeParse({
      files_changed: ["src/file.ts"],
      cwd: "/some/path",
    });

    expect(result.success).toBe(true);
  });

  it("accepts without cwd", () => {
    const result = CodemapStepInputSchema.safeParse({
      files_changed: ["src/file.ts"],
    });

    expect(result.success).toBe(true);
  });

  it("rejects empty files_changed array", () => {
    const result = CodemapStepInputSchema.safeParse({
      files_changed: [],
    });

    expect(result.success).toBe(false);
  });
});

describe("ReadmeStepInputSchema", () => {
  it("accepts valid files_changed and cwd", () => {
    const result = ReadmeStepInputSchema.safeParse({
      files_changed: ["src/api/user.ts"],
      cwd: "/some/path",
    });

    expect(result.success).toBe(true);
  });

  it("rejects empty files_changed array", () => {
    const result = ReadmeStepInputSchema.safeParse({
      files_changed: [],
    });

    expect(result.success).toBe(false);
  });
});

describe("CommitStepInputSchema", () => {
  it("accepts valid input", () => {
    const result = CommitStepInputSchema.safeParse({
      audit_summary: "Audit complete",
      codemap_summary: "Codemaps updated",
      files_affected: ["src/file.ts"],
      cwd: "/some/path",
    });

    expect(result.success).toBe(true);
  });

  it("accepts without cwd", () => {
    const result = CommitStepInputSchema.safeParse({
      audit_summary: "Audit complete",
      codemap_summary: "Codemaps updated",
      files_affected: ["src/file.ts"],
    });

    expect(result.success).toBe(true);
  });

  it("accepts empty files_affected array", () => {
    const result = CommitStepInputSchema.safeParse({
      audit_summary: "Audit complete",
      codemap_summary: "No changes",
      files_affected: [],
    });

    expect(result.success).toBe(true);
  });

  it("accepts optional readme_summary", () => {
    const result = CommitStepInputSchema.safeParse({
      audit_summary: "Audit complete",
      codemap_summary: "Codemaps updated",
      readme_summary: "Updated 2 READMEs",
      files_affected: ["src/file.ts"],
    });

    expect(result.success).toBe(true);
  });

  it("works with readme_summary omitted", () => {
    const result = CommitStepInputSchema.safeParse({
      audit_summary: "Audit complete",
      codemap_summary: "No changes",
      files_affected: [],
    });

    expect(result.success).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// FinalizeOutputSchema
// ---------------------------------------------------------------------------

describe("FinalizeOutputSchema", () => {
  it("accepts valid success output with all fields", () => {
    const result = FinalizeOutputSchema.safeParse({
      status: "success",
      audit_status: "pass",
      audit_fixes_applied: 2,
      audit_summary: "Fixed 2 issues",
      tests_passed: true,
      tests_summary: "All tests passed",
      codemaps_updated: true,
      codemaps_summary: "Updated 1 codemap",
      readmes_updated: true,
      readmes_summary: "Updated 2 READMEs",
      commit_sha: "abc123",
      commit_message: "chore: finalize",
      session_id: "sess_abc123",
    });

    expect(result.success).toBe(true);
  });

  it("accepts failed status", () => {
    const result = FinalizeOutputSchema.safeParse({
      status: "failed",
      audit_status: "fail",
      audit_fixes_applied: 0,
      audit_summary: "Failed",
      tests_passed: false,
      tests_summary: "Tests failed",
      codemaps_updated: false,
      codemaps_summary: "No updates",
      readmes_updated: false,
      readmes_summary: "No README changes",
      commit_sha: null,
      commit_message: null,
      session_id: "sess_abc123",
    });

    expect(result.success).toBe(true);
  });

  it("accepts null tests_passed when skipped", () => {
    const result = FinalizeOutputSchema.safeParse({
      status: "success",
      audit_status: "pass",
      audit_fixes_applied: 0,
      audit_summary: "No issues",
      tests_passed: null,
      tests_summary: "Tests skipped",
      codemaps_updated: true,
      codemaps_summary: "Updated",
      readmes_updated: true,
      readmes_summary: "Updated READMEs",
      commit_sha: "abc123",
      commit_message: "chore: finalize",
      session_id: "sess_abc123",
    });

    expect(result.success).toBe(true);
  });

  it("accepts null codemaps_updated when skipped", () => {
    const result = FinalizeOutputSchema.safeParse({
      status: "success",
      audit_status: "pass",
      audit_fixes_applied: 0,
      audit_summary: "No issues",
      tests_passed: true,
      tests_summary: "All tests passed",
      codemaps_updated: null,
      codemaps_summary: "Codemaps skipped",
      readmes_updated: true,
      readmes_summary: "Updated READMEs",
      commit_sha: "abc123",
      commit_message: "chore: finalize",
      session_id: "sess_abc123",
    });

    expect(result.success).toBe(true);
  });

  it("accepts both tests and codemaps as null", () => {
    const result = FinalizeOutputSchema.safeParse({
      status: "success",
      audit_status: "pass",
      audit_fixes_applied: 0,
      audit_summary: "No issues",
      tests_passed: null,
      tests_summary: "Tests skipped",
      codemaps_updated: null,
      codemaps_summary: "Codemaps skipped",
      readmes_updated: false,
      readmes_summary: "No README changes",
      commit_sha: "abc123",
      commit_message: "chore: finalize",
      session_id: "sess_abc123",
    });

    expect(result.success).toBe(true);
  });

  it("accepts null readmes_updated when skipped", () => {
    const result = FinalizeOutputSchema.safeParse({
      status: "success",
      audit_status: "pass",
      audit_fixes_applied: 0,
      audit_summary: "No issues",
      tests_passed: true,
      tests_summary: "All tests passed",
      codemaps_updated: true,
      codemaps_summary: "Codemaps updated",
      readmes_updated: null,
      readmes_summary: "READMEs skipped",
      commit_sha: "abc123",
      commit_message: "chore: finalize",
      session_id: "sess_abc123",
    });

    expect(result.success).toBe(true);
  });

  it("accepts boolean readmes_updated", () => {
    const result = FinalizeOutputSchema.safeParse({
      status: "success",
      audit_status: "pass",
      audit_fixes_applied: 0,
      audit_summary: "No issues",
      tests_passed: true,
      tests_summary: "All tests passed",
      codemaps_updated: false,
      codemaps_summary: "No updates",
      readmes_updated: true,
      readmes_summary: "Updated 3 READMEs",
      commit_sha: "abc123",
      commit_message: "chore: finalize",
      session_id: "sess_abc123",
    });

    expect(result.success).toBe(true);
  });

  it("rejects missing readmes_summary", () => {
    const result = FinalizeOutputSchema.safeParse({
      status: "success",
      audit_status: "pass",
      audit_fixes_applied: 0,
      audit_summary: "No issues",
      tests_passed: true,
      tests_summary: "All tests passed",
      codemaps_updated: false,
      codemaps_summary: "No updates",
      readmes_updated: true,
      commit_sha: "abc123",
      commit_message: "chore: finalize",
      session_id: "sess_abc123",
    });

    expect(result.success).toBe(false);
  });

  it("rejects invalid status", () => {
    const result = FinalizeOutputSchema.safeParse({
      status: "invalid",
      audit_status: "pass",
      audit_fixes_applied: 0,
      audit_summary: "Test",
      tests_passed: true,
      tests_summary: "Test",
      codemaps_updated: false,
      codemaps_summary: "Test",
      readmes_updated: false,
      readmes_summary: "Test",
      commit_sha: null,
      commit_message: null,
      session_id: "sess_abc123",
    });

    expect(result.success).toBe(false);
  });

  it("accepts output without session_id (optional, framework-injected)", () => {
    const result = FinalizeOutputSchema.safeParse({
      status: "success",
      audit_status: "pass",
      audit_fixes_applied: 0,
      audit_summary: "Test",
      tests_passed: true,
      tests_summary: "Test",
      codemaps_updated: false,
      codemaps_summary: "Test",
      readmes_updated: false,
      readmes_summary: "Test",
      commit_sha: null,
      commit_message: null,
    });

    expect(result.success).toBe(true);
  });
});
