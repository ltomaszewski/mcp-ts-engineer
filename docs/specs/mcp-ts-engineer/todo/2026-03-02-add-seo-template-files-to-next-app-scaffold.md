**App**: mcp-ts-engineer
**Status**: DRAFT
**Created**: 2026-03-02
**Issue**: #11
**Epic**: #9 (Next.js SEO)

# Add SEO Template Files to Next.js App Scaffold

## Summary

Add 11 SEO template files to `templates/apps/next-app/` that provide three-layer SEO infrastructure for scaffolded Next.js apps: discovery (robots/sitemap/llms.txt), metadata (JSON-LD/OG tags), and content serving (Markdown middleware for AI crawlers).

## Files to Create

### Layer 1: Discovery
1. `src/app/robots.ts.template` - robots.txt with 23+ AI bot allowlist
2. `src/app/sitemap.ts.template` - sitemap generation
3. `src/app/llms.txt/route.ts.template` - llms.txt endpoint (llmstxt.org standard)

### Layer 2: Metadata
4. `src/lib/seo/json-ld.ts.template` - buildWebSiteSchema() builder
5. `src/lib/seo/sanitize.ts.template` - safeJsonLdStringify() XSS mitigation
6. `src/lib/seo/metadata.ts.template` - buildSiteMetadata() for OG/Twitter
7. `src/components/seo/json-ld-script.tsx.template` - JsonLdScript Server Component

### Layer 3: Content Serving
8. `src/lib/seo/ai-bots.ts.template` - AI_BOT_PATTERNS, isAiBot(), wantsMarkdown()
9. `src/lib/seo/markdown-transform.ts.template` - htmlToMarkdown() using linkedom + readability + turndown
10. `src/middleware.ts.template` - bot detection + URL rewrite
11. `src/app/api/markdown/[...path]/route.ts.template` - HTML-to-Markdown API route

## Conventions

- All files use `.template` suffix
- Use `{{APP_NAME}}`, `{{PASCAL_NAME}}`, `{{PACKAGE_NAME}}` placeholders
- Use `NEXT_PUBLIC_SITE_URL` env var with `http://localhost:3000` fallback
- Import bot list from `@/lib/seo/ai-bots` (single source of truth)
- Follow patterns from `.claude/skills/nextjs-seo/` skill files

## Acceptance Criteria

- [ ] All 11 template files created in correct locations
- [ ] Files follow existing template conventions (placeholder syntax, TypeScript)
- [ ] robots.ts imports AI_BOT_USER_AGENTS from ai-bots module
- [ ] Existing tests pass without modification
- [ ] No hardcoded URLs (use NEXT_PUBLIC_SITE_URL)
- [ ] XSS-safe JSON-LD serialization via safeJsonLdStringify
- [ ] Middleware is Edge-compatible (no heavy imports)
- [ ] API route uses Node.js runtime for DOM parsing
