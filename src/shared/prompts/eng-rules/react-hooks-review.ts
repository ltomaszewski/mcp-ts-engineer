/**
 * Curated React hooks performance review rules.
 * Validates dependency arrays, reference stability, and memoization patterns.
 *
 * Follows the same structure as race-conditions.ts for consistency.
 */

export const REACT_HOOKS_REVIEW_RULES = `## React Hooks Performance Review

### Pre-Review Analysis Questions
For EVERY useCallback, useMemo, and useEffect in the diff, answer:
1. Is each dependency a primitive or a referentially stable reference?
2. Does any dependency come from a custom hook return? (If yes — is that return value memoized, or a new object each render?)
3. Is the entire return of a hook used as a dependency instead of individual properties?
4. Are there inline object/array literals in dependency arrays or default parameters?
5. Are callback props passed to React.memo children stable references?

### ALWAYS Rules
- Verify every useCallback/useMemo/useEffect dependency is referentially stable across renders
- Destructure hook returns to individual stable values before using in dependency arrays
- Use primitive values (string, number, boolean) in dependency arrays when possible
- Memoize callback props passed to React.memo children via useCallback
- Extract static objects/arrays to module scope (outside component body)
- Use useRef for values needed in callbacks but that should not trigger re-renders
- Pass individual store selector results, not combined objects, as dependencies
- Wrap return objects from custom hooks in useMemo if consumers use them as dependencies

### NEVER Rules
- Use the entire return object of a custom hook as a dependency (e.g. [hookResult] where hookResult = { fn, state, ... })
- Create objects or arrays inline inside dependency arrays
- Use default parameter values that are object/array literals (creates new ref each render)
- Omit dependencies to "fix" re-render issues — use useRef instead
- Use JSON.stringify as a dependency stabilization hack
- Spread hook results into dependency arrays without verifying each property's stability
- Pass () => {} inline to memoized children (defeats React.memo)
- Ignore that useState setter functions are stable but useReducer dispatch may not be in all cases

### Quick Reference: Pattern → Fix
| Pattern | Fix |
|---------|-----|
| \`useCallback(fn, [hookResult])\` where hookResult is new object each render | Destructure: \`useCallback(fn, [hookResult.stableFn])\` |
| \`useMemo(() => x, [{ a, b }])\` with inline object | Destructure: \`const { a, b } = obj; useMemo(() => x, [a, b])\` |
| \`useEffect(() => {}, [options])\` where options is inline object | Extract to useMemo or module-level constant |
| \`<Child onClick={() => doThing(id)} />\` with React.memo(Child) | \`const handleClick = useCallback(() => doThing(id), [id])\` |
| \`const config = { theme: 'dark' }\` inside component body | Move outside component or wrap in useMemo |
| Hook returns \`{ isVisible, data, show, dismiss }\` as plain object | Wrap return in useMemo, or consumers destructure to stable values |
| \`function Comp({ items = [] })\` default creates new array each render | \`const stableItems = useMemo(() => items ?? [], [items])\` |
| \`useStore(state => ({ a: state.a, b: state.b }))\` creates new object | Use individual selectors or useShallow |
| Return \`{ ...spread }\` from custom hook without useMemo | Add useMemo around the return object |
| \`useCallback(fn, [obj.method])\` where obj changes but method is inherited | Capture method in a ref or extract to stable variable |

### Audit Checklist
Before completing React performance review, verify:
- [ ] Every useCallback dependency is a primitive or memoized/stable reference
- [ ] Every useMemo dependency is a primitive or memoized/stable reference
- [ ] Every useEffect dependency is a primitive or memoized/stable reference
- [ ] No entire custom hook return objects used as dependencies
- [ ] No inline object/array literals in dependency arrays
- [ ] Props passed to React.memo children are stable references
- [ ] Default parameter values are not object/array literals
- [ ] Zustand/store selectors return primitives or use useShallow
- [ ] Static config objects live at module scope, not inside components
- [ ] Custom hook return values are memoized if consumers depend on them
- [ ] No JSON.stringify hacks for dependency stabilization`
