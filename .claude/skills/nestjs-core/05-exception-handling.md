# Exception Handling

NestJS has a built-in exceptions layer that handles all unhandled exceptions across the application.

## Built-in HTTP Exceptions

NestJS offers ready-to-use exception classes:

```typescript
import {
  BadRequestException,
  UnauthorizedException,
  NotFoundException,
  ForbiddenException,
  ConflictException,
  InternalServerErrorException,
} from '@nestjs/common';

// Usage
throw new NotFoundException('User not found');
throw new BadRequestException('Invalid email format');
```

## Custom Exception Classes

Define domain-specific exceptions for business logic clarity:

```typescript
import { BadRequestException } from '@nestjs/common';

export class DuplicatedEmailException extends BadRequestException {
  constructor(email: string) {
    super(`Email ${email} is already registered`);
  }
}

// Usage
throw new DuplicatedEmailException(user.email);
```

## Exception Filters

Exception filters intercept thrown exceptions and take appropriate actions.

### Basic Exception Filter

```typescript
import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException
} from '@nestjs/common';
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
      message: exceptionResponse['message'] || exception.message,
    });
  }
}
```

### Global Exception Filter

```typescript
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
create(@Body() createDto: CreateDto) {}

// Controller Level
@Controller('users')
@UseFilters(new HttpExceptionFilter())
export class UsersController {}

// Global Level (main.ts)
app.useGlobalFilters(new AllExceptionsFilter());
```

## Best Practices (2025)

1. **Centralize error handling** - Use global exception filters for consistency
2. **Log errors to external services** - Integrate with Sentry, Loggly, etc.
3. **Use custom exception classes** - Encapsulate error information
4. **Return meaningful error responses** - Include correlation IDs, timestamps, context
5. **Validation with Pipes** - Let ValidationPipe handle DTO validation errors

### Advanced Error Response Structure

```typescript
{
  "statusCode": 400,
  "timestamp": "2025-01-15T10:30:00.000Z",
  "path": "/api/users",
  "correlationId": "uuid-v4",
  "message": "Validation failed",
  "errors": [
    {
      "field": "email",
      "message": "Invalid email format"
    }
  ]
}
```
