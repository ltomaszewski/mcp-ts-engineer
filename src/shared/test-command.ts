/**
 * Shared test command builder.
 * Single source of truth for the --outputFile JSON approach used across all prompts.
 * Eliminates stdout parsing issues (truncation, ANSI codes, Jest output quirks).
 */

const DEFAULT_OUTPUT_FILE = '/tmp/test-results.json'

/**
 * Python one-liner that reads the JSON output file and prints a structured summary.
 * Same schema used everywhere: numFailedTests, numPassedTests, numTotalTests, etc.
 */
function buildPythonExtract(outputFile: string): string {
  return `python3 -c "import json; d=json.load(open('${outputFile}')); print(json.dumps({'numFailedTests':d['numFailedTests'],'numPassedTests':d['numPassedTests'],'numTotalTests':d['numTotalTests'],'numFailedTestSuites':d['numFailedTestSuites'],'numTotalTestSuites':d['numTotalTestSuites']}))"`
}

/**
 * Build the exact test command for a workspace based on runner type.
 *
 * Jest:   npm test -- --forceExit --json --outputFile=... 2>/dev/null; python3 ...
 * Vitest: npx vitest run --reporter=json --outputFile=... 2>/dev/null; python3 ...
 *
 * The python3 one-liner outputs JSON: {"numFailedTests":0,"numPassedTests":42,...}
 * Determine pass/fail from numFailedTests === 0. NEVER use the success field.
 */
export function buildTestCommand(
  runner: 'jest' | 'vitest',
  outputFile: string = DEFAULT_OUTPUT_FILE,
): string {
  const extract = buildPythonExtract(outputFile)
  if (runner === 'jest') {
    return `npm test -- --forceExit --json --outputFile=${outputFile} 2>/dev/null; ${extract}`
  }
  return `npx vitest run --reporter=json --outputFile=${outputFile} 2>/dev/null; ${extract}`
}

/**
 * Standard inline test instruction block for embedding in agent prompts.
 * Instructs the agent to detect runner, run ONCE, and parse JSON output.
 *
 * @param jestPrefix  - Optional shell prefix before the Jest command (e.g. "cd /path &&")
 * @param vitestPrefix - Optional shell prefix before the Vitest command
 */
export function buildTestInstruction(
  jestPrefix = '',
  vitestPrefix = '',
  outputFile: string = DEFAULT_OUTPUT_FILE,
): string {
  const jestCmd = buildTestCommand('jest', outputFile)
  const vitestCmd = buildTestCommand('vitest', outputFile)
  const jestFull = jestPrefix ? `${jestPrefix} ${jestCmd}` : jestCmd
  const vitestFull = vitestPrefix ? `${vitestPrefix} ${vitestCmd}` : vitestCmd

  return `**Detect test runner** from package.json devDependencies:
- Has "jest" or "jest-expo" → Jest runner
- Has "vitest" → Vitest runner

Run tests ONCE (single Bash call, NEVER re-run):
- Jest: ${jestFull}
- Vitest: ${vitestFull}

RULES: Run ONCE. NEVER re-run. NEVER parse stdout. Determine pass/fail from numFailedTests === 0. NEVER use the success field.`
}
