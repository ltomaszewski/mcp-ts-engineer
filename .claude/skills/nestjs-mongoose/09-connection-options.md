# NestJS Mongoose: Connection Options & Monitoring

**Production configuration, connection pooling, monitoring, multiple databases, and read preferences.**

---

## Full Production Configuration

```typescript
import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';

@Module({
  imports: [
    MongooseModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        uri: config.getOrThrow<string>('MONGODB_URI'),

        // Connection pool
        maxPoolSize: config.get<number>('MONGO_MAX_POOL', 100),
        minPoolSize: config.get<number>('MONGO_MIN_POOL', 10),

        // Timeouts
        serverSelectionTimeoutMS: 5000,
        socketTimeoutMS: 45000,
        connectTimeoutMS: 10000,

        // Write safety
        retryWrites: true,
        retryReads: true,
        w: 'majority',

        // Networking
        family: 4,

        // Auth
        authSource: 'admin',

        // Read preference
        readPreference: 'primary',

        // App metadata
        appName: config.get<string>('APP_NAME', 'my-app'),

        // Production: disable auto-index
        autoIndex: config.get<string>('NODE_ENV') !== 'production',
      }),
    }),
  ],
})
export class DatabaseModule {}
```

---

## Connection Pool Sizing

| Environment | maxPoolSize | minPoolSize | Rationale |
|-------------|-------------|-------------|-----------|
| Development | `10` | `2` | Low traffic |
| Staging | `50` | `5` | Moderate traffic |
| Production | `100` | `10` | Standard production |
| High Traffic | `200` | `50` | High concurrency |

**Formula:** `maxPoolSize ~= peak concurrent requests * 1.5`

Each connection in the pool corresponds to one socket. MongoDB allows one operation per socket at a time.

---

## Connection Options Reference

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `maxPoolSize` | `number` | `100` | Max connections |
| `minPoolSize` | `number` | `0` | Maintained idle connections |
| `maxIdleTimeMS` | `number` | `0` | Max idle time per connection |
| `serverSelectionTimeoutMS` | `number` | `30000` | Server selection timeout |
| `socketTimeoutMS` | `number` | `0` | Socket inactivity timeout |
| `connectTimeoutMS` | `number` | `30000` | Initial connection timeout |
| `heartbeatFrequencyMS` | `number` | `10000` | Connection status check interval |
| `retryWrites` | `boolean` | `true` | Retry failed writes |
| `retryReads` | `boolean` | `true` | Retry failed reads |
| `w` | `string \| number` | `1` | Write concern |
| `journal` | `boolean` | `false` | Wait for journal |
| `readPreference` | `string` | `'primary'` | Read preference |
| `authSource` | `string` | auto | Auth database |
| `appName` | `string` | none | Connection metadata |
| `family` | `4 \| 6` | auto | IP version preference |
| `autoIndex` | `boolean` | `true` | Auto-create indexes |
| `bufferCommands` | `boolean` | `true` | Buffer ops until connected |
| `dbName` | `string` | from URI | Override database name |
| `compressors` | `string[]` | none | Compression (`['zstd', 'snappy']`) |

---

## Connection Events

| Event | Description |
|-------|-------------|
| `connecting` | Initial connection attempt starting |
| `connected` | Successfully established |
| `open` | Connected + model initialization complete |
| `disconnected` | Lost MongoDB connectivity |
| `reconnected` | Automatic reconnection succeeded |
| `error` | Connection errors |
| `close` | Connection fully closed |
| `disconnecting` | Explicit disconnection requested |

---

## Connection Monitoring

```typescript
import { Injectable, OnModuleInit, Logger } from '@nestjs/common';
import { InjectConnection } from '@nestjs/mongoose';
import { Connection } from 'mongoose';

@Injectable()
export class DatabaseMonitor implements OnModuleInit {
  private readonly logger = new Logger(DatabaseMonitor.name);

  constructor(
    @InjectConnection() private readonly connection: Connection,
  ) {}

  onModuleInit(): void {
    this.connection.on('connected', () => {
      this.logger.log('MongoDB connected');
    });

    this.connection.on('disconnected', () => {
      this.logger.warn('MongoDB disconnected');
    });

    this.connection.on('error', (err: Error) => {
      this.logger.error(`MongoDB error: ${err.message}`);
    });

    this.connection.on('reconnected', () => {
      this.logger.log('MongoDB reconnected');
    });
  }

  getStatus(): { state: string; host: string | undefined } {
    const states: Record<number, string> = {
      0: 'disconnected',
      1: 'connected',
      2: 'connecting',
      3: 'disconnecting',
    };

    return {
      state: states[this.connection.readyState] ?? 'unknown',
      host: this.connection.host,
    };
  }
}
```

---

## Multiple Database Connections

```typescript
@Module({
  imports: [
    MongooseModule.forRoot(primaryUri, { connectionName: 'primary' }),
    MongooseModule.forRoot(analyticsUri, { connectionName: 'analytics' }),
  ],
})
export class AppModule {}

// Register schemas on specific connection
MongooseModule.forFeature(
  [{ name: User.name, schema: UserSchema }],
  'primary',
)

MongooseModule.forFeature(
  [{ name: Event.name, schema: EventSchema }],
  'analytics',
)

// Inject from specific connection
@InjectModel(User.name, 'primary') private userModel: Model<UserDocument>
@InjectConnection('analytics') private analyticsConnection: Connection
```

---

## Read Preference Options

| Preference | Description | Use Case |
|------------|-------------|----------|
| `'primary'` | Only read from primary | Strong consistency |
| `'primaryPreferred'` | Prefer primary, fallback secondary | Default for most apps |
| `'secondary'` | Only read from secondary | Read-heavy analytics |
| `'secondaryPreferred'` | Prefer secondary, fallback primary | Reduce primary load |
| `'nearest'` | Read from nearest node | Low latency priority |

---

## Mongoose 9 Migration: Connection Changes

- **`noListener` option removed** from `useDb()` — only `{ useCache }` is supported now
- **`keepAlive`** was deprecated in Mongoose 7.2 and remains unsupported; TCP keepalive is always enabled
- **`serverSelectionTimeoutMS`** affects both initial connection and query operations (no independent tuning)
- **Node.js 18+** required — Mongoose 9 dropped support for older Node.js versions
- No changes to connection pooling, events, or monitoring APIs

---

**See Also**: [01-setup.md](01-setup.md) for initial setup
**Source**: https://mongoosejs.com/docs/connections.html
**Version**: @nestjs/mongoose 11.x, Mongoose 9.x
