---
name: nextjs-testing
description: Next.js testing with Vitest - component testing, Server Component mocking, TanStack Query wrappers, jsdom environment, @testing-library/react. Use when writing tests for Next.js components, pages, or hooks.
---

# Next.js Testing with Vitest

> Unit and integration testing for Next.js App Router using Vitest, @testing-library/react, and jsdom.

**Stack:** Vitest + @vitejs/plugin-react + vite-tsconfig-paths + @testing-library/react + @testing-library/jest-dom

---

## When to Use

LOAD THIS SKILL when user is:
- Writing component tests for Next.js pages or components
- Testing Client Components with interactive behavior (forms, buttons, modals)
- Testing components that use TanStack Query (useQuery, useMutation)
- Mocking Next.js modules (next/navigation, next/image, next/font)
- Testing custom React hooks with renderHook
- Setting up Vitest configuration for a Next.js project
- Testing loading states, error states, or async data fetching
- Writing tests for Server Components (synchronous only)

---

## Critical Rules

**ALWAYS:**
1. Query by accessibility role first -- `getByRole('button', { name: 'Submit' })` matches how users interact
2. Use `userEvent` over `fireEvent` -- simulates full browser interactions including intermediate events
3. Use `findBy*` for async elements -- auto-retries with 1000ms default timeout
4. Create fresh `QueryClient` per test -- prevents shared cache state between tests
5. Import `@testing-library/jest-dom` in `vitest.setup.ts` -- provides `toBeInTheDocument()` and other DOM matchers
6. Call `userEvent.setup()` before `render()` -- creates properly configured event instance
7. Use `vi.mock()` for Next.js modules -- mock `next/navigation`, `next/image`, `next/font` at module level
8. Await all `userEvent` methods -- they return Promises and need `await`

**NEVER:**
1. Query by `data-testid` as first choice -- use accessibility queries first, testID as last resort
2. Test implementation details (component state, refs) -- test behavior the user can observe
3. Use `getBy*` for elements that may not exist -- use `queryBy*` (returns null) instead of throwing
4. Share `QueryClient` across tests -- causes flaky tests from leaked cache state
5. Use `useEffect` + `setState` for data fetching in tests -- use TanStack Query with a test wrapper
6. Test async Server Components directly with Vitest -- use E2E tests for `async` Server Components
7. Forget to mock `next/navigation` -- `useRouter`, `usePathname`, `useSearchParams` crash without mocks

---

## Core Patterns

### Basic Component Test

```typescript
import { expect, test } from 'vitest';
import { render, screen } from '@testing-library/react';
import Page from '@/app/page';

test('renders home page heading', () => {
  render(<Page />);
  expect(screen.getByRole('heading', { level: 1, name: 'Home' })).toBeInTheDocument();
});
```

### Interactive Component with userEvent

```typescript
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { SearchBar } from '@/components/search-bar';

describe('SearchBar', () => {
  it('calls onSearch when form submitted', async () => {
    const onSearch = vi.fn();
    const user = userEvent.setup();
    render(<SearchBar onSearch={onSearch} />);

    await user.type(screen.getByRole('searchbox'), 'next.js');
    await user.click(screen.getByRole('button', { name: /search/i }));

    expect(onSearch).toHaveBeenCalledWith('next.js');
  });
});
```

### TanStack Query Component Test

```typescript
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { UserProfile } from '@/features/users/user-profile';

function createTestQueryClient(): QueryClient {
  return new QueryClient({
    defaultOptions: {
      queries: { retry: false },
    },
  });
}

function createWrapper() {
  const queryClient = createTestQueryClient();
  return function Wrapper({ children }: { children: React.ReactNode }) {
    return (
      <QueryClientProvider client={queryClient}>
        {children}
      </QueryClientProvider>
    );
  };
}

describe('UserProfile', () => {
  it('shows loading then user data', async () => {
    render(<UserProfile userId="123" />, { wrapper: createWrapper() });

    expect(screen.getByText('Loading...')).toBeInTheDocument();
    expect(await screen.findByText('John Doe')).toBeInTheDocument();
    expect(screen.queryByText('Loading...')).not.toBeInTheDocument();
  });
});
```

### Mocking next/navigation

```typescript
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

const mockPush = vi.fn();
const mockBack = vi.fn();

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: mockPush, back: mockBack, replace: vi.fn() }),
  usePathname: () => '/dashboard',
  useSearchParams: () => new URLSearchParams(''),
  useParams: () => ({}),
}));

import { Navigation } from '@/components/navigation';

describe('Navigation', () => {
  it('navigates to settings on click', async () => {
    const user = userEvent.setup();
    render(<Navigation />);

    await user.click(screen.getByRole('link', { name: /settings/i }));
    expect(mockPush).toHaveBeenCalledWith('/settings');
  });
});
```

### Hook Testing with renderHook

```typescript
import { describe, it, expect } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useCounter } from '@/hooks/use-counter';

describe('useCounter', () => {
  it('increments counter', () => {
    const { result } = renderHook(() => useCounter(0));

    expect(result.current.count).toBe(0);

    act(() => {
      result.current.increment();
    });

    expect(result.current.count).toBe(1);
  });
});
```

