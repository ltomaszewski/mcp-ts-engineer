# comparison-clients.md
## Comparing graphql-request with Other Clients

**Source:** [github.com/graffle-js/graffle](https://github.com/graffle-js/graffle) FAQ  
**Package:** graphql-request 7.4.0  
**Status:** Framework comparison guide

---

## Table of Contents

1. [graphql-request Overview](#graphql-request-overview)
2. [vs Apollo Client](#vs-apollo-client)
3. [vs Relay](#vs-relay)
4. [vs Other Clients](#vs-other-clients)
5. [Decision Matrix](#decision-matrix)
6. [Migration Guides](#migration-guides)

---

## graphql-request Overview

### Philosophy

**Minimalist GraphQL client for JavaScript.**

- ✅ **Simple** - Smallest possible API
- ✅ **Lightweight** - ~5KB minified
- ✅ **Unopinionated** - Works with any framework
- ✅ **Framework agnostic** - Node, browsers, serverless
- ✅ **No magic** - Explicit, predictable behavior

### Best For

- Small scripts and CLIs
- Simple applications
- Server-side rendering
- API gateways
- Microservices
- Learning GraphQL basics

### Not Best For

- Large, complex applications
- Need built-in caching
- Heavy framework integration
- Offline support required

---

## vs Apollo Client

### Feature Comparison

| Feature | graphql-request | Apollo Client |
|---------|---|---|
| **Bundle Size** | ~5KB | ~250KB |
| **Learning Curve** | Minutes | Days |
| **Caching** | ❌ No | ✅ Yes (advanced) |
| **State Management** | ❌ No | ✅ Yes |
| **DevTools** | ❌ No | ✅ Yes |
| **Subscriptions** | ❌ No | ✅ Yes |
| **React Integration** | ❌ No | ✅ Yes (@apollo/client) |
| **Vue Integration** | ❌ No | ❌ No |
| **Setup Time** | Minutes | Hours |
| **Configuration** | Minimal | Extensive |

### Size Comparison

```
graphql-request: ~5 KB
Apollo Client: ~250 KB
Relay: ~280 KB
```

### Code Example: Simple Query

#### graphql-request

```typescript
import { GraphQLClient, gql } from 'graphql-request'

const client = new GraphQLClient('https://api.example.com/graphql', {
  headers: { authorization: 'Bearer TOKEN' }
})

const query = gql`{ user { id name } }`
const data = await client.request(query)
```

#### Apollo Client

```typescript
import { ApolloClient, InMemoryCache, HttpLink, gql } from '@apollo/client'

const client = new ApolloClient({
  link: new HttpLink({
    uri: 'https://api.example.com/graphql',
    headers: { authorization: 'Bearer TOKEN' }
  }),
  cache: new InMemoryCache()
})

const query = gql`{ user { id name } }`
const { data } = await client.query({ query })
```

### When to Use graphql-request

✅ Don't need caching  
✅ Simple requests  
✅ Minimal bundle size critical  
✅ Quick prototyping  
✅ Serverless functions  

### When to Use Apollo Client

✅ Complex state management  
✅ Advanced caching needed  
✅ DevTools debugging important  
✅ React-specific app  
✅ Enterprise application  

---

## vs Relay

### Feature Comparison

| Feature | graphql-request | Relay |
|---------|---|---|
| **Bundle Size** | ~5KB | ~280KB |
| **Learning Curve** | Minutes | Weeks |
| **React Specific** | ❌ No | ✅ Only React |
| **Caching** | ❌ No | ✅ Yes (normalized) |
| **Pagination** | ❌ No | ✅ Yes (cursors) |
| **Subscriptions** | ❌ No | ✅ Yes |
| **Type Safety** | Manual | Auto-generated |
| **Server Requirements** | None | GraphQL server |
| **Setup Complexity** | Low | Very High |

### When to Use graphql-request

✅ Not using React  
✅ Simple data fetching  
✅ Serverless  
✅ CLI/Scripts  

### When to Use Relay

✅ Large React app  
✅ Complex pagination  
✅ Server implements Relay spec  
✅ Enterprise React project  

---

## vs Other Clients

### urql

```
graphql-request: ~5 KB
urql: ~15 KB
```

**urql** adds:
- Reactive data fetching
- Exchange system
- React hooks (@urql/react)

**graphql-request** advantages:
- Simpler API
- Smaller bundle
- Works everywhere

### tRPC (TypeScript RPC)

```typescript
// tRPC - Not a GraphQL client, but alternative API pattern
import { createTRPCNext } from '@trpc/next'

// More opinionated RPC framework
// Better for monorepos
// Not GraphQL
```

### Fetch API (Native)

```typescript
// Manual implementation
const response = await fetch(endpoint, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ query, variables })
})
const data = await response.json()

// graphql-request wraps this with:
// - Error handling
// - Type safety
// - Convenience methods
// - Header management
```

---

## Decision Matrix

Choose **graphql-request** if:

✅ Bundle size is critical  
✅ Simple, straight-forward queries  
✅ No caching needed  
✅ Not building React-heavy app  
✅ Serverless environment  
✅ Quick prototyping  
✅ Learning GraphQL  

Choose **Apollo Client** if:

✅ Building React application  
✅ Advanced caching important  
✅ Subscriptions needed  
✅ DevTools debugging  
✅ Complex state management  
✅ Enterprise application  

Choose **Relay** if:

✅ Exclusively React  
✅ Server implements Relay spec  
✅ Complex pagination  
✅ Normalized cache essential  
✅ Large enterprise app  

Choose **urql** if:

✅ Want lightweight Apollo alternative  
✅ Need React hooks  
✅ Exchange system useful  

Choose **Fetch API** if:

✅ Minimal dependencies  
✅ Very simple use case  
✅ Custom implementation needed  

---

## Migration Guides

### From Fetch API to graphql-request

```typescript
// Before: Manual fetch
const response = await fetch('https://api.example.com/graphql', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    authorization: 'Bearer TOKEN'
  },
  body: JSON.stringify({
    query: `{ user { id } }`,
    variables: {}
  })
})
const data = await response.json()

// After: graphql-request
import { request, gql } from 'graphql-request'

const query = gql`{ user { id } }`
const data = await request('https://api.example.com/graphql', query)
```

### From Apollo Client to graphql-request

**Only if** you don't need caching or React integration:

```typescript
// Before: Apollo Client
import { ApolloClient, InMemoryCache, HttpLink, gql } from '@apollo/client'

const client = new ApolloClient({
  link: new HttpLink({ uri: 'https://api.example.com/graphql' }),
  cache: new InMemoryCache()
})

const { data } = await client.query({
  query: gql`{ user { id name } }`
})

// After: graphql-request
import { GraphQLClient, gql } from 'graphql-request'

const client = new GraphQLClient('https://api.example.com/graphql')
const data = await client.request(gql`{ user { id name } }`)
```

### From Relay to graphql-request

**Not recommended** - these serve different purposes.

Relay is React-specific with advanced features. If you need those, keep Relay.

If your needs are simpler, you could use graphql-request for basic queries.

---

## Performance Benchmarks

### Bundle Size (minified)

```
graphql-request: 5 KB
urql: 15 KB
Apollo Client: 250 KB
Relay: 280 KB
```

### Time to First Request

```
graphql-request: ~10ms (setup + request)
Apollo Client: ~50ms (setup, cache initialization)
Relay: ~100ms (complex setup)
```

### Network Request Time

All libraries use the same network (fetch API), so request time is identical.

The difference is local processing:

```
graphql-request: Minimal processing
Apollo Client: Cache operations
Relay: Normalized cache operations
```

---

## Use Case Scenarios

### Scenario 1: Simple REST API Migration

**You:** Moving from REST to GraphQL, simple endpoints
**Best choice:** graphql-request

```typescript
import { GraphQLClient, gql } from 'graphql-request'

const client = new GraphQLClient('https://api.example.com/graphql')

async function getUser(id: string) {
  const query = gql`
    query GetUser($id: ID!) {
      user(id: $id) { id name email }
    }
  `
  return client.request(query, { id })
}
```

### Scenario 2: React Dashboard

**You:** Building React dashboard with many queries
**Best choice:** Apollo Client

```typescript
import { useQuery } from '@apollo/client'

function UserProfile() {
  const { data, loading, error } = useQuery(GET_USER_QUERY)
  // Apollo handles caching automatically
}
```

### Scenario 3: CLI Tool

**You:** Building CLI tool
**Best choice:** graphql-request

```typescript
import { request, gql } from 'graphql-request'

const data = await request(endpoint, query)
console.log(data)
```

### Scenario 4: Serverless API

**You:** Lambda function calling GraphQL API
**Best choice:** graphql-request

```typescript
import { GraphQLClient, gql } from 'graphql-request'

export async function handler(event) {
  const client = new GraphQLClient(endpoint)
  return client.request(query)
}
```

---

## Frequently Asked Questions

### Q: Can I use graphql-request with React?

**A:** Yes, absolutely. graphql-request works everywhere, including React. You just won't get automatic caching or React-specific features like `useQuery`.

### Q: Is graphql-request production-ready?

**A:** Yes. It's stable, maintained, and used in production by many companies.

### Q: Can I add caching to graphql-request?

**A:** Yes, build it yourself or use a separate caching library. graphql-request intentionally stays minimal.

### Q: What about subscriptions?

**A:** graphql-request doesn't support subscriptions. It's designed for simple queries and mutations. If you need subscriptions, use Apollo Client or Relay.

### Q: Can I use graphql-request with Vue?

**A:** Yes, graphql-request works with any JavaScript framework. It's just a function, not framework-specific.

### Q: What about TypeScript?

**A:** Full TypeScript support with proper type inference and generic support.

---

## Conclusion

### graphql-request is perfect when:

- You want **simplicity** above all else
- **Bundle size** matters
- You need **quick setup**
- You're **not** building a complex state-managed app
- You want to **learn GraphQL** basics

### Choose alternatives when:

- You need **advanced caching**
- Building **large React** application
- **Subscriptions** are required
- You want **framework-specific** features
- You need **DevTools** and advanced debugging

---

## Resources

- **Graffle Repository:** https://github.com/graffle-js/graffle
- **Apollo Client:** https://www.apollographql.com/docs/
- **Relay:** https://relay.dev/
- **urql:** https://formidable.com/open-source/urql/

---

**Source:** [github.com/graffle-js/graffle](https://github.com/graffle-js/graffle)  
**Package:** graphql-request 7.4.0  
**Last Updated:** December 27, 2025