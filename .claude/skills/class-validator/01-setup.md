# Setup & ValidationPipe Configuration

## Installation

```bash
npm install --save class-validator class-transformer
```

## TypeScript Configuration

```json
{
  "compilerOptions": {
    "experimentalDecorators": true,
    "emitDecoratorMetadata": true,
    "strictPropertyInitialization": false
  }
}
```

## Global ValidationPipe (NestJS)

```typescript
import { NestFactory } from '@nestjs/core';
import { ValidationPipe, BadRequestException } from '@nestjs/common';
import { AppModule } from './app.module';

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create(AppModule);

  app.useGlobalPipes(new ValidationPipe({
    whitelist: true,
    forbidNonWhitelisted: true,
    transform: true,
    transformOptions: { enableImplicitConversion: true },
    stopAtFirstError: true,
    exceptionFactory: (errors) => {
      const messages = errors.map((error) => ({
        field: error.property,
        errors: Object.values(error.constraints ?? {}),
      }));
      return new BadRequestException({
        statusCode: 400,
        message: 'Validation failed',
        errors: messages,
      });
    },
  }));

  await app.listen(3000);
}

bootstrap();
```

## ValidationPipe Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `whitelist` | `boolean` | `false` | Strip properties without decorators |
| `forbidNonWhitelisted` | `boolean` | `false` | Throw error for unexpected properties |
| `transform` | `boolean` | `false` | Auto-transform to DTO class instances |
| `transformOptions` | `ClassTransformOptions` | `undefined` | Options passed to class-transformer |
| `disableErrorMessages` | `boolean` | `false` | Hide detailed errors (production) |
| `stopAtFirstError` | `boolean` | `false` | Stop at first validation error per property |
| `groups` | `string[]` | `undefined` | Validation groups to apply |
| `dismissDefaultMessages` | `boolean` | `false` | Use only custom error messages |
| `exceptionFactory` | `(errors) => any` | `BadRequestException` | Custom error formatting |
| `enableDebugMessages` | `boolean` | `false` | Show debug messages in errors |
| `skipMissingProperties` | `boolean` | `false` | Skip validation of missing properties |
| `forbidUnknownValues` | `boolean` | `true` | Reject unknown objects |

## ValidationOptions Interface (Per-Decorator)

Every decorator accepts a `ValidationOptions` object:

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `each` | `boolean` | `false` | Validate each element in array/Set/Map |
| `message` | `string \| ((args: ValidationArguments) => string)` | auto | Custom error message (string or function) |
| `groups` | `string[]` | `undefined` | Validation groups for this decorator |
| `always` | `boolean` | `false` | Validate regardless of active groups |
| `context` | `any` | `undefined` | Transient data passed to validation result |
| `validateIf` | `(object: any, value: any) => boolean` | `undefined` | Per-decorator conditional — runs this validator only when callback returns `true` **(0.15+)** |

## validate() Options (Standalone)

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `skipMissingProperties` | `boolean` | `false` | Skip missing properties |
| `whitelist` | `boolean` | `false` | Strip non-decorated properties |
| `forbidNonWhitelisted` | `boolean` | `false` | Error on non-decorated properties |
| `groups` | `string[]` | `undefined` | Validation groups |
| `dismissDefaultMessages` | `boolean` | `false` | Suppress default messages |
| `validationError.target` | `boolean` | `true` | Include target in error |
| `validationError.value` | `boolean` | `true` | Include value in error |
| `forbidUnknownValues` | `boolean` | `true` | Reject unknown objects |
| `stopAtFirstError` | `boolean` | `false` | Stop at first error |

## Validation Functions (Standalone)

| Function | Returns | Description |
|----------|---------|-------------|
| `validate(object, options?)` | `Promise<ValidationError[]>` | Async validation |
| `validateOrReject(object, options?)` | `Promise<void>` | Rejects promise on failure |
| `validateSync(object, options?)` | `ValidationError[]` | Sync — silently ignores async validators |

## Enable DI for Custom Validators

```typescript
import { NestFactory } from '@nestjs/core';
import { useContainer } from 'class-validator';
import { AppModule } from './app.module';

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create(AppModule);

  // Required for custom validators that inject services
  useContainer(app.select(AppModule), { fallbackOnErrors: true });

  app.useGlobalPipes(new ValidationPipe({
    whitelist: true,
    forbidNonWhitelisted: true,
    transform: true,
  }));

  await app.listen(3000);
}

bootstrap();
```

## Controller-Level Pipe Override

```typescript
import { Controller, Post, Body, ValidationPipe } from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto';

@Controller('users')
export class UsersController {
  @Post()
  create(
    @Body(new ValidationPipe({ groups: ['registration'] }))
    dto: CreateUserDto,
  ): Promise<User> {
    return this.usersService.create(dto);
  }
}
```

---

**Version:** class-validator 0.15.1, class-transformer 0.5.x | **Source:** https://github.com/typestack/class-validator
