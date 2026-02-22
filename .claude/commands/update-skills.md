# /update-skills

Update all skill knowledge bases to match template system versions. Detects new template dependencies without skills and offers to create them. Uses Agent Teams with a version-scout phase followed by parallel updater and creator teammates.

$ARGUMENTS

---

<context>
- Skills directory: `.claude/skills/`
- Templates: `packages/mcp-ts-engineer/templates/apps/`
- Registry: `packages/mcp-ts-engineer/templates/apps/registry.json`
- Template packages: `templates/apps/*/package.json.template`
</context>

<rules>
ALWAYS: Enable agent teams before starting
ALWAYS: Run version-scout teammate FIRST before any updates
ALWAYS: Source ALL content from official documentation only
ALWAYS: Follow the mandatory skill file structure exactly
ALWAYS: Spawn replacement teammates on failure or context exhaustion
ALWAYS: Wait for all teammates to complete before verification
ALWAYS: Prompt user before creating new skills — never auto-create
NEVER: Update skills that are already at the correct version
NEVER: Use blogs, Medium, Stack Overflow, or AI-generated content as sources
NEVER: Guess or hallucinate API parameters — omit if unverifiable
NEVER: Skip the version-scout phase
NEVER: Let the lead edit skill files directly — delegate everything
NEVER: Restructure files — update content in-place, preserve filenames
</rules>

## Arguments

`$ARGUMENTS` = `<skill-name>` | `all` | empty

| Format | Example | Handling |
|--------|---------|----------|
| Skill name | `zustand` | Update only that skill |
| `all` | `all` | Update all skills |
| Empty | — | Ask user: update all or specific skill? |

---

## Prerequisites

Agent Teams must be enabled:

```json
// settings.json or environment
{
  "env": {
    "CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS": "1"
  }
}
```

If not enabled → STOP: "Enable Agent Teams first. Add `CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS=1` to settings.json env or shell environment."

---

## Workflow

### Step 1: Initialize

Enable agent teams. Use Opus for the lead and all teammates.

Tell the user:
```
Starting skill update pipeline...
Model: Opus (lead + all teammates)
Mode: Agent Teams
```

### Step 2: Spawn Version Scout

Spawn **Teammate 1 — "version-scout"** with this prompt:

