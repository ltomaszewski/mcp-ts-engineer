# File Organization

## Size Limits

| Metric | Recommended | Maximum |
|--------|-------------|---------|
| Lines per file | 200-300 | 300 |
| Lines per function | 20-30 | 50 |
| Lines per class | 200 | 300 |
| Methods per class | 10 | 20 |

## One Concept Per File

```typescript
// user.entity.ts - Only User entity
export class User { /* ... */ }

// user.repository.ts - Only UserRepository interface
export interface UserRepository { /* ... */ }

// user.service.ts - Only UserService
export class UserService { /* ... */ }
```

## Directory Structure (Clean Architecture)

```
src/
├── domain/           # Business logic (pure, no framework deps)
│   ├── entities/
│   ├── services/
│   └── interfaces/
├── application/      # Use cases
│   └── use-cases/
├── infrastructure/   # External concerns
│   ├── database/
│   ├── http/
│   └── messaging/
└── shared/           # Cross-cutting concerns
    ├── utils/
    ├── types/
    └── errors/
```

## NestJS Module Structure

```
src/
├── modules/
│   ├── users/
│   │   ├── dto/
│   │   │   ├── create-user.dto.ts
│   │   │   └── update-user.dto.ts
│   │   ├── entities/
│   │   │   └── user.entity.ts
│   │   ├── users.controller.ts
│   │   ├── users.service.ts
│   │   ├── users.module.ts
│   │   └── users.service.spec.ts
│   └── auth/
│       ├── dto/
│       ├── guards/
│       ├── strategies/
│       ├── auth.controller.ts
│       ├── auth.service.ts
│       └── auth.module.ts
├── common/
│   ├── decorators/
│   ├── filters/
│   ├── guards/
│   ├── interceptors/
│   └── pipes/
├── config/
│   └── configuration.ts
├── app.module.ts
└── main.ts
```

## Barrel Files (index.ts)

```typescript
// domain/index.ts
export * from './entities/user.entity';
export * from './services/user.service';
export * from './interfaces/user-repository.interface';
```

## Feature-Based Organization

```
src/
├── users/
│   ├── user.entity.ts
│   ├── user.service.ts
│   ├── user.repository.ts
│   ├── user.controller.ts
│   └── index.ts
├── orders/
│   ├── order.entity.ts
│   ├── order.service.ts
│   └── index.ts
```

## File Naming

```
kebab-case.type.ts

Examples:
user.entity.ts
user.service.ts
user.repository.ts
create-user.dto.ts
user-created.event.ts
```

## When to Split Files

Split when:
- File exceeds 300 lines
- Class has multiple responsibilities
- Functions are unrelated
- Testing becomes difficult

Keep together when:
- Code is highly cohesive
- Splitting increases complexity
- Related types and interfaces
