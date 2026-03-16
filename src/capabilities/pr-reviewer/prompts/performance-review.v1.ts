/**
 * Performance review prompt templates.
 */

import type { PromptRegistry, PromptVersion } from '../../../core/prompt/prompt.types.js'

const PERFORMANCE_REVIEW_V1_TEMPLATE = (
  diff: string,
  files: string[],
  repoName: string,
): string => {
  return `# Performance Review Task

You are conducting a performance review for repository ${repoName}.

## Files Changed
${files.map((f) => `- ${f}`).join('\n')}

## Your Task
Analyze the following diff and identify performance issues:
1. **N+1 queries**: Database queries inside loops, missing batch loading
2. **Unnecessary re-renders**: Missing React.memo, useCallback, useMemo
3. **Large bundles**: Importing entire libraries when only one function needed
4. **Blocking operations**: Synchronous operations in async context, no pagination
5. **Memory leaks**: Event listeners not cleaned up, unclosed connections
6. **Inefficient algorithms**: O(n²) loops, redundant iterations

## Diff
\`\`\`diff
${diff}
\`\`\`

## Output Format
Return a JSON object with this structure:
\`\`\`json
{
  "issues": [
    {
      "severity": "CRITICAL | HIGH | MEDIUM | LOW",
      "title": "Short issue title",
      "file_path": "path/to/file.ts",
      "line": 42,
      "details": "Detailed explanation",
      "suggestion": "How to fix",
      "auto_fixable": false,
      "confidence": 80
    }
  ]
}
\`\`\`

Focus on actionable feedback with clear remediation steps.
`
}

const PERFORMANCE_REVIEW_V2_TEMPLATE = (
  diff: string,
  files: string[],
  repoName: string,
  projectContext?: string,
): string => {
  const contextSection = projectContext
    ? `<project_rules>\n${projectContext}\n</project_rules>\n`
    : ''

  return `<diff>
${diff}
</diff>

<context>
<repository>${repoName}</repository>
${contextSection}<files_changed>
${files.map((f) => `- ${f}`).join('\n')}
</files_changed>
</context>

<instructions>
Identify performance issues:
1. **N+1 queries**: Database queries inside loops, missing batch loading
2. **Unnecessary re-renders**: Missing React.memo, useCallback, useMemo
3. **Large bundles**: Importing entire libraries when only one function needed
4. **Blocking operations**: Synchronous operations in async context, no pagination
5. **Memory leaks**: Event listeners not cleaned up, unclosed connections
6. **Inefficient algorithms**: O(n²) loops, redundant iterations
</instructions>

<output_format>
Return JSON:
\`\`\`json
{
  "issues": [
    {
      "severity": "CRITICAL | HIGH | MEDIUM | LOW",
      "title": "Short issue title",
      "file_path": "path/to/file.ts",
      "line": 42,
      "details": "Detailed explanation",
      "suggestion": "How to fix",
      "auto_fixable": false,
      "confidence": 80
    }
  ]
}
\`\`\`
</output_format>

Focus on actionable feedback with clear remediation steps.
`
}

const v1: PromptVersion = {
  version: 'v1',
  createdAt: '2026-02-14',
  description: 'Performance review focused on N+1 queries, re-renders, and large bundles',
  deprecated: true,
  sunsetDate: '2026-03-15',
  build: (input: unknown) => {
    const data = input as { diff: string; files: string[]; repoName: string }
    return {
      systemPrompt: { type: 'preset' as const, preset: 'claude_code' as const },
      userPrompt: PERFORMANCE_REVIEW_V1_TEMPLATE(data.diff, data.files, data.repoName),
    }
  },
}

const v2: PromptVersion = {
  version: 'v2',
  createdAt: '2026-02-24',
  description: 'XML-structured performance review with diff-first and project context',
  deprecated: true,
  sunsetDate: '2026-04-15',
  build: (input: unknown) => {
    const data = input as {
      diff: string
      files: string[]
      repoName: string
      projectContext?: string
    }
    return {
      systemPrompt: { type: 'preset' as const, preset: 'claude_code' as const },
      userPrompt: PERFORMANCE_REVIEW_V2_TEMPLATE(
        data.diff,
        data.files,
        data.repoName,
        data.projectContext,
      ),
    }
  },
}

