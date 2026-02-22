# NestJS Mongoose Setup

## Installation

```bash
npm install @nestjs/mongoose mongoose
```

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

## forFeature Options

| Option | Type | Description |
|--------|------|-------------|
| `name` | `string` | Schema class name (use `ClassName.name`) |
| `schema` | `Schema` | Mongoose schema instance |
| `collection` | `string` | Override collection name |
| `discriminators` | `DiscriminatorOptions[]` | Schema inheritance |

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

**Version:** @nestjs/mongoose 11.x, Mongoose 8.x | **Source:** https://docs.nestjs.com/techniques/mongodb
