# GraphQL Type Definitions

## @ObjectType

Object types represent the structure of data returned from queries and mutations.

```typescript
import { ObjectType, Field, Int, ID } from '@nestjs/graphql';

@ObjectType({ description: 'User model' })
export class User {
  @Field(() => ID)
  id: number;

  @Field()
  name: string;

  @Field()
  email: string;

  @Field(() => Int, { nullable: true })
  age?: number;

  @Field(() => [Post], { nullable: 'items' })
  posts?: Post[];
}
```

## @Field Options

```typescript
@Field(() => String, {
  description: 'User email address',
  nullable: true,
  deprecationReason: 'Use contactEmail instead',
  defaultValue: 'default@example.com',
})
email?: string;
```

### Nullable Options

- `nullable: true` - Field can be null
- `nullable: 'items'` - Array items can be null, but array is never null
- `nullable: 'itemsAndList'` - Both array and items can be null

## @InputType

Input types are used for mutation and query arguments.

```typescript
import { InputType, Field, Int } from '@nestjs/graphql';
import { IsEmail, MinLength, Min } from 'class-validator';

@InputType()
export class CreateUserInput {
  @Field()
  @MinLength(3)
  name: string;

  @Field()
  @IsEmail()
  email: string;

  @Field(() => Int, { nullable: true })
  @Min(0)
  age?: number;
}
```

## @ArgsType

Define multiple arguments as a single class:

```typescript
import { ArgsType, Field, Int } from '@nestjs/graphql';

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
```

## Combining with TypeORM/Mongoose

```typescript
import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';
import { ObjectType, Field, ID } from '@nestjs/graphql';

@Entity()
@ObjectType()
export class User {
  @Field(() => ID)
  @PrimaryGeneratedColumn()
  id: number;

  @Field()
  @Column()
  name: string;

  @Field()
  @Column({ unique: true })
  email: string;
}
```

## Scalar Types

| TypeScript | GraphQL | Decorator |
|------------|---------|-----------|
| `number` | `Int` | `@Field(() => Int)` |
| `number` | `Float` | `@Field(() => Float)` |
| `string` | `String` | `@Field()` |
| `boolean` | `Boolean` | `@Field()` |
| `string` | `ID` | `@Field(() => ID)` |

## Enum Types

```typescript
import { registerEnumType } from '@nestjs/graphql';

export enum UserRole {
  ADMIN = 'ADMIN',
  USER = 'USER',
  GUEST = 'GUEST',
}

registerEnumType(UserRole, {
  name: 'UserRole',
  description: 'User role types',
});

@ObjectType()
export class User {
  @Field(() => UserRole)
  role: UserRole;
}
```

## Union Types

```typescript
import { createUnionType } from '@nestjs/graphql';

export const SearchResult = createUnionType({
  name: 'SearchResult',
  types: () => [User, Post, Comment] as const,
  resolveType(value) {
    if (value.email) return User;
    if (value.title) return Post;
    return Comment;
  },
});

@Query(() => [SearchResult])
async search(@Args('query') query: string) {
  return this.searchService.search(query);
}
```

## Interface Types

```typescript
import { InterfaceType, Field, ID } from '@nestjs/graphql';

@InterfaceType()
export abstract class Node {
  @Field(() => ID)
  id: string;
}

@ObjectType({ implements: () => [Node] })
export class User implements Node {
  @Field(() => ID)
  id: string;

  @Field()
  email: string;
}
```

## Best Practice: Separate Types

Keep data reading (`@ObjectType`) and writing (`@InputType`) types separate:

```typescript
// Output type for reading
@ObjectType()
export class User {
  @Field(() => ID)
  id: string;

  @Field()
  email: string;

  @Field()
  createdAt: Date;
}

// Input type for creating
@InputType()
export class CreateUserInput {
  @Field()
  email: string;

  @Field()
  password: string;
}

// Input type for updating
@InputType()
export class UpdateUserInput {
  @Field({ nullable: true })
  email?: string;
}
```
