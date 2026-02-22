# GraphQL Subscriptions

GraphQL Yoga supports subscriptions natively via Server-Sent Events (SSE). No extra WebSocket packages required for basic use.

## Configuration (SSE -- Default)

```typescript
import { Module } from '@nestjs/common';
import { GraphQLModule } from '@nestjs/graphql';
import { YogaDriver, YogaDriverConfig } from '@graphql-yoga/nestjs';

@Module({
  imports: [
    GraphQLModule.forRoot<YogaDriverConfig>({
      driver: YogaDriver,
      autoSchemaFile: true,
      // Subscriptions work out of the box via SSE
    }),
  ],
})
export class AppModule {}
```

## WebSocket Support (Optional)

For `graphql-ws` clients that require WebSocket transport:

```bash
npm install graphql-ws
```

```typescript
GraphQLModule.forRoot<YogaDriverConfig>({
  driver: YogaDriver,
  autoSchemaFile: true,
  subscriptions: {
    'graphql-ws': true, // Enable WS alongside SSE
  },
})
```

## Basic Subscription

```typescript
import { Resolver, Subscription, Mutation, Args } from '@nestjs/graphql';
import { PubSub } from 'graphql-subscriptions';
import { Inject } from '@nestjs/common';

const pubSub = new PubSub();

@Resolver()
export class NotificationsResolver {
  @Subscription(() => String)
  notificationAdded() {
    return pubSub.asyncIterableIterator('notificationAdded');
  }

  @Mutation(() => Boolean)
  async addNotification(
    @Args('message', { type: () => String }) message: string,
  ): Promise<boolean> {
    await pubSub.publish('notificationAdded', { notificationAdded: message });
    return true;
  }
}
```

## Typed Subscription

```typescript
@ObjectType()
export class Notification {
  @Field(() => ID)
  id!: string;

  @Field(() => String)
  message!: string;

  @Field(() => Date)
  createdAt!: Date;
}

@Resolver()
export class NotificationsResolver {
  @Subscription(() => Notification)
  notificationCreated() {
    return pubSub.asyncIterableIterator('notificationCreated');
  }

  @Mutation(() => Notification)
  async createNotification(
    @Args('message', { type: () => String }) message: string,
  ): Promise<Notification> {
    const notification = {
      id: Date.now().toString(),
      message,
      createdAt: new Date(),
    };
    await pubSub.publish('notificationCreated', { notificationCreated: notification });
    return notification;
  }
}
```

## @Subscription Options

| Option | Type | Description |
|--------|------|-------------|
| `() => Type` | Function | Return type |
| `filter` | `(payload, variables, context) => boolean` | Filter events |
| `resolve` | `(payload) => any` | Transform payload |
| `name` | `string` | Subscription name |
| `nullable` | `boolean` | Can be null |
| `description` | `string` | Schema docs |

## Filtering Subscriptions

```typescript
@Subscription(() => Comment, {
  filter: (payload, variables) => {
    return payload.commentAdded.postId === variables.postId;
  },
})
commentAdded(@Args('postId', { type: () => ID }) postId: string) {
  return pubSub.asyncIterableIterator('commentAdded');
}
```

## Resolving Subscription Payloads

```typescript
@Subscription(() => User, {
  resolve: (value) => value.userUpdated,
})
userUpdated() {
  return pubSub.asyncIterableIterator('userUpdated');
}
```

## PubSub as Injectable Provider

```typescript
const PUB_SUB = 'PUB_SUB';

@Module({
  providers: [
    { provide: PUB_SUB, useValue: new PubSub() },
    NotificationsResolver,
  ],
})
export class NotificationsModule {}

@Resolver()
export class NotificationsResolver {
  constructor(@Inject(PUB_SUB) private pubSub: PubSub) {}

  @Subscription(() => Notification)
  notificationCreated() {
    return this.pubSub.asyncIterableIterator('notificationCreated');
  }
}
```

## Authentication in Subscriptions

### SSE (Default)

SSE uses regular HTTP, so standard auth headers work:

```typescript
GraphQLModule.forRoot<YogaDriverConfig>({
  driver: YogaDriver,
  autoSchemaFile: true,
  context: ({ req }: { req: Request }) => ({ req }),
})
```

### WebSocket (graphql-ws)

```typescript
GraphQLModule.forRoot<YogaDriverConfig>({
  driver: YogaDriver,
  autoSchemaFile: true,
  subscriptions: {
    'graphql-ws': {
      onConnect: (context: any) => {
        const { connectionParams, extra } = context;
        const authToken = connectionParams?.Authorization;
        if (!authToken) throw new Error('Missing auth token');
        extra.user = validateToken(authToken);
      },
    },
  },
})
```

## Production: Redis PubSub

In-memory PubSub does not work across multiple instances. Use Redis for production:

```bash
npm install graphql-redis-subscriptions ioredis
```

```typescript
import { RedisPubSub } from 'graphql-redis-subscriptions';
import Redis from 'ioredis';

const pubSub = new RedisPubSub({
  publisher: new Redis({ host: 'localhost', port: 6379 }),
  subscriber: new Redis({ host: 'localhost', port: 6379 }),
});
```

## SSE vs WebSocket

| Feature | SSE (Default) | WebSocket |
|---------|--------------|-----------|
| Setup | Zero config | Requires `graphql-ws` |
| Transport | HTTP/2 compatible | Upgrade handshake |
| Auth | Standard HTTP headers | connectionParams |
| Reconnection | Automatic | Manual |
| Load balancing | Standard | Sticky sessions required |
| Direction | Server -> Client only | Bidirectional |

---

**Version:** @nestjs/graphql 13.2.x + graphql-yoga 5.18.x | **Source:** https://docs.nestjs.com/graphql/subscriptions
