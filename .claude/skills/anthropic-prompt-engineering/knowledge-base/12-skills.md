# 12: Building Skills for Claude

**Source**: Anthropic Official Guide — "The Complete Guide to Building Skills for Claude" (2026) + Agent Skills Engineering Blog
**Principle**: Skills are structured instruction folders that teach Claude to handle specific tasks consistently, using progressive disclosure to minimize token usage.

---

## What is a Skill?

A skill is a folder containing:

- **SKILL.md** (required): Instructions in Markdown with YAML frontmatter
- **scripts/** (optional): Executable code (Python, Bash, etc.)
- **references/** (optional): Documentation loaded as needed
- **assets/** (optional): Templates, fonts, icons used in output

```
your-skill-name/
├── SKILL.md              # Required - main skill file
├── scripts/              # Optional - executable code
│   ├── process_data.py
│   └── validate.sh
├── references/           # Optional - documentation
│   ├── api-guide.md
│   └── examples/
└── assets/               # Optional - templates, etc.
    └── report-template.md
```

Skills work identically across Claude.ai, Claude Code, and API — create once, use everywhere.

---

## Core Design Principles

### Progressive Disclosure (Three-Level System)

| Level | What | When Loaded |
|-------|------|-------------|
| **1. YAML Frontmatter** | Name + description | Each turn (as `<system-reminder>` user message) |
| **2. SKILL.md Body** | Full instructions | When Claude thinks skill is relevant |
| **3. Linked Files** | References, scripts, assets | When Claude navigates to them on demand |

> **Important:** Skills are NOT part of the system prompt. They are injected as `<system-reminder>` wrapped user messages each turn via the attachment system. This means they don't break prompt cache and are refreshed every turn.

This minimizes token usage while maintaining specialized expertise.

### Composability

Claude can load multiple skills simultaneously. Your skill should work well alongside others, not assume it's the only capability available.

### Portability

Same skill works across Claude.ai, Claude Code, and API without modification (provided the environment supports any dependencies).

---

## How Skills Compete for Context

Each turn, ALL skills are listed in a `<system-reminder>` user message. Total budget: ~1% of context window (~8,000 characters, configurable via `SKILL_BUDGET_CONTEXT_PERCENT`).

| Category | Budget Treatment |
|----------|-----------------|
| Bundled skills | Always full description (never truncated) |
| Non-bundled skills | Share remaining budget proportionally |
| Over budget | Descriptions truncated, then reduced to name-only |

**Per-entry cap:** Each skill's listing entry is capped at **250 characters** (`MAX_LISTING_DESC_CHARS`). Content beyond 250 chars is silently truncated.

**Practical impact:** If you have 50+ skills installed, your custom skill descriptions may be truncated to just the skill name. Keep `description` + `when_to_use` concise and front-load trigger keywords.

---

## YAML Frontmatter (Most Important Part)

The frontmatter is how Claude decides whether to load your skill. Get this right.

### Complete Frontmatter Reference

```yaml
---
# REQUIRED
name: your-skill-name                # kebab-case, must match folder name
description: "What it does."         # ≤200 chars recommended (see budget cap below)

# RECOMMENDED
when_to_use: "Use when..."           # Trigger phrases (NOTE: underscore, not hyphen)
allowed-tools: [Read, Bash, Grep]    # Tool whitelist when skill runs
user-invocable: true                 # Allow /skill-name invocation

# OPTIONAL
argument-hint: "<filename>"          # Shows in autocomplete
arguments: [$var1, $var2]            # Named arguments for $var substitution
context: fork                        # fork = isolated sub-agent; inline = expand in context (default)
agent: general-purpose               # Agent type for fork mode
model: claude-sonnet-4-6             # Model override
effort: high                         # Thinking depth: low/medium/high/max
disable-model-invocation: true       # Hide from Skill tool (user-only)
license: MIT                         # Open source license
compatibility: "Requires network"    # 1-500 chars, environment needs
shell: bash                          # Shell for command hooks
paths: ["src/**/*.ts"]               # Only load for matching file paths
hooks:                               # Hook definitions
  PreToolUse:
    - type: command
      command: "validate.sh"
      if: "Bash(git push*)"
metadata:
  author: Company Name
  version: 1.0.0
  mcp-server: server-name
  category: productivity
  tags: [project-management, automation]
