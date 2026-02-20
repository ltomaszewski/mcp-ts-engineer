# Provider Patterns

## Standard Providers

The basic way to register a provider:

```typescript
@Injectable()
export class UsersService {}

@Module({
  providers: [UsersService], // Shorthand for useClass
})
export class UsersModule {}
```

## Custom Provider Types

### 1. Value Providers (`useValue`)

Inject a constant value, mock object, or external library instance.

```typescript
const configFactory = {
  apiKey: 'secret-key-123',
  timeout: 5000,
};

@Module({
  providers: [
    {
      provide: 'CONFIG',
      useValue: configFactory,
    },
  ],
})
export class AppModule {}

// Usage
@Injectable()
export class ApiService {
  constructor(@Inject('CONFIG') private config: any) {
    console.log(this.config.apiKey);
  }
}
```

**Use cases:** Configuration objects, mocking in tests, external library instances

### 2. Class Providers (`useClass`)

Dynamically determine which class to instantiate.

```typescript
@Module({
  providers: [
    {
      provide: ConfigService,
      useClass:
        process.env.NODE_ENV === 'development'
          ? DevConfigService
          : ProdConfigService,
    },
  ],
})
export class AppModule {}
```

**Use cases:** Environment-specific implementations, A/B testing, feature flags

### 3. Factory Providers (`useFactory`)

Create providers dynamically using a factory function. Most powerful option.

```typescript
@Module({
  providers: [
    {
      provide: 'ASYNC_CONNECTION',
      useFactory: async (configService: ConfigService) => {
        const connectionString = configService.get('DATABASE_URL');
        return await createConnection(connectionString);
      },
      inject: [ConfigService],
    },
  ],
})
export class DatabaseModule {}
```

**Advanced factory:**
```typescript
{
  provide: 'DATABASE_CONNECTION',
  useFactory: async (
    configService: ConfigService,
    loggerService: LoggerService,
  ) => {
    const config = configService.get('database');
    loggerService.log('Connecting to database...');

    const connection = await createConnection({
      host: config.host,
      port: config.port,
    });

    loggerService.log('Database connected');
    return connection;
  },
  inject: [ConfigService, LoggerService],
}
```

**Use cases:** Async initialization, complex dependency resolution, conditional creation

### 4. Alias Providers (`useExisting`)

Create an alias for an existing provider.

```typescript
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

// Both injections reference the same instance
@Injectable()
export class UsersService {
  constructor(
    private loggerService: LoggerService,
    @Inject('AliasedLogger') private aliasedLogger: LoggerService,
  ) {
    console.log(this.loggerService === this.aliasedLogger); // true
  }
}
```

## Injection Tokens

Use tokens to inject non-class providers or differentiate between providers.

```typescript
// String tokens
export const DATABASE_CONNECTION = 'DATABASE_CONNECTION';

// Symbol tokens (preferred - avoids collisions)
export const DATABASE_CONNECTION = Symbol('DATABASE_CONNECTION');

// Usage
@Injectable()
export class UsersRepository {
  constructor(
    @Inject(DATABASE_CONNECTION) private connection: Connection,
  ) {}
}
```

## Custom Scope for Custom Providers

```typescript
{
  provide: 'CACHE_MANAGER',
  useClass: CacheManager,
  scope: Scope.REQUEST,
}
```
