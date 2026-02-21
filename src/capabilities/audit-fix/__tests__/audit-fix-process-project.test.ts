import { vi, type MockInstance } from "vitest";
/**
 * Integration tests for lint phase execution in processProject orchestration.
 * Tests that lint scan and lint fix steps are invoked in the correct order.
 */

import { processProject } from "../audit-fix-process-project.js";
import type { CapabilityContext } from "../../../core/capability-registry/capability-registry.types.js";
import type {
  LintScanResult,
  LintFixResult,
  AuditStepResult,
  DepsScanStepResult,
} from "../audit-fix.schema.js";

describe("Process Project - Lint Integration", () => {
  let mockContext: CapabilityContext;
  let invokeSpy: MockInstance<typeof mockContext.invokeCapability>;

  beforeEach(() => {
    invokeSpy = vi.fn<typeof mockContext.invokeCapability>();
    mockContext = {
      invokeCapability: invokeSpy,
    } as unknown as CapabilityContext;
  });

  describe("lint scan invocation order", () => {
    it("invokes lint scan BEFORE audit step (after deps scan)", async () => {
      const depsScanResult: DepsScanStepResult = {
        audit_ran: true,
        vulnerabilities_found: 0,
        vulnerabilities_by_severity: { critical: 0, high: 0, moderate: 0, low: 0 },
        audit_json: "",
      };

      const auditResult: AuditStepResult = {
        status: "pass",
        issues_remaining: 0,
        files_with_issues: [],
        fixes_applied: 0,
        tsc_passed: true,
        summary: "All clean",
      };

      const lintScanResult: LintScanResult = {
        lint_available: false,
        lint_passed: true,
        error_count: 0,
        warning_count: 0,
        lint_report: "",
        files_with_lint_errors: [],
      };

      invokeSpy
        .mockResolvedValueOnce(depsScanResult) // deps scan (runs first)
        .mockResolvedValueOnce(lintScanResult) // lint scan
        .mockResolvedValueOnce(auditResult); // audit step

      await processProject(
        "apps/test-project",
        5,
        10,
        "/test/cwd",
        mockContext,
        true,
        undefined
      );

      expect(invokeSpy).toHaveBeenCalledTimes(3);
      expect(invokeSpy.mock.calls[0]?.[0]).toBe("audit_fix_deps_scan_step");
      expect(invokeSpy.mock.calls[1]?.[0]).toBe("audit_fix_lint_scan_step");
      expect(invokeSpy.mock.calls[2]?.[0]).toBe("audit_fix_audit_step");
    });
  });

  describe("lint fix invocation conditions", () => {
    it("invokes lint fix ONLY when lint_available: true AND lint_passed: false", async () => {
      const depsScanResult: DepsScanStepResult = {
        audit_ran: true,
        vulnerabilities_found: 0,
        vulnerabilities_by_severity: { critical: 0, high: 0, moderate: 0, low: 0 },
        audit_json: "",
      };

      const lintScanResult: LintScanResult = {
        lint_available: true,
        lint_passed: false,
        error_count: 5,
        warning_count: 2,
        lint_report: "5 lint errors found",
        files_with_lint_errors: ["src/file1.ts", "src/file2.ts"],
      };

      const lintFixResult: LintFixResult = {
        status: "success",
        files_modified: ["src/file1.ts", "src/file2.ts"],
        summary: "Fixed 5 lint errors",
      };

      const auditResult: AuditStepResult = {
        status: "pass",
        issues_remaining: 0,
        files_with_issues: [],
        fixes_applied: 0,
        tsc_passed: true,
        summary: "All clean",
      };

      invokeSpy
        .mockResolvedValueOnce(depsScanResult) // deps scan (runs first)
        .mockResolvedValueOnce(lintScanResult) // lint scan
        .mockResolvedValueOnce(lintFixResult) // lint fix
        .mockResolvedValueOnce(auditResult) // audit step
        .mockResolvedValueOnce({ commit_sha: "abc123", status: "success", summary: "Committed" }); // commit

      const { result } = await processProject(
        "apps/test-project",
        5,
        10,
        "/test/cwd",
        mockContext,
        true,
        undefined
      );

      expect(invokeSpy).toHaveBeenCalledWith("audit_fix_lint_scan_step", {
        project_path: "apps/test-project",
        cwd: "/test/cwd",
      });

      expect(invokeSpy).toHaveBeenCalledWith("audit_fix_lint_fix_step", {
        project_path: "apps/test-project",
        lint_report: "5 lint errors found",
        files_with_lint_errors: ["src/file1.ts", "src/file2.ts"],
        cwd: "/test/cwd",
      });

      expect(result.files_modified).toContain("src/file1.ts");
      expect(result.files_modified).toContain("src/file2.ts");
    });

    it("does NOT invoke lint fix when lint_available: false", async () => {
      const depsScanResult: DepsScanStepResult = {
        audit_ran: true,
        vulnerabilities_found: 0,
        vulnerabilities_by_severity: { critical: 0, high: 0, moderate: 0, low: 0 },
        audit_json: "",
      };

      const lintScanResult: LintScanResult = {
        lint_available: false,
        lint_passed: true,
        error_count: 0,
        warning_count: 0,
        lint_report: "",
        files_with_lint_errors: [],
      };

      const auditResult: AuditStepResult = {
        status: "pass",
        issues_remaining: 0,
        files_with_issues: [],
        fixes_applied: 0,
        tsc_passed: true,
        summary: "All clean",
      };

      invokeSpy
        .mockResolvedValueOnce(depsScanResult) // deps scan
        .mockResolvedValueOnce(lintScanResult) // lint scan
        .mockResolvedValueOnce(auditResult); // audit step

      await processProject(
        "apps/test-project",
        5,
        10,
        "/test/cwd",
        mockContext,
        true,
        undefined
      );

      const lintFixCalls = invokeSpy.mock.calls.filter(
        (call) => call[0] === "audit_fix_lint_fix_step"
      );
      expect(lintFixCalls).toHaveLength(0);
    });

    it("does NOT invoke lint fix when lint_passed: true", async () => {
      const depsScanResult: DepsScanStepResult = {
        audit_ran: true,
        vulnerabilities_found: 0,
        vulnerabilities_by_severity: { critical: 0, high: 0, moderate: 0, low: 0 },
        audit_json: "",
      };

      const lintScanResult: LintScanResult = {
        lint_available: true,
        lint_passed: true,
        error_count: 0,
        warning_count: 3,
        lint_report: "3 warnings found",
        files_with_lint_errors: [],
      };

      const auditResult: AuditStepResult = {
        status: "pass",
        issues_remaining: 0,
        files_with_issues: [],
        fixes_applied: 0,
        tsc_passed: true,
        summary: "All clean",
      };

      invokeSpy
        .mockResolvedValueOnce(depsScanResult) // deps scan
        .mockResolvedValueOnce(lintScanResult) // lint scan
        .mockResolvedValueOnce(auditResult); // audit step

      await processProject(
        "apps/test-project",
        5,
        10,
        "/test/cwd",
        mockContext,
        true,
        undefined
      );

      const lintFixCalls = invokeSpy.mock.calls.filter(
        (call) => call[0] === "audit_fix_lint_fix_step"
      );
      expect(lintFixCalls).toHaveLength(0);
    });
  });

  describe("lint error handling", () => {
    it("continues workflow when lint scan throws error (uses fallback)", async () => {
      const depsScanResult: DepsScanStepResult = {
        audit_ran: true,
        vulnerabilities_found: 0,
        vulnerabilities_by_severity: { critical: 0, high: 0, moderate: 0, low: 0 },
        audit_json: "",
      };

      const auditResult: AuditStepResult = {
        status: "pass",
        issues_remaining: 0,
        files_with_issues: [],
        fixes_applied: 0,
        tsc_passed: true,
        summary: "All clean",
      };

      invokeSpy
        .mockResolvedValueOnce(depsScanResult) // deps scan
        .mockRejectedValueOnce(new Error("Lint scan failed")) // lint scan error
        .mockResolvedValueOnce(auditResult); // audit step

      const { result } = await processProject(
        "apps/test-project",
        5,
        10,
        "/test/cwd",
        mockContext,
        true,
        undefined
      );

      expect(invokeSpy).toHaveBeenCalledWith("audit_fix_lint_scan_step", {
        project_path: "apps/test-project",
        cwd: "/test/cwd",
      });

      expect(invokeSpy).toHaveBeenCalledWith("audit_fix_audit_step", {
        project_path: "apps/test-project",
        cwd: "/test/cwd",
      });

      expect(result.final_audit_status).toBe("pass");
    });
  });

  describe("files_modified tracking", () => {
    it("adds files_modified from lint fix to allFilesModified", async () => {
      const depsScanResult: DepsScanStepResult = {
        audit_ran: true,
        vulnerabilities_found: 0,
        vulnerabilities_by_severity: { critical: 0, high: 0, moderate: 0, low: 0 },
        audit_json: "",
      };

      const lintScanResult: LintScanResult = {
        lint_available: true,
        lint_passed: false,
        error_count: 3,
        warning_count: 0,
        lint_report: "3 errors",
        files_with_lint_errors: ["src/a.ts", "src/b.ts"],
      };

      const lintFixResult: LintFixResult = {
        status: "success",
        files_modified: ["src/a.ts", "src/b.ts"],
        summary: "Fixed 3 errors",
      };

      const auditResult: AuditStepResult = {
        status: "pass",
        issues_remaining: 0,
        files_with_issues: [],
        fixes_applied: 0,
        tsc_passed: true,
        summary: "All clean",
      };

      invokeSpy
        .mockResolvedValueOnce(depsScanResult) // deps scan
        .mockResolvedValueOnce(lintScanResult) // lint scan
        .mockResolvedValueOnce(lintFixResult) // lint fix
        .mockResolvedValueOnce(auditResult) // audit step
        .mockResolvedValueOnce({ commit_sha: "abc123", status: "success", summary: "Committed" }); // commit

      const { result } = await processProject(
        "apps/test-project",
        5,
        10,
        "/test/cwd",
        mockContext,
        true,
        undefined
      );

      expect(result.files_modified).toContain("src/a.ts");
      expect(result.files_modified).toContain("src/b.ts");
      expect(result.files_modified.length).toBeGreaterThanOrEqual(2);
    });
  });
});
