# Security Best Practices

Production-hardened security patterns for NestJS authentication.

## Password Hashing

```typescript
import * as bcrypt from 'bcrypt';

const SALT_ROUNDS = 10;

async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, SALT_ROUNDS);
}

async function comparePassword(plain: string, hash: string): Promise<boolean> {
  return bcrypt.compare(plain, hash);
}
```

## Rate Limiting

```bash
npm install @nestjs/throttler
```

```typescript
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';

@Module({
  imports: [
    ThrottlerModule.forRoot([
      { name: 'short', ttl: 1000, limit: 3 },    // 3 requests per second
      { name: 'medium', ttl: 10000, limit: 20 },  // 20 requests per 10 seconds
      { name: 'long', ttl: 60000, limit: 100 },   // 100 requests per minute
    ]),
  ],
  providers: [{ provide: APP_GUARD, useClass: ThrottlerGuard }],
})
export class AppModule {}
```

### Per-Route Rate Limiting

```typescript
import { Throttle, SkipThrottle } from '@nestjs/throttler';

@Controller('auth')
export class AuthController {
  // Strict limit for login
  @Throttle({ short: { limit: 3, ttl: 60000 } })
  @Post('login')
  login() {}

  // Skip throttling for health check
  @SkipThrottle()
  @Get('health')
  health() {}
}
```

### GraphQL Throttler Guard

```typescript
import { ExecutionContext, Injectable } from '@nestjs/common';
import { GqlExecutionContext } from '@nestjs/graphql';
import { ThrottlerGuard } from '@nestjs/throttler';

@Injectable()
export class GqlThrottlerGuard extends ThrottlerGuard {
  getRequestResponse(context: ExecutionContext) {
    const gqlCtx = GqlExecutionContext.create(context);
    const ctx = gqlCtx.getContext();
    return { req: ctx.req, res: ctx.res };
  }
}
```

## Helmet Security Headers

```bash
npm install helmet
```

```typescript
import helmet from 'helmet';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.use(helmet());
  await app.listen(3000);
}
```

## CORS Configuration

```typescript
app.enableCors({
  origin: process.env.ALLOWED_ORIGINS?.split(',') ?? [],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  maxAge: 86400, // 24 hours
});
```

## Input Validation (Global)

```typescript
import { ValidationPipe } from '@nestjs/common';

app.useGlobalPipes(
  new ValidationPipe({
    whitelist: true,              // Strip unknown properties
    forbidNonWhitelisted: true,   // Throw on unknown properties
    transform: true,              // Auto-transform to DTO types
    transformOptions: {
      enableImplicitConversion: true,
    },
  }),
);
```

## Disable GraphQL Introspection in Production

```typescript
GraphQLModule.forRootAsync<YogaDriverConfig>({
  driver: YogaDriver,
  imports: [ConfigModule],
  inject: [ConfigService],
  useFactory: (configService: ConfigService) => ({
    autoSchemaFile: true,
    introspection: configService.get('NODE_ENV') !== 'production',
    graphiql: configService.get('NODE_ENV') !== 'production',
  }),
})
```

## Environment Variable Validation

```typescript
import * as Joi from 'joi';

ConfigModule.forRoot({
  isGlobal: true,
  validationSchema: Joi.object({
    NODE_ENV: Joi.string().valid('development', 'production', 'test').required(),
    JWT_SECRET: Joi.string().min(32).required(),
    JWT_REFRESH_SECRET: Joi.string().min(32).required(),
    MONGO_URI: Joi.string().uri().required(),
    ALLOWED_ORIGINS: Joi.string().required(),
  }),
  validationOptions: {
    abortEarly: false, // Show all validation errors
  },
})
```

## Security Checklist

| Check | Status | Notes |
|-------|--------|-------|
| bcrypt with 10+ rounds | Required | Password hashing |
| Rate limiting on auth endpoints | Required | Prevent brute force |
| Helmet for HTTP headers | Required | XSS, clickjacking protection |
| CORS configured | Required | Restrict allowed origins |
| Input validation with DTOs | Required | Prevent injection |
| Short JWT expiration (15 min) | Required | Limit token exposure |
| Refresh token rotation | Required | Invalidate old tokens |
| Secrets in environment variables | Required | Never hardcode |
| HTTPS in production | Required | Encrypt transit |
| Soft-delete for users | Recommended | Maintain audit trail |
| Disable introspection in production | Recommended | Reduce attack surface |
| Token blacklisting on logout | Recommended | Revoke access immediately |

---

**Version:** NestJS 11.x + @nestjs/throttler 6.x | **Source:** https://docs.nestjs.com/security/helmet, https://docs.nestjs.com/security/cors, https://docs.nestjs.com/security/rate-limiting