---
```

### Required Fields

**name:**
- kebab-case only (no spaces, capitals, or underscores)
- Must match folder name
- Example: `notion-project-setup`

**description:**
- What the skill does — its capabilities and scope
- Under 1024 characters, no XML tags (`<` or `>`)

### Critical: `when_to_use` Field

Anthropic's own `skillify` tool calls this field **"CRITICAL"**. It contains trigger phrases that help Claude decide when to load the skill.

> **Casing trap:** `when_to_use` uses UNDERSCORE. Most other fields (`allowed-tools`, `argument-hint`, `user-invocable`) use HYPHENS. This inconsistency is in the source parser (`loadSkillsDir.ts`).

> **Budget cap:** Your `description` + ` - ` + `when_to_use` is truncated to **250 characters** in the per-turn skill listing. Front-load the most important trigger keywords. Content beyond 250 chars is silently truncated.

### Security Restrictions

**Forbidden in frontmatter:**
- XML angle brackets (`<` `>`)
- Skills with "claude" or "anthropic" in name (reserved)

---

## Writing Good Descriptions

### Structure

`[What it does]` + `[When to use it]` + `[Key capabilities]`

### Good Descriptions

```yaml
# Specific and actionable
description: Analyzes Figma design files and generates developer handoff
  documentation. Use when user uploads .fig files, asks for "design specs",
  "component documentation", or "design-to-code handoff".

# Includes trigger phrases
description: Manages Linear project workflows including sprint planning,
  task creation, and status tracking. Use when user mentions "sprint",
  "Linear tasks", "project planning", or asks to "create tickets".

# Clear value proposition
description: End-to-end customer onboarding workflow for PayFlow. Handles
  account creation, payment setup, and subscription management. Use when
  user says "onboard new customer", "set up subscription", or "create
  PayFlow account".
```

### Bad Descriptions

```yaml
# Too vague
description: Helps with projects.

# Missing triggers
description: Creates sophisticated multi-page documentation systems.

# Too technical, no user triggers
description: Implements the Project entity model with hierarchical relationships.
```

### Debugging Trigger Issues

Ask Claude: "When would you use the [skill name] skill?" — Claude will quote the description back. Adjust based on what's missing.

---

## Writing the Main Instructions

### Recommended Structure

```markdown
---
name: your-skill
description: [...]
---

# Your Skill Name

## Instructions

### Step 1: [First Major Step]
Clear explanation of what happens.

```bash
python scripts/fetch_data.py --project-id PROJECT_ID
Expected output: [describe what success looks like]
```

(Add more steps as needed)

## Examples

Example 1: [common scenario]
User says: "Set up a new marketing campaign"

Actions:
1. Fetch existing campaigns via MCP
2. Create new campaign with provided parameters

Result: Campaign created with confirmation link

## Troubleshooting

Error: [Common error message]
Cause: [Why it happens]
Solution: [How to fix]
```

### Best Practices for Instructions

**Be specific and actionable:**

```markdown
# Good
Run `python scripts/validate.py --input {filename}` to check data format.
If validation fails, common issues include:
- Missing required fields (add them to the CSV)
- Invalid date formats (use YYYY-MM-DD)

# Bad
Validate the data before proceeding.
```

**Reference bundled resources clearly:**

```markdown
Before writing queries, consult `references/api-patterns.md` for:
- Rate limiting guidance
- Pagination patterns
- Error codes and handling
```

**Use progressive disclosure:**
Keep SKILL.md focused on core instructions. Move detailed documentation to `references/` and link to it.

**Include error handling:**

```markdown
## Common Issues

