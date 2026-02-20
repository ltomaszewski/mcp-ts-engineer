import type { PromptVersion } from "../../../core/prompt/prompt.types.js";
import { getCommitTag } from "../../../config/constants.js";

/**
 * Commit step prompt for finalize capability.
 * Commits all cleanup changes (audit fixes and codemap updates) with a descriptive message.
 */

interface CommitPromptInput {
  auditSummary: string;
  codemapSummary: string;
  filesAffected: string[];
  sessionId: string;
  cwd?: string;
}

const buildCommitUserPrompt = (
  auditSummary: string,
  codemapSummary: string,
  filesAffected: string[],
  sessionId: string,
  cwd?: string,
): string => {
  const filesAffectedList = filesAffected.map((f) => `  - ${f}`).join("\n");
  const cwdContext = cwd ? `Working directory: ${cwd}\n\n` : "";

  return `You are the Commit Agent for finalizing cleanup changes.

${cwdContext}Audit Summary:
${auditSummary}

Codemap Summary:
${codemapSummary}

Files affected:
${filesAffectedList}

Your responsibilities:
1. Check git status to see what changes exist:
   - Run: git status
   - Identify modified, added, or deleted files

2. If changes exist, stage and commit them:
   - Stage all changes: git add .
   - Create a descriptive commit message following this format:
     "chore(<scope>): ${getCommitTag()} finalize audit fixes and codemap updates"
   - Scope should be derived from the files affected (e.g., "capabilities", "core", "docs")
   - Include a commit body with details if fixes were significant

3. If no changes exist:
   - Don't create an empty commit
   - Report that no commit was needed

4. Extract commit information:
   - Get commit SHA: git rev-parse HEAD
   - Record the commit message used

5. Output your results in this format:

<finalize_commit_result>
{
  "committed": <boolean>,
  "commit_sha": "<sha or null>",
  "commit_message": "<message or null>",
  "files_committed": ["file1.ts", "file2.ts"]
}
</finalize_commit_result>

Commit message guidelines:
- Use conventional commits format: "chore(<scope>): <description>"
- Keep the subject line under 72 characters
- Include body with bullet points if multiple types of changes
- Example: "chore(capabilities): ${getCommitTag()} finalize audit fixes and codemap updates"
- After the commit body, add a blank line followed by: Session-Id: ${sessionId}

Git trailer format:
- Add a blank line after the commit body
- Add the Session-Id trailer: Session-Id: ${sessionId}
- This trailer enables tracing commits back to their cost report session

Your goal is to create a clean, descriptive commit that captures all finalization changes.`;
};

export const commitPromptV1: PromptVersion = {
  version: "v1",
  createdAt: "2026-01-30",
  description:
    "Commit step: commits cleanup changes with descriptive conventional commit message",
  deprecated: false,
  sunsetDate: undefined,
  build: (input: unknown) => {
    const { auditSummary, codemapSummary, filesAffected, sessionId, cwd } =
      input as CommitPromptInput;
    return {
      systemPrompt: {
        type: "preset" as const,
        preset: "claude_code" as const,
      },
      userPrompt: buildCommitUserPrompt(
        auditSummary,
        codemapSummary,
        filesAffected,
        sessionId,
        cwd,
      ),
    };
  },
};
