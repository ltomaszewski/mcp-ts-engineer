/**
 * Commit prompt for audit-fix capability.
 * Instructs agent to stage and commit files changed during audit-fix
 * for a specific project with conventional commit format.
 */

import type { PromptVersion } from "../../../core/prompt/prompt.types.js";
import { getCommitTag } from "../../../config/constants.js";

interface CommitPromptInput {
  projectPath: string;
  filesChanged: string[];
  auditSummary: string;
  sessionId: string;
  cwd?: string;
}

const buildCommitUserPrompt = (
  projectPath: string,
  filesChanged: string[],
  auditSummary: string,
  sessionId: string,
  cwd?: string,
): string => {
  const filesChangedList = filesChanged.map((f) => `  - ${f}`).join("\n");
  const cwdContext = cwd ? `Working directory: ${cwd}\n\n` : "";

  // Extract scope from project path (e.g., "apps/my-server" -> "server")
  const scope = projectPath.split("/").pop() || projectPath;

  return `You are the Commit Agent for the audit-fix workflow.

${cwdContext}Project: ${projectPath}

Audit Summary:
${auditSummary}

Files changed during audit-fix:
${filesChangedList}

Your responsibilities:
1. Check git status to see what changes exist:
   - Run: git status
   - Identify modified, added, or deleted files

2. If changes exist, stage and commit them:
   - Stage relevant changes: git add <files>
   - Create a commit message following this format:
     "chore(${scope}): ${getCommitTag()} auto-fix audit violations"
   - If multiple types of fixes were applied, add a body with bullet points

3. If no changes exist:
   - Don't create an empty commit
   - Report that no commit was needed

4. Extract commit information:
   - Get commit SHA: git rev-parse HEAD
   - Record the commit message used

5. Output your results in this format:

<commit_result>
{
  "committed": <boolean>,
  "commit_sha": "<sha or null>",
  "commit_message": "<message or null>",
  "files_changed": ["file1.ts", "file2.ts"]
}
</commit_result>

Commit message guidelines:
- Use conventional commits format: "chore(<scope>): ${getCommitTag()} auto-fix audit violations"
- Keep the subject line under 72 characters
- Include body with bullet points if multiple types of changes
- Only commit files related to audit fixes, not unrelated changes
- After the commit body, add a blank line followed by: Session-Id: ${sessionId}

Git trailer format:
- Add a blank line after the commit body
- Add the Session-Id trailer: Session-Id: ${sessionId}
- This trailer enables tracing commits back to their cost report session

Your goal is to create a clean commit that captures audit-fix changes for ${projectPath}.`;
};

export const commitPromptV1: PromptVersion = {
  version: "v1",
  createdAt: "2026-02-01",
  description:
    "Commit step: commits audit-fix changes with conventional commit message",
  deprecated: false,
  sunsetDate: undefined,
  build: (input: unknown) => {
    const { projectPath, filesChanged, auditSummary, sessionId, cwd } =
      input as CommitPromptInput;
    return {
      systemPrompt: {
        type: "preset" as const,
        preset: "claude_code" as const,
      },
      userPrompt: buildCommitUserPrompt(
        projectPath,
        filesChanged,
        auditSummary,
        sessionId,
        cwd,
      ),
    };
  },
};