```
You are the VERSION SCOUT. Your job is to compare template versions against
skill versions and produce an update schedule.

## Phase 1: Read Template Versions

Read ALL package.json.template files to extract every dependency version:
- packages/mcp-ts-engineer/templates/apps/expo-app/package.json.template
- packages/mcp-ts-engineer/templates/apps/nestjs-server/package.json.template
- packages/mcp-ts-engineer/templates/apps/mcp-server/package.json.template
- packages/mcp-ts-engineer/templates/apps/registry.json

For each dependency, record: package name, version constraint, which template.

## Phase 2: Read Current Skill Versions

For each skill directory in .claude/skills/:
1. Read SKILL.md — extract the **Version:** footer line
2. Read the first numbered subfile (01-*.md) — check version mentions
3. Record: skill name, current documented version, directory path, file count

Skip these utility skills (no library version to track):
- anthropic-prompt-engineering (prompt patterns, not a library)
- codemap-updater (internal tool)
- continuous-learning (internal tool)
- session-manager (internal tool)
- azure-deployment (deployment recipes)
- graphql-curl-testing (testing recipes)
- typescript-clean-code (coding patterns)
- design-system (design tokens, not a library)
- commit (git workflow)
- learned (extracted patterns)

For skills WITHOUT a matching template dependency (e.g., flash-list,
keyboard-controller, sentry-react-native), still include them but:
- Mark their priority based on whether the SKILL.md version footer
  matches the latest version on their official docs
- Use WebSearch to check the latest stable version from official docs
- List them under "Skills Without Template Reference"

## Phase 3: Compare and Schedule

For each skill, compare its documented version with the template version.

Produce a VERSION REPORT in this exact format:

---
VERSION REPORT
Generated: [date]

## Skills Needing Update

| Skill | Directory | Current | Template | Files | Priority |
|-------|-----------|---------|----------|-------|----------|
| [name] | .claude/skills/[dir]/ | [old] | [new] | [count] | HIGH/MED/LOW |

## Skills Already Current

| Skill | Directory | Version | Files |
|-------|-----------|---------|-------|
| [name] | .claude/skills/[dir]/ | [ver] | [count] |

## Skills Without Template Reference

| Skill | Directory | Version | Files | Official Docs |
|-------|-----------|---------|-------|---------------|
| [name] | .claude/skills/[dir]/ | [ver] | [count] | [url] |

## Recommended Team Assignment

Based on file counts and skill groupings, assign skills to teammates:
- Each teammate gets 1-3 skills (MAX 15 files total)
- Group related skills together (same ecosystem)
- Largest skills (10+ files) get their own teammate

### Teammate 2 — "[name]": [skill list] ([file count] files)
### Teammate 3 — "[name]": [skill list] ([file count] files)
...

## New Dependencies Without Skills

Template dependencies that have NO matching skill directory:

| Package | Version | Template | Suggested Skill Name | Official Docs |
|---------|---------|----------|---------------------|---------------|
| [package] | [version] | [template] | [kebab-name] | [url] |

For each dependency, check:
1. Is it a significant library that would benefit from a skill? (skip tiny utils)
2. What would be a good kebab-case skill directory name?
3. What is the official documentation URL?
4. How many subfiles would it need? (estimate: 3-5 for small libs, 5-10 for large)

If NO new dependencies found, report: "No new dependencies detected."

## Official Documentation URLs

| Skill | Official Source |
|-------|---------------|
| [name] | [url] |

---

Priority rules:
- HIGH: Major version mismatch (e.g., v4 in skill, v5 in template)
- MED: Minor version mismatch or content gaps
- LOW: Version matches but content could be expanded

SCOPE FILTER: The user invoked this command with arguments: "$ARGUMENTS"
- If "$ARGUMENTS" is a specific skill name → only include that skill
  in "Skills Needing Update" and assign it to one teammate.
- If "$ARGUMENTS" is "all" or empty → include all skills that need updates.
- If "$ARGUMENTS" doesn't match any skill directory → report error to lead.

Report your findings to the lead when done. Do NOT start updating files —
your ONLY job is the version report.
```

**Wait for version-scout to complete.**

### Step 3: Parse Version Report

Read the version-scout's report. Extract:
- `SKILLS_TO_UPDATE`: List of skills needing update (from "Skills Needing Update" table)
- `NEW_DEPENDENCIES`: List of template deps without skills (from "New Dependencies Without Skills" table)
- `TEAM_ASSIGNMENTS`: Recommended teammate assignments
- `OFFICIAL_URLS`: Documentation URLs per skill

Display to user:
```
Version Scout Complete
━━━━━━━━━━━━━━━━━━━━━
Skills needing update: [count]
Skills current:        [count]
New dependencies:      [count]
Teammates needed:      [count]

[VERSION REPORT TABLE]
```

IF `NEW_DEPENDENCIES` is not empty, display:
```
━━━━━━━━━━━━━━━━━━━━━
NEW SKILLS DETECTED
━━━━━━━━━━━━━━━━━━━━━

The following template dependencies have no matching skill:

| Package | Version | Suggested Skill Name |
|---------|---------|---------------------|
| [package] | [version] | [name] |

Which new skills should be created?
```

Use AskUserQuestion with multiSelect=true listing each new dependency as an option.
The user can select which ones to create, or choose "None" to skip.

Store the user's selection as `SKILLS_TO_CREATE`.

IF no skills need update AND no skills to create → report "All skills are current, no new skills requested" and STOP.

Ask user for final confirmation before spawning teammates:
```
Proceed with:
- Updates: [count] skills
- New skills: [count] skills
- Teammates: [count] total
```

### Step 3.5: Plan Creator Teammates

For each skill in `SKILLS_TO_CREATE`, add a creator teammate to the team plan:
- Each creator teammate handles exactly 1 new skill
- Named "creator-[skill-name]"
- Creator teammates run IN PARALLEL with updater teammates

### Step 4: Spawn Updater Teammates

For each teammate in TEAM_ASSIGNMENTS, spawn with this prompt template:

