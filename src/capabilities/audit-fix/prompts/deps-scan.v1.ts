/**
 * Deps scan prompt version v1.
 * Instructs agent to run npm audit --json and extract vulnerability severity breakdown.
 * Supports npm workspaces (monorepos) by checking for root package-lock.json.
 */

import type { PromptVersion } from "../../../core/prompt/prompt.types.js";

interface DepsScanPromptInput {
  projectPath: string;
  cwd?: string;
}

/**
 * Deps scan prompt: run npm audit --json and parse vulnerability counts.
 *
 * Checks for package-lock.json (at cwd for workspaces, or project root),
 * executes npm audit --json, and parses severity breakdown.
 */
const depsScanPromptV1: PromptVersion = {
  version: "v1",
  createdAt: "2026-02-04",
  description: "Deps scan step: npm audit with vulnerability severity breakdown",
  deprecated: false,
  sunsetDate: undefined,
  build: (input: unknown) => {
    const { projectPath, cwd } = input as DepsScanPromptInput;
    const rootPath = cwd || ".";

    const userPrompt = `You are executing a dependency security scan for a code quality audit.

<project_path>${projectPath}</project_path>
${cwd ? `<cwd>${cwd}</cwd>` : ""}

<workflow>
1. FIRST, check if package-lock.json exists at MONOREPO ROOT:
   \`\`\`bash
   ls -la ${rootPath}/package-lock.json
   \`\`\`

2. If package-lock.json EXISTS at root (step 1 succeeded):
   - This is a MONOREPO with npm workspaces
   - Run npm audit with --workspace flag:
   \`\`\`bash
   npm audit --workspace=${projectPath} --json 2>&1
   \`\`\`
   - Then SKIP to step 5 (parse output)

3. If package-lock.json does NOT exist at root, check project directory:
   \`\`\`bash
   ls -la ${projectPath}/package-lock.json
   \`\`\`

4. If package-lock.json exists in project (step 3 succeeded):
   - This is a STANDALONE project
   - Run npm audit from project directory:
   \`\`\`bash
   cd ${projectPath} && npm audit --json 2>&1
   \`\`\`

   If package-lock.json does NOT exist in EITHER location:
   - Return \`audit_ran: false\` immediately
   - Skip remaining steps

5. Parse the JSON output to extract vulnerability counts:
   - The output has a "metadata.vulnerabilities" object with severity breakdowns
   - Example structure:
     {
       "metadata": {
         "vulnerabilities": {
           "critical": 2,
           "high": 5,
           "moderate": 10,
           "low": 3,
           "total": 20
         }
       }
     }

6. Calculate total vulnerabilities (sum of all severity levels)

7. Return the structured result with full JSON for debugging
</workflow>

<output_format>
Return your findings in this JSON format wrapped in XML tags:

<deps_scan_result>
{
  "audit_ran": true,
  "vulnerabilities_found": 20,
  "vulnerabilities_by_severity": {
    "critical": 2,
    "high": 5,
    "moderate": 10,
    "low": 3
  },
  "audit_json": "{\\"metadata\\": {...}}"
}
</deps_scan_result>

If package-lock.json is missing in both locations or npm audit fails:
<deps_scan_result>
{
  "audit_ran": false,
  "vulnerabilities_found": 0,
  "vulnerabilities_by_severity": {
    "critical": 0,
    "high": 0,
    "moderate": 0,
    "low": 0
  },
  "audit_json": ""
}
</deps_scan_result>
</output_format>

<rules>
- ALWAYS check for package-lock.json at ROOT first (for npm workspaces/monorepos)
- If root has package-lock.json, use --workspace flag: npm audit --workspace=${projectPath}
- Only fallback to project-level package-lock.json for standalone projects
- npm audit --json returns JSON on stdout even if vulnerabilities are found
- Parse "metadata.vulnerabilities" object from JSON output for severity counts
- If npm audit returns non-zero exit code, it's OK - it means vulnerabilities were found
- If npm audit fails to run (command not found, corrupted lock file), set audit_ran: false
- Include the FULL npm audit JSON output in audit_json field (escape quotes properly)
- Total vulnerabilities = critical + high + moderate + low
</rules>`;

    return {
      systemPrompt: {
        type: "preset" as const,
        preset: "claude_code" as const,
        append:
          "REMINDER: After completing the deps scan, you MUST output <deps_scan_result>{...}</deps_scan_result> with your findings.",
      },
      userPrompt,
    };
  },
};

export { depsScanPromptV1 };
