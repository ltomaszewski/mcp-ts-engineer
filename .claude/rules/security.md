# Security Guidelines

Mandatory security practices.

---

## Pre-Commit Checklist

Before ANY commit:
- [ ] No hardcoded secrets (API keys, tokens, passwords)
- [ ] All user inputs validated
- [ ] No injection vulnerabilities
- [ ] Authentication enforced on protected endpoints
- [ ] Error messages don't leak sensitive data
- [ ] Logging doesn't include PII or credentials

---

## Secret Management

**NEVER hardcode secrets:**

```typescript
// WRONG
const jwtSecret = "super-secret-key-123"
const dbUri = "mongodb://user:pass@host/db"

// CORRECT
const jwtSecret = process.env.JWT_SECRET
const dbUri = process.env.DATABASE_URI

if (!jwtSecret) {
  throw new Error('JWT_SECRET not configured')
}
```

**Environment files:**
- `.env` - gitignored, local development
- `.env.example` - committed, shows required vars (no values)
- Never commit `.env.local`, `.env.production`

---

## Input Validation

**Server (Zod):**

```typescript
const inputSchema = z.object({
  prompt: z.string().min(1).max(10000),
  model: z.enum(['haiku', 'sonnet', 'opus']),
})

const result = inputSchema.safeParse(input)
if (!result.success) {
  throw new ValidationError('Invalid input', result.error)
}
```

---

## Authentication & Authorization

**Patterns:**

```typescript
// Always validate session/token
async function handleRequest(token: string) {
  const session = await validateToken(token)
  if (!session) {
    throw new UnauthorizedException('Invalid token')
  }
  return session
}

// Check ownership
async function updateResource(userId: string, resourceId: string) {
  const resource = await findResource(resourceId)
  if (resource.ownerId !== userId) {
    throw new ForbiddenException('Not authorized')
  }
  // proceed
}
```

---

## Common Vulnerabilities

### Command Injection

```typescript
// WRONG - user input in command
execSync(`git clone ${userInput}`)

// CORRECT - validate and sanitize
const safeName = /^[a-zA-Z0-9-]+$/.test(repoName) ? repoName : ''
if (!safeName) throw new Error('Invalid repo name')
execSync(`git clone https://github.com/org/${safeName}`)
```

### Path Traversal

```typescript
// WRONG
const file = fs.readFileSync(`./uploads/${filename}`)

// CORRECT
const safeName = path.basename(filename)
const file = fs.readFileSync(path.join('./uploads', safeName))
```

---

## Security Response Protocol

**If security issue found:**

1. **STOP** current work immediately
2. **ASSESS** severity (Critical/High/Medium/Low)
3. **ISOLATE** - don't commit vulnerable code
4. **FIX** - prioritize over feature work
5. **REVIEW** - check for similar issues
6. **ROTATE** any exposed secrets