```
You are an UPDATER TEAMMATE. Update the assigned skill files to be complete,
production-ready engineering references.

## Your Assignment

Skills: [SKILL_LIST]
Directory: [DIRECTORY_PATH]
Target Version: [VERSION]
Official Docs: [OFFICIAL_URL]

## SOURCE AUTHORITY RULE

ALL content MUST come from OFFICIAL documentation ONLY.

1. WebSearch for the official docs of each library FIRST
2. Use ONLY the official source URL listed above
3. TypeScript type definitions on GitHub are acceptable as secondary source
4. NEVER use blogs, Medium, Stack Overflow, tutorials, or AI-generated content
5. NEVER guess parameters — if you cannot verify from official docs, omit it
6. Cite the official source URL in every file's footer

## MANDATORY SKILL FILE STRUCTURE

### SKILL.md (200-300 lines)

---
name: <skill-name>
description: <Library> <domain> - <3-5 capabilities>. Use when <trigger>, <trigger>, or <trigger>.
---

# [Skill Name]

> [One-line value proposition]

---

## When to Use

**LOAD THIS SKILL** when user is:
- [Action verb + specific context, 3-5 bullets]

---

## Critical Rules

**ALWAYS:**
1. [Rule] — [rationale]
2. [Rule] — [rationale]
3. [Rule] — [rationale]

**NEVER:**
1. [Prohibited] — [consequence]
2. [Prohibited] — [consequence]

---

## Core Patterns

### [Pattern Name]

```typescript
// [What this demonstrates]
[5-15 line complete example]
```

[2-4 named patterns total]

---

## Anti-Patterns

**BAD** — [What's wrong]:
```typescript
[incorrect code]
```

**GOOD** — [Why this is better]:
```typescript
[correct code]
```

---

## Quick Reference

| Task | API | Example |
|------|-----|---------|
[5-10 rows of most common operations]

---

## Deep Dive References

| When you need | Load |
|---------------|------|
| [Scenario] | [01-file.md](01-file.md) |

---

**Version:** X.x | **Source:** https://official-docs-url

### Numbered Subfiles (01-*.md etc. — 200-400 lines each)

# [Skill Name]: [Subtopic]

**[Brief module description]**

---

## [Section Heading]

### [Subsection]

[ALL parameters, types, defaults in tables]

| Property | Type | Default | Description |
|----------|------|---------|-------------|

```typescript
// Complete working example with imports (20-50 lines)
```

---

**See Also**: [cross-references]
**Source**: https://official-docs-url/specific-page
**Version**: X.x

## CONTENT REQUIREMENTS

- Every code example: COMPLETE with imports, types, full function body
- Every API: ALL parameters documented in tables
- Every config object: ALL options listed with types and defaults
- Edge cases and gotchas documented
- Error handling patterns included
- Integration examples with our stack
- Target: 2000-3500 tokens per subfile

## EDITING RULES

1. Read ALL existing files in your assigned skill directory first
2. Preserve file structure — same filenames, same section organization
3. EXPAND content — add missing parameters, methods, edge cases
4. Do NOT delete accurate existing content — update or expand only
5. Use replace_all=true for repeated identical patterns
6. On "multiple matches" Edit error: widen old_string with more context
7. Version headers must match target version exactly
8. All code blocks: typescript (never js or jsx)

## CONTEXT MANAGEMENT

If you are running low on context, STOP editing immediately.
Report which files you completed and which remain, then shut down.
The lead will spawn a replacement to finish your work.
Do NOT rush through remaining files — quality over completion.
```

### Step 4.5: Spawn Creator Teammates

For each skill in `SKILLS_TO_CREATE`, spawn a **creator teammate** with this prompt:

```
You are a CREATOR TEAMMATE. Create a brand-new skill from scratch for a library
that currently has no skill directory.

## Your Assignment

Package: [PACKAGE_NAME]
Version: [VERSION]
Skill Name: [SKILL_NAME] (kebab-case directory name)
Directory: .claude/skills/[SKILL_NAME]/
Official Docs: [OFFICIAL_URL]

## SOURCE AUTHORITY RULE

ALL content MUST come from OFFICIAL documentation ONLY.

1. WebSearch for the official docs of the library FIRST
2. Use ONLY the official source URL listed above
3. TypeScript type definitions on GitHub are acceptable as secondary source
4. NEVER use blogs, Medium, Stack Overflow, tutorials, or AI-generated content
5. NEVER guess parameters — if you cannot verify from official docs, omit it
6. Cite the official source URL in every file's footer

## STEP 1: Create Skill Directory

Create the directory: .claude/skills/[SKILL_NAME]/

## STEP 2: Research the Library

Use WebSearch to find:
1. Core concepts and API surface
2. Installation and setup
3. Key patterns and common use cases
4. Configuration options
5. Integration with our stack (React Native/Expo or NestJS depending on lib)

Organize findings into logical subtopics for subfiles.

## STEP 3: Create SKILL.md (200-300 lines)

Follow this EXACT structure:

---
name: [skill-name]
description: [Library] [domain] - [3-5 capabilities]. Use when [trigger], [trigger], or [trigger].
---

# [Skill Name]

> [One-line value proposition]

---

## When to Use

**LOAD THIS SKILL** when user is:
- [Action verb + specific context, 3-5 bullets]

---

## Critical Rules

**ALWAYS:**
1. [Rule] — [rationale]
2. [Rule] — [rationale]
3. [Rule] — [rationale]

**NEVER:**
1. [Prohibited] — [consequence]
2. [Prohibited] — [consequence]

---

## Core Patterns

### [Pattern Name]

```typescript
// [What this demonstrates]
[5-15 line complete example]
```

[2-4 named patterns total]

---

## Anti-Patterns

**BAD** — [What's wrong]:
```typescript
[incorrect code]
```

**GOOD** — [Why this is better]:
```typescript
[correct code]
```

---

## Quick Reference

| Task | API | Example |
|------|-----|---------|
[5-10 rows of most common operations]

---

## Deep Dive References

| When you need | Load |
|---------------|------|
| [Scenario] | [01-file.md](01-file.md) |

---

**Version:** X.x | **Source:** https://official-docs-url

## STEP 4: Create Numbered Subfiles (3-5 files, 200-400 lines each)

Name them: 01-[topic].md, 02-[topic].md, etc.

Each subfile follows this structure:

# [Skill Name]: [Subtopic]

**[Brief module description]**

---

## [Section Heading]

### [Subsection]

[ALL parameters, types, defaults in tables]

| Property | Type | Default | Description |
|----------|------|---------|-------------|

```typescript
// Complete working example with imports (20-50 lines)
```

---

**See Also**: [cross-references]
**Source**: https://official-docs-url/specific-page
**Version**: X.x

## CONTENT REQUIREMENTS

- Every code example: COMPLETE with imports, types, full function body
- Every API: ALL parameters documented in tables
- Every config object: ALL options listed with types and defaults
- Edge cases and gotchas documented
- Error handling patterns included
- Integration examples with our stack
- Target: 2000-3500 tokens per subfile

## CONTEXT MANAGEMENT

If you are running low on context, STOP creating files immediately.
Report which files you completed and which remain, then shut down.
The lead will spawn a replacement to finish your work.
Do NOT rush through remaining files — quality over completion.
```

### Step 5: Monitor and Recover

While updater AND creator teammates are working:

1. **Monitor** — Check on each teammate periodically
2. **Detect failures** — Teammate idle without completion report = failure
3. **Spawn replacements** — Named "{original}-retry" with:
   ```
   Continue where the previous agent failed. Check which files already
   have the correct version number [TARGET_VERSION] and skip those.
   Focus on remaining files only.

   [Same prompt as original teammate]
   ```
4. **If teammate fails twice** on same file → mark as "needs manual review"
5. **Do NOT verify** until ALL teammates complete or are retried

### Step 6: Verification

After ALL teammates (updaters AND creators) complete, the lead performs:

**6a. Structure Compliance**

Grep ALL updated AND newly created SKILL.md files for required sections:
- `## When to Use` + `**LOAD THIS SKILL**`
- `## Critical Rules` + `**ALWAYS:**` + `**NEVER:**`
- `## Core Patterns`
- `## Anti-Patterns`
- `## Quick Reference`
- `## Deep Dive References`
- `**Version:**` + `**Source:**`
- YAML frontmatter (`---` at start)

