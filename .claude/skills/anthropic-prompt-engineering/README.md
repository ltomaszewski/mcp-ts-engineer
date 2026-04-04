# Anthropic Prompt Engineering Skill - Usage Guide

## Quick Start

Invoke the skill:
```
/anthropic-prompt-engineering
```

Or read directly:
```
Read .claude/skills/anthropic-prompt-engineering/SKILL.md
```

---

## Scenario 1: Quick Reference - The 10 Golden Rules

**When**: You need a quick reminder of best practices

**Read**:
```
Read .claude/skills/anthropic-prompt-engineering/SKILL.md
```

**The 10 Golden Rules**:
1. **Be explicit** - Say exactly what you want
2. **Provide context** - Explain why, not just what
3. **Use XML tags** - Structure content with `<tags>`
4. **Give examples** - 3-5 diverse examples improve consistency
5. **Think step-by-step** - Use chain of thought for complex reasoning
6. **Match format** - Your style influences Claude's response style
7. **Test empirically** - Iterate based on actual outputs
8. **Manage context** - Long content at top; cache repeated elements
9. **Design tools carefully** - Detailed descriptions are critical
10. **Start minimal** - Add complexity only when needed

---

## Scenario 2: Writing a Simple Prompt

**When**: You need to write a basic prompt for a task

**Read**:
```
Read .claude/skills/anthropic-prompt-engineering/knowledge-base/01-core-principles.md
```

**Example - Bad vs Good**:
```xml
<!-- BAD: Vague -->
Summarize this feedback.

<!-- GOOD: Explicit, structured -->
<instructions>
Summarize this customer feedback:
1. Identify the top 3 themes
2. Note sentiment (positive/negative/neutral) for each
3. List specific product mentions
4. Output as bullet points, max 100 words
</instructions>

<feedback>
{{CUSTOMER_FEEDBACK}}
</feedback>
```

---

## Scenario 3: Structuring Prompts with XML Tags

**When**: Your prompt has multiple sections and needs clear organization

**Read**:
```
Read .claude/skills/anthropic-prompt-engineering/knowledge-base/02-prompt-structure.md
```

**Pattern**:
```xml
<context>
You are reviewing code for a TypeScript monorepo.
This code handles user authentication.
</context>

<document>
{{CODE_TO_REVIEW}}
</document>

<instructions>
1. Identify security vulnerabilities
2. Check for TypeScript type safety issues
3. Note any performance concerns
</instructions>

<output_format>
For each issue:
- Location: file:line
- Severity: critical/major/minor
- Description: 1-2 sentences
- Fix: suggested code
</output_format>
```

---

## Scenario 4: Designing a System Prompt for a Skill

**When**: Creating a new Claude Code skill

**Read**:
```
Read .claude/skills/anthropic-prompt-engineering/knowledge-base/03-system-prompts.md
Read .claude/skills/anthropic-prompt-engineering/knowledge-base/11-templates.md
```

**Template**:
```markdown
# [Skill Name]

You are a [ROLE] specialized in [DOMAIN].

## Capabilities
- [What you can do]

## Constraints
- NEVER [prohibited action]
- ALWAYS [required behavior]

## Output Format
[How to structure responses]
```

---

## Scenario 5: Adding Chain of Thought for Complex Reasoning

**When**: Task requires multi-step analysis or problem-solving

**Read**:
```
Read .claude/skills/anthropic-prompt-engineering/knowledge-base/04-chain-of-thought.md
```

**Pattern**:
```xml
<instructions>
Analyze this bug report and propose a fix.

First, in <thinking> tags:
1. Understand what the bug is
2. Identify where in the code it might originate
3. Consider possible causes
4. Evaluate fix options

Then, in <solution> tags:
- Describe the root cause
- Provide the fix with code
- Explain why this fixes it
</instructions>

<bug_report>
{{BUG_REPORT}}
</bug_report>
```

---

## Scenario 6: Using Extended Thinking for Complex Tasks

**When**: Very complex STEM, strategy, or multi-constraint problems

**Read**:
```
Read .claude/skills/anthropic-prompt-engineering/knowledge-base/05-extended-thinking.md
```

