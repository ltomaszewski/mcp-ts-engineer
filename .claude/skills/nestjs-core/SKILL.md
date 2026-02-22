---
name: nestjs-core
description: NestJS core framework patterns - modules, dependency injection, lifecycle hooks, exception handling, configuration. Use when creating NestJS modules, services, controllers, or working with DI, guards, interceptors, pipes.
---

# NestJS Core

Enterprise-grade Node.js framework with dependency injection, modular architecture, and TypeScript-first design.

---

## When to Use

**LOAD THIS SKILL** when user is:
- Creating or modifying NestJS modules, services, controllers
- Working with dependency injection or custom providers
- Implementing guards, interceptors, pipes, or middleware
- Handling exceptions or creating custom exception filters
- Configuring environment variables or app settings

---

## Critical Rules

**ALWAYS:**
1. Use explicit `@Inject()` on every constructor service parameter -- esbuild/tsx does not emit decorator metadata
2. Use explicit `@Field(() => Type)` on every GraphQL field -- same esbuild reason
3. Follow three-layer architecture -- `core/` (infra), `common/` (shared), `modules/` (features)
4. Use facade pattern for modules -- export ONE public service, hide internal services
5. Validate env vars at startup -- use `@nestjs/config` with Joi or class-validator
6. Use `private readonly` for injected dependencies -- immutable references

**NEVER:**
1. Omit `@Inject()` on constructor params -- breaks with tsx/esbuild (no decorator metadata)
2. Export resolvers or internal services from modules -- breaks encapsulation
3. Register same Mongoose schema in multiple modules -- use centralized `SchemasModule`
4. Use property injection -- harder to test and trace dependencies
5. Catch exceptions without re-throwing or transforming -- use exception filters

---

## Core Patterns

### Module with Facade Pattern

```typescript
@Module({
  imports: [SchemasModule],
  providers: [UserValidationService, UserScoreService, UsersService, UsersResolver],
  exports: [UsersService], // ONLY export facade service
})
export class UsersModule {}
```

### Injectable Service with Explicit @Inject

```typescript
@Injectable()
export class UsersService {
  constructor(
    @InjectModel(User.name) private readonly userModel: Model<UserDocument>,
    @Inject(ConfigService) private readonly configService: ConfigService,
    @Inject(LoggerService) private readonly logger: LoggerService,
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
```

### Configuration with Validation

```typescript
ConfigModule.forRoot({
  isGlobal: true,
  validationSchema: Joi.object({
    MONGO_URI: Joi.string().required(),
    JWT_SECRET: Joi.string().min(32).required(),
    PORT: Joi.number().default(3000),
  }),
});
```

---

## Anti-Patterns

**BAD** -- Missing @Inject (breaks with esbuild):
```typescript
constructor(private readonly configService: ConfigService) {}
```

**GOOD** -- Explicit @Inject:
```typescript
constructor(@Inject(ConfigService) private readonly configService: ConfigService) {}
```

**BAD** -- Exporting internal services:
```typescript
@Module({ exports: [UsersService, UserValidationService, UserScoreService] })
```

**GOOD** -- Single facade export:
```typescript
@Module({ exports: [UsersService] })
```

---

## Quick Reference

| Task | Pattern | Example |
|------|---------|---------|
| Create service | `@Injectable()` | `export class MyService {}` |
| Inject dependency | `@Inject(Token)` | `constructor(@Inject(Svc) private svc: Svc)` |
| Create module | `@Module({})` | `imports, providers, controllers, exports` |
| Global module | `@Global()` | Above `@Module()` decorator |
| Request scope | `Scope.REQUEST` | `@Injectable({ scope: Scope.REQUEST })` |
| Lifecycle hook | `OnModuleInit` | `implements OnModuleInit` |
| Exception filter | `@Catch(Exception)` | `catch(exception, host)` |
| Guard | `@UseGuards(Guard)` | `canActivate(context)` |
| Interceptor | `@UseInterceptors(Int)` | `intercept(context, next)` |
| Pipe | `@UsePipes(Pipe)` | `transform(value, metadata)` |
| Middleware | `NestMiddleware` | `use(req, res, next)` |

---

## Request Lifecycle Order

```
Middleware -> Guards -> Interceptors (before) -> Pipes -> Controller/Resolver -> Service -> Interceptors (after) -> Exception Filters
```

---

## Deep Dive References

| When you need | Load |
|---------------|------|
| Module encapsulation, facade pattern, barrels | [01-module-organization.md](01-module-organization.md) |
| Where to place code (decision trees) | [01b-code-placement-guide.md](01b-code-placement-guide.md) |
| DI scopes, circular deps, injection tokens | [02-dependency-injection.md](02-dependency-injection.md) |
| SetMetadata, parameter decorators, composition | [03-custom-decorators.md](03-custom-decorators.md) |
| Lifecycle hooks (init, bootstrap, shutdown) | [04-lifecycle-hooks.md](04-lifecycle-hooks.md) |
| Exception classes, filters, error handling | [05-exception-handling.md](05-exception-handling.md) |
| @nestjs/config, env validation, namespaces | [06-configuration-management.md](06-configuration-management.md) |
| Full request lifecycle, middleware, guards, pipes | [07-request-lifecycle.md](07-request-lifecycle.md) |
| useValue, useClass, useFactory, useExisting | [08-provider-patterns.md](08-provider-patterns.md) |
| Unit/integration testing with Vitest | [09-testing.md](09-testing.md) |
| ALL decorators reference table | [10-decorators-reference.md](10-decorators-reference.md) |
| ValidationPipe all options | [11-pipes-validation.md](11-pipes-validation.md) |

---

**Version:** NestJS 11.x (^11.1.14) | **Source:** https://docs.nestjs.com/
