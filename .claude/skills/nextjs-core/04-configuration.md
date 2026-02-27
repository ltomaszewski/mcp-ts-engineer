# Next.js 15 App Router -- Configuration

Configuration files, middleware, environment variables, Image/Font optimization, and TypeScript setup.

---

## next.config.ts

TypeScript configuration file at the project root. Supports all Next.js config options with full type safety.

### Basic Setup

```typescript
// next.config.ts
import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  // Config options here
};

export default nextConfig;
```

### Common Options for BFF Architecture

```typescript
// next.config.ts
import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  // Disable ESLint during builds (using Biome instead)
  eslint: {
    ignoreDuringBuilds: true,
  },

  // Remote image domains
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'api.example.com',
        pathname: '/images/**',
      },
    ],
  },

  // Proxy API requests to backend (development)
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: `${process.env.BACKEND_URL ?? 'http://localhost:3001'}/api/:path*`,
      },
    ];
  },

  // Security headers
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
        ],
      },
    ];
  },

  // Enable React Strict Mode
  reactStrictMode: true,
};

export default nextConfig;
```

### Key Configuration Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `basePath` | `string` | `''` | URL prefix for the app (e.g., `/app`) |
| `compress` | `boolean` | `true` | Enable gzip compression |
| `distDir` | `string` | `'.next'` | Build output directory |
| `eslint.ignoreDuringBuilds` | `boolean` | `false` | Skip ESLint during `next build` |
| `images.remotePatterns` | `RemotePattern[]` | `[]` | Allowed remote image sources |
| `output` | `'standalone' \| 'export'` | -- | Build output mode |
| `poweredByHeader` | `boolean` | `true` | Include `X-Powered-By` header |
| `reactStrictMode` | `boolean` | `true` | Enable React Strict Mode |
| `trailingSlash` | `boolean` | `false` | Add trailing slash to URLs |
| `typescript.ignoreBuildErrors` | `boolean` | `false` | Skip type checking during build |
| `serverExternalPackages` | `string[]` | `[]` | Packages to keep as Node.js imports |

### Redirects

```typescript
async redirects() {
  return [
    {
      source: '/old-blog/:slug',
      destination: '/blog/:slug',
      permanent: true, // 308 status
    },
    {
      source: '/temp-page',
      destination: '/new-page',
      permanent: false, // 307 status
    },
  ];
},
```

### Rewrites

```typescript
async rewrites() {
  return {
    beforeFiles: [
      // Checked before pages/public files
      { source: '/api/:path*', destination: 'https://backend.example.com/:path*' },
    ],
    afterFiles: [
      // Checked after pages but before fallback
      { source: '/docs/:path*', destination: 'https://docs.example.com/:path*' },
    ],
    fallback: [
      // Checked after all pages and afterFiles
      { source: '/:path*', destination: 'https://proxy.example.com/:path*' },
    ],
  };
},
```

### Headers

```typescript
async headers() {
  return [
    {
      source: '/api/:path*',
      headers: [
        { key: 'Access-Control-Allow-Origin', value: 'https://app.example.com' },
        { key: 'Access-Control-Allow-Methods', value: 'GET, POST, PUT, DELETE' },
        { key: 'Access-Control-Allow-Headers', value: 'Content-Type, Authorization' },
      ],
    },
    {
      source: '/(.*)',
      headers: [
        {
          key: 'Content-Security-Policy',
          value: "default-src 'self'; script-src 'self' 'unsafe-eval' 'unsafe-inline';",
        },
      ],
    },
  ];
},
```

### Standalone Output (Docker)

```typescript
const nextConfig: NextConfig = {
  output: 'standalone', // Produces minimal deployment bundle
};
```

Creates a self-contained output in `.next/standalone` that can be deployed without `node_modules`.

### Turbopack

```typescript
const nextConfig: NextConfig = {
  // Turbopack is enabled via CLI: next dev --turbopack
  // Configure Turbopack-specific options:
  turbopack: {
    resolveAlias: {
      // Custom module aliases for Turbopack
    },
  },
};
```

