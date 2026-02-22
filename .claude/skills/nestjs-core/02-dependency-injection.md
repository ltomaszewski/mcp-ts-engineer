# Dependency Injection

NestJS has a powerful DI system that fosters loose coupling and testability.

## CRITICAL: Explicit @Inject Required

Dev mode uses `tsx` (esbuild) which does **not** emit `emitDecoratorMetadata`. NestJS cannot resolve types implicitly. **Every constructor service parameter must have an explicit `@Inject()` decorator.**

```typescript
// CORRECT -- explicit @Inject on every service param
@Injectable()
export class UsersService {
  constructor(
    @InjectModel(User.name) private readonly userModel: Model<UserDocument>,
    @Inject(ConfigService) private readonly configService: ConfigService,
    @Inject(LoggerService) private readonly logger: LoggerService,
  ) {}
}

// WRONG -- breaks with tsx/esbuild (no decorator metadata)
@Injectable()
export class UsersService {
  constructor(
    private readonly configService: ConfigService,
    private readonly logger: LoggerService,
  ) {}
}
```

**Note:** `@InjectModel()`, `@InjectConnection()`, and other Mongoose-specific decorators are already explicit and work correctly.

## Injection Scopes

### 1. Singleton (DEFAULT)

Single instance shared across the entire application. Most performant.

```typescript
@Injectable() // Singleton by default
export class AppService {}
```

**Best for:** Stateless services, configuration, database connections.

### 2. Request Scope

New instance per incoming request. Garbage-collected after request completes.

```typescript
import { Injectable, Scope } from '@nestjs/common';

@Injectable({ scope: Scope.REQUEST })
export class RequestScopedService {}
```

**Important:** Any provider depending on a request-scoped provider automatically adopts request scope (scope bubbling).

**Best for:** Per-request caching, request tracking, DataLoaders, multi-tenancy.

### 3. Transient Scope

New instance for each consumer that injects it.

```typescript
@Injectable({ scope: Scope.TRANSIENT })
export class TransientService {}
```

**Best for:** Services needing different configuration per consumer.

### Scope Summary

| Scope | Lifetime | Shared | Use Case |
|-------|----------|--------|----------|
| `DEFAULT` (Singleton) | Application | Yes | Stateless services, configs |
| `REQUEST` | Per request | No | DataLoaders, request tracking |
| `TRANSIENT` | Per consumer | No | Consumer-specific config |

## Exporting Services Between Modules

```typescript
@Module({
  providers: [UsersService, InternalUserService],
  exports: [UsersService], // Only UsersService is accessible externally
})
export class UsersModule {}
```

## Handling Circular Dependencies

Use `forwardRef` sparingly:

```typescript
// In module
@Module({
  imports: [forwardRef(() => CatsModule)],
})
export class DogsModule {}

// In service
@Injectable()
export class DogsService {
  constructor(
    @Inject(forwardRef(() => CatsService))
    private readonly catsService: CatsService,
  ) {}
}
```

## Optional Dependencies

```typescript
import { Injectable, Optional, Inject } from '@nestjs/common';

@Injectable()
export class HttpService {
  constructor(
    @Optional() @Inject('HTTP_CONFIG') private httpConfig?: HttpConfig,
  ) {
    // httpConfig might be undefined
  }
}
```

## Custom Injection Tokens

```typescript
// String tokens
export const DATABASE_CONNECTION = 'DATABASE_CONNECTION';

// Symbol tokens (preferred -- avoids collisions)
export const DATABASE_CONNECTION = Symbol('DATABASE_CONNECTION');

// Usage
@Injectable()
export class UsersRepository {
  constructor(
    @Inject(DATABASE_CONNECTION) private connection: Connection,
  ) {}
}
```

## Resolving Request-Scoped Providers

Use `moduleRef.resolve()` instead of `moduleRef.get()` for request-scoped and transient providers. As of v11.1.9, `get()` throws explicitly for implicitly request-scoped dependency trees.

```typescript
import { Injectable, Inject, OnModuleInit } from '@nestjs/common';
import { ModuleRef } from '@nestjs/core';

@Injectable()
export class AppService implements OnModuleInit {
  private transientService: TransientService;

  constructor(@Inject(ModuleRef) private readonly moduleRef: ModuleRef) {}

  async onModuleInit(): Promise<void> {
    // resolve() creates a new instance for transient/request-scoped providers
    this.transientService = await this.moduleRef.resolve(TransientService);
  }
}
```

**Note:** Each `resolve()` call returns a unique instance for transient providers. Use the `contextId` parameter to share instances within the same DI sub-tree.

## Module Re-exporting

```typescript
@Module({
  imports: [CommonModule],
  exports: [CommonModule], // Re-export so importers get CommonModule providers
})
export class CoreModule {}
```

---

**Version:** NestJS 11.x (^11.1.14) | **Source:** https://docs.nestjs.com/fundamentals/injection-scopes
