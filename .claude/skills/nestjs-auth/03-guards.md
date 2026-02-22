# Guards

Guard patterns for JWT authentication, GraphQL, local auth, and global registration.

## JWT Auth Guard with Public Route Support

```typescript
import { Injectable, ExecutionContext, Inject } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Reflector } from '@nestjs/core';
import { IS_PUBLIC_KEY } from '../decorators/public.decorator';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  constructor(@Inject(Reflector) private reflector: Reflector) {
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
```

## GraphQL Auth Guard

GraphQL uses a different execution context. Override `getRequest` to extract the HTTP request from the GQL context:

```typescript
import { ExecutionContext, Injectable, Inject } from '@nestjs/common';
import { GqlExecutionContext } from '@nestjs/graphql';
import { AuthGuard } from '@nestjs/passport';
import { Reflector } from '@nestjs/core';
import { IS_PUBLIC_KEY } from '../decorators/public.decorator';

@Injectable()
export class GqlAuthGuard extends AuthGuard('jwt') {
  constructor(@Inject(Reflector) private reflector: Reflector) {
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

## Local Auth Guard

Simple guard for username/password login endpoint:

```typescript
import { Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class LocalAuthGuard extends AuthGuard('local') {}
```

## Refresh Token Guard

Guard for refresh token endpoints using a separate strategy:

```typescript
import { Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class RefreshTokenGuard extends AuthGuard('jwt-refresh') {}
```

## Global Guard Registration

### Option 1: Via APP_GUARD (Recommended)

```typescript
import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';

@Module({
  providers: [
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },
  ],
})
export class AppModule {}
```

### Option 2: In main.ts

```typescript
const reflector = app.get(Reflector);
app.useGlobalGuards(new JwtAuthGuard(reflector));
```

**Prefer APP_GUARD** -- it participates in dependency injection, allowing the Reflector and other dependencies to be injected automatically.

## Guard Execution Order

When multiple guards are applied:

```typescript
// Execution order: JwtAuthGuard -> RolesGuard
@UseGuards(JwtAuthGuard, RolesGuard)
@Get('admin')
adminOnly() {}
```

Guards execute in the order listed. If any guard returns `false` or throws, the subsequent guards do not execute.

## Guard Scope Hierarchy

```
Global Guards (APP_GUARD or app.useGlobalGuards)
    |
Controller Guards (@UseGuards on class)
    |
Route Guards (@UseGuards on method)
```

## Usage in Controllers

```typescript
@Controller('auth')
export class AuthController {
  constructor(@Inject(AuthService) private authService: AuthService) {}

  @Public()
  @UseGuards(LocalAuthGuard)
  @Post('login')
  @HttpCode(HttpStatus.OK)
  login(@Request() req: { user: any }) {
    return this.authService.login(req.user);
  }

  @Get('profile')
  getProfile(@CurrentUser() user: UserPayload) {
    return user;
  }

  @UseGuards(RefreshTokenGuard)
  @Post('refresh')
  @Public()
  @HttpCode(HttpStatus.OK)
  refresh(@CurrentUser() user: UserPayload & { refreshToken: string }) {
    return this.authService.refreshTokens(user.id, user.refreshToken);
  }
}
```

## Usage in GraphQL Resolvers

```typescript
@Resolver(() => User)
export class UsersResolver {
  @Query(() => User)
  @UseGuards(GqlAuthGuard)
  async me(@CurrentUser() user: UserPayload): Promise<User> {
    return this.usersService.findById(user.id);
  }

  @Query(() => [User])
  @UseGuards(GqlAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  async users(): Promise<User[]> {
    return this.usersService.findAll();
  }
}
```

## Custom Guard with CanActivate

```typescript
import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';

@Injectable()
export class ApiKeyGuard implements CanActivate {
  constructor(@Inject(ConfigService) private configService: ConfigService) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const apiKey = request.headers['x-api-key'];
    return apiKey === this.configService.get('API_KEY');
  }
}
```

---

**Version:** NestJS 11.x + @nestjs/passport 11.x | **Source:** https://docs.nestjs.com/guards
