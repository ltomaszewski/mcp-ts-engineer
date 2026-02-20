# Troubleshooting & FAQ - React Native Testing Library

**Document URL:** https://oss.callstack.com/react-native-testing-library/docs/troubleshooting

**Version:** 13.3.3

---

## Installation Issues

### Issue 1: "Cannot find module 'react-test-renderer'"

**Cause:** Version mismatch or missing installation

**Solution:**
```bash
# Check your React version
npm list react

# Install matching react-test-renderer
npm install --save-dev react-test-renderer@<your-react-version>

# Example: If using React 18.2.0
npm install --save-dev react-test-renderer@18.2.0
```

### Issue 2: "Module not found: @testing-library/react-native"

**Cause:** Not installed or not in package.json

**Solution:**
```bash
npm install --save-dev @testing-library/react-native
npm install  # Re-install dependencies if needed
```

### Issue 3: "ReferenceError: regeneratorRuntime is not defined"

**Cause:** Babel configuration not set up for async/await

**Solution:** Update `.babelrc`:
```json
{
  "presets": ["module:metro-react-native-babel-preset"]
}
```

### Issue 4: "TypeError: jest.fn is not a function"

**Cause:** Jest not properly configured

**Solution:** Ensure `jest.config.js` has correct preset:
```javascript
module.exports = {
  preset: 'react-native',
  testEnvironment: 'node',
};
```

### Issue 5: "Cannot find testID in element props"

**Cause:** Using `testID` instead of `testId` (case sensitive)

**Solution:**
```typescript
// ❌ WRONG
<View testID="my-view" />

// ✅ CORRECT
<View testID="my-view" />
screen.getByTestId('my-view')
```

---

## Running Tests Issues

### Issue 1: "Timeout - Async callback was not invoked within the 5000ms timeout"

**Cause:** Default timeout too short for async operations

**Solution:**
```javascript
// In jest.setup.js
jest.setTimeout(10000); // Increase to 10 seconds

// Or per-test
test('slow test', async () => {
  jest.setTimeout(15000);
  // your test
}, 20000); // jest.test(name, fn, timeout)
```

### Issue 2: "Warning: ReactDOM.render is no longer supported"

**Cause:** Using old React rendering patterns

**Solution:** Use `render()` from RNTL instead:
```typescript
// ✅ CORRECT
import { render } from '@testing-library/react-native';

render(<MyComponent />);
```

### Issue 3: "Tests pass locally but fail in CI"

**Cause:** Different environment, timing issues, missing mocks

**Solution:**
```javascript
// Mock API calls
global.fetch = jest.fn(() =>
  Promise.resolve({
    json: () => Promise.resolve(mockData),
  })
);

// Ensure cleanup between tests
afterEach(() => {
  jest.clearAllMocks();
});
```

### Issue 4: "Cannot find property 'children' on element"

**Cause:** Querying wrong element type

**Solution:**
```typescript
// For Text elements
const text = screen.getByText('Hello');
expect(text.props.children).toBe('Hello');

// For Views
const view = screen.getByTestId('container');
expect(view.children).toBeDefined();
```

### Issue 5: "Test hangs/never completes"

**Cause:** Promise not resolved, missing await, infinite loop

**Solution:**
```typescript
// ✅ CORRECT: Await async operations
await user.press(button);
await screen.findByText('Loaded');

// ✅ Mock infinite loops
jest.useFakeTimers();
jest.advanceTimersByTime(5000);
jest.useRealTimers();
```

### Issue 6: "Module not found: Cannot find module '@/...' "

**Cause:** Path alias not configured in Jest

**Solution:** Update `jest.config.js`:
```javascript
moduleNameMapper: {
  '^@/(.*)$': '<rootDir>/src/$1',
}
```

---

## Query Issues

### Issue 1: "Unable to find element with text"

**Cause:** Text doesn't match, case sensitivity, extra whitespace

**Solution:**
```typescript
// Use regex for flexible matching
screen.getByText(/exact text/i);  // Case insensitive

// Check actual rendered content
screen.debug(); // See what's actually there

// Look for partial matches
screen.getByText('part of text', { exact: false });
```

