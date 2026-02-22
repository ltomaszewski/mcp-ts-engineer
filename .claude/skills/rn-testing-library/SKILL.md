---
name: rn-testing-library
description: "@testing-library/react-native v13 - render, screen, queries (getBy/queryBy/findBy), userEvent (press, longPress, type, clear, paste, scrollTo), built-in Jest matchers (toBeOnTheScreen, toBeVisible, toBeDisabled, toHaveTextContent, toHaveProp, toHaveStyle), waitFor, renderHook. Use when writing component tests, testing user interactions, or testing async behavior."
---

# React Native Testing Library

Testing utilities for React Native components focused on user behavior, not implementation.

**Package:** `@testing-library/react-native`

---

## When to Use

LOAD THIS SKILL when user is:
- Writing component tests for React Native
- Testing user interactions (press, type, scroll, longPress)
- Querying rendered elements by role, text, or label
- Testing async behavior, loading states, and error states
- Setting up test environment with Jest and jest-expo
- Using built-in Jest matchers (toBeOnTheScreen, toBeVisible, etc.)

---

## Critical Rules

**ALWAYS:**
1. Query by accessibility role or label first -- `getByRole`, `getByLabelText` match how users interact
2. Use `userEvent` over `fireEvent` -- more realistic, fires all intermediate events
3. Use `findBy*` for async elements -- auto-waits with timeout
4. Wrap state updates in `act()` or use async queries -- prevents "not wrapped in act" warnings
5. Use `toBeOnTheScreen()` as the standard visibility matcher -- built-in since v12.4
6. Call `userEvent.setup()` before render -- creates properly configured event instance

**NEVER:**
1. Query by testID as first choice -- use accessibility queries first, testID as last resort
2. Test implementation details (state, refs) -- test behavior the user can observe
3. Use `getBy*` for elements that may not exist -- use `queryBy*` (returns null) instead
4. Forget `await` with userEvent -- all userEvent methods are async
5. Use deprecated `@testing-library/jest-native` -- use built-in matchers from v12.4+

---

## Core Patterns

### Basic Component Test

```typescript
import { render, screen, userEvent } from '@testing-library/react-native';

describe('Counter', () => {
  it('increments count when button pressed', async () => {
    const user = userEvent.setup();
    render(<Counter />);

    expect(screen.getByText('Count: 0')).toBeOnTheScreen();
    await user.press(screen.getByRole('button', { name: 'Increment' }));
    expect(screen.getByText('Count: 1')).toBeOnTheScreen();
  });
});
```

### Form Testing with userEvent

```typescript
import { render, screen, userEvent } from '@testing-library/react-native';

describe('LoginForm', () => {
  it('submits form with valid data', async () => {
    const onSubmit = jest.fn();
    const user = userEvent.setup();
    render(<LoginForm onSubmit={onSubmit} />);

    await user.type(screen.getByLabelText('Email'), 'test@example.com');
    await user.type(screen.getByLabelText('Password'), 'password123');
    await user.press(screen.getByRole('button', { name: 'Login' }));

    expect(onSubmit).toHaveBeenCalledWith({
      email: 'test@example.com',
      password: 'password123',
    });
  });
});
```

### Testing Async Loading States

```typescript
import { render, screen } from '@testing-library/react-native';

it('shows loading then user data', async () => {
  render(<UserProfile userId="123" />);

  expect(screen.getByText('Loading...')).toBeOnTheScreen();
  expect(await screen.findByText('John Doe')).toBeOnTheScreen();
  expect(screen.queryByText('Loading...')).not.toBeOnTheScreen();
});
```

### Custom Render with Providers

```typescript
import { render, RenderOptions } from '@testing-library/react-native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: false } },
});

function AllProviders({ children }: { children: React.ReactNode }) {
  return (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );
}

function customRender(
  ui: React.ReactElement,
  options?: Omit<RenderOptions, 'wrapper'>,
) {
  return render(ui, { wrapper: AllProviders, ...options });
}

export * from '@testing-library/react-native';
export { customRender as render };
```

