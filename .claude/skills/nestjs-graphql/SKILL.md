---
name: nestjs-graphql
description: NestJS GraphQL integration with Apollo Server and GraphQL Yoga - resolvers, type definitions, DataLoader, subscriptions, Federation. Use when working with GraphQL queries, mutations, subscriptions, or schema design.
---

# NestJS GraphQL

> Type-safe GraphQL APIs using code-first approach with Apollo Server 5, DataLoader for N+1 prevention, and GraphQL Armor for query protection.

---

## When to Use

**LOAD THIS SKILL** when user is:
- Creating or modifying GraphQL resolvers (queries, mutations, subscriptions)
- Defining ObjectTypes, InputTypes, or ArgsTypes
- Solving N+1 queries with DataLoader
- Implementing GraphQL authentication/authorization
- Adding query depth/complexity limits
- Setting up GraphQL subscriptions with graphql-ws

---

## Critical Rules

**ALWAYS:**
1. Use code-first approach — provides type safety and single source of truth
2. Implement DataLoader for field resolvers — prevents N+1 queries in production
3. Make DataLoaders request-scoped (`scope: Scope.REQUEST`) — prevents data leaks between users
4. Return results in same order as input keys in DataLoader — this is the DataLoader contract
5. Use GraphQL Armor for production — protects against malicious queries
6. Use `graphql-ws` for subscriptions — `subscriptions-transport-ws` is deprecated

**NEVER:**
1. Use Apollo Playground — deprecated April 2025, use GraphiQL instead
2. Skip DataLoader for field resolvers — causes exponential query growth
3. Throw `HttpException` in resolvers — use `GraphQLError` for proper error format
4. Use default-scoped DataLoaders — causes data leaks between concurrent requests

---

## Core Patterns

### Basic Resolver

```typescript
import { Resolver, Query, Mutation, Args, Int } from '@nestjs/graphql';

@Resolver(() => User)
export class UsersResolver {
  constructor(private usersService: UsersService) {}

  @Query(() => [User], { name: 'users', description: 'Get all users' })
  async findAll(): Promise<User[]> {
    return this.usersService.findAll();
  }

  @Query(() => User, { nullable: true })
  async user(@Args('id', { type: () => Int }) id: number): Promise<User | null> {
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
import { ObjectType, InputType, Field, ID, Int } from '@nestjs/graphql';
import { IsEmail, MinLength } from 'class-validator';

@ObjectType()
export class User {
  @Field(() => ID)
  id: string;

  @Field()
  email: string;

  @Field(() => Int, { nullable: true })
  age?: number;

  @Field(() => [Post])
  posts: Post[];
}

@InputType()
export class CreateUserInput {
  @Field()
  @IsEmail()
  email: string;

  @Field()
  @MinLength(3)
  name: string;
}
```

### Field Resolver with DataLoader

```typescript
import { Injectable, Scope } from '@nestjs/common';
import * as DataLoader from 'dataloader';

@Injectable({ scope: Scope.REQUEST })
export class UsersLoader {
  constructor(private usersService: UsersService) {}

  public readonly batchUsers = new DataLoader(async (userIds: string[]) => {
    const users = await this.usersService.findByIds(userIds);
    const userMap = new Map(users.map(user => [user.id, user]));
    return userIds.map(id => userMap.get(id) || null);
  });
}

@Resolver(() => Post)
export class PostsResolver {
  constructor(private usersLoader: UsersLoader) {}

  @ResolveField(() => User)
  async author(@Parent() post: Post): Promise<User | null> {
    return this.usersLoader.batchUsers.load(post.authorId);
  }
}
```

### GraphQL Auth Guard

```typescript
import { GqlExecutionContext } from '@nestjs/graphql';

@Injectable()
export class GqlAuthGuard extends AuthGuard('jwt') {
  getRequest(context: ExecutionContext) {
    const ctx = GqlExecutionContext.create(context);
    return ctx.getContext().req;
  }
}

// Usage
@Query(() => User)
@UseGuards(GqlAuthGuard)
async me(@CurrentUser() user: User): Promise<User> {
  return user;
}
```

---

## Anti-Patterns

**BAD** — N+1 query without DataLoader:
```typescript
@ResolveField(() => User)
async author(@Parent() post: Post) {
  return this.usersService.findById(post.authorId); // 1 query per post!
}
```

**GOOD** — Batched with DataLoader:
```typescript
@ResolveField(() => User)
async author(@Parent() post: Post) {
  return this.usersLoader.batchUsers.load(post.authorId); // Single batch query
}
```

**BAD** — Default-scoped DataLoader:
```typescript
@Injectable() // WRONG - shared between requests!
export class UsersLoader { }
```

**GOOD** — Request-scoped:
```typescript
@Injectable({ scope: Scope.REQUEST })
export class UsersLoader { }
```

**BAD** — HttpException in resolver:
```typescript
throw new HttpException('Not found', 404); // Wrong format for GraphQL
```

**GOOD** — GraphQLError:
```typescript
throw new GraphQLError('User not found', {
  extensions: { code: 'USER_NOT_FOUND' },
});
```

---

## Quick Reference

| Task | Decorator/API | Example |
|------|---------------|---------|
| Query | `@Query(() => Type)` | `@Query(() => [User]) findAll()` |
| Mutation | `@Mutation(() => Type)` | `@Mutation(() => User) create()` |
| Field resolver | `@ResolveField(() => Type)` | `@ResolveField(() => User) author()` |
| Parent data | `@Parent()` | `author(@Parent() post: Post)` |
| Single arg | `@Args('name')` | `@Args('id', { type: () => Int }) id: number` |
| Input object | `@Args('input')` | `@Args('input') input: CreateUserInput` |
| Object type | `@ObjectType()` | `@ObjectType() class User {}` |
| Input type | `@InputType()` | `@InputType() class CreateUserInput {}` |
| Field | `@Field(() => Type)` | `@Field(() => Int, { nullable: true })` |
| Nullable | `{ nullable: true }` | `@Query(() => User, { nullable: true })` |
| Subscription | `@Subscription()` | `@Subscription(() => Comment)` |

### DataLoader Performance

| Scenario | Without DataLoader | With DataLoader |
|----------|-------------------|-----------------|
| 100 posts, 50 authors | 101 queries | 2 queries |
| 1000 posts, 100 authors | 1001 queries | 2 queries |

---

## Deep Dive References

Load additional context when needed:

| When you need | Load |
|---------------|------|
| Module setup and configuration | [01-setup.md](01-setup.md) |
| Resolver patterns and options | [02-resolvers.md](02-resolvers.md) |
| Type definitions (ObjectType, InputType) | [03-type-definitions.md](03-type-definitions.md) |
| Authentication and guards | [04-authentication.md](04-authentication.md) |
| Query protection (Armor, depth limits) | [05-query-protection.md](05-query-protection.md) |
| Error handling | [06-error-handling.md](06-error-handling.md) |
| DataLoader for N+1 prevention | [07-dataloader.md](07-dataloader.md) |
| Subscriptions with graphql-ws | [08-subscriptions.md](08-subscriptions.md) |
| Federation v2 | [09-federation.md](09-federation.md) |
| Testing resolvers | [10-testing.md](10-testing.md) |

---

**Version:** NestJS 11.x + Apollo Server 5 | **Source:** https://docs.nestjs.com/graphql/quick-start
