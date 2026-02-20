# NestJS GraphQL Setup

## Installation

```bash
npm i @nestjs/graphql @nestjs/apollo @apollo/server @as-integrations/express5 graphql
```

## Package Compatibility (2025)

- `@nestjs/apollo@13.2.1` requires `@apollo/server@^5.0.0`
- `@nestjs/graphql v12.2.2` supports NestJS v11
- GraphQL.js v16.11.0+ required for Apollo Server 5

## Important 2025 Update

**Apollo playground is deprecated** and will be removed in the next major release. Use GraphiQL:

```typescript
import { ApolloDriver, ApolloDriverConfig } from '@nestjs/apollo';
import { Module } from '@nestjs/common';
import { GraphQLModule } from '@nestjs/graphql';

@Module({
  imports: [
    GraphQLModule.forRoot<ApolloDriverConfig>({
      driver: ApolloDriver,
      graphiql: true, // Use GraphiQL instead of deprecated playground
      autoSchemaFile: 'schema.gql',
    }),
  ],
})
export class AppModule {}
```

**Note:** If using subscriptions, you must use `graphql-ws` as `subscriptions-transport-ws` isn't supported by GraphiQL.

## Code-First Configuration

```typescript
import { ApolloDriver, ApolloDriverConfig } from '@nestjs/apollo';
import { join } from 'path';

@Module({
  imports: [
    GraphQLModule.forRoot<ApolloDriverConfig>({
      driver: ApolloDriver,
      autoSchemaFile: join(process.cwd(), 'src/schema.gql'),
      // Or generate in memory:
      // autoSchemaFile: true,
    }),
  ],
})
export class AppModule {}
```

## Schema-First Configuration

```typescript
GraphQLModule.forRoot<ApolloDriverConfig>({
  driver: ApolloDriver,
  typePaths: ['./**/*.graphql'],
  definitions: {
    path: join(process.cwd(), 'src/graphql.ts'),
  },
})
```

## Async Configuration

```typescript
GraphQLModule.forRootAsync<ApolloDriverConfig>({
  driver: ApolloDriver,
  imports: [ConfigModule],
  inject: [ConfigService],
  useFactory: async (configService: ConfigService) => ({
    autoSchemaFile: true,
    sortSchema: true,
    introspection: configService.get('NODE_ENV') !== 'production',
    graphiql: true,
  }),
})
```

## Apollo Server 5 Landing Page

```typescript
import {
  ApolloServerPluginLandingPageLocalDefault,
  ApolloServerPluginLandingPageProductionDefault,
} from '@apollo/server/plugin/landingPage/default';

GraphQLModule.forRoot<ApolloDriverConfig>({
  driver: ApolloDriver,
  autoSchemaFile: true,
  plugins: [
    process.env.NODE_ENV === 'production'
      ? ApolloServerPluginLandingPageProductionDefault({ footer: false })
      : ApolloServerPluginLandingPageLocalDefault({ footer: false }),
  ],
})
```

## Multiple Endpoints

```typescript
@Module({
  imports: [
    GraphQLModule.forRoot<ApolloDriverConfig>({
      driver: ApolloDriver,
      autoSchemaFile: 'userSchema.gql',
      include: [UserModule],
      path: '/graphql/user',
    }),
    GraphQLModule.forRoot<ApolloDriverConfig>({
      driver: ApolloDriver,
      autoSchemaFile: 'messageSchema.gql',
      include: [MessagesModule],
      path: '/graphql/messages',
    }),
  ],
})
export class AppModule {}
```

## Key Differences: Code-First vs Schema-First

| Aspect | Code-First | Schema-First |
|--------|-----------|--------------|
| Source | TypeScript decorators | .graphql SDL files |
| Type Safety | Full compile-time checking | Generated types |
| Workflow | Define classes first | Define schema first |
| Best For | TypeScript-heavy projects | GraphQL-first teams |
