# Whitelist and Security

## The Security Problem

Without proper validation, attackers can:
- Pollute object prototypes
- Override internal properties
- Cause mass-assignment vulnerabilities
- Bypass business logic

## The Solution

```typescript
app.useGlobalPipes(new ValidationPipe({
  whitelist: true,              // Remove unexpected properties
  forbidNonWhitelisted: true,   // Throw error for unexpected properties
  transform: true,              // Auto-transform to DTO types
}));
```

## How It Works

**Without whitelist:**
```typescript
// Request: { name: "John", email: "john@example.com", isAdmin: true }
// Result: All properties pass through, including isAdmin
```

**With whitelist: true:**
```typescript
// Request: { name: "John", email: "john@example.com", isAdmin: true }
// Result: { name: "John", email: "john@example.com" }
// isAdmin is silently removed
```

**With whitelist + forbidNonWhitelisted:**
```typescript
// Request: { name: "John", email: "john@example.com", isAdmin: true }
// Result: 400 Bad Request
// Error: "property isAdmin should not exist"
```

## Complete Security Configuration

```typescript
app.useGlobalPipes(new ValidationPipe({
  // Security
  whitelist: true,
  forbidNonWhitelisted: true,

  // Type safety
  transform: true,
  transformOptions: { enableImplicitConversion: true },

  // Performance
  stopAtFirstError: true,

  // Production hardening
  disableErrorMessages: process.env.NODE_ENV === 'production',

  // Custom error formatting
  exceptionFactory: (errors) => {
    const messages = errors.map(error => ({
      field: error.property,
      errors: Object.values(error.constraints || {}),
    }));
    return new BadRequestException({
      statusCode: 400,
      message: 'Validation failed',
      errors: messages,
    });
  },
}));
```

## Best Practices

1. **Always use whitelist + forbidNonWhitelisted in production**
2. **Define explicit DTOs for every endpoint**
3. **Use @IsOptional() for optional fields**
4. **Enable transformation for type safety**
5. **Fail fast with stopAtFirstError**
