# SOLID Principles

## Single Responsibility Principle (SRP)

A class should have only one reason to change.

```typescript
// BAD: Multiple responsibilities
class UserService {
  createUser(data: CreateUserDto) { /* ... */ }
  sendWelcomeEmail(user: User) { /* ... */ }
  generateReport(users: User[]) { /* ... */ }
}

// GOOD: Single responsibility
class UserService {
  constructor(private repository: UserRepository) {}
  createUser(data: CreateUserDto) { /* ... */ }
}

class EmailService {
  sendWelcomeEmail(user: User) { /* ... */ }
}

class ReportService {
  generateUserReport(users: User[]) { /* ... */ }
}
```

## Open-Closed Principle (OCP)

Open for extension, closed for modification.

```typescript
// BAD: Must modify for new shapes
class AreaCalculator {
  calculate(shape: Shape) {
    if (shape.type === 'circle') return Math.PI * shape.radius ** 2;
    if (shape.type === 'rectangle') return shape.width * shape.height;
    // Must modify to add new shapes
  }
}

// GOOD: Open for extension
interface Shape {
  calculateArea(): number;
}

class Circle implements Shape {
  constructor(private radius: number) {}
  calculateArea(): number {
    return Math.PI * this.radius ** 2;
  }
}

class Rectangle implements Shape {
  constructor(private width: number, private height: number) {}
  calculateArea(): number {
    return this.width * this.height;
  }
}
```

## Liskov Substitution Principle (LSP)

Subtypes must be substitutable for their base types.

```typescript
// BAD: Violates LSP
class Bird {
  fly(): void { /* ... */ }
}

class Penguin extends Bird {
  fly(): void {
    throw new Error("Penguins can't fly!"); // Breaks substitutability
  }
}

// GOOD: Proper abstraction
interface Bird {
  move(): void;
}

class Sparrow implements Bird {
  move(): void { this.fly(); }
  private fly(): void { /* ... */ }
}

class Penguin implements Bird {
  move(): void { this.swim(); }
  private swim(): void { /* ... */ }
}
```

## Interface Segregation Principle (ISP)

No client should depend on methods it doesn't use.

```typescript
// BAD: Fat interface
interface Worker {
  work(): void;
  eat(): void;
  sleep(): void;
}

// GOOD: Segregated interfaces
interface Workable {
  work(): void;
}

interface Eatable {
  eat(): void;
}

class Human implements Workable, Eatable {
  work(): void { /* ... */ }
  eat(): void { /* ... */ }
}

class Robot implements Workable {
  work(): void { /* ... */ }
}
```

## Dependency Inversion Principle (DIP)

Depend on abstractions, not concretions.

```typescript
// BAD: Depends on concrete implementation
class UserService {
  private db = new MySQLDatabase(); // Direct dependency

  save(user: User): void {
    this.db.save(JSON.stringify(user));
  }
}

// GOOD: Depends on abstraction
interface Database {
  save(data: string): void;
}

class UserService {
  constructor(private db: Database) {} // Injected

  save(user: User): void {
    this.db.save(JSON.stringify(user));
  }
}
```

## SOLID Checklist

- [ ] Classes have single responsibility
- [ ] New features extend, not modify
- [ ] Derived classes are substitutable
- [ ] Interfaces are focused and minimal
- [ ] Dependencies are injected
