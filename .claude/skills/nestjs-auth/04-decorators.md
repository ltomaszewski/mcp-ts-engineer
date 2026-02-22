# Custom Auth Decorators

Custom decorators for authentication: @Public, @CurrentUser, @Roles, and composed decorators.

## @Public Decorator

Marks routes as public, bypassing the global JWT guard.

```typescript
import { SetMetadata } from '@nestjs/common';

export const IS_PUBLIC_KEY = 'isPublic';
export const Public = () => SetMetadata(IS_PUBLIC_KEY, true);
```

**Usage:**
```typescript
@Public()
@Get('health')
healthCheck() { return { status: 'ok' }; }
```

## @CurrentUser Decorator (REST)

Extracts the authenticated user from the request object.

```typescript
import { createParamDecorator, ExecutionContext } from '@nestjs/common';

export const CurrentUser = createParamDecorator(
  (data: string | undefined, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    const user = request.user;
    return data ? user?.[data] : user;
  },
);
```

**Usage:**
```typescript
@Get('profile')
getProfile(
  @CurrentUser() user: UserPayload,           // Full user object
  @CurrentUser('email') email: string,        // Single property
  @CurrentUser('id') userId: string,          // User ID only
) {}
```

## @CurrentUser Decorator (GraphQL)

GraphQL requires extracting from GqlExecutionContext:

```typescript
import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { GqlExecutionContext } from '@nestjs/graphql';

export const CurrentUser = createParamDecorator(
  (data: string | undefined, context: ExecutionContext) => {
    const ctx = GqlExecutionContext.create(context);
    const user = ctx.getContext().req.user;
    return data ? user?.[data] : user;
  },
);
```

## Combined REST/GraphQL @CurrentUser

Works for both HTTP controllers and GraphQL resolvers:

```typescript
import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { GqlExecutionContext } from '@nestjs/graphql';

export const CurrentUser = createParamDecorator(
  (data: string | undefined, context: ExecutionContext) => {
    let user: any;

    if (context.getType<string>() === 'graphql') {
      const ctx = GqlExecutionContext.create(context);
      user = ctx.getContext().req.user;
    } else {
      user = context.switchToHttp().getRequest().user;
    }

    return data ? user?.[data] : user;
  },
);
```

## @Roles Decorator

Sets required roles metadata for the RolesGuard:

```typescript
import { SetMetadata } from '@nestjs/common';

export const ROLES_KEY = 'roles';
export const Roles = (...roles: string[]) => SetMetadata(ROLES_KEY, roles);
```

**Usage:**
```typescript
@Get('admin')
@Roles('admin')
adminOnly() {}

@Get('moderators')
@Roles('admin', 'moderator')
moderatorsAndAdmin() {}
```

## Type-Safe Roles with Enum

```typescript
export enum Role {
  USER = 'user',
  ADMIN = 'admin',
  MODERATOR = 'moderator',
}

export const ROLES_KEY = 'roles';
export const Roles = (...roles: Role[]) => SetMetadata(ROLES_KEY, roles);

// Usage
@Roles(Role.ADMIN, Role.MODERATOR)
```

## @Auth Composed Decorator

Combines guards and decorators into a single decorator:

```typescript
import { applyDecorators, UseGuards } from '@nestjs/common';

export function Auth(...roles: Role[]) {
  return applyDecorators(
    UseGuards(GqlAuthGuard, RolesGuard),
    Roles(...roles),
  );
}

// Usage -- single decorator replaces three
@Query(() => [User])
@Auth(Role.ADMIN)
async getAllUsers() {
  return this.usersService.findAll();
}
```

## Reading Metadata in Guards

Use `Reflector` to read metadata set by decorators:

```typescript
import { Reflector } from '@nestjs/core';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(@Inject(Reflector) private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    // getAllAndOverride: method-level overrides class-level
    const roles = this.reflector.getAllAndOverride<string[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    // getAllAndMerge: combines method + class metadata
    const mergedRoles = this.reflector.getAllAndMerge<string[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!roles?.length) return true;
    const { user } = context.switchToHttp().getRequest();
    return roles.some(role => user.roles?.includes(role));
  }
}
```

### Reflector Methods

| Method | Behavior |
|--------|----------|
| `get(key, target)` | Get metadata from single target |
| `getAllAndOverride(key, targets)` | First non-undefined value wins |
| `getAllAndMerge(key, targets)` | Merge all values into array |

---

**Version:** NestJS 11.x | **Source:** https://docs.nestjs.com/custom-decorators
