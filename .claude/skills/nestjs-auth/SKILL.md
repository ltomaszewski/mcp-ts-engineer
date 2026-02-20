---
name: nestjs-auth
description: NestJS authentication and authorization - Passport.js, JWT, guards, refresh tokens, RBAC. Use when implementing login, registration, JWT tokens, role-based access control, or authentication guards.
---

# NestJS Authentication

> Secure authentication and authorization for NestJS using Passport.js, JWT, and guards with refresh token rotation.

---

## When to Use

**LOAD THIS SKILL** when user is:
- Implementing login, registration, or logout functionality
- Creating or modifying JWT strategies and token generation
- Setting up guards (JwtAuthGuard, RolesGuard, GqlAuthGuard)
- Implementing refresh token rotation
- Adding role-based access control (RBAC)
- Securing GraphQL resolvers with authentication

---

## Critical Rules

**ALWAYS:**
1. Use global JWT guard with `@Public()` decorator — whitelist pattern is more secure than blacklist
2. Set access token expiration to 15 minutes max — use refresh tokens for longer sessions
3. Hash refresh tokens before storage with bcrypt — never store plain tokens
4. Validate user exists on each JWT validation — account may be deleted/disabled
5. Specify JWT algorithm explicitly (`HS256`) — prevents algorithm confusion attacks
6. Store secrets in environment variables — never hardcode JWT_SECRET

**NEVER:**
1. Skip user validation in JWT strategy — stale tokens could access deleted accounts
2. Return full user object in JWT payload — include only `sub`, `email`, `roles`
3. Use same secret for access and refresh tokens — compromised access token shouldn't refresh
4. Ignore token expiration (`ignoreExpiration: true`) — defeats purpose of short-lived tokens

---

## Core Patterns

### JWT Strategy with User Validation

```typescript
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';

export interface JwtPayload {
  sub: string;
  email: string;
  roles?: string[];
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, 'jwt') {
  constructor(
    private configService: ConfigService,
    private usersService: UsersService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.get<string>('JWT_SECRET'),
    });
  }

  async validate(payload: JwtPayload) {
    const user = await this.usersService.findById(payload.sub);
    if (!user || user.deleted) {
      throw new UnauthorizedException();
    }
    return { id: payload.sub, email: payload.email, roles: payload.roles || [] };
  }
}
```

### Global Guard with @Public Decorator

```typescript
// decorators/public.decorator.ts
export const IS_PUBLIC_KEY = 'isPublic';
export const Public = () => SetMetadata(IS_PUBLIC_KEY, true);

// guards/jwt-auth.guard.ts
@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  constructor(private reflector: Reflector) {
    super();
  }

  canActivate(context: ExecutionContext) {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isPublic) return true;
    return super.canActivate(context);
  }
}

// app.module.ts - Register globally
@Module({
  providers: [{ provide: APP_GUARD, useClass: JwtAuthGuard }],
})
export class AppModule {}
```

### GraphQL Auth Guard

```typescript
@Injectable()
export class GqlAuthGuard extends AuthGuard('jwt') {
  constructor(private reflector: Reflector) {
    super();
  }

  getRequest(context: ExecutionContext) {
    const ctx = GqlExecutionContext.create(context);
    return ctx.getContext().req;
  }

  canActivate(context: ExecutionContext) {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isPublic) return true;
    return super.canActivate(context);
  }
}
```

### Token Generation with Rotation

```typescript
async generateTokens(userId: string, email: string, roles: string[]) {
  const payload = { sub: userId, email, roles };

  const [accessToken, refreshToken] = await Promise.all([
    this.jwtService.signAsync(payload, {
      secret: this.configService.get('JWT_SECRET'),
      expiresIn: '15m',
    }),
    this.jwtService.signAsync(payload, {
      secret: this.configService.get('JWT_REFRESH_SECRET'),
      expiresIn: '7d',
    }),
  ]);

  // Hash and store refresh token
  const hashedToken = await bcrypt.hash(refreshToken, 10);
  await this.usersService.addRefreshToken(userId, hashedToken);

  return { accessToken, refreshToken };
}
```

---

## Anti-Patterns

**BAD** — Ignoring token expiration:
```typescript
super({
  ignoreExpiration: true, // WRONG - tokens never expire
  secretOrKey: 'hardcoded-secret', // WRONG - use env variable
});
```

**GOOD** — Proper JWT configuration:
```typescript
super({
  ignoreExpiration: false,
  secretOrKey: configService.get<string>('JWT_SECRET'),
});
```

**BAD** — Storing plain refresh tokens:
```typescript
user.refreshTokens.push(refreshToken); // WRONG - plain text storage
```

**GOOD** — Hash before storage:
```typescript
const hashedToken = await bcrypt.hash(refreshToken, 10);
user.refreshTokens.push(hashedToken);
```

**BAD** — No user validation in JWT strategy:
```typescript
async validate(payload: JwtPayload) {
  return payload; // WRONG - user might be deleted
}
```

**GOOD** — Validate user still exists:
```typescript
async validate(payload: JwtPayload) {
  const user = await this.usersService.findById(payload.sub);
  if (!user || user.deleted) throw new UnauthorizedException();
  return user;
}
```

---

## Quick Reference

| Task | API | Example |
|------|-----|---------|
| Extract JWT | `ExtractJwt.fromAuthHeaderAsBearerToken()` | Header: `Authorization: Bearer <token>` |
| Make route public | `@Public()` | `@Public() @Get('health')` |
| Get current user | `@CurrentUser()` | `getProfile(@CurrentUser() user: User)` |
| Require roles | `@Roles('admin')` | `@Roles('admin', 'moderator')` |
| Sign token | `jwtService.signAsync()` | `signAsync(payload, { expiresIn: '15m' })` |
| Verify token | `jwtService.verifyAsync()` | `verifyAsync(token, { secret })` |
| Hash token | `bcrypt.hash()` | `bcrypt.hash(token, 10)` |
| Compare hash | `bcrypt.compare()` | `bcrypt.compare(token, hashedToken)` |

---

## Deep Dive References

Load additional context when needed:

| When you need | Load |
|---------------|------|
| Passport module setup | [01-passport-setup.md](01-passport-setup.md) |
| JWT strategy configuration | [02-jwt-strategy.md](02-jwt-strategy.md) |
| Guard patterns (JWT, Local, GQL) | [03-guards.md](03-guards.md) |
| Custom decorators (@Public, @CurrentUser, @Roles) | [04-decorators.md](04-decorators.md) |
| Refresh token rotation | [05-refresh-tokens.md](05-refresh-tokens.md) |
| Role-based access control (RBAC) | [06-rbac.md](06-rbac.md) |
| Security best practices | [07-security.md](07-security.md) |

---

**Version:** NestJS 11.x | **Source:** https://docs.nestjs.com/security/authentication
