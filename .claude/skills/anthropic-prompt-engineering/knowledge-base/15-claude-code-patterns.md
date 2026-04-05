# 15: Production Patterns from Claude Code Source

**Source**: Claude Code CLI source code (`packages/claude-code/src/`) — Anthropic's own production system
**Principle**: These patterns are battle-tested in Claude Code's production deployment, serving millions of users. They represent Anthropic's internal best practices for prompt engineering at scale.

> **Why this matters**: The official docs teach principles. This module teaches what Anthropic's own engineers actually built when those principles met production reality. Where they diverge, production won.

---

## Pattern 1: Array-Based Prompt Composition

Claude Code builds prompts as **ordered arrays of strings**, not concatenated blobs. Each section is independently computable, cacheable, and conditionally included.

### The Pattern

```typescript
// Each section is a function returning string | null
function getIntroSection(): string { ... }
function getSystemSection(): string { ... }
function getTaskSection(): string { ... }

// Assembly: filter nulls, join with double newlines
const prompt = [
  getIntroSection(),
  getSystemSection(),
  hasFeature ? getTaskSection() : null,
  getToolsSection(enabledTools),
].filter(s => s !== null)
```

### Conditional Inclusion via Null Filtering

```typescript
const items = [
  hasAgentTool ? getAgentToolSection() : null,
  hasSkills ? getSkillsSection() : null,
  isNonInteractive ? null : getInteractiveGuidance(),
  alwaysInclude,
].filter(item => item !== null)
```

### Why It Matters

- **Testability**: Each section tested independently
- **Cacheability**: Sections split at cache boundary markers
- **Composability**: Easy to add/remove sections without touching others
- **Conditional logic**: Features, tools, and environment drive inclusion

### Application to ts-engineer

Your `buildEngPromptV2()` and `buildAuditPromptV2()` already use a builder pattern. Adopt the null-filter array pattern for cleaner conditional composition:

```typescript
// Instead of string concatenation with if/else
const sections = [
  buildRoleSection(input),
  input.technologies.includes('react') ? buildReactRules() : null,
  input.technologies.includes('expo') ? buildExpoRules() : null,
  buildWorkflowSection(input.mode),
  buildOutputFormat(),
].filter(Boolean)

return { systemPrompt: preset, userPrompt: sections.join('\n\n') }
```

---

## Pattern 2: Redundant Reinforcement (Critical Behaviors)

**This contradicts the "remove redundancy" advice in 09-optimization.md.**

Claude Code deliberately repeats critical instructions at **three levels**. The "Don't use Bash for file operations" instruction appears in:

1. **System prompt** (`getUsingYourToolsSection`): "Do NOT use Bash when a dedicated tool is provided"
2. **Bash tool description** (`BashTool/prompt.ts`): "IMPORTANT: Avoid using this tool to run find, grep, cat..."
3. **Per-tool descriptions**: Each dedicated tool says "Use X instead of Y"

### When to Apply

Redundant reinforcement is for **behavioral compliance**, not information delivery:

