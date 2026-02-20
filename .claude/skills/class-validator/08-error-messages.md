# Error Messages and i18n

## Custom Error Messages

```typescript
export class CreateUserDto {
  @IsString({ message: 'Name must be a string' })
  @Length(2, 30, {
    message: 'Name must be between $constraint1 and $constraint2 characters',
  })
  name: string;

  @IsEmail({}, { message: 'Please provide a valid email address' })
  email: string;

  @Min(18, { message: 'You must be at least $constraint1 years old' })
  age: number;
}
```

## Dynamic Message Variables

- `$value`: The validated value
- `$property`: The property name
- `$target`: The target class name
- `$constraint1`, `$constraint2`, etc.: Constraint values

```typescript
@Length(5, 20, {
  message: '$property must be between $constraint1 and $constraint2 characters, but you provided "$value"',
})
username: string;
```

## i18n with nestjs-i18n

```bash
npm install nestjs-i18n
```

**Setup:**
```typescript
import { I18nModule, AcceptLanguageResolver, QueryResolver } from 'nestjs-i18n';

@Module({
  imports: [
    I18nModule.forRoot({
      fallbackLanguage: 'en',
      loaderOptions: { path: path.join(__dirname, '/i18n/'), watch: true },
      resolvers: [{ use: QueryResolver, options: ['lang'] }, AcceptLanguageResolver],
    }),
  ],
})
export class AppModule {}
```

**Translation files:**
```json
// src/i18n/en/validation.json
{
  "IS_NOT_EMPTY": "$property should not be empty",
  "IS_EMAIL": "$property must be a valid email address"
}
```

**Usage in DTOs:**
```typescript
import { i18nValidationMessage } from 'nestjs-i18n';

export class CreateUserDto {
  @IsNotEmpty({ message: i18nValidationMessage('validation.IS_NOT_EMPTY') })
  name: string;
}
```

**Pipes and filters:**
```typescript
import { I18nValidationExceptionFilter, I18nValidationPipe } from 'nestjs-i18n';

app.useGlobalPipes(new I18nValidationPipe());
app.useGlobalFilters(new I18nValidationExceptionFilter());
```
