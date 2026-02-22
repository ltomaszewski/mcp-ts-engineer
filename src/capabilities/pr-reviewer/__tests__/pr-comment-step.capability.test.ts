import { describe, it, expect } from "vitest";
import type { ReviewIssue, ReviewIssueData, CommentStepInput } from "../pr-reviewer.schema.js";
import { prCommentStepCapability } from "../pr-comment-step.capability.js";

const makeCommentStepInput = (
  issues: ReviewIssue[],
  overrides?: Partial<CommentStepInput>,
): CommentStepInput => ({
  pr_context: {
    pr_number: 42,
    repo_owner: "test-owner",
    repo_name: "test-repo",
    pr_branch: "feat/test",
    base_branch: "main",
    files_changed: ["src/test.ts"],
    diff_content: "diff content",
    is_draft: false,
    is_closed: false,
  },
  issues,
  fixes_applied: 0,
  cost_usd: 0.05,
  mode: "review-only",
  incremental: false,
  ...overrides,
});

const makeMockIssue = (overrides?: Partial<ReviewIssue>): ReviewIssue => ({
  severity: "HIGH",
  category: "security",
  title: "Test issue title",
  file_path: "src/test.ts",
  line: 42,
  details: "Test issue details",
  suggestion: "Fix the issue",
  auto_fixable: false,
  confidence: 85,
  ...overrides,
});

/**
 * Extract the comment body from the prompt builder output.
 * The comment body appears in a HEREDOC block inside the userPrompt.
 */
function getCommentBody(input: CommentStepInput): string {
  const v1 = prCommentStepCapability.promptRegistry?.v1;
  if (!v1) throw new Error("v1 prompt not found");
  const built = v1.build(input);
  // The comment body is embedded between the first ``` block
  // Extract the body between "Post EXACTLY this comment body" markers
  const match = built.userPrompt.match(
    /Post EXACTLY this comment body \(do not modify it\):\n\n```\n([\s\S]*?)\n```\n\n## Steps/,
  );
  if (!match?.[1]) throw new Error("Could not extract comment body from prompt");
  return match[1];
}

function extractIssuesDataJson(body: string): ReviewIssueData[] {
  const match = body.match(/### Issues Data\n\n```json\n([\s\S]*?)\n```/);
  if (!match?.[1]) throw new Error("Issues Data section not found in comment body");
  return JSON.parse(match[1]) as ReviewIssueData[];
}

describe("pr-comment-step: Issues Data section", () => {
  describe("approval comment (zero issues)", () => {
    it("includes empty Issues Data section", () => {
      const input = makeCommentStepInput([]);
      const body = getCommentBody(input);

      expect(body).toContain("### Issues Data");
      expect(body).toContain("```json");
      const data = extractIssuesDataJson(body);
      expect(data).toEqual([]);
    });

    it("Issues Data section appears before footer", () => {
      const input = makeCommentStepInput([]);
      const body = getCommentBody(input);

      const issuesDataIdx = body.indexOf("### Issues Data");
      const footerIdx = body.indexOf("*Automated review by PR Reviewer*");

      expect(issuesDataIdx).toBeGreaterThan(-1);
      expect(footerIdx).toBeGreaterThan(-1);
      expect(issuesDataIdx).toBeLessThan(footerIdx);
    });
  });

  describe("full report comment (with issues)", () => {
    it("includes Issues Data section with all issues", () => {
      const issues = [
        makeMockIssue({ severity: "CRITICAL", title: "Critical bug" }),
        makeMockIssue({ severity: "LOW", title: "Minor style" }),
      ];
      const input = makeCommentStepInput(issues);
      const body = getCommentBody(input);

      const data = extractIssuesDataJson(body);
      expect(data).toHaveLength(2);
      expect(data[0]!.severity).toBe("CRITICAL");
      expect(data[0]!.title).toBe("Critical bug");
      expect(data[1]!.severity).toBe("LOW");
      expect(data[1]!.title).toBe("Minor style");
    });

    it("Issues Data section appears after issue details, before footer", () => {
      const issues = [makeMockIssue()];
      const input = makeCommentStepInput(issues);
      const body = getCommentBody(input);

      const issueDetailsIdx = body.indexOf("### Issues Requiring Manual Review");
      const issuesDataIdx = body.indexOf("### Issues Data");
      const footerIdx = body.indexOf("*Automated review by PR Reviewer*");

      expect(issueDetailsIdx).toBeGreaterThan(-1);
      expect(issuesDataIdx).toBeGreaterThan(issueDetailsIdx);
      expect(footerIdx).toBeGreaterThan(issuesDataIdx);
    });

    it("maps ReviewIssue fields to ReviewIssueData correctly", () => {
      const issue = makeMockIssue({
        file_path: "src/auth.ts",
        line: 99,
        severity: "MEDIUM",
        category: "performance",
        title: "Slow query",
        details: "N+1 query detected",
        suggestion: "Use batch loading",
        auto_fixable: true,
      });
      const input = makeCommentStepInput([issue]);
      const body = getCommentBody(input);
      const data = extractIssuesDataJson(body);

      expect(data[0]).toEqual({
        file: "src/auth.ts",
        line: 99,
        severity: "MEDIUM",
        category: "performance",
        title: "Slow query",
        description: "N+1 query detected",
        suggestedFix: "Use batch loading",
        autoFixable: true,
      });
    });

    it("maps null line values correctly", () => {
      const issue = makeMockIssue({ line: undefined });
      const input = makeCommentStepInput([issue]);
      const body = getCommentBody(input);
      const data = extractIssuesDataJson(body);

      expect(data[0]!.line).toBeNull();
    });

    it("maps missing category/suggestion to empty strings", () => {
      const issue = makeMockIssue({
        category: undefined,
        suggestion: undefined,
      });
      const input = makeCommentStepInput([issue]);
      const body = getCommentBody(input);
      const data = extractIssuesDataJson(body);

      expect(data[0]!.category).toBe("");
      expect(data[0]!.suggestedFix).toBe("");
    });
  });
});
