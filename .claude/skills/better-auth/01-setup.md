# Better Auth Setup Guide

## Installation

### Package Installation

Install Better Auth in your project. For separate client/server setups, install in both.

```bash
npm install better-auth
# or
pnpm add better-auth
# or
yarn add better-auth
# or
bun add better-auth
```

### Environment Variables

Create a `.env` file in your project root:

```dotenv
# Required - at least 32 chars, high entropy
BETTER_AUTH_SECRET=your-secret-key-at-least-32-characters-long

# Required - your app's base URL
BETTER_AUTH_URL=http://localhost:3000

# OAuth providers (add as needed)
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
GITHUB_CLIENT_ID=your-github-client-id
GITHUB_CLIENT_SECRET=your-github-client-secret
```

Generate a secure secret:

```bash
openssl rand -base64 32
```

The `BETTER_AUTH_URL` is critical for OAuth callback URLs. Without it, callbacks default to localhost and fail in production.

---

## Server-Side Auth Configuration

Create `lib/auth.ts` (or `src/lib/auth.ts`, `server/auth.ts`, etc.):

```typescript
import { betterAuth } from "better-auth";

export const auth = betterAuth({
  baseURL: process.env.BETTER_AUTH_URL,
  emailAndPassword: {
    enabled: true,
    autoSignIn: true, // auto sign-in after signup (default: true)
  },
  session: {
    expiresIn: 60 * 60 * 24 * 7,  // 7 days (seconds)
    updateAge: 60 * 60 * 24,       // refresh after 1 day
  },
});
```

### Full Configuration with Social Providers

```typescript
import { betterAuth } from "better-auth";

export const auth = betterAuth({
  baseURL: process.env.BETTER_AUTH_URL,
  emailAndPassword: {
    enabled: true,
  },
  socialProviders: {
    google: {
      clientId: process.env.GOOGLE_CLIENT_ID as string,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET as string,
    },
    github: {
      clientId: process.env.GITHUB_CLIENT_ID as string,
      clientSecret: process.env.GITHUB_CLIENT_SECRET as string,
    },
  },
  session: {
    expiresIn: 60 * 60 * 24 * 7,
    updateAge: 60 * 60 * 24,
  },
});
```

---

## Database Adapter Setup

Better Auth requires a database. Choose one of these adapters:

### SQLite (Built-in)

```typescript
import { betterAuth } from "better-auth";
import Database from "better-sqlite3";

export const auth = betterAuth({
  database: new Database("./sqlite.db"),
});
```

### PostgreSQL (Built-in)

```typescript
import { betterAuth } from "better-auth";
import { Pool } from "pg";

export const auth = betterAuth({
  database: new Pool({
    connectionString: process.env.DATABASE_URL,
  }),
});
```

### MySQL (Built-in)

```typescript
import { betterAuth } from "better-auth";
import { createPool } from "mysql2/promise";

export const auth = betterAuth({
  database: createPool({
    uri: process.env.DATABASE_URL,
  }),
});
```

### Drizzle ORM Adapter

```typescript
import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { db } from "./db"; // your Drizzle instance

export const auth = betterAuth({
  database: drizzleAdapter(db, {
    provider: "pg", // "pg" | "mysql" | "sqlite"
  }),
});
```

### Prisma ORM Adapter

```typescript
import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { prisma } from "./db"; // your Prisma client

export const auth = betterAuth({
  database: prismaAdapter(prisma, {
    provider: "postgresql", // "postgresql" | "mysql" | "sqlite"
  }),
});
```

### MongoDB Adapter

```typescript
import { betterAuth } from "better-auth";
import { mongodbAdapter } from "better-auth/adapters/mongodb";
import { client } from "./db"; // your MongoDB client

export const auth = betterAuth({
  database: mongodbAdapter(client),
});
```

### Database Schema (Core Tables)

Better Auth requires four core tables:

| Table | Key Fields |
|---|---|
| `user` | `id`, `name`, `email`, `emailVerified`, `image`, `createdAt`, `updatedAt` |
| `session` | `id`, `userId`, `token`, `expiresAt`, `ipAddress`, `userAgent` |
| `account` | `id`, `userId`, `accountId`, `providerId`, `accessToken`, `refreshToken`, `password` |
| `verification` | `id`, `identifier`, `value`, `expiresAt` |

### Running Migrations

Generate and apply schema:

```bash
# Apply migrations directly (built-in Kysely adapter only)
npx @better-auth/cli migrate

# Generate schema files (works with all adapters including Prisma/Drizzle)
npx @better-auth/cli generate
```

