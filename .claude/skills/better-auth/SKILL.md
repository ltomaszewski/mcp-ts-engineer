---
name: better-auth
description: Better Auth v1.4 authentication - email/password, OAuth, sessions, RBAC, MFA, Next.js integration. Use when implementing auth, managing sessions, adding social login, or role-based access.
---

# Better Auth Skill

## When to Use

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

## Critical Rules

### ALWAYS

- Install `better-auth` in both server and client packages when they are separate
- Set `BETTER_AUTH_SECRET` (min 32 chars, high entropy) and `BETTER_AUTH_URL` in environment variables
- Use `toNextJsHandler` for Next.js App Router API route at `/api/auth/[...all]/route.ts`
- Pass `await headers()` from `next/headers` when calling `auth.api.getSession()` in Server Components
- Add `nextCookies()` plugin when calling auth functions from Server Actions that set cookies
- Run `npx @better-auth/cli migrate` or `npx @better-auth/cli generate` after adding plugins
- Use `createAuthClient` from `"better-auth/react"` for React/Next.js client
- Validate sessions server-side in protected routes; middleware cookie checks are optimistic only
- Use `authClient.useSession()` hook for reactive session state on the client
- Keep access control definitions (`createAccessControl`) in a shared file imported by both server and client
- Use typed `auth` export with `typeof auth` for client-side type inference with plugins

### NEVER

- Call `authClient.signIn.*` or `authClient.signUp.*` from server-side code; use `auth.api.*` instead
- Store secrets, client IDs, or client secrets in client-side code or commit them to version control
- Rely solely on middleware cookie checks for security; always validate sessions in route handlers
- Skip database migrations after adding or updating plugins
- Use `@ts-ignore` to suppress Better Auth type errors; fix the types instead
- Hardcode the `baseURL` in production; use `BETTER_AUTH_URL` environment variable
- Expose backup codes or TOTP secrets in logs or error messages
- Trust `getSessionCookie()` in middleware as proof of authentication; it only checks cookie existence

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

## Anti-Patterns

| Anti-Pattern | Correct Approach |
|---|---|
| Calling `authClient.signIn.email()` in Server Component | Use `auth.api.signInEmail({ body: {...}, headers: await headers() })` |
| Trusting middleware cookie check as full auth | Validate with `auth.api.getSession()` in the route handler |
| Hardcoding `baseURL: "http://localhost:3000"` | Use `process.env.BETTER_AUTH_URL` |
| Skipping `npx @better-auth/cli migrate` after adding plugin | Always run migrations when adding plugins |
| Storing TOTP secret in client state | Keep secrets server-side; only expose `totpURI` for QR code |
| Using `any` for auth client type | Use `typeof auth` generic: `createAuthClient<typeof auth>()` |
| Not passing `headers` to `auth.api.getSession()` | Always pass `headers: await headers()` in Server Components |

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

## Database Schema

Core tables (auto-created via `npx @better-auth/cli migrate`):

| Table | Key Fields |
|---|---|
| `user` | `id`, `name`, `email`, `emailVerified`, `image`, `createdAt` |
| `session` | `id`, `userId`, `token`, `expiresAt`, `ipAddress`, `userAgent` |
| `account` | `id`, `userId`, `accountId`, `providerId`, `accessToken`, `password` |
| `verification` | `id`, `identifier`, `value`, `expiresAt` |

Plugins add their own tables/columns. Always run migrations after adding plugins.

## Deep Dive References

| Topic | File |
|---|---|
| Installation, database, env vars, Next.js setup | `01-setup.md` |
| Email/password, OAuth, sessions, password reset | `02-authentication.md` |
| RBAC, admin plugin, organization plugin, permissions | `03-authorization.md` |

**Version:** 1.4.x | **Source:** https://www.better-auth.com/docs