const PERFORMANCE_REVIEW_V3_TEMPLATE = (
  diff: string,
  files: string[],
  repoName: string,
  projectContext?: string,
  reactHooksRules?: string,
): string => {
  const contextSection = projectContext
    ? `<project_rules>\n${projectContext}\n</project_rules>\n`
    : ''

  const engRulesSection = reactHooksRules
    ? `<eng_rules>\n${reactHooksRules}\n</eng_rules>\n`
    : ''

  const reactInstructions = reactHooksRules
    ? `2. **React hook dependency correctness** (apply rules from <eng_rules>):
   - Unstable references in useCallback/useMemo/useEffect dependency arrays
   - Entire custom hook return objects used as dependencies instead of individual properties
   - Inline objects/arrays used as hook dependencies
   - Props defeating React.memo because callback/object creates new reference each render
   - Default parameter values that are object/array literals (new ref per render)
   - Custom hook return values not wrapped in useMemo when consumers depend on them`
    : '2. **Unnecessary re-renders**: Missing React.memo, useCallback, useMemo'

  return `<diff>
${diff}
</diff>

<context>
<repository>${repoName}</repository>
${contextSection}${engRulesSection}<files_changed>
${files.map((f) => `- ${f}`).join('\n')}
</files_changed>
</context>

<instructions>
Identify performance issues:
1. **N+1 queries**: Database queries inside loops, missing batch loading
${reactInstructions}
3. **Large bundles**: Importing entire libraries when only one function needed
4. **Blocking operations**: Synchronous operations in async context, no pagination
5. **Memory leaks**: Event listeners not cleaned up, unclosed connections
6. **Inefficient algorithms**: O(n²) loops, redundant iterations
${reactHooksRules ? '\nWhen <eng_rules> is provided, apply every ALWAYS/NEVER rule and check each item in the Audit Checklist against the diff. Report violations as issues.' : ''}
</instructions>

<examples>
<example>
<title>Unstable hook return in useCallback dependency</title>
<bad_code>
const feedback = useSleepScoreFeedback(); // returns new object each render
const handleSaved = useCallback((result) => {
  feedback.showFeedback(result);
}, [feedback]); // feedback is new object every render — useCallback is useless
</bad_code>
<good_code>
const feedback = useSleepScoreFeedback();
const handleSaved = useCallback((result) => {
  feedback.showFeedback(result);
}, [feedback.showFeedback]); // showFeedback is a stable useCallback ref
</good_code>
<severity>MEDIUM</severity>
<explanation>The hook returns a plain object literal, creating a new reference every render. Using the entire object as a dependency defeats useCallback — the callback is recreated on every render. Destructure to the specific stable function.</explanation>
</example>
<example>
<title>Inline object prop defeats React.memo</title>
<bad_code>
// Parent component
return &lt;MemoizedChild style={{ color: 'red' }} onPress={() => doSomething(id)} /&gt;
</bad_code>
<good_code>
const style = useMemo(() => ({ color: 'red' }), []);
const handlePress = useCallback(() => doSomething(id), [id]);
return &lt;MemoizedChild style={style} onPress={handlePress} /&gt;
</good_code>
<severity>LOW</severity>
<explanation>Inline objects and arrow functions create new references each render, causing React.memo children to re-render unnecessarily.</explanation>
</example>
</examples>

<output_format>
Return JSON:
\`\`\`json
{
  "issues": [
    {
      "severity": "CRITICAL | HIGH | MEDIUM | LOW",
      "title": "Short issue title",
      "file_path": "path/to/file.ts",
      "line": 42,
      "details": "Detailed explanation",
      "suggestion": "How to fix",
      "auto_fixable": false,
      "confidence": 80
    }
  ]
}
\`\`\`
</output_format>

Focus on actionable feedback with clear remediation steps.
`
}

const v3: PromptVersion = {
  version: 'v3',
  createdAt: '2026-03-16',
  description:
    'React-aware performance review with conditional eng-rules injection and examples',
  deprecated: false,
  sunsetDate: undefined,
  build: (input: unknown) => {
    const data = input as {
      diff: string
      files: string[]
      repoName: string
      projectContext?: string
      reactHooksRules?: string
    }
    return {
      systemPrompt: { type: 'preset' as const, preset: 'claude_code' as const },
      userPrompt: PERFORMANCE_REVIEW_V3_TEMPLATE(
        data.diff,
        data.files,
        data.repoName,
        data.projectContext,
        data.reactHooksRules,
      ),
    }
  },
}

export const PERFORMANCE_REVIEW_VERSIONS: PromptRegistry = { v1, v2, v3 }

export const PERFORMANCE_REVIEW_CURRENT_VERSION = 'v3'
