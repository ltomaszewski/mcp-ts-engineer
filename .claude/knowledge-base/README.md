# Knowledge Base

Project-agnostic architecture guides and templates for building applications with Claude Code.

## Architecture Guides

| Guide | Description | Use For |
|-------|-------------|---------|
| [React Native Mobile Architecture](react-native-mobile-architecture.md) | Expo/React Native patterns, Zustand, TanStack Query, NativeWind | Mobile app development |
| [NestJS Backend Architecture](nestjs-backend-architecture.md) | NestJS patterns, GraphQL, MongoDB, JWT auth | Backend API development |
| [MCP Server Architecture](mcp-server-architecture.md) | Capability-based MCP server framework | MCP server development |
| [Documentation-Driven Development](documentation-driven-development.md) | Spec → Test → Implement workflow | All feature development |
| [iOS xcodebuild](ios-xcodebuild.md) | iOS simulator build best practices | iOS builds and E2E |

## Templates

| Template | Description |
|----------|-------------|
| [NestJS Backend CLAUDE.md](nestjs-backend-CLAUDE-template.md) | Template for backend app's project-specific CLAUDE.md |

## Usage

### For New Projects

1. Copy the relevant template to your app's root as `CLAUDE.md`
2. Customize with your project-specific details
3. Reference the architecture guide for detailed patterns

### For Existing Projects

1. Reference architecture guides when implementing new features
2. Use patterns described here as the baseline
3. Document project-specific deviations in your app's `CLAUDE.md`

## Guide Structure

Each architecture guide follows a consistent structure:

1. **Tech Stack Reference** - Versions and packages
2. **Project Structure** - Directory layout
3. **Core Patterns** - Primary architectural patterns
4. **Configuration Files** - Key config examples
5. **Testing Patterns** - Testing approach
6. **Naming Conventions** - File and code naming
7. **Anti-Patterns** - What to avoid

## Adding New Guides

When adding a new architecture guide:

1. Follow the structure template above
2. Include practical code examples
3. Document anti-patterns
4. Add to this README
5. Create a corresponding CLAUDE.md template if applicable
