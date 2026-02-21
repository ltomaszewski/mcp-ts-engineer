# NestJS Backend CLAUDE.md Template

> Copy this template to your NestJS app's root as `CLAUDE.md` and customize for your project.

---

```markdown
# [App Name] - NestJS Backend

> **Architecture Guide**: See `./.claude/knowledge-base/nestjs-backend-architecture.md` (from project root)

---

## Tech Stack

| Package | Version | Notes |
|---------|---------|-------|
| NestJS | ^10.x | Core framework |
| GraphQL (Apollo) | ^12.x | API layer |
| MongoDB (Mongoose) | ^8.x | Database |
| Passport.js + JWT | ^10.x | Authentication |
| class-validator | ^0.14.x | DTO validation |
| @nestjs/config | ^3.x | Configuration |
| Jest | ^29.x | Testing |

---

## Architecture Overview

```
src/
├── core/           → Infrastructure (database, config, logging)
├── common/         → Shared code (guards, decorators, utils)
├── models/         → Mongoose schemas
├── modules/        → Feature modules (PRIMARY - business logic)
└── generated/      → Auto-generated (GraphQL schema)
```

### Key Patterns

1. **Three-layer architecture**: core/ (infrastructure), common/ (shared), modules/ (features)
2. **Facade pattern**: Each module exports ONE public service
3. **Barrel files**: `index.ts` defines public API explicitly
4. **Centralized schemas**: SchemasModule for shared Mongoose schemas

---

## File Structure

```
apps/[app-name]/
├── src/
│   ├── core/
│   │   └── database/
│   │       └── schemas.module.ts
│   ├── common/
│   │   ├── decorators/
│   │   │   ├── current-user.decorator.ts
│   │   │   └── public.decorator.ts
│   │   ├── guards/
│   │   │   └── gql-auth.guard.ts
│   │   ├── strategies/
│   │   │   └── jwt.strategy.ts
│   │   ├── modules/        # Shared domain modules
│   │   ├── services/       # Pure utility services
│   │   └── types/
│   ├── models/
│   │   ├── user.schema.ts
│   │   └── *.schema.ts
│   ├── modules/
│   │   ├── auth/
│   │   │   ├── dto/
│   │   │   │   ├── login.input.ts
│   │   │   │   ├── auth-response.type.ts
│   │   │   │   └── index.ts
│   │   │   ├── services/
│   │   │   │   ├── auth-token.service.ts
│   │   │   │   └── index.ts
│   │   │   ├── tests/
│   │   │   │   └── auth.service.test.ts
│   │   │   ├── auth.service.ts
│   │   │   ├── auth.resolver.ts
│   │   │   ├── auth.module.ts
│   │   │   └── index.ts
│   │   ├── user/
│   │   ├── health/
│   │   └── [feature]/
│   ├── generated/
│   │   └── schema.graphql
│   ├── app.module.ts
│   └── main.ts
├── staticWebPage/          # Static files (optional)
├── .env
├── package.json
└── tsconfig.json
```

---

## Commands

```bash
# Development
npm run dev                 # Start with hot-reload
npm run start               # Start production
npm run build               # Build for production

# Testing
npm test                    # Run all tests
npm run test:watch          # Watch mode
npm run test:cov            # Coverage report

# Type checking
npx tsc --noEmit            # Check types

# Linting
npm run lint                # Run ESLint
npm run lint:fix            # Fix issues
```

---

## Environment Variables

```env
# Server
PORT=3001
NODE_ENV=development

# Database
MONGO_URI=mongodb://localhost:27017/[app-name]
MONGO_URI_DEV=mongodb://localhost:27017/[app-name]-dev

# JWT
JWT_SECRET=your-32-character-minimum-secret
JWT_REFRESH_SECRET=different-secret-for-refresh

# External Services (add as needed)
# APPLE_ID_CLIENT_ID=com.example.app
```

---

## API Endpoints

| Endpoint | Description |
|----------|-------------|
| `GET /health` | Health check |
| `POST /v3/graphql` | GraphQL API |

---

## Module Guidelines

### Creating a New Feature Module

1. Create folder: `src/modules/<feature>/`
2. Add subfolders: `dto/`, `services/`, `tests/`, `types/`, `constants/`
3. Create files:
   - `<feature>.module.ts` - Module definition
   - `<feature>.service.ts` - Public facade service
   - `<feature>.resolver.ts` - GraphQL resolver
   - `index.ts` - Barrel export (public API only)
4. Register in `app.module.ts`

### Module Checklist

- [ ] Only facade service is exported
- [ ] Resolver is NOT exported
- [ ] Internal services in `services/` subfolder
- [ ] DTOs have barrel file `dto/index.ts`
- [ ] Tests in `tests/` folder
- [ ] Schemas registered in SchemasModule or module-specific

---

## Testing

### Test File Location

```
modules/<feature>/tests/<name>.test.ts
```

### Running Tests

```bash
# All tests
npm test

# Specific file
npm test -- modules/auth/tests/auth.service.test.ts

# With coverage
npm run test:cov
```

---

## Common Issues & Fixes

### 1. MongoDB Connection Timeout

**Cause:** Network issues or incorrect connection string.

**Fix:** Check `MONGO_URI` in `.env`, ensure MongoDB is running.

### 2. JWT Token Invalid

**Cause:** Mismatched JWT_SECRET between environments.

**Fix:** Ensure same secret is used for signing and verification.

### 3. Circular Dependency Error

**Cause:** Two modules importing each other directly.

**Fix:** Use `forwardRef()`:
```typescript
@Module({
  imports: [forwardRef(() => OtherModule)],
})
```

### 4. GraphQL Schema Not Generated

**Cause:** Missing or incorrect resolver decorators.

**Fix:** Ensure all resolvers have `@Resolver()`, queries have `@Query()`, mutations have `@Mutation()`.

---

## Skills Reference

| Skill | Use For |
|-------|---------|
| `nestjs-core` | Modules, DI, lifecycle, exceptions |
| `nestjs-auth` | Passport, JWT, guards, RBAC |
| `nestjs-graphql` | Resolvers, types, subscriptions |
| `nestjs-mongoose` | Schemas, model injection |
| `class-validator` | DTO validation |
| `typescript-clean-code` | Code style |

---

## Naming Conventions

| Type | Convention | Example |
|------|------------|---------|
| Module | kebab-case folder, PascalCase class | `auth/AuthModule` |
| Service | PascalCase + Service | `AuthService` |
| Resolver | PascalCase + Resolver | `AuthResolver` |
| Guard | PascalCase + Guard | `GqlAuthGuard` |
| Decorator | camelCase function | `@CurrentUser()` |
| DTO Input | PascalCase + Input | `LoginInput` |
| DTO Output | PascalCase + Output/Response | `AuthResponse` |
| Schema | PascalCase | `User`, `UserSchema` |
| Test | same name + .test | `auth.service.test.ts` |
| Constants | SCREAMING_SNAKE_CASE | `JWT_EXPIRATION` |
```

---

## Customization Notes

When using this template:

1. Replace `[App Name]` with your application name
2. Replace `[app-name]` with kebab-case version
3. Update tech stack versions to match your `package.json`
4. Add app-specific modules to the file structure
5. Add app-specific environment variables
6. Add app-specific API endpoints
7. Add app-specific common issues
8. Remove this "Customization Notes" section
