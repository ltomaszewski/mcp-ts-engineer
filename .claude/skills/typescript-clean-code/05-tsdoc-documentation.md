# 05 - TSDoc Documentation

**Source:** https://tsdoc.org/ | https://www.typescriptlang.org/docs/handbook/jsdoc-supported-types.html
**TypeScript:** 5.9 | **Status:** Complete reference

---

## Basic Function Documentation

```typescript
/**
 * Calculates the total price of items including tax.
 *
 * @param items - The list of items to calculate
 * @param taxRate - The tax rate as a decimal (e.g., 0.1 for 10%)
 * @returns The total price including tax
 *
 * @example
 * ```typescript
 * const total = calculateTotal([{ price: 100 }], 0.1);
 * console.log(total); // 110
 * ```
 */
function calculateTotal(items: Item[], taxRate: number): number {
  const subtotal = items.reduce((sum, item) => sum + item.price, 0);
  return subtotal * (1 + taxRate);
}
```

## Class Documentation

```typescript
/**
 * Service for managing user operations.
 *
 * @remarks
 * This service handles all user-related business logic including
 * creation, updates, and deletion of user accounts.
 *
 * @example
 * ```typescript
 * const userService = new UserService(repository);
 * const user = await userService.create({ name: 'John' });
 * ```
 */
export class UserService {
  /**
   * Creates a new UserService instance.
   *
   * @param repository - The user repository for data persistence
   */
  constructor(private readonly repository: UserRepository) {}

  /**
   * Creates a new user.
   *
   * @param data - The user creation data
   * @returns The created user
   * @throws {@link ValidationError} When the input data is invalid
   * @throws {@link DuplicateEmailError} When the email already exists
   */
  async create(data: CreateUserDto): Promise<User> {
    // Implementation
  }
}
```

## Interface Documentation

```typescript
/**
 * Represents a user in the system.
 */
export interface User {
  /** Unique identifier for the user */
  id: string;

  /** User's display name */
  name: string;

  /** User's email address (must be unique) */
  email: string;

  /** Account creation timestamp */
  createdAt: Date;

  /** Whether the user account is active */
  isActive: boolean;
}
```

## TSDoc Tags Reference

| Tag | Purpose | Example |
|-----|---------|---------|
| `@param` | Document parameter | `@param id - The user ID` |
| `@returns` | Document return value | `@returns The created user` |
| `@throws` | Document exceptions | `@throws {@link NotFoundError}` |
| `@example` | Usage examples | Code block with example |
| `@remarks` | Additional details | Extended explanation |
| `@see` | Reference other docs | `@see {@link UserService}` |
| `@deprecated` | Mark deprecated | `@deprecated Use newMethod instead` |
| `@beta` | Mark as beta | `@beta` |
| `@internal` | Internal use only | `@internal` |
| `@readonly` | Read-only property | `@readonly` |
| `@defaultValue` | Default value | `@defaultValue 10` |
| `@typeParam` | Generic type param | `@typeParam T - The entity type` |

## Type Documentation

```typescript
/**
 * Result of an operation that can succeed or fail.
 *
 * @typeParam T - The success value type
 * @typeParam E - The error type
 */
type Result<T, E extends Error = Error> =
  | { success: true; data: T }
  | { success: false; error: E };
```

## Enum Documentation

```typescript
/**
 * Available user roles in the system.
 */
export enum UserRole {
  /** Standard user with basic permissions */
  USER = 'user',

  /** Administrator with full access */
  ADMIN = 'admin',

  /** Moderator with content management access */
  MODERATOR = 'moderator',
}
```

## When to Document

**Always document:**
- All public methods
- All public classes
- All public interfaces
- All exported functions
- Complex algorithms
- Non-obvious behavior

**Skip documentation for:**
- Private methods (unless complex)
- Self-explanatory getters/setters
- Obvious implementations

## NestJS Documentation with Compodoc

NestJS projects can use [Compodoc](https://compodoc.app/) for automatic documentation generation.

```bash
npm install -D @compodoc/compodoc
npx compodoc -p tsconfig.json
```

**Compodoc-specific tags:**
```typescript
/**
 * User management service.
 *
 * @ignore  // Exclude from docs (e.g., constructors)
 */
@Injectable()
export class UserService {
  /**
   * @ignore
   */
  constructor(private repository: UserRepository) {}

  /**
   * Finds a user by ID.
   *
   * @param id - The user's unique identifier
   * @returns The user if found
   * @link UserRepository
   */
  async findOne(id: string): Promise<User | null> {
    return this.repository.findById(id);
  }
}
```

---

**Source:** https://tsdoc.org/
**TypeScript:** 5.9
**Last Updated:** February 2026
