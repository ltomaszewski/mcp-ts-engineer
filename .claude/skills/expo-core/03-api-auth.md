# 03 — API Reference: Authentication

**Module Summary**: Complete authentication module covering AuthSession for OAuth/OIDC flows, WebBrowser integration, secure token storage, and implementation patterns with typed parameters and code examples.

---

## Overview

Expo provides multiple authentication approaches:

1. **AuthSession** — OAuth 2.0 / OpenID Connect browser-based flows (recommended)
2. **WebBrowser** — Custom authentication implementations
3. **SecureStore** — Credential storage
4. **Crypto** — Token signing and verification

This module focuses on AuthSession, the recommended production approach.

**Source**: https://docs.expo.dev/versions/latest/sdk/auth-session/

---

## AuthSession Core API

### Installation

```bash
npx expo install expo-auth-session expo-web-browser expo-crypto expo-secure-store
```

### Core Imports

```typescript
import * as AuthSession from 'expo-auth-session';
import * as WebBrowser from 'expo-web-browser';
import * as SecureStore from 'expo-secure-store';
import * as Crypto from 'expo-crypto';
```

---

## AuthRequest Class

### Method: `constructor(config: AuthRequestConfig)`

**Description**: Initialize an authentication request with provider configuration.

**Parameters**:

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `clientId` | string | ✅ | OAuth app client ID |
| `clientSecret` | string | ❌ | OAuth app client secret (keep server-side) |
| `scopes` | string[] | ✅ | OAuth scopes to request (e.g., `['openid', 'email', 'profile']`) |
| `redirectUrl` | string | ✅ | Callback URL after auth (e.g., `https://auth.expo.io/@user/app-slug`) |
| `responseType` | 'code' \| 'token' | ❌ | Default: `'code'`. Use `'code'` for most providers |
| `usePKCE` | boolean | ❌ | Use PKCE (Proof Key for Code Exchange). Default: `true` (recommended for mobile) |
| `state` | string | ❌ | CSRF protection parameter |
| `extraParams` | object | ❌ | Additional OAuth parameters (e.g., `{ prompt: 'login' }`) |
| `codeChallengeMethod` | 'S256' \| 'plain' | ❌ | PKCE method. Default: `'S256'` |

**Return Type**: `AuthRequest` instance

**Code Example**:

```typescript
import * as AuthSession from 'expo-auth-session';

const request = new AuthSession.AuthRequest({
  clientId: 'YOUR_CLIENT_ID',
  scopes: ['openid', 'email', 'profile'],
  redirectUrl: AuthSession.makeRedirectUrl({
    path: 'auth-callback',
  }),
  usePKCE: true,
  responseType: 'code',
});
```

---

### Method: `getAuthRequestConfigAsync()`

**Description**: Load and validate auth request configuration based on discovery document.

**Return Type**: `Promise<AuthRequestConfig>`

**Code Example**:

```typescript
const request = new AuthSession.AuthRequest({
  clientId: 'YOUR_CLIENT_ID',
  scopes: ['openid', 'email'],
  redirectUrl: AuthSession.makeRedirectUrl(),
});

const config = await request.getAuthRequestConfigAsync();
// Returns validated, complete config
```

---

### Method: `makeAuthUrlAsync(discoveryDocument?: DiscoveryDocument)`

**Description**: Generate the authorization URL for the OAuth provider.

**Parameters**:

| Parameter | Type | Description |
|-----------|------|-------------|
| `discoveryDocument` | DiscoveryDocument | Provider's OpenID Connect discovery document (optional if already set) |

**Return Type**: `Promise<string>` — The authorization URL

**Code Example**:

```typescript
const discovery = await AuthSession.fetchDiscoveryAsync('https://accounts.google.com');
const authUrl = await request.makeAuthUrlAsync(discovery);
// authUrl: https://accounts.google.com/o/oauth2/v2/auth?client_id=...&redirect_uri=...
```

---

### Method: `getRedirectUrl(path?: string)`

**Description**: Get the redirect URL your provider should redirect back to.

**Parameters**:

