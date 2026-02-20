# Custom Decorators

Decorators provide a declarative approach to adding functionality to classes, methods, or properties.

## Creating Custom Decorators with SetMetadata

```typescript
import { SetMetadata } from '@nestjs/common';

export const Roles = (...roles: string[]) => SetMetadata('roles', roles);
```

**Usage:**
```typescript
@Controller('users')
export class UsersController {
  @Get()
  @Roles('admin', 'moderator')
  findAll() {
    return 'This route is protected by roles';
  }
}
```

## Custom Parameter Decorators

Create decorators to extract specific data from the request.

```typescript
import { createParamDecorator, ExecutionContext } from '@nestjs/common';

export const User = createParamDecorator(
  (data: string, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    const user = request.user;
    return data ? user?.[data] : user;
  },
);
```

**Usage:**
```typescript
@Get()
findOne(@User('id') userId: string) {
  return `User ID: ${userId}`;
}
```

## Decorator Composition

Combine multiple decorators into a single decorator for cleaner code.

```typescript
import { applyDecorators, UseGuards } from '@nestjs/common';

export function Auth(...roles: Role[]) {
  return applyDecorators(
    Roles(...roles),
    UseGuards(AuthGuard, RolesGuard),
    ApiBearerAuth(),
    ApiUnauthorizedResponse({ description: 'Unauthorized' }),
  );
}
```

**Usage:**
```typescript
@Get('admin')
@Auth('admin')
getAdminData() {
  return 'Admin data';
}
```

## Types of Decorators

- **Class decorators**: Modify entire classes (`@Module`, `@Controller`)
- **Method decorators**: Modify individual methods (`@Get`, `@Post`)
- **Property decorators**: Modify class properties (`@Inject`)
- **Parameter decorators**: Extract data from requests (`@Body`, `@Param`)

## Best Practices

1. Use meaningful names that describe the decorator's purpose
2. Keep decorators focused on a single responsibility
3. Use `applyDecorators` to combine related decorators
4. Document custom decorators clearly for team use
5. Retrieve metadata using `Reflector` in guards/interceptors
