# Configuration Management

The `@nestjs/config` module centralizes configuration loading, validation, and injection.

## Basic Setup

```typescript
import { ConfigModule } from '@nestjs/config';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true, // Make config accessible throughout the app
      envFilePath: '.env',
      cache: true, // Cache environment variables
    }),
  ],
})
export class AppModule {}
```

## Environment Variable Validation with Joi

```typescript
import * as Joi from '@hapi/joi';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      validationSchema: Joi.object({
        NODE_ENV: Joi.string()
          .valid('development', 'production', 'test')
          .default('development'),
        PORT: Joi.number().default(3000),
        DATABASE_HOST: Joi.string().required(),
        JWT_SECRET: Joi.string().min(32).required(),
      }),
      validationOptions: {
        allowUnknown: true,
        abortEarly: false, // Show all errors
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
  DATABASE_HOST: string;

  @IsString()
  JWT_SECRET: string;
}

export function validate(config: Record<string, unknown>) {
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
  host: process.env.DATABASE_HOST,
  port: parseInt(process.env.DATABASE_PORT, 10) || 5432,
  username: process.env.DATABASE_USER,
  password: process.env.DATABASE_PASSWORD,
  database: process.env.DATABASE_NAME,
}));

// config/jwt.config.ts
export default registerAs('jwt', () => ({
  secret: process.env.JWT_SECRET,
  expiresIn: process.env.JWT_EXPIRES_IN || '1h',
}));

// app.module.ts
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

```typescript
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class DatabaseService {
  constructor(private configService: ConfigService) {}

  getDatabaseConfig() {
    // Access nested config
    const host = this.configService.get<string>('database.host');
    const port = this.configService.get<number>('database.port');

    // With default value
    const timeout = this.configService.get<number>('database.timeout', 5000);

    return { host, port, timeout };
  }
}
```

## Feature-Based Configuration (forFeature)

```typescript
// users/config/users.config.ts
export default registerAs('users', () => ({
  maxLoginAttempts: parseInt(process.env.MAX_LOGIN_ATTEMPTS, 10) || 5,
  sessionTimeout: parseInt(process.env.SESSION_TIMEOUT, 10) || 3600,
}));

// users/users.module.ts
@Module({
  imports: [ConfigModule.forFeature(usersConfig)],
  providers: [UsersService],
})
export class UsersModule {}
```

## Best Practices

1. **Validate at startup** - Fail early on misconfiguration
2. **Use isGlobal: true** - Make ConfigModule accessible everywhere
3. **Centralize configuration** - Avoid `process.env` scattered in code
4. **Use namespacing** - Organize related settings into logical groups
5. **Type-safe access** - Use TypeScript interfaces for config objects
6. **Security first** - Add `.env` to `.gitignore`
7. **Environment-specific files** - Support `.env.development`, `.env.production`
8. **Cache configuration** - Use `cache: true` for performance
