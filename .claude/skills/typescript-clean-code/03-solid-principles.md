# 03 - SOLID Principles

**Source:** https://www.typescriptlang.org/docs/handbook/2/classes.html
**TypeScript:** 5.9 | **Status:** Complete reference

---

## Table of Contents

1. [Single Responsibility (SRP)](#single-responsibility-principle)
2. [Open-Closed (OCP)](#open-closed-principle)
3. [Liskov Substitution (LSP)](#liskov-substitution-principle)
4. [Interface Segregation (ISP)](#interface-segregation-principle)
5. [Dependency Inversion (DIP)](#dependency-inversion-principle)
6. [SOLID Checklist](#solid-checklist)

---

## Single Responsibility Principle

A class should have only one reason to change.

```typescript
// BAD: Multiple responsibilities
class UserService {
  createUser(data: CreateUserDto): Promise<User> { /* ... */ }
  sendWelcomeEmail(user: User): Promise<void> { /* ... */ }
  generateReport(users: User[]): Promise<Report> { /* ... */ }
}

// GOOD: Single responsibility per class
class UserService {
  constructor(private readonly repository: UserRepository) {}

  async createUser(data: CreateUserDto): Promise<User> {
    return this.repository.create(data);
  }
}

class EmailService {
  async sendWelcomeEmail(user: User): Promise<void> {
    // Email-only responsibility
  }
}

class ReportService {
  async generateUserReport(users: User[]): Promise<Report> {
    // Report-only responsibility
  }
}
```

---

## Open-Closed Principle

Open for extension, closed for modification.

```typescript
// BAD: Must modify class to add new shapes
class AreaCalculator {
  calculate(shape: Shape): number {
    if (shape.type === 'circle') return Math.PI * shape.radius ** 2;
    if (shape.type === 'rectangle') return shape.width * shape.height;
    // Must modify for every new shape
    throw new Error(`Unknown shape: ${shape.type}`);
  }
}

// GOOD: Open for extension via interface
interface Shape {
  calculateArea(): number;
}

class Circle implements Shape {
  constructor(private readonly radius: number) {}

  calculateArea(): number {
    return Math.PI * this.radius ** 2;
  }
}

class Rectangle implements Shape {
  constructor(
    private readonly width: number,
    private readonly height: number,
  ) {}

  calculateArea(): number {
    return this.width * this.height;
  }
}

// New shapes added without modifying existing code
class Triangle implements Shape {
  constructor(
    private readonly base: number,
    private readonly height: number,
  ) {}

  calculateArea(): number {
    return 0.5 * this.base * this.height;
  }
}
```

---

## Liskov Substitution Principle

Subtypes must be substitutable for their base types without altering program correctness.

```typescript
// BAD: Violates LSP -- Penguin can't fly
class Bird {
  fly(): void { /* ... */ }
}

class Penguin extends Bird {
  fly(): void {
    throw new Error("Penguins can't fly!"); // Breaks substitutability
  }
}

// GOOD: Proper abstraction via separate interfaces
interface Bird {
  move(): void;
  name: string;
}

class Sparrow implements Bird {
  readonly name = 'Sparrow';

  move(): void {
    this.fly();
  }

  private fly(): void { /* ... */ }
}

class Penguin implements Bird {
  readonly name = 'Penguin';

  move(): void {
    this.swim();
  }

  private swim(): void { /* ... */ }
}

// Any Bird can be used interchangeably
function migrateBirds(birds: Bird[]): void {
  for (const bird of birds) {
    bird.move(); // Works for all birds
  }
}
```

---

## Interface Segregation Principle

No client should depend on methods it doesn't use.

```typescript
// BAD: Fat interface forces unnecessary implementations
interface Worker {
  work(): void;
  eat(): void;
  sleep(): void;
}

// Robot must implement eat/sleep even though it doesn't need them
class Robot implements Worker {
  work(): void { /* ... */ }
  eat(): void { throw new Error('Not applicable'); }
  sleep(): void { throw new Error('Not applicable'); }
}

// GOOD: Segregated interfaces
interface Workable {
  work(): void;
}

interface Eatable {
  eat(): void;
}

interface Sleepable {
  sleep(): void;
}

class Human implements Workable, Eatable, Sleepable {
  work(): void { /* ... */ }
  eat(): void { /* ... */ }
  sleep(): void { /* ... */ }
}

class Robot implements Workable {
  work(): void { /* ... */ }
  // Only implements what it needs
}
```

### Repository Interface Segregation

```typescript
// BAD: All methods required even if only reading
interface UserRepository {
  findById(id: string): Promise<User | null>;
  findAll(): Promise<User[]>;
  create(data: CreateUserDto): Promise<User>;
  update(id: string, data: UpdateUserDto): Promise<User>;
  delete(id: string): Promise<void>;
}

// GOOD: Segregated by access pattern
interface ReadableRepository<T> {
  findById(id: string): Promise<T | null>;
  findAll(): Promise<T[]>;
}

interface WritableRepository<T> {
  create(data: Partial<T>): Promise<T>;
  update(id: string, data: Partial<T>): Promise<T>;
  delete(id: string): Promise<void>;
}

// Compose as needed
interface UserRepository extends
  ReadableRepository<User>,
  WritableRepository<User> {}

// Read-only service only depends on ReadableRepository
class UserQueryService {
  constructor(private readonly repo: ReadableRepository<User>) {}

  async findById(id: string): Promise<User> {
    const user = await this.repo.findById(id);
    if (!user) throw new NotFoundError('User', id);
    return user;
  }
}
```

---

## Dependency Inversion Principle

Depend on abstractions, not concretions.

```typescript
// BAD: Depends on concrete implementation
class UserService {
  private db = new MySQLDatabase(); // Hard-coded dependency

  async save(user: User): Promise<void> {
    await this.db.save(JSON.stringify(user));
  }
}

// GOOD: Depends on abstraction via injection
interface Database {
  save(key: string, data: string): Promise<void>;
  find(key: string): Promise<string | null>;
}

class UserService {
  constructor(private readonly db: Database) {} // Injected

  async save(user: User): Promise<void> {
    await this.db.save(user.id, JSON.stringify(user));
  }
}

// Easy to swap implementations
class MySQLDatabase implements Database {
  async save(key: string, data: string): Promise<void> { /* ... */ }
  async find(key: string): Promise<string | null> { /* ... */ }
}

class InMemoryDatabase implements Database {
  private store = new Map<string, string>();

  async save(key: string, data: string): Promise<void> {
    this.store.set(key, data);
  }

  async find(key: string): Promise<string | null> {
    return this.store.get(key) ?? null;
  }
}
```

---

## SOLID Checklist

- [ ] **SRP:** Classes/functions do one thing
- [ ] **OCP:** New features extend, not modify existing code
- [ ] **LSP:** Derived classes are substitutable for base classes
- [ ] **ISP:** Interfaces are focused and minimal
- [ ] **DIP:** Dependencies are injected, not hard-coded

---

**Source:** https://www.typescriptlang.org/docs/handbook/2/classes.html
**TypeScript:** 5.9
**Last Updated:** February 2026