### Issue 2: "Found multiple elements with role 'button'"

**Cause:** Multiple matching elements, need to disambiguate

**Solution:**
```typescript
// Add name to distinguish
screen.getByRole('button', { name: 'Submit' });

// Use within() to scope
const form = screen.getByTestId('form');
within(form).getByRole('button', { name: 'Submit' });

// Use getAllByRole to get all
const buttons = screen.getAllByRole('button');
const submitBtn = buttons.find(btn => 
  btn.props.children === 'Submit'
);
```

### Issue 3: "No elements found for getByRole('button')"

**Cause:** Element doesn't have accessibility role

**Solution:**
```typescript
// Add accessibilityRole to Pressable
<Pressable accessibilityRole="button">
  <Text>Click me</Text>
</Pressable>

// Or use different query
screen.getByText('Click me');
```

### Issue 4: "Getting stale element references"

**Cause:** Element unmounted between queries

**Solution:**
```typescript
// Wrap state changes in act()
import { act } from '@testing-library/react-native';

act(() => {
  button.props.onPress();
});

// Or use userEvent which handles act() automatically
const user = userEvent.setup();
await user.press(button);
```

### Issue 5: "queryByText returns null unexpectedly"

**Cause:** Element might be hidden, trimming whitespace issues

**Solution:**
```typescript
// Check if hidden
const element = screen.queryByText('Text');
if (!element) {
  // Use debug to see rendered tree
  screen.debug();
}

// Handle whitespace
screen.getByText(/whitespace\s+text/);
```

### Issue 6: "Cannot query for element inside another element"

**Cause:** Querying globally instead of within() scope

**Solution:**
```typescript
// ❌ WRONG
const button = screen.getByRole('button', { name: 'Delete' });

// ✅ CORRECT: Use within()
const card = screen.getByTestId('user-card');
const deleteBtn = within(card).getByRole('button', { name: 'Delete' });
```

---

## Async Issues

### Issue 1: "Timeout - Async operation did not complete"

**Cause:** Element doesn't appear, async operation failed

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

### Issue 2: "act() warning about state updates"

**Cause:** State updates outside of act() wrapper

**Solution:**
```typescript
// Suppress specific warnings if expected
const originalError = console.error;
beforeAll(() => {
  console.error = jest.fn((...args) => {
    if (args[0].includes('act() warning')) return;
    originalError(...args);
  });
});

// Or use await findBy
await screen.findByText('Loaded');  // Wrapped in act automatically
```

### Issue 3: "waitFor() callback still throws after timeout"

**Cause:** Condition never becomes true

**Solution:**
```typescript
// Debug what's happening
await waitFor(() => {
  console.log('Current state:', screen.getByTestId('value').props.children);
  expect(screen.getByText('Success')).toBeOnTheScreen();
}, {
  timeout: 2000,
  onTimeout: () => {
    screen.debug();
  }
});
```

### Issue 4: "findBy* queries don't wait long enough"

**Cause:** Default timeout too short

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

### Issue 1: "useContext returns undefined"

**Cause:** Missing provider wrapper

**Solution:**
```typescript
// ✅ CORRECT: Wrap with provider
render(<Component />, {
  wrapper: MyContextProvider,
});

// Or in custom render
function render(component, options) {
  return rtlRender(component, {
    wrapper: MyContextProvider,
    ...options,
  });
}
```

### Issue 2: "Redux store is undefined"

**Cause:** Missing Provider wrapper

**Solution:**
```typescript
import { Provider } from 'react-redux';
import { createStore } from 'redux';

const store = createStore(reducer);

render(
  <Provider store={store}>
    <Component />
  </Provider>
);
```

### Issue 3: "Mock function not called as expected"

**Cause:** Function not actually called, or called differently

**Solution:**
```typescript
// Verify mock setup
const mockFn = jest.fn();
expect(mockFn).toHaveBeenCalled();

// Check arguments
expect(mockFn).toHaveBeenCalledWith(expectedArg);

// Debug calls
expect(mockFn.mock.calls).toEqual([[arg1], [arg2]]);
```

### Issue 4: "Global mock not working"

**Cause:** Mock set after component render

