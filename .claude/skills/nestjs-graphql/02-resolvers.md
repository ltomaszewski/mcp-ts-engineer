# GraphQL Resolvers

Resolvers provide instructions for turning GraphQL operations into data.

## Basic Resolver

```typescript
import { Resolver, Query, Mutation, Args, Int } from '@nestjs/graphql';
import { User } from './models/user.model';
import { UsersService } from './users.service';
import { CreateUserInput } from './dto/create-user.input';

@Resolver(() => User)
export class UsersResolver {
  constructor(private usersService: UsersService) {}

  @Query(() => [User], { name: 'users', description: 'Get all users' })
  async findAll(): Promise<User[]> {
    return this.usersService.findAll();
  }

  @Query(() => User, { nullable: true })
  async user(@Args('id', { type: () => Int }) id: number): Promise<User> {
    return this.usersService.findOne(id);
  }

  @Mutation(() => User)
  async createUser(@Args('input') input: CreateUserInput): Promise<User> {
    return this.usersService.create(input);
  }
}
```

## Field Resolvers

Compute fields dynamically:

```typescript
import { ResolveField, Parent } from '@nestjs/graphql';

@Resolver(() => User)
export class UsersResolver {
  constructor(
    private usersService: UsersService,
    private postsService: PostsService,
  ) {}

  @ResolveField(() => [Post])
  async posts(@Parent() user: User) {
    return this.postsService.findByUserId(user.id);
  }

  @ResolveField(() => String)
  fullName(@Parent() user: User) {
    return `${user.firstName} ${user.lastName}`;
  }
}
```

## Args Patterns

### Single Arguments

```typescript
@Query(() => User)
async user(@Args('id', { type: () => Int }) id: number) {
  return this.usersService.findOne(id);
}
```

### ArgsType for Multiple Arguments

```typescript
@ArgsType()
export class PaginationArgs {
  @Field(() => Int)
  @Min(0)
  offset: number = 0;

  @Field(() => Int)
  @Min(1)
  @Max(50)
  limit: number = 25;
}

@Query(() => [User])
async users(@Args() paginationArgs: PaginationArgs): Promise<User[]> {
  return this.usersService.findAll(paginationArgs);
}
```

### InputType for Complex Inputs

```typescript
@InputType()
export class CreateUserInput {
  @Field()
  @IsEmail()
  email: string;

  @Field()
  @MinLength(3)
  name: string;
}

@Mutation(() => User)
async createUser(@Args('input') input: CreateUserInput) {
  return this.usersService.create(input);
}
```

## Query Options

```typescript
@Query(() => [User], {
  name: 'users',           // GraphQL query name
  description: 'Get users', // Schema documentation
  nullable: true,           // Can return null
  deprecationReason: 'Use findUsers instead', // Mark deprecated
})
async findAll() {}
```

## Mutation Options

```typescript
@Mutation(() => User, {
  name: 'createUser',
  description: 'Create a new user',
  nullable: false,
})
async create(@Args('input') input: CreateUserInput) {}
```

## Best Practices

1. **Keep resolvers thin** - Delegate business logic to services
2. **Use InputType for mutations** - Separate input from output types
3. **Return promises** - Let NestJS handle async/await
4. **Name queries/mutations explicitly** - Use `name` option for clarity
5. **Document with descriptions** - Add descriptions for API documentation
6. **Use nullable appropriately** - Mark optional returns as nullable
