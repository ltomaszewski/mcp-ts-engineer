# Logging Best Practices

## Structured Logging Interface

```typescript
interface LogContext {
  requestId?: string;
  userId?: string;
  operation?: string;
  duration?: number;
  [key: string]: unknown;
}

interface Logger {
  debug(message: string, context?: LogContext): void;
  info(message: string, context?: LogContext): void;
  warn(message: string, context?: LogContext): void;
  error(message: string, error?: Error, context?: LogContext): void;
}
```

## Log Levels

```typescript
// DEBUG: Detailed development information
logger.debug('Processing item', {
  itemId: item.id,
  status: item.status
});

// INFO: General operational events
logger.info('User created successfully', {
  userId: user.id
});

// WARN: Potential issues, not errors
logger.warn('Rate limit approaching', {
  currentRate: 95,
  maxRate: 100
});

// ERROR: Errors that need attention
logger.error('Failed to process payment', error, {
  orderId: order.id,
  amount: order.total
});
```

## Context in Logs

```typescript
async function processOrder(order: Order): Promise<void> {
  const startTime = Date.now();
  const context = {
    orderId: order.id,
    userId: order.userId
  };

  logger.info('Starting order processing', context);

  try {
    await validateOrder(order);
    await processPayment(order);
    await updateInventory(order);

    logger.info('Order processed successfully', {
      ...context,
      duration: Date.now() - startTime,
    });
  } catch (error) {
    logger.error('Order processing failed', error as Error, {
      ...context,
      duration: Date.now() - startTime,
    });
    throw error;
  }
}
```

## Correlation IDs

```typescript
// Generate ID at entry point
function handleRequest(req: Request): void {
  const requestId = req.headers['x-request-id'] || generateUUID();

  // Pass through all operations
  const context = { requestId };

  logger.info('Request received', {
    ...context,
    path: req.path
  });

  processRequest(req, context);
}

// Include in all related logs
function processRequest(req: Request, context: LogContext): void {
  logger.debug('Validating request', context);
  // ...
  logger.debug('Request validated', context);
}
```

## What to Log

**Always log:**
- Request entry/exit with duration
- Authentication events
- Authorization failures
- External service calls
- Business-critical operations
- Errors with full context

**Never log:**
- Passwords or secrets
- Credit card numbers
- Personal data (GDPR)
- Session tokens
- API keys

## Log Message Format

```typescript
// BAD: Vague messages
logger.info('Done');
logger.error('Error occurred');
logger.debug('Processing');

// GOOD: Specific, actionable messages
logger.info('User registration completed', { userId, email });
logger.error('Payment gateway timeout', error, { orderId, attempt: 3 });
logger.debug('Cache miss, fetching from database', { key, ttl });
```

## Performance Considerations

```typescript
// Avoid expensive operations in log calls
// BAD: JSON.stringify runs even if debug is disabled
logger.debug('User data', { user: JSON.stringify(largeUserObject) });

// GOOD: Check level first or use lazy evaluation
if (logger.isDebugEnabled()) {
  logger.debug('User data', { user: JSON.stringify(largeUserObject) });
}

// Or use structured logging that handles serialization
logger.debug('User data', { user: largeUserObject });
```

## Environment-Based Configuration

```typescript
const logLevel = process.env.NODE_ENV === 'production'
  ? 'info'
  : 'debug';

const logger = createLogger({
  level: logLevel,
  format: process.env.NODE_ENV === 'production'
    ? 'json'  // Machine-readable in production
    : 'pretty', // Human-readable in development
});
```

## NestJS Built-in Logger

```typescript
import { Logger, Injectable } from '@nestjs/common';

@Injectable()
export class UserService {
  private readonly logger = new Logger(UserService.name);

  async createUser(data: CreateUserDto): Promise<User> {
    this.logger.log(`Creating user: ${data.email}`);

    try {
      const user = await this.repository.create(data);
      this.logger.log(`User created: ${user.id}`);
      return user;
    } catch (error) {
      this.logger.error(
        `Failed to create user: ${data.email}`,
        error.stack
      );
      throw error;
    }
  }
}

// Logger methods
// this.logger.log()     - General info
// this.logger.error()   - Errors (accepts stack trace)
// this.logger.warn()    - Warnings
// this.logger.debug()   - Debug info
// this.logger.verbose() - Verbose output
```

### Custom Logger Implementation

```typescript
import { LoggerService, Injectable } from '@nestjs/common';

@Injectable()
export class CustomLogger implements LoggerService {
  log(message: string, context?: string): void {
    console.log(`[${context}] ${message}`);
  }

  error(message: string, trace?: string, context?: string): void {
    console.error(`[${context}] ${message}`, trace);
  }

  warn(message: string, context?: string): void {
    console.warn(`[${context}] ${message}`);
  }

  debug(message: string, context?: string): void {
    console.debug(`[${context}] ${message}`);
  }

  verbose(message: string, context?: string): void {
    console.log(`[${context}] ${message}`);
  }
}

// Use in main.ts
const app = await NestFactory.create(AppModule, {
  logger: new CustomLogger(),
});
```
