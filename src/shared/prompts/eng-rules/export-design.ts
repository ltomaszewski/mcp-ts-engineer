/**
 * Curated export design rules.
 * Extracted from /eng Section 6.7: Export Design Check.
 *
 * Originally from: src/capabilities/todo-code-writer/prompts/eng-rules/export-design.ts
 */

export const EXPORT_DESIGN_RULES = `## Export Design Rules

### Before Creating Any New Export
Verify each of these BEFORE proceeding:
- [ ] Export will be imported by >=1 production file (not just tests)
- [ ] If test-only: NOT added to index.ts barrel — tests import from '../module' directly
- [ ] If test-only: Has @internal JSDoc comment: /** @internal Test utility only */

### NEVER
- Add test-only exports to barrel/index.ts files (misleads knip, bloats public API)
- Export internal helpers solely to test them (test through public API instead)

### Integration with Test-Only Exports Audit
The test-only exports audit runs: npx knip --production --include exports
If you follow this export design check, that audit will pass.
If knip flags an export you believe is correct, verify it has non-test consumers.`;
