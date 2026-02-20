# GraphQL Federation v2

Federation allows composing multiple GraphQL services (subgraphs) into a single unified API (supergraph).

## Installation

```bash
npm install --save @apollo/server @apollo/subgraph @nestjs/apollo @nestjs/graphql graphql
```

## Subgraph Configuration

```typescript
import { ApolloFederationDriver, ApolloFederationDriverConfig } from '@nestjs/apollo';
import { Module } from '@nestjs/common';
import { GraphQLModule } from '@nestjs/graphql';
import { join } from 'path';

@Module({
  imports: [
    GraphQLModule.forRoot<ApolloFederationDriverConfig>({
      driver: ApolloFederationDriver,
      autoSchemaFile: {
        federation: 2, // Enable Federation v2
        path: join(process.cwd(), 'src/schema.gql'),
      },
    }),
  ],
})
export class AppModule {}
```

## Defining Federated Entities

Entities use `@key` directive to indicate unique identification across subgraphs:

```typescript
import { Directive, Field, ID, ObjectType } from '@nestjs/graphql';

@ObjectType()
@Directive('@key(fields: "id")')
export class User {
  @Field(() => ID)
  id: string;

  @Field()
  email: string;
}
```

## Reference Resolver

Allow other subgraphs to fetch the entity:

```typescript
import { Args, ResolveReference, Resolver } from '@nestjs/graphql';
import { User } from './user.model';

@Resolver(() => User)
export class UsersResolver {
  constructor(private usersService: UsersService) {}

  @ResolveReference()
  async resolveReference(reference: { __typename: string; id: string }) {
    return this.usersService.findById(reference.id);
  }
}
```

## Extending External Types

In another subgraph, extend an entity defined elsewhere:

```typescript
import { Directive, Field, ID, ObjectType } from '@nestjs/graphql';

@ObjectType()
@Directive('@key(fields: "id")')
@Directive('@extends')
export class User {
  @Field(() => ID)
  @Directive('@external')
  id: string;

  @Field(() => [Post])
  posts: Post[];
}
```

## Gateway Configuration

```bash
npm install @apollo/gateway
```

```typescript
import { IntrospectAndCompose } from '@apollo/gateway';
import { ApolloGatewayDriver, ApolloGatewayDriverConfig } from '@nestjs/apollo';

@Module({
  imports: [
    GraphQLModule.forRoot<ApolloGatewayDriverConfig>({
      driver: ApolloGatewayDriver,
      server: {
        // Apollo Server options
      },
      gateway: {
        supergraphSdl: new IntrospectAndCompose({
          subgraphs: [
            { name: 'users', url: 'http://localhost:3001/graphql' },
            { name: 'posts', url: 'http://localhost:3002/graphql' },
          ],
        }),
      },
    }),
  ],
})
export class AppModule {}
```

## GraphQL Yoga Federation (Alternative)

```bash
npm install @graphql-yoga/nestjs-federation
```

```typescript
import { YogaFederationDriver, YogaFederationDriverConfig } from '@graphql-yoga/nestjs-federation';

// For subgraph
GraphQLModule.forRoot<YogaFederationDriverConfig>({
  driver: YogaFederationDriver,
  autoSchemaFile: true,
})

// For gateway
GraphQLModule.forRoot<YogaGatewayDriverConfig>({
  driver: YogaGatewayDriver,
  subgraphs: [
    { name: 'users', url: 'http://localhost:3001/graphql' },
  ],
})
```

## Federation v2 Directives

```typescript
// @key - Primary key for entity
@Directive('@key(fields: "id")')

// @external - Field defined in another subgraph
@Directive('@external')

// @extends - Extending type from another subgraph
@Directive('@extends')

// @shareable - Field can be resolved by multiple subgraphs
@Directive('@shareable')

// @provides - Subgraph can resolve these fields
@Directive('@provides(fields: "email")')

// @requires - Needs these fields from other subgraphs
@Directive('@requires(fields: "userId")')
```

## Best Practices

1. **Run Subgraphs First** - Start subgraphs before gateway
2. **Avoid Circular Dependencies** - Design entities to minimize circular refs
3. **Clear Ownership** - One subgraph as source of truth per entity
4. **Use @external Wisely** - Only for fields defined elsewhere
5. **Gateway Health Checks** - Disable when using multiple endpoints
6. **Schema Composition** - Use rover CLI for schema composition in CI/CD

## Common Patterns

### Entity Extension

Users subgraph defines User, Posts subgraph extends it:

```typescript
// Users subgraph
@ObjectType()
@Directive('@key(fields: "id")')
export class User {
  @Field(() => ID)
  id: string;

  @Field()
  email: string;
}

// Posts subgraph
@ObjectType()
@Directive('@key(fields: "id")')
@Directive('@extends')
export class User {
  @Field(() => ID)
  @Directive('@external')
  id: string;

  @Field(() => [Post])
  posts: Post[];
}
```

### Cross-Subgraph Queries

Gateway composes queries across subgraphs automatically:

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
