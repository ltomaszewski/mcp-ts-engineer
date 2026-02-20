# Module Organization & Encapsulation

## Three-Layer Module Architecture

Organize NestJS modules into three distinct layers with clear boundaries:

```
src/nest/
├── core/                    # Infrastructure (app-wide singletons)
│   ├── database/            # Database connections, migrations
│   ├── config/              # ConfigModule, env validation
│   └── logging/             # Logger providers
│
├── common/                  # Shared utilities (reusable, no business logic)
│   ├── decorators/          # Custom decorators (@CurrentUser, @Public)
│   ├── guards/              # Generic guards (GqlAuthGuard, ThrottleGuard)
│   ├── pipes/               # Validation pipes
│   ├── filters/             # Exception filters
│   ├── interceptors/        # Generic interceptors
│   ├── types/               # Shared TypeScript types/interfaces
│   └── utils/               # Pure utility functions
│
└── modules/                 # Feature modules (business logic)
    ├── auth/
    ├── user/
    ├── schedule/
    └── notification/
```

### Layer Rules

| Layer | Contains | Can Import From | Exported To |
|-------|----------|-----------------|-------------|
| Core | Infrastructure services | External packages only | AppModule |
| Common | Generic utilities | Core, external packages | Any module |
| Feature | Business logic | Core, Common, other Features | Other Features |

## Feature Module Internal Structure

Each feature module follows a consistent internal structure:

```
modules/user/
├── dto/                     # Input/Output types
│   ├── create-user.input.ts
│   ├── user.output.ts
│   └── index.ts             # Barrel export
│
├── services/                # Internal services (NOT exported)
│   ├── user-validation.service.ts
│   ├── user-score.service.ts
│   └── index.ts
│
├── user.service.ts          # Public facade service (EXPORTED)
├── user.resolver.ts         # GraphQL resolver
├── user.module.ts           # Module definition
└── index.ts                 # Public API barrel
```

## Encapsulation: Public vs Internal Services

### The Facade Pattern

Each module exposes ONE public service (facade) and hides internal implementation:

```typescript
// user.module.ts
@Module({
  imports: [
    MongooseModule.forFeature([{ name: User.name, schema: UserSchema }]),
  ],
  providers: [
    // INTERNAL - not exported, only used within this module
    UserValidationService,
    UserScoreService,

    // PUBLIC - exported facade
    UserService,

    // Resolver - never export
    UserResolver,
  ],
  exports: [
    // ONLY export the facade service
    UserService,
  ],
})
export class UserModule {}
```

### Internal Service Pattern

```typescript
// services/user-validation.service.ts
@Injectable()
export class UserValidationService {
  // Internal implementation - not accessible outside UserModule
  validateEmail(email: string): boolean {
    // validation logic
  }
}

// user.service.ts (Facade)
@Injectable()
export class UserService {
  constructor(
    private readonly validationService: UserValidationService,
    private readonly scoreService: UserScoreService,
  ) {}

  // Public API - this is what other modules call
  async createUser(input: CreateUserInput): Promise<User> {
    this.validationService.validateEmail(input.email);
    // ...
  }
}
```

## Barrel Files (index.ts)

### Purpose

Barrel files define the PUBLIC API of a directory or module. They:
- Hide internal file structure from consumers
- Enable refactoring without breaking imports
- Make explicit what is public vs internal

### Module-Level Barrel (Public API)

```typescript
// modules/user/index.ts
// Only export what OTHER modules need

// Public service facade
export { UserService } from './user.service';

// Public DTOs for typing
export { CreateUserInput, UserOutput } from './dto';

// Public types
export type { UserRole } from './types';

// NEVER export:
// - Internal services
// - Resolvers
// - Module class itself (import module, not from barrel)
```

### DTO Barrel (Internal Organization)

```typescript
// modules/user/dto/index.ts
export { CreateUserInput } from './create-user.input';
export { UpdateUserInput } from './update-user.input';
export { UserOutput } from './user.output';
```

### Service Barrel (Internal Only)

```typescript
// modules/user/services/index.ts
// Used ONLY within user.module.ts
export { UserValidationService } from './user-validation.service';
export { UserScoreService } from './user-score.service';
```

## Avoiding Circular Dependencies with Barrels

### Problem Pattern

```typescript
// BAD - imports entire barrel, creates hidden circular dependency
import { SomeService } from '../other-module';
```

### Safe Patterns

```typescript
// GOOD - import specific file when in same module
import { UserValidationService } from './services/user-validation.service';

// GOOD - import from barrel when crossing module boundaries
import { UserService } from '../user';

// GOOD - use forwardRef when modules must cross-reference
@Module({
  imports: [forwardRef(() => NotificationModule)],
})
export class UserModule {}
```