| Parameter | Type | Description |
|-----------|------|-------------|
| `path` | string | Optional path to append (e.g., `'auth-callback'`) |

**Return Type**: `string`

**Code Example**:

```typescript
const redirectUrl = AuthSession.makeRedirectUrl({
  path: 'auth-callback',
});
// Returns: https://auth.expo.io/@username/my-app-slug/--/auth-callback
```

---

## Hook: `useAuthRequest()`

**Description**: React hook for simplified OAuth flow handling with automatic PKCE, state management, and result handling.

**Parameters**:

```typescript
useAuthRequest(
  config: AuthRequestConfig,
  discovery?: DiscoveryDocument
): [
  request: AuthRequest | null,
  result: AuthSessionResult | null,
  promptAsync: (options?: AuthRequestPromptOptions) => Promise<AuthSessionResult>
]
```

**Return Type**: Tuple of request, result, and handler

**Code Example**:

```typescript
import * as AuthSession from 'expo-auth-session';
import { Button, View, Text } from 'react-native';

export function LoginScreen() {
  const [request, result, promptAsync] = AuthSession.useAuthRequest({
    clientId: 'YOUR_CLIENT_ID',
    scopes: ['openid', 'email', 'profile'],
    redirectUrl: AuthSession.makeRedirectUrl(),
  });

  React.useEffect(() => {
    if (result?.type === 'success') {
      const { code } = result.params;
      // Exchange code for tokens on your server
      exchangeCodeForToken(code);
    }
  }, [result]);

  return (
    <View>
      <Button
        disabled={!request}
        title="Login with Google"
        onPress={() => promptAsync()}
      />
    </View>
  );
}
```

---

## Static Method: `fetchDiscoveryAsync(issuer: string)`

**Description**: Fetch OpenID Connect discovery document from provider.

**Parameters**:

| Parameter | Type | Description |
|-----------|------|-------------|
| `issuer` | string | Provider's issuer URL (e.g., `'https://accounts.google.com'`) |

**Return Type**: `Promise<DiscoveryDocument>`

**Code Example**:

```typescript
const discovery = await AuthSession.fetchDiscoveryAsync(
  'https://accounts.google.com'
);
// Returns:
// {
//   authorizationEndpoint: 'https://accounts.google.com/o/oauth2/v2/auth',
//   tokenEndpoint: 'https://oauth2.googleapis.com/token',
//   revocationEndpoint: 'https://oauth2.googleapis.com/revoke',
//   ...
// }
```

---

## Static Method: `makeRedirectUrl(options?: MakeRedirectUrlOptions)`

**Description**: Generate a redirect URI that your provider can redirect to after auth.

**Parameters**:

| Parameter | Type | Description |
|-----------|------|-------------|
| `path` | string | Optional path (default: empty) |
| `scheme` | string | Custom scheme (default: `'expo'` for Expo Go, or app.json scheme for prebuilt) |

**Return Type**: `string`

**Code Example**:

```typescript
// With Expo Go
const url1 = AuthSession.makeRedirectUrl();
// → https://auth.expo.io/@username/my-app

// With path
const url2 = AuthSession.makeRedirectUrl({ path: 'callback' });
// → https://auth.expo.io/@username/my-app/callback

// With custom scheme (prebuilt app)
const url3 = AuthSession.makeRedirectUrl({ scheme: 'myapp' });
// → myapp://
```

---

## Types & Interfaces

### `DiscoveryDocument`

```typescript
interface DiscoveryDocument {
  authorizationEndpoint: string;           // Authorization URL
  tokenEndpoint: string;                   // Token exchange endpoint
  revocationEndpoint?: string;             // Token revocation endpoint
  endSessionEndpoint?: string;             // Logout endpoint
  registrationEndpoint?: string;           // Dynamic client registration
  introspectionEndpoint?: string;          // Token introspection
  discoveryDocument?: ProviderMetadata;    // Complete provider metadata
}
```

### `AuthSessionResult`

