# NestJS Mongoose: Setup

**Module installation, root configuration, feature module registration, and multiple database connections.**

---

## Installation

```bash
npm install @nestjs/mongoose mongoose
```

**Requirements:** Node.js 18+ (Mongoose 9 minimum), MongoDB 4.4+ recommended.

---

## Basic Configuration

```typescript
import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';

@Module({
  imports: [
    MongooseModule.forRoot('mongodb://localhost:27017/demo'),
  ],
})
export class AppModule {}
```

---

## Async Configuration (Production)

```typescript
import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    MongooseModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        uri: configService.getOrThrow<string>('MONGODB_URI'),
        maxPoolSize: 100,
        minPoolSize: 10,
        serverSelectionTimeoutMS: 5000,
        socketTimeoutMS: 45000,
        connectTimeoutMS: 10000,
        retryWrites: true,
        retryReads: true,
        w: 'majority',
        appName: configService.get<string>('APP_NAME', 'my-app'),
      }),
      inject: [ConfigService],
    }),
  ],
})
export class AppModule {}
```

---

## forRoot / forRootAsync Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `uri` | `string` | required | MongoDB connection string |
| `connectionName` | `string` | `'default'` | Named connection identifier |
| `maxPoolSize` | `number` | `100` | Max connections in pool |
| `minPoolSize` | `number` | `0` | Min connections in pool |
| `serverSelectionTimeoutMS` | `number` | `30000` | Time to find suitable server |
| `socketTimeoutMS` | `number` | `0` | Inactivity timeout on socket |
| `connectTimeoutMS` | `number` | `30000` | Initial connection timeout |
| `retryWrites` | `boolean` | `true` | Retry failed writes |
| `retryReads` | `boolean` | `true` | Retry failed reads |
| `w` | `string \| number` | `1` | Write concern (`'majority'` for prod) |
| `readPreference` | `string` | `'primary'` | Read preference |
| `authSource` | `string` | `undefined` | Auth database |
| `appName` | `string` | `undefined` | App name in connection metadata |
| `autoIndex` | `boolean` | `true` | **Set `false` in production** |
| `bufferCommands` | `boolean` | `true` | Buffer operations until connected |
| `dbName` | `string` | from URI | Override database name |
| `family` | `4 \| 6` | auto | IP version preference |
| `heartbeatFrequencyMS` | `number` | `10000` | Connection status check interval |
| `maxIdleTimeMS` | `number` | `0` | Max idle time per connection |
| `compressors` | `string[]` | none | Compression (`['zstd', 'snappy']`) |

---

## Register Schemas in Feature Modules

```typescript
import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { User, UserSchema } from './schemas/user.schema';
import { UsersService } from './users.service';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: User.name, schema: UserSchema },
    ]),
  ],
  providers: [UsersService],
  exports: [UsersService],
})
export class UsersModule {}
```

---

## forFeature Options

| Option | Type | Description |
|--------|------|-------------|
| `name` | `string` | Schema class name (use `ClassName.name`) |
| `schema` | `Schema` | Mongoose schema instance |
| `collection` | `string` | Override collection name |
| `discriminators` | `DiscriminatorOptions[]` | Schema inheritance |

---

## Multiple Database Connections

```typescript
import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';

@Module({
  imports: [
    MongooseModule.forRoot('mongodb://localhost/primary', {
      connectionName: 'primary',
    }),
    MongooseModule.forRoot('mongodb://localhost/analytics', {
      connectionName: 'analytics',
    }),
  ],
})
export class AppModule {}

// Feature module using named connection
@Module({
  imports: [
    MongooseModule.forFeature(
      [{ name: Event.name, schema: EventSchema }],
      'analytics',  // connection name
    ),
  ],
})
export class AnalyticsModule {}
```

---

## Mongoose 9 Migration: Setup Changes

- **Node.js 18+** required (Mongoose 9 dropped support for older versions)
- **`noListener`** option removed from `useDb()` — only `{ useCache }` is supported
- **`background`** index option removed (deprecated since MongoDB 4.2)
- No changes to `MongooseModule.forRoot` or `forFeature` API from @nestjs/mongoose perspective

---

**See Also**: [09-connection-options.md](09-connection-options.md) for connection pool sizing and monitoring
**Source**: https://docs.nestjs.com/techniques/mongodb
**Version**: @nestjs/mongoose 11.x, Mongoose 9.x
