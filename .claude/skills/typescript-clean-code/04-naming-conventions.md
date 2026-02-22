# 04 - Naming Conventions

**Source:** https://www.typescriptlang.org/docs/handbook/declaration-files/do-s-and-don-ts.html
**TypeScript:** 5.9 | **Status:** Complete reference

---

## Variables and Functions

```typescript
// camelCase
const userName = 'John';
const isActive = true;
const maxRetryCount = 3;

function calculateTotal(items: Item[]): number { /* ... */ }
function getUserById(id: string): User { /* ... */ }
function handleSubmit(): void { /* ... */ }
```

## Classes and Interfaces

```typescript
// PascalCase
class UserService { /* ... */ }
class HttpClient { /* ... */ }
class OrderProcessor { /* ... */ }

interface UserRepository { /* ... */ }
interface CacheStrategy { /* ... */ }
interface PaymentGateway { /* ... */ }

// DO NOT prefix interfaces with 'I'
// BAD: IUserRepository
// GOOD: UserRepository
```

## Constants and Enums

```typescript
// UPPER_SNAKE_CASE for true constants
const MAX_RETRY_ATTEMPTS = 3;
const DEFAULT_TIMEOUT_MS = 5000;
const API_BASE_URL = 'https://api.example.com';

// Enums - PascalCase names, values vary by style
// TypeScript style (PascalCase values)
enum UserRole {
  Admin = 'admin',
  User = 'user',
  Guest = 'guest',
}

// Alternative: UPPER_SNAKE_CASE keys (Java-style)
enum HttpStatus {
  OK = 200,
  NOT_FOUND = 404,
  INTERNAL_ERROR = 500,
}
```

## Booleans

```typescript
// Use is, has, can, should prefixes
const isLoading = true;
const hasPermission = false;
const canEdit = true;
const shouldValidate = false;
const wasProcessed = true;

// AVOID negative names
// BAD
const isNotValid = true;
const hasNoPermission = true;

// GOOD
const isValid = false;
const hasPermission = false;
```

## Descriptive Names

```typescript
// BAD: Cryptic
const d = new Date();
const u = getUser();
const arr = [1, 2, 3];
const temp = calculate();

// GOOD: Descriptive
const currentDate = new Date();
const authenticatedUser = getUser();
const orderIds = [1, 2, 3];
const discountAmount = calculate();
```

## File Names

```typescript
// kebab-case with type suffix
user.entity.ts
user.service.ts
user.repository.ts
create-user.dto.ts
user-created.event.ts
user.controller.ts
user.module.ts
```

## Generic Type Parameters

```typescript
// Single letter for simple generics
function identity<T>(value: T): T {
  return value;
}

// Descriptive for complex generics
interface Repository<TEntity, TId> {
  findById(id: TId): Promise<TEntity | null>;
  save(entity: TEntity): Promise<TEntity>;
}
```

## Avoid Abbreviations

```typescript
// BAD
const usrMgr = new UserManager();
const btnCtrl = getButtonController();
const errMsg = 'Error';

// GOOD
const userManager = new UserManager();
const buttonController = getButtonController();
const errorMessage = 'Error';

// Exceptions: Well-known abbreviations
const userId = '123';  // id is acceptable
const httpClient = new HttpClient();  // HTTP is acceptable
const apiUrl = '/users';  // API, URL are acceptable
```

## Function Names

```typescript
// Verbs for actions
function createUser() { /* ... */ }
function updateOrder() { /* ... */ }
function deleteItem() { /* ... */ }
function fetchData() { /* ... */ }

// get/set for accessors
function getUserName() { /* ... */ }
function setUserName(name: string) { /* ... */ }

// is/has/can for boolean returns
function isValid(): boolean { /* ... */ }
function hasPermission(): boolean { /* ... */ }
function canDelete(): boolean { /* ... */ }
```

## NestJS CRUD Method Names

```typescript
// Standard CRUD patterns
class UserService {
  // Create
  createOne(data: CreateUserDto): Promise<User> { /* ... */ }
  createMany(data: CreateUserDto[]): Promise<User[]> { /* ... */ }

  // Read
  findOne(id: string): Promise<User | null> { /* ... */ }
  findOneOrFail(id: string): Promise<User> { /* ... */ }
  findAll(): Promise<User[]> { /* ... */ }
  findOneByEmail(email: string): Promise<User | null> { /* ... */ }

  // Update
  updateOne(id: string, data: UpdateUserDto): Promise<User> { /* ... */ }
  updateMany(ids: string[], data: UpdateUserDto): Promise<User[]> { /* ... */ }

  // Delete
  deleteOne(id: string): Promise<void> { /* ... */ }
  deleteMany(ids: string[]): Promise<void> { /* ... */ }

  // Complex queries
  findWithPosts(id: string): Promise<User> { /* ... */ }
  findByRoleAndStatus(role: Role, status: Status): Promise<User[]> { /* ... */ }
  countAll(): Promise<number> { /* ... */ }
  countByStatus(status: Status): Promise<number> { /* ... */ }
}
```

## Property Naming (NestJS/TypeORM)

```typescript
class User {
  // Simple properties - camelCase
  firstName: string;
  lastName: string;
  emailAddress: string;

  // Relations - singular for one-to-one
  profile: Profile;
  address: Address;

  // Relations - plural for one-to-many
  posts: Post[];
  comments: Comment[];

  // Timestamps - use "At" suffix
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;  // soft delete

  // Foreign keys
  profileId: string;
  organizationId: string;
}
```

## Visibility Modifiers

```typescript
// Always explicitly declare visibility
class UserService {
  // Private dependencies
  private readonly repository: UserRepository;
  private readonly logger: Logger;

  // Public methods
  public async findOne(id: string): Promise<User> { /* ... */ }

  // Protected for inheritance
  protected validateUser(user: User): boolean { /* ... */ }

  // Private helpers
  private hashPassword(password: string): string { /* ... */ }
}
```

---

**Source:** https://www.typescriptlang.org/docs/handbook/declaration-files/do-s-and-don-ts.html
**TypeScript:** 5.9
**Last Updated:** February 2026
