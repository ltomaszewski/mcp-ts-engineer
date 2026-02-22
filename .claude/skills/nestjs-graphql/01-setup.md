# NestJS GraphQL Setup

Installation and configuration with GraphQL Yoga driver.

## Installation

```bash
npm i @nestjs/graphql @graphql-yoga/nestjs graphql-yoga graphql
```

## Package Compatibility

| Package | Version | Purpose |
|---------|---------|---------|
| `@nestjs/graphql` | ^13.2.4 | NestJS GraphQL integration |
| `@graphql-yoga/nestjs` | ^3.19.0 | Yoga driver for NestJS |
| `graphql-yoga` | ^5.18.0 | Underlying GraphQL server |
| `graphql` | ^16.12.0 | GraphQL.js runtime |

## Code-First Configuration

```typescript
import { Module } from '@nestjs/common';
import { GraphQLModule } from '@nestjs/graphql';
import { YogaDriver, YogaDriverConfig } from '@graphql-yoga/nestjs';
import { join } from 'path';

@Module({
  imports: [
    GraphQLModule.forRoot<YogaDriverConfig>({
      driver: YogaDriver,
      autoSchemaFile: join(process.cwd(), 'src/schema.gql'),
      graphiql: true,
      // Or generate in memory:
      // autoSchemaFile: true,
    }),
  ],
})
export class AppModule {}
```

## GraphQLModule.forRoot Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `driver` | `Type<GqlModuleOptions>` | required | `YogaDriver` |
| `autoSchemaFile` | `string \| boolean` | -- | Code-first: path or `true` for in-memory |
| `sortSchema` | `boolean` | `false` | Alphabetically sort schema |
| `graphiql` | `boolean` | `false` | Enable built-in GraphiQL IDE |
| `introspection` | `boolean` | `true` | Allow schema introspection |
| `path` | `string` | `'/graphql'` | GraphQL endpoint path |
| `include` | `Function[]` | -- | Modules to include in this schema |
| `typePaths` | `string[]` | -- | Schema-first: paths to `.graphql` files |
| `definitions` | `object` | -- | Schema-first: generated types output |
| `context` | `Function \| object` | -- | Context factory for resolvers |
| `formatError` | `Function` | -- | Custom error formatting |
| `plugins` | `any[]` | -- | Envelop/Yoga plugins |
| `cors` | `object \| boolean` | -- | CORS configuration |
| `validationRules` | `Function[]` | -- | Custom GraphQL validation rules |
| `maskedErrors` | `boolean \| object` | `true` | Yoga error masking (see 06-error-handling) |

## Async Configuration

```typescript
import { ConfigModule, ConfigService } from '@nestjs/config';

GraphQLModule.forRootAsync<YogaDriverConfig>({
  driver: YogaDriver,
  imports: [ConfigModule],
  inject: [ConfigService],
  useFactory: (configService: ConfigService) => ({
    autoSchemaFile: true,
    sortSchema: true,
    introspection: configService.get('NODE_ENV') !== 'production',
    graphiql: configService.get('NODE_ENV') !== 'production',
    context: ({ req }: { req: Request }) => ({ req }),
  }),
})
```

## Context Configuration

The context factory provides data to all resolvers:

```typescript
GraphQLModule.forRoot<YogaDriverConfig>({
  driver: YogaDriver,
  autoSchemaFile: true,
  context: ({ req }: { req: Request }) => ({ req }),
  // req.user is populated by Passport after JWT validation
})
```

## Envelop Plugins

GraphQL Yoga uses the Envelop plugin ecosystem:

```typescript
import { useDisableIntrospection } from '@envelop/disable-introspection';

GraphQLModule.forRoot<YogaDriverConfig>({
  driver: YogaDriver,
  autoSchemaFile: true,
  plugins: [
    useDisableIntrospection(),
  ],
})
```

## Multiple GraphQL Endpoints

```typescript
@Module({
  imports: [
    GraphQLModule.forRoot<YogaDriverConfig>({
      driver: YogaDriver,
      autoSchemaFile: 'userSchema.gql',
      include: [UsersModule],
      path: '/graphql/users',
    }),
    GraphQLModule.forRoot<YogaDriverConfig>({
      driver: YogaDriver,
      autoSchemaFile: 'adminSchema.gql',
      include: [AdminModule],
      path: '/graphql/admin',
    }),
  ],
})
export class AppModule {}
```

## Schema-First Configuration

```typescript
GraphQLModule.forRoot<YogaDriverConfig>({
  driver: YogaDriver,
  typePaths: ['./**/*.graphql'],
  definitions: {
    path: join(process.cwd(), 'src/graphql.ts'),
    outputAs: 'class',
  },
})
```

### Custom Type Naming (13.2.0+)

Apply custom transformations to generated type names to avoid naming conflicts:

```typescript
import { GraphQLDefinitionsFactory } from '@nestjs/graphql';

const definitionsFactory = new GraphQLDefinitionsFactory();
definitionsFactory.generate({
  typePaths: ['./src/**/*.graphql'],
  path: join(process.cwd(), 'src/graphql.ts'),
  typeName: (name: string) => `${name}Schema`,
  // User -> UserSchema, CreateUserInput -> CreateUserInputSchema
  // Root types (Query, Mutation, Subscription) are unaffected
});
```

## Code-First vs Schema-First

| Aspect | Code-First | Schema-First |
|--------|-----------|--------------|
| Source | TypeScript decorators | `.graphql` SDL files |
| Type Safety | Full compile-time checking | Generated types |
| Workflow | Define classes first | Define schema first |
| Best For | TypeScript-heavy projects | GraphQL-first teams |
| Validation | class-validator on InputTypes | Custom validators |

---

**Version:** @nestjs/graphql 13.2.x + @graphql-yoga/nestjs 3.19.x + graphql-yoga 5.18.x | **Source:** https://docs.nestjs.com/graphql/quick-start