**Key principle - Don't prescribe, guide**:
```
# DON'T prescribe exact steps
Think through this step by step:
1. First identify variables
2. Then set up equation...

# DO give high-level guidance
Please think about this problem thoroughly and in great detail.
Consider multiple approaches and show your complete reasoning.
Try different methods if your first approach doesn't work.
```

---

## Scenario 7: Writing Tool Definitions

**When**: Creating tools for an agent or skill

**Read**:
```
Read .claude/skills/anthropic-prompt-engineering/knowledge-base/06-tool-use.md
```

**Critical rule**: Detailed descriptions are the #1 factor in tool performance.

**Template**:
```json
{
  "name": "search_codebase",
  "description": "Search for code patterns across the codebase using regex. Returns matching file paths and line numbers. Use this BEFORE read_file to find relevant files. Does not return file contents - use read_file after finding matches. Supports standard regex syntax. Returns max 50 results by default.",
  "input_schema": {
    "type": "object",
    "properties": {
      "pattern": {
        "type": "string",
        "description": "Regex pattern to search for. Example: 'function\\s+handle.*Error' to find error handlers."
      },
      "file_pattern": {
        "type": "string",
        "description": "Glob pattern to filter files. Example: '**/*.ts' for TypeScript files only.",
        "default": "**/*"
      }
    },
    "required": ["pattern"]
  }
}
```

---

## Scenario 8: Designing an Autonomous Agent

**When**: Building a Claude Code agent that works autonomously

**Read**:
```
Read .claude/skills/anthropic-prompt-engineering/knowledge-base/07-agentic-prompts.md
Read .claude/skills/anthropic-prompt-engineering/knowledge-base/03-system-prompts.md
```

**Template**:
```markdown
You are [AGENT_NAME], an autonomous agent for [PURPOSE].

## Core Behaviors
1. **Read before write**: Always verify state before modifications
2. **Minimal changes**: Only change what's necessary
3. **Progress tracking**: Use todo lists for multi-step tasks
4. **Verify success**: Check operations succeeded before proceeding

## Workflow
1. Understand the goal
2. Plan the approach
3. Execute step by step
4. Verify each step
5. Report completion

## Error Handling
When an error occurs:
1. Report the error clearly
2. Analyze the likely cause
3. Attempt ONE fix
4. If 3 attempts fail, STOP and ask user

## Stopping Conditions
STOP and ask when:
- Requirements are ambiguous
- Operation would be irreversible
- You've failed 3 times at same step
```

---

## Scenario 9: Creating Multi-Step Workflows (Prompt Chaining)

**When**: Complex task needs to be broken into discrete steps

**Read**:
```
Read .claude/skills/anthropic-prompt-engineering/knowledge-base/08-prompt-chaining.md
```

**Pattern**:
```
Step 1: Extract
├── Input: Raw document
├── Prompt: "Extract key findings in <findings> tags"
└── Output: {{FINDINGS}}

Step 2: Analyze
├── Input: {{FINDINGS}} from Step 1
├── Prompt: "Analyze findings for risks in <analysis> tags"
└── Output: {{ANALYSIS}}

Step 3: Recommend
├── Input: {{ANALYSIS}} from Step 2
├── Prompt: "Provide recommendations in <recommendations> tags"
└── Output: Final recommendations
```

---

## Scenario 10: Optimizing for Cost and Latency

**When**: Prompt is used frequently and needs optimization

**Read**:
```
Read .claude/skills/anthropic-prompt-engineering/knowledge-base/09-optimization.md
```

**Key strategies**:

1. **Order content for caching**:
```
[STABLE - Cache this]
├── System prompt
├── Tool definitions
├── Examples (20+ with caching!)
└── Reference documents

[VARIABLE - Don't cache]
└── User's current query
```

2. Set cache breakpoints after stable sections
3. Minimize tokens in variable content

---

## Scenario 11: Testing and Debugging Prompts

**When**: Prompt isn't working consistently

**Read**:
```
Read .claude/skills/anthropic-prompt-engineering/knowledge-base/10-testing.md
```

