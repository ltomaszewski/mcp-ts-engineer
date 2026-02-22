# Provider Patterns

NestJS providers are classes annotated with `@Injectable()` that can be injected as dependencies. Four custom provider types offer flexibility beyond standard class providers.

## Standard Providers

```typescript
import { Injectable, Module } from '@nestjs/common';

@Injectable()
export class UsersService {}

@Module({
  providers: [UsersService], // Shorthand for { provide: UsersService, useClass: UsersService }
})
export class UsersModule {}
```

## Custom Provider Types

### 1. Value Providers (`useValue`)

Inject a constant value, mock object, or external library instance.

```typescript
import { Module, Injectable, Inject } from '@nestjs/common';

const configFactory = {
  apiUrl: 'https://api.example.com',
  timeout: 5000,
};

@Module({
  providers: [
    {
      provide: 'APP_CONFIG',
      useValue: configFactory,
    },
  ],
})
export class AppModule {}

// Usage -- always explicit @Inject
@Injectable()
export class ApiService {
  constructor(
    @Inject('APP_CONFIG') private readonly config: { apiUrl: string; timeout: number },
  ) {}
}
```

**Use cases:** Configuration objects, mocking in tests, external library instances.

### 2. Class Providers (`useClass`)

Dynamically determine which class to instantiate.

```typescript
import { Module } from '@nestjs/common';

interface ConfigService {
  get(key: string): string;
}

@Module({
  providers: [
    {
      provide: 'ConfigService',
      useClass:
        process.env.NODE_ENV === 'development'
          ? DevConfigService
          : ProdConfigService,
    },
  ],
})
export class AppModule {}
```

**Use cases:** Environment-specific implementations, strategy pattern, feature flags.

### 3. Factory Providers (`useFactory`)

Create providers dynamically using a factory function. Most powerful option.

```typescript
import { Module, Injectable, Inject } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Module({
  providers: [
    {
      provide: 'DATABASE_CONNECTION',
      useFactory: async (configService: ConfigService) => {
        const uri = configService.getOrThrow<string>('MONGO_URI');
        return await createConnection(uri);
      },
      inject: [ConfigService],
    },
  ],
})
export class DatabaseModule {}

// Usage
@Injectable()
export class UsersRepository {
  constructor(
    @Inject('DATABASE_CONNECTION') private readonly connection: Connection,
  ) {}
}
```

### Factory with Multiple Dependencies

```typescript
{
  provide: 'CACHE_CLIENT',
  useFactory: async (
    configService: ConfigService,
    loggerService: LoggerService,
  ) => {
    const config = configService.get('cache');
    loggerService.log('Connecting to cache...');
    const client = await createCacheClient({
      host: config.host,
      port: config.port,
    });
    loggerService.log('Cache connected');
    return client;
  },
  inject: [ConfigService, LoggerService],
}
```

**Use cases:** Async initialization, complex dependency resolution, conditional creation.

### 4. Alias Providers (`useExisting`)

Create an alias for an existing provider. Both tokens resolve to the **same instance**.

```typescript
import { Module, Injectable, Inject } from '@nestjs/common';

@Module({
  providers: [
    LoggerService,
    {
      provide: 'AliasedLogger',
      useExisting: LoggerService,
    },
  ],
})
export class AppModule {}

// Both injections reference the same singleton instance
@Injectable()
export class UsersService {
  constructor(
    @Inject(LoggerService) private readonly logger: LoggerService,
    @Inject('AliasedLogger') private readonly aliasedLogger: LoggerService,
  ) {
    console.log(this.logger === this.aliasedLogger); // true
  }
}
```

**Use cases:** Interface-based injection, backward compatibility, abstracting providers.

## Provider Comparison

