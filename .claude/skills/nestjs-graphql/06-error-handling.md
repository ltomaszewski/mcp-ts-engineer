# GraphQL Error Handling

Error handling patterns specific to GraphQL with Yoga driver.

## IMPORTANT: Use GraphQLError, Not HttpException

NestJS `HttpException` results in `INTERNAL_SERVER_ERROR` in GraphQL. Always use `GraphQLError`:

```typescript
import { GraphQLError } from 'graphql';

// WRONG -- results in generic INTERNAL_SERVER_ERROR
throw new NotFoundException('User not found');

// CORRECT -- proper GraphQL error with extensions
throw new GraphQLError('User not found', {
  extensions: { code: 'NOT_FOUND' },
});
```

## GraphQLError Options

```typescript
throw new GraphQLError('Error message', {
  extensions: {
    code: 'CUSTOM_ERROR_CODE',
    http: { status: 400 },      // Optional: HTTP status hint
    userId: id,                   // Custom metadata
    timestamp: new Date().toISOString(),
  },
  path: ['user', 'email'],       // Optional: error path
});
```

### Standard Error Codes

| Code | HTTP Equivalent | When |
|------|----------------|------|
| `BAD_USER_INPUT` | 400 | Invalid input data |
| `UNAUTHENTICATED` | 401 | Missing/invalid auth |
| `FORBIDDEN` | 403 | Insufficient permissions |
| `NOT_FOUND` | 404 | Resource not found |
| `INTERNAL_SERVER_ERROR` | 500 | Unexpected errors |
| `GRAPHQL_PARSE_FAILED` | 400 | Invalid query syntax |
| `GRAPHQL_VALIDATION_FAILED` | 400 | Schema validation failure |

## Custom Error Formatting

```typescript
GraphQLModule.forRoot<YogaDriverConfig>({
  driver: YogaDriver,
  autoSchemaFile: true,
  formatError: (error: GraphQLError) => {
    const originalError = error.extensions?.originalError as any;

    // Hide internal errors in production
    if (
      process.env.NODE_ENV === 'production' &&
      error.extensions?.code === 'INTERNAL_SERVER_ERROR'
    ) {
      return {
        message: 'An unexpected error occurred',
        extensions: { code: 'INTERNAL_SERVER_ERROR' },
      };
    }

    return {
      message: originalError?.message ?? error.message,
      extensions: {
        code: error.extensions?.code,
      },
      locations: error.locations,
      path: error.path,
    };
  },
})
```

## Custom Exception Filter for GraphQL

Catch NestJS exceptions and convert them to GraphQLError:

```typescript
import { Catch, ArgumentsHost } from '@nestjs/common';
import { GqlExceptionFilter, GqlArgumentsHost } from '@nestjs/graphql';
import { GraphQLError } from 'graphql';
import { HttpException } from '@nestjs/common';

@Catch()
export class GraphQLErrorFilter implements GqlExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    const gqlHost = GqlArgumentsHost.create(host);

    if (exception instanceof HttpException) {
      const status = exception.getStatus();
      return new GraphQLError(exception.message, {
        extensions: {
          code: this.mapStatusToCode(status),
          status,
        },
      });
    }

    if (exception instanceof GraphQLError) {
      return exception;
    }

    // Unknown errors
    return new GraphQLError('Internal server error', {
      extensions: { code: 'INTERNAL_SERVER_ERROR' },
    });
  }

  private mapStatusToCode(status: number): string {
    const map: Record<number, string> = {
      400: 'BAD_USER_INPUT',
      401: 'UNAUTHENTICATED',
      403: 'FORBIDDEN',
      404: 'NOT_FOUND',
      409: 'CONFLICT',
      422: 'BAD_USER_INPUT',
      429: 'TOO_MANY_REQUESTS',
    };
    return map[status] ?? 'INTERNAL_SERVER_ERROR';
  }
}

// Register globally
@Module({
  providers: [
    { provide: APP_FILTER, useClass: GraphQLErrorFilter },
  ],
})
export class AppModule {}
```

## Yoga Error Masking

GraphQL Yoga masks unexpected errors by default in production for security:

```typescript
GraphQLModule.forRoot<YogaDriverConfig>({
  driver: YogaDriver,
  autoSchemaFile: true,
  maskedErrors: {
    isDev: process.env.NODE_ENV !== 'production',
  },
})
```

## Error Response Format

GraphQL returns partial data alongside errors:

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

## Service-Level Error Throwing

```typescript
@Injectable()
export class UsersService {
  async findById(id: string): Promise<User> {
    const user = await this.userModel.findById(id);
    if (!user) {
      throw new GraphQLError(`User ${id} not found`, {
        extensions: { code: 'NOT_FOUND', userId: id },
      });
    }
    return user;
  }

  async create(input: CreateUserInput): Promise<User> {
    const existing = await this.userModel.findOne({ email: input.email });
    if (existing) {
      throw new GraphQLError('Email already registered', {
        extensions: { code: 'BAD_USER_INPUT', field: 'email' },
      });
    }
    return this.userModel.create(input);
  }
}
```

## Best Practices

| Practice | Rationale |
|----------|-----------|
| Use `GraphQLError` | Proper error format for GraphQL clients |
| Map HTTP codes to GQL codes | Consistent error handling |
| Hide internals in production | Don't expose stack traces |
| Include error extensions | Add context without exposing secrets |
| Log errors server-side | Use exception filters for logging |
| Use error masking | Yoga's built-in security feature |

---

**Version:** @nestjs/graphql 13.x + graphql-yoga 5.x | **Source:** https://docs.nestjs.com/graphql/other-features#exception-filters
