# Troubleshooting & FAQ - React Native Testing Library

**Source:** https://oss.callstack.com/react-native-testing-library/docs/guides/troubleshooting

**Version:** 13.3.x

---

## Installation Issues

### Issue 1: "Cannot find module 'react-test-renderer'"

**Cause:** v13 no longer requires `react-test-renderer` but some setups still reference it.

**Solution:**
```bash
# v13 does NOT need react-test-renderer
# Remove it if present:
npm uninstall react-test-renderer

# If another package needs it, install matching version:
npm install --save-dev react-test-renderer@<your-react-version>
```

### Issue 2: "Module not found: @testing-library/react-native"

**Solution:**
```bash
npm install --save-dev @testing-library/react-native
```

### Issue 3: "ReferenceError: regeneratorRuntime is not defined"

**Solution:** Update `.babelrc`:
```json
{
  "presets": ["module:metro-react-native-babel-preset"]
}
```

### Issue 4: "TypeError: jest.fn is not a function"

**Solution:** Ensure `jest.config.js` has correct preset:
```javascript
module.exports = {
  preset: 'react-native',
  testEnvironment: 'node',
};
```

---

## v13 Migration Issues

### Issue: "ByA11yState is not a function"

**Cause:** `*ByA11yState` queries removed in v13.

**Solution:**
```typescript
// BEFORE (v12):
screen.getByA11yState({ checked: true });

// AFTER (v13):
screen.getByRole('checkbox', { checked: true });
// or use matcher:
expect(element).toBeChecked();
```

### Issue: "ByA11yValue is not a function"

**Cause:** `*ByA11yValue` queries removed in v13.

**Solution:**
```typescript
// BEFORE (v12):
screen.getByA11yValue({ now: 50 });

// AFTER (v13):
screen.getByRole('adjustable', { value: { now: 50 } });
// or use matcher:
expect(element).toHaveAccessibilityValue({ now: 50 });
```

### Issue: "Jest matchers not working after upgrade"

**Cause:** v13 auto-extends matchers. Old import is redundant.

**Solution:**
```typescript
// REMOVE this line (no longer needed):
// import '@testing-library/react-native/extend-expect';

// REMOVE this package (deprecated):
// npm uninstall @testing-library/jest-native

// Matchers auto-extend on any import from the library.
// To opt out, import from /pure:
import { render, screen } from '@testing-library/react-native/pure';
```

### Issue: Tests fail with concurrent rendering

**Cause:** v13 enables concurrent rendering by default.

**Solution:**
```typescript
// Option 1: Per-render disable
render(<Component />, { concurrentRoot: false });

// Option 2: Global disable
import { configure } from '@testing-library/react-native';
configure({ concurrentRoot: false });
```

---

## Running Tests Issues

### Issue: "Timeout - Async callback was not invoked within the 5000ms timeout"

**Solution:**
```typescript
// In jest.setup.ts
jest.setTimeout(10000); // Increase to 10 seconds

// Or per-test
test('slow test', async () => {
  // your test
}, 20000); // jest.test(name, fn, timeout)
```

### Issue: "Tests pass locally but fail in CI"

**Solution:**
```typescript
// Mock API calls
global.fetch = jest.fn(() =>
  Promise.resolve({
    json: () => Promise.resolve(mockData),
  }),
);

// Ensure cleanup between tests
afterEach(() => {
  jest.clearAllMocks();
});
```

### Issue: "Test hangs/never completes"

**Solution:**
```typescript
// Await async operations
await user.press(button);
await screen.findByText('Loaded');

// Mock infinite loops
jest.useFakeTimers();
jest.advanceTimersByTime(5000);
jest.useRealTimers();
```

### Issue: "Module not found: Cannot find module '@/...' "

**Solution:** Update `jest.config.js`:
```javascript
moduleNameMapper: {
  '^@/(.*)$': '<rootDir>/src/$1',
}
```

---

## Query Issues

### Issue: "Unable to find element with text"

**Solution:**
```typescript
// Use regex for flexible matching
screen.getByText(/exact text/i);  // Case insensitive

// Check actual rendered content
screen.debug(); // See what's actually there

// Look for partial matches
screen.getByText('part of text', { exact: false });
```

### Issue: "Found multiple elements with role 'button'"

**Solution:**
```typescript
// Add name to distinguish
screen.getByRole('button', { name: 'Submit' });

// Use within() to scope
const form = screen.getByTestId('form');
within(form).getByRole('button', { name: 'Submit' });

// Use getAllByRole to get all
const buttons = screen.getAllByRole('button');
```

### Issue: "No elements found for getByRole('button')"

**Solution:**
```typescript
// Add accessibilityRole to Pressable
<Pressable accessibilityRole="button">
  <Text>Click me</Text>
</Pressable>

// Or use different query
screen.getByText('Click me');
```

### Issue: "queryByText returns null unexpectedly"

**Solution:**
```typescript
// Check if hidden from accessibility (v13 skips hidden by default)
const element = screen.queryByText('Text', { includeHiddenElements: true });

// Debug to see rendered tree
screen.debug();

// Handle whitespace
screen.getByText(/whitespace\s+text/);
```

