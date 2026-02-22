---
name: graphql-request
version: "7.4.0"
description: GraphQL Request client - queries, mutations, variables, headers. Use when making GraphQL API calls, handling authentication, or integrating with React Query.
---

# GraphQL Request

> Minimal GraphQL client for making queries and mutations.

**Package:** `graphql-request`

---

## When to Use

**LOAD THIS SKILL** when user is:
- Making GraphQL API requests
- Setting up GraphQL client with authentication
- Integrating GraphQL with React Query
- Handling GraphQL errors
- Typing query responses

---

## Critical Rules

**ALWAYS:**
1. Create a singleton `GraphQLClient` instance — avoid recreating on every request
2. Type your responses with generics — `client.request<ResponseType>(query)`
3. Handle both GraphQL and network errors — different error types
4. Use `gql` template tag — enables syntax highlighting and IDE support

**NEVER:**
1. Hardcode auth tokens in client — use dynamic headers or request-level headers
2. Ignore GraphQL errors in response — check `response.errors` array
3. Create new client per request — causes connection overhead
4. Mix with Apollo Client — pick one GraphQL client per project

---

## Core Patterns

### Client Setup

```typescript
import { GraphQLClient } from 'graphql-request';

// Create singleton client
export const graphqlClient = new GraphQLClient(
  process.env.GRAPHQL_ENDPOINT ?? 'https://api.example.com/graphql',
  {
    headers: {
      'Content-Type': 'application/json',
    },
  }
);

// Update auth header dynamically
export function setAuthToken(token: string) {
  graphqlClient.setHeader('Authorization', `Bearer ${token}`);
}

export function clearAuthToken() {
  graphqlClient.setHeader('Authorization', '');
}
```

### Typed Query

```typescript
import { gql } from 'graphql-request';
import { graphqlClient } from './client';

const GET_USER = gql`
  query GetUser($id: ID!) {
    user(id: $id) {
      id
      name
      email
      createdAt
    }
  }
`;

interface User {
  id: string;
  name: string;
  email: string;
  createdAt: string;
}

interface GetUserResponse {
  user: User;
}

async function getUser(id: string): Promise<User> {
  const data = await graphqlClient.request<GetUserResponse>(GET_USER, { id });
  return data.user;
}
```

### Typed Mutation

```typescript
const CREATE_USER = gql`
  mutation CreateUser($input: CreateUserInput!) {
    createUser(input: $input) {
      id
      name
      email
    }
  }
`;

interface CreateUserInput {
  name: string;
  email: string;
}

interface CreateUserResponse {
  createUser: User;
}

async function createUser(input: CreateUserInput): Promise<User> {
  const data = await graphqlClient.request<CreateUserResponse>(
    CREATE_USER,
    { input }
  );
  return data.createUser;
}
```

### React Query Integration

```typescript
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { graphqlClient } from './client';

// Query hook
export function useUser(id: string) {
  return useQuery({
    queryKey: ['user', id],
    queryFn: () => graphqlClient.request<GetUserResponse>(GET_USER, { id }),
    select: (data) => data.user,
  });
}

// Mutation hook
export function useCreateUser() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: CreateUserInput) =>
      graphqlClient.request<CreateUserResponse>(CREATE_USER, { input }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
    },
  });
}

// Usage in component
function UserProfile({ id }: { id: string }) {
  const { data: user, isLoading, error } = useUser(id);

  if (isLoading) return <Loading />;
  if (error) return <Error message={error.message} />;

  return <Text>{user?.name}</Text>;
}
```

### Error Handling

```typescript
import { ClientError } from 'graphql-request';

async function fetchWithErrorHandling() {
  try {
    const data = await graphqlClient.request(QUERY);
    return data;
  } catch (error) {
    if (error instanceof ClientError) {
      // GraphQL errors
      const graphqlErrors = error.response.errors;
      console.error('GraphQL errors:', graphqlErrors);

      // Check for specific error codes
      const isAuthError = graphqlErrors?.some(
        (e) => e.extensions?.code === 'UNAUTHENTICATED'
      );

      if (isAuthError) {
        // Handle auth error (redirect to login, refresh token, etc.)
      }
    }
    throw error;
  }
}
```

### Request-Level Headers

```typescript
// Override headers per request (useful for one-off auth)
const data = await graphqlClient.request(
  QUERY,
  { id },
  {
    Authorization: `Bearer ${temporaryToken}`,
    'X-Custom-Header': 'value',
  }
);
```

---

## Anti-Patterns

**BAD** — Creating client per request:
```typescript
async function getUser(id: string) {
  const client = new GraphQLClient(endpoint); // New client every call!
  return client.request(GET_USER, { id });
}
```

**GOOD** — Reuse singleton client:
```typescript
import { graphqlClient } from './client';

async function getUser(id: string) {
  return graphqlClient.request(GET_USER, { id });
}
```

**BAD** — Not typing responses:
```typescript
const data = await client.request(GET_USER, { id });
console.log(data.user.name); // No type safety!
```

**GOOD** — Type your responses:
```typescript
const data = await client.request<GetUserResponse>(GET_USER, { id });
console.log(data.user.name); // Typed!
```

**BAD** — Ignoring GraphQL errors:
```typescript
try {
  const data = await client.request(QUERY);
} catch (error) {
  console.log('Network error'); // GraphQL errors also throw!
}
```

**GOOD** — Handle both error types:
```typescript
try {
  const data = await client.request(QUERY);
} catch (error) {
  if (error instanceof ClientError) {
    console.log('GraphQL errors:', error.response.errors);
  } else {
    console.log('Network error:', error);
  }
}
```

---

## Quick Reference

| Task | API | Example |
|------|-----|---------|
| Create client | `new GraphQLClient()` | `new GraphQLClient(url, { headers })` |
| Make request | `client.request()` | `client.request<T>(query, variables)` |
| Set header | `client.setHeader()` | `client.setHeader('Authorization', token)` |
| Per-request headers | 3rd param | `client.request(query, vars, headers)` |
| Template tag | `gql` | ``gql`query { ... }` `` |
| Handle errors | `ClientError` | `error.response.errors` |
| Raw response | `client.rawRequest()` | Returns `{ data, errors, headers }` |

---

## Deep Dive References

| When you need | Load |
|---------------|------|
| Installation and setup | [01-setup-installation.md](01-setup-installation.md) |
| Core concepts | [02-core-concepts.md](02-core-concepts.md) |
| Client configuration | [03-api-client.md](03-api-client.md) |
| Request methods | [04-api-methods.md](04-api-methods.md) |
| Authentication patterns | [05-api-auth.md](05-api-auth.md) |
| Advanced config | [06-api-config.md](06-api-config.md) |
| Common workflows | [07-guide-workflows.md](07-guide-workflows.md) |
| Error handling | [08-guide-errors.md](08-guide-errors.md) |
| Best practices | [09-best-practices.md](09-best-practices.md) |
| Comparison with Apollo/urql | [10-comparison-clients.md](10-comparison-clients.md) |

---

**Version:** 7.4.0 | **Source:** https://github.com/graffle-js/graffle
