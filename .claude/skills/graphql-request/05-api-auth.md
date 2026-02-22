# 05-api-auth.md
## Authentication Patterns & Header Management

**Source:** [github.com/jasonkuhrt/graphql-request](https://github.com/jasonkuhrt/graphql-request) /examples  
**Package:** graphql-request 7.4.0  
**Status:** Complete authentication guide

---

## Table of Contents

1. [Authentication Overview](#authentication-overview)
2. [Bearer Token Pattern](#bearer-token-pattern)
3. [Dynamic Headers](#dynamic-headers)
4. [Per-Request Headers](#per-request-headers)
5. [OAuth2 Pattern](#oauth2-pattern)
6. [API Key Authentication](#api-key-authentication)
7. [Custom Headers](#custom-headers)
8. [Security Best Practices](#security-best-practices)
9. [Real-World Examples](#real-world-examples)

---

## Authentication Overview

graphql-request provides flexible header management for authentication:

| Pattern | Complexity | Use Case |
|---------|-----------|----------|
| **Bearer Token** | Low | JWT, access tokens |
| **API Key** | Low | Simple key-based auth |
| **Dynamic Headers** | Medium | Token refresh, rotating credentials |
| **Custom Logic** | High | Complex auth flows |

---

## Bearer Token Pattern

Most common: send token in Authorization header:

### Static Token

```typescript
import { GraphQLClient, gql } from 'graphql-request'

const client = new GraphQLClient('https://api.example.com/graphql', {
  headers: {
    authorization: 'Bearer YOUR_ACCESS_TOKEN'
  }
})

const query = gql`{ me { name email } }`
const user = await client.request(query)
```

### Token from Environment Variable

```typescript
import { GraphQLClient, gql } from 'graphql-request'

const token = process.env.GRAPHQL_API_TOKEN

if (!token) {
  throw new Error('Missing GRAPHQL_API_TOKEN environment variable')
}

const client = new GraphQLClient('https://api.example.com/graphql', {
  headers: {
    authorization: `Bearer ${token}`
  }
})
```

### Token from Storage (Browser)

```typescript
import { GraphQLClient, gql } from 'graphql-request'

const getToken = () => {
  const token = localStorage.getItem('auth_token')
  if (!token) {
    throw new Error('No auth token found')
  }
  return token
}

const client = new GraphQLClient('https://api.example.com/graphql', {
  headers: {
    authorization: `Bearer ${getToken()}`
  }
})
```

---

## Dynamic Headers

Headers can be functions evaluated **per request**, allowing credentials to refresh:

### Token Refresh Pattern

```typescript
import { GraphQLClient, gql } from 'graphql-request'

let currentToken = 'initial_token'

const getLatestToken = () => {
  // Check if token needs refresh
  if (isTokenExpiring()) {
    currentToken = refreshToken()
  }
  return currentToken
}

const client = new GraphQLClient('https://api.example.com/graphql', {
  headers: {
    // This function is called for every request
    authorization: () => `Bearer ${getLatestToken()}`
  }
})

// Token is automatically refreshed if needed
const data = await client.request(query)
```

### Auth Context Pattern (React)

```typescript
// auth-context.ts
import { createContext, useContext } from 'react'

interface AuthContextType {
  token: string | null
  setToken: (token: string) => void
}

export const AuthContext = createContext<AuthContextType>(null!)

// App.tsx
import { GraphQLClient } from 'graphql-request'
import { AuthContext } from './auth-context'

export function App() {
  const [token, setToken] = useState<string | null>(null)

  const client = new GraphQLClient('https://api.example.com/graphql', {
    headers: {
      // Access current token from context
      authorization: () => token ? `Bearer ${token}` : ''
    }
  })

  return (
    <AuthContext.Provider value={{ token, setToken }}>
      {/* App components */}
    </AuthContext.Provider>
  )
}
```

### Multiple Dynamic Headers

```typescript
const client = new GraphQLClient(endpoint, {
  headers: {
    authorization: () => `Bearer ${getToken()}`,
    'x-timestamp': () => new Date().toISOString(),
    'x-request-id': () => generateUUID(),
    'x-user-id': () => getCurrentUserId()
  }
})
```

---

## Per-Request Headers

Override client headers for specific requests:

### Override Authorization

```typescript
import { GraphQLClient, gql } from 'graphql-request'

const client = new GraphQLClient('https://api.example.com/graphql', {
  headers: {
    authorization: 'Bearer default_token'
  }
})

// Use different token for this request
const data = await client.request(query, undefined, {
  authorization: 'Bearer special_token'
})

// This request used 'special_token'
```

### Add Per-Request Headers

```typescript
const client = new GraphQLClient('https://api.example.com/graphql', {
  headers: {
    authorization: 'Bearer token'
  }
})

const data = await client.request(query, undefined, {
  // Client headers + these headers
  'x-request-id': 'req-123',
  'x-timeout': '30000'
})
```

### Impersonation Pattern

```typescript
const client = new GraphQLClient(endpoint, {
  headers: {
    authorization: 'Bearer admin_token'
  }
})

// Admin request
const adminData = await client.request(adminQuery)

// Impersonate user for this request
const userData = await client.request(userQuery, undefined, {
  'x-impersonate-user': 'user-456'
})
```

---

## OAuth2 Pattern

### Authorization Code Flow

```typescript
import { GraphQLClient, gql } from 'graphql-request'

class OAuth2Client {
  private accessToken: string | null = null
  private refreshToken: string | null = null
  private client: GraphQLClient

  constructor(endpoint: string, clientId: string, clientSecret: string) {
    this.client = new GraphQLClient(endpoint, {
      headers: {
        authorization: () => this.getAuthHeader()
      }
    })
  }

  private getAuthHeader(): string {
    if (!this.accessToken) {
      throw new Error('Not authenticated')
    }
    return `Bearer ${this.accessToken}`
  }

  async login(code: string): Promise<void> {
    const response = await fetch('https://oauth.provider.com/token', {
      method: 'POST',
      body: JSON.stringify({
        code,
        grant_type: 'authorization_code'
      })
    })

    const data = await response.json()
    this.accessToken = data.access_token
    this.refreshToken = data.refresh_token
  }

  async refreshAccessToken(): Promise<void> {
    if (!this.refreshToken) {
      throw new Error('No refresh token available')
    }

    const response = await fetch('https://oauth.provider.com/token', {
      method: 'POST',
      body: JSON.stringify({
        grant_type: 'refresh_token',
        refresh_token: this.refreshToken
      })
    })

    const data = await response.json()
    this.accessToken = data.access_token
  }

  async request(query: string, variables?: Record<string, any>) {
    try {
      return await this.client.request(query, variables)
    } catch (error: any) {
      // If token expired, refresh and retry
      if (error.response?.status === 401) {
        await this.refreshAccessToken()
        return this.client.request(query, variables)
      }
      throw error
    }
  }
}

// Usage
const oauth = new OAuth2Client(
  'https://api.example.com/graphql',
  'client_id',
  'client_secret'
)

await oauth.login(authorizationCode)
const data = await oauth.request(query)
```

---

## API Key Authentication

### Static API Key

```typescript
import { GraphQLClient } from 'graphql-request'

const client = new GraphQLClient('https://api.example.com/graphql', {
  headers: {
    'x-api-key': process.env.API_KEY
  }
})

const data = await client.request(query)
```

### API Key Rotation

```typescript
const client = new GraphQLClient(endpoint, {
  headers: {
    'x-api-key': () => getActiveAPIKey()
  }
})

function getActiveAPIKey(): string {
  // Rotate between multiple keys
  const keys = ['key1', 'key2', 'key3']
  const index = Math.floor(Date.now() / 60000) % keys.length
  return keys[index]
}
```

---

## Custom Headers

### Signature Headers

Some APIs require signed requests:

```typescript
import { GraphQLClient } from 'graphql-request'
import crypto from 'crypto'

function signRequest(timestamp: string, secret: string): string {
  const signature = crypto
    .createHmac('sha256', secret)
    .update(timestamp)
    .digest('hex')
  return signature
}

const secret = process.env.API_SECRET

const client = new GraphQLClient(endpoint, {
  headers: {
    'x-timestamp': () => new Date().toISOString(),
    'x-signature': () => {
      const ts = new Date().toISOString()
      return signRequest(ts, secret)
    }
  }
})
```

### Correlation IDs

Track requests across services:

```typescript
import { GraphQLClient } from 'graphql-request'
import { v4 as uuidv4 } from 'uuid'

const client = new GraphQLClient(endpoint, {
  headers: {
    'x-correlation-id': () => {
      // Generate per request or reuse if in context
      return getContextCorrelationId() || uuidv4()
    }
  }
})
```

### Custom User Agent

```typescript
const client = new GraphQLClient(endpoint, {
  headers: {
    'user-agent': 'MyApp/1.0.0 (+http://myapp.com)'
  }
})
```

---

## Security Best Practices

### ✅ DO

```typescript
// ✅ Use environment variables for secrets
const token = process.env.API_TOKEN
const client = new GraphQLClient(endpoint, {
  headers: { authorization: `Bearer ${token}` }
})

// ✅ Use HTTPS only
const endpoint = 'https://api.example.com/graphql'

// ✅ Use dynamic headers for sensitive values
const client = new GraphQLClient(endpoint, {
  headers: {
    authorization: () => `Bearer ${getLatestToken()}`
  }
})

// ✅ Validate tokens before use
const getToken = () => {
  const token = localStorage.getItem('token')
  if (!token || isTokenExpired(token)) {
    redirectToLogin()
  }
  return token
}

// ✅ Clear credentials on logout
function logout() {
  localStorage.removeItem('token')
  client.setHeaders({})
}

// ✅ Use secure storage (httpOnly cookies)
// Browser: Set-Cookie: token=xyz; HttpOnly; Secure; SameSite=Strict
// Node: Store in secure variable, never log it
```

### ❌ DON'T

```typescript
// ❌ Don't hardcode tokens
const client = new GraphQLClient(endpoint, {
  headers: { authorization: 'Bearer sk_live_...' }  // BAD!
})

// ❌ Don't use HTTP
const endpoint = 'http://api.example.com/graphql'  // BAD!

// ❌ Don't log tokens
console.log('Token:', token)  // BAD!

// ❌ Don't store in localStorage (XSS vulnerable)
localStorage.setItem('token', sensitiveToken)  // BAD for sensitive data!

// ❌ Don't pass tokens in URL
const endpoint = 'https://api.example.com/graphql?token=xyz'  // BAD!

// ❌ Don't commit credentials to git
// Never commit .env files with real credentials
```

---

## Real-World Examples

### Example 1: Simple Bearer Token

```typescript
import { GraphQLClient, gql } from 'graphql-request'

const client = new GraphQLClient('https://api.github.com/graphql', {
  headers: {
    authorization: `Bearer ${process.env.GITHUB_TOKEN}`
  }
})

const query = gql`
  {
    viewer {
      login
      name
    }
  }
`

const data = await client.request(query)
console.log(`Hello ${data.viewer.name}!`)
```

### Example 2: Token with Expiration

```typescript
import { GraphQLClient, gql } from 'graphql-request'

interface TokenData {
  token: string
  expiresAt: number
}

let tokenData: TokenData | null = null

async function getValidToken(): Promise<string> {
  // Check if we have a valid cached token
  if (tokenData && tokenData.expiresAt > Date.now()) {
    return tokenData.token
  }

  // Fetch new token
  const response = await fetch('https://auth.example.com/token', {
    method: 'POST',
    body: JSON.stringify({
      clientId: process.env.CLIENT_ID,
      clientSecret: process.env.CLIENT_SECRET
    })
  })

  const data = await response.json()
  tokenData = {
    token: data.access_token,
    expiresAt: Date.now() + (data.expires_in * 1000)
  }

  return tokenData.token
}

const client = new GraphQLClient('https://api.example.com/graphql', {
  headers: {
    authorization: async () => `Bearer ${await getValidToken()}`
  }
})

const data = await client.request(query)
```

### Example 3: Multiple Authentication Schemes

```typescript
const client = new GraphQLClient(endpoint, {
  headers: {
    authorization: () => {
      // Try OAuth first
      if (hasOAuthToken()) {
        return `Bearer ${getOAuthToken()}`
      }

      // Fall back to API key
      if (hasAPIKey()) {
        return `ApiKey ${getAPIKey()}`
      }

      throw new Error('No authentication available')
    }
  }
})
```

### Example 4: Request-Specific Auth

```typescript
const client = new GraphQLClient(endpoint, {
  headers: {
    authorization: 'Bearer user_token'
  }
})

// User request
const userData = await client.request(userQuery)

// Admin request
const adminData = await client.request(adminQuery, undefined, {
  authorization: 'Bearer admin_token'
})
```

---

## Cross-References

- **Configuration:** [06-api-config.md](./06-api-config.md) - All header options
- **Methods:** [04-api-methods.md](./04-api-methods.md) - setHeader(), setHeaders()
- **Error Handling:** [08-guide-errors.md](./08-guide-errors.md) - Handle auth errors
- **Best Practices:** [09-best-practices.md](./09-best-practices.md) - Security patterns
- **Workflows:** [07-guide-workflows.md](./07-guide-workflows.md) - Auth examples

---

**Source:** [github.com/jasonkuhrt/graphql-request](https://github.com/jasonkuhrt/graphql-request)  
**Package:** graphql-request 7.4.0  
**Last Updated:** February 2026