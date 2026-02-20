# Setup & Installation

**Source:** [github.com/jasonkuhrt/graphql-request](https://github.com/jasonkuhrt/graphql-request)
**Package:** graphql-request 7.4.0
**Status:** Complete setup and installation reference

---

## Table of Contents

1. [Installation](#installation)
2. [TypeScript Configuration](#typescript-configuration)
3. [Node Version Support](#node-version-support)
4. [ESM Module Setup](#esm-module-setup)
5. [Project Verification](#project-verification)
6. [Quick Start](#quick-start)
7. [Project Structure](#project-structure)
8. [Environment Variables](#environment-variables)
9. [Troubleshooting](#troubleshooting)

---

## Installation

### Basic Installation

Install both `graphql-request` and its peer dependency `graphql`:

```bash
npm install graphql-request graphql
```

### Yarn
```bash
yarn add graphql-request graphql
```

### PNPM
```bash
pnpm add graphql-request graphql
```

### Why Both Packages?

- **graphql-request** - The GraphQL client library itself
- **graphql** - Peer dependency required because:
  - graphql-request uses internal methods from `graphql` package
  - TypeScript users benefit from `graphql` package types
  - Even JavaScript users gain IDE type hints via `graphql`

---

## TypeScript Configuration

### Required TypeScript Setup

graphql-request uses ES modules (`package.exports`) which require specific TypeScript configuration:

#### 1. Update tsconfig.json

```json
{
  "compilerOptions": {
    "moduleResolution": "bundler",
    "module": "ESNext",
    "target": "ES2020",
    "lib": ["ES2020"]
  }
}
```

**Key settings:**

| Setting | Required Value | Why |
|---------|----------------|-----|
| `moduleResolution` | `"bundler"` or `"node16"` or `"nodenext"` | Package exports resolution |
| `module` | `"ESNext"` or `"ES2020"` | ESM module format |

#### 2. Update package.json

```json
{
  "type": "module",
  "name": "my-app",
  "version": "1.0.0",
  "dependencies": {
    "graphql-request": "^7.4.0",
    "graphql": "^16.0.0"
  }
}
```

**Critical:** The `"type": "module"` field tells Node to treat `.js` files as ESM.

#### 3. Alternative moduleResolution Options

If `bundler` doesn't work in your setup:

```json
{
  "compilerOptions": {
    "moduleResolution": "node16"
  }
}
```

Or:

```json
{
  "compilerOptions": {
    "moduleResolution": "nodenext"
  }
}
```

### TypeScript Example

Once configured, you get full type support:

```typescript
import { GraphQLClient, gql } from 'graphql-request'

// Types are inferred from graphql package
const client = new GraphQLClient('https://api.example.com/graphql')

// Full IDE autocomplete and type checking
const result = await client.request(query)
```

---

## Node Version Support

graphql-request officially supports Node.js **LTS versions** and two additional versions:

### Supported Versions (as of Dec 2025)

| Node Version | Status | Example |
|--------------|--------|---------|
| 18.x | ✅ LTS | Supported |
| 20.x | ✅ LTS (Latest Even) | Supported |
| 21.x | ✅ Latest Odd | Supported (for now) |
| 22.x | ✅ LTS (Future) | Will be supported |
| 17.x | ❌ Unsupported | Not supported |
| 19.x | ❌ Unsupported | Not supported |

### Check Your Node Version

```bash
node --version
# v20.10.0
```

### Upgrade Node if Needed

- **macOS (Homebrew):**
  ```bash
  brew install node@20
  ```

- **Windows:**
  Use [nvm-windows](https://github.com/coreybutler/nvm-windows)

- **Linux/macOS:**
  Use [nvm](https://github.com/nvm-sh/nvm)
  ```bash
  nvm install 20
  nvm use 20
  ```

---

## ESM Module Setup

### Understanding ESM (ECMAScript Modules)

graphql-request is a **pure ESM package**, meaning it only exports ES modules.

#### Differences from CommonJS

| Aspect | ESM | CommonJS |
|--------|-----|----------|
| Import syntax | `import { x } from 'pkg'` | `const { x } = require('pkg')` |
| File extension | `.mjs` or with `"type": "module"` | `.js` |
| Dynamic imports | `import()` | `require()` |
| Default export | `export default` | `module.exports =` |

### ESM in Node.js

To use ESM in Node.js projects:

#### Option 1: .mjs Extension (Simple)

```javascript
// filename.mjs
import { request, gql } from 'graphql-request'

const endpoint = 'https://api.spacex.land/graphql/'
const query = gql`{ company { name } }`

const data = await request(endpoint, query)
console.log(data)
```

Run with:
```bash
node filename.mjs
```

#### Option 2: package.json "type": "module" (Recommended)

```json
{
  "type": "module"
}
```

Then use `.js` files:

```javascript
// filename.js
import { request, gql } from 'graphql-request'

const endpoint = 'https://api.spacex.land/graphql/'
const query = gql`{ company { name } }`

const data = await request(endpoint, query)
console.log(data)
```

Run with:
```bash
node filename.js
```

### ESM in TypeScript

With TypeScript + ESM:

```typescript
// src/main.ts
import { GraphQLClient, gql } from 'graphql-request'

const client = new GraphQLClient('https://api.spacex.land/graphql/')
const query = gql`{ company { name } }`

const data = await client.request(query)
console.log(data)
```

Compile with:
```bash
tsc  # tsconfig.json must have "module": "ESNext"
```

---

## Project Verification

### Verify Installation

Test that graphql-request is properly installed and importable:

```typescript
// test.ts or test.js
import { request, gql, GraphQLClient } from 'graphql-request'

console.log('✅ graphql-request imported successfully')
console.log('✅ request:', typeof request)
console.log('✅ gql:', typeof gql)
console.log('✅ GraphQLClient:', typeof GraphQLClient)
```

Run:
```bash
node test.js
# ✅ graphql-request imported successfully
# ✅ request: function
# ✅ gql: function
# ✅ GraphQLClient: function
```

### Verify TypeScript Configuration

Create test-types.ts:

```typescript
import { GraphQLClient, gql } from 'graphql-request'

// This should type-check without errors
const client: GraphQLClient = new GraphQLClient('https://api.example.com')

const query: string = gql`{ user { id } }`
```

Compile:
```bash
tsc --noEmit
# Should compile with no errors
```

---

## Quick Start

### Minimal Working Example

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
console.log(data)
```

Output:
```json
{
  "company": {
    "name": "SpaceX",
    "founder": "Elon Musk",
    "year_founded": 2002
  }
}
```

### With Client Instance

```typescript
import { GraphQLClient, gql } from 'graphql-request'

const endpoint = 'https://api.spacex.land/graphql/'
const client = new GraphQLClient(endpoint)

const query = gql`
  {
    rockets(limit: 2) {
      id
      name
      type
    }
  }
`

const data = await client.request(query)
console.log(data)
```

### With Variables

```typescript
import { GraphQLClient, gql } from 'graphql-request'

const client = new GraphQLClient('https://api.spacex.land/graphql/')

const query = gql`
  query GetRocket($id: ID!) {
    rocket(id: $id) {
      name
      description
    }
  }
`

const variables = { id: 'falcon9' }
const data = await client.request(query, variables)
console.log(data)
```

### With Authentication

```typescript
import { GraphQLClient, gql } from 'graphql-request'

const client = new GraphQLClient('https://api.example.com/graphql', {
  headers: {
    authorization: 'Bearer YOUR_TOKEN_HERE'
  }
})

const query = gql`{ me { name email } }`
const data = await client.request(query)
console.log(data)
```

---

## Project Structure

Recommended folder structure for a graphql-request project:

```
my-project/
├── src/
│   ├── queries/
│   │   ├── getUser.ts
│   │   ├── getPost.ts
│   │   └── index.ts
│   ├── mutations/
│   │   ├── createUser.ts
│   │   └── index.ts
│   ├── client.ts          # GraphQL client instance
│   ├── types.ts           # TypeScript types
│   └── main.ts            # Entry point
├── tsconfig.json
├── package.json
└── README.md
```

### Example: Client Setup

```typescript
// src/client.ts
import { GraphQLClient } from 'graphql-request'

const endpoint = process.env.GRAPHQL_ENDPOINT || 'https://api.example.com/graphql'

export const client = new GraphQLClient(endpoint, {
  headers: {
    authorization: `Bearer ${process.env.GRAPHQL_TOKEN}`
  }
})
```

### Example: Query File

```typescript
// src/queries/getUser.ts
import { gql } from 'graphql-request'
import { client } from '../client'

export const getUserQuery = gql`
  query GetUser($id: ID!) {
    user(id: $id) {
      id
      name
      email
      posts {
        id
        title
      }
    }
  }
`

export async function getUser(id: string) {
  return client.request(getUserQuery, { id })
}
```

### Example: Usage

```typescript
// src/main.ts
import { getUser } from './queries/getUser'

const user = await getUser('123')
console.log(user.user.name)
```

---

## Environment Variables

Store sensitive configuration in environment variables:

```bash
# .env or .env.local
GRAPHQL_ENDPOINT=https://api.example.com/graphql
GRAPHQL_TOKEN=sk_test_xxxxxxxxxxxxx
```

Load in your client:

```typescript
// src/client.ts
import { GraphQLClient } from 'graphql-request'
import { config } from 'dotenv'

config() // Load from .env

const endpoint = process.env.GRAPHQL_ENDPOINT
const token = process.env.GRAPHQL_TOKEN

if (!endpoint || !token) {
  throw new Error('Missing GRAPHQL_ENDPOINT or GRAPHQL_TOKEN')
}

export const client = new GraphQLClient(endpoint, {
  headers: {
    authorization: `Bearer ${token}`
  }
})
```

Install dotenv:
```bash
npm install dotenv
```

---

## Troubleshooting

### Error: "Cannot find module 'graphql-request'"

**Cause:** Package not installed

**Solution:**
```bash
npm install graphql-request graphql
```

Verify:
```bash
npm list graphql-request
# graphql-request@7.4.0
```

### Error: "ERR_REQUIRE_ESM"

**Cause:** Trying to use `require()` with ESM module

**Solution:** Use `import` instead:

```typescript
// ❌ WRONG
const { request } = require('graphql-request')

// ✅ CORRECT
import { request } from 'graphql-request'
```

### Error: "moduleResolution must be bundler, node16 or nodenext"

**Cause:** tsconfig.json has wrong `moduleResolution`

**Solution:** Update tsconfig.json:
```json
{
  "compilerOptions": {
    "moduleResolution": "bundler"
  }
}
```

### Error: "type: module not in package.json"

**Cause:** Using `.js` files but package.json doesn't declare `"type": "module"`

**Solution:** Add to package.json:
```json
{
  "type": "module"
}
```

Or use `.mjs` file extension instead.

### Error: "Cannot use import statement outside a module"

**Cause:** Node treating file as CommonJS

**Solutions:**

1. Use `.mjs` extension:
   ```bash
   mv file.js file.mjs
   node file.mjs
   ```

2. Or add to package.json:
   ```json
   {
     "type": "module"
   }
   ```

### TypeScript: "Cannot find name 'gql'"

**Cause:** Missing graphql package types

**Solution:**
```bash
npm install graphql
```

The graphql package includes type definitions that TypeScript needs.

### Issues with IDE/Editor

**VSCode not recognizing imports:**
1. Reload the window: Ctrl+Shift+P → "Developer: Reload Window"
2. Ensure tsconfig.json has correct `moduleResolution`
3. Restart TypeScript server: Ctrl+Shift+P → "TypeScript: Restart TS Server"

**WebStorm not recognizing types:**
1. File → Invalidate Caches → Invalidate and Restart
2. Check Settings → Languages & Frameworks → TypeScript → TypeScript Language Service Version

---

## Next Steps

Once setup is complete:

1. **Read [02-core-concepts.md](./02-core-concepts.md)** - Understand static vs. class API
2. **Read [03-api-client.md](./03-api-client.md)** - GraphQLClient class reference
3. **Read [07-guide-workflows.md](./07-guide-workflows.md)** - Build your first queries
4. **Read [05-api-auth.md](./05-api-auth.md)** - Add authentication

---

**Source:** [github.com/jasonkuhrt/graphql-request](https://github.com/jasonkuhrt/graphql-request)
**Package:** graphql-request 7.4.0
**Last Updated:** December 2025