### Issue: "Cannot query for element inside another element"

**Solution:**
```typescript
// Use within()
const card = screen.getByTestId('user-card');
const deleteBtn = within(card).getByRole('button', { name: 'Delete' });
```

---

## Async Issues

### Issue: "Timeout - Async operation did not complete"

**Solution:**
```typescript
// Increase timeout
await screen.findByText('Text', {}, { timeout: 5000 });

// Debug with screen.debug()
try {
  await screen.findByText('Text');
} catch (error) {
  screen.debug();
  throw error;
}
```

### Issue: "act() warning about state updates"

**Solution:**
```typescript
// Use async queries (wrapped in act automatically)
await screen.findByText('Loaded');

// Or use userEvent (handles act internally)
const user = userEvent.setup();
await user.press(button);

// For React 19/Suspense, use async APIs
await renderAsync(<SuspenseComponent />);
```

### Issue: "waitFor() callback still throws after timeout"

**Solution:**
```typescript
// Debug what's happening
await waitFor(() => {
  screen.debug();
  expect(screen.getByText('Success')).toBeOnTheScreen();
}, {
  timeout: 2000,
});
```

### Issue: "findBy* queries don't wait long enough"

**Solution:**
```typescript
// Global configuration
import { configure } from '@testing-library/react-native';
configure({ asyncUtilTimeout: 3000 });

// Or per query
await screen.findByText('Text', {}, { timeout: 5000 });
```

---

## Mock & Provider Issues

### Issue: "useContext returns undefined"

**Solution:**
```typescript
// Wrap with provider
render(<Component />, {
  wrapper: MyContextProvider,
});

// Or in custom render
function render(component: React.ReactElement, options = {}) {
  return rtlRender(component, {
    wrapper: MyContextProvider,
    ...options,
  });
}
```

### Issue: "Mock function not called as expected"

**Solution:**
```typescript
// Verify mock setup
const mockFn = jest.fn();
expect(mockFn).toHaveBeenCalled();

// Check arguments
expect(mockFn).toHaveBeenCalledWith(expectedArg);

// Debug calls
console.log(mockFn.mock.calls);
```

### Issue: "Global mock not working"

**Solution:**
```typescript
// Set up mocks BEFORE render
global.fetch = jest.fn(() =>
  Promise.resolve({
    json: () => Promise.resolve(data),
  }),
);

// THEN render
render(<Component />);
```

---

## Common Questions (FAQ)

### Q: Should I use render or renderAsync?

**A:** Use `render` for most cases. Use `renderAsync` when testing React 19 Suspense components or components using `React.use()`.

### Q: Should I test implementation details?

**A:** No. Test behavior instead:
```typescript
// BAD: Testing implementation
expect(component.state.isOpen).toBe(true);

// GOOD: Testing behavior
expect(screen.getByText('Modal Content')).toBeOnTheScreen();
```

### Q: How do I test error boundaries?

```typescript
test('error boundary catches error', () => {
  const ThrowComponent = () => {
    throw new Error('Test error');
  };

  jest.spyOn(console, 'error').mockImplementation(() => {});

  render(
    <ErrorBoundary>
      <ThrowComponent />
    </ErrorBoundary>,
  );

  expect(screen.getByText(/error/i)).toBeOnTheScreen();
});
```

### Q: How do I test animations?

```typescript
test('animation completes', async () => {
  jest.useFakeTimers();

  render(<AnimatedComponent />);

  jest.advanceTimersByTime(1000);

  expect(screen.getByText('Animated')).toBeOnTheScreen();

  jest.useRealTimers();
});
```

### Q: How do I test navigation?

```typescript
test('navigates on button press', async () => {
  const mockNavigation = { navigate: jest.fn() };
  const user = userEvent.setup();

  render(<Screen navigation={mockNavigation} />);

  await user.press(screen.getByRole('button', { name: 'Go Home' }));

  expect(mockNavigation.navigate).toHaveBeenCalledWith('Home');
});
```

### Q: How do I debug test failures?

```typescript
test('debug failing test', () => {
  render(<Component />);

  // See full rendered tree
  screen.debug();

  // With custom message
  screen.debug({ message: 'After initial render' });

  // Get error messages from getBy (they're detailed)
  try {
    screen.getByText('Non-existent');
  } catch (error) {
    console.log(error.message); // Shows all available elements
  }
});
```

### Q: What's the difference between getBy and queryBy?

```typescript
// getBy throws if not found -- use when element MUST exist
const button = screen.getByRole('button');

// queryBy returns null if not found -- use for absence assertions
expect(screen.queryByText('Optional text')).not.toBeOnTheScreen();
```

---

## Getting Help

### Resources

- **Official Docs:** https://oss.callstack.com/react-native-testing-library
- **GitHub Issues:** https://github.com/callstack/react-native-testing-library/issues
- **GitHub Discussions:** https://github.com/callstack/react-native-testing-library/discussions

---

**Source:** https://oss.callstack.com/react-native-testing-library/docs/guides/troubleshooting
