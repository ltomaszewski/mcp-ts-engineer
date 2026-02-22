# Custom Decorators

Decorators provide a declarative approach to adding functionality to classes, methods, or parameters.

## Types of Decorators

| Type | Target | Examples |
|------|--------|----------|
| Class | Class definition | `@Module`, `@Controller`, `@Injectable` |
| Method | Method definition | `@Get`, `@Post`, `@UseGuards` |
| Property | Class property | `@Inject`, `@InjectModel` |
| Parameter | Method parameter | `@Body`, `@Param`, `@Query`, `@CurrentUser` |

## Metadata Decorators with SetMetadata

```typescript
import { SetMetadata } from '@nestjs/common';

export const ROLES_KEY = 'roles';
export const Roles = (...roles: string[]) => SetMetadata(ROLES_KEY, roles);
```

**Usage:**
```typescript
@Get()
@Roles('admin', 'moderator')
findAll() { return 'Protected by roles'; }
```

## Reading Metadata with Reflector

```typescript
import { Reflector } from '@nestjs/core';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(@Inject(Reflector) private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const roles = this.reflector.getAllAndOverride<string[]>(ROLES_KEY, [
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

| Method | Behavior | Use When |
|--------|----------|----------|
| `get(key, target)` | Get metadata from single target | Single target lookup |
| `getAllAndOverride(key, targets)` | First non-undefined wins | Method overrides class |
| `getAllAndMerge(key, targets)` | Merge all values into array | Combine method + class |

## Custom Parameter Decorators

```typescript
import { createParamDecorator, ExecutionContext } from '@nestjs/common';

export const User = createParamDecorator(
  (data: string | undefined, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    const user = request.user;
    return data ? user?.[data] : user;
  },
);
```

**Usage:**
```typescript
@Get()
findOne(
  @User() user: UserPayload,       // Full user
  @User('id') userId: string,      // Single property
) {}
```

## Decorator Composition

Combine multiple decorators into one with `applyDecorators`:

```typescript
import { applyDecorators, UseGuards, SetMetadata } from '@nestjs/common';

export function Auth(...roles: Role[]) {
  return applyDecorators(
    SetMetadata(ROLES_KEY, roles),
    UseGuards(AuthGuard, RolesGuard),
  );
}

// Usage
@Get('admin')
@Auth('admin')
getAdminData() { return 'Admin data'; }
```

## Custom Class Decorator

```typescript
export function Cacheable(ttl: number) {
  return applyDecorators(
    SetMetadata('cache:ttl', ttl),
    UseInterceptors(CacheInterceptor),
  );
}

@Get()
@Cacheable(300) // 5 minutes
findAll() {}
```

## Best Practices

| Practice | Rationale |
|----------|-----------|
| Meaningful names | Describe the decorator's purpose |
| Single responsibility | One behavior per decorator |
| Use `applyDecorators` | Combine related decorators cleanly |
| Document decorators | They are the public API |
| Use Reflector in guards | Standard metadata access pattern |

---

**Version:** NestJS 11.x (^11.1.14) | **Source:** https://docs.nestjs.com/custom-decorators
