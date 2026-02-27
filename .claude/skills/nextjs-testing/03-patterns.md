# Advanced Testing Patterns

Server Component testing, Server Action testing, hook testing, module mocking, integration patterns, and snapshot testing for Next.js with Vitest.

---

## Server Component Testing

Vitest supports **synchronous** Server Components only. Async Server Components require E2E tests.

### Synchronous Server Component

```typescript
import { expect, test } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Footer } from '@/components/footer';

test('renders footer with copyright', () => {
  render(<Footer year={2026} companyName="Acme Inc" />);
  expect(screen.getByRole('contentinfo')).toBeInTheDocument();
  expect(screen.getByText('2026 Acme Inc')).toBeInTheDocument();
});
```

### Testing Data-Receiving Children

When an async Server Component passes data to child Client Components, test the children with mock data:

```typescript
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { UserCard } from '@/features/users/user-card';

describe('UserCard', () => {
  const mockUser = { id: '1', name: 'Alice', email: 'alice@test.com', role: 'admin' };

  it('renders user info', () => {
    render(<UserCard user={mockUser} />);
    expect(screen.getByText('Alice')).toBeInTheDocument();
    expect(screen.getByText('alice@test.com')).toBeInTheDocument();
  });

  it('shows edit button for admins only', () => {
    render(<UserCard user={mockUser} />);
    expect(screen.getByRole('button', { name: /edit/i })).toBeInTheDocument();

    render(<UserCard user={{ ...mockUser, role: 'user' }} />);
    expect(screen.queryByRole('button', { name: /edit/i })).not.toBeInTheDocument();
  });
});
```

---

## Mocking Fetch for Data Components

### Mocking the API Client Module

```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen } from '@testing-library/react';
import { renderWithClient } from '@/test/test-utils';
import { ProjectList } from '@/features/projects/project-list';
import { apiFetch } from '@/lib/api-client';

vi.mock('@/lib/api-client', () => ({ apiFetch: vi.fn() }));
const mockApiFetch = vi.mocked(apiFetch);

describe('ProjectList', () => {
  beforeEach(() => vi.clearAllMocks());

  it('renders projects from API', async () => {
    mockApiFetch.mockResolvedValue([{ id: '1', name: 'Alpha' }]);
    renderWithClient(<ProjectList />);
    expect(await screen.findByText('Alpha')).toBeInTheDocument();
  });

  it('shows error on failure', async () => {
    mockApiFetch.mockRejectedValue(new Error('Server error'));
    renderWithClient(<ProjectList />);
    expect(await screen.findByRole('alert')).toBeInTheDocument();
  });
});
```

### Mocking Global fetch

```typescript
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen } from '@testing-library/react';

describe('WeatherWidget', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true, json: () => Promise.resolve({ temperature: 22, condition: 'Sunny' }),
    }));
  });
  afterEach(() => vi.unstubAllGlobals());

  it('displays weather data', async () => {
    render(<WeatherWidget city="SF" />);
    expect(await screen.findByText('Sunny')).toBeInTheDocument();
  });
});
```

---

## Testing Server Actions

Server Actions are async functions invoked from Client Components. Mock them as modules.

```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { CreatePostForm } from '@/features/posts/create-post-form';
import { createPost } from '@/features/posts/actions';

vi.mock('@/features/posts/actions', () => ({
  createPost: vi.fn(),
}));

const mockCreatePost = vi.mocked(createPost);

describe('CreatePostForm', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockCreatePost.mockResolvedValue({ id: 'new-1' });
  });

  it('calls server action on submit', async () => {
    const user = userEvent.setup();
    render(<CreatePostForm />);

    await user.type(screen.getByLabelText('Title'), 'My Post');
    await user.click(screen.getByRole('button', { name: /publish/i }));

    await waitFor(() => expect(mockCreatePost).toHaveBeenCalledTimes(1));
  });

  it('shows error when action fails', async () => {
    mockCreatePost.mockRejectedValue(new Error('Permission denied'));
    const user = userEvent.setup();
    render(<CreatePostForm />);

    await user.type(screen.getByLabelText('Title'), 'My Post');
    await user.click(screen.getByRole('button', { name: /publish/i }));

    expect(await screen.findByRole('alert')).toBeInTheDocument();
  });
});
```

---

## Hook Testing with renderHook

### Basic Hook

```typescript
import { describe, it, expect } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useCounter } from '@/hooks/use-counter';

describe('useCounter', () => {
  it('starts with initial value', () => {
    const { result } = renderHook(() => useCounter(10));
    expect(result.current.count).toBe(10);
  });

  it('increments and resets', () => {
    const { result } = renderHook(() => useCounter(0));
    act(() => result.current.increment());
    expect(result.current.count).toBe(1);
    act(() => result.current.reset());
    expect(result.current.count).toBe(0);
  });
});
```

### Hook with Rerender

```typescript
const { result, rerender } = renderHook(
  ({ value, delay }) => useDebounce(value, delay),
  { initialProps: { value: 'initial', delay: 300 } },
);
expect(result.current).toBe('initial');
rerender({ value: 'updated', delay: 300 });
expect(result.current).toBe('initial'); // Not yet updated (debounce)
```

### Hook with TanStack Query

```typescript
import { describe, it, expect, vi } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { createWrapper } from '@/test/test-utils';
import { useUsers } from '@/features/users/use-users';

vi.mock('@/lib/api-client', () => ({
  apiFetch: vi.fn().mockResolvedValue([{ id: '1', name: 'Alice' }]),
}));

describe('useUsers', () => {
  it('fetches users', async () => {
    const { result } = renderHook(() => useUsers(), { wrapper: createWrapper() });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data?.[0]?.name).toBe('Alice');
  });
});
```

