# GraphQL Request - Quick Reference

> A lightweight, zero-dependency GraphQL client with full TypeScript support and minimal footprint.

**Package:** `graphql-request@7.4.0`
**Source:** [github.com/jasonkuhrt/graphql-request](https://github.com/jasonkuhrt/graphql-request)
**Docs:** [github.com/jasonkuhrt/graphql-request](https://github.com/jasonkuhrt/graphql-request)

---

## Installation

```bash
npm install graphql-request graphql
```

Both packages required:
- **graphql-request** — The client library
- **graphql** — Peer dependency for types and utilities

---

## Quick Start

### Simple One-Off Request

```typescript
import { request, gql } from 'graphql-request'

const data = await request(
  'https://api.example.com/graphql',
  gql`{ user { id name } }`
)
```

### Reusable Client (Recommended)

```typescript
import { GraphQLClient, gql } from 'graphql-request'

const client = new GraphQLClient('https://api.example.com/graphql', {
  headers: { authorization: 'Bearer TOKEN' }
})

const data = await client.request(gql`{ user { id name } }`)
```

---

## Two API Styles

| Style | Use When | Complexity |
|-------|----------|-----------|
| **Static `request()`** | One-off requests, scripts | Minimal |
| **`GraphQLClient` class** | Multiple requests, apps | Low |

**See [02-core-concepts.md](./02-core-concepts.md) for decision guide.**

---

## Core Methods

### `client.request(query, variables?, headers?)`
Make a request, returns data or throws error.

```typescript
const data = await client.request(query, { id: '123' })
```

### `client.rawRequest(query, variables?, headers?)`
Get full response with status, headers, errors.

```typescript
const { data, errors, status, headers } = await client.rawRequest(query)
```

### `client.setHeader(key, value)`
Update single header after client creation.

```typescript
client.setHeader('authorization', 'Bearer NEW_TOKEN')
```

### `client.setHeaders(headers)`
Replace all headers.

```typescript
client.setHeaders({ authorization: 'Bearer TOKEN' })
```

---

## Common Patterns

### With Variables

```typescript
const query = gql`
  query GetUser($id: ID!) {
    user(id: $id) { name email }
  }
`

const data = await client.request(query, { id: '123' })
```

### With Authentication

```typescript
const client = new GraphQLClient(endpoint, {
  headers: { authorization: 'Bearer YOUR_TOKEN' }
})
```

### With Error Handling

```typescript
try {
  const data = await client.request(query)
} catch (error) {
  console.error('Request failed:', error)
}
```

### Type Safety

```typescript
interface UserResponse {
  user: { id: string; name: string }
}

const data = await client.request<UserResponse>(query)
// data is typed as UserResponse
```

---

## Module Guide

This knowledge base is organized into focused modules:

### Getting Started
- **[01-setup-installation.md](./01-setup-installation.md)** — Installation, TypeScript config, troubleshooting
- **[02-core-concepts.md](./02-core-concepts.md)** — Static function vs. GraphQLClient, design philosophy

### API Reference
- **[03-api-client.md](./03-api-client.md)** — GraphQLClient class, constructor, methods
- **[04-api-methods.md](./04-api-methods.md)** — request(), rawRequest(), setHeader(), setHeaders()
- **[05-api-auth.md](./05-api-auth.md)** — Authentication patterns, headers, tokens
- **[06-api-config.md](./06-api-config.md)** — Configuration options, error policies, fetch settings

### Practical Guides
- **[07-guide-workflows.md](./07-guide-workflows.md)** — Queries, mutations, variables, batching, uploads
- **[08-guide-errors.md](./08-guide-errors.md)** — Error types, handling, recovery strategies
- **[09-best-practices.md](./09-best-practices.md)** — Performance, security, TypeScript, testing

### Evaluation
- **[10-comparison-clients.md](./10-comparison-clients.md)** — vs. Apollo, URQL, graphql-codegen

---

## Quick Lookup

### "How do I...?"

| Question | Module |
|----------|--------|
| Install graphql-request? | [01-setup-installation.md](./01-setup-installation.md) |
| Choose static vs. class API? | [02-core-concepts.md](./02-core-concepts.md) |
| Make a request? | [03-api-client.md](./03-api-client.md) or [07-guide-workflows.md](./07-guide-workflows.md) |
| Add authentication? | [05-api-auth.md](./05-api-auth.md) |
| Handle errors? | [08-guide-errors.md](./08-guide-errors.md) |
| Optimize performance? | [09-best-practices.md](./09-best-practices.md) |
| Handle variables? | [07-guide-workflows.md](./07-guide-workflows.md) |
| Customize configuration? | [06-api-config.md](./06-api-config.md) |

---

## Best Practices Summary

✅ **DO:**
- Use variables instead of string interpolation
- Create one client instance, reuse it
- Use TypeScript for type safety
- Handle errors explicitly
- Fetch only fields you need

❌ **DON'T:**
- Interpolate variables into queries
- Create new clients per request
- Ignore GraphQL errors
- Over-fetch unnecessary data

---

## Common Questions

### Q: Static `request()` or `GraphQLClient` class?

**Use static `request()`** for scripts and one-off requests. **Use `GraphQLClient`** for apps with multiple requests.

See [02-core-concepts.md](./02-core-concepts.md) for detailed comparison.

### Q: How do I authenticate requests?

Set headers in the constructor:

```typescript
const client = new GraphQLClient(endpoint, {
  headers: { authorization: 'Bearer YOUR_TOKEN' }
})
```

Or update dynamically:

```typescript
client.setHeader('authorization', `Bearer ${newToken}`)
```

See [05-api-auth.md](./05-api-auth.md) for patterns.

### Q: How do I handle errors?

By default, errors throw. Use `errorPolicy: 'all'` to get errors without throwing:

```typescript
const client = new GraphQLClient(endpoint, {
  errorPolicy: 'all'
})

const { data, errors } = await client.rawRequest(query)
```

See [08-guide-errors.md](./08-guide-errors.md) for strategies.

### Q: Can I use with React?

Yes! Use with React Query, SWR, or custom hooks. graphql-request is fetch-agnostic.

See [07-guide-workflows.md](./07-guide-workflows.md) for patterns.

### Q: TypeScript support?

Full support. Use `request<TypeName>(query)` for type inference.

See [01-setup-installation.md](./01-setup-installation.md) for setup.

---

## Minimal Configuration

```typescript
import { GraphQLClient, gql } from 'graphql-request'

// Create once at app startup
export const client = new GraphQLClient(
  process.env.GRAPHQL_ENDPOINT,
  {
    headers: {
      authorization: `Bearer ${process.env.GRAPHQL_TOKEN}`
    }
  }
)

// Use throughout app
const data = await client.request(query)
```

---

## Need Help?

1. **Installation issues?** → [01-setup-installation.md](./01-setup-installation.md#troubleshooting)
2. **API questions?** → See specific module (03-06)
3. **Real-world examples?** → [07-guide-workflows.md](./07-guide-workflows.md)
4. **Performance?** → [09-best-practices.md](./09-best-practices.md)
5. **Errors?** → [08-guide-errors.md](./08-guide-errors.md)

---

## Master Index

For complete navigation and module dependencies, see **[00-master-index.md](./00-master-index.md)**.

---

**Last Updated:** December 2025
**Status:** Complete modular knowledge base
**Package:** graphql-request 7.4.0
**TypeScript:** 4.5+
