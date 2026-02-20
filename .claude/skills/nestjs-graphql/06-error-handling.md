# GraphQL Error Handling

## formatError

Customize error responses:

```typescript
import { GraphQLError } from 'graphql';

GraphQLModule.forRoot<ApolloDriverConfig>({
  driver: ApolloDriver,
  autoSchemaFile: true,
  formatError: (error: GraphQLError) => {
    const originalError = error.extensions?.originalError as any;

    // Don't expose internal errors in production
    if (process.env.NODE_ENV === 'production' &&
        error.extensions?.code === 'INTERNAL_SERVER_ERROR') {
      return {
        message: 'An unexpected error occurred',
        code: error.extensions?.code,
      };
    }

    return {
      message: originalError?.message || error.message,
      code: error.extensions?.code,
      locations: error.locations,
      path: error.path,
    };
  },
})
```

## Important: Use GraphQLError Instead of HttpException

Throwing NestJS `HttpException` results in `INTERNAL_SERVER_ERROR` in GraphQL:

```typescript
import { GraphQLError } from 'graphql';

// WRONG - Results in INTERNAL_SERVER_ERROR
throw new NotFoundException('User not found');

// CORRECT - Proper GraphQL error
throw new GraphQLError('User not found', {
  extensions: { code: 'NOT_FOUND' },
});
```

## Custom Exception Filter

```typescript
import { Catch, ArgumentsHost } from '@nestjs/common';
import { GqlExceptionFilter, GqlArgumentsHost } from '@nestjs/graphql';
import { GraphQLError } from 'graphql';

@Catch()
export class GraphQLErrorFilter implements GqlExceptionFilter {
  catch(exception: any, host: ArgumentsHost) {
    const gqlHost = GqlArgumentsHost.create(host);

    console.error('GraphQL Error:', exception);

    if (exception.status) {
      return new GraphQLError(exception.message, {
        extensions: {
          code: this.mapHttpStatusToGraphQLCode(exception.status),
          status: exception.status,
        },
      });
    }

    return exception;
  }

  private mapHttpStatusToGraphQLCode(status: number): string {
    switch (status) {
      case 400: return 'BAD_USER_INPUT';
      case 401: return 'UNAUTHENTICATED';
      case 403: return 'FORBIDDEN';
      case 404: return 'NOT_FOUND';
      default: return 'INTERNAL_SERVER_ERROR';
    }
  }
}
```

Register globally:

```typescript
import { APP_FILTER } from '@nestjs/core';

@Module({
  providers: [
    {
      provide: APP_FILTER,
      useClass: GraphQLErrorFilter,
    },
  ],
})
export class AppModule {}
```

## Throwing Errors with Extensions

```typescript
throw new GraphQLError('User not found', {
  extensions: {
    code: 'USER_NOT_FOUND',
    userId: id,
    timestamp: new Date().toISOString(),
  },
});
```

## Error Response Format

GraphQL returns partial data with errors:

```json
{
  "data": {
    "user": {
      "id": "1",
      "name": "John",
      "posts": null
    }
  },
  "errors": [
    {
      "message": "Failed to load posts",
      "path": ["user", "posts"],
      "extensions": {
        "code": "INTERNAL_SERVER_ERROR"
      }
    }
  ]
}
```

## Apollo Server 5 Fix

Apollo Server 4 had a regression with validation errors. Fix in v5:

```typescript
GraphQLModule.forRoot<ApolloDriverConfig>({
  driver: ApolloDriver,
  autoSchemaFile: true,
  status400ForVariableCoercionErrors: true, // Fix for 400 errors
})
```

## Best Practices

1. **Use GraphQLError for throwing** - Not HttpException
2. **Map HTTP to GraphQL codes** - BAD_USER_INPUT, UNAUTHENTICATED, FORBIDDEN
3. **Don't expose internals** - Hide sensitive info in production
4. **Log errors server-side** - Use exception filters for logging
5. **Include meaningful extensions** - Add context without exposing secrets
6. **Handle validation errors** - Let pipes transform to proper GraphQL errors
