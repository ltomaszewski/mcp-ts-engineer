# 07-guide-workflows.md
## Practical Patterns & Real-World Workflows

**Source:** [github.com/jasonkuhrt/graphql-request](https://github.com/jasonkuhrt/graphql-request) /examples  
**Package:** graphql-request 7.4.0  
**Status:** Complete pattern reference

---

## Table of Contents

1. [Simple Queries](#simple-queries)
2. [Mutations](#mutations)
3. [Queries with Variables](#queries-with-variables)
4. [Batching Requests](#batching-requests)
5. [Request Cancellation](#request-cancellation)
6. [Per-Request Headers](#per-request-headers)
7. [Error Handling Patterns](#error-handling-patterns)
8. [Middleware Patterns](#middleware-patterns)
9. [File Uploads](#file-uploads)

---

## Simple Queries

### Basic Query

```typescript
import { request, gql } from 'graphql-request'

const endpoint = 'https://api.spacex.land/graphql/'

const query = gql`
  {
    company {
      name
      founder
      year_founded
    }
  }
`

const data = await request(endpoint, query)
console.log(data.company.name)  // "SpaceX"
```

### With Client Instance

```typescript
import { GraphQLClient, gql } from 'graphql-request'

const client = new GraphQLClient('https://api.spacex.land/graphql/')

const query = gql`
  {
    rockets(limit: 3) {
      id
      name
      type
    }
  }
`

const data = await client.request(query)
console.log(data.rockets)
```

---

## Mutations

### Simple Mutation

```typescript
import { GraphQLClient, gql } from 'graphql-request'

const client = new GraphQLClient('https://api.example.com/graphql', {
  headers: {
    authorization: 'Bearer TOKEN'
  }
})

const mutation = gql`
  mutation CreatePost($title: String!, $content: String!) {
    createPost(input: { title: $title, content: $content }) {
      id
      title
      content
      createdAt
    }
  }
`

const newPost = await client.request(mutation, {
  title: 'Hello GraphQL',
  content: 'GraphQL is awesome!'
})

console.log(`Created post: ${newPost.createPost.id}`)
```

### Update Mutation

```typescript
const updateMutation = gql`
  mutation UpdateUser($id: ID!, $name: String!) {
    updateUser(id: $id, input: { name: $name }) {
      id
      name
      email
    }
  }
`

const updated = await client.request(updateMutation, {
  id: '123',
  name: 'John Doe'
})
```

### Delete Mutation

```typescript
const deleteMutation = gql`
  mutation DeletePost($id: ID!) {
    deletePost(id: $id) {
      id
      title
    }
  }
`

const deleted = await client.request(deleteMutation, {
  id: 'post-456'
})

console.log(`Deleted: ${deleted.deletePost.title}`)
```

---

## Queries with Variables

### Named Query

```typescript
const query = gql`
  query GetUser($id: ID!) {
    user(id: $id) {
      id
      name
      email
      posts(limit: 5) {
        id
        title
      }
    }
  }
`

const user = await client.request(query, {
  id: '123'
})
```

### Multiple Variables

```typescript
const query = gql`
  query GetUsers($limit: Int!, $offset: Int!, $active: Boolean!) {
    users(limit: $limit, offset: $offset, active: $active) {
      id
      name
      email
    }
  }
`

const data = await client.request(query, {
  limit: 10,
  offset: 0,
  active: true
})
```

### Complex Variables

```typescript
const mutation = gql`
  mutation CreateOrder($input: CreateOrderInput!) {
    createOrder(input: $input) {
      id
      items {
        product
        quantity
      }
      total
    }
  }
`

const order = await client.request(mutation, {
  input: {
    userId: '123',
    items: [
      { productId: 'prod-1', quantity: 2 },
      { productId: 'prod-2', quantity: 1 }
    ],
    shippingAddress: {
      street: '123 Main St',
      city: 'New York',
      zip: '10001'
    }
  }
})
```

---

## Batching Requests

### Parallel Requests

```typescript
const query1 = gql`{ users { id name } }`
const query2 = gql`{ posts { id title } }`
const query3 = gql`{ comments { id content } }`

// Fetch all in parallel
const [users, posts, comments] = await Promise.all([
  client.request(query1),
  client.request(query2),
  client.request(query3)
])

console.log(`${users.users.length} users`)
console.log(`${posts.posts.length} posts`)
console.log(`${comments.comments.length} comments`)
```

### Sequential Requests (Dependent)

```typescript
// First request
const user = await client.request(getUserQuery, { id: '123' })

// Use result in second request
const posts = await client.request(getPostsQuery, {
  userId: user.user.id
})

// Use results in third request
const comments = await client.request(getCommentsQuery, {
  postIds: posts.posts.map(p => p.id)
})
```

### Batch with Error Handling

```typescript
const results = await Promise.allSettled([
  client.request(query1),
  client.request(query2),
  client.request(query3)
])

results.forEach((result, index) => {
  if (result.status === 'fulfilled') {
    console.log(`Query ${index + 1}: Success`, result.value)
  } else {
    console.log(`Query ${index + 1}: Failed`, result.reason)
  }
})
```

---

## Request Cancellation

### Abort Controller

```typescript
import { GraphQLClient, gql } from 'graphql-request'

const client = new GraphQLClient(endpoint)

const query = gql`
  {
    expensiveQuery {
      data
    }
  }
`

const controller = new AbortController()

// Cancel after 5 seconds
const timeoutId = setTimeout(() => controller.abort(), 5000)

try {
  const data = await client.request(query, undefined, {
    signal: controller.signal
  })
  console.log(data)
} catch (error) {
  if (error.name === 'AbortError') {
    console.log('Request was cancelled')
  }
} finally {
  clearTimeout(timeoutId)
}
```

### User-Triggered Cancellation

```typescript
let controller: AbortController | null = null

async function startSearch(query: string) {
  // Cancel previous search
  controller?.abort()

  // Start new search
  controller = new AbortController()

  const results = await client.request(searchQuery, { q: query }, {
    signal: controller.signal
  })

  return results
}

// User types, cancel previous search
document.querySelector('input').addEventListener('input', (e) => {
  startSearch(e.target.value)
})
```

---

## Per-Request Headers

### Override Header

```typescript
const client = new GraphQLClient(endpoint, {
  headers: {
    authorization: 'Bearer default_token'
  }
})

// Use different token
const data = await client.request(query, undefined, {
  authorization: 'Bearer special_token'
})
```

### Add Custom Header

```typescript
const data = await client.request(query, undefined, {
  'x-request-id': generateId(),
  'x-correlation-id': correlationId,
  'x-timeout': '30000'
})
```

---

## Error Handling Patterns

### Try-Catch

```typescript
try {
  const data = await client.request(query)
  console.log(data)
} catch (error) {
  console.error('GraphQL Error:', error.message)
  // Handle error
}
```

### With Partial Data

```typescript
const client = new GraphQLClient(endpoint, {
  errorPolicy: 'all'
})

const { data, errors } = await client.rawRequest(query)

if (errors) {
  errors.forEach(e => console.error(`Error: ${e.message}`))
}

if (data?.user) {
  renderUser(data.user)
}

if (data?.posts) {
  renderPosts(data.posts)
}
```

### Retry on Failure

```typescript
async function requestWithRetry(
  query: string,
  variables?: any,
  maxRetries = 3
) {
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await client.request(query, variables)
    } catch (error) {
      if (i === maxRetries - 1) throw error
      const delay = Math.pow(2, i) * 1000
      await new Promise(resolve => setTimeout(resolve, delay))
    }
  }
}

const data = await requestWithRetry(query)
```

---

## Middleware Patterns

### Logging Middleware

```typescript
const client = new GraphQLClient(endpoint, {
  fetch: async (url, options) => {
    const start = Date.now()
    console.log('→ Request:', options.body)

    const response = await fetch(url, options)
    const duration = Date.now() - start

    console.log(`← Response (${duration}ms):`, response.status)
    return response
  }
})
```

### Performance Monitoring

```typescript
const client = new GraphQLClient(endpoint, {
  fetch: async (url, options) => {
    const start = performance.now()
    const response = await fetch(url, options)
    const duration = performance.now() - start

    // Send to analytics
    analytics.track('graphql_request', {
      duration,
      status: response.status
    })

    return response
  }
})
```

---

## File Uploads

### Browser File Upload

```typescript
import { request, gql } from 'graphql-request'

const mutation = gql`
  mutation UploadAvatar($file: Upload!) {
    uploadAvatar(file: $file) {
      id
      url
    }
  }
`

const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement

const file = fileInput.files?.[0]

const result = await request('/api/graphql', mutation, {
  file: file
})
```

### Node.js File Upload

```typescript
import { request, gql } from 'graphql-request'
import { createReadStream } from 'fs'

const mutation = gql`
  mutation UploadDocument($file: Upload!) {
    uploadDocument(file: $file) {
      id
      name
      size
    }
  }
`

const result = await request('/api/graphql', mutation, {
  file: createReadStream('./document.pdf')
})
```

---

## Cross-References

- **Client:** [03-api-client.md](./03-api-client.md) - GraphQLClient overview
- **Methods:** [04-api-methods.md](./04-api-methods.md) - request(), rawRequest()
- **Configuration:** [06-api-config.md](./06-api-config.md) - Client options
- **Authentication:** [05-api-auth.md](./05-api-auth.md) - Auth patterns
- **Error Handling:** [08-guide-errors.md](./08-guide-errors.md) - Error policies
- **Best Practices:** [09-best-practices.md](./09-best-practices.md) - Production patterns

---

**Source:** [github.com/jasonkuhrt/graphql-request](https://github.com/jasonkuhrt/graphql-request)  
**Package:** graphql-request 7.4.0  
**Last Updated:** December 27, 2025