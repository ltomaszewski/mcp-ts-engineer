# GraphQL Subscriptions

Subscriptions enable real-time updates via WebSocket connections.

## Installation

```bash
npm install graphql-ws
```

## Configuration

```typescript
import { Module } from '@nestjs/common';
import { GraphQLModule } from '@nestjs/graphql';
import { ApolloDriver, ApolloDriverConfig } from '@nestjs/apollo';

@Module({
  imports: [
    GraphQLModule.forRoot<ApolloDriverConfig>({
      driver: ApolloDriver,
      autoSchemaFile: true,
      subscriptions: {
        'graphql-ws': true, // Enable WebSocket subscriptions
      },
    }),
  ],
})
export class AppModule {}
```

## Basic Implementation

```typescript
import { Resolver, Subscription, Mutation, Args } from '@nestjs/graphql';
import { PubSub } from 'graphql-subscriptions';

const pubSub = new PubSub();

@Resolver()
export class NotificationsResolver {
  @Subscription(() => String)
  notificationAdded() {
    return pubSub.asyncIterator('notificationAdded');
  }

  @Mutation(() => Boolean)
  async addNotification(@Args('message') message: string) {
    await pubSub.publish('notificationAdded', { notificationAdded: message });
    return true;
  }
}
```

## Typed Subscriptions

```typescript
@ObjectType()
export class Notification {
  @Field()
  id: string;

  @Field()
  message: string;

  @Field()
  createdAt: Date;
}

@Resolver()
export class NotificationsResolver {
  @Subscription(() => Notification)
  notificationCreated() {
    return pubSub.asyncIterator('notificationCreated');
  }

  @Mutation(() => Notification)
  async createNotification(@Args('message') message: string) {
    const notification = {
      id: Date.now().toString(),
      message,
      createdAt: new Date(),
    };

    await pubSub.publish('notificationCreated', {
      notificationCreated: notification,
    });

    return notification;
  }
}
```

## Filtering Subscriptions

```typescript
@Subscription(() => Comment, {
  filter: (payload, variables) => {
    return payload.commentAdded.postId === variables.postId;
  },
})
commentAdded(@Args('postId') postId: string) {
  return pubSub.asyncIterator('commentAdded');
}
```

## Resolving Subscription Payloads

```typescript
@Subscription(() => User, {
  resolve: (value) => value.userUpdated,
})
userUpdated() {
  return pubSub.asyncIterator('userUpdated');
}
```

## Authentication in Subscriptions

```typescript
GraphQLModule.forRoot<ApolloDriverConfig>({
  driver: ApolloDriver,
  autoSchemaFile: true,
  subscriptions: {
    'graphql-ws': {
      onConnect: (context: Context) => {
        const { connectionParams, extra } = context;
        const authToken = connectionParams?.Authorization;

        if (!authToken) {
          throw new Error('Missing auth token');
        }

        // Validate token and attach user
        extra.user = validateToken(authToken);
      },
    },
  },
})
```

Access user in subscription:

```typescript
@Subscription(() => Message)
messageReceived(@Context() context) {
  const user = context.extra.user;
  // Filter by user...
  return pubSub.asyncIterator(`message.${user.id}`);
}
```

## Production: Redis PubSub

The default in-memory PubSub doesn't work across multiple instances:

```bash
npm install graphql-redis-subscriptions ioredis
```

```typescript
import { RedisPubSub } from 'graphql-redis-subscriptions';
import Redis from 'ioredis';

const options = {
  host: 'localhost',
  port: 6379,
};

const pubSub = new RedisPubSub({
  publisher: new Redis(options),
  subscriber: new Redis(options),
});
```

## Important Notes

- **Protocol**: `graphql-ws` and `subscriptions-transport-ws` are incompatible
- **GraphiQL**: Requires `graphql-ws` (subscriptions-transport-ws not supported)
- **Load Balancing**: Session affinity (sticky sessions) required behind load balancers
- **Memory**: In-memory PubSub only works for single-instance deployments
- **Use Redis**: For production with multiple instances

## Client Connection

```typescript
import { createClient } from 'graphql-ws';

const client = createClient({
  url: 'ws://localhost:3000/graphql',
  connectionParams: {
    Authorization: `Bearer ${token}`,
  },
});

// Subscribe
const unsubscribe = client.subscribe(
  {
    query: `subscription { notificationAdded }`,
  },
  {
    next: (data) => console.log(data),
    error: (err) => console.error(err),
    complete: () => console.log('completed'),
  },
);
```
