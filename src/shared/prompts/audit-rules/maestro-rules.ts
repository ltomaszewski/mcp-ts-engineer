/**
 * Maestro E2E test audit rules.
 * Extracted from audit-workflow.ts for file size compliance.
 */

export const MAESTRO_RULES = `
### Maestro
| Rule | Detection | Max/Guidance | Fix | Skip If |
|------|-----------|--------------|-----|---------|
| File size | Line count per .yaml flow | 60 lines | Split into runFlow() sub-flows | Single critical path that can't be split |
| Sleeps | extendedWaitUntil or sleep commands | 3 per file | Replace with waitForElement or assertVisible | Hardware-dependent animation timing |
| Optional assertions | assertVisible with optional: true | 20% of assertions | Convert to required assertions with proper waits | Loading spinners or transient UI |
| Element selector stability | Text-based selectors without testID | 0 text selectors | Add testID prop and use id: selector | Static labels that never change |
| Wait strategies | sleep() without preceding condition check | 0 bare sleeps | Use waitForElement + timeout instead of fixed sleep | Platform boot delays in CI |
| Network mock patterns | Inline URL stubs without mock file | Prefer mock files | Extract to .maestro/mocks/ directory | Simple single-endpoint test |
| Scroll handling | scrollUntilVisible without maxScrolls | Always set maxScrolls | Add maxScrolls: 5 (or appropriate limit) | Short lists that never scroll |
| Flaky test indicators | retry: in flow config or repeated runFlow | 0 retry directives | Fix root cause (missing waits, bad selectors) | Known platform-specific CI flake |
`.trim()
