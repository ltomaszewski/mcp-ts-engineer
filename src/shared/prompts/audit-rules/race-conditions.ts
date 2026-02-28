/**
 * Race condition audit rules and fix templates.
 * Extracted from audit-workflow.ts for file size compliance.
 */

export const RACE_CONDITION_RULES = `
### Race Conditions (CRITICAL)

| Pattern | Detection | Confidence | Fix |
|---------|-----------|------------|-----|
| useEffect no cleanup | async/.then, no return () => | HIGH | isMounted |
| Missing AbortController | fetch( no signal: | HIGH | AbortController |
| Double-tap | onPress={async no disabled= | HIGH | loading state |
| Zustand hydration | persist( no _hasHydrated | MEDIUM | hydration |
| Mutation no return | mutationFn: block no return | MEDIUM | add return |
| Stale closure | setState in Promise.all no prev => | MEDIUM | functional |

**Skip if**: return () => exists, imports @tanstack/react-query, isPending used, implicit return
`.trim()

export const RACE_CONDITION_FIX_TEMPLATES = `
### useEffect Cleanup
\`\`\`typescript
// BEFORE
useEffect(() => { fetchData().then(setData); }, []);

// AFTER
useEffect(() => {
  let isMounted = true;
  fetchData().then(data => { if (isMounted) setData(data); });
  return () => { isMounted = false; };
}, []);
\`\`\`

### AbortController
\`\`\`typescript
// BEFORE
useEffect(() => { fetch(url).then(r => r.json()).then(setData); }, [url]);

// AFTER
useEffect(() => {
  const controller = new AbortController();
  fetch(url, { signal: controller.signal })
    .then(r => r.json()).then(setData)
    .catch(e => { if (e.name !== 'AbortError') throw e; });
  return () => controller.abort();
}, [url]);
\`\`\`

### Button Loading
\`\`\`typescript
// BEFORE
<Pressable onPress={async () => { await submit(); }}>

// AFTER
const [loading, setLoading] = useState(false);
const handle = async () => {
  if (loading) return;
  setLoading(true);
  try { await submit(); } finally { setLoading(false); }
};
<Pressable onPress={handle} disabled={loading}>
\`\`\`

### Zustand Hydration
\`\`\`typescript
_hasHydrated: false,
setHasHydrated: (v: boolean) => set({ _hasHydrated: v }),
onRehydrateStorage: () => (s) => s?.setHasHydrated(true),
\`\`\`

### Mutation Return
\`\`\`typescript
// BEFORE
mutationFn: (id) => { api.delete(id); },
// AFTER
mutationFn: (id) => { return api.delete(id); },
\`\`\`

### Functional Update
\`\`\`typescript
// BEFORE
setItems([...items, item]);
// AFTER
setItems(prev => [...prev, item]);
\`\`\`
`.trim()
