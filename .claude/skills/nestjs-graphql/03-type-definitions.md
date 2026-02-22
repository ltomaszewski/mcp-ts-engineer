# GraphQL Type Definitions

Code-first type system with decorators.

## CRITICAL: Always Use Explicit Type Functions

Dev mode uses `tsx` (esbuild) which does **not** emit decorator metadata. **Every `@Field()` must include an explicit type function.** Never use bare `@Field()` without a type.

## @ObjectType

```typescript
import { ObjectType, Field, Int, Float, ID } from '@nestjs/graphql';

@ObjectType({ description: 'User model' })
export class User {
  @Field(() => ID)
  id!: string;

  @Field(() => String)
  name!: string;

  @Field(() => String)
  email!: string;

  @Field(() => Int, { nullable: true })
  age?: number;

  @Field(() => Date)
  createdAt!: Date;

  @Field(() => [Post], { nullable: 'items' })
  posts?: Post[];
}
```

### @ObjectType Options

| Option | Type | Description |
|--------|------|-------------|
| `description` | `string` | Schema documentation |
| `implements` | `() => Type[]` | Interface types implemented |
| `isAbstract` | `boolean` | Abstract type (not in schema) |

## @Field Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `() => Type` | Function | required | GraphQL type |
| `nullable` | `boolean \| 'items' \| 'itemsAndList'` | `false` | Nullability |
| `description` | `string` | -- | Schema docs |
| `deprecationReason` | `string` | -- | Mark deprecated |
| `defaultValue` | `any` | -- | Default value |
| `complexity` | `number \| Function` | -- | Field complexity |
| `middleware` | `FieldMiddleware[]` | -- | Field middleware |

### Nullable Options

| Value | GraphQL SDL | Meaning |
|-------|-------------|---------|
| `false` (default) | `[Post!]!` | Array required, items required |
| `true` | `[Post!]` | Array can be null, items required |
| `'items'` | `[Post]!` | Array required, items can be null |
| `'itemsAndList'` | `[Post]` | Both can be null |

## @InputType

```typescript
import { InputType, Field, Int } from '@nestjs/graphql';
import { IsEmail, MinLength, Min, IsOptional } from 'class-validator';

@InputType()
export class CreateUserInput {
  @Field(() => String)
  @MinLength(3)
  name!: string;

  @Field(() => String)
  @IsEmail()
  email!: string;

  @Field(() => Int, { nullable: true })
  @IsOptional()
  @Min(0)
  age?: number;
}

@InputType()
export class UpdateUserInput {
  @Field(() => String, { nullable: true })
  @IsOptional()
  name?: string;

  @Field(() => String, { nullable: true })
  @IsOptional()
  @IsEmail()
  email?: string;
}
```

## @ArgsType

Define multiple flat arguments as a single class:

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

## Scalar Types

| TypeScript | GraphQL | Decorator |
|------------|---------|-----------|
| `string` | `String` | `@Field(() => String)` |
| `number` (integer) | `Int` | `@Field(() => Int)` |
| `number` (decimal) | `Float` | `@Field(() => Float)` |
| `boolean` | `Boolean` | `@Field(() => Boolean)` |
| `string` (identifier) | `ID` | `@Field(() => ID)` |
| `Date` | `DateTime` | `@Field(() => Date)` |

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
  valuesMap: {
    ADMIN: { description: 'Full access' },
    GUEST: { deprecationReason: 'Use USER instead' },
  },
});

@ObjectType()
export class User {
  @Field(() => UserRole)
  role!: UserRole;
}
```

### registerEnumType Options

| Option | Type | Description |
|--------|------|-------------|
| `name` | `string` | GraphQL enum name |
| `description` | `string` | Schema docs |
| `valuesMap` | `Record<string, { description?, deprecationReason? }>` | Per-value metadata |

## Union Types

```typescript
import { createUnionType } from '@nestjs/graphql';

export const SearchResult = createUnionType({
  name: 'SearchResult',
  types: () => [User, Post, Comment] as const,
  resolveType(value) {
    if ('email' in value) return User;
    if ('title' in value) return Post;
    return Comment;
  },
});

@Query(() => [SearchResult])
async search(@Args('query', { type: () => String }) query: string) {
  return this.searchService.search(query);
}
```

## Interface Types

```typescript
import { InterfaceType, Field, ID } from '@nestjs/graphql';

@InterfaceType()
export abstract class Node {
  @Field(() => ID)
  id!: string;
}

@InterfaceType()
export abstract class Timestamped {
  @Field(() => Date)
  createdAt!: Date;

  @Field(() => Date)
  updatedAt!: Date;
}

@ObjectType({ implements: () => [Node, Timestamped] })
export class User extends Node implements Timestamped {
  @Field(() => ID)
  id!: string;

  @Field(() => String)
  email!: string;

  @Field(() => Date)
  createdAt!: Date;

  @Field(() => Date)
  updatedAt!: Date;
}
```

## Combining with Mongoose Schema

```typescript
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { ObjectType, Field, ID } from '@nestjs/graphql';
import { HydratedDocument } from 'mongoose';

export type UserDocument = HydratedDocument<User>;

@Schema({ timestamps: true })
@ObjectType()
export class User {
  @Field(() => ID)
  id!: string; // Mongoose auto-creates from _id

  @Prop({ required: true, unique: true })
  @Field(() => String)
  email!: string;

  @Prop({ required: true })
  // No @Field -- password should never be in GraphQL schema
  password!: string;

  @Prop({ type: [String], default: ['user'] })
  @Field(() => [String])
  roles!: string[];

  @Field(() => Date)
  createdAt!: Date;
}

export const UserSchema = SchemaFactory.createForClass(User);
```

## Best Practice: Separate Types

Keep data reading (`@ObjectType`) and writing (`@InputType`) types separate:

```typescript
@ObjectType()
export class User {
  @Field(() => ID)
  id!: string;

  @Field(() => String)
  email!: string;

  @Field(() => Date)
  createdAt!: Date;
}

@InputType()
export class CreateUserInput {
  @Field(() => String)
  @IsEmail()
  email!: string;

  @Field(() => String)
  @MinLength(8)
  password!: string;
}

@InputType()
export class UpdateUserInput {
  @Field(() => String, { nullable: true })
  @IsOptional()
  email?: string;
}
```

---

**Version:** @nestjs/graphql 13.x | **Source:** https://docs.nestjs.com/graphql/unions-and-enums, https://docs.nestjs.com/graphql/interfaces
