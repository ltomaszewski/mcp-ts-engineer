# 01 - File Organization

**Source:** https://www.typescriptlang.org/docs/handbook/
**TypeScript:** 5.9 | **Status:** Complete reference

---

## Table of Contents

1. [Size Limits](#size-limits)
2. [One Concept Per File](#one-concept-per-file)
3. [Directory Structures](#directory-structures)
4. [File Naming](#file-naming)
5. [Barrel Files](#barrel-files)
6. [Import Organization](#import-organization)
7. [When to Split Files](#when-to-split-files)

---

## Size Limits

| Metric | Recommended | Maximum |
|--------|-------------|---------|
| Lines per file | 200-300 | 300 |
| Lines per function | 20-30 | 50 |
| Lines per class | 200 | 300 |
| Methods per class | 10 | 20 |

---

## One Concept Per File

```typescript
// user.entity.ts - Only User entity
export class User {
  constructor(
    public readonly id: string,
    public readonly name: string,
    public readonly email: string,
  ) {}
}

// user.repository.ts - Only UserRepository interface
export interface UserRepository {
  findById(id: string): Promise<User | null>;
  save(user: User): Promise<User>;
  delete(id: string): Promise<void>;
}

// user.service.ts - Only UserService
export class UserService {
  constructor(private readonly repository: UserRepository) {}

  async findById(id: string): Promise<User> {
    const user = await this.repository.findById(id);
    if (!user) throw new NotFoundError('User', id);
    return user;
  }
}
```

---

## Directory Structures

### Clean Architecture (Domain-Driven)

```
src/
  domain/           # Business logic (pure, no framework deps)
    entities/
    services/
    interfaces/
  application/      # Use cases
    use-cases/
  infrastructure/   # External concerns
    database/
    http/
    messaging/
  shared/           # Cross-cutting concerns
    utils/
    types/
    errors/
```

### Feature-Based (Recommended for Most Projects)

```
src/
  users/
    user.entity.ts
    user.service.ts
    user.repository.ts
    user.controller.ts
    __tests__/
      user.service.test.ts
    index.ts
  orders/
    order.entity.ts
    order.service.ts
    __tests__/
      order.service.test.ts
    index.ts
```

### NestJS Module Structure

```
src/
  modules/
    users/
      dto/
        create-user.dto.ts
        update-user.dto.ts
      entities/
        user.entity.ts
      users.controller.ts
      users.service.ts
      users.module.ts
      __tests__/
        users.service.test.ts
    auth/
      dto/
      guards/
      strategies/
      auth.controller.ts
      auth.service.ts
      auth.module.ts
  common/
    decorators/
    filters/
    guards/
    interceptors/
    pipes/
  config/
    configuration.ts
  app.module.ts
  main.ts
```

---

## File Naming

Use kebab-case with a type suffix:

```
user.entity.ts
user.service.ts
user.repository.ts
create-user.dto.ts
user-created.event.ts
user.controller.ts
user.module.ts
user.schema.ts
user.types.ts
```

| Suffix | Purpose | Example |
|--------|---------|---------|
| `.entity.ts` | Domain model | `user.entity.ts` |
| `.service.ts` | Business logic | `user.service.ts` |
| `.repository.ts` | Data access | `user.repository.ts` |
| `.controller.ts` | HTTP handler | `user.controller.ts` |
| `.module.ts` | DI module | `user.module.ts` |
| `.dto.ts` | Data transfer object | `create-user.dto.ts` |
| `.schema.ts` | Validation schema | `user.schema.ts` |
| `.types.ts` | Type definitions | `user.types.ts` |
| `.test.ts` | Test file | `user.service.test.ts` |
| `.capability.ts` | MCP capability | `echo.capability.ts` |

---

## Barrel Files

Re-export public API from `index.ts`:

```typescript
// domain/index.ts
export { User } from './entities/user.entity';
export { UserService } from './services/user.service';
export type { UserRepository } from './interfaces/user-repository.interface';
```

**Rules:**
- Only export public API -- keep internal modules private
- Use `export type` for type-only exports (TS 3.8+)
- Avoid deep re-export chains (barrel importing another barrel)

---

## Import Organization

Order imports consistently:

```typescript
// 1. Node.js built-ins
import { join, resolve } from 'node:path';
import { readFile } from 'node:fs/promises';

// 2. External packages (frameworks first, then alphabetical)
import { Injectable } from '@nestjs/common';
import { z } from 'zod';

// 3. Monorepo packages
import { User } from '@myorg/types';

// 4. Internal absolute imports
import { Logger } from '@/core/logger';
import { CostTracker } from '@/core/cost';

// 5. Relative imports (parent dirs first, then siblings)
import { AuthService } from '../auth.service';
import { CreateUserInput } from './dto';
```

### Import Defer (TS 5.9)

Defer module execution until first property access:

```typescript
// Module is NOT executed until mod.something is accessed
import defer * as mod from './heavy-module';

function doWork(): void {
  // Module executes here on first access
  mod.heavyFunction();
}
```

---

## When to Split Files

**Split when:**
- File exceeds 300 lines
- Class has multiple responsibilities
- Functions are unrelated to each other
- Testing becomes difficult due to mixed concerns
- A utility function is used in 2+ files

**Keep together when:**
- Code is highly cohesive and single-purpose
- Splitting would create artificial boundaries
- Related types and their implementations are tightly coupled
- Combined file is under 200 lines

---

**Source:** https://www.typescriptlang.org/docs/handbook/modules/introduction.html
**TypeScript:** 5.9
**Last Updated:** February 2026
