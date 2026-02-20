---
name: rn-testing-library
description: "@testing-library/react-native - render, queries, userEvent, async utilities. Use when working with @testing-library/react-native, writing component tests, or testing user interactions."
---

# React Native Testing Library

> Testing utilities for React Native components focused on user behavior, not implementation.

**Package:** `@testing-library/react-native`

---

## When to Use

**LOAD THIS SKILL** when user is:
- Writing component tests for React Native
- Testing user interactions (press, type, scroll)
- Querying rendered elements by role or text
- Testing async behavior and loading states
- Setting up test environment with Jest

---

## Critical Rules

**ALWAYS:**
1. Query by accessibility role or label first — `getByRole`, `getByLabelText` match how users interact
2. Use `userEvent` over `fireEvent` — more realistic, fires all intermediate events
3. Use `findBy*` for async elements — auto-waits with timeout
4. Wrap state updates in `act()` or use async queries — prevents "not wrapped in act" warnings

**NEVER:**
1. Query by testID as first choice — use accessibility queries first, testID as last resort
2. Test implementation details — test behavior, not component internals
3. Use `getBy*` for elements that may not exist — use `queryBy*` (returns null) instead
4. Forget `await` with userEvent — all userEvent methods are async

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

    // Query by accessibility
    const emailInput = screen.getByLabelText('Email');
    const passwordInput = screen.getByLabelText('Password');
    const submitButton = screen.getByRole('button', { name: 'Login' });

    // Type in fields
    await user.type(emailInput, 'test@example.com');
    await user.type(passwordInput, 'password123');

    // Submit
    await user.press(submitButton);

    expect(onSubmit).toHaveBeenCalledWith({
      email: 'test@example.com',
      password: 'password123',
    });
  });

  it('shows error for invalid email', async () => {
    const user = userEvent.setup();
    render(<LoginForm onSubmit={jest.fn()} />);

    await user.type(screen.getByLabelText('Email'), 'invalid');
    await user.press(screen.getByRole('button', { name: 'Login' }));

    // findByText auto-waits for async validation
    expect(await screen.findByText('Invalid email')).toBeOnTheScreen();
  });
});
```

### Testing Async Loading States

```typescript
import { render, screen, waitFor } from '@testing-library/react-native';

describe('UserProfile', () => {
  it('shows loading then user data', async () => {
    render(<UserProfile userId="123" />);

    // Initially shows loading
    expect(screen.getByText('Loading...')).toBeOnTheScreen();

    // Wait for data to load
    expect(await screen.findByText('John Doe')).toBeOnTheScreen();

    // Loading should be gone
    expect(screen.queryByText('Loading...')).not.toBeOnTheScreen();
  });

  it('shows error on fetch failure', async () => {
    server.use(
      rest.get('/api/users/123', (req, res, ctx) => res(ctx.status(500)))
    );

    render(<UserProfile userId="123" />);

    expect(await screen.findByText('Failed to load user')).toBeOnTheScreen();
  });
});
```

### Custom Render with Providers

```typescript
import { render, RenderOptions } from '@testing-library/react-native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { NavigationContainer } from '@react-navigation/native';

const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: false } },
});

function AllProviders({ children }: { children: React.ReactNode }) {
  return (
    <QueryClientProvider client={queryClient}>
      <NavigationContainer>
        {children}
      </NavigationContainer>
    </QueryClientProvider>
  );
}

function customRender(
  ui: React.ReactElement,
  options?: Omit<RenderOptions, 'wrapper'>
) {
  return render(ui, { wrapper: AllProviders, ...options });
}

// Re-export everything
export * from '@testing-library/react-native';
export { customRender as render };
```

### Testing Scrollable Lists

```typescript
import { render, screen, userEvent } from '@testing-library/react-native';

describe('ItemList', () => {
  it('loads more items on scroll to end', async () => {
    const user = userEvent.setup();
    render(<ItemList />);

    const list = screen.getByRole('list');

    // Scroll to trigger onEndReached
    await user.scrollTo(list, { y: 1000 });

    // Wait for new items
    expect(await screen.findByText('Item 11')).toBeOnTheScreen();
  });
});
```

---

## Anti-Patterns

**BAD** — Query by testID first:
```typescript
screen.getByTestId('submit-button'); // Implementation detail
```

**GOOD** — Query by accessibility:
```typescript
screen.getByRole('button', { name: 'Submit' }); // How users see it
```

**BAD** — Using fireEvent for user actions:
```typescript
fireEvent.press(button); // Missing intermediate events
fireEvent.changeText(input, 'text'); // Unrealistic
```

**GOOD** — Using userEvent:
```typescript
await user.press(button); // Realistic press sequence
await user.type(input, 'text'); // Types character by character
```

**BAD** — Using getBy for optional elements:
```typescript
const error = screen.getByText('Error'); // Throws if not found!
if (error) { ... }
```

**GOOD** — Using queryBy for optional elements:
```typescript
const error = screen.queryByText('Error'); // Returns null if not found
expect(error).toBeNull(); // Safe to assert
```

**BAD** — Missing await with async queries:
```typescript
expect(screen.findByText('Loaded')).toBeOnTheScreen(); // Promise, not element!
```

**GOOD** — Await async queries:
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
| Press button | `user.press()` | `await user.press(button)` |
| Type in input | `user.type()` | `await user.type(input, 'text')` |
| Scroll | `user.scrollTo()` | `await user.scrollTo(list, { y: 500 })` |
| Wait for condition | `waitFor()` | `await waitFor(() => expect(...))` |
| Assert visible | `toBeOnTheScreen()` | `expect(el).toBeOnTheScreen()` |

---

## Deep Dive References

| When you need | Load |
|---------------|------|
| Installation and Jest setup | [01-setup.md](01-setup.md) |
| Query methods (getBy, findBy, queryBy) | [03-query-methods.md](03-query-methods.md) |
| userEvent (press, type, scroll) | [04-user-interactions.md](04-user-interactions.md) |
| Provider wrappers and mocking | [08-advanced-patterns.md](08-advanced-patterns.md) |
| TypeScript types and matchers | [09-typescript.md](09-typescript.md) |

---

**Version:** 12.x | **Source:** https://callstack.github.io/react-native-testing-library/
