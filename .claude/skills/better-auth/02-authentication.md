# Better Auth Authentication

## Email/Password Authentication

### Server Configuration

```typescript
// lib/auth.ts
import { betterAuth } from "better-auth";

export const auth = betterAuth({
  emailAndPassword: {
    enabled: true,
    autoSignIn: true, // auto sign-in after signup (default: true)
  },
});
```

### Sign Up

**Client-side:**

```typescript
import { authClient } from "@/lib/auth-client";

const { data, error } = await authClient.signUp.email({
  email: "user@example.com",
  password: "securepassword123",  // min 8 chars by default
  name: "John Doe",
  image: "https://example.com/avatar.png", // optional
  callbackURL: "/dashboard",               // optional redirect
}, {
  onRequest: (ctx) => {
    // show loading spinner
  },
  onSuccess: (ctx) => {
    // redirect or update UI
  },
  onError: (ctx) => {
    alert(ctx.error.message);
  },
});
```

**Server-side:**

```typescript
import { auth } from "@/lib/auth";

const data = await auth.api.signUpEmail({
  body: {
    name: "John Doe",
    email: "user@example.com",
    password: "securepassword123",
    image: "https://example.com/avatar.png",
    callbackURL: "/dashboard",
  },
});
```

By default, users are automatically signed in after signup (controlled by `autoSignIn`).

### Sign In

**Client-side:**

```typescript
import { authClient } from "@/lib/auth-client";

const { data, error } = await authClient.signIn.email({
  email: "user@example.com",
  password: "securepassword123",
  callbackURL: "/dashboard",   // optional
  rememberMe: true,            // default: true
}, {
  onSuccess: (ctx) => {
    if (ctx.data.twoFactorRedirect) {
      // user has 2FA enabled, redirect to verification
      window.location.href = "/2fa";
    }
  },
  onError: (ctx) => {
    if (ctx.error.status === 403) {
      alert("Please verify your email address");
    }
  },
});
```

**Server-side:**

```typescript
import { auth } from "@/lib/auth";
import { headers } from "next/headers";

const data = await auth.api.signInEmail({
  body: {
    email: "user@example.com",
    password: "securepassword123",
    rememberMe: true,
    callbackURL: "/dashboard",
  },
  headers: await headers(),
});
```

### Sign Out

**Client-side:**

```typescript
import { authClient } from "@/lib/auth-client";

await authClient.signOut();

// With redirect callback
await authClient.signOut({
  fetchOptions: {
    onSuccess: () => {
      router.push("/sign-in");
    },
  },
});
```

**Server-side:**

```typescript
import { auth } from "@/lib/auth";
import { headers } from "next/headers";

await auth.api.signOut({
  headers: await headers(),
});
```

---

## OAuth / Social Authentication

### Supported Providers

Better Auth has built-in support for major OAuth 2.0 and OpenID Connect providers:

| Provider | Config Key | Notes |
|---|---|---|
| Google | `google` | Set `baseURL` to avoid `redirect_uri_mismatch` |
| GitHub | `github` | Must include `user:email` scope |
| Apple | `apple` | Requires Apple Developer account |
| Facebook | `facebook` | Standard OAuth 2.0 |
| Microsoft | `microsoft` | Azure AD / Entra ID |
| Twitter/X | `twitter` | OAuth 2.0 |
| Discord | `discord` | Standard OAuth 2.0 |
| LinkedIn | `linkedin` | Standard OAuth 2.0 |
| Spotify | `spotify` | Standard OAuth 2.0 |
| Twitch | `twitch` | Standard OAuth 2.0 |
| Dropbox | `dropbox` | Standard OAuth 2.0 |
| GitLab | `gitlab` | Standard OAuth 2.0 |

For unlisted providers, use the Generic OAuth Plugin for any OAuth 2.0 / OIDC provider.

### Server Configuration