| Use Redundancy | Don't Use Redundancy |
|---|---|
| Safety-critical behaviors (don't skip hooks) | Factual context (project description) |
| Tool preference steering (use Edit not sed) | Configuration details |
| Permission restrictions (read-only mode) | Examples and templates |
| Output format enforcement | Background information |

### The Rule

> If a single miss of an instruction causes a bad outcome (wrong tool, security violation, file corruption), state it at every level the model encounters.

### Application to ts-engineer

Your audit capability should reinforce "run commands, don't just read code" at:
1. The orchestrator prompt (system level)
2. The phase-specific audit prompt (user level)
3. The output format instructions (enforcement level)

---

## Pattern 3: Named Failure Modes & Anti-Rationalization

The verification agent prompt (`verificationAgent.ts`) is Claude Code's most sophisticated prompt engineering. It explicitly names the model's failure patterns and the exact rationalizations it uses to skip work.

### Technique: Name the Failure Modes

```
You have two documented failure patterns:
1. Verification avoidance: when faced with a check, you find reasons not 
   to run it — you read code, narrate what you would test, write "PASS," 
   and move on.
2. Being seduced by the first 80%: you see a polished UI or a passing test 
   suite and feel inclined to pass it, not noticing half the buttons do 
   nothing.
```

### Technique: Enumerate Rationalizations

```
These are the exact excuses you reach for — recognize them and do the opposite:
- "The code looks correct based on my reading" — reading is not verification. Run it.
- "The implementer's tests already pass" — the implementer is an LLM. Verify independently.
- "This is probably fine" — probably is not verified. Run it.
- "I don't have a browser" — did you check for browser tools? 
- "This would take too long" — not your call.
```

### Technique: Self-Monitoring Instruction

```
If you catch yourself writing an explanation instead of a command, stop. 
Run the command.
```

### Why This Works

Claude models have consistent failure modes that are predictable. By naming them explicitly, you activate the model's self-monitoring capability — it becomes harder to fall into a pattern you've been told to watch for.

### Application to ts-engineer

For your `audit-prompt.v2.ts`, add failure mode naming:

```
You have three documented failure patterns:
1. Surface-level scanning: You read file names and function signatures 
   without reading implementations, then report "no issues found."
2. Config-file blindness: You skip tsconfig.json, biome.json, and 
   package.json where most build issues originate.
3. Premature pass: You find one issue, fix it, and declare the audit 
   complete without checking for related issues.
```

---

## Pattern 4: Permission Restriction Hierarchy

For read-only agents (explore, plan, verify), Claude Code uses a specific escalation pattern:

### The Pattern

```
=== CRITICAL: READ-ONLY MODE - NO FILE MODIFICATIONS ===
This is a READ-ONLY [task type]. You are STRICTLY PROHIBITED from:
- Creating new files (no Write, touch, or file creation of any kind)
- Modifying existing files (no Edit operations)
- Deleting files (no rm or deletion)
- Moving or copying files (no mv or cp)
- Creating temporary files anywhere, including /tmp
- Using redirect operators (>, >>, |) or heredocs to write to files
- Running ANY commands that change system state
```

### Key Design Choices

1. **ALL CAPS header** — first thing the model sees
2. **Exhaustive enumeration** — lists every prohibited action, not just categories
3. **Tool names included** — "no Write, touch, or file creation" connects to actual tools
4. **Repeated at end** — "REMEMBER: You can ONLY explore and plan. You CANNOT and MUST NOT write, edit, or modify any files."
5. **Backed by `disallowedTools`** — prompt is reinforced by actual tool filtering

### Why Exhaustive Enumeration

Generic restrictions like "don't modify files" leave loopholes. The model might reason that "creating a temp file isn't really modifying." Enumeration closes loopholes.

### Application to ts-engineer

When your capabilities spawn sub-agents with restricted permissions:
- Lead with ALL CAPS restriction block
- Enumerate every prohibited action with tool names
- Repeat the restriction at the end of the prompt
- Back it up with actual tool filtering in the capability definition

---

## Pattern 5: Coordinator Synthesis ("Never Delegate Understanding")

The coordinator mode prompt (`coordinatorMode.ts`) introduces the most important multi-agent principle.

### The Rule

> **Never write "based on your findings" or "based on the research."** These phrases delegate understanding to the worker instead of doing it yourself.

### Anti-Pattern vs. Pattern

```
// ANTI-PATTERN — lazy delegation
"Based on your findings, fix the auth bug"
"The worker found an issue in the auth module. Please fix it."

// PATTERN — synthesized spec
"Fix the null pointer in src/auth/validate.ts:42. The user field on 
Session (src/auth/types.ts:15) is undefined when sessions expire but 
the token remains cached. Add a null check before user.id access — 
if null, return 401 with 'Session expired'."
```

### The Coordinator's Job

After research workers complete:
1. **Read** the findings
2. **Understand** the problem (identify root cause, file paths, line numbers)
3. **Synthesize** into a specific, self-contained spec
4. **Decide** whether to continue the worker or spawn fresh

### Purpose Statements

Include WHY the output is needed so workers calibrate depth:

```
"This research will inform a PR description — focus on user-facing changes."
"I need this to plan an implementation — report file paths, line numbers, 
and type signatures."
"This is a quick check before merge — just verify the happy path."
```

### Continue vs. Spawn Decision Matrix

| Situation | Action | Why |
|---|---|---|
| Research explored the exact files to edit | Continue | Context overlap is high |
| Research was broad, implementation is narrow | Spawn fresh | Avoid dragging exploration noise |
| Correcting a failure | Continue | Worker has error context |
| Verifying another worker's code | Spawn fresh | Verifier needs fresh eyes |
| Wrong approach entirely | Spawn fresh | Wrong-approach context anchors the retry |

### Application to ts-engineer

Your `todo_code_writer` phases should:
1. After each phase completes, the orchestrator synthesizes findings before starting the next phase
2. Include purpose statements: "This phase audit will determine if the implementation matches the spec — focus on behavioral correctness, not style"
3. Use the continue vs. spawn matrix when deciding phase transitions

---

## Pattern 6: Quantitative Length Anchors

Claude Code discovered that **numeric limits outperform qualitative instructions**.

### The Evidence

From `prompts.ts`:
```
Length limits: keep text between tool calls to ≤25 words. 
Keep final responses to ≤100 words unless the task requires more detail.
```

Comment in source: "research shows ~1.2% output token reduction vs qualitative 'be concise'"

### Qualitative vs. Quantitative

| Qualitative (weaker) | Quantitative (stronger) |
|---|---|
| "Be concise" | "≤25 words between tool calls" |
| "Keep responses brief" | "≤100 words for final responses" |
| "Don't be verbose" | "≤3 sentences per status update" |

### When to Use

- Status updates between tool calls → word limits
- Final summaries → word or sentence limits
- Structured outputs → field-level limits ("≤50 chars for title")
- Audit findings → "≤3 sentences per finding"

### Application to ts-engineer

In your engineering prompts, replace "be concise in commit messages" with "commit messages: ≤72 chars for title, ≤3 lines for body." In audit prompts, replace "brief findings" with "≤3 sentences per finding, ≤1 sentence for severity justification."

---

## Pattern 7: Mechanical Verdict Strings

Claude Code enforces parseable output by specifying exact mechanical strings.

### The Pattern

```
End with exactly this line (parsed by caller):

VERDICT: PASS
or
VERDICT: FAIL
or
VERDICT: PARTIAL

Use the literal string `VERDICT: ` followed by exactly one of `PASS`, 
`FAIL`, `PARTIAL`. No markdown bold, no punctuation, no variation.
```

### Why "No Variation" Matters

Without explicit prohibition, the model will produce:
- `**VERDICT**: PASS` (markdown bold)
- `Verdict: PASS` (different case)
- `VERDICT: PASS!` (punctuation)
- `VERDICT: PASS (with caveats)` (extra text)

Each variation breaks downstream parsing.

### Structured Evidence Format

```
### Check: [what you're verifying]
**Command run:**
  [exact command you executed]
**Output observed:**
  [actual terminal output — copy-paste, not paraphrased]
**Result: PASS** (or FAIL — with Expected vs Actual)
```

### Application to ts-engineer

Your audit capability's decision output should use mechanical strings:
```
End your assessment with exactly one of:
DECISION: pass
DECISION: warn
DECISION: fail

No markdown, no punctuation, no variation. This is parsed programmatically.
```

---

## Pattern 8: Tool Descriptions as Behavioral Guides

**This updates the "3-4 sentences minimum" guidance in 06-tool-use.md.**

In production, Claude Code's tool descriptions are **comprehensive behavioral guides**, not minimal schema documentation.

### Scale Comparison

| Tool | Description Length | Content |
|---|---|---|
| Bash | 366 lines | Full commit workflow, PR workflow, sandbox config, sleep anti-patterns |
| Read | 48 lines | Every file type, line format, edge cases, directory handling |
| Agent | 200+ lines | Agent listing, fork semantics, writing prompt guidance, examples |

### What Production Tool Descriptions Include

1. **What it does** — core functionality
2. **What it supports** — file types, formats, parameters
3. **How to use it** — step-by-step workflows with examples
4. **What NOT to do** — anti-patterns with concrete bad examples
5. **When to use alternatives** — "Use X instead of Y for Z"
6. **Edge cases** — empty files, large files, permissions
7. **Complete workflows** — the Bash tool includes a full 40-line git commit workflow

### The Principle

> For complex tools, the description IS the prompt. The model's tool choice quality correlates directly with description quality.

### When Short vs. Long

| Short (3-5 sentences) | Long (50+ lines) |
|---|---|
| Simple CRUD operations | Tools with complex workflows |
| Clear, unambiguous tools | Tools with many anti-patterns |
| Tools used in obvious ways | Tools where misuse is common |

### Application to ts-engineer

When your capabilities expose tools to Claude via the Agent SDK, invest heavily in tool descriptions for complex tools. Include workflows, anti-patterns, and alternative tool suggestions.

---

## Pattern 9: Good/Bad Example Pairing

Claude Code systematically pairs bad examples with good ones, always showing the bad first.

### The Pattern

```
Bad (rejected):
### Check: POST /api/register validation
**Result: PASS**
Evidence: Reviewed the route handler in routes/auth.py. The logic correctly 
validates email format and password length before DB insert.
(No command run. Reading code is not verification.)

Good:
### Check: POST /api/register rejects short password
**Command run:**
  curl -s -X POST localhost:8000/api/register ...
**Output observed:**
  {"error": "password must be at least 8 characters"}
**Expected vs Actual:** Expected 400 with password-length error. Got exactly that.
**Result: PASS**
```

### Key Design Choices

1. **Bad example first** — establishes what to avoid before showing the target
2. **Labeled explicitly** — "Bad (rejected)" and "Good" — no ambiguity
3. **Parenthetical explanation** — "(No command run. Reading code is not verification.)"
4. **Realistic examples** — actual file paths, curl commands, JSON responses
5. **Same scenario** — both examples address the same task for direct comparison

### When to Use

- Complex output formats where the model might shortcut
- Behavioral instructions where "don't do X" is clearer than "do Y"
- Any instruction with a predictable failure mode

---

## Pattern 10: Two-Channel Context Injection

Claude Code injects context through two separate channels, each optimized for different content.

### Channel 1: System Prompt (Behavioral Instructions)

Array of strings → API `system` field. Contains:
- Identity and role
- Rules and constraints
- Tool guidance
- Memory instructions
- Output style

**Caching**: Static sections globally cached. Dynamic sections per-session.

### Channel 2: User Context (Factual State)

Synthetic user message with `<system-reminder>` tags. Contains:
- Git status (branch, recent commits)
- Current date
- CLAUDE.md content
- MCP server instructions (delta mode)

**Why separate**: Factual state changes every turn. Behavioral instructions don't. Separation prevents factual changes from invalidating the behavioral prompt cache.

### The Pattern

```typescript
// System prompt: HOW to behave (cached)
const systemPrompt = [
  getIdentity(),
  getRules(),
  getToolGuidance(),
  getMemoryInstructions(),
]

// User context: WHAT is true now (not cached)
const userContext = {
  gitStatus: await getGitStatus(),
  currentDate: new Date().toISOString(),
  claudeMd: await loadClaudeMds(),
}

// Injected as synthetic user message with <system-reminder> tags
prependUserContext(messages, userContext)
```

### Application to ts-engineer

When building multi-turn capability prompts:
- Put behavioral instructions (coding rules, output format, constraints) in the system prompt
- Put factual context (spec content, file contents, project state) in user messages
- This maximizes cache hits for the behavioral part

---

## Pattern 11: Memory Engineering (Four-Type Taxonomy)

Claude Code constrains its memory system to exactly four types, with explicit exclusion rules.

### The Taxonomy

| Type | Content | Example |
|---|---|---|
| `user` | Role, goals, preferences | "Senior Go dev, new to React" |
| `feedback` | Corrections AND confirmations | "Don't mock the DB in tests" |
| `project` | Non-derivable context | "Merge freeze after March 5" |
| `reference` | External system pointers | "Bugs tracked in Linear INGEST" |

### Critical: What NOT to Store

- Code patterns/architecture (derivable from code)
- Git history (use `git log`)
- Debugging solutions (fix is in the code)
- CLAUDE.md content (already loaded)
- Ephemeral task details

> "These exclusions apply even when the user explicitly asks. If they ask to save a PR list, ask what was *surprising* about it — that is the part worth keeping."

### Memory Verification Before Use

```
"The memory says X exists" is not the same as "X exists now."

Before recommending from memory:
- If the memory names a file path: check the file exists
- If the memory names a function or flag: grep for it
- If the user is about to act on your recommendation: verify first
```

### Structured Format

```markdown
---
name: {{memory name}}
description: {{one-line — used for relevance matching}}
type: {{user | feedback | project | reference}}
---

{{content — for feedback/project: rule/fact, then **Why:** and **How to apply:**}}
```

### Feedback Captures Both Corrections AND Confirmations

> "Record from failure AND success: if you only save corrections, you will avoid past mistakes but drift away from approaches the user has already validated, and may grow overly cautious."

---

## Pattern 12: Static/Dynamic Prompt Boundary

Claude Code places a boundary marker in the system prompt array that separates globally-cacheable content from session-specific content.

### The Architecture

```
[Static sections — scope: 'global']
  Identity, rules, tool guidance, style, output efficiency
  
__SYSTEM_PROMPT_DYNAMIC_BOUNDARY__

[Dynamic sections — scope: null (not cached)]
  Session guidance, memory, env info, MCP instructions
```

### Section Cache Management

```typescript
// Computed once, cached until /clear or /compact
systemPromptSection(name, computeFn)

// Recomputes every turn — requires justification
DANGEROUS_uncachedSystemPromptSection(name, computeFn, reason)
```

The `_reason` parameter is documentation-as-code. Only ONE section in all of Claude Code uses the dangerous variant (MCP instructions, because servers connect/disconnect).

### Application to ts-engineer

Your `SystemPromptValue` with `preset: 'claude_code'` already leverages the static portion. The `append` field goes into the dynamic section. Minimize what you put in `append` — anything static should be in the system prompt preset where it benefits from caching.

---

## Pattern 13: Hierarchical Bullet Composition

Claude Code uses a specific function for building structured content:

```typescript
function prependBullets(items: Array<string | string[]>): string[] {
  return items.flatMap(item =>
    Array.isArray(item)
      ? item.map(subitem => `  - ${subitem}`)
      : [` - ${item}`],
  )
}
```

### Usage Pattern

```typescript
const section = [
  '# Section Header',
  ...prependBullets([
    'Top-level instruction',
    [ // Nested as sub-items
      'Sub-instruction A',
      'Sub-instruction B',
    ],
    'Another top-level instruction',
  ]),
].join('\n')
```

### Produces

```
# Section Header
 - Top-level instruction
  - Sub-instruction A
  - Sub-instruction B
 - Another top-level instruction
```

### Why This Structure

- Markdown-compatible but compact
- Hierarchy communicates priority
- Sub-items qualify or elaborate parent items
- Easy to scan for top-level rules

---

## Pattern 14: Agent-Specific Prompt Configurations

Claude Code defines agents with specific prompt engineering configurations:

### Configuration Matrix

| Agent | Model | CLAUDE.md | System Prompt Style | Tools |
|---|---|---|---|---|
| Explore | haiku (external) / inherit (internal) | Omitted (saves tokens) | Speed-optimized, READ-ONLY | Read-only subset |
| Plan | inherit | Omitted | Architecture-focused, READ-ONLY | Read-only subset |
| Verification | inherit | Included | Adversarial, anti-rationalization | Read-only + temp scripts |
| General | default subagent model | Included | Concise task completion | All tools |

### Key Design Decisions

1. **`omitClaudeMd: true`** for read-only agents — they can Read CLAUDE.md if needed, but not loading it saves tokens
2. **Model selection per agent** — fast agents use Haiku, critical agents inherit the main model
3. **Tool filtering via `disallowedTools`** — prompt restrictions backed by actual tool removal
4. **`criticalSystemReminder_EXPERIMENTAL`** on verification agent — extra reinforcement injected as system reminder

### The Principle

> Each agent type is a prompt engineering microenvironment. Model, available tools, loaded context, and system prompt all work together. Optimizing one without the others is incomplete.

---

## Validation Checklist

For prompts informed by Claude Code production patterns:

- [ ] Prompt uses array composition with null filtering for conditional sections
- [ ] Critical behavioral instructions repeated at 2-3 levels (redundant reinforcement)
- [ ] Failure modes named explicitly with rationalization callouts
- [ ] Read-only restrictions use ALL CAPS header + exhaustive enumeration
- [ ] Multi-agent prompts include synthesized specs, not "based on findings"
- [ ] Worker prompts include purpose statements ("this research will inform...")
- [ ] Length limits are quantitative, not qualitative
- [ ] Parseable outputs use mechanical verdict strings with "no variation" clause
- [ ] Complex tool descriptions are behavioral guides (50+ lines), not minimal schemas
- [ ] Examples use bad/good pairs with labeled explanations
- [ ] Behavioral instructions in system prompt, factual state in user messages
- [ ] Static content before cache boundary, dynamic after
- [ ] Memory stores only non-derivable information (four-type taxonomy)
- [ ] Agent configurations align model, tools, context loading, and prompt style

---

**Source**: Claude Code CLI source code analysis (2026-04-05). Files: `src/constants/prompts.ts`, `src/coordinator/coordinatorMode.ts`, `src/tools/AgentTool/built-in/verificationAgent.ts`, `src/tools/AgentTool/built-in/exploreAgent.ts`, `src/tools/BashTool/prompt.ts`, `src/memdir/memdir.ts`, `src/memdir/memoryTypes.ts`, `src/constants/systemPromptSections.ts`, `src/utils/systemPrompt.ts`

**Previous**: [14-claude-md.md](14-claude-md.md) - CLAUDE.md architecture, @include, memory