```typescript
type AuthSessionResult = 
  | { type: 'success'; params: AuthSessionRedirectUriParameters }
  | { type: 'error'; params: { error: string; error_description?: string } }
  | { type: 'cancel' };

interface AuthSessionRedirectUriParameters {
  code?: string;           // Authorization code
  state?: string;          // CSRF token echo
  access_token?: string;   // For implicit/token grant
  token_type?: string;     // 'Bearer'
  expires_in?: number;     // Token lifetime in seconds
}
```

### `AuthRequestConfig`

```typescript
interface AuthRequestConfig {
  clientId: string;
  clientSecret?: string;
  scopes: string[];
  redirectUrl: string;
  responseType?: 'code' | 'token';
  state?: string;
  usePKCE?: boolean;
  codeChallengeMethod?: 'S256' | 'plain';
  extraParams?: Record<string, string>;
}
```

---

## Complete Authentication Flow Example

### Step 1: Request Authorization

```typescript
// screens/LoginScreen.tsx
import * as AuthSession from 'expo-auth-session';
import { Button, View, ActivityIndicator } from 'react-native';

export function LoginScreen() {
  const [loading, setLoading] = React.useState(false);

  // 1. Configure request
  const [request, result, promptAsync] = AuthSession.useAuthRequest({
    clientId: process.env.EXPO_PUBLIC_GOOGLE_CLIENT_ID,
    scopes: ['openid', 'email', 'profile'],
    redirectUrl: AuthSession.makeRedirectUrl(),
  });

  // 2. Handle result
  React.useEffect(() => {
    if (result?.type === 'success') {
      handleAuthSuccess(result.params.code);
    } else if (result?.type === 'error') {
      console.error('Auth error:', result.params.error);
    }
  }, [result]);

  if (loading) return <ActivityIndicator />;

  return (
    <Button
      disabled={!request}
      title="Sign in with Google"
      onPress={() => {
        setLoading(true);
        promptAsync();
      }}
    />
  );
}

async function handleAuthSuccess(code: string) {
  // 3. Exchange code for tokens on your backend
  const response = await fetch('https://yourapi.com/auth/exchange', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ code }),
  });

  const { accessToken, refreshToken } = await response.json();

  // 4. Store securely and use
  await SecureStore.setItemAsync('accessToken', accessToken);
  await SecureStore.setItemAsync('refreshToken', refreshToken);

  // Navigate to home
}
```

### Step 2: Secure Token Storage

```typescript
// services/auth.ts
import * as SecureStore from 'expo-secure-store';

export async function storeTokens(
  accessToken: string,
  refreshToken: string
) {
  try {
    await SecureStore.setItemAsync('accessToken', accessToken);
    await SecureStore.setItemAsync('refreshToken', refreshToken);
  } catch (error) {
    console.error('Failed to store tokens:', error);
  }
}

export async function getAccessToken(): Promise<string | null> {
  try {
    return await SecureStore.getItemAsync('accessToken');
  } catch {
    return null;
  }
}

export async function getRefreshToken(): Promise<string | null> {
  try {
    return await SecureStore.getItemAsync('refreshToken');
  } catch {
    return null;
  }
}

export async function clearTokens() {
  try {
    await SecureStore.deleteItemAsync('accessToken');
    await SecureStore.deleteItemAsync('refreshToken');
  } catch {
    // Already deleted
  }
}
```

### Step 3: Refresh Token Implementation

```typescript
// services/api.ts
import * as SecureStore from 'expo-secure-store';

const API_URL = 'https://yourapi.com';

async function refreshAccessToken(): Promise<string> {
  const refreshToken = await SecureStore.getItemAsync('refreshToken');

  const response = await fetch(`${API_URL}/auth/refresh`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ refreshToken }),
  });

  if (!response.ok) {
    throw new Error('Failed to refresh token');
  }

  const { accessToken } = await response.json();
  await SecureStore.setItemAsync('accessToken', accessToken);
  return accessToken;
}

export async function apiCall(
  endpoint: string,
  options: RequestInit = {}
): Promise<Response> {
  let token = await SecureStore.getItemAsync('accessToken');

  let response = await fetch(`${API_URL}${endpoint}`, {
    ...options,
    headers: {
      ...options.headers,
      Authorization: `Bearer ${token}`,
    },
  });

  // If 401, refresh and retry
  if (response.status === 401) {
    try {
      token = await refreshAccessToken();
      response = await fetch(`${API_URL}${endpoint}`, {
        ...options,
        headers: {
          ...options.headers,
          Authorization: `Bearer ${token}`,
        },
      });
    } catch {
      // Refresh failed, require re-login
      await clearTokens();
      // Navigate to login
    }
  }

  return response;
}
```

