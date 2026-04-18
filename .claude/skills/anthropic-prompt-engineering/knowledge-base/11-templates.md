# 11: Templates for Claude Code

**Purpose**: Ready-to-use prompt templates for skills, commands, and agents.
**Principle**: Consistent patterns produce consistent results.

---

## Template Categories

1. **Skill Templates** - Knowledge-base-backed capabilities
2. **Command Templates** - User-invokable workflows
3. **Agent Templates** - Autonomous task executors

---

## Skill Templates

### Basic Skill Template

```markdown
---
name: my-skill
description: "Brief description of what this skill provides."
when_to_use: "Use when user asks about [topic], mentions [keyword], or says [phrase]."
---

# [Skill Name]

## Core Knowledge

### [Topic 1]
[Authoritative information]

### [Topic 2]
[Authoritative information]

## Patterns

### [Pattern Name]
```[language]
[Code example]
```

**When to use**: [Context]
**Why**: [Rationale]

## Anti-Patterns

### [Anti-Pattern Name]
```[language]
// DON'T do this
[Bad example]

// DO this instead
[Good example]
```

## Quick Reference

| Concept | Usage | Example |
|---------|-------|---------|
| [Concept 1] | [How to use] | [Example] |
| [Concept 2] | [How to use] | [Example] |
```

### Library/Framework Skill Template

```markdown
# [Library Name] Skill

**Version**: [X.Y.Z]
**Source**: [Official docs URL]

## Installation

```bash
npm install [package-name]
```

## Core Concepts

### [Concept 1]
[Explanation with code example]

### [Concept 2]
[Explanation with code example]

## Common Patterns

### [Pattern 1]: [Name]
```[language]
[Implementation]
```

### [Pattern 2]: [Name]
```[language]
[Implementation]
```

## Configuration

### Required Setup
```[language]
[Configuration code]
```

### Optional Settings
| Setting | Default | Description |
|---------|---------|-------------|
| [setting1] | [value] | [desc] |

## Error Handling

### [Error Type 1]
**Cause**: [Why it happens]
**Solution**: [How to fix]

## Testing

### Test Setup
```[language]
[Test configuration]
```

### Test Example
```[language]
[Test code]
```
```

---

## Command Templates

### Basic Command Template

```markdown
# /[command-name]

[One-line description]

## Workflow

1. [Step 1]
2. [Step 2]
3. [Step 3]

## Usage

```
/[command-name] [arguments]
```

## Arguments

| Argument | Required | Description |
|----------|----------|-------------|
| [arg1] | Yes/No | [Description] |

## Examples

### Example 1: [Scenario]
```
/[command-name] [specific-args]
```
Result: [What happens]

## Behavior

### On Success
[What the command does when successful]

### On Failure
[How errors are handled]

## Related Commands
- /[related-command-1]
- /[related-command-2]
```

### Complex Workflow Command Template

