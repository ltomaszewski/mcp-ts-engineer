# 07: Agentic Prompts

**Source**: Anthropic Official Documentation + Claude Code Best Practices
**Principle**: Effective agents require careful context engineering, not just prompt engineering.

---

## What is Context Engineering?

> "Context engineering involves curating and maintaining optimal tokens during LLM inference, moving beyond traditional prompt engineering to manage entire context states across multiple interaction turns."
> — Anthropic Engineering

Context engineering focuses on:
- **Writing to context** - Logs, state, observations
- **Maintaining context** - Summaries, compression, prioritization
- **Removing from context** - Pruning irrelevant information
- **Reading context** - Selective attention and recall

---

## The Three Pillars of Agent Design

### 1. System Prompt Foundation

Define the agent's identity, capabilities, and constraints:

```
You are [AGENT_NAME], an autonomous coding agent.

## Identity
[Who you are, what you do]

## Capabilities
[What tools you have, what actions you can take]

## Constraints
[What you must never do, limits on your behavior]

## Workflow
[How you approach tasks, decision-making process]

## Error Handling
[What to do when things go wrong]
```

### 2. Tool Design

Create well-described, token-efficient tools:
- Detailed descriptions (see [06-tool-use.md](06-tool-use.md))
- Sensible defaults
- Pagination for list operations
- Clear error messages

### 3. Context State Management

Track what the agent knows:
- Current working state
- Files read/modified
- Previous tool results
- User preferences and decisions

---

## Claude Code Agent Patterns

### Pattern 1: Think Before Acting

Include a "think" tool for complex decisions:

```json
{
  "name": "think",
  "description": "Use this tool to think through complex problems before acting. The contents of your thinking are not visible to the user. Use this when you need to reason about multi-step plans, evaluate options, or work through ambiguous situations.",
  "input_schema": {
    "type": "object",
    "properties": {
      "thought": {
        "type": "string",
        "description": "Your reasoning and analysis"
      }
    },
    "required": ["thought"]
  }
}
```

**When to use the think tool**:
- Complex multi-step tool sequences
- Evaluating information from prior tool calls
- Navigating ambiguous situations
- Reasoning about errors

### Pattern 2: Read Before Write

Agents should always verify state before modifying:

```
## File Operations
- ALWAYS read a file before modifying it
- NEVER write to a file you haven't read
- Prefer editing existing files over creating new ones
```

### Pattern 3: Minimal Changes

Avoid over-engineering:

```
## Change Philosophy
- Only make changes directly related to the task
- Don't refactor code unnecessarily
- Don't add features beyond what was requested
- Don't add documentation to unchanged code
- Keep solutions simple and focused
```

### Pattern 4: Progressive Context Loading

Don't load everything upfront:

```
## Information Gathering
1. Start with targeted searches
2. Read only files that are likely relevant
3. Explore incrementally based on what you learn
4. Stop loading context when you have enough to proceed
```

---

## Agent State Management

### Tracking Known Information

```
## Context Awareness
You maintain awareness of:
- Current working directory
- Files you've read in this session
- Changes you've made
- Tool call results and their implications
- User's stated preferences

## State Verification
If uncertain about current state:
1. Use read tools to verify before modifying
2. Check file existence before creating
3. Never assume state from previous sessions
```

### Handling Context Window Limits

```
## Long Operations
For tasks requiring many tool calls:
1. Summarize findings periodically
2. Note key decisions and their rationale
3. Focus on what's needed for the next step
4. Don't reload information you've already processed
```

---

## Error Handling Patterns

### The 3-Attempt Rule

```
## Error Recovery
When an operation fails:
1. Analyze the error message
2. Identify the likely cause
3. Attempt ONE fix

If still failing after 3 attempts:
- STOP
- Report what you've tried
- Ask user for guidance

## Prohibited Error Responses
- Never hide errors from the user
- Never retry infinitely
- Never continue past blocking errors
- Never make the same fix repeatedly
```

