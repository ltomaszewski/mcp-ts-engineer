# Common Pitfalls

## 1. Forgetting @Type() with @ValidateNested()

```typescript
// WRONG
@ValidateNested()
address: Address;

// CORRECT
@ValidateNested()
@Type(() => Address)
address: Address;
```

## 2. Wrong Decorator Order

Decorators execute bottom-to-top:

```typescript
// WRONG - Transform after validation
@IsString()
@Transform(({ value }) => value.trim())
name: string;

// CORRECT - Transform before validation
@Transform(({ value }) => value.trim())
@IsString()
name: string;
```

## 3. Validating Plain Objects

```typescript
// WRONG
const errors = await validate({ name: 'John' });

// CORRECT
const dto = plainToInstance(CreateUserDto, { name: 'John' });
const errors = await validate(dto);
```

## 4. Missing @IsArray() with each: true

```typescript
// WRONG
@IsString({ each: true })
tags: string[];

// CORRECT
@IsArray()
@IsString({ each: true })
tags: string[];
```

## 5. validateSync with Async Validators

```typescript
// WRONG - Async validators ignored
const errors = validateSync(dto);

// CORRECT
const errors = await validate(dto);
```

## 6. Not Enabling Transform

```typescript
// WRONG
app.useGlobalPipes(new ValidationPipe());

// CORRECT
app.useGlobalPipes(new ValidationPipe({
  transform: true,
  transformOptions: { enableImplicitConversion: true },
}));
```

## 7. Missing DI Registration for Custom Validators

```typescript
// In main.ts
import { useContainer } from 'class-validator';

useContainer(app.select(AppModule), { fallbackOnErrors: true });
```

## 8. Missing Security Options

```typescript
// WRONG - Security vulnerability
app.useGlobalPipes(new ValidationPipe());

// CORRECT
app.useGlobalPipes(new ValidationPipe({
  whitelist: true,
  forbidNonWhitelisted: true,
}));
```

## 9. Incorrect @IsOptional() Placement

```typescript
// Place @IsOptional() FIRST
@IsOptional()
@IsString()
@IsNotEmpty()
name?: string;
```

## 10. Not Handling Validation Errors

```typescript
app.useGlobalPipes(new ValidationPipe({
  exceptionFactory: (errors) => {
    const messages = errors.map(error => ({
      field: error.property,
      errors: Object.values(error.constraints || {}),
    }));
    return new BadRequestException({ message: 'Validation failed', errors: messages });
  },
}));
```
