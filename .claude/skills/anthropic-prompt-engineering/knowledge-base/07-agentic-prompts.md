# 07: Agentic Prompts

**Source**: Anthropic Official Documentation + Claude Code Best Practices (2025-2026)
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

## Opus 4.7 Agentic Patterns

Opus 4.7 makes different default choices in agentic loops than 4.6. Adapt prompting accordingly.

### 1. Interactive vs Autonomous Coding

**Specify everything upfront.** Every user turn adds reasoning overhead on 4.7. A single well-specified request outperforms back-and-forth.

```markdown
## Task
Refactor the auth module to use the new SessionService.

## Intent
We're consolidating session management. The old AuthGuard should delegate to
SessionService.create(), SessionService.validate(), and SessionService.revoke().

## Constraints
- Preserve existing error response shape
- Keep backward compatibility with /auth/legacy endpoints
- All tests must pass

## Acceptance Criteria
- [ ] AuthGuard uses SessionService for all session ops
- [ ] No direct JWT parsing in AuthGuard
- [ ] Integration tests in __tests__/auth.integration.test.ts pass
- [ ] No breaking change to /auth/legacy
```

### 2. Subagent Fan-Out

Opus 4.7 spawns FEWER subagents by default than 4.6 (4.6 had an "over-spawning" tendency). Be explicit about when fan-out is warranted:

```markdown
## When to Spawn Subagents
Spawn a subagent ONLY if all three hold:
- The work is independent of current context (no back-reference needed)
- The work requires reading >10 files or making >5 tool calls
- Multiple branches can run in parallel without merge conflicts

For single-file edits or <5 tool-call tasks, do the work inline.
```

### 3. Literal Instruction Following

Opus 4.7 does NOT silently generalize. State scope explicitly:

| Ambiguous (4.7 may apply narrowly) | Explicit (4.7 applies as intended) |
|------------------------------------|------------------------------------|
| "Add input validation" | "Add Zod input validation to every exported function in `src/capabilities/`" |
| "Fix the bug" | "Fix the bug in `src/auth/token.ts` AND check for the same pattern in `src/auth/refresh.ts`" |
| "Update the docs" | "Update every .md file under `docs/specs/auth/` to reflect the new SessionService API" |

### 4. Progress Updates

Opus 4.7 produces progress messages natively during long traces. **Remove** scaffolding like:

```markdown
❌ Obsolete on 4.7
"Every 5 tool calls, emit a progress summary."
"After each phase, tell me what you just did."

✅ Trust the native behavior — no scaffolding needed.
```

### 5. Memory-Tool Pairing for Multi-Session Work

Opus 4.7 is better at writing and retrieving from the memory tool. Pattern for multi-session agents:

```markdown
## Session Initializer (run on every session start)
Read memory://project-state.md and memory://open-questions.md.
Resume from the "Next steps" section of project-state.md.

## Session Update (run at end of every session or after each commit)
Write to memory://project-state.md:
- What was accomplished this session
- Files touched (with short rationale)
- Next steps (1-3 concrete actions)

Write unresolved questions to memory://open-questions.md.
```

### 6. Code-Review Recall vs Precision

Opus 4.7 honors constraints like "only high-severity" literally — which lowers measured recall in review tasks. Use:

```markdown
## Review Task
Report EVERY issue you find (critical, high, medium, low, nit).
Include a `severity` field per issue. We filter downstream.
```

### 7. Tool-Call Frequency

Opus 4.7 reasons more before acting; fewer tool calls by default. To increase tool usage:
- Raise effort to `xhigh` or `max`
- State explicit preference: "Prefer running the test suite after each change over batching"

### 8. Response Length

Opus 4.7 calibrates response length to task complexity. For strict length/format requirements, state them explicitly — 4.7 will not default to a fixed verbosity.

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

## Claude 4.6 Agentic Behaviors

### Context Awareness

Claude 4.6 can track its remaining context window. Prevent premature task completion:

```
Your context window will be automatically compacted as it approaches its limit, allowing you to continue working indefinitely from where you left off. Therefore, do not stop tasks early due to token budget concerns. As you approach your token budget limit, save your current progress and state to memory before the context window refreshes. Always be as persistent and autonomous as possible and complete tasks fully.
```

### Memory Tool

File-based system (public beta) for storing/consulting information outside the context window. Pairs with context awareness for seamless context transitions.

- Agent writes notes persisted outside context window
- To-do lists, NOTES.md files, progress tracking
- Retrieved later when context is cleared or compacted

### Overtriggering (New Problem in 4.6)

Claude 4.6 is significantly more proactive. Old aggressive prompting causes overuse:

| Old Pattern (Causes Overtriggering) | New Pattern (Correct for 4.6) |
|--------------------------------------|-------------------------------|
| "CRITICAL: You MUST use this tool" | "Use this tool when..." |
| "If in doubt, use [tool]" | "Use [tool] when it enhances understanding" |
| "Default to using [tool]" | "Use [tool] for [specific situation]" |
| "Always check with [tool] first" | "Check with [tool] when uncertain about [X]" |