**Solution:**
```typescript
// Set up mocks BEFORE render
global.fetch = jest.fn(() =>
  Promise.resolve({
    json: () => Promise.resolve(data),
  })
);

// THEN render
render(<Component />);
```

---

## Common Questions (FAQ)

### Q: Should I test implementation details?

**A:** No. Test behavior instead:
```typescript
// ❌ BAD: Testing implementation
expect(component.state.isOpen).toBe(true);

// ✅ GOOD: Testing behavior
expect(screen.getByText('Modal Content')).toBeOnTheScreen();
```

### Q: How many assertions per test?

**A:** One logical assertion. Multiple technical assertions for one behavior is fine:
```typescript
// ✅ GOOD: One logical test
test('form submits', async () => {
  render(<Form />);
  await user.type(screen.getByLabelText('Name'), 'Alice');
  await user.press(screen.getByRole('button', { name: 'Submit' }));
  
  expect(onSubmit).toHaveBeenCalledWith({ name: 'Alice' });
});
```

### Q: How do I test error boundaries?

**A:** Render component that throws, catch error:
```typescript
test('error boundary catches error', () => {
  const ThrowComponent = () => {
    throw new Error('Test error');
  };
  
  // Suppress error output
  jest.spyOn(console, 'error').mockImplementation(() => {});
  
  render(
    <ErrorBoundary>
      <ThrowComponent />
    </ErrorBoundary>
  );
  
  expect(screen.getByText(/error/i)).toBeOnTheScreen();
});
```

### Q: How do I test animations?

**A:** Use fake timers:
```typescript
test('animation completes', async () => {
  jest.useFakeTimers();
  
  render(<AnimatedComponent />);
  
  jest.advanceTimersByTime(1000);
  
  expect(screen.getByText('Animated')).toBeOnTheScreen();
  
  jest.useRealTimers();
});
```

### Q: How do I test console.log/warnings?

**A:** Spy on console:
```typescript
test('logs warning', () => {
  const warnSpy = jest.spyOn(console, 'warn');
  
  render(<Component />);
  
  expect(warnSpy).toHaveBeenCalledWith(expect.stringContaining('warning'));
  
  warnSpy.mockRestore();
});
```

### Q: How do I test file uploads?

**A:** Mock file input:
```typescript
test('file upload', async () => {
  const user = userEvent.setup();
  const file = new File(['test'], 'test.txt');
  
  render(<FileUpload />);
  
  const input = screen.getByLabelText(/upload/i);
  await user.upload(input, file);
  
  expect(screen.getByText('File: test.txt')).toBeOnTheScreen();
});
```

### Q: How do I test navigation?

**A:** Mock navigation props:
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

**A:** Use debug() and error messages:
```typescript
test('debug failing test', () => {
  render(<Component />);
  
  // See full rendered tree
  screen.debug();
  
  // See just one element
  const element = screen.getByTestId('my-element');
  screen.debug(element);
  
  // Get error messages from getBy (they're detailed)
  try {
    screen.getByText('Non-existent');
  } catch (error) {
    console.log(error.message); // Shows all available elements
  }
});
```

### Q: What's the difference between getBy and queryBy?

**A:** getBy throws, queryBy returns null:
```typescript
// ✅ Use getBy when element MUST exist
const button = screen.getByRole('button');

// ✅ Use queryBy when checking if element exists
if (screen.queryByText('Optional text')) {
  // Element exists
}

// ✅ Use queryBy to test that element was removed
expect(screen.queryByText('Element')).not.toBeOnTheScreen();
```

---

## Getting Help

### Resources

- **Official Docs:** https://oss.callstack.com/react-native-testing-library
- **GitHub Issues:** https://github.com/callstack/react-native-testing-library/issues
- **GitHub Discussions:** https://github.com/callstack/react-native-testing-library/discussions
- **Testing Library Docs:** https://testing-library.com/docs

### When Reporting Issues

Include:
1. Minimal reproducible example
2. Error message (full stack trace)
3. Environment (RNTL version, React version, OS)
4. What you've already tried

---

**Knowledge Base Complete!**

All modules have been comprehensively documented. For quick reference, return to the [README](./README.md).
