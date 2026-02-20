# Lifecycle Hooks

NestJS organizes the application lifecycle into three phases: **initializing**, **running**, and **terminating**.

## Key Lifecycle Hooks

### 1. onModuleInit()

Called once the host module's dependencies have been resolved.

```typescript
import { Injectable, OnModuleInit } from '@nestjs/common';

@Injectable()
export class UsersService implements OnModuleInit {
  onModuleInit() {
    console.log('UsersModule dependencies initialized');
    // Initialize resources, load cache, etc.
  }
}
```

### 2. onApplicationBootstrap()

Called once all modules have been initialized, but before listening for connections.

```typescript
import { Injectable, OnApplicationBootstrap } from '@nestjs/common';

@Injectable()
export class AppService implements OnApplicationBootstrap {
  onApplicationBootstrap() {
    console.log('Application is bootstrapped');
    // Perform app-wide initialization
  }
}
```

### 3. onModuleDestroy()

Called when the host module is about to be destroyed.

```typescript
import { Injectable, OnModuleDestroy } from '@nestjs/common';

@Injectable()
export class UsersService implements OnModuleDestroy {
  onModuleDestroy() {
    console.log('Cleaning up UsersModule resources');
    // Close connections, clear caches, etc.
  }
}
```

### 4. beforeApplicationShutdown()

Called before the application shutdown signal is processed.

```typescript
import { Injectable, BeforeApplicationShutdown } from '@nestjs/common';

@Injectable()
export class AppService implements BeforeApplicationShutdown {
  beforeApplicationShutdown(signal?: string) {
    console.log(`Received shutdown signal: ${signal}`);
    // Prepare for shutdown
  }
}
```

### 5. onApplicationShutdown()

Called when the application is shutting down.

```typescript
import { Injectable, OnApplicationShutdown } from '@nestjs/common';

@Injectable()
export class AppService implements OnApplicationShutdown {
  onApplicationShutdown(signal?: string) {
    console.log('Application is shutting down');
    // Final cleanup
  }
}
```

## Complete Lifecycle Example

```typescript
@Injectable()
export class DatabaseService implements
  OnModuleInit,
  OnApplicationBootstrap,
  OnModuleDestroy,
  BeforeApplicationShutdown,
  OnApplicationShutdown {

  private connection: Connection;

  async onModuleInit() {
    console.log('1. Module initialized');
    this.connection = await createConnection();
  }

  onApplicationBootstrap() {
    console.log('2. Application bootstrapped');
  }

  onModuleDestroy() {
    console.log('3. Module destroying');
  }

  beforeApplicationShutdown(signal?: string) {
    console.log('4. Before shutdown', signal);
  }

  async onApplicationShutdown(signal?: string) {
    console.log('5. Shutting down', signal);
    await this.connection.close();
  }
}
```

## Best Practices

1. Use `onModuleInit` for resource initialization
2. Use `onApplicationBootstrap` for app-wide setup after all modules are ready
3. Use `onApplicationShutdown` for graceful cleanup (closing DB connections, etc.)
4. Enable shutdown hooks in main.ts: `app.enableShutdownHooks()`