## Schema Registration Best Practices

### Dedicated Schema Module (Recommended for Shared Schemas)

```typescript
// core/database/schemas.module.ts
@Module({
  imports: [
    MongooseModule.forFeature([
      { name: User.name, schema: UserSchema },
      { name: Kid.name, schema: KidSchema },
      { name: SleepSession.name, schema: SleepSessionSchema },
    ]),
  ],
  exports: [MongooseModule],
})
export class SchemasModule {}

// Feature module imports SchemasModule
@Module({
  imports: [SchemasModule],
  // ...
})
export class UserModule {}
```

### Per-Module Schema Registration (For Module-Specific Schemas)

```typescript
// If schema is ONLY used by one module, register in that module
@Module({
  imports: [
    MongooseModule.forFeature([
      { name: UserPreferences.name, schema: UserPreferencesSchema },
    ]),
  ],
})
export class UserModule {}
```

## Shared Services Between Modules

### Pattern 1: Dedicated Shared Module

When a service is used by multiple feature modules:

```typescript
// common/modules/sleep-data.module.ts
@Module({
  imports: [SchemasModule],
  providers: [
    SleepDataService,
    // Internal calculators
    BedtimeCalculator,
    WakeupCalculator,
  ],
  exports: [SleepDataService], // Only export facade
})
export class SleepDataModule {}
```

### Pattern 2: Re-exporting from Feature Module

When one module's service is occasionally needed by others:

```typescript
// user.module.ts
@Module({
  providers: [UserService, KidService],
  exports: [UserService, KidService], // Export both
})
export class UserModule {}

// Other modules import UserModule to access both services
```

## File Naming Conventions

```
<feature>.<type>.ts

Types:
- .module.ts       # Module definition
- .service.ts      # Service class
- .resolver.ts     # GraphQL resolver
- .controller.ts   # REST controller
- .guard.ts        # Guard class
- .decorator.ts    # Custom decorator
- .input.ts        # GraphQL input type / DTO
- .output.ts       # GraphQL output type
- .type.ts         # Plain TypeScript types
- .types.ts        # Multiple related types
- .constants.ts    # Constants and enums
- .test.ts         # Unit tests
- .e2e.test.ts     # E2E tests
```

## Module Import Order Convention

```typescript
@Module({
  imports: [
    // 1. Core/Infrastructure modules
    ConfigModule,

    // 2. Database/Schema modules
    SchemasModule,
    MongooseModule.forFeature([...]),

    // 3. Common/Shared modules
    SleepDataModule,

    // 4. Feature modules (with forwardRef if circular)
    forwardRef(() => NotificationModule),
  ],
  providers: [
    // 1. Internal services (alphabetical)
    InternalServiceA,
    InternalServiceB,

    // 2. Main/Facade service
    FeatureService,

    // 3. Resolver/Controller
    FeatureResolver,
  ],
  exports: [
    // Only public facade service(s)
    FeatureService,
  ],
})
export class FeatureModule {}
```

## Anti-Patterns to Avoid

### 1. Exporting Everything

```typescript
// BAD
exports: [ServiceA, ServiceB, ServiceC, Resolver, Helper]

// GOOD - export only the public facade
exports: [FeatureService]
```

### 2. Resolvers in Exports

```typescript
// BAD - resolvers should never be exported
exports: [UserResolver, UserService]

// GOOD
exports: [UserService]
```

### 3. Misplaced Services

```typescript
// BAD - KidService in common/ but provided only by UserModule
// common/services/kid.service.ts
// Then: providers: [KidService] in UserModule

// GOOD - service lives where it's provided
// modules/user/services/kid.service.ts
// Or: shared via dedicated module if truly shared
```

### 4. Duplicate Schema Registrations

```typescript
// BAD - same schema registered in multiple modules
// UserModule: MongooseModule.forFeature([User, Kid, SleepSession])
// ScheduleModule: MongooseModule.forFeature([Kid, SleepSession, User])

// GOOD - centralized schema registration
// SchemasModule exports MongooseModule, feature modules import SchemasModule
```

## Checklist for Module Creation

- [ ] Module is in correct layer (core/common/modules)
- [ ] Internal services are in `services/` subfolder
- [ ] Only facade service is exported
- [ ] Resolver is NOT exported
- [ ] DTOs have barrel file `dto/index.ts`
- [ ] Module has barrel file `index.ts` with public API
- [ ] Schemas registered in SchemasModule or module-specific
- [ ] No circular imports (use forwardRef if needed)
- [ ] File naming follows conventions
- [ ] Import order follows convention