Turbopack is Next.js's Rust-based bundler for development. Enable with `next dev --turbopack`.

---

## Middleware

Runs before every request. Located at the project root (same level as `app/`).

**Note:** In Next.js 16+, `middleware.ts` is being renamed to `proxy.ts`. For Next.js 15, use `middleware.ts`.

### Basic Middleware

```typescript
// middleware.ts (project root)
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest): NextResponse {
  // Example: redirect unauthenticated users
  const token = request.cookies.get('session-token');

  if (!token && request.nextUrl.pathname.startsWith('/dashboard')) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  return NextResponse.next();
}

// Only run on matching paths
export const config = {
  matcher: ['/dashboard/:path*', '/settings/:path*'],
};
```

### Matcher Configuration

```typescript
export const config = {
  // Single path
  matcher: '/about',

  // Multiple paths
  matcher: ['/about', '/contact', '/dashboard/:path*'],

  // Regex: exclude static files and API routes
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt).*)',
  ],

  // Advanced matcher with conditions
  matcher: [
    {
      source: '/api/:path*',
      has: [
        { type: 'header', key: 'Authorization', value: 'Bearer (.*)' },
      ],
    },
    {
      source: '/((?!_next).*)',
      missing: [
        { type: 'header', key: 'next-router-prefetch' },
      ],
    },
  ],
};
```

### Setting Headers

```typescript
export function middleware(request: NextRequest): NextResponse {
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set('x-request-id', crypto.randomUUID());

  const response = NextResponse.next({
    request: {
      headers: requestHeaders, // Forward modified headers upstream
    },
  });

  response.headers.set('x-response-time', Date.now().toString());
  return response;
}
```

### Cookies in Middleware

```typescript
export function middleware(request: NextRequest): NextResponse {
  // Read cookie
  const theme = request.cookies.get('theme')?.value;

  // Set cookie on response
  const response = NextResponse.next();
  response.cookies.set('visited', 'true', {
    path: '/',
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 * 30, // 30 days
  });

  return response;
}
```

### Rewriting in Middleware

```typescript
export function middleware(request: NextRequest): NextResponse {
  const { pathname } = request.nextUrl;

  // A/B testing via rewrite
  if (pathname === '/pricing') {
    const variant = request.cookies.get('pricing-variant')?.value || 'a';
    return NextResponse.rewrite(new URL(`/pricing/${variant}`, request.url));
  }

  return NextResponse.next();
}
```

### Execution Order

1. `headers` from `next.config.ts`
2. `redirects` from `next.config.ts`
3. Middleware (rewrites, redirects, etc.)
4. `beforeFiles` rewrites from `next.config.ts`
5. Filesystem routes (`public/`, `_next/static/`, pages, app)
6. `afterFiles` rewrites from `next.config.ts`
7. Dynamic routes (`/blog/[slug]`)
8. `fallback` rewrites from `next.config.ts`

---

## Environment Variables

### Loading

Next.js loads `.env` files automatically:

| File | When Loaded | Git Commit? |
|------|------------|-------------|
| `.env` | All environments | Yes |
| `.env.local` | All (overrides `.env`) | No |
| `.env.development` | `next dev` only | Yes |
| `.env.development.local` | `next dev` only | No |
| `.env.production` | `next build`/`next start` | Yes |
| `.env.production.local` | `next build`/`next start` | No |
| `.env.test` | `NODE_ENV=test` only | Yes |

**Load order** (first found wins):
1. `process.env`
2. `.env.$(NODE_ENV).local`
3. `.env.local` (not loaded in test)
4. `.env.$(NODE_ENV)`
5. `.env`

### Server-Only Variables

```bash
# .env
DATABASE_URL=postgresql://localhost:5432/mydb
API_SECRET=secret-key-here
BACKEND_URL=http://localhost:3001
```

Access in Server Components, Server Actions, middleware, and `next.config.ts`:

