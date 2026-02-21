# Security Guidelines

Mandatory security practices. Sensitive data requires extra vigilance.

---

## Pre-Commit Checklist

Before ANY commit:
- [ ] No hardcoded secrets (API keys, tokens, passwords)
- [ ] All user inputs validated (DTOs, forms)
- [ ] No injection vulnerabilities (SQL, NoSQL, command)
- [ ] Authentication enforced on protected endpoints
- [ ] Error messages don't leak sensitive data
- [ ] Logging doesn't include PII or credentials

---

## Secret Management

**NEVER hardcode secrets:**

```typescript
// WRONG
const jwtSecret = "super-secret-key-123"
const mongoUri = "mongodb://user:pass@host/db"

// CORRECT
const jwtSecret = process.env.JWT_SECRET
const mongoUri = process.env.MONGO_URI

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

**Server (NestJS + class-validator):**

```typescript
@InputType()
export class CreateUserInput {
  @Field()
  @IsEmail()
  @MaxLength(255)
  email: string

  @Field()
  @IsString()
  @MinLength(2)
  @MaxLength(100)
  @Matches(/^[a-zA-Z\s]+$/)
  name: string
}
```

**Mobile (Zod):**

```typescript
const schema = z.object({
  email: z.string().email().max(255),
  bedtime: z.string().regex(/^\d{2}:\d{2}$/),
})

const result = schema.safeParse(input)
if (!result.success) {
  // Handle validation error
}
```

---

## Authentication & Authorization

**Server patterns:**

```typescript
// Always use guards
@UseGuards(JwtAuthGuard)
@Resolver(() => User)
export class UserResolver {
  @Query(() => User)
  async me(@CurrentUser() user: JwtPayload) {
    return this.userService.findById(user.sub)
  }
}

// Check ownership
async updateKid(userId: string, kidId: string, input: UpdateKidInput) {
  const kid = await this.kidService.findById(kidId)
  if (kid.userId !== userId) {
    throw new ForbiddenException('Not your kid')
  }
  // proceed
}
```

**Mobile patterns:**
- Store tokens securely (expo-secure-store)
- Clear tokens on logout
- Handle token expiry gracefully

---

## Data Protection

**ALWAYS:**
- Encrypt sensitive data at rest
- Use HTTPS for all API calls
- Minimize data collection
- Implement data retention policies
- Log access to sensitive data

**NEVER:**
- Store sensitive data in plain text logs
- Share user data without consent
- Keep data longer than necessary

---

## Common Vulnerabilities

### NoSQL Injection (MongoDB)

```typescript
// WRONG - user input in query
const user = await this.userModel.findOne({ email: userInput })

// CORRECT - validated input
const email = validateEmail(userInput)
const user = await this.userModel.findOne({ email })
```

### Path Traversal

```typescript
// WRONG
const file = fs.readFileSync(`./uploads/${filename}`)

// CORRECT
const safeName = path.basename(filename)
const file = fs.readFileSync(path.join('./uploads', safeName))
```

### XSS (Mobile)

```typescript
// WRONG - rendering raw HTML
<Text>{userProvidedHtml}</Text>

// CORRECT - sanitize or escape
<Text>{sanitizeHtml(userInput)}</Text>
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

**For Critical issues:**
- Use `security-reviewer` agent
- Block all other work
- Notify team immediately
