# Security Best Practices

## Password Hashing

```typescript
import * as bcrypt from 'bcrypt';

async hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10);
}

async comparePassword(plain: string, hash: string): Promise<boolean> {
  return bcrypt.compare(plain, hash);
}
```

## Rate Limiting

```typescript
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';

@Module({
  imports: [
    ThrottlerModule.forRoot([
      { name: 'short', ttl: 1000, limit: 3 },
      { name: 'long', ttl: 60000, limit: 100 },
    ]),
  ],
  providers: [{ provide: APP_GUARD, useClass: ThrottlerGuard }],
})
export class AppModule {}

// Custom rate limit for login
@Throttle({ short: { limit: 3, ttl: 60000 } })
@Post('login')
login() {}
```

## Helmet Security Headers

```typescript
import helmet from 'helmet';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.use(helmet());
}
```

## CORS Configuration

```typescript
app.enableCors({
  origin: process.env.ALLOWED_ORIGINS?.split(','),
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
});
```

## Input Validation

```typescript
import { ValidationPipe } from '@nestjs/common';

app.useGlobalPipes(new ValidationPipe({
  whitelist: true,
  forbidNonWhitelisted: true,
  transform: true,
}));
```

## Security Checklist

- [ ] bcrypt with 10+ rounds
- [ ] Rate limiting on auth endpoints
- [ ] Helmet for HTTP headers
- [ ] CORS configured properly
- [ ] Input validation with DTOs
- [ ] Short JWT expiration (15 min)
- [ ] Refresh token rotation
- [ ] Secrets in environment variables
- [ ] HTTPS in production
- [ ] Soft-delete for users
- [ ] Disable GraphQL introspection in production
