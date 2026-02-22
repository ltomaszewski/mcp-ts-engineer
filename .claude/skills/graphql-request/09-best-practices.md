# 09-best-practices.md
## Production Patterns & Quality Standards

**Source:** [github.com/jasonkuhrt/graphql-request](https://github.com/jasonkuhrt/graphql-request) documentation  
**Package:** graphql-request 7.4.0  
**Status:** Complete best practices guide

---

## Table of Contents

1. [Performance Optimization](#performance-optimization)
2. [Security Hardening](#security-hardening)
3. [TypeScript Patterns](#typescript-patterns)
4. [Testing Strategies](#testing-strategies)
5. [Error Recovery](#error-recovery)
6. [Code Organization](#code-organization)
7. [Monitoring & Logging](#monitoring--logging)
8. [Common Pitfalls](#common-pitfalls)

---

## Performance Optimization

### Use Variables, Never Interpolate

```typescript
// ❌ BAD - String interpolation is inefficient and unsafe
const query = `{ user(id: "${userId}") { name } }`

// ✅ GOOD - Use variables
const query = gql`
  query GetUser($id: ID!) {
    user(id: $id) { name }
  }
`
const data = await client.request(query, { id: userId })
```

### Fetch Only Needed Fields

```typescript
// ❌ BAD - Over-fetching unnecessary fields
const query = gql`
  {
    user {
      id
      name
      email
      bio
      avatar
      posts {
        id
        title
        content
        comments {
          id
          text
          author { name }
        }
      }
    }
  }
`

// ✅ GOOD - Fetch only what you use
const query = gql`
  {
    user {
      id
      name
      posts {
        id
        title
      }
    }
  }
`
```

### Batch Requests Wisely

```typescript
// ❌ BAD - N+1 requests
for (const userId of userIds) {
  const user = await client.request(getUserQuery, { id: userId })
}

// ✅ GOOD - Batch with Promise.all
const users = await Promise.all(
  userIds.map(id => client.request(getUserQuery, { id }))
)

// ✅ EVEN BETTER - Single request for multiple items
const users = await client.request(getUsersQuery, { ids: userIds })
```

### Reuse Client Instances

```typescript
// ❌ BAD - Creates new client per request
async function getUser(id: string) {
  const client = new GraphQLClient(endpoint)
  return client.request(query, { id })
}

// ✅ GOOD - Reuse singleton client
const client = new GraphQLClient(endpoint)

async function getUser(id: string) {
  return client.request(query, { id })
}
```

### Use excludeOperationName for String Queries

```typescript
// ❌ BAD - String query requires parsing
const query = '{ user { id } }'

// ✅ GOOD - gql tagged string with operation name
const query = gql`
  query GetUser {
    user { id }
  }
`

// ✅ OR skip extraction entirely
const client = new GraphQLClient(endpoint, {
  excludeOperationName: true
})
```

---

## Security Hardening

### Always Use HTTPS

```typescript
// ❌ BAD - Insecure
const endpoint = 'http://api.example.com/graphql'

// ✅ GOOD - Secure
const endpoint = 'https://api.example.com/graphql'
```

### Never Log Tokens

```typescript
// ❌ BAD - Exposes credentials
console.log('Token:', token)
fetch(url, { headers: { authorization: `Bearer ${token}` } })

// ✅ GOOD - Don't log sensitive data
const masked = token.slice(0, 4) + '...' + token.slice(-4)
console.log('Using token:', masked)
```

### Validate Input Before GraphQL

```typescript
// ❌ BAD - Trust user input
const data = await client.request(query, {
  userId: req.body.userId  // Could be malicious
})

// ✅ GOOD - Validate first
import { z } from 'zod'

const userIdSchema = z.string().uuid()
const userId = userIdSchema.parse(req.body.userId)
const data = await client.request(query, { userId })
```

### Use Environment Variables for Secrets

```typescript
// ❌ BAD - Hardcoded secrets
const client = new GraphQLClient('https://api.example.com/graphql', {
  headers: { authorization: 'Bearer sk_live_abc123xyz' }
})

// ✅ GOOD - Environment variables
const token = process.env.GRAPHQL_API_TOKEN
if (!token) throw new Error('Missing GRAPHQL_API_TOKEN')

const client = new GraphQLClient(process.env.GRAPHQL_ENDPOINT, {
  headers: { authorization: `Bearer ${token}` }
})
```

### Implement Rate Limiting

```typescript
class RateLimitedClient {
  private lastRequest = 0
  private requestsPerSecond = 100

  async request(query: string, variables?: any) {
    const now = Date.now()
    const timeSinceLastRequest = now - this.lastRequest

    if (timeSinceLastRequest < 1000 / this.requestsPerSecond) {
      const delay = 1000 / this.requestsPerSecond - timeSinceLastRequest
      await new Promise(resolve => setTimeout(resolve, delay))
    }

    this.lastRequest = Date.now()
    return this.client.request(query, variables)
  }
}
```

---

## TypeScript Patterns

### Use Generics for Type Safety

```typescript
interface User {
  id: string
  name: string
  email: string
}

interface GetUserResponse {
  user: User
}

const query = gql`
  query GetUser($id: ID!) {
    user(id: $id) {
      id
      name
      email
    }
  }
`

const user = await client.request<GetUserResponse>(query, { id: '123' })

// Fully typed!
user.user.name  // ✅ Type-safe
```

### Use TypedDocumentNode

```typescript
import { gql } from 'graphql-request'
import { TypedDocumentNode } from '@graphql-typed-document-node/core'

const GetUserDocument: TypedDocumentNode<GetUserResponse, { id: string }> = gql`
  query GetUser($id: ID!) {
    user(id: $id) { id name email }
  }
`

// Variables are type-checked
const data = await client.request(GetUserDocument, { id: '123' })
```

### Generate Types from Schema

```typescript
// Use codegen to generate types from GraphQL schema
// npm install -D @graphql-codegen/cli @graphql-codegen/typescript

// codegen.ts
import type { CodegenConfig } from '@graphql-codegen/cli'

const config: CodegenConfig = {
  schema: 'https://api.example.com/graphql',
  documents: ['src/**/*.tsx', 'src/**/*.ts'],
  generates: {
    './src/generated/graphql.ts': {
      plugins: ['typescript', 'typescript-operations']
    }
  }
}

export default config
```

Then use generated types:

```typescript
import { GetUserDocument, GetUserQuery } from '@/generated/graphql'

const data = await client.request<GetUserQuery>(GetUserDocument, { id: '123' })
```

---

## Testing Strategies

### Mock Fetch for Tests

```typescript
import { GraphQLClient } from 'graphql-request'

describe('User API', () => {
  it('should fetch user', async () => {
    const mockFetch = vi.fn()
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        data: {
          user: { id: '123', name: 'John' }
        }
      })
    })

    const client = new GraphQLClient('https://api.example.com/graphql', {
      fetch: mockFetch as any
    })

    const data = await client.request(query)

    expect(mockFetch).toHaveBeenCalledWith(
      'https://api.example.com/graphql',
      expect.any(Object)
    )
    expect(data.user.name).toBe('John')
  })
})
```

### Use Fixtures for Test Data

```typescript
// fixtures/users.ts
export const mockUsers = {
  john: { id: '123', name: 'John', email: 'john@example.com' },
  jane: { id: '456', name: 'Jane', email: 'jane@example.com' }
}

// __tests__/getUser.test.ts
import { mockUsers } from '../fixtures/users'

describe('getUser', () => {
  it('should return user data', async () => {
    const user = await getUser(mockUsers.john.id)
    expect(user.name).toBe(mockUsers.john.name)
  })
})
```

### Test Error Scenarios

```typescript
describe('Error handling', () => {
  it('should handle auth errors', async () => {
    const client = new GraphQLClient(endpoint, {
      errorPolicy: 'all'
    })

    const { data, errors } = await client.rawRequest(query)

    if (errors?.some(e => e.extensions?.code === 'UNAUTHENTICATED')) {
      // Handle auth error
      redirectToLogin()
    }

    expect(errors).toBeDefined()
  })

  it('should retry on failure', async () => {
    let attempts = 0

    const mockFetch = vi.fn(async () => {
      attempts++
      if (attempts < 2) {
        throw new Error('Network error')
      }
      return { ok: true, json: async () => ({ data: {} }) }
    })

    const data = await requestWithRetry(query)
    expect(attempts).toBe(2)
  })
})
```

---

## Error Recovery

### Implement Circuit Breaker

```typescript
class CircuitBreakerClient {
  private failures = 0
  private successThreshold = 0
  private isOpen = false

  async request(query: string, variables?: any) {
    if (this.isOpen) {
      throw new Error('Circuit breaker is open - service unavailable')
    }

    try {
      const data = await this.client.request(query, variables)
      this.recordSuccess()
      return data
    } catch (error) {
      this.recordFailure()
      if (this.failures > 5) {
        this.isOpen = true
        setTimeout(() => {
          this.isOpen = false
          this.failures = 0
        }, 60000)
      }
      throw error
    }
  }

  private recordSuccess() {
    this.failures = 0
  }

  private recordFailure() {
    this.failures++
  }
}
```

---

## Code Organization

### Separate Client Configuration

```typescript
// lib/graphql-client.ts
import { GraphQLClient } from 'graphql-request'

export const client = new GraphQLClient(
  process.env.GRAPHQL_ENDPOINT,
  {
    headers: {
      authorization: () => `Bearer ${getToken()}`
    },
    errorPolicy: 'all'
  }
)
```

### Organize by Domain

```typescript
src/
├── graphql/
│   ├── queries/
│   │   ├── user.ts
│   │   ├── posts.ts
│   │   └── comments.ts
│   ├── mutations/
│   │   ├── createUser.ts
│   │   ├── updatePost.ts
│   │   └── deleteComment.ts
│   └── client.ts
├── features/
│   ├── users/
│   │   ├── getUser.ts
│   │   └── updateUser.ts
│   └── posts/
│       ├── getPosts.ts
│       └── createPost.ts
```

---

## Monitoring & Logging

### Log GraphQL Operations

```typescript
const client = new GraphQLClient(endpoint, {
  fetch: async (url, options) => {
    const body = JSON.parse(options.body as string)

    logger.info('GraphQL Request', {
      operation: body.operationName,
      variables: body.variables
    })

    const startTime = Date.now()
    const response = await fetch(url, options)
    const duration = Date.now() - startTime

    logger.info('GraphQL Response', {
      operation: body.operationName,
      duration,
      status: response.status
    })

    return response
  }
})
```

---

## Common Pitfalls

### ❌ Not Handling Errors

```typescript
// BAD
const data = await client.request(query)

// GOOD
try {
  const data = await client.request(query)
} catch (error) {
  console.error('Request failed:', error)
  // Handle error
}
```

### ❌ Creating Client per Request

```typescript
// BAD - Performance hit
async function getData() {
  const client = new GraphQLClient(endpoint)  // New instance!
  return client.request(query)
}

// GOOD - Reuse client
const client = new GraphQLClient(endpoint)
async function getData() {
  return client.request(query)
}
```

### ❌ Ignoring Performance

```typescript
// BAD - Over-fetching
const query = gql`{ user { id name email bio posts { id title } } }`

// GOOD - Fetch only needed fields
const query = gql`{ user { id name } }`
```

---

## Cross-References

- **Configuration:** [06-api-config.md](./06-api-config.md) - Security options
- **Authentication:** [05-api-auth.md](./05-api-auth.md) - Auth best practices
- **Error Handling:** [08-guide-errors.md](./08-guide-errors.md) - Error strategies
- **Patterns:** [07-guide-workflows.md](./07-guide-workflows.md) - Real examples

---

**Source:** [github.com/jasonkuhrt/graphql-request](https://github.com/jasonkuhrt/graphql-request)  
**Package:** graphql-request 7.4.0  
**Last Updated:** February 2026