```markdown
# /[command-name]

[Description of the multi-step workflow]

## Prerequisites

- [Prerequisite 1]
- [Prerequisite 2]

## Workflow Steps

### Step 1: [Name]
[Description]
**Tools Used**: [tool1], [tool2]
**Output**: [What is produced]

### Step 2: [Name]
[Description]
**Input**: [From previous step]
**Output**: [What is produced]

### Step 3: [Name]
[Description]
**Verification**: [How success is confirmed]

## Decision Points

### [Decision 1]
**If** [condition]: [action]
**Else**: [alternative action]

## Error Recovery

### [Error Scenario 1]
**Symptom**: [What you see]
**Recovery**: [How to fix]

## Output Format

[Specification of final output]

## Examples

### Example 1: [Happy Path]
```
Input: [Example input]
Output: [Example output]
```

### Example 2: [Edge Case]
```
Input: [Example input]
Handling: [How it's handled]
```
```

---

## Agent Templates

### Task-Specific Agent Template

```markdown
# [Agent Name] Agent

## Identity

You are [AGENT_NAME], an autonomous agent specialized in [DOMAIN].

## Capabilities

- [Capability 1]
- [Capability 2]
- [Capability 3]

## Available Tools

| Tool | Purpose | When to Use |
|------|---------|-------------|
| [tool1] | [purpose] | [trigger] |
| [tool2] | [purpose] | [trigger] |

## Workflow

### Task Reception
1. Parse the user's request
2. Identify the type of task
3. Create execution plan

### Execution
1. [Step 1]
2. [Step 2]
3. [Step 3]

### Verification
1. Check that output meets requirements
2. Validate against expected format
3. Report completion or issues

## Core Behaviors

### ALWAYS
- [Required behavior 1]
- [Required behavior 2]

### NEVER
- [Prohibited behavior 1]
- [Prohibited behavior 2]

## Error Handling

When an error occurs:
1. Report the error clearly
2. Analyze the likely cause
3. Attempt ONE fix
4. If 3 attempts fail, stop and ask user

## Stopping Conditions

STOP and ask the user when:
- [Condition 1]
- [Condition 2]
- [Condition 3]

## Output Format

[Specification of how to report results]
```

### Iterative Executor Agent Template

```markdown
# [Agent Name] Executor

## Purpose

Execute [TASK_TYPE] iteratively until completion or max iterations.

## Iteration Model

```
for iteration in range(max_iterations):
    1. Assess current state
    2. Determine next action
    3. Execute action
    4. Verify result
    5. If complete: break
    6. If blocked: escalate
```

## State Assessment

At each iteration, evaluate:
- [ ] Task requirements met?
- [ ] Any errors present?
- [ ] Blockers identified?
- [ ] Progress since last iteration?

## Completion Signals

### SUCCESS (stop iterating)
- [Success criterion 1]
- [Success criterion 2]

### BLOCKED (escalate)
- [Blocker type 1]
- [Blocker type 2]

### CONTINUE (next iteration)
- [Continue condition 1]
- [Continue condition 2]

## Iteration Limits

| Scenario | Max Iterations | Rationale |
|----------|----------------|-----------|
| [Scenario 1] | [N] | [Why] |
| [Scenario 2] | [N] | [Why] |

## Output Per Iteration

```
Iteration [N]:
- Action: [What was done]
- Result: [What happened]
- Status: [SUCCESS/CONTINUE/BLOCKED]
- Next: [What's next]
```

## Final Output

```
Execution Summary:
- Total Iterations: [N]
- Final Status: [SUCCESS/BLOCKED/MAX_REACHED]
- Changes Made: [List]
- Issues: [Any remaining issues]
```
```

---

## System Prompt Templates

### Minimal System Prompt

```
You are [ROLE]. [One sentence about capabilities].

Rules:
- [Rule 1]
- [Rule 2]
- [Rule 3]
```

### Standard System Prompt

```
You are [ROLE] for [CONTEXT].

## Capabilities
- [Capability 1]
- [Capability 2]

## Constraints
- NEVER [prohibited action]
- ALWAYS [required action]

## Output
[Format specification]
```

### Full System Prompt

```
# Identity

You are [AGENT_NAME], [role description].

## Expertise
- [Skill 1]
- [Skill 2]

## Context
[Background information about the environment]

# Capabilities

## Tools
[List of available tools with brief descriptions]

## Actions
[What you can do]

# Behaviors

## Required (ALWAYS)
- [Behavior 1]
- [Behavior 2]

## Prohibited (NEVER)
- [Behavior 1]
- [Behavior 2]

# Workflow

## For [Task Type 1]
1. [Step 1]
2. [Step 2]
3. [Step 3]

## For [Task Type 2]
1. [Step 1]
2. [Step 2]

# Error Handling

When errors occur:
1. [Step 1]
2. [Step 2]

When blocked:
1. [Step 1]
2. [Step 2]

# Communication

## Progress Updates
[How to report progress]

## Asking for Help
[When and how to ask user]

# Output Format

[Specification for responses]
```

---

## Tool Definition Template

```json
{
  "name": "[verb]_[noun]",
  "description": "[What the tool does]. [When to use it]. [What it returns]. [Any limitations or caveats]. Use this tool when [specific trigger conditions].",
  "input_schema": {
    "type": "object",
    "properties": {
      "[param1]": {
        "type": "[type]",
        "description": "[What this parameter means]. [Format requirements]. Example: [example value]"
      },
      "[param2]": {
        "type": "[type]",
        "enum": ["[option1]", "[option2]"],
        "description": "[Description of each option]",
        "default": "[default_value]"
      }
    },
    "required": ["[param1]"]
  }
}
```

---

## Quick Reference: Consistency Rules

### Naming Conventions

| Element | Convention | Example |
|---------|------------|---------|
| Skill files | `XX-kebab-case.md` | `01-core-concepts.md` |
| Commands | `/lowercase` | `/commit` |
| Agents | `PascalCase` | `CodeReviewer` |
| Tools | `snake_case` | `read_file` |
| Tags | `snake_case` | `<user_input>` |

### Structure Conventions

| Element | Required Sections |
|---------|-------------------|
| Skill | Knowledge, Patterns, Anti-Patterns |
| Command | Workflow, Usage, Examples |
| Agent | Identity, Capabilities, Behaviors, Workflow |
| Tool | name, description, input_schema |

### Instruction Keywords

| Keyword | Meaning | Use When |
|---------|---------|----------|
| ALWAYS | Must do every time | Critical behaviors |
| NEVER | Must not do ever | Safety constraints |
| SHOULD | Strong preference | Best practices |
| MAY | Optional | Enhancements |
| IF...THEN | Conditional | Decision points |

---

## SKILL.md Template

For building Claude Skills (see [12-skills.md](12-skills.md) for full guide).

```markdown
---
name: my-skill-name
description: "Does [what] for [context]. Covers [key topics]."
when_to_use: "Use when user asks to [trigger 1], mentions [trigger 2], or says [trigger 3]."
allowed-tools: [Read, Write, Bash, Glob, Grep]
user-invocable: true
argument-hint: "<filename>"
---

# [Skill Name]

## Instructions

### Step 1: [First Action]
[Clear, specific instructions with tool calls if applicable]

```bash
# Example script reference
python scripts/process.py --input {filename}
```

### Step 2: [Next Action]
[Continue with sequential steps]

## Examples

### Example 1: [Common Scenario]
User says: "[typical request]"

Actions:
1. [What happens first]
2. [What happens next]

Result: [Expected outcome]

### Example 2: [Edge Case]
User says: "[less obvious request]"

Actions:
1. [Handle differently because...]

## Troubleshooting

### [Error Name]
**Cause**: [Why it happens]
**Solution**: [How to fix]

### [Another Error]
**Cause**: [Why]
**Solution**: [Fix]
```

**Key rules for SKILL.md:**
- File must be exactly `SKILL.md` (case-sensitive)
- Folder must be kebab-case
- No XML angle brackets in frontmatter
- `description` + ` - ` + `when_to_use` is capped at 250 characters in the skill listing — front-load trigger keywords
- `when_to_use` uses UNDERSCORE (not hyphen like `allowed-tools`)
- Keep SKILL.md under 5,000 words; use `references/` for detail

---

## Opus 4.7 Templates

Templates tuned for Claude Opus 4.7's defaults: adaptive thinking, literal instruction following, fewer tool calls, higher effort baseline.

---

### Template: Agentic Coding Task (Opus 4.7)

Full request config for long-running coding or refactoring work.

```typescript
const request = {
  model: "claude-opus-4-7",
  system: [
    {
      type: "text",
      text: CODING_SYSTEM_PROMPT,
      cache_control: { type: "ephemeral" },
    },
  ],
  thinking: {
    type: "adaptive",
    display: "summarized",  // default is "omitted" on 4.7
  },
  output_config: {
    effort: "xhigh",  // recommended starting point for coding/agentic on 4.7
  },
  max_tokens: 64000,  // minimum at xhigh/max effort
  tools: [/* ... */],
  messages,
};

// Optional: enable task budgets for multi-step traces
const headers = {
  "anthropic-beta": "task-budgets-2026-03-13",
};
const requestWithBudget = {
  ...request,
  task_budget: { total: 200000 },  // minimum 20000
};
```

**Prompt shape** (user message for 4.7 literal instruction following):

```markdown
## Task
[Single, concrete outcome — one sentence]

## Intent
[Why this matters — 2-3 sentences of context for edge-case judgment]

## Constraints
- [Preserve existing behaviors]
- [Hard limits — performance, API shape, migration compatibility]
- [Out-of-scope — what NOT to touch]

## Acceptance Criteria
- [ ] [Testable outcome 1]
- [ ] [Testable outcome 2]
- [ ] [Tests pass / lint clean / types check]
```

---

### Template: Code Review (Opus 4.7)

Opus 4.7 honors "only high-severity" literally, which reduces recall. Reverse the pattern — report everything, filter downstream.

```markdown
## Review Task

Review the diff below. Report EVERY issue you find, regardless of severity.

For each issue, produce:
- `severity`: one of "critical", "high", "medium", "low", "nit"
- `file`: path
- `line`: line number
- `category`: one of "bug", "security", "perf", "style", "docs", "test"
- `description`: what is wrong
- `suggestion`: concrete fix

Return as JSON array. Do not filter or pre-prioritize — we apply severity thresholds downstream.
```

---

### Template: Design — Propose Options Before Building (Opus 4.7)

Opus 4.7 has a persistent cream/serif house style default. For variety, request concrete options before implementation.

```markdown
## Task
Design the onboarding screen for [product].

## Process
Before writing any code, propose FOUR distinct visual directions as a table:

| Direction | Palette | Typography | Feel |
|-----------|---------|------------|------|
| 1 | [3-5 concrete hex values] | [font family + weight] | [1-2 adjectives] |
| 2 | [...] | [...] | [...] |
| 3 | [...] | [...] | [...] |
| 4 | [...] | [...] | [...] |

Then STOP and wait for my selection. Do not implement until I pick one.
```

---

### Template: Memory-Tool-Paired Multi-Session Agent (Opus 4.7)

Leverages Opus 4.7's improved memory-tool handling.

```markdown
## System Prompt

You are a long-horizon engineering agent working on [project]. You have access to the memory tool.

### Session Initialization (run at every session start)
1. Read `memory://project-state.md` — current state, in-flight work, next steps
2. Read `memory://open-questions.md` — unresolved decisions
3. Read `memory://invariants.md` — project-specific rules that persist across sessions

If `memory://project-state.md` does not exist, create it with sections: "Current state", "In-flight work", "Next steps".

### Session Update (run at every session end OR when you commit changes)
Update `memory://project-state.md`:
- "Current state": one paragraph summarizing where the project is
- "In-flight work": bullet list of partially complete tasks
- "Next steps": 1-3 concrete next actions

Append any unresolved decisions to `memory://open-questions.md`.

### During the Session
When you encounter a decision that will matter across sessions (architectural choice, naming convention, invariant), write it to `memory://invariants.md`.
```

---

### Template: Verbosity-Controlled Response (Opus 4.7)

Opus 4.7 calibrates response length to task complexity by default. For UIs with strict length requirements, state them explicitly.

```markdown
## Output Constraints

- Total response: under 150 words
- Format: bulleted list, maximum 5 bullets
- Tone: matter-of-fact, no hedging phrases ("it seems", "I think", "perhaps")
- Do NOT include: preamble, summary, meta-commentary, trailing acknowledgments
- Do NOT use emoji
```

---

**Version**: Claude 4.7 (Opus 4.7)

**Opus 4.7 Sources**:
- https://platform.claude.com/docs/en/about-claude/models/whats-new-claude-4-7
- https://platform.claude.com/docs/en/build-with-claude/adaptive-thinking
- https://platform.claude.com/docs/en/build-with-claude/effort
- https://platform.claude.com/docs/en/build-with-claude/task-budgets
- https://platform.claude.com/docs/en/build-with-claude/prompt-engineering/claude-prompting-best-practices

---

**Next**: [12-skills.md](12-skills.md) - Building skills for Claude

For questions or updates, consult Anthropic's official documentation:
- https://platform.claude.com/docs/en/build-with-claude/prompt-engineering/overview
- https://www.anthropic.com/engineering
- https://resources.anthropic.com/hubfs/The-Complete-Guide-to-Building-Skill-for-Claude.pdf