```typescript
import { betterAuth } from "better-auth";

export const auth = betterAuth({
  baseURL: process.env.BETTER_AUTH_URL, // required for OAuth callbacks
  socialProviders: {
    google: {
      clientId: process.env.GOOGLE_CLIENT_ID as string,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET as string,
      prompt: "select_account", // optional: force account selection
    },
    github: {
      clientId: process.env.GITHUB_CLIENT_ID as string,
      clientSecret: process.env.GITHUB_CLIENT_SECRET as string,
    },
  },
});
```

### Google Provider Setup

1. Go to Google Cloud Console > APIs & Services > Credentials
2. Create OAuth client ID (Web application)
3. Add redirect URIs:
   - Dev: `http://localhost:3000/api/auth/callback/google`
   - Prod: `https://your-domain.com/api/auth/callback/google`

```typescript
socialProviders: {
  google: {
    clientId: process.env.GOOGLE_CLIENT_ID as string,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET as string,
    accessType: "offline",           // enable refresh tokens
    prompt: "select_account consent", // force account + consent
  },
},
```

### GitHub Provider Setup

1. Go to GitHub Developer Settings > OAuth Apps (or GitHub Apps)
2. Set callback URL: `http://localhost:3000/api/auth/callback/github`
3. For GitHub Apps: enable Permissions > Account Permissions > Email Addresses > Read-Only

```typescript
socialProviders: {
  github: {
    clientId: process.env.GITHUB_CLIENT_ID as string,
    clientSecret: process.env.GITHUB_CLIENT_SECRET as string,
  },
},
```

GitHub does not issue refresh tokens. Access tokens remain valid indefinitely unless revoked.

### Social Sign In (Client)

```typescript
import { authClient } from "@/lib/auth-client";

// Basic social sign-in
await authClient.signIn.social({
  provider: "google",
  callbackURL: "/dashboard",        // redirect after auth
  errorCallbackURL: "/error",       // redirect on error
  newUserCallbackURL: "/welcome",   // redirect for new users
});

// With additional data
await authClient.signIn.social({
  provider: "github",
  additionalData: {
    referralCode: "ABC123",
    source: "landing-page",
  },
});
```

### Social Sign In (Server)

```typescript
import { auth } from "@/lib/auth";

await auth.api.signInSocial({
  body: { provider: "google" },
});
```

### Link Additional Social Account

```typescript
// Client - link Google to existing account
await authClient.linkSocial({
  provider: "google",
  scopes: ["https://www.googleapis.com/auth/drive.file"], // optional extra scopes
});

// Server
await auth.api.linkSocialAccount({
  body: { provider: "google" },
  headers: await headers(),
});
```

### Get OAuth Access Token

```typescript
// Client
const { accessToken } = await authClient.getAccessToken({
  providerId: "google",
});

// Server
const { accessToken } = await auth.api.getAccessToken({
  body: { providerId: "google" },
  headers: await headers(),
});
```

### Provider Options Reference

| Option | Type | Description |
|---|---|---|
| `clientId` | `string` | OAuth client ID (required) |
| `clientSecret` | `string` | OAuth client secret (required) |
| `scope` | `string[]` | Additional OAuth scopes |
| `redirectURI` | `string` | Custom callback URL |
| `prompt` | `string` | `"select_account"`, `"consent"`, `"login"`, `"none"` |
| `accessType` | `string` | `"offline"` for refresh tokens (Google) |
| `disableSignUp` | `boolean` | Block new user creation via this provider |
| `overrideUserInfoOnSignIn` | `boolean` | Update user data on each sign-in |
| `mapProfileToUser` | `function` | Transform provider profile to user fields |

### Profile Mapping

```typescript
socialProviders: {
  google: {
    clientId: process.env.GOOGLE_CLIENT_ID as string,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET as string,
    mapProfileToUser: (profile) => ({
      firstName: profile.given_name,
      lastName: profile.family_name,
    }),
  },
},
```

---

## Session Management

### Client-Side: useSession Hook (Reactive)