### MCP Connection Failed
If you see "Connection refused":
1. Verify MCP server is running: Check Settings > Extensions
2. Confirm API key is valid
3. Try reconnecting: Settings > Extensions > [Service] > Reconnect
```

**For critical validations, use bundled scripts** rather than relying on language instructions. Code is deterministic; language interpretation isn't.

**Handle model laziness with encouragement:**

```markdown
## Performance Notes
- Take your time to do this thoroughly
- Quality is more important than speed
- Do not skip validation steps
```

Note: Adding encouragement to user prompts is often more effective than putting it in SKILL.md.

---

## Skill Use Case Categories

### Category 1: Document & Asset Creation

Creating consistent, high-quality output (documents, presentations, code, designs).

**Key techniques:**
- Embedded style guides and brand standards
- Template structures for consistent output
- Quality checklists before finalizing
- No external tools required — uses Claude's built-in capabilities

### Category 2: Workflow Automation

Multi-step processes that benefit from consistent methodology.

**Key techniques:**
- Step-by-step workflow with validation gates
- Templates for common structures
- Built-in review and improvement suggestions
- Iterative refinement loops

### Category 3: MCP Enhancement

Workflow guidance layered on top of MCP tool access.

**Key techniques:**
- Coordinates multiple MCP calls in sequence
- Embeds domain expertise
- Provides context users would otherwise need to specify
- Error handling for common MCP issues

---

## Skills + MCP Integration

### The Kitchen Analogy

- **MCP** provides the professional kitchen: tools, ingredients, equipment
- **Skills** provide the recipes: step-by-step instructions

### Without Skills (MCP Only)
- Users connect MCP but don't know what to do next
- Support tickets asking "how do I do X?"
- Each conversation starts from scratch
- Inconsistent results

### With Skills (MCP + Skills)
- Pre-built workflows activate automatically when needed
- Consistent, reliable tool usage
- Best practices embedded in every interaction
- Lower learning curve

---

## Execution Context: Inline vs Fork

| Mode | Behavior | Use When |
|------|----------|----------|
| `inline` (default) | Content expands into current conversation | Quick patterns, simple workflows, token-light operations |
| `context: fork` | Runs in isolated sub-agent | Expensive analysis, long outputs, research tasks |

**Inline:** Skill output stays in main context window, consuming tokens for the rest of the conversation. Ideal for most skills.

**Fork:** Runs in separate context, returns only result. Main context stays clean. Has overhead (~2-3 seconds setup) — don't use for trivial skills.

```yaml
---
name: deep-analysis
context: fork
agent: general-purpose
model: claude-opus-4-6
effort: high
---
```

> **Compaction vulnerability:** Fork-mode skill outputs return as conversation messages. These get summarized during auto-compaction. If fork output contains critical state, persist it to a file.

---

## Hooks in Skills

Skills can register hooks via frontmatter:

```yaml
---
name: safe-deploy
hooks:
  PreToolUse:
    - type: command
      command: "scripts/validate-push.sh"
      if: "Bash(git push*)"
    - type: prompt
      prompt: "Verify this tool call is safe: $ARGUMENTS"
      model: claude-haiku-4-5
  PostToolUse:
    - type: command
      command: "scripts/log-tool.sh $TOOL_NAME"
---
```

**4 hook types:**

| Type | Behavior | Use When |
|------|----------|----------|
| `command` | Runs shell command | Validation scripts, logging |
| `prompt` | LLM evaluates the action | Safety checks, policy enforcement |
| `http` | Sends webhook | External system notification |
| `agent` | Multi-turn AI verification | Complex validation requiring reasoning |

**Hook conditions:** The `if` field supports glob patterns matching `ToolName(arguments)` format. Example: `Bash(git push*)` matches any Bash tool call starting with "git push".

---

## Arguments and Variables

### Frontmatter

```yaml
---
name: deploy
arguments: [$environment, $branch]
argument-hint: "<environment> [branch]"
user-invocable: true
---
```

### Variable Substitution in Skill Body

| Variable | Resolves To |
|----------|-------------|
| `$ARGUMENTS` | Raw args string from invocation |
| `$var_name` | Named argument from `arguments:` list |
| `${CLAUDE_SKILL_DIR}` | Absolute path to skill directory |
| `${CLAUDE_SESSION_ID}` | Current session ID |

### Example

```markdown
Deploy to $environment on branch $branch.
Read the deployment checklist at ${CLAUDE_SKILL_DIR}/references/deploy-guide.md
```

When invoked as `/deploy production main`, `$environment` resolves to "production" and `$branch` to "main".

---

## Skill Patterns

### Pattern 1: Sequential Workflow Orchestration

Use when: Users need multi-step processes in a specific order.

```markdown
## Workflow: Onboard New Customer

### Step 1: Create Account
Call MCP tool: `create_customer`
Parameters: name, email, company

### Step 2: Setup Payment
Call MCP tool: `setup_payment_method`
Wait for: payment method verification

### Step 3: Create Subscription
Call MCP tool: `create_subscription`
Parameters: plan_id, customer_id (from Step 1)

