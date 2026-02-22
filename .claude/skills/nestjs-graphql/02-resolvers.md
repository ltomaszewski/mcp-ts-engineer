# GraphQL Resolvers

Resolvers provide instructions for turning GraphQL operations into data.

## Basic Resolver

```typescript
import { Resolver, Query, Mutation, Args, ID } from '@nestjs/graphql';
import { Inject } from '@nestjs/common';
import { User } from './models/user.model';
import { UsersService } from './users.service';
import { CreateUserInput } from './dto/create-user.input';

@Resolver(() => User)
export class UsersResolver {
  constructor(@Inject(UsersService) private usersService: UsersService) {}

  @Query(() => [User], { name: 'users', description: 'Get all users' })
  async findAll(): Promise<User[]> {
    return this.usersService.findAll();
  }

  @Query(() => User, { nullable: true })
  async user(@Args('id', { type: () => ID }) id: string): Promise<User | null> {
    return this.usersService.findOne(id);
  }

  @Mutation(() => User)
  async createUser(@Args('input') input: CreateUserInput): Promise<User> {
    return this.usersService.create(input);
  }

  @Mutation(() => Boolean)
  async deleteUser(@Args('id', { type: () => ID }) id: string): Promise<boolean> {
    return this.usersService.delete(id);
  }
}
```

## @Resolver Options

| Option | Type | Description |
|--------|------|-------------|
| `() => Type` | Function | Parent type for field resolvers |
| `{ isAbstract: true }` | Object | Abstract resolver (not directly registered) |

## @Query Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `() => Type` | Function | required | Return type |
| `name` | `string` | method name | GraphQL query name |
| `description` | `string` | -- | Schema documentation |
| `nullable` | `boolean \| 'items' \| 'itemsAndList'` | `false` | Nullability |
| `deprecationReason` | `string` | -- | Mark as deprecated |
| `complexity` | `number \| Function` | -- | Query complexity cost |

## @Mutation Options

Same as @Query options.

## Field Resolvers

Compute fields dynamically using `@ResolveField`:

```typescript
import { ResolveField, Parent } from '@nestjs/graphql';

@Resolver(() => User)
export class UsersResolver {
  constructor(
    @Inject(UsersService) private usersService: UsersService,
    @Inject(PostsService) private postsService: PostsService,
  ) {}

  @ResolveField(() => [Post])
  async posts(@Parent() user: User): Promise<Post[]> {
    return this.postsService.findByUserId(user.id);
  }

  @ResolveField(() => String)
  fullName(@Parent() user: User): string {
    return `${user.firstName} ${user.lastName}`;
  }

  @ResolveField(() => Int)
  async postCount(@Parent() user: User): Promise<number> {
    return this.postsService.countByUserId(user.id);
  }
}
```

## @ResolveField Options

| Option | Type | Description |
|--------|------|-------------|
| `() => Type` | Function | Return type |
| `name` | `string` | Field name (default: method name) |
| `nullable` | `boolean` | Can be null |
| `description` | `string` | Schema docs |
| `complexity` | `number \| Function` | Complexity cost |
| `middleware` | `FieldMiddleware[]` | Field middleware |

## Args Patterns

### Single Argument

```typescript
@Query(() => User)
async user(@Args('id', { type: () => ID }) id: string) {
  return this.usersService.findOne(id);
}
```

### @Args Options

| Option | Type | Description |
|--------|------|-------------|
| First param | `string` | Argument name |
| `type` | `() => Type` | GraphQL type (required for ID, Int, Float) |
| `nullable` | `boolean` | Optional argument |
| `description` | `string` | Schema docs |
| `defaultValue` | `any` | Default value |

### ArgsType for Multiple Arguments

```typescript
import { ArgsType, Field, Int } from '@nestjs/graphql';
import { Min, Max } from 'class-validator';

@ArgsType()
export class PaginationArgs {
  @Field(() => Int)
  @Min(0)
  offset: number = 0;

  @Field(() => Int)
  @Min(1)
  @Max(50)
  limit: number = 25;
}

@Query(() => [User])
async users(@Args() pagination: PaginationArgs): Promise<User[]> {
  return this.usersService.findAll(pagination);
}
```

### InputType for Complex Inputs

```typescript
import { InputType, Field } from '@nestjs/graphql';
import { IsEmail, MinLength } from 'class-validator';

@InputType()
export class CreateUserInput {
  @Field(() => String)
  @IsEmail()
  email!: string;

  @Field(() => String)
  @MinLength(3)
  name!: string;
}

@Mutation(() => User)
async createUser(@Args('input') input: CreateUserInput) {
  return this.usersService.create(input);
}
```

## Context and Info Decorators

```typescript
import { Context, Info } from '@nestjs/graphql';
import { GraphQLResolveInfo } from 'graphql';

@Query(() => User)
async me(
  @Context() ctx: { req: Request },
  @Info() info: GraphQLResolveInfo,
) {
  return ctx.req.user;
}
```

## Best Practices

1. **Keep resolvers thin** -- delegate business logic to services
2. **Use InputType for mutations** -- separate input from output types
3. **Name queries explicitly** -- use `name` option for clarity
4. **Document with descriptions** -- add descriptions for API docs
5. **Use nullable appropriately** -- mark optional returns as nullable
6. **Always use explicit @Inject()** -- required for tsx/esbuild

---

**Version:** @nestjs/graphql 13.2.x | **Source:** https://docs.nestjs.com/graphql/resolvers
