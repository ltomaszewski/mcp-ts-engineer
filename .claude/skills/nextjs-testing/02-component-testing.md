# Component Testing

Testing Client Components with @testing-library/react: rendering, user interactions, TanStack Query wrappers, forms, loading/error states, and accessibility queries.

---

## Rendering Basics

### Simple Render

```typescript
import { expect, test } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Greeting } from '@/components/greeting';

test('renders greeting with name', () => {
  render(<Greeting name="Alice" />);
  expect(screen.getByText('Hello, Alice!')).toBeInTheDocument();
});
```

### Rerender with New Props

```typescript
import { expect, test } from 'vitest';
import { render, screen } from '@testing-library/react';
import { StatusBadge } from '@/components/status-badge';

test('updates status when props change', () => {
  const { rerender } = render(<StatusBadge status="loading" />);
  expect(screen.getByText('Loading')).toBeInTheDocument();

  rerender(<StatusBadge status="success" />);
  expect(screen.getByText('Success')).toBeInTheDocument();
  expect(screen.queryByText('Loading')).not.toBeInTheDocument();
});
```

---

## Query Priority

Use queries in this order (most to least preferred):

```typescript
// 1. ByRole (PREFERRED) -- buttons, links, headings, form elements
screen.getByRole('button', { name: 'Submit' });
screen.getByRole('heading', { level: 2, name: 'Dashboard' });
screen.getByRole('textbox', { name: 'Email' });
screen.getByRole('checkbox', { name: 'Remember me' });
screen.getByRole('alert');

// 2. ByLabelText -- form fields with labels
screen.getByLabelText('Email address');

// 3. ByPlaceholderText -- when no label available
screen.getByPlaceholderText('Search...');

// 4. ByText -- non-interactive content
screen.getByText('Welcome to the app');
screen.getByText(/no results found/i);

// 5. ByAltText -- images
screen.getByAltText('Company logo');

// 6. ByTestId -- LAST RESORT only
screen.getByTestId('complex-data-grid');
```

---

## User Interactions with userEvent

Always use `userEvent` over `fireEvent`. Call `userEvent.setup()` before `render()`. All methods are async.

### Form Submission

```typescript
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { LoginForm } from '@/features/auth/login-form';

describe('LoginForm', () => {
  it('submits with valid credentials', async () => {
    const onSubmit = vi.fn();
    const user = userEvent.setup();
    render(<LoginForm onSubmit={onSubmit} />);

    await user.type(screen.getByLabelText('Email'), 'test@example.com');
    await user.type(screen.getByLabelText('Password'), 'password123');
    await user.click(screen.getByRole('button', { name: /log in/i }));

    expect(onSubmit).toHaveBeenCalledWith({
      email: 'test@example.com',
      password: 'password123',
    });
  });
});
```

### Other Interactions

```typescript
// Click
await user.click(screen.getByRole('button', { name: 'Increment' }));

// Double-click
await user.dblClick(screen.getByRole('button', { name: 'Reset' }));

// Clear and retype
const input = screen.getByRole('searchbox');
await user.type(input, 'first');
await user.clear(input);
await user.type(input, 'second');
expect(input).toHaveValue('second');

// Select dropdown
await user.selectOptions(screen.getByRole('combobox', { name: 'Lang' }), 'en');

// Tab navigation
await user.tab();
expect(screen.getByLabelText('Name')).toHaveFocus();

// Keyboard shortcut
await user.keyboard('{Control>}k{/Control}');
expect(screen.getByRole('dialog')).toBeInTheDocument();
```

---

## TanStack Query Test Wrapper

Components using `useQuery`/`useMutation` require `QueryClientProvider`. Create fresh `QueryClient` per test.

### Test Utilities (src/test/test-utils.tsx)

```typescript
import type { ReactNode } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, type RenderOptions } from '@testing-library/react';

function createTestQueryClient(): QueryClient {
  return new QueryClient({
    defaultOptions: {
      queries: { retry: false, gcTime: 0 },
      mutations: { retry: false },
    },
  });
}

function createWrapper() {
  const queryClient = createTestQueryClient();
  return function TestWrapper({ children }: { children: ReactNode }) {
    return (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    );
  };
}

function renderWithClient(ui: React.ReactElement, options?: Omit<RenderOptions, 'wrapper'>) {
  const queryClient = createTestQueryClient();
  return {
    ...render(ui, {
      wrapper: ({ children }: { children: ReactNode }) => (
        <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
      ),
      ...options,
    }),
    queryClient,
  };
}

export { createWrapper, renderWithClient, createTestQueryClient };
export * from '@testing-library/react';
```

### Using the Wrapper

```typescript
import { describe, it, expect, vi } from 'vitest';
import { screen } from '@testing-library/react';
import { renderWithClient } from '@/test/test-utils';
import { UserList } from '@/features/users/user-list';

vi.mock('@/lib/api-client', () => ({
  apiFetch: vi.fn().mockResolvedValue([
    { id: '1', name: 'Alice' },
    { id: '2', name: 'Bob' },
  ]),
}));

describe('UserList', () => {
  it('shows loading then data', async () => {
    renderWithClient(<UserList />);
    expect(screen.getByText('Loading...')).toBeInTheDocument();
    expect(await screen.findByText('Alice')).toBeInTheDocument();
    expect(screen.queryByText('Loading...')).not.toBeInTheDocument();
  });
});
```