### Step 4: Send Welcome Email
Call MCP tool: `send_email`
Template: welcome_email_template
```

**Key techniques:** Explicit step ordering, dependencies between steps, validation at each stage, rollback instructions for failures.

### Pattern 2: Multi-MCP Coordination

Use when: Workflows span multiple services.

```markdown
### Phase 1: Design Export (Figma MCP)
1. Export design assets
2. Generate specifications
3. Create asset manifest

### Phase 2: Asset Storage (Drive MCP)
1. Create project folder
2. Upload all assets
3. Generate shareable links

### Phase 3: Task Creation (Linear MCP)
1. Create development tasks
2. Attach asset links
3. Assign to team

### Phase 4: Notification (Slack MCP)
1. Post handoff summary to #engineering
2. Include asset links and task references
```

**Key techniques:** Clear phase separation, data passing between MCPs, validation before moving to next phase, centralized error handling.

### Pattern 3: Iterative Refinement

Use when: Output quality improves with iteration.

```markdown
## Iterative Report Creation

### Initial Draft
1. Fetch data via MCP
2. Generate first draft
3. Save to temporary file

### Quality Check
1. Run validation script: `scripts/check_report.py`
2. Identify issues (missing sections, formatting, data errors)

### Refinement Loop
1. Address each identified issue
2. Regenerate affected sections
3. Re-validate
4. Repeat until quality threshold met

### Finalization
1. Apply final formatting
2. Generate summary
3. Save final version
```

**Key techniques:** Explicit quality criteria, iterative improvement, validation scripts, knowing when to stop.

### Pattern 4: Context-Aware Tool Selection

Use when: Same outcome requires different tools depending on context.

```markdown
## Smart File Storage

### Decision Tree
1. Check file type and size
2. Determine best storage:
   - Large files (>10MB): Cloud storage MCP
   - Collaborative docs: Notion/Docs MCP
   - Code files: GitHub MCP
   - Temporary files: Local storage

### Execute Storage
Based on decision:
- Call appropriate MCP tool
- Apply service-specific metadata
- Generate access link

### Provide Context to User
Explain why that storage was chosen
```

### Pattern 5: Domain-Specific Intelligence

Use when: Your skill adds specialized knowledge beyond tool access.

```markdown
## Payment Processing with Compliance

### Before Processing (Compliance Check)
1. Fetch transaction details via MCP
2. Apply compliance rules:
   - Check sanctions lists
   - Verify jurisdiction allowances
   - Assess risk level
3. Document compliance decision

### Processing
IF compliance passed:
- Process transaction
- Apply fraud checks
ELSE:
- Flag for review
- Create compliance case

### Audit Trail
- Log all compliance checks
- Record processing decisions
- Generate audit report
```

---

## Testing Skills

### Three Testing Areas

#### 1. Triggering Tests

Goal: Ensure your skill loads at the right times.

```markdown
Should trigger:
- "Help me set up a new ProjectHub workspace"
- "I need to create a project in ProjectHub"
- "Initialize a ProjectHub project for Q4 planning"

Should NOT trigger:
- "What's the weather in San Francisco?"
- "Help me write Python code"
- "Create a spreadsheet" (unless skill handles sheets)
```

#### 2. Functional Tests

Goal: Verify the skill produces correct outputs.

```markdown
Test: Create project with 5 tasks
Given: Project name "Q4 Planning", 5 task descriptions
When: Skill executes workflow
Then:
- Project created in ProjectHub
- 5 tasks created with correct properties
- All tasks linked to project
- No API errors
```

#### 3. Performance Comparison

Goal: Prove the skill improves results vs. baseline.

```markdown
Without skill:
- User provides instructions each time
- 15 back-and-forth messages
- 3 failed API calls
- 12,000 tokens consumed

