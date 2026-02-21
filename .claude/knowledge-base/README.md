# Knowledge Base

Project-agnostic architecture guides and templates for building applications with Claude Code.

## Architecture Guides

| Guide | Description | Use For |
|-------|-------------|---------|
| [React Native Mobile Architecture](react-native-mobile-architecture.md) | Expo/React Native patterns, Zustand, TanStack Query, NativeWind | Mobile app development |
| [NestJS Backend Architecture](nestjs-backend-architecture.md) | NestJS patterns, GraphQL, MongoDB, JWT auth | Backend API development |
| [Documentation-Driven Development](documentation-driven-development.md) | Spec → Test → Implement workflow | All feature development |
| [Design System](design-system/) | Type-agnostic design tokens, components, accessibility (WCAG 2.2) | UI consistency across apps |

## Templates

| Template | Description |
|----------|-------------|
| [NestJS Backend CLAUDE.md](nestjs-backend-CLAUDE-template.md) | Template for backend app's project-specific CLAUDE.md |

## Library/Framework Knowledge

Detailed knowledge bases for libraries and frameworks used in the project. These are referenced by skills in `.claude/skills/`.

### Mobile Libraries

| Library | Location | Description |
|---------|----------|-------------|
| Expo Core | `expo-core/` | Framework, config, SDK modules |
| Expo Router | `expo-router/` | File-based navigation |
| Expo Notifications | `expo-notifications/` | Push notifications |
| React Native Core | `react-native-core/` | RN fundamentals |
| NativeWind | `nativewind/` | Tailwind CSS styling |
| Reanimated | `reanimated/` | Animations |
| FlashList | `flash-list/` | Performant lists |
| MMKV | `mmkv/` | Fast key-value storage |
| Keyboard Controller | `keyboard-controller/` | Keyboard handling |
| NetInfo | `netinfo/` | Network status |

### Backend Libraries

| Library | Location | Description |
|---------|----------|-------------|
| NestJS Core | `nestjs-core/` | Modules, DI, lifecycle |
| NestJS Auth | `nestjs-auth/` | JWT, Passport, guards |
| NestJS GraphQL | `nestjs-graphql/` | Resolvers, types |
| NestJS Mongoose | `nestjs-mongoose/` | Schemas, models |
| Class Validator | `class-validator/` | DTO validation |
| GraphQL curl Testing | `graphql-curl-testing/` | API testing patterns |

### Shared Libraries

| Library | Location | Description |
|---------|----------|-------------|
| Zustand | `zustand/` | State management |
| React Query | `react-query/` | Server state |
| Zod | `zod/` | Schema validation |
| Biome | `biome/` | Linting/formatting |
| date-fns | `date-fns/` | Date utilities |
| GraphQL Request | `graphql-request/` | GraphQL client |
| React Hook Form | `react-hook-form/` | Form handling |
| Maestro | `maestro/` | E2E testing |
| RN Testing Library | `rn-testing-library/` | Component testing |
| TypeScript Clean Code | `typescript-clean-code/` | Code standards |
| Claude SDK | `claude-sdk/` | Anthropic SDK |
| Prompt Engineering | `anthropic-prompt-engineering/` | Prompt design |
| Sentry React Native | `sentry-react-native/` | Error monitoring |

## Usage

### For New Projects

1. Copy the relevant template to your app's root as `CLAUDE.md`
2. Customize with your project-specific details
3. Reference the architecture guide for detailed patterns

### For Existing Projects

1. Reference architecture guides when implementing new features
2. Use patterns described here as the baseline
3. Document project-specific deviations in your app's `CLAUDE.md`

## Structure

```
knowledge-base/
├── README.md                           # This file
│
├── # Architecture Guides
├── react-native-mobile-architecture.md # Mobile app architecture
├── nestjs-backend-architecture.md      # Backend architecture
├── documentation-driven-development.md # DDD workflow
├── nestjs-backend-CLAUDE-template.md   # Template for backend CLAUDE.md
├── design-system/                      # Design system (modular)
│
├── # Mobile Libraries (from skills)
├── expo-core/                          # Expo framework
├── expo-router/                        # Navigation
├── expo-notifications/                 # Push notifications
├── react-native-core/                  # RN fundamentals
├── nativewind/                         # Tailwind styling
├── reanimated/                         # Animations
├── flash-list/                         # Performant lists
├── mmkv/                               # Key-value storage
├── keyboard-controller/                # Keyboard handling
├── netinfo/                            # Network status
│
├── # Backend Libraries (from skills)
├── nestjs-core/                        # NestJS framework
├── nestjs-auth/                        # Authentication
├── nestjs-graphql/                     # GraphQL
├── nestjs-mongoose/                    # MongoDB ODM
├── class-validator/                    # DTO validation
├── graphql-curl-testing/               # API testing
│
├── # Shared Libraries (from skills)
├── zustand/                            # State management
├── react-query/                        # Server state
├── zod/                                # Schema validation
├── biome/                              # Linting
├── date-fns/                           # Date utilities
├── graphql-request/                    # GraphQL client
├── react-hook-form/                    # Form handling
├── maestro/                            # E2E testing
├── rn-testing-library/                 # Component testing
├── typescript-clean-code/              # Code standards
├── claude-sdk/                         # Anthropic SDK
├── anthropic-prompt-engineering/       # Prompt design
└── sentry-react-native/                # Error monitoring
```

## Guide Structure

Each architecture guide follows a consistent structure:

1. **Tech Stack Reference** - Versions and packages
2. **Project Structure** - Directory layout
3. **Core Patterns** - Primary architectural patterns
4. **Configuration Files** - Key config examples
5. **Testing Patterns** - Testing approach
6. **Naming Conventions** - File and code naming
7. **Anti-Patterns** - What to avoid

## Related Resources

- `.claude/skills/` - Individual technology skill guides
- `.claude/commands/` - CLI commands (audit, plan, eng)
- `docs/` - Project-specific documentation

## Adding New Guides

When adding a new architecture guide:

1. Follow the structure template above
2. Include practical code examples
3. Document anti-patterns
4. Add to this README
5. Create a corresponding CLAUDE.md template if applicable
