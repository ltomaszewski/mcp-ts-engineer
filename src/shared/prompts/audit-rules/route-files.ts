/**
 * Route and screen component audit rules.
 * Extracted from audit-workflow.ts for file size compliance.
 */

export const ROUTE_FILE_RULES = `
### Route Files
- **Path**: app/**/*.tsx (not _layout.tsx)
- **Rule**: 2-5 lines only
- **Signals**: <View, <Text, useState, useEffect
- **Fix**: Route files should only re-export screen components. Extract UI code to src/features/*/screens/*.tsx

### Screen Components
- **Path**: src/features/*/screens/*.tsx
- **Rule**: One hook, max 60 lines
- **Exception**: useKeyboardManager() allowed
- **Fix**: Split large screen components: extract hooks into custom hooks (use*Screen), extract UI sections into sub-components
`.trim()