| Type | Syntax | Instance | Use Case |
|------|--------|----------|----------|
| `useValue` | `{ provide: TOKEN, useValue: obj }` | Provided value | Constants, mocks |
| `useClass` | `{ provide: TOKEN, useClass: Cls }` | New instance of Cls | Environment switching |
| `useFactory` | `{ provide: TOKEN, useFactory: fn, inject: [...] }` | Factory return value | Async init, complex setup |
| `useExisting` | `{ provide: TOKEN, useExisting: OtherToken }` | Same instance as OtherToken | Aliases, interfaces |

## Injection Tokens

Use tokens to inject non-class providers or differentiate between providers.

```typescript
// String tokens
export const DATABASE_CONNECTION = 'DATABASE_CONNECTION';

// Symbol tokens (preferred -- avoids collisions)
export const DATABASE_CONNECTION = Symbol('DATABASE_CONNECTION');

// InjectionToken (NestJS 11+)
import { InjectionToken } from '@nestjs/common';
// Token can be a string, symbol, Type, or Abstract class

// Usage
@Injectable()
export class UsersRepository {
  constructor(
    @Inject(DATABASE_CONNECTION) private readonly connection: Connection,
  ) {}
}
```

## Custom Scope for Custom Providers

```typescript
import { Scope } from '@nestjs/common';

{
  provide: 'CACHE_MANAGER',
  useClass: CacheManager,
  scope: Scope.REQUEST, // New instance per request
}

{
  provide: 'REQUEST_LOGGER',
  useFactory: (req: Request) => new RequestLogger(req.id),
  scope: Scope.REQUEST,
  inject: [REQUEST],
}
```

## Global Providers (APP_* Tokens)

NestJS provides special tokens for global registration:

| Token | Purpose | Example |
|-------|---------|---------|
| `APP_GUARD` | Global guard | `{ provide: APP_GUARD, useClass: AuthGuard }` |
| `APP_INTERCEPTOR` | Global interceptor | `{ provide: APP_INTERCEPTOR, useClass: LoggingInterceptor }` |
| `APP_PIPE` | Global pipe | `{ provide: APP_PIPE, useClass: ValidationPipe }` |
| `APP_FILTER` | Global exception filter | `{ provide: APP_FILTER, useClass: AllExceptionsFilter }` |

```typescript
import { Module } from '@nestjs/common';
import { APP_GUARD, APP_PIPE } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AuthGuard } from './common/guards/auth.guard';

@Module({
  providers: [
    { provide: APP_GUARD, useClass: AuthGuard },
    {
      provide: APP_PIPE,
      useValue: new ValidationPipe({
        whitelist: true,
        transform: true,
        forbidNonWhitelisted: true,
      }),
    },
  ],
})
export class AppModule {}
```

**Advantage over `app.useGlobal*()` in main.ts:** Module-registered globals support dependency injection.

## Testing with Custom Providers

```typescript
import { Test, TestingModule } from '@nestjs/testing';

const module: TestingModule = await Test.createTestingModule({
  providers: [
    UsersService,
    // Mock with useValue
    {
      provide: 'DATABASE_CONNECTION',
      useValue: {
        query: vi.fn(),
        close: vi.fn(),
      },
    },
    // Mock with useClass
    {
      provide: ConfigService,
      useClass: MockConfigService,
    },
    // Mock with useFactory
    {
      provide: CacheService,
      useFactory: () => ({
        get: vi.fn().mockResolvedValue(null),
        set: vi.fn().mockResolvedValue(undefined),
      }),
    },
  ],
}).compile();
```

## Best Practices

| Practice | Rationale |
|----------|-----------|
| Always `@Inject(TOKEN)` on constructor params | Required for esbuild/tsx (no decorator metadata) |
| Prefer Symbol tokens over strings | Avoids accidental collisions |
| Use `useFactory` for async initialization | Handles async setup cleanly |
| Use `useValue` for mocking in tests | Simplest mock injection |
| Register globals via `APP_*` tokens | Supports dependency injection |
| Document custom tokens in one file | Centralized token reference |

---

**Version:** NestJS 11.x (^11.1.14) | **Source:** https://docs.nestjs.com/fundamentals/custom-providers
