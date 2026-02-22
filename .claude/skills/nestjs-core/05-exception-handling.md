# Exception Handling

NestJS has a built-in exceptions layer that handles all unhandled exceptions across the application.

## Built-in HTTP Exceptions

All extend `HttpException` from `@nestjs/common`:

| Exception | Status | When |
|-----------|--------|------|
| `BadRequestException` | 400 | Invalid input |
| `UnauthorizedException` | 401 | Missing/invalid auth |
| `ForbiddenException` | 403 | Insufficient permissions |
| `NotFoundException` | 404 | Resource not found |
| `NotAcceptableException` | 406 | Unacceptable content type |
| `RequestTimeoutException` | 408 | Request timed out |
| `ConflictException` | 409 | Resource conflict |
| `GoneException` | 410 | Resource no longer available |
| `PayloadTooLargeException` | 413 | Body too large |
| `UnsupportedMediaTypeException` | 415 | Wrong content type |
| `UnprocessableEntityException` | 422 | Validation failure |
| `InternalServerErrorException` | 500 | Unexpected server error |
| `NotImplementedException` | 501 | Not implemented |
| `BadGatewayException` | 502 | Bad gateway |
| `ServiceUnavailableException` | 503 | Service unavailable |
| `GatewayTimeoutException` | 504 | Gateway timeout |
| `HttpVersionNotSupportedException` | 505 | HTTP version unsupported |

```typescript
import { NotFoundException, BadRequestException } from '@nestjs/common';

throw new NotFoundException('User not found');
throw new BadRequestException('Invalid email format');
throw new BadRequestException({ message: 'Validation failed', errors: ['email is invalid'] });
```

## Custom Exception Classes

```typescript
import { BadRequestException } from '@nestjs/common';

export class DuplicatedEmailException extends BadRequestException {
  constructor(email: string) {
    super(`Email ${email} is already registered`);
  }
}

export class InsufficientCreditsException extends BadRequestException {
  constructor(required: number, available: number) {
    super(`Need ${required} credits, only ${available} available`);
  }
}

// Usage
throw new DuplicatedEmailException(dto.email);
```

## Exception Filters

### Catch Specific Exception

```typescript
import { ExceptionFilter, Catch, ArgumentsHost, HttpException } from '@nestjs/common';
import { Request, Response } from 'express';

@Catch(HttpException)
export class HttpExceptionFilter implements ExceptionFilter {
  catch(exception: HttpException, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();
    const status = exception.getStatus();
    const exceptionResponse = exception.getResponse();

    response.status(status).json({
      statusCode: status,
      timestamp: new Date().toISOString(),
      path: request.url,
      message: typeof exceptionResponse === 'string'
        ? exceptionResponse
        : (exceptionResponse as any).message,
    });
  }
}
```

### Catch All Exceptions

```typescript
import { ExceptionFilter, Catch, ArgumentsHost, HttpException, HttpStatus } from '@nestjs/common';

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse();
    const request = ctx.getRequest();

    const status = exception instanceof HttpException
      ? exception.getStatus()
      : HttpStatus.INTERNAL_SERVER_ERROR;

    const message = exception instanceof HttpException
      ? exception.message
      : 'Internal server error';

    response.status(status).json({
      statusCode: status,
      timestamp: new Date().toISOString(),
      path: request.url,
      message,
    });
  }
}
```

## Applying Exception Filters

```typescript
// Method Level
@Post()
@UseFilters(new HttpExceptionFilter())
create(@Body() dto: CreateDto) {}

// Controller Level
@Controller('users')
@UseFilters(new HttpExceptionFilter())
export class UsersController {}

// Global Level (main.ts)
app.useGlobalFilters(new AllExceptionsFilter());

// Global Level (module -- preferred, supports DI)
@Module({
  providers: [{ provide: APP_FILTER, useClass: AllExceptionsFilter }],
})
export class AppModule {}
```

## Filter Execution Order

Filters resolve from lowest level first (opposite of guards/interceptors):
```
Route Filter -> Controller Filter -> Global Filter
```

## GraphQL Exception Filter

For GraphQL, use `GqlExceptionFilter`:

```typescript
import { Catch, ArgumentsHost } from '@nestjs/common';
import { GqlExceptionFilter } from '@nestjs/graphql';
import { GraphQLError } from 'graphql';

@Catch()
export class GraphQLErrorFilter implements GqlExceptionFilter {
  catch(exception: any, host: ArgumentsHost) {
    if (exception instanceof GraphQLError) return exception;
    return new GraphQLError(exception.message ?? 'Internal error', {
      extensions: { code: 'INTERNAL_SERVER_ERROR' },
    });
  }
}
```

## Best Practices

| Practice | Rationale |
|----------|-----------|
| Use custom exception classes | Encapsulate domain-specific errors |
| Global catch-all filter | Consistent error responses |
| Log errors in filters | Centralized error logging |
| Include correlation IDs | Trace errors across services |
| Hide internals in production | Don't expose stack traces |
| Use APP_FILTER provider | Supports dependency injection |

---

**Version:** NestJS 11.x (^11.1.14) | **Source:** https://docs.nestjs.com/exception-filters
