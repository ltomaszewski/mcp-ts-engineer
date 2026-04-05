---
name: anthropic-prompt-engineering
description: "Anthropic prompt engineering — prompts, system instructions, skills, CLAUDE.md, agents, tools, caching."
when_to_use: "Use when designing prompts, writing SKILL.md, building agents, creating CLAUDE.md rules, or optimizing caching."
---

# Anthropic Prompt Engineering

> Official best practices for writing effective prompts for Claude models. Create prompts that produce consistent, reliable results every time.

---

## When to Use

**LOAD THIS SKILL** when user is:
- Designing a new prompt or system instruction
- Creating Claude Code skills, commands, or agents
- Building or debugging SKILL.md files with YAML frontmatter
- Troubleshooting inconsistent prompt outputs
- Optimizing prompts for cost/latency with caching
- Writing tool definitions for function calling
- Implementing chain of thought or extended thinking
- Evaluating and testing prompt effectiveness
- Distributing skills via API, Claude.ai, or Claude Code

---

## Critical Rules

**ALWAYS:**
1. Be clear and direct — Think of Claude as a brilliant but new employee (with amnesia) who needs explicit instructions; doesn't have context on your norms, styles, or guidelines
2. Use examples wrapped in `<example>` tags — Examples are one of the most effective ways to improve model response quality and consistency
3. Put long documents (20K+ tokens) at the top of prompts — Placing content above queries can improve response quality by up to 30%
4. Use system prompts for role setting — Most powerful way to set Claude's behavior and establish expertise
5. Use XML tags for structure — Clearly delineate different parts of prompts (context, instructions, examples) to reduce errors
6. Give Claude space to think with `<thinking>` tags — Dramatically improves performance on complex tasks like research, analysis, or problem-solving

**NEVER:**
1. Assume Claude has context about your norms/guidelines — Must provide explicit instructions for every aspect
2. Skip examples for complex tasks — Abstract instructions alone produce inconsistent results; show, don't just tell
3. Place queries before long documents — Reduces response quality significantly; always put documents first
4. Use vague output requirements — Say "output 3-5 bullet points" not "summarize"; be specific about format

---

## Deep Dive References

Load additional context when needed:

| When you need | Load |
|---------------|------|
| Complete overview and learning paths | [knowledge-base/00-master-index.md](knowledge-base/00-master-index.md) |
| Core principles (7 golden rules) | [knowledge-base/01-core-principles.md](knowledge-base/01-core-principles.md) |
| XML tag patterns and structure | [knowledge-base/02-prompt-structure.md](knowledge-base/02-prompt-structure.md) |
| System prompt design for agents | [knowledge-base/03-system-prompts.md](knowledge-base/03-system-prompts.md) |
| Chain of thought implementation | [knowledge-base/04-chain-of-thought.md](knowledge-base/04-chain-of-thought.md) |
| Extended thinking mode details | [knowledge-base/05-extended-thinking.md](knowledge-base/05-extended-thinking.md) |
| Tool use and function calling | [knowledge-base/06-tool-use.md](knowledge-base/06-tool-use.md) |
| Agentic prompt patterns | [knowledge-base/07-agentic-prompts.md](knowledge-base/07-agentic-prompts.md) |
| Multi-step workflows and chaining | [knowledge-base/08-prompt-chaining.md](knowledge-base/08-prompt-chaining.md) |
| Caching and cost optimization | [knowledge-base/09-optimization.md](knowledge-base/09-optimization.md) |
| Testing and evaluation strategies | [knowledge-base/10-testing.md](knowledge-base/10-testing.md) |
| Ready-to-use templates | [knowledge-base/11-templates.md](knowledge-base/11-templates.md) |
| Building skills (SKILL.md, frontmatter, testing) | [knowledge-base/12-skills.md](knowledge-base/12-skills.md) |
| Agent teams and multi-agent orchestration | [knowledge-base/13-agent-teams.md](knowledge-base/13-agent-teams.md) |
| CLAUDE.md architecture, @include, memory | [knowledge-base/14-claude-md.md](knowledge-base/14-claude-md.md) |
| Production patterns from Claude Code source | [knowledge-base/15-claude-code-patterns.md](knowledge-base/15-claude-code-patterns.md) |

---

## Core Patterns

### Basic Structured Prompt with XML Tags

```xml
<context>
You are a senior data analyst at AcmeCorp preparing quarterly reports for executives.
This report will be used to make strategic decisions about product development.
</context>

<instructions>
1. Analyze the provided data
2. Identify top 3 trends
3. Format as bullet points, max 20 words each
</instructions>

<data>
{{SPREADSHEET_DATA}}
</data>

<output_format>
- [Trend 1]: [Insight]
- [Trend 2]: [Insight]
- [Trend 3]: [Insight]
</output_format>
```