```typescript
"use client";
import { authClient } from "@/lib/auth-client";

export function UserProfile() {
  const {
    data: session,    // session object or null
    isPending,        // loading state
    error,            // error object or null
    refetch,          // manual refetch function
  } = authClient.useSession();

  if (isPending) return <div>Loading...</div>;
  if (!session) return <div>Not signed in</div>;

  return (
    <div>
      <p>{session.user.name}</p>
      <p>{session.user.email}</p>
      <img src={session.user.image} alt="avatar" />
    </div>
  );
}
```

### Client-Side: getSession (One-Time Fetch)

```typescript
import { authClient } from "@/lib/auth-client";

const { data: session, error } = await authClient.getSession();
```

### Server-Side: getSession

```typescript
import { auth } from "@/lib/auth";
import { headers } from "next/headers";

// In Server Components, Server Actions, Route Handlers
const session = await auth.api.getSession({
  headers: await headers(),
});

// session.user - user object
// session.session - session metadata (id, token, expiresAt, etc.)
```

### Session Configuration

```typescript
export const auth = betterAuth({
  session: {
    expiresIn: 60 * 60 * 24 * 7,      // 7 days (seconds)
    updateAge: 60 * 60 * 24,           // refresh after 1 day
    freshAge: 60 * 5,                  // "fresh" for 5 minutes (default: 1 day)
    disableSessionRefresh: false,      // disable auto-refresh (default: false)
    cookieCache: {
      enabled: true,
      maxAge: 5 * 60,                  // cache for 5 minutes
      strategy: "compact",            // "compact" | "jwt" | "jwe"
    },
  },
});
```

### List All User Sessions

```typescript
// Client
const sessions = await authClient.listSessions();
```

### Revoke Sessions

```typescript
// Revoke specific session
await authClient.revokeSession({ token: "session-token" });

// Revoke all except current
await authClient.revokeOtherSessions();

// Revoke all sessions
await authClient.revokeSessions();
```

### Custom Session Data

Extend session response with the `customSession` plugin:

```typescript
// Server
import { customSession } from "better-auth/plugins";

export const auth = betterAuth({
  plugins: [
    customSession(async ({ user, session }) => {
      const roles = await findUserRoles(session.session.userId);
      return {
        roles,
        user: { ...user, displayName: user.name.toUpperCase() },
        session,
      };
    }),
  ],
});
```

```typescript
// Client - add type inference
import { customSessionClient } from "better-auth/client/plugins";
import type { auth } from "@/lib/auth";

export const authClient = createAuthClient({
  plugins: [customSessionClient<typeof auth>()],
});

// Now session.roles and session.user.displayName are typed
const { data } = authClient.useSession();
```

---

## Email Verification

### Server Configuration

```typescript
import { betterAuth } from "better-auth";

export const auth = betterAuth({
  emailAndPassword: {
    enabled: true,
    requireEmailVerification: true, // block sign-in until verified
  },
  emailVerification: {
    sendVerificationEmail: async ({ user, url, token }, request) => {
      await sendEmail({
        to: user.email,
        subject: "Verify your email address",
        text: `Click to verify: ${url}`,
      });
    },
  },
});
```

### Manually Send Verification Email

```typescript
await authClient.sendVerificationEmail({
  email: "user@example.com",
  callbackURL: "/",
});
```

### Handle Unverified Sign-In

```typescript
await authClient.signIn.email(
  { email: "user@example.com", password: "password" },
  {
    onError: (ctx) => {
      if (ctx.error.status === 403) {
        alert("Please verify your email address first");
      }
    },
  }
);
```

---

## Password Reset Flow

### Server Configuration

```typescript
import { betterAuth } from "better-auth";

export const auth = betterAuth({
  emailAndPassword: {
    enabled: true,
    sendResetPassword: async ({ user, url, token }, request) => {
      await sendEmail({
        to: user.email,
        subject: "Reset your password",
        text: `Click to reset: ${url}`,
      });
    },
    onPasswordReset: async ({ user }, request) => {
      // Optional: log or notify after reset
    },
  },
});
```

