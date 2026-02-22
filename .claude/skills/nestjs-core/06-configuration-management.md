# Configuration Management

The `@nestjs/config` module centralizes configuration loading, validation, and injection.

## Basic Setup

```typescript
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
      cache: true,
    }),
  ],
})
export class AppModule {}
```

### ConfigModule.forRoot Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `isGlobal` | `boolean` | `false` | Make ConfigModule available everywhere |
| `envFilePath` | `string \| string[]` | `'.env'` | Path(s) to .env file(s) |
| `ignoreEnvFile` | `boolean` | `false` | Skip loading .env file |
| `ignoreEnvVars` | `boolean` | `false` | Skip reading OS env vars |
| `cache` | `boolean` | `false` | Cache environment variables in memory |
| `expandVariables` | `boolean` | `false` | Enable variable expansion (`${VAR}`) |
| `load` | `Function[]` | `[]` | Namespaced config factory functions |
| `validationSchema` | `Joi.ObjectSchema` | — | Joi validation schema |
| `validationOptions` | `object` | `{ allowUnknown: true, abortEarly: false }` | Joi validation options |
| `validate` | `Function` | — | Custom validation function |

## Environment Variable Validation with Joi

```typescript
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import * as Joi from 'joi';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      validationSchema: Joi.object({
        NODE_ENV: Joi.string()
          .valid('development', 'production', 'test')
          .default('development'),
        PORT: Joi.number().default(3000),
        MONGO_URI: Joi.string().required(),
        JWT_SECRET: Joi.string().min(32).required(),
        JWT_EXPIRATION: Joi.string().default('1h'),
      }),
      validationOptions: {
        allowUnknown: true,
        abortEarly: false,
      },
    }),
  ],
})
export class AppModule {}
```

## Custom Validation with class-validator

```typescript
import { plainToClass } from 'class-transformer';
import { IsEnum, IsNumber, IsString, Min, validateSync } from 'class-validator';

enum Environment {
  Development = 'development',
  Production = 'production',
  Test = 'test',
}

class EnvironmentVariables {
  @IsEnum(Environment)
  NODE_ENV: Environment;

  @IsNumber()
  @Min(0)
  PORT: number;

  @IsString()
  MONGO_URI: string;

  @IsString()
  JWT_SECRET: string;
}

export function validate(config: Record<string, unknown>): EnvironmentVariables {
  const validatedConfig = plainToClass(EnvironmentVariables, config, {
    enableImplicitConversion: true,
  });

  const errors = validateSync(validatedConfig, {
    skipMissingProperties: false,
  });

  if (errors.length > 0) {
    throw new Error(errors.toString());
  }

  return validatedConfig;
}

// In ConfigModule
ConfigModule.forRoot({ validate })
```

## Namespaced Configuration Files

```typescript
// config/database.config.ts
import { registerAs } from '@nestjs/config';

export default registerAs('database', () => ({
  uri: process.env.MONGO_URI,
  dbName: process.env.DATABASE_NAME || 'myapp',
}));

// config/jwt.config.ts
export default registerAs('jwt', () => ({
  secret: process.env.JWT_SECRET,
  expiresIn: process.env.JWT_EXPIRATION || '1h',
  refreshExpiresIn: process.env.JWT_REFRESH_EXPIRATION || '7d',
}));

// app.module.ts
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import databaseConfig from './config/database.config';
import jwtConfig from './config/jwt.config';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [databaseConfig, jwtConfig],
    }),
  ],
})
export class AppModule {}
```

## Using Configuration in Services

**CRITICAL:** Always use explicit `@Inject()` -- esbuild/tsx does not emit decorator metadata.

```typescript
import { Injectable, Inject } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class DatabaseService {
  constructor(
    @Inject(ConfigService) private readonly configService: ConfigService,
  ) {}

  getDatabaseConfig(): { uri: string; dbName: string } {
    return {
      uri: this.configService.get<string>('database.uri'),
      dbName: this.configService.get<string>('database.dbName', 'myapp'),
    };
  }
}
```

### ConfigService API

| Method | Signature | Description |
|--------|-----------|-------------|
| `get` | `get<T>(key: string): T \| undefined` | Get config value |
| `get` | `get<T>(key: string, defaultValue: T): T` | Get with default |
| `getOrThrow` | `getOrThrow<T>(key: string): T` | Get or throw if undefined |

```typescript
// Usage examples
const port = this.configService.get<number>('PORT');
const secret = this.configService.getOrThrow<string>('JWT_SECRET');
const timeout = this.configService.get<number>('TIMEOUT', 5000);
```

## Typed Configuration with registerAs

```typescript
// config/jwt.config.ts
import { registerAs } from '@nestjs/config';

export interface JwtConfig {
  secret: string;
  expiresIn: string;
  refreshExpiresIn: string;
}

export default registerAs('jwt', (): JwtConfig => ({
  secret: process.env.JWT_SECRET!,
  expiresIn: process.env.JWT_EXPIRATION || '1h',
  refreshExpiresIn: process.env.JWT_REFRESH_EXPIRATION || '7d',
}));
```

### Injecting Namespaced Config Directly

```typescript
import { Injectable, Inject } from '@nestjs/common';
import { ConfigType } from '@nestjs/config';
import jwtConfig from '../config/jwt.config';

@Injectable()
export class AuthService {
  constructor(
    @Inject(jwtConfig.KEY)
    private readonly jwt: ConfigType<typeof jwtConfig>,
  ) {}

  getSecret(): string {
    return this.jwt.secret; // Fully typed, no get<T>() needed
  }
}
```

## Feature-Based Configuration (forFeature)

```typescript
// users/config/users.config.ts
import { registerAs } from '@nestjs/config';

export default registerAs('users', () => ({
  maxLoginAttempts: parseInt(process.env.MAX_LOGIN_ATTEMPTS, 10) || 5,
  sessionTimeout: parseInt(process.env.SESSION_TIMEOUT, 10) || 3600,
}));

// users/users.module.ts
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import usersConfig from './config/users.config';
import { UsersService } from './users.service';

@Module({
  imports: [ConfigModule.forFeature(usersConfig)],
  providers: [UsersService],
})
export class UsersModule {}
```

## Async Module Configuration with ConfigService

```typescript
import { Module, Inject } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ConfigModule, ConfigService } from '@nestjs/config';

@Module({
  imports: [
    MongooseModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        uri: configService.getOrThrow<string>('MONGO_URI'),
      }),
    }),
  ],
})
export class AppModule {}
```

## Best Practices

| Practice | Rationale |
|----------|-----------|
| Validate at startup | Fail early on misconfiguration |
| Use `isGlobal: true` | Avoid importing ConfigModule everywhere |
| Use `registerAs` namespaces | Organize related settings into logical groups |
| Use `ConfigType<typeof config>` | Full type safety without `get<T>()` |
| Always `@Inject(ConfigService)` | Required for esbuild/tsx compatibility |
| Add `.env` to `.gitignore` | Never commit secrets |
| Commit `.env.example` | Document required variables |
| Use `cache: true` | Avoid re-reading env vars on each access |
| Use `getOrThrow` for required values | Explicit failure over silent `undefined` |

---

**Version:** NestJS 11.x (^11.1.14) | **Source:** https://docs.nestjs.com/techniques/configuration
