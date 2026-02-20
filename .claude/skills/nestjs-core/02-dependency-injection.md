# Dependency Injection

NestJS has a powerful dependency injection system that fosters loose coupling and testability.

## Injection Scopes

Providers can have one of three scopes:

### 1. Singleton (DEFAULT)

Single instance shared across the entire application. Most performant option.

```typescript
@Injectable()
export class AppService {
  // Singleton by default - one instance for entire app
}
```

**Best for:** Stateless services, configuration services, database connections

### 2. Request Scope

New instance created for each incoming request. Garbage-collected after request completes.

```typescript
@Injectable({ scope: Scope.REQUEST })
export class RequestScopedService {
  // New instance per request
}
```

**Best for:** Per-request caching, request tracking, multi-tenancy, GraphQL applications

**Important:** Any provider relying on a request-scoped provider automatically adopts request scope.

### 3. Transient Scope

New instance for each consumer that injects it.

```typescript
@Injectable({ scope: Scope.TRANSIENT })
export class TransientService {
  // New instance for each consumer
}
```

**Best for:** Services that need different configuration per consumer

## Constructor-Based Injection

Favor constructor-based injection to enforce clear contracts.

```typescript
@Injectable()
export class UsersService {
  constructor(
    private readonly userRepository: Repository<User>,
    private readonly configService: ConfigService,
    private readonly loggerService: LoggerService
  ) {}
}
```

## Exporting Services Between Modules

The `exports` array defines which providers are available to other modules.

```typescript
@Module({
  providers: [UsersService, InternalUserService],
  exports: [UsersService] // Only UsersService is accessible externally
})
export class UsersModule {}
```

## Handling Circular Dependencies

Use `forwardRef` sparingly for circular dependencies.

```typescript
@Module({
  imports: [forwardRef(() => CatsModule)],
})
export class CommonModule {}
```

## Optional Dependencies

Mark dependencies as optional when they might not be available.

```typescript
@Injectable()
export class HttpService {
  constructor(
    @Optional() @Inject('HTTP_CONFIG') private httpConfig?: HttpConfig,
  ) {
    // httpConfig might be undefined
  }
}
```

## Scope Summary

| Scope | Lifetime | Shared | Use Case |
|-------|----------|--------|----------|
| `DEFAULT` (Singleton) | Application | Yes | Stateless services, configs, DB connections |
| `REQUEST` | Per request | No | Request tracking, caching, multi-tenancy |
| `TRANSIENT` | Per consumer | No | Consumer-specific configuration |