```typescript
// Server Component
export default async function Page() {
  const backendUrl = process.env.BACKEND_URL;
  const data = await fetch(`${backendUrl}/api/data`);
  // ...
}
```

### Browser-Accessible Variables

Prefix with `NEXT_PUBLIC_` to expose to the browser:

```bash
# .env
NEXT_PUBLIC_API_URL=https://api.example.com
NEXT_PUBLIC_APP_VERSION=1.0.0
```

```typescript
// Client Component -- value is inlined at build time
'use client';

const apiUrl = process.env.NEXT_PUBLIC_API_URL;
```

**Important:**
- `NEXT_PUBLIC_` values are **inlined at build time** into the JS bundle
- They will NOT update at runtime -- rebuild to change them
- Dynamic lookups like `process.env[varName]` are NOT inlined

### Variable References

```bash
# .env
HOSTNAME=localhost
PORT=3001
API_URL=http://$HOSTNAME:$PORT
# Result: API_URL = http://localhost:3001
```

### .env.example File

```bash
# .env.example -- committed to git, no values
NEXT_PUBLIC_API_URL=
BACKEND_URL=
DATABASE_URL=
API_SECRET=
```

---

## Image Optimization

The `<Image>` component from `next/image` provides automatic optimization.

### Local Images

```typescript
// Static import -- width/height auto-detected
import Image from 'next/image';
import heroImage from '@/public/hero.jpg';

export function Hero() {
  return (
    <Image
      src={heroImage}
      alt="Hero banner"
      placeholder="blur" // Auto-generated blur placeholder
      priority           // Preload for LCP images
    />
  );
}
```

### Remote Images

```typescript
import Image from 'next/image';

export function UserAvatar({ src, name }: { src: string; name: string }) {
  return (
    <Image
      src={src}
      alt={`${name}'s avatar`}
      width={64}
      height={64}
      className="rounded-full"
    />
  );
}
```

Requires `remotePatterns` in `next.config.ts`:

```typescript
const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'avatars.example.com',
        pathname: '/users/**',
      },
    ],
  },
};
```

### Fill Mode

```typescript
// Image fills its parent container
export function Banner() {
  return (
    <div className="relative h-64 w-full">
      <Image
        src="/banner.jpg"
        alt="Banner"
        fill
        className="object-cover"
        sizes="100vw"
      />
    </div>
  );
}
```

### Key Image Props

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| `src` | `string \| StaticImport` | Yes | Image source |
| `alt` | `string` | Yes | Alt text for accessibility |
| `width` | `number` | Yes* | Intrinsic width in pixels |
| `height` | `number` | Yes* | Intrinsic height in pixels |
| `fill` | `boolean` | No | Fill parent container (replaces width/height) |
| `sizes` | `string` | Recommended with `fill` | Responsive size hints |
| `priority` | `boolean` | No | Preload (for LCP images) |
| `placeholder` | `'blur' \| 'empty'` | No | Placeholder while loading |
| `quality` | `number` | No | 1-100, default 75 |
| `loading` | `'lazy' \| 'eager'` | No | Default: `'lazy'` |

*Required unless using `fill` or static import.

---

## Font Optimization

`next/font` automatically optimizes fonts with zero layout shift.

### Google Fonts

```typescript
// app/layout.tsx
import { Inter, Roboto_Mono } from 'next/font/google';

const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-inter',
});

const robotoMono = Roboto_Mono({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-roboto-mono',
});

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${inter.variable} ${robotoMono.variable}`}>
      <body className={inter.className}>{children}</body>
    </html>
  );
}
```

### Local Fonts

```typescript
import localFont from 'next/font/local';

const myFont = localFont({
  src: [
    { path: './fonts/MyFont-Regular.woff2', weight: '400', style: 'normal' },
    { path: './fonts/MyFont-Bold.woff2', weight: '700', style: 'normal' },
  ],
  display: 'swap',
  variable: '--font-my-font',
});
```

### With Tailwind CSS v4