### Step 1: Request Reset

```typescript
// Client
const { data, error } = await authClient.requestPasswordReset({
  email: "user@example.com",
  redirectTo: "/reset-password", // page with reset form
});

// Server
const data = await auth.api.requestPasswordReset({
  body: {
    email: "user@example.com",
    redirectTo: "/reset-password",
  },
});
```

### Step 2: Reset Password (After User Clicks Email Link)

```typescript
// Client - token comes from the URL query parameter
const { data, error } = await authClient.resetPassword({
  newPassword: "newSecurePassword123",
  token: token, // from URL: /reset-password?token=xxx
});
```

### Change Password (Authenticated Users)

```typescript
// Client
const { data, error } = await authClient.changePassword({
  currentPassword: "oldPassword123",
  newPassword: "newPassword456",
  revokeOtherSessions: true, // optional: sign out other devices
});

// Server
const data = await auth.api.changePassword({
  body: {
    currentPassword: "oldPassword123",
    newPassword: "newPassword456",
    revokeOtherSessions: true,
  },
  headers: await headers(),
});
```

---

## Two-Factor Authentication (2FA)

### Server Setup

```typescript
import { betterAuth } from "better-auth";
import { twoFactor } from "better-auth/plugins";

export const auth = betterAuth({
  appName: "My App",
  plugins: [
    twoFactor({
      issuer: "my-app",                    // shown in authenticator apps
      skipVerificationOnEnable: false,      // require TOTP verify on enable
      otpOptions: {
        async sendOTP({ user, otp }, ctx) {
          await sendEmail({
            to: user.email,
            subject: "Your verification code",
            text: `Your code: ${otp}`,
          });
        },
        period: 3,           // OTP valid for 3 minutes
      },
      totpOptions: {
        digits: 6,           // 6-digit codes
        period: 30,          // 30-second rotation
      },
      backupCodeOptions: {
        amount: 10,          // 10 backup codes
        length: 10,          // 10 chars each
      },
    }),
  ],
});
```

### Client Setup

```typescript
import { createAuthClient } from "better-auth/react";
import { twoFactorClient } from "better-auth/client/plugins";

export const authClient = createAuthClient({
  plugins: [
    twoFactorClient({
      onTwoFactorRedirect() {
        window.location.href = "/2fa";
      },
    }),
  ],
});
```

### Enable 2FA

```typescript
const { data, error } = await authClient.twoFactor.enable({
  password: "currentPassword",
});
// data.totpURI - use for QR code generation
// data.backupCodes - display to user once
```

### Verify TOTP During Sign-In

```typescript
const { data, error } = await authClient.twoFactor.verifyTotp({
  code: "123456",
  trustDevice: true, // remember device for 30 days
});
```

### Send and Verify OTP

```typescript
// Send OTP via email/SMS
await authClient.twoFactor.sendOtp();

// Verify OTP
const { data, error } = await authClient.twoFactor.verifyOtp({
  code: "123456",
  trustDevice: true,
});
```

### Use Backup Code

```typescript
const { data, error } = await authClient.twoFactor.verifyBackupCode({
  code: "backup-code-here",
});
```

### Disable 2FA

```typescript
await authClient.twoFactor.disable({
  password: "currentPassword",
});
```

---

## Custom Password Hashing

Replace the default `scrypt` hasher with Argon2:

```typescript
import { hash, verify, type Options } from "@node-rs/argon2";
import { betterAuth } from "better-auth";

const argonOpts: Options = {
  memoryCost: 65536,
  timeCost: 3,
  parallelism: 4,
  outputLen: 32,
  algorithm: 2,
};

export const auth = betterAuth({
  emailAndPassword: {
    enabled: true,
    password: {
      hash: async (password: string) => hash(password, argonOpts),
      verify: async (data: { password: string; hash: string }) =>
        verify(data.hash, data.password, argonOpts),
    },
  },
});
```

**Version:** 1.4.x | **Source:** https://www.better-auth.com/docs
