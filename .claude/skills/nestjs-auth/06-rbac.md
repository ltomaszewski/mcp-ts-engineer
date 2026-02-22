# Role-Based Access Control (RBAC)

Implementing role-based authorization with guards, decorators, and the Reflector.

## Role Enum

```typescript
export enum Role {
  USER = 'user',
  ADMIN = 'admin',
  MODERATOR = 'moderator',
}
```

## Roles Decorator

```typescript
import { SetMetadata } from '@nestjs/common';
import { Role } from '../enums/role.enum';

export const ROLES_KEY = 'roles';
export const Roles = (...roles: Role[]) => SetMetadata(ROLES_KEY, roles);
```

## Roles Guard (REST)

```typescript
import { Injectable, CanActivate, ExecutionContext, Inject } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ROLES_KEY } from '../decorators/roles.decorator';
import { Role } from '../enums/role.enum';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(@Inject(Reflector) private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<Role[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!requiredRoles?.length) return true; // No roles required

    const { user } = context.switchToHttp().getRequest();
    if (!user) return false;

    return requiredRoles.some((role) => user.roles?.includes(role));
  }
}
```

## Roles Guard (GraphQL)

```typescript
import { Injectable, CanActivate, ExecutionContext, Inject } from '@nestjs/common';
import { GqlExecutionContext } from '@nestjs/graphql';
import { Reflector } from '@nestjs/core';
import { ROLES_KEY } from '../decorators/roles.decorator';
import { Role } from '../enums/role.enum';

@Injectable()
export class GqlRolesGuard implements CanActivate {
  constructor(@Inject(Reflector) private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<Role[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!requiredRoles?.length) return true;

    const ctx = GqlExecutionContext.create(context);
    const user = ctx.getContext().req.user;
    if (!user) return false;

    return requiredRoles.some((role) => user.roles?.includes(role));
  }
}
```

## Global Roles Guard Registration

```typescript
import { APP_GUARD } from '@nestjs/core';

@Module({
  providers: [
    { provide: APP_GUARD, useClass: JwtAuthGuard },   // Auth first
    { provide: APP_GUARD, useClass: RolesGuard },      // Then roles
  ],
})
export class AppModule {}
```

**Guard execution order matters**: JwtAuthGuard must run before RolesGuard because the user object must be attached to the request before role checking.

## Usage in Controllers

```typescript
@Controller('users')
export class UsersController {
  @Get()
  @Roles(Role.ADMIN, Role.MODERATOR)
  findAll() {
    return this.usersService.findAll();
  }

  @Get('profile')
  getProfile(@CurrentUser() user: UserPayload) {
    return user; // All authenticated users
  }

  @Delete(':id')
  @Roles(Role.ADMIN)
  remove(@Param('id') id: string) {
    return this.usersService.remove(id);
  }
}
```

## Usage in GraphQL Resolvers

```typescript
@Resolver(() => User)
export class UsersResolver {
  @Query(() => [User])
  @UseGuards(GqlAuthGuard, GqlRolesGuard)
  @Roles(Role.ADMIN)
  users() {
    return this.usersService.findAll();
  }

  @Mutation(() => Boolean)
  @UseGuards(GqlAuthGuard, GqlRolesGuard)
  @Roles(Role.ADMIN)
  deleteUser(@Args('id', { type: () => String }) id: string) {
    return this.usersService.remove(id);
  }
}
```

## Composed @Auth Decorator

Simplify guard + role combinations:

```typescript
import { applyDecorators, UseGuards } from '@nestjs/common';

export function Auth(...roles: Role[]) {
  if (roles.length === 0) {
    return applyDecorators(UseGuards(GqlAuthGuard));
  }
  return applyDecorators(
    UseGuards(GqlAuthGuard, GqlRolesGuard),
    Roles(...roles),
  );
}

// Usage
@Query(() => [User])
@Auth(Role.ADMIN)
users() { return this.usersService.findAll(); }

@Query(() => User)
@Auth() // Authenticated, any role
me(@CurrentUser() user: UserPayload) { return user; }
```

## Ownership-Based Authorization

Beyond roles, check if the user owns the resource:

```typescript
@Injectable()
export class OwnershipGuard implements CanActivate {
  constructor(@Inject(Reflector) private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const user = request.user;
    const resourceUserId = request.params.userId;

    // Admins bypass ownership check
    if (user.roles?.includes(Role.ADMIN)) return true;

    return user.id === resourceUserId;
  }
}
```

## Best Practices

| Practice | Rationale |
|----------|-----------|
| Guard order: Auth -> Roles | User must be authenticated before role check |
| Default deny | Require explicit role grants |
| Principle of least privilege | Minimum permissions needed |
| Use enum for roles | Type safety, prevents typos |
| Composed decorators | `@Auth(Role.ADMIN)` over `@UseGuards(...) @Roles(...)` |
| Audit logging | Log authorization attempts for security |

---

**Version:** NestJS 11.x | **Source:** https://docs.nestjs.com/security/authorization
