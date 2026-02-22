# Code Placement Decision Guide

## Where Does This Code Belong?

Use these decision trees to determine correct placement for new code.

## Service Placement Decision Tree

```
Is this service used by multiple feature modules?
│
├─ YES → Is it business logic or utility?
│        │
│        ├─ Business Logic (domain-specific)
│        │  └─ Create a dedicated shared module in common/modules/
│        │     Example: SleepDataModule for sleep calculations
│        │
│        └─ Pure Utility (no domain knowledge)
│           └─ Place in common/utils/ or common/services/
│              Example: DateUtils, StringHelpers
│
└─ NO → Place in the feature module that owns it
        │
        ├─ Is it internal implementation?
        │  └─ modules/<feature>/services/<name>.service.ts
        │
        └─ Is it the main/public service?
           └─ modules/<feature>/<feature>.service.ts
```

## Service Classification: Module vs Common

### The Key Question: Does It Know About Your Domain?

**In Feature Module** - Service knows about your business domain:
- Uses domain-specific models (User, Kid, SleepSession)
- Contains business rules specific to a feature
- Has dependencies on other domain services

**In Common** - Service is generic and reusable:
- Could be copy-pasted to another project and work
- No knowledge of User, Kid, SleepSession, etc.
- Pure transformations, calculations, or utilities

### Classification Criteria Table

| Criteria | Feature Module | common/modules/ | common/services/ |
|----------|---------------|-----------------|------------------|
| Uses Mongoose models | Yes | Yes | No |
| Contains business rules | Yes | Yes (shared) | No |
| Domain-specific naming | Yes | Yes | No |
| Used by 1 module | Yes | No | No |
| Used by 2+ modules | No | Yes | Yes |
| Could work in any project | No | No | Yes |
| Injects other services | Yes | Maybe | Rarely |

### Concrete Examples

**FEATURE MODULE** (`modules/<feature>/services/`):
```typescript
// modules/user/services/user-validation.service.ts
// WHY: Only UserModule needs this, uses User model
@Injectable()
export class UserValidationService {
  validateUserEmail(user: User): boolean { ... }
}

// modules/schedule/services/nap-generator.service.ts
// WHY: Schedule-specific logic, uses Kid and SleepSession models
@Injectable()
export class NapGeneratorService {
  generateNapsForKid(kid: Kid): SleepSession[] { ... }
}
```

**COMMON MODULE** (`common/modules/<name>.module.ts`):
```typescript
// common/modules/sleep-data.module.ts
// WHY: Used by UserModule AND ScheduleModule, domain-specific
@Module({
  providers: [SleepDataService, BedtimeCalculator],
  exports: [SleepDataService],
})
export class SleepDataModule {}

// common/modules/kid.module.ts
// WHY: KidService needed by UserModule, ScheduleModule, NotificationModule
@Module({
  imports: [SchemasModule],
  providers: [KidService],
  exports: [KidService],
})
export class KidModule {}
```

**COMMON SERVICE** (`common/services/` - no module wrapper):
```typescript
// common/services/date-utils.service.ts
// WHY: Pure utility, no domain knowledge, works in any project
@Injectable()
export class DateUtilsService {
  toTimezone(date: Date, tz: string): Date { ... }
  formatDuration(ms: number): string { ... }
}

// common/services/string-helpers.service.ts
// WHY: Generic string operations
@Injectable()
export class StringHelpersService {
  slugify(text: string): string { ... }
}
```

### Decision Flowchart with Examples

```
New Service: "KidAgeCalculator"
│
├─ Q1: Does it use Kid model? → YES
├─ Q2: Is it used by multiple modules? → YES (User, Schedule, Notification)
├─ Q3: Is it domain-specific? → YES (knows about Kid entity)
│
└─ ANSWER: common/modules/kid.module.ts
           (or add to existing KidModule)
```

```
New Service: "TimezoneConverter"
│
├─ Q1: Does it use any domain models? → NO
├─ Q2: Could this work in any project? → YES
├─ Q3: Is it a pure utility? → YES
│
└─ ANSWER: common/services/timezone.service.ts
           (or common/utils/timezone.utils.ts if no DI needed)
```

```
New Service: "SleepSessionValidator"
│
├─ Q1: Does it use SleepSession model? → YES
├─ Q2: Is it used by multiple modules? → NO (only SleepSessionModule)
│
└─ ANSWER: modules/sleep-session/services/sleep-session-validator.service.ts
```

### Common Mistakes and Fixes

| Mistake | Problem | Fix |
|---------|---------|-----|
| `common/services/kid.service.ts` provided only by UserModule | Misleading location | Move to `modules/user/services/` OR create `common/modules/kid.module.ts` |
| Generic DateUtils in `modules/schedule/` | Not reusable | Move to `common/utils/` |
| Domain SleepScoreCalculator in `common/services/` | Missing proper module encapsulation | Create `common/modules/sleep-data.module.ts` |
| Utility function as @Injectable | Over-engineering | Use plain function in `common/utils/` |

## Guard/Decorator/Pipe Placement

