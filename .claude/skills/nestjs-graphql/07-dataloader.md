# DataLoader -- Solving the N+1 Problem

The N+1 problem occurs when fetching related data results in one query per item instead of a single batch query.

## The Problem

```typescript
// Without DataLoader: For 100 posts, this makes 101 queries!
@ResolveField(() => User)
async author(@Parent() post: Post) {
  return this.usersService.findById(post.authorId); // 1 query per post
}
```

## Installation

```bash
npm install dataloader
```

## Request-Scoped DataLoader

```typescript
import { Injectable, Inject, Scope } from '@nestjs/common';
import DataLoader from 'dataloader';
import { UsersService } from './users.service';

@Injectable({ scope: Scope.REQUEST }) // CRITICAL: Request-scoped
export class UsersLoader {
  constructor(@Inject(UsersService) private usersService: UsersService) {}

  public readonly batchUsers = new DataLoader<string, User | null>(
    async (userIds: readonly string[]) => {
      // Single query for all users
      const users = await this.usersService.findByIds([...userIds]);

      // IMPORTANT: Results must be in same order as input keys
      const userMap = new Map(users.map((user) => [user.id, user]));
      return userIds.map((id) => userMap.get(id) ?? null);
    },
  );
}
```

## Batch Method in Service

```typescript
@Injectable()
export class UsersService {
  constructor(
    @InjectModel(User.name) private userModel: Model<UserDocument>,
  ) {}

  async findByIds(ids: string[]): Promise<User[]> {
    return this.userModel.find({ _id: { $in: ids } }).exec();
  }
}
```

## Using in Resolver

```typescript
import { Resolver, ResolveField, Parent } from '@nestjs/graphql';
import { Inject } from '@nestjs/common';

@Resolver(() => Post)
export class PostsResolver {
  constructor(@Inject(UsersLoader) private usersLoader: UsersLoader) {}

  @ResolveField(() => User, { nullable: true })
  async author(@Parent() post: Post): Promise<User | null> {
    return this.usersLoader.batchUsers.load(post.authorId);
  }
}
```

## Multiple DataLoaders in One Class

```typescript
@Injectable({ scope: Scope.REQUEST })
export class PostsLoader {
  constructor(@Inject(PostsService) private postsService: PostsService) {}

  public readonly batchPostsByAuthor = new DataLoader<string, Post[]>(
    async (authorIds: readonly string[]) => {
      const posts = await this.postsService.findByAuthorIds([...authorIds]);
      const postsMap = new Map<string, Post[]>();

      for (const post of posts) {
        const existing = postsMap.get(post.authorId) ?? [];
        existing.push(post);
        postsMap.set(post.authorId, existing);
      }

      return authorIds.map((id) => postsMap.get(id) ?? []);
    },
  );

  public readonly batchPostById = new DataLoader<string, Post | null>(
    async (postIds: readonly string[]) => {
      const posts = await this.postsService.findByIds([...postIds]);
      const postMap = new Map(posts.map((p) => [p.id, p]));
      return postIds.map((id) => postMap.get(id) ?? null);
    },
  );
}
```

## DataLoader Options

```typescript
new DataLoader<string, User | null>(batchFn, {
  cache: true,            // Enable per-request caching (default: true)
  maxBatchSize: 100,      // Max keys per batch call
  batchScheduleFn: (cb) => setTimeout(cb, 0), // Custom batch scheduling
});
```

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `cache` | `boolean` | `true` | Cache results within request |
| `maxBatchSize` | `number` | `Infinity` | Max keys per batch |
| `batchScheduleFn` | `Function` | `process.nextTick` | Batch scheduling |
| `cacheKeyFn` | `Function` | identity | Custom cache key |

## Module Registration

```typescript
@Module({
  imports: [SchemasModule],
  providers: [
    UsersService,
    UsersLoader,     // Register loader as provider
    UsersResolver,
    PostsResolver,
  ],
  exports: [UsersService, UsersLoader],
})
export class UsersModule {}
```

## Performance Impact

| Scenario | Without DataLoader | With DataLoader |
|----------|-------------------|-----------------|
| 10 posts, 5 authors | 11 queries | 2 queries |
| 100 posts, 50 authors | 101 queries | 2 queries |
| 1000 posts, 100 authors | 1001 queries | 2 queries |

## DataLoader Contract

The batch function MUST:
1. Return an array with the **same length** as the input keys
2. Return values in the **same order** as the input keys
3. Return `null` or `new Error()` for missing keys

```typescript
// CORRECT -- same length and order
async (ids) => {
  const items = await db.find({ _id: { $in: ids } });
  const map = new Map(items.map(i => [i.id, i]));
  return ids.map(id => map.get(id) ?? null); // null for missing
};

// WRONG -- different length/order
async (ids) => {
  return db.find({ _id: { $in: ids } }); // May return fewer items!
};
```

## Best Practices

| Practice | Rationale |
|----------|-----------|
| Request-scoped (`Scope.REQUEST`) | Prevents data leaks between users |
| Single batch query | Ensure batch function makes ONE db call |
| Maintain order | Return results matching input key order |
| Handle missing keys | Return `null` for missing, never `undefined` |
| Clear on mutation | Call `loader.clear(id)` after mutations |
| Export loaders | Other modules may need them |

---

**Version:** dataloader 2.x + @nestjs/graphql 13.2.x | **Source:** https://docs.nestjs.com/graphql/complexity#dataloader