With skill:
- Automatic workflow execution
- 2 clarifying questions only
- 0 failed API calls
- 6,000 tokens consumed
```

### Success Metrics

**Quantitative:**
- Skill triggers on 90%+ of relevant queries
- Completes workflow in X tool calls
- 0 failed API calls per workflow

**Qualitative:**
- Users don't need to prompt about next steps
- Workflows complete without user correction
- Consistent results across sessions

### Iteration Based on Feedback

**Undertriggering signals:** Skill doesn't load when it should, users manually enabling it.
- Fix: Add more detail and trigger keywords to description.

**Overtriggering signals:** Skill loads for irrelevant queries, users disabling it.
- Fix: Add negative triggers, be more specific.

**Execution issues:** Inconsistent results, API failures, user corrections needed.
- Fix: Improve instructions, add error handling.

---

## Distribution and Sharing

### For Individual Users

1. Download the skill folder
2. Zip the folder
3. Upload to Claude.ai via Settings > Capabilities > Skills
4. Or place in Claude Code skills directory

### For Organizations

- Admins can deploy skills workspace-wide
- Automatic updates
- Centralized management

### Via API

See [Skills API](#skills-api-programmatic-access) section for full programmatic access details including the `/v1/skills` endpoint, `container.skills` parameter, and Agent SDK integration.

### Recommended Approach

1. **Host on GitHub** — Public repo, clear README, example usage
2. **Link from MCP docs** — Explain value of using both together
3. **Provide quick-start guide** — Step-by-step installation

### Positioning Your Skill

**Focus on outcomes:**
```
"The ProjectHub skill enables teams to set up complete project workspaces
in seconds — instead of spending 30 minutes on manual setup."
```

**Not features:**
```
"The ProjectHub skill is a folder containing YAML frontmatter and Markdown
instructions that calls our MCP server tools."
```

---

## Skills API (Programmatic Access)

For building applications, agents, or automated workflows that leverage skills.

### Key Capabilities

| Feature | Details |
|---------|---------|
| Endpoint | `/v1/skills` for listing and managing skills |
| Messages API | Add skills via `container.skills` parameter |
| Console | Version control and management |
| Agent SDK | Works with Claude Agent SDK for custom agents |

### When to Use API vs Claude.ai

| Use Case | Best Surface |
|----------|-------------|
| End users interacting directly | Claude.ai / Claude Code |
| Manual testing and iteration | Claude.ai / Claude Code |
| Individual, ad-hoc workflows | Claude.ai / Claude Code |
| Applications using skills programmatically | API |
| Production deployments at scale | API |
| Automated pipelines and agent systems | API |

> **Note**: Skills in the API require the Code Execution Tool beta, which provides the secure environment skills need to run.

### Implementation References

- [Skills API Quickstart](https://docs.anthropic.com/en/docs/build-with-claude/agent-skills/quickstart)
- [Create Custom Skills](https://docs.anthropic.com/en/docs/build-with-claude/agent-skills/custom-skills)
- [Skills in the Agent SDK](https://docs.anthropic.com/en/docs/build-with-claude/agent-skills/agent-sdk)

---

## Agent Skills: Open Standard

Anthropic has published [Agent Skills](https://agentskills.io) as an **open standard** — like MCP, skills should be portable across tools and platforms.

### Key Principles

- Same skill works whether using Claude or other AI platforms
- Portable across Claude.ai, Claude Code, and API
- Some skills can take advantage of platform-specific capabilities
- Authors can note platform requirements in the `compatibility` field

### Ecosystem

- Early adopters collaborating on the standard
- Skills designed for composability alongside other capabilities
- Future direction: agents creating and evaluating their own skills autonomously

---

## Success Metrics

### Quantitative

| Metric | Target | How to Measure |
|--------|--------|----------------|
| Trigger accuracy | 90%+ on relevant queries | Run 10-20 test queries, track auto vs manual invocation |
| Workflow efficiency | Complete in X tool calls | Compare with and without skill enabled |
| API reliability | 0 failed calls per workflow | Monitor MCP server logs during test runs |
| Token efficiency | 50%+ reduction vs no skill | Count tool calls and total tokens consumed |

### Qualitative

| Signal | How to Assess |
|--------|---------------|
| Users don't need to prompt about next steps | During testing, note redirect/clarify frequency |
| Workflows complete without user correction | Run same request 3-5 times, compare consistency |
| Consistent results across sessions | Can a new user accomplish task on first try? |

---

## Troubleshooting

### Skill Won't Upload

| Error | Cause | Fix |
|-------|-------|-----|
| "Could not find SKILL.md" | Wrong filename | Rename to exactly `SKILL.md` (case-sensitive) |
| "Invalid frontmatter" | YAML formatting | Ensure `---` delimiters, close quotes |
| "Invalid skill name" | Name has spaces/capitals | Use kebab-case: `my-cool-skill` |

### Skill Doesn't Trigger — Diagnostic Checklist

> See also [How Skills Compete for Context](#how-skills-compete-for-context) above for budget details.

1. **Check listing cap:** Is `description` + ` - ` + `when_to_use` under 250 chars?
2. **Check visibility:** Ask Claude "List all available skills" — does your skill appear with its description?
3. **Check budget:** If description shows truncated or missing, too many skills compete for ~8K char budget
4. **Check `when_to_use`:** Does it contain explicit trigger phrases users would say?
5. **Check casing:** `when_to_use` uses UNDERSCORE; `allowed-tools` uses HYPHEN
6. **Check `disable-model-invocation`:** If `true`, skill won't appear in Skill tool
7. **Check `user-invocable`:** Must be `true` for /slash-command invocation

### Skill Triggers Too Often

1. Add negative triggers: "Do NOT use for simple data exploration"
2. Be more specific: "Processes PDF legal documents for contract review" vs "Processes documents"
3. Clarify scope: "specifically for online payment workflows, not for general financial queries"

### Instructions Not Followed

1. **Too verbose** — Keep concise, use bullet points, move detail to `references/`
2. **Buried** — Put critical instructions at top, use `## Important` headers
3. **Ambiguous** — Replace "validate things properly" with specific checklists
4. **Use scripts** — For critical validations, bundle a script instead of language instructions

