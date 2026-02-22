# 06 - Error Handling

**Source:** https://www.typescriptlang.org/docs/handbook/release-notes/typescript-4-6.html
**TypeScript:** 5.9 | **Status:** Complete reference

---

## Custom Error Classes

```typescript
/**
 * Base error class for application errors.
 */
export abstract class AppError extends Error {
  abstract readonly statusCode: number;
  abstract readonly isOperational: boolean;

  constructor(
    message: string,
    public readonly context?: Record<string, unknown>
  ) {
    super(message);
    this.name = this.constructor.name;
    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * Error thrown when a requested resource is not found.
 */
export class NotFoundError extends AppError {
  readonly statusCode = 404;
  readonly isOperational = true;

  constructor(resource: string, id: string) {
    super(`${resource} with id '${id}' not found`, { resource, id });
  }
}

/**
 * Error thrown when validation fails.
 */
export class ValidationError extends AppError {
  readonly statusCode = 400;
  readonly isOperational = true;

  constructor(
    message: string,
    public readonly errors: Array<{ field: string; message: string }>
  ) {
    super(message, { errors });
  }
}
```

## Preserve Stack Traces

```typescript
// Use ES2022 cause property
async function fetchUserData(userId: string): Promise<User> {
  try {
    const response = await fetch(`/api/users/${userId}`);
    return await response.json();
  } catch (error) {
    throw new Error(`Failed to fetch user ${userId}`, { cause: error });
  }
}

// tsconfig.json must target ES2022+
{
  "compilerOptions": {
    "target": "ES2022",
    "lib": ["ES2022"]
  }
}
```

## Always Throw Error Instances

```typescript
// BAD: Throwing primitives
throw 'Something went wrong';
throw 404;
throw { message: 'Error' };

// GOOD: Throw Error instances
throw new Error('Something went wrong');
throw new NotFoundError('User', userId);
throw new ValidationError('Invalid input', errors);
```

## Result Type Pattern

```typescript
/**
 * Represents either a success or failure result.
 */
type Result<T, E extends Error = Error> =
  | { success: true; data: T }
  | { success: false; error: E };

/**
 * Creates a success result.
 */
function ok<T>(data: T): Result<T, never> {
  return { success: true, data };
}

/**
 * Creates a failure result.
 */
function fail<E extends Error>(error: E): Result<never, E> {
  return { success: false, error };
}

// Usage
async function findUser(id: string): Promise<Result<User, NotFoundError>> {
  const user = await repository.findById(id);
  if (!user) {
    return fail(new NotFoundError('User', id));
  }
  return ok(user);
}

// Consuming
const result = await findUser('123');
if (result.success) {
  console.log(result.data.name);
} else {
  console.error(result.error.message);
}
```

## Narrow Unknown Errors

```typescript
// TypeScript 4.0+ uses unknown for catch
try {
  await riskyOperation();
} catch (error) {
  // BAD: Assuming error type
  console.log(error.message); // Error: 'unknown' has no 'message'

  // GOOD: Narrow the type
  if (error instanceof Error) {
    console.log(error.message);
  } else {
    console.log(String(error));
  }
}
```

## Error Handling Hierarchy

```typescript
// Specific to generic
try {
  await processPayment(order);
} catch (error) {
  if (error instanceof InsufficientFundsError) {
    // Handle specific case
    return notifyUserInsufficientFunds();
  }
  if (error instanceof PaymentGatewayError) {
    // Handle gateway errors
    return retryPayment(order);
  }
  if (error instanceof AppError) {
    // Handle known operational errors
    logger.warn('Operation failed', error);
    throw error;
  }
  // Unknown errors - log and rethrow
  logger.error('Unexpected error', error);
  throw error;
}
```

## Don't Swallow Errors

```typescript
// BAD: Silently swallowing
try {
  await riskyOperation();
} catch {
  // Nothing happens - error is lost
}

// GOOD: At minimum, log
try {
  await riskyOperation();
} catch (error) {
  logger.error('Operation failed', error);
  // Either rethrow or handle appropriately
}
```

## NestJS Exception Handling

```typescript
import {
  HttpException,
  HttpStatus,
  NotFoundException,
  BadRequestException,
  UnauthorizedException,
} from '@nestjs/common';

// Use built-in exceptions
throw new NotFoundException('User not found');
throw new BadRequestException('Invalid input');
throw new UnauthorizedException('Access denied');

// Custom exception with details
throw new HttpException(
  {
    status: HttpStatus.FORBIDDEN,
    error: 'Access forbidden',
    details: { resource: 'users', action: 'delete' },
  },
  HttpStatus.FORBIDDEN
);
```

### Custom Exception Filter

```typescript
import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
} from '@nestjs/common';

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse();
    const request = ctx.getRequest();

    const status = exception instanceof HttpException
      ? exception.getStatus()
      : HttpStatus.INTERNAL_SERVER_ERROR;

    const message = exception instanceof Error
      ? exception.message
      : 'Internal server error';

    response.status(status).json({
      statusCode: status,
      message,
      timestamp: new Date().toISOString(),
      path: request.url,
    });
  }
}
```

---

**Source:** https://www.typescriptlang.org/docs/handbook/release-notes/typescript-4-6.html
**TypeScript:** 5.9
**Last Updated:** February 2026