Always run migrations after adding plugins, as plugins may add new tables or columns.

### Custom Table/Column Names

```typescript
export const auth = betterAuth({
  user: {
    modelName: "users",       // rename table
    fields: {
      name: "full_name",      // rename column
      email: "email_address",
    },
  },
  session: {
    modelName: "user_sessions",
    fields: {
      userId: "user_id",
    },
  },
});
```

### Extending Core Schema with Custom Fields

```typescript
export const auth = betterAuth({
  user: {
    additionalFields: {
      role: {
        type: ["user", "admin"],
        required: false,
        defaultValue: "user",
        input: false, // prevent user from setting this on signup
      },
      lang: {
        type: "string",
        required: false,
        defaultValue: "en",
      },
    },
  },
});
```

### Custom ID Generation

```typescript
export const auth = betterAuth({
  advanced: {
    database: {
      generateId: false,                  // let database auto-generate
      // or
      generateId: "uuid",                 // use UUIDs
      // or
      generateId: "serial",              // auto-incrementing numeric
      // or
      generateId: () => crypto.randomUUID(), // custom function
    },
  },
});
```

---

## Client-Side Auth Configuration

Create `lib/auth-client.ts`:

```typescript
import { createAuthClient } from "better-auth/react";

export const authClient = createAuthClient({
  baseURL: process.env.NEXT_PUBLIC_BETTER_AUTH_URL,
});
```

The client uses `nano-store` for reactive state and `better-fetch` for HTTP requests. No extra dependencies needed.

### Client with Plugin Type Inference

When using plugins, pass the `auth` type for full type safety:

```typescript
import { createAuthClient } from "better-auth/react";
import { adminClient } from "better-auth/client/plugins";
import { organizationClient } from "better-auth/client/plugins";
import type { auth } from "@/lib/auth";

export const authClient = createAuthClient({
  baseURL: process.env.NEXT_PUBLIC_BETTER_AUTH_URL,
  plugins: [
    adminClient(),
    organizationClient(),
  ],
});
```

---

## Next.js Integration

### API Route Handler (App Router)

Create the catch-all route at `app/api/auth/[...all]/route.ts`:

```typescript
import { auth } from "@/lib/auth";
import { toNextJsHandler } from "better-auth/next-js";

export const { POST, GET } = toNextJsHandler(auth);
```

### Pages Router (Alternative)

For Next.js Pages Router at `pages/api/auth/[...all].ts`:

```typescript
import { toNodeHandler } from "better-auth/node";
import { auth } from "@/lib/auth";

export const config = { api: { bodyParser: false } };

export default toNodeHandler(auth.handler);
```

### Server Components

Access sessions in React Server Components:

```typescript
import { auth } from "@/lib/auth";
import { headers } from "next/headers";

export async function ServerComponent() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    return <div>Not authenticated</div>;
  }

  return <div>Welcome {session.user.name}</div>;
}
```

### Server Actions

For server actions that set cookies, add the `nextCookies` plugin:

```typescript
// lib/auth.ts
import { betterAuth } from "better-auth";
import { nextCookies } from "better-auth/next-js";

export const auth = betterAuth({
  plugins: [nextCookies()],
  // ... rest of config
});
```

Then in your server action:

```typescript
"use server";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";

export async function getSessionAction() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });
  return session;
}
```

### Middleware Integration

#### Edge Runtime (Next.js 13-15.1.x) - Cookie Check Only

```typescript
// middleware.ts
import { NextRequest, NextResponse } from "next/server";
import { getSessionCookie } from "better-auth/cookies";

export function middleware(request: NextRequest) {
  const sessionCookie = getSessionCookie(request);
  if (!sessionCookie) {
    return NextResponse.redirect(new URL("/sign-in", request.url));
  }
  return NextResponse.next();
}

export const config = {
  matcher: ["/dashboard/:path*", "/settings/:path*"],
};
```

This only checks cookie existence, not validity. Always validate sessions in route handlers.

#### Node.js Runtime (Next.js 15.2.0+) - Full Session Validation

```typescript
// middleware.ts
import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";

export async function middleware(request: NextRequest) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });
  if (!session) {
    return NextResponse.redirect(new URL("/sign-in", request.url));
  }
  return NextResponse.next();
}

export const config = {
  runtime: "nodejs",
  matcher: ["/dashboard/:path*"],
};
```

#### Cookie Cache Check (Edge Compatible)

If session cookie caching is enabled, you can check the cached session in middleware:

```typescript
// middleware.ts
import { NextRequest, NextResponse } from "next/server";
import { getCookieCache } from "better-auth/cookies";

export async function middleware(request: NextRequest) {
  const session = await getCookieCache(request);
  if (!session) {
    return NextResponse.redirect(new URL("/sign-in", request.url));
  }
  return NextResponse.next();
}

export const config = {
  matcher: ["/dashboard/:path*"],
};
```

#### Per-Page Protection (Recommended)

Protect individual pages in Server Components:

```typescript
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

export default async function DashboardPage() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    redirect("/sign-in");
  }

  return <h1>Welcome {session.user.name}</h1>;
}
```

---

## Session Cookie Caching

Reduce database queries by caching session data in signed cookies:

```typescript
export const auth = betterAuth({
  session: {
    cookieCache: {
      enabled: true,
      maxAge: 5 * 60, // 5 minutes
      strategy: "compact", // "compact" | "jwt" | "jwe"
    },
  },
});
```

| Strategy | Size | Security | Best For |
|---|---|---|---|
| `compact` | Smallest | Signed | Performance-critical apps |
| `jwt` | Medium | Signed | Third-party integrations |
| `jwe` | Largest | Encrypted | Sensitive/regulated data |

Bypass cache when needed:

```typescript
// Client
const session = await authClient.getSession({
  query: { disableCookieCache: true },
});

// Server
const session = await auth.api.getSession({
  query: { disableCookieCache: true },
  headers: await headers(),
});
```

---

## Secondary Storage (Redis)

Use Redis for high-performance session storage:

```typescript
import { createClient } from "redis";
import { betterAuth } from "better-auth";

const redis = createClient();
await redis.connect();

export const auth = betterAuth({
  secondaryStorage: {
    get: async (key) => await redis.get(key),
    set: async (key, value, ttl) => {
      if (ttl) await redis.set(key, value, { EX: ttl });
      else await redis.set(key, value);
    },
    delete: async (key) => {
      await redis.del(key);
    },
  },
});
```

---

## Plugin System

Add plugins to extend functionality:

```typescript
import { betterAuth } from "better-auth";
import { admin } from "better-auth/plugins";
import { organization } from "better-auth/plugins";
import { twoFactor } from "better-auth/plugins";
import { nextCookies } from "better-auth/next-js";

export const auth = betterAuth({
  plugins: [
    nextCookies(),
    admin(),
    organization(),
    twoFactor(),
  ],
  // ... rest of config
});
```

Client-side plugin registration:

```typescript
import { createAuthClient } from "better-auth/react";
import { adminClient } from "better-auth/client/plugins";
import { organizationClient } from "better-auth/client/plugins";
import { twoFactorClient } from "better-auth/client/plugins";

export const authClient = createAuthClient({
  plugins: [
    adminClient(),
    organizationClient(),
    twoFactorClient(),
  ],
});
```

Always run migrations after adding plugins:

```bash
npx @better-auth/cli migrate
```

---

## Database Hooks

Execute custom logic during database operations:

```typescript
import { betterAuth } from "better-auth";
import { APIError } from "better-auth/api";

export const auth = betterAuth({
  databaseHooks: {
    user: {
      create: {
        before: async (user, ctx) => {
          if (!user.isAgreedToTerms) {
            throw new APIError("BAD_REQUEST", {
              message: "Must agree to terms",
            });
          }
          return { data: { ...user, firstName: user.name.split(" ")[0] } };
        },
        after: async (user) => {
          // Send welcome email, create Stripe customer, etc.
        },
      },
    },
    session: {
      create: {
        before: async (session) => {
          // Set default active organization on login
          const org = await getDefaultOrg(session.userId);
          return {
            data: { ...session, activeOrganizationId: org?.id },
          };
        },
      },
    },
  },
});
```

---

## BFF Pattern: Next.js + NestJS Backend

When using Better Auth in Next.js as a BFF with a NestJS backend:

1. Better Auth runs in Next.js, handling all auth flows and session management
2. Next.js stores the session cookie and validates it on each request
3. NestJS backend receives authenticated requests from Next.js server-side code
4. Forward the session token or user context from Next.js to NestJS as needed

```typescript
// Next.js server action forwarding auth context to NestJS
"use server";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";

export async function fetchFromBackend(endpoint: string) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    throw new Error("Not authenticated");
  }

  const response = await fetch(`${process.env.BACKEND_URL}${endpoint}`, {
    headers: {
      "Authorization": `Bearer ${session.session.token}`,
      "X-User-Id": session.user.id,
    },
  });

  return response.json();
}
```

**Version:** 1.4.x | **Source:** https://www.better-auth.com/docs