### Frontmatter Gotchas

- `when_to_use` uses UNDERSCORE (not hyphen like `allowed-tools`)
- No XML brackets (`<` `>`) in description or when_to_use
- Invalid `effort` values silently ignored (valid: low, medium, high, max)
- `name` must match folder name exactly (kebab-case)

### Large Context Issues

- Keep SKILL.md under 5,000 words
- Move detailed docs to `references/`
- Evaluate if more than 20-50 skills enabled simultaneously
- Consider skill "packs" for related capabilities

---

## Critical Rules Summary

### Naming
- File: exactly `SKILL.md` (case-sensitive)
- Folder: kebab-case (`my-skill-name`)

### Frontmatter
- `---` delimiters required
- `name` and `description` required
- `when_to_use` strongly recommended (Anthropic calls it "CRITICAL")
- No XML angle brackets (`<` `>`)
- No "claude" or "anthropic" in name
- `description` + `when_to_use` under 250 chars combined for listing
- `when_to_use` uses UNDERSCORE (not hyphen)

### Instructions
- SKILL.md files use **Markdown**, not XML tags (XML tags are for prompts sent via the Messages API)
- Be specific and actionable
- Reference bundled resources by path
- Include error handling
- Use progressive disclosure (core in SKILL.md, detail in references/)
- Bundle validation scripts when determinism matters

---

## Quick Checklist

### Before You Start
- [ ] Identified 2-3 concrete use cases
- [ ] Tools identified (built-in or MCP)
- [ ] Planned folder structure

### During Development
- [ ] Folder named in kebab-case
- [ ] SKILL.md file exists (exact spelling)
- [ ] YAML frontmatter has `---` delimiters
- [ ] name field: kebab-case, no spaces, no capitals
- [ ] description includes WHAT and WHEN
- [ ] No XML tags anywhere
- [ ] Instructions are clear and actionable
- [ ] Error handling included
- [ ] Examples provided
- [ ] References clearly linked

### Before Upload
- [ ] Tested triggering on obvious tasks
- [ ] Tested triggering on paraphrased requests
- [ ] Verified doesn't trigger on unrelated topics
- [ ] Functional tests pass
- [ ] Compressed as .zip file

### After Upload
- [ ] Test in real conversations
- [ ] Monitor for under/over-triggering
- [ ] Collect user feedback
- [ ] Iterate on description and instructions

---

## Using the skill-creator Skill

Built into Claude.ai and available for Claude Code:

```
"Use the skill-creator skill to help me build a skill for [your use case]"
```

**It can:**
- Generate skills from descriptions
- Produce properly formatted SKILL.md with frontmatter
- Suggest trigger phrases and structure
- Review skills and flag issues
- Suggest test cases

**For iteration:**
After encountering edge cases, bring examples back:
```
"Use the issues identified in this chat to improve how the skill handles [specific edge case]"
```

---

**Next**: [13-agent-teams.md](13-agent-teams.md) - Agent teams and multi-agent orchestration

**Source**: [The Complete Guide to Building Skills for Claude](https://resources.anthropic.com/hubfs/The-Complete-Guide-to-Building-Skill-for-Claude.pdf) (Anthropic, 2026) | [Agent Skills Engineering Blog](https://www.anthropic.com/engineering/equipping-agents-for-the-real-world-with-agent-skills)
