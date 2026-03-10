# 13: Agent Teams & Multi-Agent Orchestration

**Source**: Claude Code Documentation + Anthropic Engineering Blog (2026)
**Principle**: Agent teams coordinate multiple Claude Code instances working together with shared tasks, inter-agent messaging, and centralized management.

---

## What Are Agent Teams?

Agent teams let you coordinate multiple Claude Code instances. One session acts as the **team lead**, coordinating work, assigning tasks, and synthesizing results. Teammates work independently, each in its own context window, and communicate directly with each other.

> **Experimental**: Agent teams are disabled by default. Enable via `CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS` in settings.json.

---

## Agent Teams vs Subagents

| | Subagents | Agent Teams |
|---|---|---|
| **Context** | Own window; results return to caller | Own window; fully independent |
| **Communication** | Report back to main agent only | Message each other directly |
| **Coordination** | Main agent manages all work | Shared task list with self-coordination |
| **Best for** | Focused tasks where only result matters | Complex work requiring discussion |
| **Token cost** | Lower: summarized back to main | Higher: each is a separate Claude instance |

**Use subagents** when you need quick, focused workers that report back.
**Use agent teams** when teammates need to share findings, challenge each other, and coordinate.

---

## Best Use Cases

- **Research and review**: Multiple teammates investigate different aspects simultaneously
- **New modules or features**: Teammates each own a separate piece without conflicts
- **Debugging with competing hypotheses**: Test different theories in parallel
- **Cross-layer coordination**: Frontend, backend, and tests each owned by different teammates

**Don't use teams for**: Sequential tasks, same-file edits, work with many dependencies — use a single session or subagents instead.

---

## Enabling Agent Teams

```json
// settings.json
{
  "env": {
    "CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS": "1"
  }
}
```

---

## Architecture

| Component | Role |
|-----------|------|
| **Team lead** | Creates team, spawns teammates, coordinates work |
| **Teammates** | Separate Claude Code instances working on assigned tasks |
| **Task list** | Shared list of work items that teammates claim and complete |
| **Mailbox** | Messaging system for communication between agents |

Storage:
- Team config: `~/.claude/teams/{team-name}/config.json`
- Task list: `~/.claude/tasks/{team-name}/`

---

## Starting a Team

```text
I'm designing a CLI tool that helps developers track TODO comments.
Create an agent team to explore this from different angles: one teammate
on UX, one on technical architecture, one playing devil's advocate.
```

Claude creates the team, spawns teammates, and coordinates work.

---

## Communication Patterns

### Lead-to-Teammate
- Lead creates tasks and assigns work
- Can message specific teammates or broadcast to all

### Teammate-to-Teammate
- Direct messaging between teammates (not through lead)
- Share discoveries and challenge each other's findings

### Automatic Notifications
- Tool results delivered automatically
- Idle notifications sent when teammates finish
- Task status visible to all agents

---

## Task Management

Tasks have three states: **pending**, **in progress**, **completed**.

Tasks can depend on other tasks — blocked tasks auto-unblock when dependencies complete.

### Assignment Modes
- **Lead assigns**: Explicit task-to-teammate mapping
- **Self-claim**: Teammates pick up next unassigned, unblocked task
- File locking prevents race conditions on simultaneous claims

---

## Display Modes

| Mode | Description | When to Use |
|------|-------------|-------------|
| **In-process** (default) | All teammates in main terminal, Shift+Down to cycle | Any terminal |
| **Split panes** | Each teammate in own pane (requires tmux/iTerm2) | When monitoring multiple |

```json
// Override in settings.json
{"teammateMode": "in-process"}
```

---

## Best Practices

### Give Rich Context
Teammates don't inherit lead's conversation history. Include task-specific details:

```text
Spawn a security reviewer with the prompt: "Review src/auth/ for
vulnerabilities. Focus on token handling, session management, and input
validation. The app uses JWT tokens in httpOnly cookies."
```

### Right-Size Your Team
- Start with **3-5 teammates** for most workflows
- **5-6 tasks per teammate** keeps everyone productive
- Three focused teammates often outperform five scattered ones

### Size Tasks Appropriately
- **Too small**: Coordination overhead exceeds benefit
- **Too large**: Teammates work too long without check-ins
- **Just right**: Self-contained units producing clear deliverables

### Prevent Conflicts
- Break work so each teammate owns different files
- Two teammates editing the same file leads to overwrites

### Quality Gates with Hooks
- `TeammateIdle`: Runs when teammate is about to go idle (exit code 2 sends feedback)
- `TaskCompleted`: Runs when task is being marked complete (exit code 2 prevents completion)

### Plan Approval
Require teammates to plan before implementing for risky tasks:

```text
Spawn an architect teammate to refactor the auth module.
Require plan approval before they make any changes.
```

---

## Example: Parallel Code Review

```text
Create an agent team to review PR #142. Spawn three reviewers:
- One focused on security implications
- One checking performance impact
- One validating test coverage
Have them each review and report findings.
```

Each reviewer applies a different filter. Lead synthesizes findings across all three.

---

## Example: Competing Hypotheses

```text
Users report the app exits after one message instead of staying connected.
Spawn 5 teammates to investigate different hypotheses. Have them talk to
each other to try to disprove each other's theories, like a scientific
debate. Update the findings doc with whatever consensus emerges.
```

The debate structure prevents anchoring bias — the theory that survives adversarial challenge is more likely correct.

---

## Long-Running Agent Architecture

For extended autonomous work (from Anthropic's harnesses article):

### Two-Agent Pattern

1. **Initializer Agent** (first session): Creates `init.sh`, `claude-progress.txt`, initial git commit
2. **Coding Agent** (subsequent sessions): Single-feature incremental work

### Progress Tracking

```json
// feature_list.json (use JSON, not Markdown — less corruption)
{
  "features": [
    {"id": 1, "name": "auth_flow", "passes": false},
    {"id": 2, "name": "user_management", "passes": true}
  ]
}
```

### Rules for Long-Running Agents
- **One feature per session** — prevents context exhaustion
- **Agents cannot edit/remove tests** — only flip the `passes` boolean
- **Descriptive git commits after each change**
- **Read progress files at session start** before beginning work

---

## Limitations

- No session resumption with in-process teammates
- Task status can lag (teammates may not mark complete)
- One team per session; no nested teams
- Lead is fixed for team lifetime
- All teammates start with lead's permission mode
- Split panes require tmux or iTerm2

---

## Cost Considerations

Agent teams use significantly more tokens than single sessions:
- Each teammate has its own context window
- Token usage scales linearly with active teammates
- Worthwhile for research, review, and new features
- Not cost-effective for routine single-file edits

---

## Validation Checklist

- [ ] Task genuinely benefits from parallelism (not sequential work)
- [ ] Each teammate owns different files (no conflict risk)
- [ ] Spawn prompts include sufficient task-specific context
- [ ] Team size is appropriate (3-5 for most workflows)
- [ ] Quality gates (hooks) set up for critical workflows
- [ ] Plan approval required for risky operations
- [ ] Cost implications considered

---

**Source**: [Claude Code Agent Teams](https://code.claude.com/docs/en/agent-teams) | [Effective Harnesses for Long-Running Agents](https://www.anthropic.com/engineering/effective-harnesses-for-long-running-agents) | [Building Agents with the Claude Agent SDK](https://www.anthropic.com/engineering/building-agents-with-the-claude-agent-sdk)
