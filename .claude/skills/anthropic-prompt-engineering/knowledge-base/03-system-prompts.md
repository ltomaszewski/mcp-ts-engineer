# 03: System Prompts and Instruction Design

**Source**: Anthropic Official Documentation
**Principle**: System prompts define Claude's persistent behavior, role, and constraints.

---

## What is a System Prompt?

A system prompt is the initial instruction set that:
- Establishes Claude's role and persona
- Defines behavioral constraints and guardrails
- Provides persistent context across conversation turns
- Sets the tone and style for all responses

---

## System Prompt Architecture

### The Canonical Structure

```
[Role & Identity]
[Core Capabilities]
[Behavioral Constraints]
[Output Guidelines]
[Tool Definitions (if applicable)]
[Examples (optional)]
```

### Example: Complete System Prompt

```
You are an AI code review assistant for a TypeScript development team.

## Core Capabilities
- Analyze code for bugs, security issues, and performance problems
- Suggest improvements following team coding standards
- Explain complex code patterns clearly

## Constraints
- ONLY review code provided in <code> tags
- Never execute or run code
- If unsure about an issue, say "I'm uncertain about this" rather than guessing
- Keep explanations under 200 words unless asked for detail

## Output Format
For each issue found:
1. Location (file:line)
2. Severity (critical/major/minor/suggestion)
3. Description (1-2 sentences)
4. Fix (code snippet or suggestion)

## Style
- Be direct and constructive
- Prioritize actionable feedback over praise
- Use code snippets to illustrate suggestions
```

---

## Key Components

### 1. Role Definition

Define WHO Claude is in this context:

```
You are [ROLE] for [ORGANIZATION/CONTEXT].

Your expertise includes:
- [Skill 1]
- [Skill 2]
- [Skill 3]

Your primary goal is to [PRIMARY OBJECTIVE].
```

**Effective Roles**:
- "You are a senior TypeScript engineer specializing in NestJS backends"
- "You are a medical information assistant (NOT a doctor)"
- "You are a code review bot for a financial services company"

**Ineffective Roles**:
- "You are helpful" (too vague)
- "You are an AI" (adds nothing)
- "Be like ChatGPT" (undefined)

### 2. Behavioral Constraints

Define what Claude SHOULD and SHOULD NOT do:

```
## Required Behaviors
- Always cite sources when providing factual claims
- Always ask for clarification when a request is ambiguous
- Always format code with proper syntax highlighting

## Prohibited Behaviors
- Never provide medical diagnoses
- Never generate content that could be used for harm
- Never pretend to have capabilities you don't have
```

**Anthropic Best Practice**: Use explicit "NEVER" and "ALWAYS" statements for critical constraints.

### 3. Output Guidelines

Specify format, length, and style:

```
## Response Format
- Use markdown formatting
- Keep responses under 500 words unless asked for more
- Use bullet points for lists of 3+ items
- Include code blocks with language tags

## Tone
- Professional but approachable
- Direct, not verbose
- Technical accuracy over simplification
```

### 4. Tool Integration

When Claude has access to tools:

```
## Available Tools
You have access to the following tools:
- `read_file`: Read contents of a file
- `write_file`: Write or update a file
- `search_code`: Search for patterns in the codebase

## Tool Usage Guidelines
- Prefer `search_code` before reading files to find relevant locations
- Always read a file before modifying it
- Confirm destructive operations before executing
```

---

## Claude 4.x Specific Best Practices

From Anthropic's Claude 4 documentation:

### 1. Be Explicit About Tool Use

> "Claude 4.5 models are trained for precise instruction following. If you say 'can you suggest some changes,' it will sometimes provide suggestions rather than implementing them."

**Solution**:
```
By default, implement changes rather than only suggesting them.
When using tools, proceed with operations unless explicitly told to wait.
```

### 2. Use Thinking for Complex Decisions

> "Claude 4 offers thinking capabilities that can be especially helpful for tasks involving reflection after tool use or complex multi-step reasoning."

**Solution**:
```
For complex decisions, use <thinking> tags to reason through options before acting.
```

### 3. Add Identity Context Early

Place role and identity at the very beginning of system prompts:

```
# IDENTITY
You are Claude Code, Anthropic's official CLI for Claude.

# CAPABILITIES
[List of what you can do]

# CONSTRAINTS
[What you must not do]
```

---

## Agentic System Prompts

For autonomous agents, additional components are needed:

### Goal Orientation

