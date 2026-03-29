# Next.js Testing Setup

Vitest configuration, setup file, and module mocks for Next.js App Router projects.

---

## Dependencies

Install all required dev dependencies:

```bash
npm install -D vitest @vitejs/plugin-react jsdom @testing-library/react @testing-library/dom @testing-library/jest-dom @testing-library/user-event vite-tsconfig-paths
```

| Package | Purpose |
|---------|---------|
| `vitest` | Test runner (Vitest 4.x) |
| `@vitejs/plugin-react` | JSX transform for React in Vite/Vitest |
| `jsdom` | Browser environment simulation |
| `@testing-library/react` | Component rendering and queries |
| `@testing-library/dom` | DOM query utilities (peer dependency) |
| `@testing-library/jest-dom` | Custom DOM matchers (`toBeInTheDocument`, etc.) |
| `@testing-library/user-event` | User interaction simulation |
| `vite-tsconfig-paths` | Resolves `@/` path aliases from tsconfig.json |

---

## vitest.config.ts

The Vitest configuration file at the project root. Uses `@vitejs/plugin-react` for JSX and `vite-tsconfig-paths` for `@/` alias resolution.

```typescript
// vitest.config.ts
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import tsconfigPaths from 'vite-tsconfig-paths';

export default defineConfig({
  plugins: [tsconfigPaths(), react()],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./vitest.setup.ts'],
    include: ['src/**/*.test.{ts,tsx}'],
    exclude: ['node_modules', '.next', 'e2e'],
    css: false,
    coverage: {
      provider: 'v8',
      include: ['src/**/*.{ts,tsx}'],
      exclude: [
        'src/**/*.test.{ts,tsx}',
        'src/**/*.d.ts',
        'src/**/index.ts',
        'src/app/layout.tsx',
        'src/app/globals.css',
      ],
      thresholds: {
        lines: 80,
        functions: 80,
        statements: 80,
      },
    },
  },
});
```

### Configuration Details

| Option | Value | Rationale |
|--------|-------|-----------|
| `environment` | `'jsdom'` | Simulates browser DOM for React components |
| `globals` | `true` | Enables `describe`, `it`, `expect` without imports (optional) |
| `setupFiles` | `['./vitest.setup.ts']` | Runs before each test file for global setup |
| `include` | `['src/**/*.test.{ts,tsx}']` | Test files co-located with source |
| `css` | `false` | Skips CSS processing (Tailwind classes are strings) |
| `plugins: [react()]` | -- | Required for JSX transform in .tsx test files |
| `plugins: [tsconfigPaths()]` | -- | Resolves `@/components/...` imports in tests |

### Without globals

If you prefer explicit imports (no `globals: true`):

```typescript
// In every test file:
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
```

---

## vitest.setup.ts

The setup file runs before every test file. It imports `@testing-library/jest-dom` for DOM matchers and sets up global mocks for Next.js modules.

```typescript
// vitest.setup.ts
import '@testing-library/jest-dom/vitest';
import { vi } from 'vitest';

// -------------------------------------------------------
// Mock: next/navigation
// -------------------------------------------------------
// Most Client Components use useRouter, usePathname, or useSearchParams.
// Without this mock, any component importing from next/navigation will crash.
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
    back: vi.fn(),
    forward: vi.fn(),
    refresh: vi.fn(),
    prefetch: vi.fn(),
  }),
  usePathname: () => '/',
  useSearchParams: () => new URLSearchParams(),
  useParams: () => ({}),
  useSelectedLayoutSegment: () => null,
  useSelectedLayoutSegments: () => [],
  redirect: vi.fn(),
  notFound: vi.fn(),
}));

// -------------------------------------------------------
// Mock: next/image
// -------------------------------------------------------
// next/image requires server-side optimization. In tests, render as plain <img>.
vi.mock('next/image', () => ({
  default: (props: React.ImgHTMLAttributes<HTMLImageElement>) => {
    // eslint-disable-next-line @next/next/no-img-element, jsx-a11y/alt-text
    return <img {...props} />;
  },
}));

// -------------------------------------------------------
// Mock: next/font/google (and next/font/local)
// -------------------------------------------------------
// Next.js font optimization runs at build time. In tests, return a no-op.
vi.mock('next/font/google', () => ({
  Inter: () => ({
    className: 'inter-mock',
    style: { fontFamily: 'Inter' },
  }),
  Geist: () => ({
    className: 'geist-mock',
    style: { fontFamily: 'Geist' },
  }),
  Geist_Mono: () => ({
    className: 'geist-mono-mock',
    style: { fontFamily: 'Geist Mono' },
  }),
}));

vi.mock('next/font/local', () => ({
  default: () => ({
    className: 'local-font-mock',
    style: { fontFamily: 'local-font' },
  }),
}));

// -------------------------------------------------------
// Mock: next/link
// -------------------------------------------------------
// next/link prefetches routes. In tests, render as plain <a>.
// Also mock useLinkStatus (added in 15.3) for components using pending state.
vi.mock('next/link', () => ({
  default: ({
    children,
    href,
    ...props
  }: { children: React.ReactNode; href: string } & Record<string, unknown>) => {
    return <a href={href} {...props}>{children}</a>;
  },
  useLinkStatus: () => ({ pending: false }),
}));

// -------------------------------------------------------
// Mock: next/headers (for Server Component tests)
// -------------------------------------------------------
vi.mock('next/headers', () => ({
  cookies: () => ({
    get: vi.fn(),
    set: vi.fn(),
    delete: vi.fn(),
    has: vi.fn(),
    getAll: vi.fn(() => []),
  }),
  headers: () => new Map(),
}));

// -------------------------------------------------------
// Cleanup
// -------------------------------------------------------
// @testing-library/react automatically calls cleanup in afterEach
// when using Vitest with globals or when the framework supports it.
```