**6b. Version Compliance**

Grep for outdated version patterns:
- Old Expo SDK (51, 52, 53) in expo skills
- Old RN versions (0.73, 0.74, 0.75, 0.76) in RN skills
- Old NestJS (9, 10) in NestJS skills
- Curried `create()((` in zustand skills
- `import { shallow }` in zustand skills
- Zod v3 patterns in zod skills
- Biome v1 patterns in biome skills

**6c. Source Compliance**

Verify every updated file has `**Source:**` with an official URL.

**6d. Spot Check**

Read 1 random subfile per teammate. Verify:
- Complete parameter tables (not just method names)
- Full working code examples (with imports)
- Correct version number
- Official source URL in footer

### Step 7: Report

```
═══════════════════════════════════════════════════════════════
 SKILL UPDATE COMPLETE
═══════════════════════════════════════════════════════════════

Skills Updated: [count]
Skills Created: [count]
Files Modified: [count]
Files Created: [count]
Teammates Used: [count] (+ [retry_count] retries)

## Update Summary

| Skill | Version | Files | Teammate | Status |
|-------|---------|-------|----------|--------|
| [name] | [old] → [new] | [count] | [teammate] | ✅/⚠️ |

## New Skills Created

| Skill | Version | Files | Teammate | Status |
|-------|---------|-------|----------|--------|
| [name] | [version] | [count] | creator-[name] | ✅/⚠️ |

## Structure Compliance: [percentage]%
## Source Compliance: [percentage]%

## Issues (if any)

| File | Issue | Action Needed |
|------|-------|---------------|
| [path] | [description] | Manual review |

═══════════════════════════════════════════════════════════════
```

---

## Official Documentation Sources

| Library | Official URL |
|---------|-------------|
| Expo | docs.expo.dev |
| React Native | reactnative.dev |
| Zustand | zustand.docs.pmnd.rs |
| TanStack Query | tanstack.com/query |
| Zod | zod.dev |
| NativeWind | nativewind.dev |
| React Hook Form | react-hook-form.com |
| date-fns | date-fns.org |
| FlashList | shopify.github.io/flash-list |
| Reanimated | docs.swmansion.com/react-native-reanimated |
| Keyboard Controller | kirillzyusko.github.io/react-native-keyboard-controller |
| MMKV | github.com/mrousavy/react-native-mmkv |
| NestJS | docs.nestjs.com |
| Mongoose | mongoosejs.com/docs |
| GraphQL Yoga | the-guild.dev/graphql/yoga-server |
| Passport | passportjs.org |
| class-validator | github.com/typestack/class-validator |
| graphql-request | github.com/jasonkuhrt/graphql-request |
| Biome | biomejs.dev |
| Sentry RN | docs.sentry.io/platforms/react-native |
| Testing Library RN | callstack.github.io/react-native-testing-library |
| Maestro | maestro.mobile.dev |
| NetInfo | github.com/react-native-netinfo/react-native-netinfo |
| Claude Agent SDK | github.com/anthropics/claude-agent-sdk-typescript |
| MCP SDK | modelcontextprotocol.io |

---

<errors>
| Condition | Action |
|-----------|--------|
| Agent Teams not enabled | Stop with setup instructions |
| No arguments | Ask: update all or specific skill? |
| Invalid skill name | List available skills, ask again |
| Version scout fails | Retry once, then stop with error |
| Updater teammate fails | Spawn replacement with "-retry" suffix |
| Teammate fails twice | Mark files as "needs manual review" |
| Teammate hits context limit | Spawn replacement for remaining files |
| No skills need update and no new skills | Report "all current" and stop |
| New dependency detected | Prompt user with multi-select, only create selected |
| Creator teammate fails | Spawn replacement with "-retry" suffix |
| Creator teammate fails twice | Mark skill as "needs manual creation" |
| Skill directory already exists | Skip creation, report as already present |
| Official docs unreachable | Skip that skill, report in final output |
</errors>

---

## Related

| Command | Purpose |
|---------|---------|
| `/create-app` | Scaffold app from templates (defines authoritative versions) |
| `/prompt-engineer` | Create/optimize prompts and skills |
| `/research` | Research topics with web search |
