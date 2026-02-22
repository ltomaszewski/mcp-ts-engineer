# 06-api-config.md
## Configuration Reference

**Source:** [github.com/jasonkuhrt/graphql-request](https://github.com/jasonkuhrt/graphql-request) source code  
**Package:** graphql-request 7.4.0  
**Status:** Complete configuration guide

---

## Table of Contents

1. [Configuration Overview](#configuration-overview)
2. [Headers Configuration](#headers-configuration)
3. [Error Policy](#error-policy)
4. [Fetch Options](#fetch-options)
5. [HTTP Method](#http-method)
6. [excludeOperationName](#excludeoperationname)
7. [Complete Configuration Example](#complete-configuration-example)
8. [Configuration Patterns](#configuration-patterns)

---

## Configuration Overview

The GraphQLClient accepts a configuration object as the second parameter:

```typescript
const client = new GraphQLClient(endpoint, {
  headers?: HeadersConfig
  errorPolicy?: 'none' | 'ignore' | 'all'
  method?: 'POST' | 'GET'
  fetch?: RequestInit
  excludeOperationName?: boolean
})
```

### All Configuration Options

| Option | Type | Default | Purpose |
|--------|------|---------|---------|
| `headers` | `HeadersConfig` | `{}` | HTTP headers to send with requests |
| `errorPolicy` | `'none' \| 'ignore' \| 'all'` | `'none'` | How to handle GraphQL errors |
| `method` | `'POST' \| 'GET'` | `'POST'` | HTTP method to use |
| `fetch` | `RequestInit` | `{}` | Fetch API options |
| `excludeOperationName` | `boolean` | `false` | Skip operation name extraction |

---

## Headers Configuration

### Static Headers

```typescript
const client = new GraphQLClient(endpoint, {
  headers: {
    authorization: 'Bearer YOUR_TOKEN',
    'x-custom-header': 'value',
    'content-type': 'application/json'
  }
})

// Applied to all requests
const data = await client.request(query)
```

### Dynamic Headers (Functions)

Headers can be functions evaluated per request:

```typescript
const getToken = () => {
  // Get token from storage, auth service, etc
  return localStorage.getItem('auth_token')
}

const client = new GraphQLClient(endpoint, {
  headers: {
    authorization: () => `Bearer ${getToken()}`,
    'x-timestamp': () => new Date().toISOString(),
    'x-request-id': () => generateUUID()
  }
})

// Each request evaluates the functions with latest values
const data1 = await client.request(query)
const data2 = await client.request(query)  // May have different timestamp
```

### Mixed Static and Dynamic

```typescript
const client = new GraphQLClient(endpoint, {
  headers: {
    // Static
    'x-api-version': '2.0',

    // Dynamic
    authorization: () => `Bearer ${getLatestToken()}`,
    'x-request-id': () => generateId()
  }
})
```

### Headers Type

```typescript
type HeadersConfig = Record<string, string | (() => string)>

// Examples
const staticHeader: string = 'value'
const dynamicHeader: () => string = () => getToken()
```

### Per-Request Header Override

Headers passed to `request()` override client headers:

```typescript
const client = new GraphQLClient(endpoint, {
  headers: {
    authorization: 'Bearer default_token'
  }
})

// Override for this request
const data = await client.request(query, undefined, {
  authorization: 'Bearer special_token'
})
```

### Update Headers After Creation

```typescript
const client = new GraphQLClient(endpoint)

// Set single header
client.setHeader('authorization', 'Bearer token')

// Or set multiple
client.setHeaders({
  authorization: 'Bearer token',
  'x-custom': 'value'
})

// Subsequent requests use new headers
const data = await client.request(query)
```

---

## Error Policy

Controls how GraphQL errors are handled. GraphQL endpoints return HTTP 200 even when there are GraphQL errors.

### errorPolicy: 'none' (Default)

Throw an error if GraphQL returns any errors:

```typescript
const client = new GraphQLClient(endpoint, {
  errorPolicy: 'none'  // Default
})

try {
  const data = await client.request(query)
  console.log(data)
} catch (error) {
  console.error('GraphQL Error:', error.response.errors)
}
```

**Use when:**
- ✅ Errors are exceptional and should stop execution
- ✅ You want strict error handling
- ✅ Most queries in your app

### errorPolicy: 'ignore'

Ignore GraphQL errors and return data:

```typescript
const client = new GraphQLClient(endpoint, {
  errorPolicy: 'ignore'
})

// Never throws, even if errors
const data = await client.request(query)
console.log(data)  // Partial data or undefined

// Errors are silently dropped
```

**Use when:**
- ✅ Errors are recoverable
- ✅ Partial data is acceptable
- ✅ You want graceful degradation

**Example - Fallback UI:**
```typescript
const client = new GraphQLClient(endpoint, {
  errorPolicy: 'ignore'
})

const user = await client.request(query)

return (
  <div>
    {user?.name || 'User name unavailable'}
  </div>
)
```

### errorPolicy: 'all'

Return both data and errors (requires `rawRequest()`):

```typescript
const client = new GraphQLClient(endpoint, {
  errorPolicy: 'all'
})

const { data, errors } = await client.rawRequest(query)

if (errors) {
  console.log('Errors:', errors)
}

if (data) {
  console.log('Data:', data)
}
```

**Use when:**
- ✅ You need partial data from partially failed queries
- ✅ You need detailed error information
- ✅ You're using `rawRequest()`

**Example - Field-level error handling:**
```typescript
const client = new GraphQLClient(endpoint, {
  errorPolicy: 'all'
})

const response = await client.rawRequest(gql`
  {
    user { id name }        // May succeed
    posts { id title }      // May fail
  }
`)

if (response.errors) {
  // Handle field-specific errors
  response.errors.forEach(error => {
    console.log(`Error in ${error.path}: ${error.message}`)
  })
}

// Use whichever data succeeded
if (response.data?.user) {
  renderUser(response.data.user)
}

if (response.data?.posts) {
  renderPosts(response.data.posts)
}
```

### Error Policy Comparison

| Policy | Throws? | Returns data? | Returns errors? | Use case |
|--------|---------|---------------|-----------------|----------|
| `'none'` | ✅ Yes | ❌ No | ❌ No | Strict error handling |
| `'ignore'` | ❌ No | ✅ Yes (partial) | ❌ No | Graceful degradation |
| `'all'` | ❌ No | ✅ Yes (partial) | ✅ Yes | Detailed error info |

---

## Fetch Options

Pass options to the underlying Fetch API via the `fetch` parameter:

```typescript
const client = new GraphQLClient(endpoint, {
  fetch: {
    credentials: 'include',  // Send cookies
    mode: 'cors',            // CORS mode
    cache: 'no-cache',       // Cache behavior
    timeout: 10000           // Request timeout (if fetch supports)
  }
})
```

### Common Fetch Options

#### credentials

Control how cookies are sent:

```typescript
const client = new GraphQLClient(endpoint, {
  fetch: {
    credentials: 'include'  // Send cookies with request
  }
})

// Or
fetch: {
  credentials: 'omit'  // Don't send cookies
}
```

#### mode

Set CORS mode:

```typescript
const client = new GraphQLClient(endpoint, {
  fetch: {
    mode: 'cors'      // Allow cross-origin requests
  }
})

// Or for same-origin requests:
fetch: {
  mode: 'same-origin'
}
```

#### cache

Control caching behavior:

```typescript
const client = new GraphQLClient(endpoint, {
  fetch: {
    cache: 'no-cache'      // Always fetch fresh
  }
})

// Or
fetch: {
  cache: 'default'  // Use HTTP cache
}
```

#### Other Options

```typescript
const client = new GraphQLClient(endpoint, {
  fetch: {
    redirect: 'follow',    // Follow redirects
    referrer: 'no-referrer',
    referrerPolicy: 'no-referrer'
  }
})
```

### Custom Fetch Implementation

```typescript
const client = new GraphQLClient(endpoint, {
  fetch: async (url, options) => {
    console.log('Fetching:', url)
    // Add custom logic here
    return fetch(url, options)
  }
})
```

---

## HTTP Method

### Default: POST

```typescript
const client = new GraphQLClient(endpoint)  // Uses POST
```

### Switch to GET

```typescript
const client = new GraphQLClient(endpoint, {
  method: 'GET'
})

const data = await client.request(query)
```

**POST (default):**
- ✅ Supports large queries
- ✅ Supports complex variables
- ✅ Standard for GraphQL
- ❌ Can't be cached by browser

**GET:**
- ✅ Cacheable by browser/CDN
- ❌ URL length limits (max ~2KB)
- ❌ Difficult for complex variables
- ❌ Less common

### When to Use GET

Mostly for:
- Simple queries (no complex objects)
- Publicly cacheable queries
- CDN-friendly endpoints

```typescript
const client = new GraphQLClient(endpoint, {
  method: 'GET'
})

// Simple query works with GET
const data = await client.request(gql`
  {
    currentUser {
      id
      name
    }
  }
`)

// Complex mutation likely won't work with GET
```

---

## excludeOperationName

Optimization to skip operation name extraction:

```typescript
const client = new GraphQLClient(endpoint, {
  excludeOperationName: true  // Skip operation name extraction
})
```

**Default (false):**
```typescript
// graphql-request extracts the operation name from the document
const query = gql`
  query GetUser {
    user { id name }
  }
`

// Request includes "operationName": "GetUser"
```

**With excludeOperationName: true:**
```typescript
// Operation name is not extracted or sent
const query = gql`
  query GetUser {
    user { id name }
  }
`

// Request doesn't include operationName field
```

### When to Use

✅ You don't use operation names  
✅ Bundle size is critical  
✅ You're using string queries (not gql helper)  
❌ You need operation name in server logs  
❌ You need APM/monitoring with operation names  

---

## Complete Configuration Example

```typescript
import { GraphQLClient } from 'graphql-request'

const client = new GraphQLClient('https://api.example.com/graphql', {
  // Headers: static and dynamic
  headers: {
    'authorization': () => `Bearer ${getToken()}`,
    'x-api-version': '2.0',
    'x-request-id': () => generateId()
  },

  // Error handling: return partial data
  errorPolicy: 'all',

  // HTTP method
  method: 'POST',

  // Fetch options
  fetch: {
    credentials: 'include',
    mode: 'cors',
    cache: 'no-cache'
  },

  // Performance optimization
  excludeOperationName: false
})
```

---

## Configuration Patterns

### Pattern 1: Basic Client

```typescript
const client = new GraphQLClient(endpoint)
```

### Pattern 2: With Authentication

```typescript
const client = new GraphQLClient(endpoint, {
  headers: {
    authorization: `Bearer ${token}`
  }
})
```

### Pattern 3: Dynamic Authentication

```typescript
const client = new GraphQLClient(endpoint, {
  headers: {
    authorization: () => `Bearer ${getLatestToken()}`
  }
})
```

### Pattern 4: Development vs Production

```typescript
const endpoint = process.env.NODE_ENV === 'production'
  ? 'https://api.example.com/graphql'
  : 'http://localhost:4000/graphql'

const client = new GraphQLClient(endpoint, {
  headers: {
    authorization: `Bearer ${process.env.API_TOKEN}`
  },
  fetch: process.env.NODE_ENV === 'development' ? {} : {
    cache: 'default'
  }
})
```

### Pattern 5: Custom Logging

```typescript
const client = new GraphQLClient(endpoint, {
  fetch: async (url, options) => {
    console.log('Request:', url)
    const start = Date.now()

    const response = await fetch(url, options)
    const duration = Date.now() - start

    console.log(`Response (${duration}ms):`, response.status)
    return response
  }
})
```

### Pattern 6: Error Handling

```typescript
const client = new GraphQLClient(endpoint, {
  errorPolicy: 'all'  // Get errors + data
})

const { data, errors } = await client.rawRequest(query)

if (errors) {
  handleErrors(errors)
}

return data
```

### Pattern 7: Shared Configuration

```typescript
// client.ts
export const client = new GraphQLClient(
  process.env.GRAPHQL_ENDPOINT,
  {
    headers: {
      authorization: () => `Bearer ${getToken()}`
    },
    errorPolicy: 'all',
    fetch: {
      credentials: 'include'
    }
  }
)
```

```typescript
// features/users.ts
import { client } from './client'

export async function getUser(id: string) {
  const { data, errors } = await client.rawRequest(userQuery, { id })
  return { data, errors }
}
```

---

## Cross-References

- **Client:** [03-api-client.md](./03-api-client.md) - GraphQLClient overview
- **Methods:** [04-api-methods.md](./04-api-methods.md) - request(), rawRequest(), etc.
- **Authentication:** [05-api-auth.md](./05-api-auth.md) - Header patterns and auth
- **Error Handling:** [08-guide-errors.md](./08-guide-errors.md) - Error policies and strategies
- **Patterns:** [07-guide-workflows.md](./07-guide-workflows.md) - Real-world examples

---

**Source:** [github.com/jasonkuhrt/graphql-request](https://github.com/jasonkuhrt/graphql-request)  
**Package:** graphql-request 7.4.0  
**Last Updated:** February 2026