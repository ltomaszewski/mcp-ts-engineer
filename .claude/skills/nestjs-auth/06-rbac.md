# Role-Based Access Control

## Role Enum

```typescript
export enum Role {
  USER = 'user',
  ADMIN = 'admin',
  MODERATOR = 'moderator',
}
```

## Roles Guard

```typescript
@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<Role[]>('roles', [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!requiredRoles) return true;

    const { user } = context.switchToHttp().getRequest();
    if (!user) return false;

    return requiredRoles.some(role => user.roles?.includes(role));
  }
}
```

## Usage

```typescript
@Controller('users')
@UseGuards(JwtAuthGuard, RolesGuard)
export class UsersController {
  @Get()
  @Roles(Role.ADMIN, Role.MODERATOR)
  findAll() {
    return this.usersService.findAll();
  }

  @Get('profile')
  getProfile(@CurrentUser() user: User) {
    return user; // All authenticated users
  }
}
```

## GraphQL RBAC

```typescript
@Resolver(() => User)
@UseGuards(GqlAuthGuard, RolesGuard)
export class UsersResolver {
  @Query(() => [User])
  @Roles(Role.ADMIN)
  users() {
    return this.usersService.findAll();
  }
}
```

## CASL for Complex Permissions

```typescript
@Injectable()
export class CaslAbilityFactory {
  createForUser(user: User) {
    const { can, cannot, build } = new AbilityBuilder(Ability);

    if (user.roles.includes('admin')) {
      can('manage', 'all');
    } else {
      can('read', 'all');
      can('update', 'Article', { authorId: user.id });
      cannot('delete', 'Article', { isPublished: true });
    }

    return build();
  }
}
```

## Best Practices

1. **Guard order** - JWT guard first, then Roles guard
2. **Principle of least privilege** - Minimum permissions needed
3. **Default deny** - Require explicit grants
4. **Audit logging** - Log authorization attempts