### Graceful Degradation

```
## When Blocked
If you cannot complete a task:
1. Report clearly what you attempted
2. Explain why it failed
3. Suggest alternatives if possible
4. Wait for user guidance

Do NOT:
- Pretend the task succeeded
- Make random changes hoping something works
- Skip the task silently
```

---

## Task Decomposition

### Breaking Down Complex Tasks

```
## Task Approach
For complex tasks:
1. Break into discrete, sequential steps
2. Complete each step before starting the next
3. Verify each step succeeded
4. Report progress as you go

## Step Verification
After each step:
- Check that the expected result occurred
- If not, address the issue before proceeding
- Don't build on failed foundations
```

### Todo List Integration

```
## Progress Tracking
For multi-step tasks:
1. Create a todo list with all steps
2. Mark each step as you begin it
3. Mark as complete only when verified
4. Update the list if scope changes
```

---

## Agent Communication

### Progress Updates

```
## Communication Style
- Report what you're about to do before doing it
- Share key findings as you discover them
- Explain decisions when they're non-obvious
- Summarize results after major operations
```

### Asking for Clarification

```
## When to Ask
Ask the user when:
- Requirements are ambiguous
- Multiple valid approaches exist
- You need information not in context
- An operation would be irreversible

## How to Ask
- Be specific about what you need
- Offer options when possible
- Explain why you need the information
```

---

## Agentic System Prompt Template

```
You are [AGENT_NAME], an autonomous agent for [PURPOSE].

## Identity
[Role and expertise]

## Available Tools
[List of tools with brief descriptions]

## Core Behaviors
1. **Read before write**: Always verify current state before modifications
2. **Minimal changes**: Only change what's necessary for the task
3. **Progress tracking**: Use todo lists for multi-step tasks
4. **Verify success**: Check that operations succeeded before proceeding

## Workflow
For each task:
1. Understand the goal
2. Plan the approach
3. Execute step by step
4. Verify each step
5. Report completion

## Constraints
- Never [prohibited action 1]
- Never [prohibited action 2]
- Always [required behavior 1]
- Always [required behavior 2]

## Error Handling
When an error occurs:
1. Report the error clearly
2. Analyze the cause
3. Attempt ONE fix
4. If 3 attempts fail, stop and ask user

## When Uncertain
If you're unsure about:
- What the user wants: Ask for clarification
- Current state: Use read tools to verify
- Whether to proceed: Err on the side of asking
```

---

## Common Anti-Patterns

### 1. Infinite Retry Loops

```
# BAD: Retry forever
while error:
    try_again()

# GOOD: Limited retries with escalation
for attempt in range(3):
    try_again()
stop_and_ask_user()
```

### 2. Assuming State

```
# BAD: Assume file exists
write_to_file(path)

# GOOD: Verify first
if file_exists(path):
    read_file(path)
    modify_and_write(path)
else:
    create_file(path)
```

### 3. Over-Eager Changes

```
# BAD: "While I'm here, let me also refactor..."
fix_bug()
refactor_module()
add_documentation()

# GOOD: Focused changes
fix_bug()
# Stop - task complete
```

### 4. Silent Failures

```
# BAD: Pretend it worked
if error:
    pass  # ignore

# GOOD: Report clearly
if error:
    report_to_user(error)
    suggest_next_steps()
```

---

## Validation Checklist

- [ ] System prompt defines identity, capabilities, and constraints
- [ ] Tools have detailed descriptions
- [ ] Read-before-write pattern is enforced
- [ ] Error handling has clear escalation path
- [ ] Progress is tracked and communicated
- [ ] Stopping conditions are defined
- [ ] State management is explicit
- [ ] Uncertainty triggers clarification requests

---

**Next**: [08-prompt-chaining.md](08-prompt-chaining.md) - Multi-step workflows with handoffs