---

## Best Practices & Security

### ✅ Do's

- **Use PKCE** — Automatically enabled (`usePKCE: true`)
- **Store tokens securely** — Use `expo-secure-store`, never AsyncStorage
- **Validate state** — Automatically handled by `useAuthRequest`
- **Use HTTPS** — All redirects must be HTTPS in production
- **Refresh tokens server-side** — Never expose refresh tokens in client
- **Implement token expiration** — Check `expires_in` and refresh proactively

### ❌ Don'ts

- **Don't expose client secrets** — Keep in backend, not app.json or code
- **Don't store tokens in AsyncStorage** — Use SecureStore for sensitive data
- **Don't hardcode OAuth credentials** — Use environment variables
- **Don't skip SSL verification** — Never in production
- **Don't log sensitive tokens** — Omit from logs

### Platform-Specific Redirect Schemes

**iOS**: Uses universal links automatically
```json
{
  "ios": {
    "bundleIdentifier": "com.company.myapp"
  }
}
```

**Android**: Configure scheme in app.json
```json
{
  "scheme": "myapp"
}
```

Then use: `myapp://` as redirect URL

---

## Testing Authentication Locally

### Mock OAuth Flow for Testing

```typescript
// __tests__/auth.test.ts
import * as AuthSession from 'expo-auth-session';

describe('Authentication', () => {
  it('should exchange code for token', async () => {
    const mockCode = 'mock-auth-code-123';
    
    // In tests, mock the API response
    global.fetch = jest.fn(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve({
          accessToken: 'mock-token',
          refreshToken: 'mock-refresh',
        }),
      })
    );

    const tokens = await exchangeCodeForToken(mockCode);
    expect(tokens.accessToken).toBe('mock-token');
  });
});
```

---

## Common Providers Setup

### Google OAuth

```typescript
const [request, result, promptAsync] = AuthSession.useAuthRequest({
  clientId: process.env.EXPO_PUBLIC_GOOGLE_CLIENT_ID,
  scopes: ['openid', 'email', 'profile'],
  redirectUrl: AuthSession.makeRedirectUrl(),
});

const discovery = await AuthSession.fetchDiscoveryAsync(
  'https://accounts.google.com'
);
```

### GitHub OAuth

```typescript
const [request, result, promptAsync] = AuthSession.useAuthRequest({
  clientId: process.env.EXPO_PUBLIC_GITHUB_CLIENT_ID,
  scopes: ['user:email'],
  redirectUrl: AuthSession.makeRedirectUrl(),
});

const discovery = await AuthSession.fetchDiscoveryAsync(
  'https://github.com'
);
```

---

## Troubleshooting

| Issue | Solution |
|-------|----------|
| "Invalid redirect_uri" | Ensure URL matches provider exactly. Use `AuthSession.makeRedirectUrl()` |
| "PKCE failed" | Ensure provider supports PKCE. Try `usePKCE: false` only for testing |
| "WebBrowser not available" | Ensure EAS build or dev build (not Expo Go for some providers) |
| "Token not stored" | Use `SecureStore`, not AsyncStorage; check permissions |
| "Refresh token invalid" | Implement rotation; old tokens may expire |

---

## Cross-References

- **Storage**: [04-api-data-storage.md](04-api-data-storage.md) — SecureStore details
- **Permissions**: [05-api-device-access.md](05-api-device-access.md) — Permission handling
- **Security**: [13-best-practices-security.md](13-best-practices-security.md) — Complete security guide
- **Firebase Auth**: [09-guide-firebase-integration.md](09-guide-firebase-integration.md) — Alternative approach

---

**Source Attribution**: https://docs.expo.dev/versions/latest/sdk/auth-session/  
**Last Updated**: December 2024
