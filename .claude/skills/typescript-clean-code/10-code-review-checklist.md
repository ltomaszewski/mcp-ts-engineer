# 10 - Code Review Checklist

**Source:** https://www.typescriptlang.org/docs/handbook/
**TypeScript:** 5.9 | **Status:** Complete reference

---

## Size Limits

- [ ] Files under 300 lines
- [ ] Functions under 50 lines
- [ ] Max 4 parameters per function
- [ ] Max 3 nesting levels
- [ ] Max 10 cyclomatic complexity

## SOLID Principles

- [ ] Single Responsibility: Classes/functions do one thing
- [ ] Open-Closed: Extended via composition, not modification
- [ ] Liskov Substitution: Subtypes are substitutable
- [ ] Interface Segregation: Small, focused interfaces
- [ ] Dependency Inversion: Dependencies are injected

## Documentation

- [ ] All public methods have TSDoc comments
- [ ] `@param` for all parameters
- [ ] `@returns` for return values
- [ ] `@throws` for exceptions
- [ ] `@example` for non-obvious usage
- [ ] `@deprecated` with migration path

## Naming

- [ ] Variables: camelCase, descriptive
- [ ] Functions: camelCase, verb prefix
- [ ] Classes: PascalCase, noun
- [ ] Interfaces: PascalCase, no 'I' prefix
- [ ] Constants: UPPER_SNAKE_CASE
- [ ] Booleans: is/has/can/should prefix
- [ ] No abbreviations (except well-known)

## Type Safety (STRICT)

### Forbidden Patterns
- [ ] **No `any` types** - use generics, `unknown` with guards, or proper interfaces
- [ ] **No untyped `unknown`** - always narrow with type guards or replace with interfaces
- [ ] **No inline object types** - define explicit interfaces for all data structures
- [ ] **No `Record<string, unknown>`** - use properly typed interfaces instead
- [ ] **No `{ [key: string]: any }`** - define the actual shape of the data
- [ ] **No type assertions (`as`)** without justification - prefer type guards

### Required Patterns
- [ ] Explicit return types on ALL functions (including arrow functions)
- [ ] Explicit parameter types (no implicit `any` from missing declarations)
- [ ] Proper null/undefined handling with strict null checks
- [ ] Discriminated unions for variants
- [ ] Type guards for runtime type narrowing
- [ ] Generic constraints when using generics (`<T extends SomeType>`)

### Data Transformation Rules
- [ ] Input/Output mapping must use typed interfaces (e.g., `toKidOutput(kid: IKid): KidOutput`)
- [ ] Never use `unknown` for known data shapes - define the interface
- [ ] API responses must have explicit response types
- [ ] Database documents must use typed interfaces, not generic `Document`

## Error Handling

- [ ] Custom error classes extend Error
- [ ] Stack traces preserved with `cause`
- [ ] Errors include context information
- [ ] No swallowed exceptions
- [ ] Proper error narrowing in catch

## Debugging

- [ ] Source maps enabled
- [ ] No deep method chaining
- [ ] Named functions (not anonymous)
- [ ] async/await (not .then chains)
- [ ] Descriptive variable names
- [ ] No magic numbers

## Code Quality

- [ ] No console.log in production code
- [ ] No debugger statements
- [ ] Prefer const over let
- [ ] No var usage
- [ ] Strict equality (===)
- [ ] Curly braces for all blocks

## Performance

- [ ] No premature optimization
- [ ] Lazy loading where appropriate
- [ ] Avoid n+1 queries
- [ ] Proper cleanup (subscriptions, timers)

## Security

- [ ] Input validation
- [ ] No secrets in code
- [ ] Proper authentication checks
- [ ] SQL injection prevention
- [ ] XSS prevention

## Testing Considerations

- [ ] Code is testable (injectable deps)
- [ ] Pure functions where possible
- [ ] Side effects are isolated
- [ ] Clear boundaries for mocking

## Quick Reference

### Function Template
```typescript
/**
 * Brief description.
 *
 * @param param - Description
 * @returns Description
 * @throws {@link ErrorType} When condition
 */
function doSomething(param: Type): ReturnType {
  // Implementation
}
```

### Error Template
```typescript
export class CustomError extends Error {
  constructor(
    message: string,
    public readonly context?: Record<string, unknown>
  ) {
    super(message);
    this.name = 'CustomError';
    Error.captureStackTrace(this, this.constructor);
  }
}
```

### Result Type
```typescript
type Result<T, E = Error> =
  | { success: true; data: T }
  | { success: false; error: E };
```

---

**Source:** https://www.typescriptlang.org/docs/handbook/
**TypeScript:** 5.9
**Last Updated:** February 2026