### Adding Custom Font Mocks

If your project uses fonts not listed above, add them to the `next/font/google` mock:

```typescript
vi.mock('next/font/google', () => ({
  Inter: () => ({ className: 'inter-mock', style: { fontFamily: 'Inter' } }),
  Roboto: () => ({ className: 'roboto-mock', style: { fontFamily: 'Roboto' } }),
  // Add any fonts your project imports
}));
```

---

## Package.json Scripts

```json
{
  "scripts": {
    "test": "vitest run",
    "test:watch": "vitest",
    "test:coverage": "vitest run --coverage"
  }
}
```

| Script | Behavior |
|--------|----------|
| `test` | Single run, exits with code 0/1 |
| `test:watch` | Watch mode, re-runs on file changes |
| `test:coverage` | Single run with V8 coverage report |

---

## TypeScript Configuration

Ensure your `tsconfig.json` has path aliases configured for `@/` resolution:

```json
{
  "compilerOptions": {
    "baseUrl": ".",
    "paths": {
      "@/*": ["./src/*"]
    },
    "jsx": "preserve",
    "types": ["vitest/globals"]
  }
}
```

The `"types": ["vitest/globals"]` entry provides type definitions for `describe`, `it`, `expect`, `vi` when using `globals: true` in Vitest config.

---

## Test File Location

Tests are co-located with source code in `__tests__/` directories:

```
src/
  features/
    users/
      user-profile.tsx
      __tests__/
        user-profile.test.tsx
  components/
    header.tsx
    __tests__/
      header.test.tsx
  hooks/
    use-debounce.ts
    __tests__/
      use-debounce.test.ts
  app/
    page.tsx
    __tests__/
      page.test.tsx
```

Alternatively, place test files adjacent to source files:

```
src/
  features/
    users/
      user-profile.tsx
      user-profile.test.tsx
```

Both patterns work with the `include: ['src/**/*.test.{ts,tsx}']` configuration.

---

## Per-Test Mock Overrides

The setup file provides default mocks. Override them in individual test files when needed:

```typescript
import { vi, describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';

// Override the global mock for this file
const mockPush = vi.fn();
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
    replace: vi.fn(),
    back: vi.fn(),
    forward: vi.fn(),
    refresh: vi.fn(),
    prefetch: vi.fn(),
  }),
  usePathname: () => '/dashboard',
  useSearchParams: () => new URLSearchParams('tab=settings'),
  useParams: () => ({ id: '123' }),
}));

import { DashboardNav } from '@/components/dashboard-nav';

describe('DashboardNav', () => {
  it('highlights current path', () => {
    render(<DashboardNav />);
    expect(screen.getByRole('link', { name: /dashboard/i }))
      .toHaveAttribute('aria-current', 'page');
  });

  it('navigates on click', async () => {
    const user = (await import('@testing-library/user-event')).default.setup();
    render(<DashboardNav />);
    await user.click(screen.getByRole('link', { name: /profile/i }));
    expect(mockPush).toHaveBeenCalledWith('/profile');
  });
});
```

### Important: vi.mock hoisting

`vi.mock()` calls are automatically hoisted to the top of the file by Vitest. This means:

1. The mock is applied before any imports
2. You can define mock variables with `vi.fn()` above the `vi.mock()` call
3. Use `vi.hoisted()` if you need to reference the mock function inside the factory

```typescript
import { vi } from 'vitest';

// vi.hoisted runs before vi.mock, allowing shared references
const { mockPush } = vi.hoisted(() => ({
  mockPush: vi.fn(),
}));

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: mockPush }),
  usePathname: () => '/',
  useSearchParams: () => new URLSearchParams(),
  useParams: () => ({}),
}));

// Now mockPush is available in tests AND inside the mock factory
```

---

## Environment Variables in Tests

Mock environment variables using `vi.stubEnv()`:

```typescript
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';

describe('API client', () => {
  beforeEach(() => {
    vi.stubEnv('NEXT_PUBLIC_API_URL', 'http://localhost:3001');
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it('uses configured API URL', () => {
    expect(process.env.NEXT_PUBLIC_API_URL).toBe('http://localhost:3001');
  });
});
```

---

## Common Setup Issues

| Issue | Cause | Fix |
|-------|-------|-----|
| `ReferenceError: document is not defined` | Missing jsdom environment | Add `environment: 'jsdom'` to vitest.config.ts |
| `Cannot find module '@/...'` | Missing path resolution | Add `tsconfigPaths()` to plugins |
| `toBeInTheDocument is not a function` | Missing jest-dom setup | Import `@testing-library/jest-dom/vitest` in setup file |
| `TypeError: Cannot read properties of undefined (reading 'push')` | Missing next/navigation mock | Add `vi.mock('next/navigation')` to setup file |
| `Error: Invariant: headers/cookies can only be called in a Server Component` | Testing server-only code in jsdom | Mock `next/headers` or test with E2E |
| JSX not recognized in `.tsx` test files | Missing React plugin | Add `react()` to vitest.config.ts plugins |
| CSS import errors | Vitest trying to parse CSS | Set `css: false` in vitest.config.ts |
| `useLinkStatus is not a function` | Missing next/link mock (15.3+) | Add `useLinkStatus: () => ({ pending: false })` to next/link mock |

---

**Version:** Vitest 4.x + Next.js 15.5.x | **Source:** https://nextjs.org/docs/app/guides/testing/vitest
