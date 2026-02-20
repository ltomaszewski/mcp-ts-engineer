# Setup

## Installation

```bash
npm install --save class-validator class-transformer
```

## Global ValidationPipe

```typescript
import { ValidationPipe, BadRequestException } from '@nestjs/common';

app.useGlobalPipes(new ValidationPipe({
  transform: true,
  whitelist: true,
  forbidNonWhitelisted: true,
  transformOptions: { enableImplicitConversion: true },
  exceptionFactory: (errors) => {
    const result = errors.map((error) => ({
      property: error.property,
      message: error.constraints[Object.keys(error.constraints)[0]],
    }));
    return new BadRequestException(result);
  },
}));
```

## Key Options

| Option | Description |
|--------|-------------|
| `transform` | Auto-transform to DTO class instances |
| `whitelist` | Strip properties without decorators |
| `forbidNonWhitelisted` | Throw error for unexpected properties |
| `transformOptions` | Options for class-transformer |
| `disableErrorMessages` | Hide detailed errors (production) |
| `stopAtFirstError` | Stop at first validation error |

## TypeScript Config

```json
{
  "compilerOptions": {
    "experimentalDecorators": true,
    "emitDecoratorMetadata": true
  }
}
```

## Enable DI for Custom Validators

```typescript
import { useContainer } from 'class-validator';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  useContainer(app.select(AppModule), { fallbackOnErrors: true });
}
```