```
## Primary Goal
Your goal is to [COMPLETE OBJECTIVE] by:
1. [Step 1]
2. [Step 2]
3. [Step 3]

## Success Criteria
A task is complete when:
- [Criterion 1]
- [Criterion 2]
- [Criterion 3]
```

### State Management

```
## Context Awareness
You maintain awareness of:
- Current working directory
- Files you've read or modified
- Previous tool calls in this session
- User's stated preferences

## When Context is Lost
If you're unsure about the current state:
1. Use read tools to verify before modifying
2. Ask the user for clarification
3. Never assume state from previous sessions
```

### Error Handling

```
## Error Handling
When an error occurs:
1. Analyze the error message
2. Identify likely cause
3. Attempt ONE fix
4. If still failing after 3 attempts, STOP and ask user

## Prohibited Error Responses
- Never hide errors from the user
- Never retry infinitely
- Never continue past blocking errors
```

---

## System Prompt Patterns

### Pattern 1: Code Assistant

```
You are a coding assistant specialized in [LANGUAGE/FRAMEWORK].

## Capabilities
- Read and analyze code files
- Write and modify code
- Debug errors
- Explain code behavior

## Workflow
1. ALWAYS read existing code before modifying
2. Make minimal changes to fix the issue
3. Test your changes mentally before submitting
4. Explain what you changed and why

## Constraints
- Never modify files you haven't read
- Prefer editing over creating new files
- Keep changes focused—don't refactor unnecessarily
- If tests fail, fix them before proceeding
```

### Pattern 2: Research Assistant

```
You are a research assistant helping with technical research.

## Capabilities
- Search the web for current information
- Read and synthesize documents
- Summarize findings with citations

## Methodology
1. Start with broad search to understand the landscape
2. Narrow to specific sources
3. Cross-reference claims across sources
4. Present findings with confidence levels

## Constraints
- Always cite sources with URLs
- Distinguish between facts, opinions, and speculation
- If information is uncertain, say so explicitly
```

### Pattern 3: Task Executor

```
You are a task execution agent.

## Execution Model
1. Parse the user's request into discrete steps
2. Execute steps sequentially
3. Verify each step before proceeding
4. Report progress and completion

## Decision Making
- When choice is clear: proceed automatically
- When choice is ambiguous: ask the user
- When operation is destructive: confirm first

## Stopping Conditions
STOP and ask the user when:
- You've made 3 failed attempts at the same step
- The next action would be irreversible
- You're uncertain about the user's intent
```

---

## System Prompt Optimization

### Token Efficiency

1. **Front-load critical instructions**: Put the most important rules first
2. **Use headers for scannability**: `## Constraints`, `## Output Format`
3. **Remove redundancy**: Don't repeat instructions in different words
4. **Use examples sparingly**: One good example > three mediocre ones

### Prompt Caching Compatibility

Place stable content first for better cache hit rates:

```
[STABLE: Role definition, core constraints]
[STABLE: Tool definitions]
[STABLE: Examples]
[VARIABLE: Session-specific context]
```

### Testing System Prompts

Test with adversarial inputs:
1. Edge cases that might bypass constraints
2. Requests that conflict with instructions
3. Ambiguous requests requiring judgment
4. Long conversations that might cause drift

---

## Anti-Patterns

### 1. Vague Identity
```
# BAD
You are a helpful assistant.

# GOOD
You are a senior TypeScript engineer at a B2B SaaS company.
Your expertise: NestJS, GraphQL, MongoDB, testing with Vitest.
Your goal: Help developers write clean, tested, production-ready code.
```

### 2. Conflicting Instructions
```
# BAD
Be concise. Also, be thorough and detailed.

# GOOD
Provide concise answers (under 200 words) by default.
When asked for detail, expand with examples and explanations.
```

### 3. Missing Error Guidance
```
# BAD
Execute the user's requests.

# GOOD
Execute the user's requests.
If a request fails:
1. Report the error clearly
2. Suggest one potential fix
3. Wait for user guidance before retrying
```

---

## Validation Checklist

- [ ] Role is clearly defined with specific expertise
- [ ] Constraints use ALWAYS/NEVER where critical
- [ ] Output format is explicitly specified
- [ ] Tool usage guidelines are included (if applicable)
- [ ] Error handling behavior is defined
- [ ] Stopping conditions are clear
- [ ] Tested with edge cases and adversarial inputs

---

**Next**: [04-chain-of-thought.md](04-chain-of-thought.md) - Reasoning techniques for complex tasks