### Testing Scrollable Lists

```typescript
import { render, screen, userEvent } from '@testing-library/react-native';

it('loads more items on scroll', async () => {
  const user = userEvent.setup();
  render(<ItemList />);

  await user.scrollTo(screen.getByRole('list'), { y: 1000 });
  expect(await screen.findByText('Item 11')).toBeOnTheScreen();
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

**BAD** -- Using fireEvent for new tests:
```typescript
fireEvent.press(button);
fireEvent.changeText(input, 'text');
```

**GOOD** -- Using userEvent:
```typescript
await user.press(button);
await user.type(input, 'text');
```

**BAD** -- Using getBy for optional elements:
```typescript
const error = screen.getByText('Error');
```

**GOOD** -- Using queryBy for optional elements:
```typescript
expect(screen.queryByText('Error')).not.toBeOnTheScreen();
```

**BAD** -- Missing await with async queries:
```typescript
expect(screen.findByText('Loaded')).toBeOnTheScreen();
```

**GOOD** -- Await async queries:
```typescript
expect(await screen.findByText('Loaded')).toBeOnTheScreen();
```

---

## Quick Reference

| Task | API | Example |
|------|-----|---------|
| Render component | `render()` | `render(<Component />)` |
| Get element (throws) | `getBy*` | `screen.getByRole('button')` |
| Query element (null) | `queryBy*` | `screen.queryByText('Error')` |
| Find element (async) | `findBy*` | `await screen.findByText('Loaded')` |
| Setup user events | `userEvent.setup()` | `const user = userEvent.setup()` |
| Press | `user.press()` | `await user.press(button)` |
| Long press | `user.longPress()` | `await user.longPress(el, { duration: 1000 })` |
| Type text | `user.type()` | `await user.type(input, 'text')` |
| Clear input | `user.clear()` | `await user.clear(input)` |
| Paste text | `user.paste()` | `await user.paste(input, 'text')` |
| Scroll | `user.scrollTo()` | `await user.scrollTo(list, { y: 500 })` |
| Wait for condition | `waitFor()` | `await waitFor(() => expect(...))` |
| Assert on screen | `toBeOnTheScreen()` | `expect(el).toBeOnTheScreen()` |
| Assert visible | `toBeVisible()` | `expect(el).toBeVisible()` |
| Assert disabled | `toBeDisabled()` | `expect(el).toBeDisabled()` |
| Assert text content | `toHaveTextContent()` | `expect(el).toHaveTextContent('Hello')` |
| Assert prop | `toHaveProp()` | `expect(el).toHaveProp('disabled', true)` |
| Assert style | `toHaveStyle()` | `expect(el).toHaveStyle({ color: 'red' })` |

---

## Deep Dive References

| When you need | Load |
|---------------|------|
| Installation and Jest setup | [01-setup.md](01-setup.md) |
| render(), screen, cleanup, act() | [02-core-api.md](02-core-api.md) |
| Query methods (getBy, findBy, queryBy) | [03-query-methods.md](03-query-methods.md) |
| userEvent (press, type, scroll, clear, paste) | [04-user-interactions.md](04-user-interactions.md) |
| Async testing (waitFor, findBy) | [05-async-testing.md](05-async-testing.md) |
| Hook testing (renderHook) | [06-hook-testing.md](06-hook-testing.md) |
| Accessibility and within() | [07-accessibility.md](07-accessibility.md) |
| Provider wrappers and advanced patterns | [08-advanced-patterns.md](08-advanced-patterns.md) |
| TypeScript types and integration | [09-typescript.md](09-typescript.md) |
| Troubleshooting and FAQ | [10-troubleshooting.md](10-troubleshooting.md) |
| Built-in Jest matchers reference | [11-jest-matchers.md](11-jest-matchers.md) |

---

**Version:** 13.x | **Source:** https://oss.callstack.com/react-native-testing-library/
