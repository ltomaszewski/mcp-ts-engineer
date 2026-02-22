# Common Pitfalls

## 1. Missing @Type() with @ValidateNested()

Without `@Type()`, the nested object stays a plain JS object and validators are never applied.

```typescript
// BAD
@ValidateNested()
address: AddressDto;  // Validation silently passes on invalid data

// GOOD
@ValidateNested()
@Type(() => AddressDto)
address: AddressDto;
```

## 2. Validating Plain Objects Instead of Class Instances

`validate()` only works on class instances, not plain objects.

```typescript
// BAD — always returns 0 errors
const errors = await validate({ name: 'John', email: 'invalid' });

// GOOD — use plainToInstance first
import { plainToInstance } from 'class-transformer';
const dto = plainToInstance(CreateUserDto, { name: 'John', email: 'invalid' });
const errors = await validate(dto);
```

## 3. Missing @IsArray() Before each: true

Without `@IsArray()`, a non-array value is not rejected before element validation runs.

```typescript
// BAD — string "hello" would pass
@IsString({ each: true })
tags: string[];

// GOOD — rejects non-array first
@IsArray()
@IsString({ each: true })
tags: string[];
```

## 4. Wrong @IsOptional() Placement

`@IsOptional()` should come before other validators. If placed after, validators may execute before the optional check.

```typescript
// BAD
@IsString()
@IsOptional()
bio?: string;

// GOOD
@IsOptional()
@IsString()
bio?: string;
```

## 5. Transform vs Validation Execution Order

Decorators execute bottom-to-top. Place `@Transform` after (below) validation decorators in source, so it runs first at runtime.

```typescript
// BAD — validation runs before transform
@IsString()
@Transform(({ value }) => value?.trim())
name: string;  // Untrimmed value gets validated

// GOOD — transform runs first (bottom-to-top)
@IsString()               // 2. Then validate trimmed value
@Transform(({ value }) => value?.trim())  // 1. Trim first
name: string;
```

**Note:** In NestJS with `transform: true` in ValidationPipe, class-transformer runs before class-validator, making this order less critical. But for standalone `validate()` calls, order matters.

## 6. validateSync Ignoring Async Validators

```typescript
// BAD — @IsUniqueEmail (async) is silently skipped
const errors = validateSync(dto);

// GOOD — always use async validate() if any validators are async
const errors = await validate(dto);
```

## 7. Missing Whitelist in Production

```typescript
// BAD — security vulnerability
app.useGlobalPipes(new ValidationPipe());

// GOOD
app.useGlobalPipes(new ValidationPipe({
  whitelist: true,
  forbidNonWhitelisted: true,
}));
```

## 8. Not Enabling Transform

Without `transform: true`, request bodies are plain objects, not class instances.

```typescript
// BAD — controller receives plain object, not UserDto instance
app.useGlobalPipes(new ValidationPipe());

// GOOD — controller receives proper UserDto instance
app.useGlobalPipes(new ValidationPipe({
  transform: true,
  transformOptions: { enableImplicitConversion: true },
}));
```

## 9. Missing DI Registration for Custom Validators

Custom validators that inject services need the DI container:

```typescript
import { useContainer } from 'class-validator';

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create(AppModule);
  // MUST call before useGlobalPipes
  useContainer(app.select(AppModule), { fallbackOnErrors: true });
  app.useGlobalPipes(new ValidationPipe({ /* ... */ }));
}
```

## 10. enableImplicitConversion Side Effects

`enableImplicitConversion: true` can cause unexpected type coercions:

| Input | Target | Result | Issue? |
|-------|--------|--------|--------|
| `"123"` | `number` | `123` | Expected |
| `"true"` | `boolean` | `true` | Expected |
| `""` | `number` | `NaN` | Unexpected |
| `"abc"` | `number` | `NaN` | Unexpected |
| `0` | `boolean` | `false` | Can be surprising |

**Recommendation:** Use explicit `@Transform()` decorators for controlled conversion instead of relying on `enableImplicitConversion` for complex types.

## Quick Diagnostic Table

| Symptom | Likely Cause | Fix |
|---------|-------------|-----|
| Nested validation silently passes | Missing `@Type()` | Add `@Type(() => DtoClass)` |
| `validate()` returns 0 errors on bad data | Plain object, not class instance | Use `plainToInstance()` first |
| Non-array passes array validation | Missing `@IsArray()` | Add `@IsArray()` before `{ each: true }` |
| Custom async validator ignored | Using `validateSync` | Use `await validate()` |
| Extra properties pass through | No whitelist | Enable `whitelist: true` |
| Custom validator with DI fails | Missing `useContainer()` | Call `useContainer()` in bootstrap |

---

**Version:** class-validator 0.14.x | **Source:** https://github.com/typestack/class-validator
