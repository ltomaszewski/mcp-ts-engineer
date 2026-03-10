# Anthropic Prompt Engineering: Master Index

**Complete Knowledge Base for Writing Optimal Prompts for Claude Models**

**Source**: Anthropic Official Documentation (2025-2026)
**Version**: 1.0

---

## Overview

This knowledge base provides comprehensive guidance for writing prompts that produce consistent, reliable results with Claude models. All content is derived from Anthropic's official documentation, engineering blog posts, and best practices guides.

## Design Philosophy

**Goal**: Create prompts that work the same way every time by following proven patterns and principles from Anthropic's research.

**Key Insight**: "Context engineering involves curating and maintaining optimal tokens during LLM inference, moving beyond traditional prompt engineering to manage entire context states across multiple interaction turns."

---

## Module Summary

| Module | Purpose | Key Concepts |
|--------|---------|--------------|
| **01 Core Principles** | Foundational rules for all prompts | Clarity, explicitness, context, examples |
| **02 Prompt Structure** | How to organize prompts | XML tags, sections, formatting |
| **03 System Prompts** | Designing system instructions | Role definition, constraints, tools |
| **04 Chain of Thought** | Reasoning techniques | CoT, thinking tags, step-by-step |
| **05 Extended Thinking** | Advanced reasoning mode | Adaptive thinking, effort parameter, budget tokens, multishot |
| **06 Tool Use** | Function calling patterns | Tool definitions, descriptions, parallel |
| **07 Agentic Prompts** | Autonomous agent design | Context engineering, state management |
| **08 Prompt Chaining** | Multi-step workflows | Handoffs, verification, pipelines |
| **09 Optimization** | Caching and efficiency | Cache breakpoints, token efficiency |
| **10 Testing** | Evaluation and iteration | Empirical testing, debugging |
| **11 Templates** | Ready-to-use patterns | Claude Code skills, commands, agents |
| **12 Skills** | Building skills for Claude | SKILL.md, frontmatter, progressive disclosure, testing |
| **13 Agent Teams** | Multi-agent orchestration | Agent teams, subagents, shared tasks, messaging |

---

## Quick Reference: The 10 Golden Rules

1. **Be explicit** - Claude follows instructions precisely; say exactly what you want
2. **Provide context** - Explain why, not just what; Claude generalizes from motivation
3. **Use XML tags** - Structure content with `<tags>` for clarity and parseability
4. **Give examples** - 3-5 diverse examples dramatically improve consistency
5. **Think step-by-step** - Use chain of thought for complex reasoning tasks
6. **Match format** - Your prompt's style influences Claude's response style
7. **Test empirically** - Iterate based on actual outputs, not assumptions
8. **Manage context** - Place long content at top; use caching for repeated elements
9. **Design tools carefully** - Detailed descriptions are the #1 factor in tool performance
10. **Start minimal** - Add complexity only when simpler prompts fail

---

## Learning Paths

### Beginner: Basic Prompt Engineering
1. [Core Principles](01-core-principles.md) - Essential foundations
2. [Prompt Structure](02-prompt-structure.md) - XML tags and organization
3. [Testing](10-testing.md) - How to iterate effectively

### Intermediate: Reasoning and Tools
4. [Chain of Thought](04-chain-of-thought.md) - Step-by-step reasoning
5. [Extended Thinking](05-extended-thinking.md) - Advanced reasoning mode
6. [Tool Use](06-tool-use.md) - Function calling patterns

### Advanced: Agentic Systems
7. [System Prompts](03-system-prompts.md) - Complex instruction design
8. [Agentic Prompts](07-agentic-prompts.md) - Autonomous agent patterns
9. [Prompt Chaining](08-prompt-chaining.md) - Multi-step workflows
10. [Templates](11-templates.md) - Production-ready patterns
11. [Agent Teams](13-agent-teams.md) - Multi-agent orchestration patterns

### Specialist: Skills & Distribution
12. [Building Skills](12-skills.md) - SKILL.md structure, frontmatter, testing, distribution

---

## Source URLs

All content sourced from official Anthropic documentation:

- **Prompt Engineering Overview**: https://platform.claude.com/docs/en/build-with-claude/prompt-engineering/overview
- **Claude 4.x Best Practices**: https://platform.claude.com/docs/en/build-with-claude/prompt-engineering/claude-4-best-practices
- **Extended Thinking**: https://platform.claude.com/docs/en/build-with-claude/extended-thinking
- **Tool Use**: https://platform.claude.com/docs/en/build-with-claude/tool-use/implement-tool-use
- **Context Engineering**: https://www.anthropic.com/engineering/effective-context-engineering-for-ai-agents
- **Writing Tools for Agents**: https://www.anthropic.com/engineering/writing-tools-for-agents
- **Claude Code Best Practices**: https://www.anthropic.com/engineering/claude-code-best-practices
- **Think Tool**: https://www.anthropic.com/engineering/claude-think-tool
- **Prompt Caching**: https://platform.claude.com/docs/en/build-with-claude/prompt-caching
- **Advanced Tool Use**: https://www.anthropic.com/engineering/advanced-tool-use
- **Agent Teams**: https://code.claude.com/docs/en/agent-teams
- **Long-Running Agent Harnesses**: https://www.anthropic.com/engineering/effective-harnesses-for-long-running-agents
- **Agent Skills (Open Standard)**: https://www.anthropic.com/engineering/equipping-agents-for-the-real-world-with-agent-skills
- **Adaptive Thinking**: https://docs.anthropic.com/en/docs/build-with-claude/adaptive-thinking

---

**Last Updated**: March 2026 | **Status**: Production Ready
