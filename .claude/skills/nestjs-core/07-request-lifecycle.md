# Request Lifecycle & Execution Order

The request flows through components in this exact order:

**Middleware -> Guards -> Before Interceptors -> Pipes -> Controllers/Resolvers -> Services -> After Interceptors -> Exception Filters**

## 1. Middleware (First)

Middleware executes **before** the request reaches the route handler. Has access to `req`, `res`, and `next`. Does not have access to `ExecutionContext`.

```typescript
import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';

@Injectable()
export class LoggerMiddleware implements NestMiddleware {
  use(req: Request, res: Response, next: NextFunction): void {
    console.log(`${req.method} ${req.path}`);
    next();
  }
}
```

### Registering Middleware

```typescript
import { Module, NestModule, MiddlewareConsumer, RequestMethod } from '@nestjs/common';

export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer): void {
    consumer
      .apply(LoggerMiddleware, CorsMiddleware)
      .exclude({ path: 'health', method: RequestMethod.GET })
      .forRoutes('*');
  }
}
```

### MiddlewareConsumer Methods

| Method | Description |
|--------|-------------|
| `apply(...middleware)` | Register one or more middleware classes or functions |
| `exclude(...routes)` | Exclude specific routes from middleware |
| `forRoutes(...routes)` | Apply to specific routes, controllers, or `'*'` for all |

**Execution order:** Global middleware (`app.use()`) -> Module-bound middleware (in binding order)

## 2. Guards (After Middleware)

Guards execute **after all middleware**, **before interceptors or pipes**. They determine if a request should proceed. Have access to `ExecutionContext`.

```typescript
import { Injectable, CanActivate, ExecutionContext, Inject } from '@nestjs/common';
import { Reflector } from '@nestjs/core';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(@Inject(Reflector) private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const roles = this.reflector.getAllAndOverride<string[]>('roles', [
      context.getHandler(),
      context.getClass(),
    ]);
    if (!roles?.length) return true;
    const { user } = context.switchToHttp().getRequest();
    return roles.some((role) => user.roles?.includes(role));
  }
}
```

**Execution order:** Global -> Controller -> Route

## 3. Interceptors (Before and After Handler)

Interceptors wrap the request-response lifecycle using RxJS. They resolve in **First In Last Out (FILO)** manner.

```typescript
import { Injectable, NestInterceptor, ExecutionContext, CallHandler } from '@nestjs/common';
import { Observable, tap } from 'rxjs';

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const now = Date.now();
    console.log('Before handler...');

    return next.handle().pipe(
      tap(() => console.log(`After handler... ${Date.now() - now}ms`)),
    );
  }
}
```

**Before handler:** Global -> Controller -> Route
**After handler:** Route -> Controller -> Global (FILO)

### Common Interceptor Patterns

| Pattern | Purpose | Example |
|---------|---------|---------|
| Logging | Time and log requests | `LoggingInterceptor` |
| Transform | Modify response shape | `TransformInterceptor` |
| Cache | Return cached responses | `CacheInterceptor` |
| Timeout | Abort slow requests | `TimeoutInterceptor` |
| Error mapping | Transform exceptions | `ErrorsInterceptor` |

## 4. Pipes (Before Route Handler)

Pipes execute **after Guards**, **before the route handler**. They transform and/or validate request data.

```typescript
import { PipeTransform, Injectable, ArgumentMetadata, BadRequestException } from '@nestjs/common';

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

### Built-in Pipes

| Pipe | Purpose |
|------|---------|
| `ValidationPipe` | Validate and transform DTOs via class-validator |
| `ParseIntPipe` | Parse string to integer |
| `ParseFloatPipe` | Parse string to float |
| `ParseBoolPipe` | Parse string to boolean |
| `ParseArrayPipe` | Parse and validate arrays |
| `ParseUUIDPipe` | Validate UUID strings |
| `ParseEnumPipe` | Validate enum values |
| `DefaultValuePipe` | Provide default when value is undefined |

**Execution order:** Global -> Controller -> Route -> Parameter

## 5. Exception Filters (Last)

Filters catch unhandled exceptions. They resolve from **lowest level first** (opposite of everything else).

**Execution order:** Route -> Controller -> Global

## Complete Visual Flow

```
Incoming Request
    |
[Global Middleware]        ← app.use()
    |
[Module Middleware]        ← consumer.apply().forRoutes()
    |
[Global Guards]            ← APP_GUARD or app.useGlobalGuards()
    |
[Controller Guards]        ← @UseGuards() on class
    |
[Route Guards]             ← @UseGuards() on method
    |
[Global Interceptors ↓]   ← APP_INTERCEPTOR or app.useGlobalInterceptors()
    |
[Controller Interceptors ↓]
    |
[Route Interceptors ↓]
    |
[Global Pipes]             ← APP_PIPE or app.useGlobalPipes()
    |
[Controller Pipes]
    |
[Route Pipes]
    |
[Parameter Pipes]          ← @Param('id', ParseIntPipe)
    |
[Controller/Resolver Handler]
    |
[Service Layer]
    |
[Route Interceptors ↑]    (FILO)
    |
[Controller Interceptors ↑]
    |
[Global Interceptors ↑]
    |
Response

If Exception Thrown:
[Route Exception Filter]   ← Lowest level first
    |
[Controller Exception Filter]
    |
[Global Exception Filter]
```

## Registration Methods Comparison

| Component | `app.useGlobal*()` | `APP_*` token | `@Use*()` decorator |
|-----------|-------------------|---------------|---------------------|
| Supports DI | No | Yes | Yes |
| Scope | All routes | All routes | Controller/Method |
| Registration | `main.ts` | Module providers | Decorator |

## GraphQL Request Context

For GraphQL, the execution context differs:

```typescript
import { ExecutionContext } from '@nestjs/common';
import { GqlExecutionContext } from '@nestjs/graphql';

// Inside a guard or interceptor
const gqlContext = GqlExecutionContext.create(context);
const { req } = gqlContext.getContext();
const args = gqlContext.getArgs();
const info = gqlContext.getInfo();
```

---

**Version:** NestJS 11.x | **Source:** https://docs.nestjs.com/faq/request-lifecycle
