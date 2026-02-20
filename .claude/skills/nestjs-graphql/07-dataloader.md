# DataLoader - Solving the N+1 Problem

The N+1 problem occurs when fetching related data results in multiple database queries.

## The Problem

```typescript
// Without DataLoader: For 10 posts, this makes 11 queries!
@ResolveField(() => User)
async author(@Parent() post: Post) {
  return this.usersService.findById(post.authorId); // Query for each post!
}
```

## Installation

```bash
npm install dataloader
npm install nestjs-dataloader
```

## Implementing DataLoader

### Create a Loader

```typescript
// users.loader.ts
import * as DataLoader from 'dataloader';
import { Injectable, Scope } from '@nestjs/common';
import { UsersService } from './users.service';

@Injectable({ scope: Scope.REQUEST }) // IMPORTANT: Request-scoped!
export class UsersLoader {
  constructor(private usersService: UsersService) {}

  public readonly batchUsers = new DataLoader(async (userIds: number[]) => {
    // Single query for all users
    const users = await this.usersService.findByIds(userIds);

    // IMPORTANT: Results must be in same order as input keys
    const userMap = new Map(users.map(user => [user.id, user]));
    return userIds.map(id => userMap.get(id) || null);
  });
}
```

### Service with Batch Method

```typescript
// users.service.ts
async findByIds(ids: number[]): Promise<User[]> {
  return this.userRepository.find({
    where: { id: In(ids) },
  });
}
```

### Use in Resolver

```typescript
@Resolver(() => Post)
export class PostsResolver {
  constructor(private usersLoader: UsersLoader) {}

  @ResolveField(() => User)
  async author(@Parent() post: Post) {
    // All author loads are batched!
    return this.usersLoader.batchUsers.load(post.authorId);
  }
}
```

## Using nestjs-dataloader Package

### Register Interceptor

```typescript
import { DataLoaderInterceptor } from 'nestjs-dataloader';

@Module({
  providers: [
    {
      provide: APP_INTERCEPTOR,
      useClass: DataLoaderInterceptor,
    },
  ],
})
export class AppModule {}
```

### Create Loader

```typescript
import { NestDataLoader } from 'nestjs-dataloader';
import * as DataLoader from 'dataloader';

@Injectable()
export class UserLoader implements NestDataLoader<number, User> {
  constructor(private usersService: UsersService) {}

  generateDataLoader(): DataLoader<number, User> {
    return new DataLoader<number, User>(async keys => {
      const users = await this.usersService.findByIds([...keys]);
      const userMap = new Map(users.map(user => [user.id, user]));
      return keys.map(key => userMap.get(key));
    });
  }
}
```

### Use with Decorator

```typescript
import { Loader } from 'nestjs-dataloader';

@ResolveField(() => User)
async author(
  @Parent() post: Post,
  @Loader(UserLoader) userLoader: DataLoader<number, User>,
) {
  return userLoader.load(post.authorId);
}
```

## Performance Impact

- **Without DataLoader**: 1,000 posts with 100 unique authors = 1,001 queries
- **With DataLoader**: 1,000 posts with 100 unique authors = 2 queries

Up to **80% performance improvement** in certain scenarios.

## Best Practices

1. **Request-Scoped** - Always use `scope: Scope.REQUEST` to prevent data leaks
2. **Order Matters** - Return results in same order as input keys (DataLoader contract)
3. **Handle Missing Keys** - Return `null` for missing keys or throw error
4. **Import Syntax** - Use `import * as DataLoader from 'dataloader'`
5. **Single Query** - Ensure batch function makes one database query
6. **Caching** - DataLoader caches during request; be mindful for mutations

## Module Registration

```typescript
@Module({
  imports: [
    MongooseModule.forFeature([{ name: User.name, schema: UserSchema }]),
  ],
  providers: [UsersService, UsersLoader, UsersResolver],
  exports: [UsersService, UsersLoader],
})
export class UsersModule {}
```
