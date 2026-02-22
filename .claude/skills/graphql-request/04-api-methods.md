# API Reference: Methods

**Source:** [github.com/jasonkuhrt/graphql-request](https://github.com/jasonkuhrt/graphql-request)
**Package:** graphql-request 7.4.0
**Status:** Complete method reference

---

## Table of Contents

1. [request() Method](#request-method)
2. [rawRequest() Method](#rawrequest-method)
3. [setHeader() Method](#setheader-method)
4. [setHeaders() Method](#setheaders-method)
5. [Method Comparison](#method-comparison)
6. [Type Definitions](#type-definitions)
7. [Common Patterns](#common-patterns)

---

## request() Method

### Overview

Returns only the data from a GraphQL response. Throws an error if the query fails (unless errorPolicy is configured).

### Signature

```typescript
async request<T = any>(
  document: string | DocumentNode,
  variables?: Variables,
  requestHeaders?: HeadersObject
): Promise<T>
```

### Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `document` | `string \| DocumentNode` | ✅ Yes | GraphQL query or mutation document |
| `variables` | `Record<string, any>` | ❌ No | Query variables |
| `requestHeaders` | `Record<string, string>` | ❌ No | HTTP headers for this request only |

### Returns

- **Type:** `Promise<T>`
- **Resolves:** Response data object
- **Rejects:** `ClientError` if GraphQL returns error (default behavior)

### Basic Example

```typescript
import { GraphQLClient, gql } from 'graphql-request'

const client = new GraphQLClient('https://api.example.com/graphql')

const query = gql`
  {
    user {
      id
      name
      email
    }
  }
`

// Returns just the data
const data = await client.request(query)
console.log(data.user.name)  // TypeScript knows data shape
```

### With Variables

```typescript
import { GraphQLClient, gql } from 'graphql-request'

const client = new GraphQLClient('https://api.example.com/graphql')

const query = gql`
  query GetUser($id: ID!) {
    user(id: $id) {
      id
      name
      email
    }
  }
`

const data = await client.request(query, {
  id: '123'
})

console.log(data.user)
```

### With Per-Request Headers

```typescript
import { GraphQLClient, gql } from 'graphql-request'

const client = new GraphQLClient('https://api.example.com/graphql')

const query = gql`{ me { name } }`

// Override client headers for this request
const data = await client.request(query, undefined, {
  authorization: 'Bearer DIFFERENT_TOKEN',
  'x-request-id': 'req-456'
})

console.log(data.me.name)
```

### With TypeScript Generics

```typescript
import { GraphQLClient, gql } from 'graphql-request'

interface User {
  id: string
  name: string
  email: string
}

interface UserResponse {
  user: User
}

const client = new GraphQLClient('https://api.example.com/graphql')

const query = gql`
  query GetUser($id: ID!) {
    user(id: $id) {
      id
      name
      email
    }
  }
`

const data = await client.request<UserResponse>(query, { id: '123' })

// data is fully typed
data.user.id  // ✅ Type-safe
```

### Error Behavior

```typescript
import { GraphQLClient, gql } from 'graphql-request'

const client = new GraphQLClient('https://api.example.com/graphql')

const invalidQuery = gql`
  {
    invalidField {  // This field doesn't exist
      data
    }
  }
`

try {
  const data = await client.request(invalidQuery)
} catch (error) {
  // Throws ClientError with GraphQL errors
  console.error(error.message)
  console.error(error.response.errors)
}
```

---

## rawRequest() Method

### Overview

Returns the complete HTTP response including data, errors, extensions, headers, and status code. Useful for accessing error details or HTTP metadata.

### Signature

```typescript
async rawRequest<T = any>(
  document: string | DocumentNode,
  variables?: Variables,
  requestHeaders?: HeadersObject
): Promise<{
  data: T | undefined
  errors: GraphQLError[] | undefined
  extensions?: any
  headers: Headers
  status: number
}>
```

### Return Type

```typescript
interface RawResponse<T> {
  data: T | undefined              // Response data (may be undefined if errors occurred)
  errors?: GraphQLError[]           // GraphQL errors (if any)
  extensions?: Record<string, any>  // Extensions (caching hints, tracing, etc)
  headers: Headers                  // HTTP response headers
  status: number                    // HTTP status code (200, 400, 500, etc)
}
```

### Basic Example

```typescript
import { GraphQLClient, gql } from 'graphql-request'

const client = new GraphQLClient('https://api.example.com/graphql', {
  errorPolicy: 'all'  // Return errors instead of throwing
})

const query = gql`{ user { id name } }`

const response = await client.rawRequest(query)

console.log('Data:', response.data)
console.log('Errors:', response.errors)
console.log('Status:', response.status)
console.log('Headers:', response.headers)
```

### Accessing Extensions

```typescript
import { GraphQLClient, gql } from 'graphql-request'

const client = new GraphQLClient('https://api.example.com/graphql', {
  errorPolicy: 'all'
})

const query = gql`{ user { id name } }`

const response = await client.rawRequest(query)

// Extensions often contain caching hints
if (response.extensions?.cacheControl) {
  console.log('Cache hint:', response.extensions.cacheControl)
}
```

### Checking HTTP Status

```typescript
import { GraphQLClient, gql } from 'graphql-request'

const client = new GraphQLClient('https://api.example.com/graphql', {
  errorPolicy: 'all'
})

const query = gql`{ user { id name } }`

const response = await client.rawRequest(query)

if (response.status === 200) {
  console.log('Request successful')
} else if (response.status === 401) {
  console.log('Unauthorized - check your credentials')
} else if (response.status >= 500) {
  console.log('Server error')
}
```

### With Partial Data and Errors

```typescript
import { GraphQLClient, gql } from 'graphql-request'

const client = new GraphQLClient('https://api.example.com/graphql', {
  errorPolicy: 'all'  // Required to get both data and errors
})

const query = gql`
  {
    user { id name }
    invalidField { data }
  }
`

const response = await client.rawRequest(query)

if (response.errors) {
  console.log('Errors:', response.errors)
}

if (response.data) {
  // Can still use partial data
  console.log('User:', response.data.user)
}
```

---

## setHeader() Method

### Overview

Update a single header on the client instance. Changes apply to all subsequent requests.

### Signature

```typescript
setHeader(key: string, value: string): void
```

### Parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| `key` | `string` | Header name (e.g., "authorization") |
| `value` | `string` | Header value |

### Basic Example

```typescript
import { GraphQLClient } from 'graphql-request'

const client = new GraphQLClient('https://api.example.com/graphql')

// Set a header
client.setHeader('authorization', 'Bearer initial_token')

const data = await client.request(query)  // Uses initial_token
```

### Updating Headers

```typescript
import { GraphQLClient } from 'graphql-request'

const client = new GraphQLClient('https://api.example.com/graphql')

// Initial header
client.setHeader('authorization', 'Bearer token_v1')

// Later, update it
client.setHeader('authorization', 'Bearer token_v2')

// Subsequent requests use new value
const data = await client.request(query)  // Uses token_v2
```

### Adding Custom Headers

```typescript
import { GraphQLClient } from 'graphql-request'

const client = new GraphQLClient('https://api.example.com/graphql', {
  headers: {
    'x-api-version': '2.0'
  }
})

// Add another header later
client.setHeader('x-request-timeout', '30000')

// Both headers are sent
const data = await client.request(query)
```

### Removing Headers

```typescript
import { GraphQLClient } from 'graphql-request'

const client = new GraphQLClient('https://api.example.com/graphql', {
  headers: {
    authorization: 'Bearer token'
  }
})

// Set header to empty string to effectively remove it
client.setHeader('authorization', '')

const data = await client.request(query)
```

---

## setHeaders() Method

### Overview

Replace all headers on the client instance at once. Per-request headers override these.

### Signature

```typescript
setHeaders(headers: Record<string, string>): void
```

### Parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| `headers` | `object` | Object with header key-value pairs |

### Basic Example

```typescript
import { GraphQLClient } from 'graphql-request'

const client = new GraphQLClient('https://api.example.com/graphql')

// Replace all headers
client.setHeaders({
  authorization: 'Bearer token',
  'x-custom-header': 'value'
})

const data = await client.request(query)
```

### Overwriting Multiple Headers

```typescript
import { GraphQLClient } from 'graphql-request'

const client = new GraphQLClient('https://api.example.com/graphql', {
  headers: {
    authorization: 'Bearer old_token',
    'x-api-version': '1.0'
  }
})

// This replaces all headers, not merges
client.setHeaders({
  authorization: 'Bearer new_token',
  'x-api-version': '2.0',
  'x-request-id': 'req-123'
})

// Old request-id header is gone
```

### Clearing Headers

```typescript
import { GraphQLClient } from 'graphql-request'

const client = new GraphQLClient('https://api.example.com/graphql', {
  headers: {
    authorization: 'Bearer token'
  }
})

// Clear all headers
client.setHeaders({})

const data = await client.request(query)  // No headers sent
```

---

## Method Comparison

### request() vs rawRequest()

| Feature | request() | rawRequest() |
|---------|-----------|-------------|
| Returns data | ✅ Yes | ✅ Yes |
| Returns errors | ❌ No (throws) | ✅ Yes |
| Returns HTTP status | ❌ No | ✅ Yes |
| Returns headers | ❌ No | ✅ Yes |
| Returns extensions | ❌ No | ✅ Yes |
| Throws on error | ✅ Yes (default) | ❌ No |
| Type signature | Simple | Complex |
| Use case | Most queries | Error handling, HTTP metadata |

### When to Use request()

```typescript
// Simple case - you expect success
const data = await client.request(query)
console.log(data)
```

### When to Use rawRequest()

```typescript
// You need to handle errors
const response = await client.rawRequest(query)
if (response.errors) {
  // Handle errors
} else {
  // Use data
}

// Or you need HTTP status/headers
const { status, headers } = await client.rawRequest(query)
console.log(`HTTP ${status}`)
```

---

## Type Definitions

### Variables Type

```typescript
type Variables = Record<string, any>

// Example
const variables: Variables = {
  userId: '123',
  limit: 10,
  active: true,
  tags: ['javascript', 'graphql']
}
```

### HeadersObject Type

```typescript
type HeadersObject = Record<string, string | (() => string)>

// Examples
const headers: HeadersObject = {
  // Static string
  'authorization': 'Bearer token',

  // Function (evaluated per request)
  'x-timestamp': () => new Date().toISOString(),

  // Getters
  'x-request-id': () => generateRequestId()
}
```

### DocumentNode Type

```typescript
import { DocumentNode } from 'graphql'

// Created with gql helper
const query: DocumentNode = gql`{ user { id } }`

// Or as string
const queryString: string = '{ user { id } }'
```

### ClientError

```typescript
import { ClientError } from 'graphql-request'

interface ClientError extends Error {
  response: {
    data?: any
    errors?: GraphQLError[]
    extensions?: any
  }
  status?: number
  request?: {
    query: string
    variables?: Variables
  }
}
```

---

## Common Patterns

### Pattern 1: Basic Query

```typescript
const data = await client.request(query)
```

### Pattern 2: Query with Variables

```typescript
const data = await client.request(query, { id: '123' })
```

### Pattern 3: Override Headers

```typescript
const data = await client.request(query, undefined, {
  authorization: 'Bearer special_token'
})
```

### Pattern 4: Error Handling with rawRequest

```typescript
const { data, errors } = await client.rawRequest(query)

if (errors) {
  errors.forEach(e => console.error(e.message))
}

if (data) {
  // Use data
}
```

### Pattern 5: Update Headers Dynamically

```typescript
// Update token before request
const token = await getLatestToken()
client.setHeader('authorization', `Bearer ${token}`)

const data = await client.request(query)
```

### Pattern 6: Static Function

```typescript
const data = await request(endpoint, query, variables, headers)
```

---

## Cross-References

- **Client Overview:** [03-api-client.md](./03-api-client.md) - Understanding GraphQLClient
- **Configuration:** [06-api-config.md](./06-api-config.md) - Client configuration options
- **Authentication:** [05-api-auth.md](./05-api-auth.md) - Header patterns and auth
- **Error Handling:** [08-guide-errors.md](./08-guide-errors.md) - Error policies and strategies
- **Workflows:** [07-guide-workflows.md](./07-guide-workflows.md) - Real-world usage patterns

---

**Source:** [github.com/jasonkuhrt/graphql-request](https://github.com/jasonkuhrt/graphql-request)  
**Package:** graphql-request 7.4.0  
**Last Updated:** February 2026