### Testing Mutations

```typescript
import { describe, it, expect, vi } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithClient } from '@/test/test-utils';
import { CreateUserForm } from '@/features/users/create-user-form';
import { apiFetch } from '@/lib/api-client';

vi.mock('@/lib/api-client', () => ({
  apiFetch: vi.fn().mockResolvedValue({ id: '3', name: 'Charlie' }),
}));

describe('CreateUserForm', () => {
  it('submits and shows success', async () => {
    const user = userEvent.setup();
    renderWithClient(<CreateUserForm />);

    await user.type(screen.getByLabelText('Name'), 'Charlie');
    await user.click(screen.getByRole('button', { name: /create/i }));

    await waitFor(() => {
      expect(apiFetch).toHaveBeenCalledWith('/users', expect.objectContaining({ method: 'POST' }));
    });
    expect(await screen.findByText(/created successfully/i)).toBeInTheDocument();
  });
});
```

---

## Testing Forms (react-hook-form)

```typescript
import { describe, it, expect, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ContactForm } from '@/features/contact/contact-form';

describe('ContactForm', () => {
  it('shows validation errors for empty fields', async () => {
    const user = userEvent.setup();
    render(<ContactForm onSubmit={vi.fn()} />);

    await user.click(screen.getByRole('button', { name: /submit/i }));

    await waitFor(() => {
      expect(screen.getByText('Name is required')).toBeInTheDocument();
      expect(screen.getByText('Email is required')).toBeInTheDocument();
    });
  });

  it('submits valid form data', async () => {
    const onSubmit = vi.fn();
    const user = userEvent.setup();
    render(<ContactForm onSubmit={onSubmit} />);

    await user.type(screen.getByLabelText('Name'), 'Alice');
    await user.type(screen.getByLabelText('Email'), 'alice@test.com');
    await user.click(screen.getByRole('button', { name: /submit/i }));

    await waitFor(() => {
      expect(onSubmit).toHaveBeenCalledWith(
        expect.objectContaining({ name: 'Alice', email: 'alice@test.com' }),
        expect.anything(),
      );
    });
  });
});
```

---

## Testing Loading, Error, and Empty States

```typescript
import { it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { renderWithClient, createWrapper } from '@/test/test-utils';

// Loading state
it('shows skeleton while loading', () => {
  render(<DataTable />, { wrapper: createWrapper() });
  expect(screen.getByText('Loading data...')).toBeInTheDocument();
});

// Error state
vi.mock('@/lib/api-client', () => ({
  apiFetch: vi.fn().mockRejectedValue(new Error('Network error')),
}));

it('shows error on failure', async () => {
  renderWithClient(<UserProfile userId="123" />);
  expect(await screen.findByRole('alert')).toBeInTheDocument();
});

// Empty state
vi.mock('@/lib/api-client', () => ({
  apiFetch: vi.fn().mockResolvedValue([]),
}));

it('shows empty state', async () => {
  renderWithClient(<NotificationList />);
  expect(await screen.findByText('No notifications yet')).toBeInTheDocument();
});
```

---

## Async Utilities

### waitFor -- wait for assertion to pass

```typescript
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

it('triggers search after debounce', async () => {
  const onSearch = vi.fn();
  const user = userEvent.setup();
  render(<DebouncedSearch onSearch={onSearch} />);

  await user.type(screen.getByRole('searchbox'), 'query');
  await waitFor(() => expect(onSearch).toHaveBeenCalledWith('query'), { timeout: 1000 });
});
```

### findBy -- preferred for async elements

```typescript
// findBy = getBy + waitFor (retries for 1000ms)
const heading = await screen.findByRole('heading', { name: /dashboard/i });
expect(heading).toBeInTheDocument();
```

### waitForElementToBeRemoved

```typescript
import { screen, waitForElementToBeRemoved } from '@testing-library/react';

it('removes spinner after load', async () => {
  renderWithClient(<DataView />);
  await waitForElementToBeRemoved(() => screen.queryByText('Loading...'));
  expect(screen.getByText('Data loaded')).toBeInTheDocument();
});
```

---

## Accessibility Assertions

```typescript
import { it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';

it('has correct accessibility attributes', () => {
  render(<Button disabled aria-describedby="help">Submit</Button>);

  const button = screen.getByRole('button', { name: 'Submit' });
  expect(button).toBeDisabled();
  expect(button).toHaveAttribute('aria-describedby', 'help');
  expect(button).toBeVisible();
});

it('announces toast to screen readers', async () => {
  const user = userEvent.setup();
  render(<Toast />);
  await user.click(screen.getByRole('button', { name: /show toast/i }));
  expect(await screen.findByRole('status')).toHaveTextContent('Action completed');
});
```

---

## Debugging

```typescript
// Print full DOM
screen.debug();

// Print specific element
screen.debug(screen.getByRole('form'));

// Get testing playground URL
screen.logTestingPlaygroundURL();
```

---

**Version:** Vitest 4.x + Next.js 15.5.x | **Source:** https://testing-library.com/docs/react-testing-library/intro
