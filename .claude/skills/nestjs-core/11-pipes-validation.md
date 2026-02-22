# Pipes & ValidationPipe

Pipes transform input data and/or validate it before it reaches the route handler.

## Pipe Interface

```typescript
import { PipeTransform, Injectable, ArgumentMetadata } from '@nestjs/common';

@Injectable()
export class CustomPipe implements PipeTransform<string, number> {
  transform(value: string, metadata: ArgumentMetadata): number {
    // metadata.type: 'body' | 'query' | 'param' | 'custom'
    // metadata.metatype: Type of the argument (e.g., CreateUserDto)
    // metadata.data: Argument name (e.g., 'id' from @Param('id'))
    return parseInt(value, 10);
  }
}
```

## Built-in Pipes

| Pipe | Import | Description |
|------|--------|-------------|
| `ValidationPipe` | `@nestjs/common` | Validate and transform DTOs via class-validator |
| `ParseIntPipe` | `@nestjs/common` | Parse string to integer, throw 400 if invalid |
| `ParseFloatPipe` | `@nestjs/common` | Parse string to float |
| `ParseBoolPipe` | `@nestjs/common` | Parse string to boolean (`'true'`/`'false'`) |
| `ParseArrayPipe` | `@nestjs/common` | Parse and validate arrays |
| `ParseUUIDPipe` | `@nestjs/common` | Validate UUID strings (v3, v4, v5) |
| `ParseEnumPipe` | `@nestjs/common` | Validate enum membership |
| `DefaultValuePipe` | `@nestjs/common` | Provide default when value is `undefined` |
| `ParseFilePipe` | `@nestjs/common` | Validate uploaded files |

### Usage Examples

```typescript
import {
  Controller, Get, Query, Param,
  ParseIntPipe, ParseBoolPipe, ParseUUIDPipe, ParseEnumPipe, DefaultValuePipe,
} from '@nestjs/common';

enum UserRole {
  Admin = 'admin',
  User = 'user',
}

@Controller('users')
export class UsersController {
  @Get(':id')
  findOne(@Param('id', ParseUUIDPipe) id: string) {}

  @Get()
  findAll(
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(20), ParseIntPipe) limit: number,
    @Query('active', new DefaultValuePipe(true), ParseBoolPipe) active: boolean,
  ) {}

  @Get('role/:role')
  findByRole(@Param('role', new ParseEnumPipe(UserRole)) role: UserRole) {}
}
```

### ParseArrayPipe

```typescript
@Get()
findByIds(
  @Query('ids', new ParseArrayPipe({ items: String, separator: ',' }))
  ids: string[],
) {}
// GET /users?ids=abc,def,ghi -> ids = ['abc', 'def', 'ghi']
```

### ParseArrayPipe Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `items` | `Type` | — | Type of array items |
| `separator` | `string` | `','` | Separator for string input |
| `optional` | `boolean` | `false` | Allow undefined |

## ValidationPipe

The most important built-in pipe. Validates DTOs using `class-validator` decorators and transforms plain objects to class instances using `class-transformer`.

### Required Packages

```bash
npm install class-validator class-transformer
```

### Global Registration (Recommended)

**Option 1: Module-based (supports DI)**

```typescript
import { Module } from '@nestjs/common';
import { APP_PIPE } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';

@Module({
  providers: [
    {
      provide: APP_PIPE,
      useValue: new ValidationPipe({
        whitelist: true,
        transform: true,
        forbidNonWhitelisted: true,
      }),
    },
  ],
})
export class AppModule {}
```

**Option 2: In main.ts (no DI)**

```typescript
import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create(AppModule);
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
    }),
  );
  await app.listen(3000);
}
bootstrap();
```

## ValidationPipe Options (Complete Reference)

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `whitelist` | `boolean` | `false` | Strip properties without decorators |
| `forbidNonWhitelisted` | `boolean` | `false` | Throw error if non-whitelisted properties present |
| `transform` | `boolean` | `false` | Auto-transform payloads to DTO class instances |
| `transformOptions` | `ClassTransformOptions` | `undefined` | Options passed to class-transformer |
| `disableErrorMessages` | `boolean` | `false` | Suppress validation error details in response |
| `errorHttpStatusCode` | `HttpStatus` | `400` | HTTP status code for validation errors |
| `exceptionFactory` | `(errors: ValidationError[]) => any` | — | Custom exception factory |
| `validateCustomDecorators` | `boolean` | `false` | Validate custom parameter decorators |
| `stopAtFirstError` | `boolean` | `false` | Stop validating after first error per property |
| `forbidUnknownValues` | `boolean` | `true` | Reject unknown objects (objects without decorators) |
| `skipMissingProperties` | `boolean` | `false` | Skip validation of missing properties |
| `skipNullProperties` | `boolean` | `false` | Skip validation of null properties |
| `skipUndefinedProperties` | `boolean` | `false` | Skip validation of undefined properties |
| `groups` | `string[]` | `undefined` | Validation groups to use |
| `dismissDefaultMessages` | `boolean` | `false` | Use class-validator's default messages only |
| `validationError.target` | `boolean` | `true` | Include target object in ValidationError |
| `validationError.value` | `boolean` | `true` | Include validated value in ValidationError |
| `enableDebugMessages` | `boolean` | `false` | Include debug info in error messages |
| `always` | `boolean` | `false` | Run validation even if no decorator found |

### Detailed Option Explanations

#### whitelist

Strips all properties that do NOT have any class-validator decorator. Properties without decorators are silently removed from the payload.

