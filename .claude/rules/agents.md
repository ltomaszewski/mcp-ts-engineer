# Agent Orchestration

Guidelines for effective use of specialized agents.

---

## Available Agents

| Agent | Purpose | Model | When to Use |
|-------|---------|-------|-------------|
| **planner** | Implementation planning | Opus | Complex features, multi-file changes |
| **architect** | System design | Opus | Architectural decisions, ADRs |
| **code-reviewer** | Code quality | Sonnet | After writing/modifying code |
| **security-reviewer** | Vulnerability analysis | Opus | Auth, input handling, sensitive data |
| **build-error-resolver** | Fix build/type errors | Haiku | When build fails |
| **refactor-cleaner** | Dead code removal | Sonnet | Cleanup, consolidation |
| **doc-updater** | Documentation sync | Sonnet | After major changes |
| **eng-executor** | TDD implementation | Sonnet | Feature implementation |
| **audit-executor** | Code quality fixes | Sonnet | Lint/type fixes |
| **maestro-executor** | E2E tests | Sonnet | Mobile E2E testing |

---

## Proactive Agent Usage

**Use agents WITHOUT waiting for user prompt:**

| Trigger | Agent | Action |
|---------|-------|--------|
| Feature request | planner | Create implementation plan |
| Code just written | code-reviewer | Review for quality |
| Bug fix or new feature | eng-executor | TDD implementation |
| Auth/security code | security-reviewer | Security analysis |
| Build failure | build-error-resolver | Fix errors |
| Architecture question | architect | Design decision |

---

## Delegation Principles

### Delegate When

- Task is self-contained (clear input/output)
- Different expertise needed
- Tasks are parallelizable
- Fresh context benefits the task

### Keep Inline When

- Small edits (< 3 files)
- Quick fixes with clear scope
- Needs full conversation context
- Sequential dependency on previous work

---

## Parallel Execution

**ALWAYS parallelize independent operations:**

```markdown
# GOOD: Launch 3 agents in parallel
1. code-reviewer: Review auth changes
2. security-reviewer: Audit JWT handling
3. audit-executor: Fix lint issues in utils/

# BAD: Sequential when unnecessary
First review, then security, then lint
```

**Parallel safety:**
- Different files = safe to parallel
- Same file = sequential only
- Shared state = sequential only

---

## Context Passing

**Provide specific, actionable context:**

```markdown
# GOOD: Clear scope and context
Task: Review src/modules/auth/auth.service.ts
Focus: JWT token generation and refresh logic
Context: User reported token expiry issues

# BAD: Vague delegation
"Check the auth code for issues"
```

**Include:**
- Specific file paths
- What to focus on
- Relevant background
- Success criteria

---

## Agent Chaining

For complex features, chain agents sequentially:

```
planner (Opus)
    ↓ Implementation plan
eng-executor (Sonnet)
    ↓ Code + tests
code-reviewer (Sonnet)
    ↓ Review feedback
audit-executor (Sonnet)
    ↓ Fixed violations
maestro-executor (Sonnet)
    ↓ E2E tests
```

**Use `run_pipeline` MCP tool for automated chaining.**

---

## Multi-Perspective Analysis

For critical decisions, use split-role agents:

```markdown
Launch parallel analysis:
1. Security expert: Vulnerability assessment
2. Performance specialist: Efficiency concerns
3. Maintainability reviewer: Long-term implications
4. Domain expert: Business logic correctness
```

Synthesize findings before proceeding.

---

## Agent-Specific Patterns

### planner
```markdown
Input: Feature description + acceptance criteria
Output: Phased implementation plan with file changes

Best for:
- New features (3+ files)
- Refactoring efforts
- Architecture changes
```

### code-reviewer
```markdown
Input: Changed files (git diff)
Output: Categorized issues (Critical/High/Medium/Low)

Trigger automatically after:
- Edit tool usage
- Write tool usage
- Feature completion
```

### security-reviewer
```markdown
Input: Code handling auth, input, or sensitive data
Output: Security issues with severity and fixes

MUST use for:
- Authentication changes
- Input validation
- Health data handling
- API endpoints
```

### build-error-resolver
```markdown
Input: Build/type error output
Output: Minimal fixes to resolve

Use Haiku for:
- Fast iteration
- Clear error messages
- Incremental fixes
```

---

## Error Handling

When agent fails:

1. Check if scope was clear
2. Verify context was sufficient
3. Consider model upgrade (Haiku → Sonnet → Opus)
4. Break task into smaller pieces
5. Provide additional context and retry

---

## Best Practices

**DO:**
- Provide clear success criteria
- Include relevant file paths
- Specify expected output format
- Parallelize when safe
- Use appropriate model tier

**DON'T:**
- Delegate vague tasks
- Overload with unnecessary context
- Mix unrelated tasks in one agent
- Ignore agent recommendations
- Skip code-reviewer after changes