### Chain of Thought Prompting

```xml
<instructions>
Think through this problem step-by-step in <thinking> tags.
Then provide your final answer in <answer> tags.
</instructions>

<problem>
A store sells apples at $0.50 each. If I buy 3 apples, I get 1 free. How much do I pay for 10 apples?
</problem>
```

### Long Document Optimization

```xml
<!-- Put documents FIRST (20K+ tokens) -->
<document>
{{LARGE_CONTRACT_TEXT}}
</document>

<!-- Then instructions AFTER -->
<instructions>
1. Find and quote relevant clauses about liability in <quotes> tags
2. Based on these quotes, analyze the risk in <analysis> tags
</instructions>
```

---

## Anti-Patterns

**BAD** — Vague, unstructured prompt:
```
Analyze this document and tell me about it.
```

**GOOD** — Clear structure with explicit output format:
```xml
<document>
{{CONTENT}}
</document>

<instructions>
1. Identify the main themes in <themes> tags (3-5 themes)
2. List key findings in <findings> tags (bullet points)
3. Provide 2-3 actionable recommendations in <recommendations> tags
</instructions>
```

**BAD** — Query before long document:
```xml
<instructions>
Summarize the key risks in this contract.
</instructions>

<contract>
{{50_PAGE_CONTRACT}}
</contract>
```

**GOOD** — Document before query:
```xml
<contract>
{{50_PAGE_CONTRACT}}
</contract>

<instructions>
Summarize the key risks in this contract. Output as bullet points.
</instructions>
```

**BAD** — No examples for complex task:
```
Extract product names and prices from customer emails.
```

**GOOD** — Examples showing desired behavior:
```xml
<examples>
  <example>
    <input>I'd like to order the Pro Widget for $299</input>
    <output>{"product": "Pro Widget", "price": 299}</output>
  </example>
  <example>
    <input>Can I get 2 Basic Gadgets at $49 each?</input>
    <output>{"product": "Basic Gadget", "price": 49, "quantity": 2}</output>
  </example>
</examples>

<input>
{{CUSTOMER_EMAIL}}
</input>
```

---

## Quick Reference

| Task | Technique | Example |
|------|-----------|---------|
| Increase consistency | Multishot prompting | Wrap 3-5 examples in `<example>` tags |
| Control output format | Structured outputs or XML tags | Use structured outputs API for JSON schemas, XML tags for text |
| Complex reasoning | Chain of thought | Ask Claude to think in `<thinking>` tags |
| Set behavior/expertise | System prompt | Use system parameter for role definition |
| Long documents (20K+) | Put content first | Documents above queries and instructions |
| Reduce errors | XML tags | Use `<context>`, `<instructions>`, `<input>` |
| Ground in sources | Citation pattern | Ask for `<quotes>` before `<analysis>` |
| Guaranteed JSON | Structured Outputs | Use Structured Outputs API for schema validation |
| Optimize cost | Prompt caching | Cache system prompts and long documents |
| Adaptive thinking | Set effort parameter | Use `effort: "high"` for complex, `"medium"` for standard |
| Improve prompts | Anthropic Console | Use built-in prompt improver tool |

---

## Claude 4.6 Enhancements

Claude 4.6 models (Opus 4.6, Sonnet 4.6) and Haiku 4.5 have significant improvements:

- **Adaptive thinking**: `thinking: {type: "adaptive"}` replaces manual `budget_tokens` — Claude decides when and how much to think. Control depth with `effort` parameter (low/medium/high/max)
- **More proactive**: Claude 4.6 takes action by default; dial back aggressive tool-triggering language from older prompts ("CRITICAL: MUST use" → "Use when...")
- **Context awareness**: Model tracks remaining context window, enabling better state management across long sessions
- **Prefill deprecated**: Use structured outputs, XML tags, or direct instructions instead
- **Anti-overengineering**: Add explicit guidance to prevent extra files, unnecessary abstractions, defensive coding for impossible scenarios
- **Subagent orchestration**: Claude 4.6 spawns subagents proactively; add guidance on when direct work is better
- **LaTeX default**: Opus 4.6 defaults to LaTeX for math; explicitly request plain text if needed
- **More concise**: May skip verbal summaries after tool calls; request summaries explicitly if desired

---

**Version:** Claude 4.6 (Opus 4.6, Sonnet 4.6, Haiku 4.5) | **Source:** https://docs.anthropic.com/en/docs/build-with-claude/prompt-engineering/claude-4-best-practices, [Building Skills Guide](https://resources.anthropic.com/hubfs/The-Complete-Guide-to-Building-Skill-for-Claude.pdf)
