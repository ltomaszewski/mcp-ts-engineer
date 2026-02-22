# GraphQL Authentication

Securing GraphQL resolvers with guards, decorators, and role-based authorization.

## GraphQL Auth Guard

Create a guard that extracts the HTTP request from GraphQL context:

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

## Current User Decorator (GraphQL)

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

## Adding User to Context

Configure GraphQL module to pass the request through context:

```typescript
GraphQLModule.forRoot<YogaDriverConfig>({
  driver: YogaDriver,
  autoSchemaFile: true,
  context: ({ req }: { req: Request }) => ({ req }),
})
```

## Method-Level Guard

```typescript
import { UseGuards } from '@nestjs/common';

@Resolver(() => User)
export class UsersResolver {
  @Query(() => User)
  @UseGuards(GqlAuthGuard)
  async me(@CurrentUser() user: UserPayload): Promise<User> {
    return this.usersService.findById(user.id);
  }
}
```

## Resolver-Level Guard

```typescript
@Resolver(() => User)
@UseGuards(GqlAuthGuard)
export class UsersResolver {
  // All methods protected
  @Query(() => [User])
  async users() { return this.usersService.findAll(); }
}
```

## Global Guard (APP_GUARD)

```typescript
@Module({
  providers: [
    { provide: APP_GUARD, useClass: GqlAuthGuard },
  ],
})
export class AppModule {}
```

With a global guard, use `@Public()` to opt out:

```typescript
@Query(() => [Post])
@Public()
async publicPosts(): Promise<Post[]> {
  return this.postsService.findPublic();
}
```

## Roles-Based Authorization

```typescript
import { SetMetadata } from '@nestjs/common';

export const ROLES_KEY = 'roles';
export const Roles = (...roles: string[]) => SetMetadata(ROLES_KEY, roles);

@Injectable()
export class GqlRolesGuard implements CanActivate {
  constructor(@Inject(Reflector) private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const roles = this.reflector.getAllAndOverride<string[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (!roles?.length) return true;

    const ctx = GqlExecutionContext.create(context);
    const user = ctx.getContext().req.user;
    return roles.some(role => user.roles?.includes(role));
  }
}

// Usage
@Query(() => [User])
@UseGuards(GqlAuthGuard, GqlRolesGuard)
@Roles('admin')
async getAllUsers() {
  return this.usersService.findAll();
}
```

## @Auth Composed Decorator

Combine guards and decorators into one:

```typescript
import { applyDecorators, UseGuards } from '@nestjs/common';

export function Auth(...roles: string[]) {
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
@Auth('admin')
async getAllUsers() { return this.usersService.findAll(); }

@Query(() => User)
@Auth()
async me(@CurrentUser() user: UserPayload) { return user; }
```

## GraphQL Login Mutation

```typescript
@ObjectType()
export class AuthResponse {
  @Field(() => String)
  accessToken!: string;

  @Field(() => String)
  refreshToken!: string;
}

@Resolver()
export class AuthResolver {
  constructor(@Inject(AuthService) private authService: AuthService) {}

  @Public()
  @Mutation(() => AuthResponse)
  async login(
    @Args('email', { type: () => String }) email: string,
    @Args('password', { type: () => String }) password: string,
  ): Promise<AuthResponse> {
    const user = await this.authService.validateUser(email, password);
    if (!user) throw new GraphQLError('Invalid credentials', {
      extensions: { code: 'UNAUTHENTICATED' },
    });
    return this.authService.login(user);
  }

  @Mutation(() => Boolean)
  async logout(@CurrentUser('id') userId: string): Promise<boolean> {
    await this.authService.logout(userId);
    return true;
  }
}
```

---

**Version:** @nestjs/graphql 13.x + @nestjs/passport 11.x | **Source:** https://docs.nestjs.com/graphql/other-features#execution-context
