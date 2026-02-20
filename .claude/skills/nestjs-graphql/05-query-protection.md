# Query Complexity and Depth Limiting

GraphQL's flexibility makes it vulnerable to malicious queries. Implement protection for production APIs.

## GraphQL Armor (Recommended)

```bash
npm install @escape.tech/graphql-armor
```

```typescript
import { ApolloArmor } from '@escape.tech/graphql-armor';

const armor = new ApolloArmor({
  maxDepth: {
    enabled: true,
    n: 10, // Maximum query depth
  },
  maxAliases: {
    enabled: true,
    n: 15,
  },
  maxDirectives: {
    enabled: true,
    n: 50,
  },
});

@Module({
  imports: [
    GraphQLModule.forRoot<ApolloDriverConfig>({
      driver: ApolloDriver,
      autoSchemaFile: true,
      ...armor.protect(),
    }),
  ],
})
export class AppModule {}
```

## Complexity Plugin

```typescript
import { Plugin } from '@nestjs/apollo';
import { GraphQLSchemaHost } from '@nestjs/graphql';
import { ApolloServerPlugin, GraphQLRequestListener } from '@apollo/server';
import { GraphQLError } from 'graphql';
import {
  fieldExtensionsEstimator,
  getComplexity,
  simpleEstimator,
} from 'graphql-query-complexity';

@Plugin()
export class ComplexityPlugin implements ApolloServerPlugin {
  constructor(private gqlSchemaHost: GraphQLSchemaHost) {}

  async requestDidStart(): Promise<GraphQLRequestListener<any>> {
    const maxComplexity = 1000;
    const { schema } = this.gqlSchemaHost;

    return {
      async didResolveOperation({ request, document }) {
        const complexity = getComplexity({
          schema,
          operationName: request.operationName,
          query: document,
          variables: request.variables,
          estimators: [
            fieldExtensionsEstimator(),
            simpleEstimator({ defaultComplexity: 1 }),
          ],
        });

        if (complexity > maxComplexity) {
          throw new GraphQLError(
            `Query is too complex: ${complexity}. Maximum allowed: ${maxComplexity}`,
            {
              extensions: { code: 'GRAPHQL_VALIDATION_FAILED' },
            },
          );
        }
      },
    };
  }
}
```

Register the plugin:

```typescript
@Module({
  imports: [
    GraphQLModule.forRoot<ApolloDriverConfig>({
      driver: ApolloDriver,
      autoSchemaFile: true,
    }),
  ],
  providers: [ComplexityPlugin],
})
export class AppModule {}
```

## Depth Limiting

```bash
npm install graphql-depth-limit
```

```typescript
import depthLimit from 'graphql-depth-limit';

GraphQLModule.forRoot<ApolloDriverConfig>({
  driver: ApolloDriver,
  autoSchemaFile: true,
  validationRules: [depthLimit(10)],
})
```

## Field-Level Complexity

Assign complexity to specific fields:

```typescript
@ObjectType()
export class User {
  @Field(() => [Post], { complexity: 10 })
  posts: Post[];
}

// Or with resolver
@ResolveField(() => [Post], { complexity: (options) => options.args.first * 2 })
async posts(@Parent() user: User, @Args('first') first: number) {
  return this.postsService.findByUser(user.id, first);
}
```

## Best Practices

1. **Set maxListDepth Low** - Start with 2-4; users rarely need deeper
2. **Track Queries** - Log complexity to find optimal limits
3. **Start Low, Increase as Needed** - Begin restrictive, loosen based on usage
4. **Monitor Query Patterns** - Log for identifying attacks or inefficiency
5. **Combine Multiple Protections** - Use both depth and complexity limiting

## Example Protection Configuration

```typescript
const armor = new ApolloArmor({
  maxDepth: { enabled: true, n: 10 },
  maxAliases: { enabled: true, n: 15 },
  maxDirectives: { enabled: true, n: 50 },
  costLimit: { enabled: true, maxCost: 1000 },
  maxTokens: { enabled: true, n: 1000 },
});

GraphQLModule.forRoot<ApolloDriverConfig>({
  driver: ApolloDriver,
  autoSchemaFile: true,
  validationRules: [depthLimit(10)],
  ...armor.protect(),
})
```
