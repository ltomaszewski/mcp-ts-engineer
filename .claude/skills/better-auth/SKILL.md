---
name: better-auth
description: "Better Auth v1.5.6 authentication — email/password, OAuth, sessions, RBAC, MFA, i18n, MCP auth, OAuth 2.1 provider, test utilities, secret rotation."
when_to_use: "Use when implementing auth, managing sessions, adding social login, or role-based access."
---

# Better Auth

> Full-stack authentication with email/password, social login, MFA, session management, MCP auth, OAuth 2.1 provider, i18n, and test utilities.

**Stack:** better-auth + @better-auth/react

> **BFF Note:** In BFF architecture, Better Auth runs on the NestJS backend. The Next.js app only needs the auth client and the catch-all API route handler (`app/api/auth/[...all]/route.ts`) for auth callbacks.

---

## When to Use

LOAD THIS SKILL when user is:
- Setting up authentication in a new project (email/password, OAuth, social login)
- Integrating Better Auth with Next.js (App Router, Server Components, middleware)
- Implementing session management (cookies, caching, revocation)
- Adding social login providers (Google, GitHub, Apple, etc.)
- Configuring role-based access control (RBAC) with admin or organization plugins
- Implementing two-factor authentication (TOTP, OTP, backup codes)
- Managing users administratively (ban, impersonate, role assignment)
- Setting up organization/team multi-tenancy with custom permissions
- Migrating from NextAuth/Auth.js to Better Auth
- Protecting routes via middleware, server components, or server actions
- Building an OAuth 2.1 authorization server or MCP auth provider
- Adding i18n / translated error messages
- Writing integration tests with Better Auth test utilities
- Deploying to Cloudflare Workers with D1 database
- Setting up Electron desktop authentication
- Configuring secret key rotation for zero-downtime secret changes
- Setting up seat-based billing with Stripe

---

## Critical Rules

**ALWAYS:**
1. Install `better-auth` in both server and client packages when they are separate
2. Set `BETTER_AUTH_SECRET` (min 32 chars, high entropy) and `BETTER_AUTH_URL` in environment variables
3. Use `toNextJsHandler` for Next.js App Router API route at `/api/auth/[...all]/route.ts`
4. Pass `await headers()` from `next/headers` when calling `auth.api.getSession()` in Server Components
5. Add `nextCookies()` plugin when calling auth functions from Server Actions that set cookies
6. Run `npx auth@latest migrate` or `npx auth@latest generate` after adding plugins
7. Use `createAuthClient` from `"better-auth/react"` for React/Next.js client
8. Validate sessions server-side in protected routes; middleware cookie checks are optimistic only
9. Use `authClient.useSession()` hook for reactive session state on the client
10. Keep access control definitions (`createAccessControl`) in a shared file imported by both server and client
11. Use typed `auth` export with `typeof auth` for client-side type inference with plugins
12. Use `npx auth init` (new CLI) for scaffolding new projects; replaces `npx @better-auth/cli`
13. Use versioned `secrets` array for secret key rotation instead of replacing `BETTER_AUTH_SECRET`
14. Use separate adapter packages (e.g. `@better-auth/drizzle-adapter`) with `better-auth/minimal` for smaller bundles

**NEVER:**
1. Call `authClient.signIn.*` or `authClient.signUp.*` from server-side code; use `auth.api.*` instead
2. Store secrets, client IDs, or client secrets in client-side code or commit them to version control
3. Rely solely on middleware cookie checks for security; always validate sessions in route handlers
4. Skip database migrations after adding or updating plugins
5. Use `@ts-ignore` to suppress Better Auth type errors; fix the types instead
6. Hardcode the `baseURL` in production; use `BETTER_AUTH_URL` or dynamic base URL with `allowedHosts`
7. Expose backup codes or TOTP secrets in logs or error messages
8. Trust `getSessionCookie()` in middleware as proof of authentication; it only checks cookie existence
9. Use test utilities plugin in production; it is for test environments only

---

## Core Patterns

### Server-Side Auth Setup

```typescript
// lib/auth.ts
import { betterAuth } from "better-auth";

export const auth = betterAuth({
  baseURL: process.env.BETTER_AUTH_URL,
  emailAndPassword: { enabled: true },
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
    expiresIn: 60 * 60 * 24 * 7,  // 7 days
    updateAge: 60 * 60 * 24,       // refresh after 1 day
  },
});
```

### Client-Side Auth Setup