In Tailwind v4 (CSS-first config), reference font variables in your CSS:

```css
/* globals.css */
@import "tailwindcss";

@theme {
  --font-sans: var(--font-inter), ui-sans-serif, system-ui, sans-serif;
  --font-mono: var(--font-roboto-mono), ui-monospace, monospace;
}
```

---

## TypeScript Configuration

### tsconfig.json

```json
{
  "compilerOptions": {
    "target": "ES2017",
    "lib": ["dom", "dom.iterable", "esnext"],
    "allowJs": true,
    "skipLibCheck": true,
    "strict": true,
    "noEmit": true,
    "esModuleInterop": true,
    "module": "esnext",
    "moduleResolution": "bundler",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "jsx": "preserve",
    "incremental": true,
    "plugins": [{ "name": "next" }],
    "paths": {
      "@/*": ["./src/*"]
    },
    "noUncheckedIndexedAccess": true
  },
  "include": ["next-env.d.ts", "**/*.ts", "**/*.tsx", ".next/types/**/*.ts"],
  "exclude": ["node_modules"]
}
```

### Type Helpers (Next.js 15)

Globally available type helpers after running `next dev` or `next build`:

```typescript
// PageProps -- types params and searchParams from route structure
export default async function Page(props: PageProps<'/blog/[slug]'>) {
  const { slug } = await props.params;
  return <h1>Blog post: {slug}</h1>;
}

// LayoutProps -- types children and named slots
export default function Layout(props: LayoutProps<'/dashboard'>) {
  return <div>{props.children}</div>;
}
```

---

## Vitest Configuration (This Project)

Next.js apps in this monorepo use Vitest (not Jest):

```typescript
// vitest.config.ts
import react from '@vitejs/plugin-react';
import tsconfigPaths from 'vite-tsconfig-paths';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  plugins: [react(), tsconfigPaths()],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./vitest.setup.ts'],
    include: ['src/**/*.test.{ts,tsx}'],
  },
});
```

```typescript
// vitest.setup.ts
import '@testing-library/jest-dom/vitest';
```

---

## Biome Configuration (This Project)

Biome replaces ESLint. Minimal per-app config inherits from root:

```json
{
  "$schema": "https://biomejs.dev/schemas/2.0.0/schema.json",
  "files": {
    "ignore": [".next/"]
  }
}
```

Disable ESLint in Next.js config:

```typescript
const nextConfig: NextConfig = {
  eslint: { ignoreDuringBuilds: true },
};
```

---

## Static Export

Generate a fully static site (no server required):

```typescript
const nextConfig: NextConfig = {
  output: 'export',
};
```

**Limitations:** No Server Components with dynamic data, no middleware, no ISR, no Image optimization (without custom loader).

---

## Quick Reference

| Config Task | Where | Example |
|-------------|-------|---------|
| Redirect | `next.config.ts` `redirects()` | `{ source: '/old', destination: '/new', permanent: true }` |
| Rewrite | `next.config.ts` `rewrites()` | `{ source: '/api/:path*', destination: 'https://backend/:path*' }` |
| Custom headers | `next.config.ts` `headers()` | `{ key: 'X-Frame-Options', value: 'DENY' }` |
| Remote images | `next.config.ts` `images.remotePatterns` | `{ hostname: 'cdn.example.com' }` |
| Auth redirect | `middleware.ts` | `NextResponse.redirect(new URL('/login', req.url))` |
| Browser env var | `.env` | `NEXT_PUBLIC_API_URL=https://...` |
| Server env var | `.env` | `DATABASE_URL=postgresql://...` |
| Google Font | `next/font/google` | `const inter = Inter({ subsets: ['latin'] })` |
| Local Font | `next/font/local` | `localFont({ src: './fonts/MyFont.woff2' })` |
| Standalone build | `next.config.ts` | `output: 'standalone'` |
| Turbopack dev | CLI | `next dev --turbopack` |

---

**Version:** 15.x | **Source:** https://nextjs.org/docs
