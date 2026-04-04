---
name: nestjs-graphql
description: "NestJS GraphQL integration with GraphQL Yoga — resolvers, type definitions, DataLoader, subscriptions, Federation."
when_to_use: "Use when working with GraphQL queries, mutations, subscriptions, or schema design."
---

# NestJS GraphQL

> Type-safe GraphQL APIs using code-first approach with GraphQL Yoga driver, DataLoader for N+1 prevention, and query protection.

---

## When to Use

**LOAD THIS SKILL** when user is:
- Creating or modifying GraphQL resolvers (queries, mutations, subscriptions)
- Defining ObjectTypes, InputTypes, ArgsTypes, or enums
- Solving N+1 queries with DataLoader
- Implementing GraphQL authentication/authorization
- Adding query depth/complexity limits
- Setting up GraphQL subscriptions

---

## Critical Rules

**ALWAYS:**
1. Use code-first approach -- provides type safety and single source of truth
2. Use explicit `@Field(() => Type)` on every field -- esbuild/tsx does not emit decorator metadata
3. Use explicit `@Inject()` on constructor params -- required for tsx/esbuild compatibility
4. Implement DataLoader for field resolvers -- prevents N+1 queries in production
5. Make DataLoaders request-scoped (`scope: Scope.REQUEST`) -- prevents data leaks between users
6. Return results in same order as input keys in DataLoader -- this is the DataLoader contract
7. Use `GraphQLError` for errors in resolvers -- not `HttpException`

**NEVER:**
1. Use Apollo Server -- template uses GraphQL Yoga driver (`@graphql-yoga/nestjs`), not Apollo
2. Use bare `@Field()` without type function -- breaks with esbuild/tsx
3. Skip DataLoader for field resolvers -- causes exponential query growth
4. Throw `HttpException` in resolvers -- use `GraphQLError` for proper error format
5. Use default-scoped DataLoaders -- causes data leaks between concurrent requests

---

## Core Patterns

### Basic Resolver

```typescript
@Resolver(() => User)
export class UsersResolver {
  constructor(@Inject(UsersService) private usersService: UsersService) {}

  @Query(() => [User], { name: 'users' })
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
}
```

### ObjectType and InputType

```typescript
@ObjectType()
export class User {
  @Field(() => ID)
  id!: string;

  @Field(() => String)
  email!: string;

  @Field(() => Int, { nullable: true })
  age?: number;

  @Field(() => [Post])
  posts!: Post[];
}

@InputType()
export class CreateUserInput {
  @Field(() => String)
  @IsEmail()
  email!: string;

  @Field(() => String)
  @MinLength(3)
  name!: string;
}
```

### Field Resolver with DataLoader

```typescript
@Injectable({ scope: Scope.REQUEST })
export class UsersLoader {
  constructor(@Inject(UsersService) private usersService: UsersService) {}

  public readonly batchUsers = new DataLoader(async (userIds: readonly string[]) => {
    const users = await this.usersService.findByIds([...userIds]);
    const userMap = new Map(users.map(u => [u.id, u]));
    return userIds.map(id => userMap.get(id) ?? null);
  });
}

@Resolver(() => Post)
export class PostsResolver {
  constructor(@Inject(UsersLoader) private usersLoader: UsersLoader) {}

  @ResolveField(() => User, { nullable: true })
  async author(@Parent() post: Post): Promise<User | null> {
    return this.usersLoader.batchUsers.load(post.authorId);
  }
}
```

---

## Anti-Patterns

**BAD** -- N+1 query without DataLoader:
```typescript
@ResolveField(() => User)
async author(@Parent() post: Post) {
  return this.usersService.findById(post.authorId); // 1 query per post!
}
```

**GOOD** -- Batched with DataLoader:
```typescript
@ResolveField(() => User)
async author(@Parent() post: Post) {
  return this.usersLoader.batchUsers.load(post.authorId);
}
```

**BAD** -- Bare @Field() without type:
```typescript
@Field() // WRONG -- breaks with esbuild
email: string;
```

**GOOD** -- Explicit type function:
```typescript
@Field(() => String)
email!: string;
```

---

## Quick Reference

| Task | Decorator/API | Example |
|------|---------------|---------|
| Query | `@Query(() => Type)` | `@Query(() => [User]) findAll()` |
| Mutation | `@Mutation(() => Type)` | `@Mutation(() => User) create()` |
| Field resolver | `@ResolveField(() => Type)` | `@ResolveField(() => User) author()` |
| Parent data | `@Parent()` | `author(@Parent() post: Post)` |
| Single arg | `@Args('name', opts)` | `@Args('id', { type: () => ID }) id: string` |
| Input object | `@Args('input')` | `@Args('input') input: CreateUserInput` |
| Object type | `@ObjectType()` | `@ObjectType() class User {}` |
| Input type | `@InputType()` | `@InputType() class CreateUserInput {}` |
| Field | `@Field(() => Type)` | `@Field(() => Int, { nullable: true })` |
| Enum | `registerEnumType()` | `registerEnumType(Role, { name: 'Role' })` |
| Subscription | `@Subscription()` | `@Subscription(() => Comment)` |
| Context | `@Context()` | `@Context() ctx: GraphQLContext` |

---

## Deep Dive References

| When you need | Load |
|---------------|------|
| Module setup and Yoga configuration | [01-setup.md](01-setup.md) |
| Resolver patterns and options | [02-resolvers.md](02-resolvers.md) |
| Type definitions (ObjectType, InputType, enums) | [03-type-definitions.md](03-type-definitions.md) |
| Authentication and guards | [04-authentication.md](04-authentication.md) |
| Query protection (Armor, depth limits) | [05-query-protection.md](05-query-protection.md) |
| Error handling | [06-error-handling.md](06-error-handling.md) |
| DataLoader for N+1 prevention | [07-dataloader.md](07-dataloader.md) |
| Subscriptions with SSE and graphql-ws | [08-subscriptions.md](08-subscriptions.md) |
| Federation v2 | [09-federation.md](09-federation.md) |
| Testing resolvers with Vitest | [10-testing.md](10-testing.md) |

---

**Version:** NestJS 11.x + @nestjs/graphql 13.2.x + GraphQL Yoga 5.18.x | **Source:** https://docs.nestjs.com/graphql/quick-start

### GraphQL Yoga Driver Notes

Template uses `@graphql-yoga/nestjs` instead of Apollo:

```typescript
import { GraphQLModule } from '@nestjs/graphql';
import { YogaDriver, YogaDriverConfig } from '@graphql-yoga/nestjs';

@Module({
  imports: [
    GraphQLModule.forRoot<YogaDriverConfig>({
      driver: YogaDriver,
      autoSchemaFile: true,
      graphiql: true,
    }),
  ],
})
export class AppModule {}
```

**Key differences from Apollo:**
- **Package**: `@graphql-yoga/nestjs` + `graphql-yoga` (not `@nestjs/apollo` + `@apollo/server`)
- **Driver class**: `YogaDriver` (not `ApolloDriver`)
- **Config type**: `YogaDriverConfig` (not `ApolloDriverConfig`)
- **Playground**: Built-in GraphiQL via `graphiql: true` (not Apollo Sandbox)
- **Subscriptions**: Native SSE support (no extra WebSocket setup needed)
- **Plugins**: Envelop plugin ecosystem (not Apollo plugins)
- **Decorators**: All NestJS GraphQL decorators work identically