```typescript
// lib/auth-client.ts
import { createAuthClient } from "better-auth/react";

export const authClient = createAuthClient({
  baseURL: process.env.NEXT_PUBLIC_BETTER_AUTH_URL,
});
```

### Next.js API Route Handler

```typescript
// app/api/auth/[...all]/route.ts
import { auth } from "@/lib/auth";
import { toNextJsHandler } from "better-auth/next-js";

export const { POST, GET } = toNextJsHandler(auth);
```

### Session in Server Components

```typescript
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

export default async function ProtectedPage() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });
  if (!session) {
    redirect("/sign-in");
  }
  return <h1>Welcome {session.user.name}</h1>;
}
```

### Session in Client Components

```typescript
"use client";
import { authClient } from "@/lib/auth-client";

export function UserProfile() {
  const { data: session, isPending } = authClient.useSession();

  if (isPending) return <div>Loading...</div>;
  if (!session) return <div>Not authenticated</div>;

  return <div>Hello {session.user.name}</div>;
}
```

### Next.js Middleware (Optimistic Cookie Check)

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

### Dynamic Base URL (Vercel / Multi-Domain)

```typescript
export const auth = betterAuth({
  baseURL: {
    allowedHosts: [
      "myapp.com",
      "www.myapp.com",
      "*.vercel.app",        // all Vercel preview deployments
      "preview-*.myapp.com", // custom preview pattern
    ],
  },
});
```

The client auto-detects `VERCEL_URL` and `NEXTAUTH_URL` when no explicit `baseURL` is set.

### Secret Key Rotation

```typescript
export const auth = betterAuth({
  secrets: [
    { version: 2, value: "new-secret-key-at-least-32-chars" }, // current (first = active)
    { version: 1, value: "old-secret-key-still-used-to-decrypt" }, // previous
  ],
});
// Or via env: BETTER_AUTH_SECRETS=2:new-secret-base64,1:old-secret-base64
```

No database migrations or downtime required. Legacy data encrypted before rotation remains decryptable.

---

## Anti-Patterns

| Anti-Pattern | Correct Approach |
|---|---|
| Calling `authClient.signIn.email()` in Server Component | Use `auth.api.signInEmail({ body: {...}, headers: await headers() })` |
| Trusting middleware cookie check as full auth | Validate with `auth.api.getSession()` in the route handler |
| Hardcoding `baseURL: "http://localhost:3000"` | Use `process.env.BETTER_AUTH_URL` or dynamic `allowedHosts` |
| Skipping `npx auth@latest migrate` after adding plugin | Always run migrations when adding plugins |
| Storing TOTP secret in client state | Keep secrets server-side; only expose `totpURI` for QR code |
| Using `any` for auth client type | Use `typeof auth` generic: `createAuthClient<typeof auth>()` |
| Not passing `headers` to `auth.api.getSession()` | Always pass `headers: await headers()` in Server Components |
| Using `npx @better-auth/cli` (old CLI) | Use `npx auth@latest` (new standalone CLI since v1.5) |
| Replacing `BETTER_AUTH_SECRET` directly | Use versioned `secrets` array for zero-downtime rotation |

---

## Quick Reference

| Task | Server API | Client API |
|---|---|---|
| Sign up (email) | `auth.api.signUpEmail({ body })` | `authClient.signUp.email({ ... })` |
| Sign in (email) | `auth.api.signInEmail({ body, headers })` | `authClient.signIn.email({ ... })` |
| Sign in (social) | `auth.api.signInSocial({ body })` | `authClient.signIn.social({ provider })` |
| Sign out | `auth.api.signOut({ headers })` | `authClient.signOut()` |
| Get session | `auth.api.getSession({ headers })` | `authClient.useSession()` / `authClient.getSession()` |
| List sessions | N/A | `authClient.listSessions()` |
| Revoke session | N/A | `authClient.revokeSession({ token })` |
| Password reset | `auth.api.requestPasswordReset({ body })` | `authClient.requestPasswordReset({ ... })` |
| Change password | `auth.api.changePassword({ body, headers })` | `authClient.changePassword({ ... })` |
| Check permission | `auth.api.hasPermission({ headers, body })` | `authClient.organization.hasPermission({ ... })` |
| Create org | `auth.api.createOrganization({ body, headers })` | `authClient.organization.create({ ... })` |
| Ban user | `auth.api.banUser({ body, headers })` | `authClient.admin.banUser({ ... })` |
| Enable 2FA | `auth.api.enableTwoFactor({ body, headers })` | `authClient.twoFactor.enable({ ... })` |
| Verify TOTP | `auth.api.verifyTOTP({ body })` | `authClient.twoFactor.verifyTotp({ ... })` |