### Synchronous Server Component Test

```typescript
import { expect, test } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Footer } from '@/components/footer';

// Only synchronous Server Components can be tested with Vitest.
// Async Server Components require E2E tests.
test('renders footer with copyright', () => {
  render(<Footer year={2026} />);
  expect(screen.getByText(/2026/)).toBeInTheDocument();
  expect(screen.getByRole('contentinfo')).toBeInTheDocument();
});
```

---

## Anti-Patterns

**BAD** -- Query by testID first:
```typescript
screen.getByTestId('submit-button');
```

**GOOD** -- Query by accessibility:
```typescript
screen.getByRole('button', { name: 'Submit' });
```

---

**BAD** -- Shared QueryClient across tests:
```typescript
const queryClient = new QueryClient(); // Module-level = shared state

it('test 1', () => {
  render(<Comp />, { wrapper: ... }); // Uses cached data from previous test
});
```

**GOOD** -- Fresh QueryClient per test:
```typescript
function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return ({ children }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
}
```

---

**BAD** -- Using getBy for elements that may not exist:
```typescript
const error = screen.getByText('Error message'); // Throws if not found
```

**GOOD** -- Using queryBy for optional elements:
```typescript
expect(screen.queryByText('Error message')).not.toBeInTheDocument();
```

---

**BAD** -- Missing await with userEvent:
```typescript
user.click(screen.getByRole('button'));
expect(mockFn).toHaveBeenCalled(); // May fail, click is async
```

**GOOD** -- Await userEvent methods:
```typescript
await user.click(screen.getByRole('button'));
expect(mockFn).toHaveBeenCalled();
```

---

**BAD** -- Testing async Server Components with Vitest:
```typescript
// This will NOT work -- async components are unsupported
test('async page', async () => {
  render(await AsyncPage()); // Crashes or produces incorrect results
});
```

**GOOD** -- Test synchronous parts, E2E for async:
```typescript
// Test the synchronous child components
test('user card renders data', () => {
  render(<UserCard user={{ name: 'Alice', email: 'alice@test.com' }} />);
  expect(screen.getByText('Alice')).toBeInTheDocument();
});
// Use Playwright/Cypress for full async Server Component testing
```

---

## Quick Reference

| Task | API | Example |
|------|-----|---------|
| Render component | `render()` | `render(<Component />)` |
| Find by role (throws) | `getByRole()` | `screen.getByRole('button', { name: 'Submit' })` |
| Find by text (throws) | `getByText()` | `screen.getByText('Hello')` |
| Find by label (throws) | `getByLabelText()` | `screen.getByLabelText('Email')` |
| Query optional (null) | `queryBy*()` | `screen.queryByText('Error')` |
| Wait for async (promise) | `findBy*()` | `await screen.findByText('Loaded')` |
| Setup user events | `userEvent.setup()` | `const user = userEvent.setup()` |
| Click element | `user.click()` | `await user.click(button)` |
| Type text | `user.type()` | `await user.type(input, 'hello')` |
| Clear input | `user.clear()` | `await user.clear(input)` |
| Select option | `user.selectOptions()` | `await user.selectOptions(select, 'value')` |
| Tab navigation | `user.tab()` | `await user.tab()` |
| Wait for condition | `waitFor()` | `await waitFor(() => expect(...))` |
| Assert in DOM | `toBeInTheDocument()` | `expect(el).toBeInTheDocument()` |
| Assert visible | `toBeVisible()` | `expect(el).toBeVisible()` |
| Assert disabled | `toBeDisabled()` | `expect(el).toBeDisabled()` |
| Assert text | `toHaveTextContent()` | `expect(el).toHaveTextContent('Hi')` |
| Assert attribute | `toHaveAttribute()` | `expect(el).toHaveAttribute('href', '/')` |
| Assert class | `toHaveClass()` | `expect(el).toHaveClass('active')` |
| Assert form values | `toHaveFormValues()` | `expect(form).toHaveFormValues({ email: '' })` |
| Assert checked | `toBeChecked()` | `expect(checkbox).toBeChecked()` |
| Assert focus | `toHaveFocus()` | `expect(input).toHaveFocus()` |
| Render hook | `renderHook()` | `renderHook(() => useMyHook())` |
| Rerender hook | `result.rerender()` | `rerender({ newProp: true })` |
| Mock module | `vi.mock()` | `vi.mock('next/navigation', () => ({ ... }))` |
| Mock function | `vi.fn()` | `const handler = vi.fn()` |
| Debug DOM | `screen.debug()` | `screen.debug()` |

---

## Deep Dive References

Load additional context when needed:

| When you need | Load |
|---------------|------|
| Vitest config, setup file, Next.js module mocks | [01-setup.md](01-setup.md) |
| Client Component testing, forms, TanStack Query wrappers | [02-component-testing.md](02-component-testing.md) |
| Server Component mocking, Server Actions, hook testing, vi.mock patterns | [03-patterns.md](03-patterns.md) |

---

**Version:** Vitest 4.x + Next.js 15.x | **Source:** https://nextjs.org/docs/app/guides/testing/vitest