**Debugging workflow**:
```
1. Identify failure type:
   - Wrong format? → Add explicit format example
   - Missing content? → Add checklist of required elements
   - Hallucination? → Add "only use provided information"
   - Instruction ignored? → Move rule to top, add emphasis

2. Test with 10+ examples:
   - 3-5 happy path
   - 3-5 edge cases
   - 2-3 error cases

3. After each fix, retest ALL cases (regression testing)
```

---

## Scenario 12: Using Templates for Consistency

**When**: Creating skills, commands, or agents that follow standards

**Read**:
```
Read .claude/skills/anthropic-prompt-engineering/knowledge-base/11-templates.md
```

**Available templates**:
- Basic Skill Template
- Library/Framework Skill Template
- Basic Command Template
- Complex Workflow Command Template
- Task-Specific Agent Template
- Iterative Executor Agent Template
- System Prompt Templates (minimal/standard/full)
- Tool Definition Template

---

## Scenario 13: Building a Skill for Claude

**When**: Creating a new SKILL.md, debugging skill triggering, or distributing skills

**Read**:
```
Read .claude/skills/anthropic-prompt-engineering/knowledge-base/12-skills.md
```

**Key concepts**:
- **Progressive disclosure**: Frontmatter (always loaded) -> SKILL.md body (on demand) -> references/ (when navigated)
- **Frontmatter is critical**: `name` (kebab-case) + `description` (what + when) determine if skill loads
- **Test triggering**: Ask Claude "When would you use the [skill name] skill?" to debug
- **Three categories**: Document creation, Workflow automation, MCP enhancement

**Quick template**:
```yaml
---
name: my-skill-name
description: Does X when user asks to Y. Use when user mentions "Z" or "W".
---

# My Skill Name

## Instructions
### Step 1: [Action]
[Clear, actionable instructions]

## Examples
[Common scenarios with expected results]

## Troubleshooting
[Common errors and fixes]
```

---

## Quick Command Reference

| Need | Command |
|------|---------|
| Full overview | `Read .../knowledge-base/00-master-index.md` |
| Basic principles | `Read .../knowledge-base/01-core-principles.md` |
| XML structure | `Read .../knowledge-base/02-prompt-structure.md` |
| System prompts | `Read .../knowledge-base/03-system-prompts.md` |
| Chain of thought | `Read .../knowledge-base/04-chain-of-thought.md` |
| Extended thinking | `Read .../knowledge-base/05-extended-thinking.md` |
| Tool definitions | `Read .../knowledge-base/06-tool-use.md` |
| Agent design | `Read .../knowledge-base/07-agentic-prompts.md` |
| Prompt chaining | `Read .../knowledge-base/08-prompt-chaining.md` |
| Caching/optimization | `Read .../knowledge-base/09-optimization.md` |
| Testing prompts | `Read .../knowledge-base/10-testing.md` |
| Templates | `Read .../knowledge-base/11-templates.md` |
| Building skills | `Read .../knowledge-base/12-skills.md` |
| Agent teams | `Read .../knowledge-base/13-agent-teams.md` |
| CLAUDE.md architecture | `Read .../knowledge-base/14-claude-md.md` |

*Path prefix: `.claude/skills/anthropic-prompt-engineering`*

---

## Example: Full Workflow

**Task**: Create a code review agent

```bash
# 1. Read agent design principles
Read .claude/skills/anthropic-prompt-engineering/knowledge-base/07-agentic-prompts.md

# 2. Read system prompt patterns
Read .claude/skills/anthropic-prompt-engineering/knowledge-base/03-system-prompts.md

# 3. Read tool definition best practices
Read .claude/skills/anthropic-prompt-engineering/knowledge-base/06-tool-use.md

# 4. Use templates as starting point
Read .claude/skills/anthropic-prompt-engineering/knowledge-base/11-templates.md

# 5. Write your agent, then test
Read .claude/skills/anthropic-prompt-engineering/knowledge-base/10-testing.md
```

---

## Sources

All content derived from official Anthropic documentation:
- https://platform.claude.com/docs/en/build-with-claude/prompt-engineering
- https://www.anthropic.com/engineering
- https://platform.claude.com/docs/en/build-with-claude/extended-thinking
- https://platform.claude.com/docs/en/build-with-claude/tool-use