---

## Plugin Architecture

Better Auth extends via plugins on both server and client. Always register matching pairs:

```typescript
// Server: import from "better-auth/plugins"
import { admin, organization, twoFactor } from "better-auth/plugins";

// Client: import from "better-auth/client/plugins"
import { adminClient, organizationClient, twoFactorClient } from "better-auth/client/plugins";
```

Key plugins:
- `admin` / `adminClient` -- User management, role assignment, ban/unban, impersonation
- `organization` / `organizationClient` -- Multi-tenant orgs, teams, invitations, custom RBAC
- `twoFactor` / `twoFactorClient` -- TOTP, OTP, backup codes
- `nextCookies` -- Required for Server Actions that set cookies
- `customSession` / `customSessionClient` -- Extend session response with custom fields

New in v1.5:
- `@better-auth/oauth-provider` -- OAuth 2.1 authorization server with OIDC compatibility
- `@better-auth/i18n` -- Type-safe error message translations with locale detection
- `@better-auth/sso` -- SSO with OIDC, OAuth2, and SAML 2.0 (now with Single Logout)
- `@better-auth/stripe` -- Stripe billing with seat-based pricing support
- MCP Auth -- MCP-ready authorization server for AI agents and tools
- Electron plugin -- Desktop OAuth flow via system browser + custom protocol
- Test Utils -- Factories, auth helpers, and OTP capture for testing

---

## CLI Commands (New in v1.5)

The new standalone CLI `npx auth` replaces `@better-auth/cli`:

| Command | Purpose |
|---|---|
| `npx auth init` | Scaffold complete auth setup (config, adapter, framework) |
| `npx auth@latest migrate` | Apply schema to database (Kysely adapter) |
| `npx auth@latest generate` | Generate schema for your ORM (Prisma, Drizzle, Kysely) |
| `npx auth@latest generate --adapter` | Generate schema tailored to specific adapter |
| `npx auth upgrade` | Upgrade Better Auth to latest version |
| `npx auth info` | Diagnostic information about your setup |

---

## Database Schema

Core tables (auto-created via `npx auth@latest migrate`):

| Table | Key Fields |
|---|---|
| `user` | `id`, `name`, `email`, `emailVerified`, `image`, `createdAt` |
| `session` | `id`, `userId`, `token`, `expiresAt`, `ipAddress`, `userAgent` |
| `account` | `id`, `userId`, `accountId`, `providerId`, `accessToken`, `password` |
| `verification` | `id`, `identifier`, `value`, `expiresAt` |

Plugins add their own tables/columns. Always run migrations after adding plugins.

### Adapter Packages (v1.5 -- Separate Installs)

For smaller bundles, install only the adapter you need:

| Adapter | Package | Import |
|---|---|---|
| Drizzle | `@better-auth/drizzle-adapter` | `import { drizzleAdapter } from "@better-auth/drizzle-adapter"` |
| Prisma | `@better-auth/prisma-adapter` | `import { prismaAdapter } from "@better-auth/prisma-adapter"` |
| MongoDB | `@better-auth/mongodb-adapter` | `import { mongodbAdapter } from "@better-auth/mongodb-adapter"` |
| Cloudflare D1 | Built-in | Pass `env.DB` directly -- auto-detected |

Use `better-auth/minimal` instead of `better-auth` with separate adapters:

```typescript
import { betterAuth } from "better-auth/minimal";
import { drizzleAdapter } from "@better-auth/drizzle-adapter";

export const auth = betterAuth({
  database: drizzleAdapter(db, { provider: "pg" }),
});
```

The main `better-auth` package re-exports all adapters, so existing imports continue to work.

---

## Deep Dive References

Load additional context when needed:

| When you need | Load |
|---------------|------|
| Installation, database, env vars, Next.js setup, CLI, adapters | [01-setup.md](01-setup.md) |
| Email/password, OAuth, sessions, password reset, 2FA, i18n | [02-authentication.md](02-authentication.md) |
| RBAC, admin plugin, organization plugin, permissions | [03-authorization.md](03-authorization.md) |

---

**Version:** 1.5.6 | **Source:** https://www.better-auth.com/docs
