# Lifecycle Hooks

NestJS organizes the application lifecycle into three phases: **initializing**, **running**, and **terminating**.

## Lifecycle Sequence

```
Constructor
    |
onModuleInit()
    |
onApplicationBootstrap()
    |
--- Application is running ---
    |
onModuleDestroy()          (triggered by app.close() or shutdown signal)
    |
beforeApplicationShutdown(signal?)
    |
onApplicationShutdown(signal?)
```

## Hook Summary

| Hook | Interface | Phase | When Called |
|------|-----------|-------|------------|
| `onModuleInit` | `OnModuleInit` | Init | After host module's dependencies resolved |
| `onApplicationBootstrap` | `OnApplicationBootstrap` | Init | After all modules initialized, before listening |
| `onModuleDestroy` | `OnModuleDestroy` | Shutdown | When `app.close()` called or signal received |
| `beforeApplicationShutdown` | `BeforeApplicationShutdown` | Shutdown | After `onModuleDestroy`, connections still open |
| `onApplicationShutdown` | `OnApplicationShutdown` | Shutdown | After all connections closed |

## Hook Implementations

### onModuleInit

Called once the host module's dependencies have been resolved. Use for resource initialization.

```typescript
import { Injectable, OnModuleInit, Inject } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class CacheService implements OnModuleInit {
  private cache: Map<string, unknown>;

  constructor(
    @Inject(ConfigService) private readonly configService: ConfigService,
  ) {}

  async onModuleInit(): Promise<void> {
    this.cache = new Map();
    const preloadKeys = this.configService.get<string[]>('cache.preloadKeys', []);
    for (const key of preloadKeys) {
      await this.preload(key);
    }
  }

  private async preload(key: string): Promise<void> {
    // Load initial cache data
  }
}
```

### onApplicationBootstrap

Called once all modules have been initialized, but before listening for connections.

```typescript
import { Injectable, OnApplicationBootstrap, Inject } from '@nestjs/common';
import { Logger } from '@nestjs/common';

@Injectable()
export class AppService implements OnApplicationBootstrap {
  private readonly logger = new Logger(AppService.name);

  onApplicationBootstrap(): void {
    this.logger.log('Application bootstrapped, all modules ready');
  }
}
```

### onModuleDestroy

Called when `app.close()` is invoked or a system signal is received (requires `enableShutdownHooks`).

```typescript
import { Injectable, OnModuleDestroy } from '@nestjs/common';

@Injectable()
export class SubscriptionService implements OnModuleDestroy {
  private subscriptions: Set<string> = new Set();

  onModuleDestroy(): void {
    for (const sub of this.subscriptions) {
      this.unsubscribe(sub);
    }
    this.subscriptions.clear();
  }

  private unsubscribe(id: string): void {
    // Cleanup subscription
  }
}
```

### beforeApplicationShutdown

Called after `onModuleDestroy`. Connections (HTTP, WebSocket) are still open. Receives the signal string if triggered by OS signal.

```typescript
import { Injectable, BeforeApplicationShutdown } from '@nestjs/common';

@Injectable()
export class GracefulShutdownService implements BeforeApplicationShutdown {
  async beforeApplicationShutdown(signal?: string): Promise<void> {
    console.log(`Shutdown signal: ${signal}`);
    // Finish processing in-flight requests
    await this.drainRequests();
  }

  private async drainRequests(): Promise<void> {
    // Wait for pending requests to complete
  }
}
```

### onApplicationShutdown

Called after all connections are closed. Final cleanup step.

```typescript
import { Injectable, OnApplicationShutdown, Inject } from '@nestjs/common';

@Injectable()
export class DatabaseService implements OnApplicationShutdown {
  constructor(
    @Inject('DATABASE_CONNECTION') private readonly connection: any,
  ) {}

  async onApplicationShutdown(signal?: string): Promise<void> {
    await this.connection.close();
    console.log(`Database closed (signal: ${signal})`);
  }
}
```

## Complete Lifecycle Example

```typescript
import {
  Injectable, Inject,
  OnModuleInit, OnApplicationBootstrap,
  OnModuleDestroy, BeforeApplicationShutdown, OnApplicationShutdown,
} from '@nestjs/common';

@Injectable()
export class DatabaseService implements
  OnModuleInit,
  OnApplicationBootstrap,
  OnModuleDestroy,
  BeforeApplicationShutdown,
  OnApplicationShutdown {

  private connection: any;

  constructor(
    @Inject('DATABASE_URI') private readonly uri: string,
  ) {}

  async onModuleInit(): Promise<void> {
    this.connection = await createConnection(this.uri);
    console.log('1. Database connection created');
  }

  onApplicationBootstrap(): void {
    console.log('2. Application bootstrapped, DB ready');
  }

  async onModuleDestroy(): Promise<void> {
    console.log('3. Module destroying, preparing cleanup');
  }

  async beforeApplicationShutdown(signal?: string): Promise<void> {
    console.log(`4. Before shutdown (signal: ${signal}), draining connections`);
  }

  async onApplicationShutdown(signal?: string): Promise<void> {
    await this.connection.close();
    console.log('5. Database connection closed');
  }
}
```

## Enabling Shutdown Hooks

Shutdown hooks are **not enabled by default**. Enable them in `main.ts`:

```typescript
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create(AppModule);

  // Enable shutdown hooks (SIGINT, SIGTERM)
  app.enableShutdownHooks();

  await app.listen(3000);
}
bootstrap();
```

**Note:** `enableShutdownHooks()` consumes memory by starting listeners. If running multiple NestJS instances in a single process (e.g., testing), enable selectively.

## Hook Execution Order Across Modules

Hooks execute in module dependency order:

| Phase | Order |
|-------|-------|
| `onModuleInit` | Dependency-first (leaves before root) |
| `onApplicationBootstrap` | Dependency-first (leaves before root) |
| `onModuleDestroy` | Reverse dependency order (root before leaves) |
| `beforeApplicationShutdown` | Reverse dependency order |
| `onApplicationShutdown` | Reverse dependency order |

## Async Logger Compatibility (v11.1.10+)

NestJS 11.1.10 added async logger compatibility. Custom loggers that perform async operations (e.g., writing to external services) are now better supported during lifecycle events. The framework properly awaits async log flushes during shutdown.

## Best Practices

| Practice | Rationale |
|----------|-----------|
| Use `onModuleInit` for resource initialization | Module deps are resolved, safe to initialize |
| Use `onApplicationBootstrap` for cross-module setup | All modules are ready |
| Use `onApplicationShutdown` for final cleanup | Close DB connections, flush logs |
| Always `enableShutdownHooks()` in production | Graceful shutdown on SIGTERM |
| Keep hooks async when doing I/O | NestJS awaits async hooks |
| Log lifecycle events | Aids debugging startup/shutdown issues |

---

**Version:** NestJS 11.x (^11.1.14) | **Source:** https://docs.nestjs.com/fundamentals/lifecycle-events
