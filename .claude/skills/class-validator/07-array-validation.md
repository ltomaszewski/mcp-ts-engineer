# Array Validation

## Basic Array Validation

Use `{ each: true }` to validate each element:

```typescript
import {
  IsArray, ArrayNotEmpty, IsString, IsNumber,
  MaxLength, Min, Max, ArrayMinSize, ArrayMaxSize, ArrayUnique,
} from 'class-validator';

export class CreatePostDto {
  // Array of strings
  @IsArray()
  @ArrayNotEmpty()
  @IsString({ each: true })
  @MaxLength(50, { each: true })
  tags: string[];

  // Array of numbers
  @IsArray()
  @IsNumber({}, { each: true })
  @Min(1, { each: true })
  @Max(10, { each: true })
  ratings: number[];
}
```

## Array of Nested Objects

```typescript
import { Type } from 'class-transformer';
import { ValidateNested, IsArray } from 'class-validator';

class Task {
  @IsString()
  @IsNotEmpty()
  title: string;

  @IsBoolean()
  completed: boolean;
}

export class CreateProjectDto {
  @IsString()
  name: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => Task)
  tasks: Task[];
}
```

## Important: Always Use @IsArray()

```typescript
// CORRECT
@IsArray()
@IsString({ each: true })
tags: string[];

// WRONG - won't validate if non-array is passed
@IsString({ each: true })
tags: string[];
```

## Array Size Validators

```typescript
export class CreateSurveyDto {
  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(10)
  @IsString({ each: true })
  questions: string[];

  @IsArray()
  @ArrayUnique()
  @IsNumber({}, { each: true })
  optionIds: number[];
}
```

## Sets and Maps

```typescript
export class CollectionDto {
  @ValidateNested({ each: true })
  @Type(() => Item)
  itemSet: Set<Item>;

  @ValidateNested({ each: true })
  @Type(() => Value)
  itemMap: Map<string, Value>;
}
```
