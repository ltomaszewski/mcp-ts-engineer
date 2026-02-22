# 08-guide-errors.md
## Error Handling & Error Policies

**Source:** [github.com/jasonkuhrt/graphql-request](https://github.com/jasonkuhrt/graphql-request) documentation  
**Package:** graphql-request 7.4.0  
**Status:** Complete error handling guide

---

## Table of Contents

1. [Error Handling Overview](#error-handling-overview)
2. [Error Policy: none](#error-policy-none)
3. [Error Policy: ignore](#error-policy-ignore)
4. [Error Policy: all](#error-policy-all)
5. [ClientError Object](#clienterror-object)
6. [Error Types](#error-types)
7. [Recovery Patterns](#recovery-patterns)
8. [Debugging Errors](#debugging-errors)

---

## Error Handling Overview

graphql-request handles errors through **error policies** configured on the client:

```typescript
const client = new GraphQLClient(endpoint, {
  errorPolicy: 'none'   // Throw on error (default)
})
```

**Three strategies available:**

| Policy | Throws? | Data? | Errors? | Use Case |
|--------|---------|-------|---------|----------|
| `'none'` | ✅ Yes | ❌ No | ❌ No | Strict error handling |
| `'ignore'` | ❌ No | ✅ Yes | ❌ No | Graceful degradation |
| `'all'` | ❌ No | ✅ Yes | ✅ Yes | Detailed error info |

---

## Error Policy: none

**Default behavior.** Throws `ClientError` if GraphQL returns any errors.

```typescript
const client = new GraphQLClient(endpoint, {
  errorPolicy: 'none'  // Default - can omit
})

try {
  const data = await client.request(query)
  console.log('Success:', data)
} catch (error) {
  console.error('Error:', error.message)
  console.error('GraphQL Errors:', error.response.errors)
}
```

### When Query Has Errors

```typescript
const query = gql`
  {
    user(id: "invalid") {
      id
      name
    }
  }
`

try {
  const data = await client.request(query)
} catch (error) {
  // Throws with error details
  console.log(error.response.errors[0].message)
  // "User not found"
}
```

### Error Structure

```typescript
{
  message: 'GraphQL request error',
  response: {
    data: undefined,
    errors: [
      {
        message: 'User not found',
        extensions: { code: 'NOT_FOUND' },
        path: ['user']
      }
    ]
  },
  request: {
    query: '{ user(id: "invalid") { id name } }',
    variables: {}
  }
}
```

### Best For

✅ Strict error handling  
✅ Errors should stop execution  
✅ Most APIs and applications  

---

## Error Policy: ignore

**Suppress errors.** Returns data (possibly undefined), never throws.

```typescript
const client = new GraphQLClient(endpoint, {
  errorPolicy: 'ignore'  // Don't throw on errors
})

const data = await client.request(query)
console.log(data)  // Might be undefined or partial
```

### With Partial Data

```typescript
const query = gql`
  {
    user { id name }
    posts { id title }
  }
`

const data = await client.request(query)

// If posts query fails, user data still returned
if (data?.user) {
  console.log('User:', data.user)
}

if (data?.posts) {
  console.log('Posts:', data.posts)
}

// Errors silently dropped
```

### Real-World Example

```typescript
const client = new GraphQLClient(endpoint, {
  errorPolicy: 'ignore'
})

// Graceful degradation
const user = await client.request(userQuery)

return (
  <div>
    <h1>{user?.name || 'User'}</h1>
    <p>{user?.bio || 'No bio available'}</p>
  </div>
)
```

### Best For

✅ Non-critical data  
✅ Graceful degradation  
✅ Fallback UI needed  
❌ You need error details  

---

## Error Policy: all

**Return everything.** Includes both data and errors. Use with `rawRequest()`.

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

### Field-Level Errors

Some fields might succeed while others fail:

```typescript
const query = gql`
  {
    user { id name }        # Success
    expensiveComputation {} # Fails
  }
`

const { data, errors } = await client.rawRequest(query)

if (errors) {
  errors.forEach(error => {
    console.log(`Field error: ${error.path.join('.')}`)
    console.log(`Message: ${error.message}`)
  })
}

// Use successful data
if (data?.user) {
  renderUser(data.user)
}
```

### Access HTTP Metadata

```typescript
const { data, errors, status, headers } = await client.rawRequest(query)

if (status === 401) {
  console.log('Unauthorized - check credentials')
  redirectToLogin()
}

if (status === 429) {
  const retryAfter = headers.get('Retry-After')
  console.log(`Rate limited - retry after ${retryAfter}s`)
}
```

### Best For

✅ Partial data handling  
✅ Field-level error info  
✅ HTTP metadata needed  
✅ Custom error recovery  

---

## ClientError Object

### Error Properties

```typescript
interface ClientError extends Error {
  name: 'GraphQLError'
  message: string
  
  // GraphQL response
  response: {
    data?: unknown
    errors?: GraphQLError[]
    extensions?: Record<string, unknown>
  }
  
  // Original request
  request?: {
    query: string
    variables?: Variables
  }
  
  // HTTP info
  status?: number
}
```

### Accessing Error Details

```typescript
try {
  const data = await client.request(query)
} catch (error) {
  // Check error type
  if (error instanceof ClientError) {
    // GraphQL errors
    error.response.errors?.forEach(e => {
      console.log(`Error: ${e.message}`)
      console.log(`Path: ${e.path?.join('.')}`)
      console.log(`Code: ${e.extensions?.code}`)
    })

    // HTTP status
    console.log(`Status: ${error.status}`)

    // Request info
    console.log(`Query: ${error.request?.query}`)
  } else {
    // Network error or other
    console.log(`Unexpected error: ${error.message}`)
  }
}
```

### GraphQLError Details

```typescript
interface GraphQLError {
  message: string
  path?: (string | number)[]  // Where in query it occurred
  locations?: SourceLocation[]
  extensions?: {
    code?: string              // 'NOT_FOUND', 'UNAUTHORIZED', etc
    [key: string]: unknown
  }
}
```

---

## Error Types

### Validation Errors

Invalid query syntax:

```typescript
const invalidQuery = gql`
  {
    user(id: "123") {
      invalidField  // This field doesn't exist
    }
  }
`

// Throws error about invalid field
```

### Authentication Errors

```typescript
// Missing or invalid token
const client = new GraphQLClient(endpoint, {
  headers: { authorization: 'Bearer invalid' }
})

// Error with extensions.code: 'UNAUTHENTICATED'
```

### Permission Errors

```typescript
// User lacks permission for operation
const deleteQuery = gql`
  mutation {
    deleteUser(id: "123") {
      id
    }
  }
`

// Error with extensions.code: 'FORBIDDEN'
```

### Not Found Errors

```typescript
const query = gql`
  {
    user(id: "nonexistent") {
      id
    }
  }
`

// Error with extensions.code: 'NOT_FOUND'
```

### Network Errors

```typescript
// Fetch-level errors (network down, CORS, timeout)
try {
  const data = await client.request(query)
} catch (error) {
  // Not ClientError, but plain Error
  console.log(error.message)  // 'Failed to fetch', etc
}
```

---

## Recovery Patterns

### Pattern 1: Retry Logic

```typescript
async function requestWithRetry(query: string, maxRetries = 3) {
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await client.request(query)
    } catch (error) {
      if (i === maxRetries - 1) throw error

      // Exponential backoff
      const delay = Math.pow(2, i) * 1000
      await new Promise(resolve => setTimeout(resolve, delay))
    }
  }
}
```

### Pattern 2: Fallback Data

```typescript
async function getUserSafe(id: string) {
  try {
    return await client.request(getUserQuery, { id })
  } catch (error) {
    // Return fallback data
    return {
      user: {
        id,
        name: 'Unknown User',
        status: 'unavailable'
      }
    }
  }
}
```

### Pattern 3: Partial Data with Errors

```typescript
const client = new GraphQLClient(endpoint, {
  errorPolicy: 'all'
})

async function getDataWithFallbacks(query: string) {
  const { data, errors } = await client.rawRequest(query)

  if (errors) {
    // Log errors for monitoring
    logErrors(errors)

    // Use partial data that succeeded
    return data || {}
  }

  return data
}
```

### Pattern 4: Circuit Breaker

```typescript
class CircuitBreaker {
  private failures = 0
  private threshold = 5
  private resetTimeout = 60000
  private lastFailureTime = 0

  async execute(fn: () => Promise<any>) {
    if (this.isOpen()) {
      throw new Error('Circuit breaker is open')
    }

    try {
      const result = await fn()
      this.recordSuccess()
      return result
    } catch (error) {
      this.recordFailure()
      throw error
    }
  }

  private isOpen(): boolean {
    if (this.failures < this.threshold) return false

    const timeSinceLastFailure = Date.now() - this.lastFailureTime
    return timeSinceLastFailure < this.resetTimeout
  }

  private recordSuccess() {
    this.failures = 0
  }

  private recordFailure() {
    this.failures++
    this.lastFailureTime = Date.now()
  }
}

const breaker = new CircuitBreaker()
const data = await breaker.execute(() => client.request(query))
```

---

## Debugging Errors

### Enable Request Logging

```typescript
const client = new GraphQLClient(endpoint, {
  fetch: async (url, options) => {
    console.log('Request:', url, options)
    const response = await fetch(url, options)
    const body = await response.clone().text()
    console.log('Response:', body)
    return response
  }
})
```

### Inspect Error Details

```typescript
try {
  const data = await client.request(query)
} catch (error) {
  console.log('Full error:', error)
  console.log('GraphQL errors:', error.response?.errors)
  console.log('Request:', error.request)
  console.log('Status:', error.status)
}
```

### Use Error Extensions

```typescript
catch (error) {
  const extensions = error.response?.errors?.[0]?.extensions

  // Custom error codes set by server
  if (extensions?.code === 'RATE_LIMITED') {
    console.log(`Rate limit: ${extensions.retryAfter}s`)
  }

  if (extensions?.code === 'AUTHENTICATION_REQUIRED') {
    redirectToLogin()
  }
}
```

---

## Cross-References

- **Configuration:** [06-api-config.md](./06-api-config.md) - errorPolicy option
- **Methods:** [04-api-methods.md](./04-api-methods.md) - request() vs rawRequest()
- **Best Practices:** [09-best-practices.md](./09-best-practices.md) - Error strategies
- **Patterns:** [07-guide-workflows.md](./07-guide-workflows.md) - Error handling examples

---

**Source:** [github.com/jasonkuhrt/graphql-request](https://github.com/jasonkuhrt/graphql-request)  
**Package:** graphql-request 7.4.0  
**Last Updated:** February 2026