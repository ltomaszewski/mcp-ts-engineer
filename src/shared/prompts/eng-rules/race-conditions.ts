/**
 * Curated race condition prevention rules.
 * Extracted from /eng Section 4: Race Condition Prevention.
 *
 * Originally from: src/capabilities/todo-code-writer/prompts/eng-rules/race-conditions.ts
 */

export const RACE_CONDITIONS_RULES = `## Race Condition Prevention

### Pre-Implementation Design Questions
BEFORE writing ANY async code, answer these questions:
1. What triggers this operation? (User action → loading guard + UI disable; Effect dependency → cleanup function; Store subscription → verify latest state)
2. Can this be triggered multiple times rapidly? (YES → request cancellation or debounce; NO → still add loading guard)
3. What happens if the component unmounts mid-operation? (State update needed → cancelled flag check; Navigation needed → try/catch)
4. Does the result depend on current state? (YES → functional update setState(prev => ...); NO → direct set acceptable)
5. Is this data fetching? (YES → use TanStack Query, NEVER manual useEffect + fetch; NO → continue to appropriate pattern)

### ALWAYS Rules
- Use functional updates: setState(prev => ...) when new state depends on previous
- Add cleanup functions to useEffect that have async operations
- Use AbortController for fetch requests that can be superseded
- Pass signal to ALL fetch calls inside TanStack Query's queryFn
- Disable buttons/inputs during async operations (prevent double-submit)
- Use TanStack Query's built-in cancellation instead of manual fetch
- Check cancelled flag before setState in async callbacks
- Debounce user input that triggers API calls (minimum 200-300ms)
- Use refs for tracking request versions, abort controllers, and timers

### NEVER Rules
- Call setState(value) with captured state inside async callbacks
- Use get().field before await then set({ field: ... }) in Zustand
- Fire async operations in useEffect without cleanup
- Allow multiple simultaneous submissions of the same action
- Assume previous async operation completed before starting new one
- Navigate away before confirming async operation succeeded/failed
- Ignore the signal parameter in TanStack Query's queryFn
- Use useState to store AbortController instances (use useRef instead)

### Quick Reference: Pattern → Fix
| Pattern | Fix |
|---------|-----|
| Stale closure | setState(prev => ...) or useRef |
| Unmount leak | Cleanup with cancelled flag |
| Concurrent fetch | AbortController or TanStack Query |
| Double submit | isSubmitting guard + disabled prop |
| Zustand async gap | set(state => ...) callback |
| Effect race | Cleanup cancels previous |
| Navigation race | Await then navigate |
| Optimistic conflict | Rollback in onError + invalidate |
| Rapid input | Debounce (200-300ms) |
| Stale response | Request versioning with ref |

### Audit Checklist
Before marking implementation complete, verify:
- [ ] Pre-design questions answered: All 5 questions addressed
- [ ] useEffect cleanup: Every effect with async operations has cleanup
- [ ] Functional state updates: setState(prev => ...) used when depending on previous state
- [ ] Concurrent requests: Rapid user actions won't cause wrong data
- [ ] Unmount safety: No setState calls possible after component unmounts
- [ ] Zustand atomicity: Store updates use set(state => ...) pattern
- [ ] Loading states: Buttons/forms disabled during async operations
- [ ] TanStack Query signal: queryFn receives AND passes signal to fetch
- [ ] Navigation safety: Router.push/replace only after async completes
- [ ] Debounce applied: User input triggering API calls is debounced
- [ ] Request versioning: Multiple rapid selections use ref-based versioning
- [ ] AbortController stored in useRef, NOT useState`;
