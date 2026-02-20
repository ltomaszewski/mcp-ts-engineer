# API Reference: GraphQL Client

**Source:** [github.com/jasonkuhrt/graphql-request](https://github.com/jasonkuhrt/graphql-request)
**Package:** graphql-request 7.4.0
**Status:** Complete API reference

---

## Table of Contents

1. [Overview](#overview)
2. [Static request() Function](#static-request-function)
3. [GraphQLClient Class](#graphqlclient-class)
4. [Constructor](#constructor)
5. [Instance Methods](#instance-methods)
6. [When to Use Each](#when-to-use-each)
7. [Real-World Examples](#real-world-examples)

---

## Overview

graphql-request provides **two complementary APIs** for making GraphQL requests. See [02-core-concepts.md](./02-core-concepts.md) for conceptual background.

| Approach | Use Case | Complexity |
|----------|----------|-----------|
| **Static function** | Single requests, scripts | Minimal |
| **Client class** | Multiple requests, apps | Low |

Both are fully featured and recommended. Choose based on your use pattern.

---

## Static request() Function

### Simplest API for one-off requests

#### Signature

```typescript
async function request<T = any>(
  url: string,
  document: string | DocumentNode,
  variables?: Variables,
  headers?: HeadersObject
): Promise<T>
```

#### Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `url` | `string` | ✅ Yes | GraphQL endpoint URL |
| `document` | `string \| DocumentNode` | ✅ Yes | GraphQL query/mutation |
| `variables` | `object` | ❌ No | Query variables |
| `headers` | `object` | ❌ No | HTTP headers for this request |

#### Returns

- **Type:** `Promise<T>`
- **Resolves:** Data from GraphQL response
- **Rejects:** Error if query fails

#### Basic Example

```typescript
import { request, gql } from 'graphql-request'

const endpoint = 'https://api.spacex.land/graphql/'

const query = gql`
  {
    company {
      name
    }
  }
`

const data = await request(endpoint, query)
console.log(data.company.name)  // "SpaceX"
```

#### With Variables

```typescript
import { request, gql } from 'graphql-request'

const query = gql`
  query GetRocket($id: ID!) {
    rocket(id: $id) {
      name
      type
    }
  }
`

const data = await request(
  'https://api.spacex.land/graphql/',
  query,
  { id: 'falcon9' }
)

console.log(data.rocket.name)  // "Falcon 9"
```

#### With Headers

```typescript
import { request, gql } from 'graphql-request'

const query = gql`{ me { name } }`

const data = await request(
  'https://api.example.com/graphql',
  query,
  undefined,  // No variables
  {
    authorization: 'Bearer YOUR_TOKEN'
  }
)
```

#### Type Safety

```typescript
import { request, gql } from 'graphql-request'

interface CompanyResponse {
  company: {
    name: string
    founder: string
  }
}

const query = gql`
  {
    company {
      name
      founder
    }
  }
`

const data = await request<CompanyResponse>(
  'https://api.spacex.land/graphql/',
  query
)

// data is typed as CompanyResponse
console.log(data.company.founder)  // Type-safe!
```

---

## GraphQLClient Class

### Reusable client for applications

#### Constructor Signature

```typescript
new GraphQLClient(
  url: string,
  config?: ClientConfig
)
```

#### Constructor Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `url` | `string` | ✅ Yes | GraphQL endpoint URL |
| `config` | `ClientConfig` | ❌ No | Configuration object |

#### Configuration Object

```typescript
interface ClientConfig {
  headers?: HeadersConfig                    // HTTP headers
  errorPolicy?: 'none' | 'ignore' | 'all'   // Error handling
  method?: 'POST' | 'GET'                   // HTTP method
  fetch?: RequestInit                       // Fetch API options
  excludeOperationName?: boolean             // Optimization
}
```

---

## Constructor

### Basic Constructor

```typescript
import { GraphQLClient } from 'graphql-request'

const client = new GraphQLClient('https://api.spacex.land/graphql/')
```

### With Configuration

```typescript
import { GraphQLClient } from 'graphql-request'

const client = new GraphQLClient('https://api.spacex.land/graphql/', {
  headers: {
    authorization: 'Bearer YOUR_TOKEN'
  },
  errorPolicy: 'all'
})
```

### Full Configuration Example

```typescript
import { GraphQLClient } from 'graphql-request'

const client = new GraphQLClient('https://api.example.com/graphql', {
  // Static headers applied to all requests
  headers: {
    authorization: 'Bearer YOUR_TOKEN',
    'x-custom-header': 'value'
  },

  // Error handling strategy
  errorPolicy: 'all',  // Return data + errors instead of throwing

  // HTTP method
  method: 'POST',      // Default is POST

  // Fetch API options
  fetch: {
    credentials: 'include',  // Send cookies
    mode: 'cors'             // CORS mode
  },

  // Performance optimization
  excludeOperationName: false  // Extract operation name
})
```

### Dynamic Headers in Constructor

```typescript
import { GraphQLClient } from 'graphql-request'

const getToken = () => {
  // Get token from storage, auth service, etc
  return localStorage.getItem('token')
}

const client = new GraphQLClient('https://api.example.com/graphql', {
  headers: {
    authorization: () => `Bearer ${getToken()}`  // Function evaluated per request
  }
})
```

---

## Instance Methods

### request() Method

Make a request and get data (or error thrown):

```typescript
async request<T = any>(
  document: string | DocumentNode,
  variables?: Variables,
  requestHeaders?: HeadersObject
): Promise<T>
```

#### Parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| `document` | `DocumentNode \| string` | GraphQL query/mutation |
| `variables` | `object` | Query variables |
| `requestHeaders` | `object` | Headers for this request (override client headers) |

#### Returns

- **Type:** `Promise<T>`
- **Resolves:** Response data from GraphQL
- **Rejects:** GraphQL error (unless errorPolicy configured otherwise)

#### Example

```typescript
import { GraphQLClient, gql } from 'graphql-request'

const client = new GraphQLClient('https://api.spacex.land/graphql/')

const query = gql`
  query GetCompany {
    company {
      name
      ceo
    }
  }
`

const data = await client.request(query)
console.log(data.company.name)
```

### rawRequest() Method

Get full response including extensions and headers:

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

#### Returns Full Response Object

```typescript
interface RawResponse<T> {
  data: T | undefined           // Response data
  errors: GraphQLError[] | undefined  // GraphQL errors
  extensions?: any               // Extensions (cache hints, etc)
  headers: Headers               // HTTP headers
  status: number                 // HTTP status code
}
```

#### Example

```typescript
import { GraphQLClient, gql } from 'graphql-request'

const client = new GraphQLClient('https://api.example.com/graphql', {
  errorPolicy: 'all'  // Required to get errors without throwing
})

const query = gql`{ user { id name } }`

const response = await client.rawRequest(query)

if (response.errors) {
  console.error('GraphQL Errors:', response.errors)
}

if (response.data) {
  console.log('Data:', response.data)
}

console.log('Status:', response.status)
console.log('Headers:', response.headers)
```

### setHeader() Method

Update a single header after client creation:

```typescript
setHeader(key: string, value: string): void
```

#### Example

```typescript
import { GraphQLClient } from 'graphql-request'

const client = new GraphQLClient('https://api.example.com/graphql')

// Set initial header
client.setHeader('authorization', 'Bearer TOKEN_1')

// Later, update it
client.setHeader('authorization', 'Bearer TOKEN_2')

// Request uses new header
await client.request(query)
```

### setHeaders() Method

Replace all headers:

```typescript
setHeaders(headers: HeadersObject): void
```

#### Example

```typescript
import { GraphQLClient } from 'graphql-request'

const client = new GraphQLClient('https://api.example.com/graphql')

// Set multiple headers
client.setHeaders({
  authorization: 'Bearer TOKEN',
  'x-custom-header': 'value'
})

// Or update entire header object
client.setHeaders({
  'content-type': 'application/json',
  'x-request-id': 'req-123'
})
```

---

## When to Use Each

### Use Static request() When:

✅ One-time requests
✅ Scripts or CLI tools
✅ Lambda/serverless functions
✅ Different endpoints per request
✅ No shared configuration

```typescript
import { request, gql } from 'graphql-request'

// Script
const data = await request('https://api1.com/graphql', query1)
const data2 = await request('https://api2.com/graphql', query2)
```

### Use GraphQLClient When:

✅ Multiple requests in same app
✅ Shared authentication
✅ Consistent configuration
✅ Single endpoint
✅ Need to update headers dynamically

```typescript
import { GraphQLClient, gql } from 'graphql-request'

// Application
const client = new GraphQLClient('https://api.example.com/graphql', {
  headers: { authorization: 'Bearer TOKEN' }
})

const users = await client.request(usersQuery)
const posts = await client.request(postsQuery)
```

---

## Real-World Examples

### Example 1: Simple Query

```typescript
import { GraphQLClient, gql } from 'graphql-request'

const client = new GraphQLClient('https://api.github.com/graphql', {
  headers: {
    authorization: 'Bearer YOUR_GITHUB_TOKEN'
  }
})

const query = gql`
  query {
    viewer {
      name
      repositories(first: 5) {
        nodes {
          name
          description
        }
      }
    }
  }
`

const data = await client.request(query)
console.log(`Hi ${data.viewer.name}!`)
```

### Example 2: Query with Variables

```typescript
import { GraphQLClient, gql } from 'graphql-request'

const client = new GraphQLClient('https://api.example.com/graphql')

const query = gql`
  query GetUserPosts($userId: ID!, $limit: Int!) {
    user(id: $userId) {
      name
      posts(limit: $limit) {
        id
        title
        content
      }
    }
  }
`

const data = await client.request(query, {
  userId: '123',
  limit: 10
})

console.log(data.user.posts)
```

### Example 3: Mutation

```typescript
import { GraphQLClient, gql } from 'graphql-request'

const client = new GraphQLClient('https://api.example.com/graphql', {
  headers: { authorization: 'Bearer TOKEN' }
})

const mutation = gql`
  mutation CreatePost($title: String!, $content: String!) {
    createPost(input: { title: $title, content: $content }) {
      id
      title
      createdAt
    }
  }
`

const newPost = await client.request(mutation, {
  title: 'My First Post',
  content: 'Hello world!'
})

console.log(`Post created with ID: ${newPost.createPost.id}`)
```

### Example 4: Error Handling

```typescript
import { GraphQLClient, gql } from 'graphql-request'

const client = new GraphQLClient('https://api.example.com/graphql', {
  errorPolicy: 'all'  // Get errors without throwing
})

const query = gql`{ user { id name } }`

const { data, errors } = await client.rawRequest(query)

if (errors) {
  errors.forEach(error => {
    console.error(`Error: ${error.message}`)
  })
}

if (data) {
  console.log('User:', data.user)
}
```

### Example 5: Dynamic Headers

```typescript
import { GraphQLClient, gql } from 'graphql-request'

const getAuthToken = () => {
  // Get from storage, context, etc
  return localStorage.getItem('auth_token')
}

const client = new GraphQLClient('https://api.example.com/graphql', {
  headers: {
    authorization: () => `Bearer ${getAuthToken()}`
  }
})

// Authorization updated automatically on each request
const data = await client.request(query)
```

### Example 6: Reusable Client in Module

```typescript
// lib/graphql-client.ts
import { GraphQLClient } from 'graphql-request'

const endpoint = process.env.GRAPHQL_ENDPOINT || 'https://api.example.com/graphql'

export const client = new GraphQLClient(endpoint, {
  headers: {
    authorization: `Bearer ${process.env.GRAPHQL_TOKEN}`
  }
})
```

```typescript
// features/users/getUser.ts
import { gql } from 'graphql-request'
import { client } from '@/lib/graphql-client'

const query = gql`
  query GetUser($id: ID!) {
    user(id: $id) {
      id
      name
      email
    }
  }
`

export async function getUser(id: string) {
  return client.request(query, { id })
}
```

```typescript
// pages/users/[id].ts
import { getUser } from '@/features/users/getUser'

export async function getServerSideProps(context) {
  const { id } = context.params
  const user = await getUser(id)
  return { props: { user } }
}
```

---

## Cross-References

- **Setup:** [01-setup-installation.md](./01-setup-installation.md) - Installation guide
- **Core Concepts:** [02-core-concepts.md](./02-core-concepts.md) - Static vs. class API decision
- **Methods:** [04-api-methods.md](./04-api-methods.md) - Detailed method reference
- **Configuration:** [06-api-config.md](./06-api-config.md) - All config options
- **Authentication:** [05-api-auth.md](./05-api-auth.md) - Header and auth patterns
- **Patterns:** [07-guide-workflows.md](./07-guide-workflows.md) - Real-world workflows

---

**Source:** [github.com/jasonkuhrt/graphql-request](https://github.com/jasonkuhrt/graphql-request)
**Package:** graphql-request 7.4.0
**Last Updated:** December 2025