```
Is it specific to one feature module?
│
├─ YES → Place in modules/<feature>/guards/ (or decorators/, pipes/)
│        Example: modules/auth/guards/roles.guard.ts
│
└─ NO → Place in common/guards/ (or decorators/, pipes/)
        Example: common/guards/gql-auth.guard.ts
```

## Type/Interface Placement

```
Where is the type used?
│
├─ Single Module → modules/<feature>/types/<name>.types.ts
│
├─ Multiple Modules → common/types/<name>.types.ts
│
└─ Shared with External Consumers (DTOs)
   └─ modules/<feature>/dto/<name>.input.ts or .output.ts
```

## Schema Placement Decision

```
Is this Mongoose schema used by multiple modules?
│
├─ YES → Register in core/database/schemas.module.ts
│        Feature modules import SchemasModule
│
└─ NO → Register in the single module that uses it
        Example: MongooseModule.forFeature([...]) in feature module
```

## Quick Reference: Common Scenarios

### Scenario 1: New Feature

```
Create modules/<feature>/
├── dto/
│   └── index.ts
├── services/
│   └── index.ts
├── <feature>.service.ts
├── <feature>.resolver.ts
├── <feature>.module.ts
└── index.ts
```

### Scenario 2: Service Needs Another Module's Service

```typescript
// Option A: Import the module
@Module({
  imports: [UserModule], // Imports module that exports UserService
  providers: [ScheduleService],
})
export class ScheduleModule {}

// Option B: Circular dependency - use forwardRef
@Module({
  imports: [forwardRef(() => UserModule)],
})
export class ScheduleModule {}

// In service -- always explicit @Inject:
constructor(
  @Inject(forwardRef(() => UserService))
  private readonly userService: UserService,
) {}
```

### Scenario 3: Multiple Modules Need Same Calculation Logic

```
1. Create common/modules/calculation.module.ts
2. Move calculation services there
3. Export only the facade CalculationService
4. Feature modules import CalculationModule
```

### Scenario 4: Extracting Shared Code from Feature Module

Before:
```
modules/user/
├── user.service.ts (contains kid-related code)
└── user.module.ts
```

After (if KidService is used elsewhere):
```
common/modules/kid.module.ts (exports KidService)
modules/user/
├── user.service.ts (imports KidService)
└── user.module.ts (imports KidModule)
```

Or (if only UserModule uses KidService):
```
modules/user/
├── services/
│   └── kid.service.ts (internal)
├── user.service.ts
└── user.module.ts
```

## File Location Summary Table

| What | Where | Example |
|------|-------|---------|
| Feature module | `modules/<feature>/` | `modules/auth/` |
| Feature service (public) | `modules/<feature>/<feature>.service.ts` | `modules/auth/auth.service.ts` |
| Internal service | `modules/<feature>/services/<name>.service.ts` | `modules/auth/services/password.service.ts` |
| DTOs | `modules/<feature>/dto/<name>.input.ts` | `modules/auth/dto/login.input.ts` |
| Feature types | `modules/<feature>/types/<name>.types.ts` | `modules/auth/types/token.types.ts` |
| Feature constants | `modules/<feature>/constants/<feature>.constants.ts` | `modules/auth/constants/auth.constants.ts` |
| Tests | `modules/<feature>/tests/<name>.test.ts` | `modules/auth/tests/auth.service.test.ts` |
| Generic guard | `common/guards/<name>.guard.ts` | `common/guards/gql-auth.guard.ts` |
| Generic decorator | `common/decorators/<name>.decorator.ts` | `common/decorators/current-user.decorator.ts` |
| Shared types | `common/types/<name>.types.ts` | `common/types/pagination.types.ts` |
| Shared module | `common/modules/<name>.module.ts` | `common/modules/sleep-data.module.ts` |
| Config | `core/config/` | `core/config/database.config.ts` |
| Mongoose schemas | `models/<name>.schema.ts` | `models/user.schema.ts` |

## Import Path Conventions

```typescript
// Feature-to-feature: import from module barrel
import { UserService } from '../user';

// Internal imports: use relative paths, not barrels
import { PasswordService } from './services/password.service';

// Common imports: use common/ path
import { GqlAuthGuard } from '../../common/guards/gql-auth.guard';

// Type-only imports: use 'import type'
import type { TokenPayload } from './types/token.types';
```

## Red Flags: Signs of Misplaced Code

1. **Service in `common/services/` but only one module provides it**
   - Move to that module's `services/` folder

2. **Multiple modules registering same schema**
   - Create SchemasModule in core/database/

3. **Feature module exporting 5+ services**
   - Facade pattern needed: hide internals, export one service

4. **Import paths crossing multiple `../../../`**
   - Code might be in wrong location

5. **Circular dependency requiring many forwardRef**
   - Consider extracting shared code to common/modules/

6. **Tests importing internal services from other modules**
   - Those services should either be exported or tests restructured

---

**Version:** NestJS 11.x (^11.1.14) | **Source:** https://docs.nestjs.com/modules