---

## Module Mocking with vi.mock

### Mock Entire Module

```typescript
vi.mock('@/lib/analytics', () => ({
  trackEvent: vi.fn(),
  trackPageView: vi.fn(),
}));
```

### Partial Mock (Keep Original)

```typescript
vi.mock('@/lib/utils', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/lib/utils')>();
  return {
    ...actual,
    formatDate: vi.fn(() => '2026-01-01'), // Override only this
  };
});
```

### vi.hoisted for Shared References

Use when mock factory and test code need the same function reference:

```typescript
import { vi, it, expect } from 'vitest';

const { mockTrack } = vi.hoisted(() => ({
  mockTrack: vi.fn(),
}));

vi.mock('@/lib/analytics', () => ({
  trackEvent: mockTrack,
}));

import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { SignupButton } from '@/components/signup-button';

it('tracks analytics on click', async () => {
  const user = userEvent.setup();
  render(<SignupButton />);
  await user.click(screen.getByRole('button', { name: /sign up/i }));
  expect(mockTrack).toHaveBeenCalledWith('signup_clicked', { source: 'header' });
});
```

### Mock Environment Variables

```typescript
import { vi, it, expect, beforeEach, afterEach } from 'vitest';

beforeEach(() => vi.stubEnv('NEXT_PUBLIC_API_URL', 'http://localhost:3001'));
afterEach(() => vi.unstubAllEnvs());

it('reads env config', async () => {
  const { getApiUrl } = await import('@/lib/config');
  expect(getApiUrl()).toBe('http://localhost:3001');
});
```

---

## Snapshot Testing

Use sparingly for catching unintended visual regressions.

```typescript
import { it, expect } from 'vitest';
import { render } from '@testing-library/react';
import { Badge } from '@/components/ui/badge';

// Full snapshot
it('matches snapshot', () => {
  const { asFragment } = render(<Badge variant="secondary">New</Badge>);
  expect(asFragment()).toMatchSnapshot();
});

// Inline snapshot
it('renders formatted price', () => {
  const { container } = render(<Price amount={49.99} currency="USD" />);
  expect(container.textContent).toMatchInlineSnapshot(`"$49.99"`);
});
```

| Use Snapshots For | Avoid Snapshots For |
|---|---|
| Presentational component structure | Dynamic/time-based content |
| Catching unintended regressions | Large component trees |

---

## Integration Patterns

### Multi-Component Test

```typescript
import { describe, it, expect, vi } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithClient } from '@/test/test-utils';
import { TodoApp } from '@/features/todos/todo-app';
import { apiFetch } from '@/lib/api-client';

vi.mock('@/lib/api-client', () => ({ apiFetch: vi.fn() }));
const mockApiFetch = vi.mocked(apiFetch);

describe('TodoApp integration', () => {
  it('adds a new todo', async () => {
    mockApiFetch
      .mockResolvedValueOnce([{ id: '1', text: 'Buy milk', done: false }])
      .mockResolvedValueOnce({ id: '2', text: 'Walk dog', done: false });

    const user = userEvent.setup();
    renderWithClient(<TodoApp />);
    expect(await screen.findByText('Buy milk')).toBeInTheDocument();

    await user.type(screen.getByLabelText('New todo'), 'Walk dog');
    await user.click(screen.getByRole('button', { name: /add/i }));

    await waitFor(() => {
      expect(mockApiFetch).toHaveBeenCalledWith('/todos', expect.objectContaining({ method: 'POST' }));
    });
  });
});
```

### within() for Scoped Queries

```typescript
import { it, expect } from 'vitest';
import { render, screen, within } from '@testing-library/react';

it('renders order rows correctly', () => {
  render(<OrderTable orders={[{ id: '1', product: 'Widget', status: 'shipped' }]} />);
  const firstRow = within(screen.getAllByRole('row')[1]!);
  expect(firstRow.getByText('Widget')).toBeInTheDocument();
});
```

---

## Timer and Date Mocking

```typescript
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, act } from '@testing-library/react';

// Fake timers for setTimeout/setInterval
describe('AutoSave', () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  it('saves after delay', () => {
    const onSave = vi.fn();
    render(<AutoSave content="draft" onSave={onSave} />);
    act(() => vi.advanceTimersByTime(5000));
    expect(onSave).toHaveBeenCalledWith('draft');
  });
});

// Mock system time for Date-dependent components
describe('RelativeTime', () => {
  beforeEach(() => { vi.useFakeTimers(); vi.setSystemTime(new Date('2026-02-27T12:00:00Z')); });
  afterEach(() => vi.useRealTimers());

  it('shows relative time', () => {
    render(<RelativeTime timestamp="2026-02-27T10:00:00Z" />);
    expect(screen.getByText('2 hours ago')).toBeInTheDocument();
  });
});
```

---

## Test Organization

| Pattern | When to Use |
|---------|-------------|
| `component.test.tsx` | Unit tests for a single component |
| `feature.integration.test.tsx` | Multi-component integration tests |
| `hook.test.ts` | Custom hook tests (no JSX) |

Group tests by behavior: `describe('rendering')`, `describe('user interactions')`, `describe('error handling')`, `describe('accessibility')`.

`@testing-library/react` auto-cleans after each test. Clear mocks with `afterEach(() => vi.clearAllMocks())`.

---

**Version:** Vitest 4.x + Next.js 15.x | **Source:** https://nextjs.org/docs/app/guides/testing/vitest
