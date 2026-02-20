---
name: nestjs-core
description: NestJS core framework patterns - modules, dependency injection, lifecycle hooks, exception handling, configuration. Use when creating NestJS modules, services, controllers, or working with DI, guards, interceptors, pipes.
---

# NestJS Core

> Enterprise-grade Node.js framework with dependency injection, modular architecture, and TypeScript-first design.

---

## When to Use

**LOAD THIS SKILL** when user is:
- Creating or modifying NestJS modules, services, controllers
- Working with dependency injection or providers
- Implementing guards, interceptors, pipes, or middleware
- Handling exceptions or creating custom exception filters
- Configuring environment variables or app settings

---

## Critical Rules

**ALWAYS:**
1. Follow three-layer architecture — `core/` (infra), `common/` (shared), `modules/` (features)
2. Use facade pattern for modules — export ONE public service, hide internal services
3. Use barrel files (`index.ts`) — explicitly define public API per module
4. Use constructor injection with `private readonly` — explicit dependencies
5. Validate env vars at startup — use `@nestjs/config` with Joi or class-validator

**NEVER:**
1. Export resolvers or internal services from modules — breaks encapsulation
2. Register same Mongoose schema in multiple modules — use centralized `SchemasModule`
3. Use property injection — harder to test and trace dependencies
4. Catch exceptions without re-throwing or transforming — use exception filters

---

## Core Patterns

### Three-Layer Module Structure

```typescript
// modules/users/users.module.ts
@Module({
  imports: [SchemasModule], // Centralized schema registration
  providers: [
    // Internal services (not exported)
    UserValidationService,
    UserScoreService,
    // Public facade service
    UsersService,
    // Resolver (never export)
    UsersResolver,
  ],
  exports: [UsersService], // ONLY export facade service
})
export class UsersModule {}
```

### Barrel File (Public API)

```typescript
// modules/users/index.ts
export { UsersService } from './users.service';
export { CreateUserInput, UserOutput } from './dto';
// NEVER export: internal services, resolver, module class
```

### Injectable Service with DI

```typescript
@Injectable()
export class UsersService {
  constructor(
    private readonly userRepository: UserRepository,
    private readonly configService: ConfigService,
    @InjectModel(User.name) private readonly userModel: Model<UserDocument>,
  ) {}
}
```

### Custom Exception

```typescript
export class DuplicatedEmailException extends BadRequestException {
  constructor(email: string) {
    super(`Email ${email} is already registered`);
  }
}

// Usage
throw new DuplicatedEmailException(dto.email);
```

### Configuration with Validation

```typescript
// config/configuration.ts
export default () => ({
  database: {
    uri: process.env.MONGO_URI,
  },
});

// app.module.ts
ConfigModule.forRoot({
  isGlobal: true,
  validationSchema: Joi.object({
    MONGO_URI: Joi.string().required(),
    JWT_SECRET: Joi.string().required(),
  }),
});
```

---

## Anti-Patterns

**BAD** — Exporting internal services:
```typescript
@Module({
  exports: [UsersService, UserValidationService, UserScoreService], // Too much exposed
})
```

**GOOD** — Single facade export:
```typescript
@Module({
  exports: [UsersService], // Only public API
})
```

**BAD** — Registering schema in multiple modules:
```typescript
// users.module.ts
MongooseModule.forFeature([{ name: User.name, schema: UserSchema }])
// admin.module.ts
MongooseModule.forFeature([{ name: User.name, schema: UserSchema }]) // Duplicate!
```

**GOOD** — Centralized schema registration:
```typescript
// core/database/schemas.module.ts
@Module({
  imports: [MongooseModule.forFeature([{ name: User.name, schema: UserSchema }])],
  exports: [MongooseModule],
})
export class SchemasModule {}
```

---

## Quick Reference

| Task | Pattern | Example |
|------|---------|---------|
| Create service | `@Injectable()` | `export class MyService {}` |
| Inject dependency | constructor | `constructor(private readonly svc: Service)` |
| Create module | `@Module({})` | `imports, providers, exports` |
| Global module | `@Global()` | Above `@Module()` decorator |
| Request scope | `@Injectable({ scope: Scope.REQUEST })` | Per-request instance |
| Lifecycle hook | `OnModuleInit` | `onModuleInit() {}` |
| Exception filter | `@Catch(Exception)` | `catch(exception, host)` |
| Guard | `@UseGuards(Guard)` | `canActivate(context)` |
| Interceptor | `@UseInterceptors(Int)` | `intercept(context, next)` |
| Pipe | `@UsePipes(Pipe)` | `transform(value, metadata)` |

---

## Request Lifecycle Order

```
Middleware → Guards → Interceptors (before) → Pipes → Controller → Service → Interceptors (after) → Exception Filters
```

---

## Deep Dive References

Load additional context when needed:

| When you need | Load |
|---------------|------|
| Module encapsulation and facade pattern | [01-module-organization.md](01-module-organization.md) |
| Where to place code (decision trees) | [01b-code-placement-guide.md](01b-code-placement-guide.md) |
| DI scopes, circular deps, injection tokens | [02-dependency-injection.md](02-dependency-injection.md) |
| SetMetadata, parameter decorators | [03-custom-decorators.md](03-custom-decorators.md) |
| onModuleInit, onApplicationShutdown | [04-lifecycle-hooks.md](04-lifecycle-hooks.md) |
| Exception classes and filters | [05-exception-handling.md](05-exception-handling.md) |
| @nestjs/config, env validation | [06-configuration-management.md](06-configuration-management.md) |
| Full request lifecycle details | [07-request-lifecycle.md](07-request-lifecycle.md) |
| useValue, useClass, useFactory | [08-provider-patterns.md](08-provider-patterns.md) |
| Unit and integration testing | [09-testing.md](09-testing.md) |

---

**Version:** 11.x | **Source:** https://docs.nestjs.com/
