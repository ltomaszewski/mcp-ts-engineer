# GraphQL Request - Modular Knowledge Base

> A lightweight, zero-dependency GraphQL client with full TypeScript support. LLM-optimized modular architecture for context efficiency.

**Source:** [github.com/jasonkuhrt/graphql-request](https://github.com/jasonkuhrt/graphql-request)
**Package:** graphql-request 7.4.0
**Last Updated:** December 2025

---

## Quick Overview

graphql-request is a minimalist GraphQL client that:
- Requires only `graphql` as a peer dependency
- Provides both static `request()` function and `GraphQLClient` class
- Works in Node.js, browser, and React Native
- Full TypeScript support with type inference
- Supports queries, mutations, variables, batching, and subscriptions
- Extensible middleware system for custom functionality

**Installation:**
```bash
npm install graphql-request graphql
```

---

## Module Navigation Guide

This knowledge base is organized into self-contained modules optimized for LLM context windows. Each module is independently retrievable and includes cross-references for broader context.

### Core Modules

| Module | File | Purpose | When to Use |
|--------|------|---------|-------------|
| **Setup & Installation** | `01-setup-installation.md` | Installation, TypeScript config, Node version support, ESM setup | Getting started, environment configuration |
| **Core Concepts** | `02-core-concepts.md` | Mental models, static vs. class API, when to use each approach | Understanding architecture, design decisions |
| **API Reference: Client** | `03-api-client.md` | GraphQLClient class, constructor, instance methods | Building client instances, making requests |
| **API Reference: Methods** | `04-api-methods.md` | Request methods, query/mutation signatures, batching, subscriptions | API method lookup, parameter reference |
| **API Reference: Auth** | `05-api-auth.md` | Authentication patterns, headers, token management, refresh tokens | Implementing authentication, securing requests |
| **API Reference: Configuration** | `06-api-config.md` | Client configuration, middleware, custom fetch, error handling | Customizing client behavior |
| **Practical Workflows** | `07-guide-workflows.md` | Queries, mutations, variables, file uploads, error patterns | Real-world implementation patterns |
| **Error Handling Guide** | `08-guide-errors.md` | Error types, recovery strategies, debugging techniques | Handling failures, troubleshooting |
| **Best Practices** | `09-best-practices.md` | Performance, security, TypeScript patterns, testing, monitoring | Production-ready patterns |
| **Client Comparison** | `10-comparison-clients.md` | graphql-request vs. Apollo, URQL, graphql-codegen | Evaluating alternatives |

---

## How to Use This Knowledge Base

### For Implementation Tasks
1. **"How do I set up graphql-request?"** → Start with `01-setup-installation.md`
2. **"When should I use GraphQLClient vs. request()?"** → See `02-core-concepts.md`
3. **"How do I make a query?"** → Go to `03-api-client.md`, then `07-guide-workflows.md`
4. **"How do I add authentication?"** → See `05-api-auth.md`
5. **"What's the best way to handle errors?"** → Check `08-guide-errors.md`

### For API Lookups
Each module contains:
- **Method/Feature Name** as heading
- **Description** of what it does
- **Type Signature** showing parameters and returns
- **Parameters** table with types and descriptions
- **Return Values** specification
- **Code Example** showing real usage
- **Source URL** for official documentation verification

### For Troubleshooting
- **Type errors?** → `01-setup-installation.md` (TypeScript config) and `06-api-config.md`
- **Authentication failing?** → `05-api-auth.md`
- **Performance issues?** → `09-best-practices.md` (performance optimization)
- **Confused about API choice?** → `02-core-concepts.md`
- **Error handling unclear?** → `08-guide-errors.md` and `07-guide-workflows.md`

---

## Core Concepts at a Glance

### Two API Approaches

#### 1. Static `request()` Function (Minimal)
For simple, one-off requests:
```typescript
import { request, gql } from 'graphql-request'

const data = await request(endpoint, query, variables)
```

#### 2. GraphQLClient Class (Reusable)
For multiple requests with shared configuration:
```typescript
import { GraphQLClient } from 'graphql-request'

const client = new GraphQLClient(endpoint, options)
const data = await client.request(query, variables)
```

### Supported Operations
- **Queries** — Fetch data
- **Mutations** — Modify data
- **Variables** — Dynamic values in requests
- **Batching** — Multiple requests in single operation
- **Subscriptions** — Real-time updates (with appropriate middleware)
- **File Uploads** — Multipart form-data handling

### Key Features
- **ESM + TypeScript** — Modern module system with full types
- **Zero Dependencies** — Only requires `graphql` peer package
- **Extensible** — Middleware system for custom behavior
- **Error Handling** — Structured error objects with server details
- **Headers & Auth** — Per-client or per-request authentication

---

## Best Practices Summary

✅ **DO:**
- Use variables instead of string interpolation
- Fetch only fields you actually use
- Create a reusable client instance for multiple requests
- Use TypeScript for type safety
- Handle errors explicitly
- Use shallow equality checks for selector patterns

❌ **DON'T:**
- Interpolate variables directly into queries
- Over-fetch unnecessary nested fields
- Create new client instances for every request
- Ignore type errors
- Assume requests always succeed

---

## Cross-Module Dependencies

```
01-setup-installation
├─ required by: All other modules
└─ assumes: Node.js environment knowledge

02-core-concepts
├─ required before: Choosing API approach
└─ foundation for: 03, 04, 05, 06

03-api-client
├─ requires: 02-core-concepts
└─ references: 06-api-config for options

04-api-methods
├─ requires: 03-api-client
└─ used by: 07-guide-workflows

05-api-auth
├─ requires: 03-api-client
└─ integrates with: 06-api-config

06-api-config
├─ requires: 03-api-client
└─ references: 09-best-practices

07-guide-workflows
├─ requires: 03-api-client, 04-api-methods
└─ references: 05-api-auth, 08-guide-errors

08-guide-errors
├─ requires: 04-api-methods
└─ integrates with: 09-best-practices

09-best-practices
├─ requires: All previous modules
└─ references: 10-comparison-clients

10-comparison-clients
├─ optional reference module
└─ helps: Evaluating alternatives
```

---

## Quick Lookup by Use Case

### Authentication
- JWT tokens → `05-api-auth.md`
- Custom headers → `06-api-config.md`
- Token refresh → `05-api-auth.md`

### Performance
- Query optimization → `09-best-practices.md`
- Batching requests → `04-api-methods.md`
- Caching strategies → `07-guide-workflows.md`

### Error Handling
- Network errors → `08-guide-errors.md`
- GraphQL errors → `08-guide-errors.md`
- Retry logic → `07-guide-workflows.md`

### Testing
- Mock requests → `09-best-practices.md`
- Test helpers → `09-best-practices.md`

### Type Safety
- TypeScript setup → `01-setup-installation.md`
- Type inference → `09-best-practices.md`

### Integration
- React integration → `09-best-practices.md`
- Node.js usage → `01-setup-installation.md`
- Custom middleware → `06-api-config.md`

---

## Official Documentation

- **Main Docs:** https://github.com/jasonkuhrt/graphql-request
- **NPM Package:** https://www.npmjs.com/package/graphql-request
- **GraphQL Spec:** https://spec.graphql.org/

---

## Version & Compatibility

- **graphql-request Version:** 7.4.0
- **GraphQL Peer Dependency:** 15.x, 16.x, or 17.x
- **Node.js Support:** 18.x, 20.x, 21.x, 22.x (LTS + current)
- **TypeScript:** 4.5+ (ES modules with bundler moduleResolution)
- **Runtime Environments:** Node.js, Browser, React Native, Deno, Bun

---

**Status:** ✅ Complete modular knowledge base aligned with official documentation
**Generated:** December 2025
**Total Modules:** 10 core modules
**Optimization:** LLM-ready with efficient token usage per module
