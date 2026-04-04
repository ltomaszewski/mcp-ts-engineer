---
name: nestjs-auth
description: "NestJS authentication and authorization — Passport.js, JWT, guards, refresh tokens, RBAC."
when_to_use: "Use when implementing login, registration, JWT tokens, role-based access control, or authentication guards."
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

---

## Critical Rules

**ALWAYS:**
1. Use global JWT guard with `@Public()` decorator -- whitelist pattern is more secure than blacklist
2. Set access token expiration to 15 minutes max -- use refresh tokens for longer sessions
3. Hash refresh tokens before storage with bcrypt -- never store plain tokens
4. Validate user exists on each JWT validation -- account may be deleted/disabled
5. Specify JWT algorithm explicitly (`HS256`) -- prevents algorithm confusion attacks
6. Store secrets in environment variables -- never hardcode JWT_SECRET
7. Use explicit `@Inject()` on constructor params -- esbuild/tsx does not emit decorator metadata

**NEVER:**
1. Skip user validation in JWT strategy -- stale tokens could access deleted accounts
2. Return full user object in JWT payload -- include only `sub`, `email`, `roles`
3. Use same secret for access and refresh tokens -- compromised access token shouldn't refresh
4. Ignore token expiration (`ignoreExpiration: true`) -- defeats purpose of short-lived tokens
5. Store plain text refresh tokens -- database breach exposes all sessions

---

## Core Patterns

### JWT Strategy with User Validation

```typescript
@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, 'jwt') {
  constructor(
    @Inject(ConfigService) private configService: ConfigService,
    @Inject(UsersService) private usersService: UsersService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.get<string>('JWT_SECRET'),
    });
  }

  async validate(payload: JwtPayload) {
    const user = await this.usersService.findById(payload.sub);
    if (!user || user.deleted) throw new UnauthorizedException();
    return { id: payload.sub, email: payload.email, roles: payload.roles ?? [] };
  }
}
```

### Global Guard with @Public Decorator

```typescript
export const IS_PUBLIC_KEY = 'isPublic';
export const Public = () => SetMetadata(IS_PUBLIC_KEY, true);

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  constructor(@Inject(Reflector) private reflector: Reflector) { super(); }

  canActivate(context: ExecutionContext) {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(), context.getClass(),
    ]);
    if (isPublic) return true;
    return super.canActivate(context);
  }
}

// Register globally in AppModule
@Module({ providers: [{ provide: APP_GUARD, useClass: JwtAuthGuard }] })
export class AppModule {}
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
  const hashedToken = await bcrypt.hash(refreshToken, 10);
  await this.usersService.addRefreshToken(userId, hashedToken);
  return { accessToken, refreshToken };
}
```

### GraphQL Auth Guard

```typescript
@Injectable()
export class GqlAuthGuard extends AuthGuard('jwt') {
  constructor(@Inject(Reflector) private reflector: Reflector) { super(); }

  getRequest(context: ExecutionContext) {
    return GqlExecutionContext.create(context).getContext().req;
  }

  canActivate(context: ExecutionContext) {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(), context.getClass(),
    ]);
    if (isPublic) return true;
    return super.canActivate(context);
  }
}
```

---

## Anti-Patterns

**BAD** -- Ignoring token expiration:
```typescript
super({ ignoreExpiration: true, secretOrKey: 'hardcoded-secret' });
```

**GOOD** -- Proper JWT configuration:
```typescript
super({ ignoreExpiration: false, secretOrKey: configService.get<string>('JWT_SECRET') });
```

**BAD** -- No user validation in JWT strategy:
```typescript
async validate(payload: JwtPayload) { return payload; }
```

**GOOD** -- Validate user still exists:
```typescript
async validate(payload: JwtPayload) {
  const user = await this.usersService.findById(payload.sub);
  if (!user || user.deleted) throw new UnauthorizedException();
  return { id: payload.sub, email: payload.email, roles: payload.roles ?? [] };
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
| Hash password | `bcrypt.hash()` | `bcrypt.hash(password, 10)` |
| Compare hash | `bcrypt.compare()` | `bcrypt.compare(plain, hashed)` |
| Register guard globally | `APP_GUARD` | `{ provide: APP_GUARD, useClass: JwtAuthGuard }` |

---

## Deep Dive References

| When you need | Load |
|---------------|------|
| Passport module setup, AuthModule, LocalStrategy | [01-passport-setup.md](01-passport-setup.md) |
| JWT strategy configuration, ExtractJwt options | [02-jwt-strategy.md](02-jwt-strategy.md) |
| Guard patterns (JWT, Local, GQL, global) | [03-guards.md](03-guards.md) |
| Custom decorators (@Public, @CurrentUser, @Roles) | [04-decorators.md](04-decorators.md) |
| Refresh token rotation, storage, revocation | [05-refresh-tokens.md](05-refresh-tokens.md) |
| Role-based access control (RBAC) | [06-rbac.md](06-rbac.md) |
| Security best practices, rate limiting, helmet | [07-security.md](07-security.md) |
| Testing auth flows with Vitest | [08-testing.md](08-testing.md) |

---

**Version:** NestJS 11.x + @nestjs/passport 11.x + passport 0.7.x + passport-jwt 4.x | **Source:** https://docs.nestjs.com/security/authentication
