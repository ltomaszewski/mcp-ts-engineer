# Array Validation

## Core Pattern: `{ each: true }`

Use `{ each: true }` to validate each element in an array, Set, or Map.

**Always use `@IsArray()` before element validators** — without it, a non-array value passes silently.

## Array of Primitives

```typescript
import {
  IsArray, ArrayNotEmpty, IsString, IsNumber, IsInt,
  MaxLength, Min, Max, ArrayMinSize, ArrayMaxSize, ArrayUnique,
} from 'class-validator';

export class CreatePostDto {
  // Array of strings with element validation
  @IsArray()
  @ArrayNotEmpty()
  @IsString({ each: true })
  @MaxLength(50, { each: true })
  tags: string[];

  // Array of numbers with range validation
  @IsArray()
  @IsNumber({}, { each: true })
  @Min(1, { each: true })
  @Max(10, { each: true })
  ratings: number[];

  // Unique integer array with size constraints
  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(20)
  @ArrayUnique()
  @IsInt({ each: true })
  categoryIds: number[];
}
```

## Array Validators

| Decorator | Parameters | Description |
|-----------|-----------|-------------|
| `@IsArray()` | `ValidationOptions?` | Checks value is an array |
| `@ArrayNotEmpty()` | `ValidationOptions?` | Array has at least one element |
| `@ArrayMinSize(min)` | `min: number` | Array length >= min |
| `@ArrayMaxSize(max)` | `max: number` | Array length <= max |
| `@ArrayUnique(identifier?)` | `(o: T) => any` | All elements are unique |
| `@ArrayContains(values)` | `values: any[]` | Array contains all given values |
| `@ArrayNotContains(values)` | `values: any[]` | Array does NOT contain any given value |

## Array of Nested Objects

```typescript
import { IsArray, ValidateNested, IsString, IsNotEmpty, IsBoolean } from 'class-validator';
import { Type } from 'class-transformer';

class TaskDto {
  @IsString()
  @IsNotEmpty()
  title: string;

  @IsBoolean()
  completed: boolean;
}

export class CreateProjectDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => TaskDto)
  tasks: TaskDto[];
}
```

## ArrayUnique with Custom Identifier

```typescript
import { IsArray, ArrayUnique, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

class OrderItemDto {
  productId: string;
  quantity: number;
}

export class CreateOrderDto {
  // Unique by productId (not by full object reference)
  @IsArray()
  @ArrayUnique((item: OrderItemDto) => item.productId)
  @ValidateNested({ each: true })
  @Type(() => OrderItemDto)
  items: OrderItemDto[];
}
```

## Sets and Maps

`{ each: true }` also works with `Set` and `Map` values:

```typescript
import { ValidateNested, IsString } from 'class-validator';
import { Type } from 'class-transformer';

class ItemDto {
  @IsString()
  name: string;
}

export class CollectionDto {
  @ValidateNested({ each: true })
  @Type(() => ItemDto)
  itemSet: Set<ItemDto>;

  @ValidateNested({ each: true })
  @Type(() => ItemDto)
  itemMap: Map<string, ItemDto>;
}
```

## Common Mistake: Missing @IsArray()

```typescript
// BAD — non-array value passes silently
@IsString({ each: true })
tags: string[];

// GOOD — rejects non-array values first
@IsArray()
@IsString({ each: true })
tags: string[];
```

---

**Version:** class-validator 0.14.x | **Source:** https://github.com/typestack/class-validator
