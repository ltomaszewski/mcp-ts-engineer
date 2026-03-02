# [mcp-ts-engineer] feat: create nextjs-seo skill files

**Source**: https://github.com/ltomaszewski/mcp-ts-engineer/issues/10
**Issue**: #10
**Project**: mcp-ts-engineer
**Status**: TODO

---

## Description

---
project: mcp-ts-engineer
path: packages/mcp-ts-engineer
type: feat
status: draft
created: 2026-03-02
appetite: 1 day
shaped: true
session: "Create nextjs-seo skill with SKILL.md and 3 knowledge-base files"
---

# Create nextjs-seo Skill Files

## Dependencies

| Issue | Relation | Reason |
|-------|----------|--------|
| #9 | parent | Epic: add nextjs-seo skill, template SEO scaffolding, and Markdown middleware |

## Context

Every Next.js app scaffolded from the mcp-ts-engineer template needs SEO and AI readability guidance. AI agents implementing SEO features need a comprehensive skill that covers JSON-LD structured data, AI discovery infrastructure (robots.txt, sitemap, llms.txt), and Markdown middleware for AI crawlers.

This sub-task creates the foundational skill files that establish patterns and conventions. Subsequent sub-tasks (#2: template files, #3: integration) build on the patterns defined here.

## Appetite

**1 day** — 4 skill files following the established `_SKILL_TEMPLATE.md` format. Knowledge-base content derived from research on llms.txt spec, Cloudflare Markdown for Agents, Next.js metadata API, and JSON-LD best practices.

---

## Requirements

- [ ] FR-1: Create `SKILL.md` at `.claude/skills/nextjs-seo/SKILL.md` following `_SKILL_TEMPLATE.md` format (YAML frontmatter with `name` and `description`, sections: When to Use, Critical Rules, Core Patterns, Anti-Patterns, Quick Reference, Deep Dive References)
- [ ] FR-2: SKILL.md description includes "Use when" triggers: implementing SEO, adding JSON-LD, configuring robots.txt, setting up sitemap, adding llms.txt, building AI readability, serving markdown to AI bots
- [ ] FR-3: Create `01-structured-data.md` covering: JSON-LD with `schema-dts` types, `safeJsonLdStringify()` pattern (XSS mitigation via `.replace(/</g, '\\u003c')`), `JsonLdScript` Server Component, common schema types (WebSite, Organization, Article, Product, BreadcrumbList), Next.js `generateMetadata` API patterns
- [ ] FR-4: Create `02-ai-discovery.md` covering: `robots.ts` with AI crawler allowlist (20+ user-agents), `sitemap.ts` dynamic generation, `llms.txt` standard (format from llmstxt.org — H1 title required, optional blockquote summary, H2 sections with markdown links), `NEXT_PUBLIC_SITE_URL` env var usage, OG/Twitter card metadata via `generateMetadata`
- [ ] FR-5: Create `03-markdown-middleware.md` covering: middleware architecture (thin UA detection + URL rewrite to API route), `AI_BOT_PATTERNS` regex array, `Accept: text/markdown` content negotiation (Cloudflare convention), API route with `linkedom` + `@mozilla/readability` + `turndown` for HTML→Markdown, `X-Markdown-Bypass` header for infinite loop prevention, response headers (`Content-Type: text/markdown`, `Vary: Accept, User-Agent`, `Cache-Control: public, s-maxage=3600`), error handling for conversion failures

## Non-Goals

- NG-1: No template files in this sub-task (covered in sub-task #2)
- NG-2: No code modifications (covered in sub-task #3)
- NG-3: No runtime SEO auditing or Lighthouse integration
- NG-4: No CMS integration

---

## User Scenarios

### P1: AI agent loads SEO skill for implementation guidance
**As an** AI agent implementing SEO features in a Next.js app, **I want to** load the `nextjs-seo` skill via `/nextjs-seo`, **So that** I follow correct patterns for JSON-LD, robots.txt, and AI readability.

**Acceptance Criteria:**
- Given the skill is loaded, When implementing JSON-LD, Then the agent uses `safeJsonLdStringify()` with XSS mitigation (never raw `JSON.stringify` in script tags)
- Given the skill is loaded, When adding robots.txt, Then the agent includes the full AI crawler allowlist from the skill
- Given the skill is loaded, When building middleware, Then the agent follows the thin-middleware + API-route architecture (no heavy imports in middleware)

---

## Architecture

4 files following the standard skill directory structure:

```
.claude/skills/nextjs-seo/
├── SKILL.md                    # Main skill definition
├── 01-structured-data.md       # JSON-LD, schema-dts, metadata
├── 02-ai-discovery.md          # robots.txt, sitemap, llms.txt
└── 03-markdown-middleware.md   # Bot detection, middleware, conversion
```

### Alternatives Considered

| Approach | Pros | Cons | Decision |
|----------|------|------|----------|
| Single SKILL.md with everything inlined | Simpler, one file | Too long (>300 lines), hard to maintain | ❌ Rejected |
| 3 knowledge-base files + SKILL.md | Organized by concern, scannable, follows established pattern | More files | ✅ Chosen |

---

## Affected Files

| File | Action | Purpose |
|------|--------|---------|
| `.claude/skills/nextjs-seo/SKILL.md` | CREATE | Main skill: frontmatter, rules, core patterns, references to deep-dive files |
| `.claude/skills/nextjs-seo/01-structured-data.md` | CREATE | JSON-LD patterns, schema-dts usage, XSS mitigation, JsonLdScript component |
| `.claude/skills/nextjs-seo/02-ai-discovery.md` | CREATE | robots.ts, sitemap.ts, llms.txt, OG/Twitter metadata patterns |
| `.claude/skills/nextjs-seo/03-markdown-middleware.md` | CREATE | Middleware architecture, bot detection, HTML→Markdown conversion |

---

## Implementation Notes

- **Skill template format**: Follow `_SKILL_TEMPLATE.md` exactly — YAML frontmatter (`name`, `description`), standardized sections. Reference existing skills like `expo-router/SKILL.md` and `anthropic-prompt-engineering/SKILL.md` for structure
- **Knowledge-base naming**: Use `01-`, `02-`, `03-` prefix convention (not `knowledge-base/` subdirectory — the issue spec uses flat numbering)
- **AI bot user-agent list** (for `02-ai-discovery.md`): Include at minimum: GPTBot, OAI-SearchBot, ChatGPT-User, ClaudeBot, Claude-Web, anthropic-ai, Google-Extended, Gemini-Deep-Research, GoogleAgent-Mariner, Google-CloudVertexBot, PerplexityBot, Perplexity-User, Meta-ExternalAgent, Applebot-Extended, Bytespider, xAI-Bot, DeepseekBot, Cohere-AI, MistralAI-User, Amazonbot, DuckAssistBot, CCBot, Diffbot
- **XSS mitigation pattern** (for `01-structured-data.md`): The critical pattern is `JSON.stringify(data).replace(/</g, '\\u003c')` — this prevents `</script>` breakout in JSON-LD script tags. This is the official Next.js recommended approach (see [Next.js JSON-LD guide](https://nextjs.org/docs/app/guides/json-ld))
- **Middleware architecture** (for `03-markdown-middleware.md`): Middleware is thin (Edge-compatible) — only inspects `User-Agent` header and `Accept` header, then rewrites URL to `/api/markdown/[...path]`. The API route (Node.js runtime) does the heavy conversion using `linkedom` + `@mozilla/readability` + `turndown`. This split is necessary because `linkedom`/`readability` are not Edge-compatible
- **llms.txt format** (for `02-ai-discovery.md`): Markdown format per [llmstxt.org](https://llmstxt.org/) — `# Title` (required), `> Summary` (optional), `## Sections` with `- [Link](url): description` entries
- **Content negotiation** (for `03-markdown-middleware.md`): Support both UA-based detection AND `Accept: text/markdown` header (the Cloudflare "Markdown for Agents" convention). When `Accept` header includes `text/markdown`, serve markdown regardless of user-agent

## Implementation Phases

- Phase 1: Create SKILL.md with frontmatter, sections, and references
- Phase 2: Create 3 knowledge-base files with patterns and code examples

---

## Testing Strategy

- **Unit**: Verify skill files exist and follow `_SKILL_TEMPLATE.md` structure (YAML frontmatter present, required sections present)
- **Integration**: N/A (skill files are static markdown)
- **E2E**: N/A

---

## Cross-Cutting Concerns

- **Security**: `01-structured-data.md` must prominently document the XSS risk and mitigation — this is the most common JSON-LD security issue
- **Performance**: `03-markdown-middleware.md` must document that middleware runs on every request — keep it thin, use `matcher` config to exclude static assets

---

## References

- [llms.txt specification](https://llmstxt.org/)
- [Cloudflare Markdown for Agents](https://blog.cloudflare.com/markdown-for-agents/)
- [Next.js JSON-LD guide](https://nextjs.org/docs/app/guides/json-ld)
- [Next.js robots.ts](https://nextjs.org/docs/app/api-reference/file-conventions/metadata/robots)
- [Next.js sitemap.ts](https://nextjs.org/docs/app/api-reference/file-conventions/metadata/sitemap)
- [AI crawler user-agents list](https://www.searchenginejournal.com/ai-crawler-user-agents-list/558130/)
- [JSON-LD XSS issue #79593](https://github.com/vercel/next.js/issues/79593)
- Existing skill examples: `.claude/skills/expo-router/SKILL.md`, `.claude/skills/anthropic-prompt-engineering/SKILL.md`
- Skill template: `.claude/skills/_SKILL_TEMPLATE.md`

---

## For Implementation

| Field | Value |
|-------|-------|
| **Project** | `packages/mcp-ts-engineer` |
| **Workspace** | `-w packages/mcp-ts-engineer` |
| **Test** | `npm test -w packages/mcp-ts-engineer` |
| **Build** | `npm run build -w packages/mcp-ts-engineer` |

**To implement:**
```
/issue-implement {number}
```

---

## Metadata

| Field | Value |
|-------|-------|
| Imported | 2026-03-02 |
| State | OPEN |
| Labels | project:mcp-ts-engineer, type:feature, status:draft, shaped, execution-order:1 |
| Project | mcp-ts-engineer |

---

## Next Steps

```bash
# Review and refine spec
/todo-review docs/specs/mcp-ts-engineer/todo/2026-03-02-create-nextjs-seo-skill-files.md

# Implement with code writer
mcp__ts-engineer__todo_code_writer spec_path="docs/specs/mcp-ts-engineer/todo/2026-03-02-create-nextjs-seo-skill-files.md"
```
