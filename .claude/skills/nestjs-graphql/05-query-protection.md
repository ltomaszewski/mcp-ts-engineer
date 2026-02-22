# Query Protection

Protecting GraphQL APIs against malicious queries with depth limiting, complexity analysis, and GraphQL Armor.

## GraphQL Armor (Recommended)

Provides Envelop plugins that work natively with GraphQL Yoga.

```bash
npm install @escape.tech/graphql-armor
```

```typescript
import { EnvelopArmorPlugin } from '@escape.tech/graphql-armor';

@Module({
  imports: [
    GraphQLModule.forRoot<YogaDriverConfig>({
      driver: YogaDriver,
      autoSchemaFile: true,
      plugins: [
        EnvelopArmorPlugin({
          maxDepth: { enabled: true, n: 10 },
          maxAliases: { enabled: true, n: 15 },
          maxDirectives: { enabled: true, n: 50 },
          costLimit: { enabled: true, maxCost: 1000 },
          maxTokens: { enabled: true, n: 1000 },
        }),
      ],
    }),
  ],
})
export class AppModule {}
```

### Armor Plugin Options

| Plugin | Option | Default | Description |
|--------|--------|---------|-------------|
| `maxDepth` | `n` | `6` | Maximum query nesting depth |
| `maxAliases` | `n` | `15` | Maximum aliases per query |
| `maxDirectives` | `n` | `50` | Maximum directives per query |
| `costLimit` | `maxCost` | `5000` | Maximum query cost |
| `maxTokens` | `n` | `1000` | Maximum tokens in query |

## Depth Limiting

```bash
npm install graphql-depth-limit
```

```typescript
import depthLimit from 'graphql-depth-limit';

GraphQLModule.forRoot<YogaDriverConfig>({
  driver: YogaDriver,
  autoSchemaFile: true,
  validationRules: [depthLimit(10)],
})
```

## Field-Level Complexity

Assign complexity costs to expensive fields:

```typescript
@ObjectType()
export class User {
  @Field(() => [Post], { complexity: 10 })
  posts!: Post[];
}

// Dynamic complexity based on arguments
@ResolveField(() => [Post], {
  complexity: (options: ComplexityEstimatorArgs) => {
    return (options.args.first ?? 10) * 2;
  },
})
async posts(@Parent() user: User, @Args('first', { type: () => Int, nullable: true }) first?: number) {
  return this.postsService.findByUser(user.id, first);
}
```

## Query Complexity Analysis

```bash
npm install graphql-query-complexity
```

```typescript
import { GraphQLSchemaHost } from '@nestjs/graphql';
import {
  fieldExtensionsEstimator,
  getComplexity,
  simpleEstimator,
} from 'graphql-query-complexity';

@Injectable()
export class ComplexityPlugin {
  constructor(@Inject(GraphQLSchemaHost) private gqlSchemaHost: GraphQLSchemaHost) {}

  analyze(document: any, variables: any): number {
    const { schema } = this.gqlSchemaHost;
    return getComplexity({
      schema,
      query: document,
      variables,
      estimators: [
        fieldExtensionsEstimator(),
        simpleEstimator({ defaultComplexity: 1 }),
      ],
    });
  }
}
```

## Production Configuration

```typescript
GraphQLModule.forRootAsync<YogaDriverConfig>({
  driver: YogaDriver,
  imports: [ConfigModule],
  inject: [ConfigService],
  useFactory: (configService: ConfigService) => ({
    autoSchemaFile: true,
    introspection: configService.get('NODE_ENV') !== 'production',
    graphiql: configService.get('NODE_ENV') !== 'production',
    validationRules: [depthLimit(10)],
    plugins: [
      EnvelopArmorPlugin({
        maxDepth: { enabled: true, n: 10 },
        maxAliases: { enabled: true, n: 15 },
        costLimit: { enabled: true, maxCost: 1000 },
        maxTokens: { enabled: true, n: 1000 },
      }),
    ],
  }),
})
```

## Best Practices

| Practice | Rationale |
|----------|-----------|
| Set maxDepth to 6-10 | Users rarely need deeper nesting |
| Start restrictive | Loosen based on real usage patterns |
| Combine protections | Use both depth and complexity limiting |
| Disable introspection in prod | Reduce attack surface |
| Monitor query patterns | Log complexity to identify abuse |
| Rate limit per IP | Prevent query flooding |

---

**Version:** @escape.tech/graphql-armor + @nestjs/graphql 13.2.x | **Source:** https://docs.nestjs.com/graphql/complexity