```typescript
// DTO
class CreateUserDto {
  @IsEmail()
  email: string;

  @IsString()
  name: string;
}

// Input: { email: 'a@b.com', name: 'Test', isAdmin: true }
// With whitelist: true -> { email: 'a@b.com', name: 'Test' }  (isAdmin stripped)
// With whitelist: false -> { email: 'a@b.com', name: 'Test', isAdmin: true }
```

#### forbidNonWhitelisted

When combined with `whitelist: true`, throws a `400 Bad Request` instead of silently stripping unknown properties.

```typescript
new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true })

// Input: { email: 'a@b.com', isAdmin: true }
// Response: 400 { message: ['property isAdmin should not exist'] }
```

#### transform

Auto-transforms plain JavaScript objects to DTO class instances. Also transforms primitive types (e.g., `string` route param to `number`).

```typescript
new ValidationPipe({ transform: true })

// Without transform: @Body() dto is plain object
// With transform: @Body() dto is CreateUserDto instance

// Also transforms primitives:
@Get(':id')
findOne(@Param('id') id: number) {} // id auto-converted from string to number
```

#### transformOptions

Options passed to `class-transformer`'s `plainToInstance()`:

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `enableImplicitConversion` | `boolean` | `false` | Auto-convert types based on TS type |
| `excludeExtraneousValues` | `boolean` | `false` | Only include `@Expose()` properties |
| `exposeDefaultValues` | `boolean` | `false` | Set default values for missing properties |
| `groups` | `string[]` | — | Transformation groups |
| `strategy` | `'excludeAll' \| 'exposeAll'` | `'exposeAll'` | Inclusion strategy |

```typescript
new ValidationPipe({
  transform: true,
  transformOptions: {
    enableImplicitConversion: true, // Auto-convert "5" to 5 for @IsNumber()
  },
})
```

#### exceptionFactory

Custom function to transform validation errors into exceptions.

```typescript
import { ValidationPipe, UnprocessableEntityException } from '@nestjs/common';
import { ValidationError } from 'class-validator';

new ValidationPipe({
  exceptionFactory: (errors: ValidationError[]) => {
    const messages = errors.map((err) => ({
      field: err.property,
      errors: Object.values(err.constraints || {}),
    }));
    return new UnprocessableEntityException({
      message: 'Validation failed',
      errors: messages,
    });
  },
})
```

#### validateCustomDecorators

By default, `ValidationPipe` only validates `@Body()`, `@Param()`, `@Query()`. Set to `true` to also validate parameters from custom decorators like `@CurrentUser()`.

```typescript
new ValidationPipe({ validateCustomDecorators: true })
```

#### stopAtFirstError

Stop validation after the first error is found for each property. Useful for performance and cleaner error messages.

```typescript
new ValidationPipe({ stopAtFirstError: true })

// Without: { errors: ['email must be a string', 'email must be an email', 'email should not be empty'] }
// With:    { errors: ['email must be a string'] }
```

## Recommended Configuration

### REST API

```typescript
new ValidationPipe({
  whitelist: true,
  forbidNonWhitelisted: true,
  transform: true,
  transformOptions: { enableImplicitConversion: true },
  stopAtFirstError: true,
})
```

### GraphQL API

```typescript
new ValidationPipe({
  transform: true,
  transformOptions: { enableImplicitConversion: true },
  stopAtFirstError: true,
})
// Note: whitelist/forbidNonWhitelisted less relevant for GraphQL
// since the schema already restricts input shape
```

### Production

```typescript
new ValidationPipe({
  whitelist: true,
  forbidNonWhitelisted: true,
  transform: true,
  disableErrorMessages: process.env.NODE_ENV === 'production',
  stopAtFirstError: true,
})
```

## Applying Pipes at Different Levels

```typescript
// Global (recommended for ValidationPipe)
app.useGlobalPipes(new ValidationPipe({ whitelist: true }));

// Controller level
@Controller('users')
@UsePipes(new ValidationPipe({ whitelist: true }))
export class UsersController {}

// Method level
@Post()
@UsePipes(new ValidationPipe({ groups: ['create'] }))
create(@Body() dto: CreateUserDto) {}

// Parameter level
@Get(':id')
findOne(@Param('id', ParseIntPipe) id: number) {}
```

## Custom Pipe Example

```typescript
import { PipeTransform, Injectable, BadRequestException } from '@nestjs/common';
import { Types } from 'mongoose';

@Injectable()
export class ParseObjectIdPipe implements PipeTransform<string, Types.ObjectId> {
  transform(value: string): Types.ObjectId {
    if (!Types.ObjectId.isValid(value)) {
      throw new BadRequestException(`"${value}" is not a valid MongoDB ObjectId`);
    }
    return new Types.ObjectId(value);
  }
}

// Usage
@Get(':id')
findOne(@Param('id', ParseObjectIdPipe) id: Types.ObjectId) {}
```

## Best Practices

| Practice | Rationale |
|----------|-----------|
| Register `ValidationPipe` globally | Consistent validation across all endpoints |
| Always set `whitelist: true` | Prevent mass assignment attacks |
| Use `forbidNonWhitelisted: true` in REST APIs | Explicit error for unexpected properties |
| Use `transform: true` | Auto-convert payloads to DTO instances |
| Use `stopAtFirstError: true` | Cleaner error messages, better performance |
| Disable error messages in production | Don't expose validation internals |
| Use `APP_PIPE` provider over `app.useGlobalPipes()` | Supports dependency injection |
| Create custom pipes for reusable transforms | e.g., `ParseObjectIdPipe` for MongoDB |

---

**Version:** NestJS 11.x + class-validator 0.14.x | **Source:** https://docs.nestjs.com/techniques/validation
