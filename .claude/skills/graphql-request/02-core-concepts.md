# Core Concepts & Architecture

**Source:** [github.com/jasonkuhrt/graphql-request](https://github.com/jasonkuhrt/graphql-request)
**Package:** graphql-request 7.4.0
**Status:** Conceptual foundation for all other modules

---

## Table of Contents

1. [What is graphql-request?](#what-is-graphql-request)
2. [Two API Approaches](#two-api-approaches)
3. [Static Function API](#static-function-api)
4. [GraphQLClient Class API](#graphqlclient-class-api)
5. [When to Use Each](#when-to-use-each)
6. [Request/Response Flow](#requestresponse-flow)
7. [Error Handling Model](#error-handling-model)
8. [Middleware & Extensibility](#middleware--extensibility)
9. [Design Philosophy](#design-philosophy)

---

## What is graphql-request?

graphql-request is a lightweight GraphQL client that:

| Aspect | Description |
|--------|-------------|
| **Size** | Minimal footprint (few KB) |
| **Dependencies** | Only requires `graphql` peer dependency |
| **Scope** | HTTP request abstraction over GraphQL queries |
| **Not a framework** | Not Apollo Client, URQL, or React Query—intentionally simple |
| **Perfect for** | Backend services, CLI tools, server-to-server communication, simple frontends |

### Philosophy

graphql-request follows the Unix philosophy:
- Do one thing well
- Small, composable, extensible
- Minimal magic or opinionated defaults
- Let users build abstractions on top

---

## Two API Approaches

graphql-request provides **two complementary APIs** for different use cases:

### 1. Static `request()` Function

**Purpose:** Simple, one-off requests
**When:** Scripts, single requests, no reusable configuration
**Setup:** Minimal, no client instantiation needed

```typescript
import { request, gql } from 'graphql-request'

const endpoint = 'https://api.example.com/graphql'
const query = gql`{ company { name } }`

const data = await request(endpoint, query)
```

**Characteristics:**
- Function-based (not OOP)
- Endpoint passed per request
- No persisted configuration
- Creates new HTTP request per call
- Simplest possible interface

---

### 2. GraphQLClient Class API

**Purpose:** Multiple requests with shared configuration
**When:** Apps, services, reusable client patterns
**Setup:** Instantiate once, reuse multiple times

```typescript
import { GraphQLClient, gql } from 'graphql-request'

const client = new GraphQLClient('https://api.example.com/graphql', {
  headers: { authorization: 'Bearer TOKEN' }
})

const data = await client.request(query)
```

**Characteristics:**
- Class-based (OOP)
- Configuration defined at instantiation
- Headers, middleware, custom fetch applied to all requests
- Efficient for multiple requests
- More features and control

---

## Static Function API

### Import
```typescript
import { request, gql } from 'graphql-request'
```

### Function Signature
```typescript
async function request<T = any>(
  url: string,
  document: string | DocumentNode,
  variables?: Record<string, any>,
  requestHeaders?: Record<string, string>
): Promise<T>
```

### Parameters
| Parameter | Type | Description |
|-----------|------|-------------|
| `url` | `string` | GraphQL endpoint URL |
| `document` | `string \| DocumentNode` | Query or mutation (as string or parsed GraphQL AST) |
| `variables` | `Record<string, any>` (optional) | Dynamic values for query variables |
| `requestHeaders` | `Record<string, string>` (optional) | Custom headers for this request only |

### Return
- **Type:** Promise resolving to response data
- **Structure:** `{ data?: T, errors?: GraphQLError[] }`
- **Throws:** `GraphQLRequestError` on network/GraphQL errors

### Key Behaviors
1. Creates new HTTP request each call
2. Headers passed per request don't persist
3. No middleware support (for middleware, use class API)
4. Simpler mental model, less boilerplate

### Example
```typescript
const query = gql`
  query GetUser($id: ID!) {
    user(id: $id) {
      id
      name
      email
    }
  }
`

try {
  const data = await request(
    'https://api.example.com/graphql',
    query,
    { id: '123' },
    { authorization: 'Bearer token' }
  )
  console.log(data.user)
} catch (error) {
  console.error('Request failed:', error)
}
```

---

## GraphQLClient Class API

### Import
```typescript
import { GraphQLClient } from 'graphql-request'
```

### Constructor
```typescript
new GraphQLClient(
  url: string,
  options?: ClientOptions
)
```

### Constructor Parameters
| Parameter | Type | Description |
|-----------|------|-------------|
| `url` | `string` | GraphQL endpoint URL |
| `options` | `ClientOptions` (optional) | Configuration object |

### ClientOptions
```typescript
interface ClientOptions {
  headers?: Record<string, string>
  middleware?: Middleware[]
  fetch?: typeof fetch  // Custom fetch implementation
  requestPolicy?: 'cache-first' | 'network-only' | 'cache-and-network'
  [key: string]: any   // Any custom options
}
```

### Instance Method: `request()`
```typescript
async request<T = any>(
  document: string | DocumentNode,
  variables?: Record<string, any>,
  requestHeaders?: Record<string, string>,
  operationName?: string
): Promise<T>
```

### Key Behaviors
1. Reuses URL and base headers from constructor
2. Per-request headers merge with client headers
3. Middleware applied to all requests
4. Custom fetch used for all HTTP calls
5. Configuration persists across multiple calls

### Example
```typescript
const client = new GraphQLClient(
  'https://api.example.com/graphql',
  {
    headers: {
      authorization: 'Bearer token',
      'x-api-key': 'key123'
    }
  }
)

// Both requests share client configuration
const user = await client.request(getUserQuery, { id: '1' })
const posts = await client.request(getPostsQuery)

// Override headers for specific request
const admin = await client.request(getAdminQuery, {}, {
  authorization: 'Bearer admin-token'
})
```

---

## When to Use Each

### Use Static `request()` When:

✅ **Script or CLI tool**
```typescript
// One-off request in a build script
const data = await request(endpoint, query)
```

✅ **Single isolated request**
```typescript
// Fetching data for a static page
const siteConfig = await request(configEndpoint, configQuery)
```

✅ **Minimal dependencies**
```typescript
// Want absolute minimum code
import { request } from 'graphql-request'
```

✅ **No shared authentication**
```typescript
// Each request has different auth or none
const data1 = await request(url, q1, {}, { token: 'a' })
const data2 = await request(url, q2, {}, { token: 'b' })
```

### Use GraphQLClient When:

✅ **Multiple related requests**
```typescript
const client = new GraphQLClient(endpoint, config)
const user = await client.request(userQuery)
const posts = await client.request(postsQuery)
```

✅ **Shared authentication or headers**
```typescript
const client = new GraphQLClient(endpoint, {
  headers: { authorization: 'Bearer token' }
})
// Token applied to all requests automatically
```

✅ **Need middleware**
```typescript
const client = new GraphQLClient(endpoint, {
  middleware: [loggerMiddleware, errorHandlerMiddleware]
})
```

✅ **Custom fetch or retry logic**
```typescript
const client = new GraphQLClient(endpoint, {
  fetch: customFetch,
  requestPolicy: 'cache-first'
})
```

✅ **Application code (React, Node.js service)**
```typescript
// Create once at app startup
const client = new GraphQLClient(process.env.API_URL, options)

// Export and use throughout app
export { client }
```

---

## Request/Response Flow

### Static Function Flow
```
request(endpoint, query, vars, headers)
    ↓
Create HTTP POST request
    ↓
Send to endpoint with:
  - Query/mutation as body
  - Variables as JSON
  - Headers (merged with defaults)
    ↓
Receive JSON response
    ↓
Parse GraphQL result
    ↓
Return data or throw error
```

### Client Class Flow
```
new GraphQLClient(endpoint, options)
    ↓
Store configuration
    ↓
client.request(query, vars, headers)
    ↓
Apply middleware (before-request)
    ↓
Merge headers (client defaults + request-specific)
    ↓
Create HTTP POST request via fetch (custom or default)
    ↓
Apply middleware (after-response)
    ↓
Parse and validate response
    ↓
Return data or throw error
```

---

## Error Handling Model

graphql-request distinguishes between **two types of errors**:

### 1. Network Errors
Failures at the HTTP layer (connection, timeout, 404, 500, etc.)

```typescript
try {
  const data = await request(endpoint, query)
} catch (error) {
  if (error instanceof GraphQLRequestError) {
    console.log(error.response)  // Raw HTTP response
    console.log(error.status)    // HTTP status code
  }
}
```

### 2. GraphQL Errors
Valid HTTP response (200) but GraphQL layer errors

```typescript
try {
  const data = await client.request(query)
} catch (error) {
  if (error instanceof GraphQLRequestError) {
    console.log(error.response.errors)  // Array of GraphQL errors
  }
}
```

### Error Object Structure
```typescript
interface GraphQLRequestError {
  response: {
    status: number
    headers: Record<string, string>
    data?: any  // Response body
    errors?: Array<{
      message: string
      locations?: Array<{ line: number; column: number }>
      path?: string[]
      extensions?: Record<string, any>
    }>
  }
  status: number
  request: {
    query: string
    variables?: Record<string, any>
    headers: Record<string, string>
  }
}
```

---

## Middleware & Extensibility

### What is Middleware?

Middleware is a function that wraps the request/response cycle:

```typescript
type Middleware = (request: RequestInit, url: string) => RequestInit
```

Middleware can:
- Modify requests (add headers, transform body)
- Intercept responses (log, cache, retry)
- Handle errors (log, alert, recover)
- Add side effects (metrics, tracing)

### Common Middleware Patterns

```typescript
// Logger middleware
const loggerMiddleware: Middleware = (request, url) => {
  console.log('Request:', { url, ...request })
  return request
}

// Add timestamp
const timestampMiddleware: Middleware = (request) => {
  return {
    ...request,
    headers: {
      ...request.headers,
      'x-request-time': new Date().toISOString()
    }
  }
}

// Apply to client
const client = new GraphQLClient(endpoint, {
  middleware: [loggerMiddleware, timestampMiddleware]
})
```

### Custom Fetch

For maximum control, provide custom `fetch` implementation:

```typescript
const customFetch = async (url: string, init: RequestInit) => {
  console.log('Custom fetch called')
  return fetch(url, init)
}

const client = new GraphQLClient(endpoint, {
  fetch: customFetch
})
```

---

## Design Philosophy

### Minimalism
graphql-request is intentionally minimal:
- No cache (add your own or use React Query)
- No real-time subscriptions (use WebSocket library separately)
- No automatic persisting (use Redux, Zustand, etc.)
- **Result:** Small, focused, composable

### Zero Magic
- No implicit behaviors
- No global state
- Explicit configuration per client
- **Result:** Predictable, debuggable, testable

### HTTP First
- Abstracts HTTP complexity, not GraphQL
- Direct control over requests/responses
- Compatible with any GraphQL server
- **Result:** Works everywhere, integrates easily

### Composability
- Works with any state management (Redux, Zustand, MobX)
- Works with any data fetching pattern (React Query, SWR)
- Pairs well with REST APIs
- **Result:** No lock-in, maximum flexibility

---

## Next Steps

1. **Ready to set up?** → See [01-setup-installation.md](./01-setup-installation.md)
2. **Need the client API?** → Read [03-api-client.md](./03-api-client.md)
3. **Want practical examples?** → Check [07-guide-workflows.md](./07-guide-workflows.md)
4. **Evaluating alternatives?** → See [10-comparison-clients.md](./10-comparison-clients.md)

---

**Source:** [github.com/jasonkuhrt/graphql-request](https://github.com/jasonkuhrt/graphql-request)
**Package:** graphql-request 7.4.0
**Last Updated:** December 2025
