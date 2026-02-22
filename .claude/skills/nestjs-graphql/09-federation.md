# GraphQL Federation v2

Federation composes multiple GraphQL services (subgraphs) into a single unified API (supergraph).

## Installation

```bash
npm install @nestjs/graphql @graphql-yoga/nestjs graphql-yoga graphql @apollo/subgraph
npm install @graphql-yoga/nestjs-federation
```

## Subgraph Configuration (Yoga Federation)

```typescript
import { Module } from '@nestjs/common';
import { GraphQLModule } from '@nestjs/graphql';
import {
  YogaFederationDriver,
  YogaFederationDriverConfig,
} from '@graphql-yoga/nestjs-federation';

@Module({
  imports: [
    GraphQLModule.forRoot<YogaFederationDriverConfig>({
      driver: YogaFederationDriver,
      autoSchemaFile: { federation: 2 },
    }),
  ],
})
export class AppModule {}
```

## Defining Federated Entities

Entities use `@Directive('@key')` for unique identification across subgraphs:

```typescript
import { Directive, Field, ID, ObjectType } from '@nestjs/graphql';

@ObjectType()
@Directive('@key(fields: "id")')
export class User {
  @Field(() => ID)
  id!: string;

  @Field(() => String)
  email!: string;

  @Field(() => String)
  name!: string;
}
```

## Reference Resolver

Allows other subgraphs to resolve the entity by its key:

```typescript
import { Resolver, ResolveReference } from '@nestjs/graphql';
import { Inject } from '@nestjs/common';

@Resolver(() => User)
export class UsersResolver {
  constructor(@Inject(UsersService) private usersService: UsersService) {}

  @ResolveReference()
  async resolveReference(reference: { __typename: string; id: string }) {
    return this.usersService.findById(reference.id);
  }
}
```

## Extending External Types

In another subgraph, extend an entity defined elsewhere:

```typescript
@ObjectType()
@Directive('@key(fields: "id")')
@Directive('@extends')
export class User {
  @Field(() => ID)
  @Directive('@external')
  id!: string;

  @Field(() => [Post])
  posts!: Post[];
}

@Resolver(() => User)
export class UserPostsResolver {
  constructor(@Inject(PostsService) private postsService: PostsService) {}

  @ResolveField(() => [Post])
  async posts(@Parent() user: User): Promise<Post[]> {
    return this.postsService.findByUserId(user.id);
  }

  @ResolveReference()
  resolveReference(reference: { __typename: string; id: string }) {
    return { id: reference.id }; // Minimal stub
  }
}
```

## Gateway Configuration (Yoga)

```typescript
import {
  YogaGatewayDriver,
  YogaGatewayDriverConfig,
} from '@graphql-yoga/nestjs-federation';

@Module({
  imports: [
    GraphQLModule.forRoot<YogaGatewayDriverConfig>({
      driver: YogaGatewayDriver,
      gateway: {
        services: [
          { name: 'users', url: 'http://localhost:3001/graphql' },
          { name: 'posts', url: 'http://localhost:3002/graphql' },
        ],
      },
    }),
  ],
})
export class GatewayModule {}
```

## Federation v2 Directives

| Directive | Usage | Description |
|-----------|-------|-------------|
| `@key(fields: "id")` | Entity primary key | Unique identification |
| `@external` | Field defined elsewhere | Other subgraph owns it |
| `@extends` | Extending external type | Type from another subgraph |
| `@shareable` | Multi-subgraph resolution | Field can be resolved by multiple |
| `@provides(fields: "email")` | Subgraph provides fields | Optimization hint |
| `@requires(fields: "userId")` | Needs fields from others | Dependency declaration |
| `@inaccessible` | Internal field | Hidden from supergraph |
| `@override(from: "other")` | Override resolution | Take over field from subgraph |

```typescript
@Directive('@key(fields: "id")')
@Directive('@shareable')
@Directive('@provides(fields: "email")')
@Directive('@requires(fields: "userId")')
```

## Cross-Subgraph Query

Gateway composes queries automatically:

```graphql
query {
  user(id: "1") {
    email      # From users subgraph
    posts {    # From posts subgraph
      title
    }
  }
}
```

## Best Practices

| Practice | Rationale |
|----------|-----------|
| Start subgraphs before gateway | Gateway needs to introspect subgraphs |
| Clear entity ownership | One subgraph as source of truth per entity |
| Minimize cross-references | Reduces latency between subgraphs |
| Use `@shareable` sparingly | Can cause resolution ambiguity |
| Schema composition in CI | Use `rover` CLI for validation |

---

**Version:** @graphql-yoga/nestjs-federation + @nestjs/graphql 13.2.x | **Source:** https://docs.nestjs.com/graphql/federation