### Subagent Orchestration

Claude 4.6 spawns subagents proactively without requiring explicit instruction. Manage this:

```
Use subagents when tasks can run in parallel, require isolated context, or involve independent workstreams that don't need to share state. For simple tasks, sequential operations, single-file edits, or tasks where you need to maintain context across steps, work directly rather than delegating.
```

### Anti-Overengineering Prompt

Anthropic-recommended template to prevent over-engineering:

```
Avoid over-engineering. Only make changes that are directly requested or clearly necessary. Keep solutions simple and focused:

- Scope: Don't add features, refactor code, or make "improvements" beyond what was asked.
- Documentation: Don't add docstrings, comments, or type annotations to code you didn't change.
- Defensive coding: Don't add error handling, fallbacks, or validation for scenarios that can't happen.
- Abstractions: Don't create helpers, utilities, or abstractions for one-time operations.
```

### Anti-Hallucination Prompt

```xml
<investigate_before_answering>
Never speculate about code you have not opened. If the user references a specific file, you MUST read the file before answering. Make sure to investigate and read relevant files BEFORE answering questions about the codebase. Never make any claims about code before investigating unless you are certain of the correct answer.
</investigate_before_answering>
```

### Anti-Hardcoding Prompt

```
Write a high-quality, general-purpose solution. Do not hard-code values or create solutions that only work for specific test inputs. Implement the actual logic that solves the problem generally. If any tests are incorrect, inform me rather than working around them.
```

### Autonomy and Safety Balance

```
Consider the reversibility and potential impact of your actions. Take local, reversible actions freely (editing files, running tests), but for actions that are hard to reverse, affect shared systems, or could be destructive, ask before proceeding.

Examples requiring confirmation:
- Destructive: deleting files/branches, dropping tables, rm -rf
- Hard to reverse: git push --force, git reset --hard
- Visible to others: pushing code, commenting on PRs, sending messages
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

## Multi-Context-Window Workflows

For tasks spanning multiple context windows (long-running agent work):

### Session Architecture

1. **First context window**: Set up framework -- write tests, create init.sh, establish state tracking
2. **Subsequent windows**: Iterate on todo-list, pick up where left off

### State Management

| State Type | Format | Purpose |
|-----------|--------|---------|
| Structured (test results, task status) | JSON (`tests.json`) | Schema enforcement, easy parsing |
| Progress notes | Freeform text (`progress.txt`) | General context, decisions made |
| Checkpoints | Git commits | Rollback capability, change history |

### Session Initialization Sequence

```
1. pwd — verify working directory
2. Read git logs + progress files
3. Review feature_list.json or tests.json
4. Execute init.sh
5. Run baseline tests
6. Fix any broken state before new work
```

### Starting Fresh vs Compacting

Consider starting with a brand new context window rather than compacting. Claude 4.6 is extremely effective at discovering state from the filesystem:

```
Call pwd; you can only read and write files in this directory.
Review progress.txt, tests.json, and the git logs.
Manually run through a fundamental integration test before moving on to new features.
```

### Encourage Complete Context Usage

```
This is a very long task, so plan your work clearly. Spend your entire output context working on the task — just make sure you don't run out of context with significant uncommitted work. Continue working systematically until completed.
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

## Post-Compaction Survival

Auto-compaction fires at ~93% of context window (`effective_window - 13,000 tokens`). After compaction:

| Resource | Budget |
|----------|--------|
| Files re-injected | Max 5 (50K token total, 5K per file) |
| Skills re-injected | 25K token budget (5K per skill) |
| Images | Replaced with `[image]` markers |
| Conversation history | Summarized by Sonnet |

**Design for compaction survival:**
- Persist important state to files (CLAUDE.md, `.tmp` files), not conversation memory
- CLAUDE.md content reloads fully after compaction — safest place for critical instructions
- Fork-mode skill outputs are especially vulnerable (they return as conversation messages that get summarized)
- Use todo lists and progress files for multi-step tasks spanning compaction boundaries

**Warning thresholds:**
- Warning at: `effective_window - 20,000 tokens`
- Auto-compact at: `effective_window - 13,000 tokens` (~93%)
- Circuit breaker: Stops after 3 consecutive compaction failures

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
- [ ] Overtriggering addressed (dial back aggressive tool prompts for 4.6)
- [ ] Anti-overengineering prompt included for coding agents
- [ ] Context awareness / memory tool integrated for long sessions
- [ ] Subagent usage guidance provided (when to delegate vs work directly)
- [ ] Multi-context-window state management defined
- [ ] Autonomy/safety boundaries set for irreversible actions
- [ ] Critical state persisted to files (CLAUDE.md, .tmp) for compaction survival

---

**Next**: [08-prompt-chaining.md](08-prompt-chaining.md) - Multi-step workflows with handoffs
