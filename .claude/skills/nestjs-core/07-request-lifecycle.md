# Request Lifecycle & Execution Order

The request flows through components in this exact order:

**Middleware -> Guards -> Before Interceptors -> Pipes -> Controllers -> Services -> After Interceptors -> Exception Filters**

## 1. Middleware (First)

Middleware executes **before** the request reaches the route handler.

```typescript
import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';

@Injectable()
export class LoggerMiddleware implements NestMiddleware {
  use(req: Request, res: Response, next: NextFunction) {
    console.log('Request...', req.method, req.path);
    next();
  }
}
```

**Execution order:**
- Global middleware (via `app.use()`)
- Module-bound middleware (determined by paths)
- Sequential in binding order

```typescript
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(LoggerMiddleware, AuthMiddleware)
      .forRoutes('*');
  }
}
```

## 2. Guards (After Middleware)

Guards execute **after all middleware**, **before interceptors or pipes**. They determine if a request should proceed.

```typescript
@Injectable()
export class AuthGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean | Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    return this.validateRequest(request);
  }
}
```

**Execution order:** Global -> Controller -> Route

```typescript
// Global
app.useGlobalGuards(new AuthGuard());

// Controller level
@Controller('users')
@UseGuards(RolesGuard)
export class UsersController {}

// Route level
@Get()
@UseGuards(AdminGuard)
findAll() {}
```

## 3. Interceptors (Before and After Handler)

Interceptors wrap the request-response lifecycle using RxJS. They resolve in **First In Last Out (FILO)** manner.

```typescript
@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    console.log('Before...');
    const now = Date.now();

    return next.handle().pipe(
      tap(() => console.log(`After... ${Date.now() - now}ms`)),
    );
  }
}
```

**Before handler:** Global -> Controller -> Route
**After handler:** Route -> Controller -> Global (FILO)

## 4. Pipes (Before Route Handler)

Pipes execute **after Guards**, **before the route handler**. They transform and/or validate request data.

```typescript
@Injectable()
export class ParseIntPipe implements PipeTransform<string, number> {
  transform(value: string, metadata: ArgumentMetadata): number {
    const val = parseInt(value, 10);
    if (isNaN(val)) {
      throw new BadRequestException('Validation failed');
    }
    return val;
  }
}
```

**Execution order:** Global -> Controller -> Route -> Parameter

```typescript
// Parameter level
@Get(':id')
findOne(@Param('id', ParseIntPipe) id: number) {}

// Global level
app.useGlobalPipes(new ValidationPipe());
```

## 5. Exception Filters (Last)

Filters resolve from **lowest level first** (opposite of everything else).

**Execution order:** Route -> Controller -> Global

## Complete Visual Flow

```
Incoming Request
    |
[Global Middleware]
    |
[Module Middleware]
    |
[Global Guards]
    |
[Controller Guards]
    |
[Route Guards]
    |
[Global Interceptors - Before]
    |
[Controller Interceptors - Before]
    |
[Route Interceptors - Before]
    |
[Global Pipes]
    |
[Controller Pipes]
    |
[Route Pipes]
    |
[Parameter Pipes]
    |
[Controller Route Handler]
    |
[Service Layer]
    |
[Route Interceptors - After] (FILO)
    |
[Controller Interceptors - After] (FILO)
    |
[Global Interceptors - After] (FILO)
    |
Response

If Exception:
[Route Exception Filter]
    |
[Controller Exception Filter]
    |
[Global Exception Filter]
```
