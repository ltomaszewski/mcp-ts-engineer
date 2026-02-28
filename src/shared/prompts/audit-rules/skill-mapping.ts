/**
 * KB loading and skill mapping phases for the audit workflow.
 * Extracted from audit-workflow.ts for file size compliance.
 */

export const AUDIT_PHASE_KB_AND_SKILLS = `
## Phase 0: Load KB

IF scope contains "mobile" OR "app" OR empty:
  Read(".claude/knowledge-base/react-native-mobile-architecture.md")
  IF fail → WARN and continue

IF scope contains "web" OR "next" OR "frontend":
  Read(".claude/knowledge-base/nextjs-web-architecture.md")
  IF fail → WARN and continue

IF scope contains "server" OR "api" OR "backend":
  Read(".claude/knowledge-base/nestjs-backend-architecture.md")
  IF fail → WARN and continue

IF scope contains "mcp" OR "agent":
  Read(".claude/knowledge-base/mcp-server-architecture.md")
  IF fail → WARN and continue

IF scope contains "components" OR "ui":
  Read(".claude/skills/design-system/00-master-index.md")
  IF fail → WARN and continue

---

## Phase 1: Load Skills (Monorepo-Aware)

### Step 1: Detect Monorepo Structure

1. Read root package.json → IF fail: WARN and continue
2. If "workspaces" field exists:
   - Glob: apps/*/package.json, packages/*/package.json
   - Read each workspace package.json
   - Aggregate ALL dependencies across workspaces
3. If no "workspaces" field:
   - Use only root package.json

### Step 2: Scope-Based Filtering

If targets a specific app path:
- Determine which workspace the target belongs to
- Prioritize that workspace's dependencies
- Still load commonly shared skills (typescript-clean-code, etc.)

### Step 3: Dependency → Skill Mapping

Scan ALL package.json files (or scoped workspace) and load skills.
The full dependency-to-skill mapping is defined in DEPENDENCY_SKILL_MAP. Use these known category mappings:

| Category | Example Dependencies → Skills |
|----------|-------------------------------|
| React Native | expo → expo-core, react-native → react-native-core, nativewind → nativewind, ... |
| Next.js | next → nextjs-core, @tailwindcss/postcss → tailwind-v4, better-auth → better-auth, ... |
| NestJS | @nestjs/core → nestjs-core, @nestjs/graphql → nestjs-graphql, @nestjs/passport → nestjs-auth, ... |
| MCP | @modelcontextprotocol/sdk → claude-agent-sdk |
| Common | zustand → zustand, @tanstack/react-query → react-query, zod → zod, biome → biome, ... |

Match ALL dependencies and devDependencies from package.json against the mapping.

### Step 4: Folder-Based & Always-Load Skills

| Detection | Skill |
|-----------|-------|
| .maestro/ folder exists | maestro |
| Always | typescript-clean-code |

### Step 5: Load All Matched Skills

1. Extract dependencies from both dependencies AND devDependencies
2. Match against mapping table (deduplicated)
3. Check folder-based skills
4. Invoke ALL matched skills using the Skill tool
5. Always invoke typescript-clean-code
`.trim()
