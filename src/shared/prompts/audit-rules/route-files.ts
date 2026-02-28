/**
 * Route and screen component audit rules.
 * Extracted from audit-workflow.ts for file size compliance.
 */

export const ROUTE_FILE_RULES = `
### Route Files
- **Path**: app/**/*.tsx (not _layout.tsx)
- **Rule**: 2-5 lines only
- **Signals**: <View, <Text, useState, useEffect
- **Fix**: Move to src/features/*/screens/

### Screen Components
- **Path**: src/features/*/screens/*.tsx
- **Rule**: One hook, max 60 lines
- **Exception**: useKeyboardManager() allowed
- **Fix**: Extract to use*Screen hook
`.trim()
