# Commit Skill

Guides through creating meaningful commits following your predefined rules.

## Workflow

This skill enforces:
- Type validation (feat, fix, docs, refactor, perf, test, chore, ci)
- Scope validation (server, mobile, types, utils, config, auth, schedule, etc.)
- Subject length limit (50 chars max, imperative mood)
- Body requirements (what changed, why, how)
- Commit lint validation

## Usage

Run `/commit` to start the guided workflow.

The skill will:
1. Check git status and staged changes
2. Show recent commits for context
3. Guide you through selecting type and scope
4. Help craft subject line and body
5. Validate against commitlint rules
6. Execute the commit

## Rules Applied

### Type
- **feat** - New feature
- **fix** - Bug fix
- **docs** - Documentation changes
- **refactor** - Code refactoring
- **perf** - Performance improvements
- **test** - Test additions/modifications
- **chore** - Maintenance tasks
- **ci** - CI/CD configuration

### Scope
Valid scopes: server, mobile, types, utils, config, auth, schedule, notifications, user, navigation, state-management, ui, screens, components, docs, infra, deps

### Validation
- Subject: max 50 chars, imperative mood, no trailing period
- Body: optional but recommended (3-5 bullet points)
- Fixes/Closes: reference issue if applicable

## Body Format

- **What changed**: 2-3 bullet points
- **Why it changed**: Business/technical reason
- **How it works**: If non-obvious implementation details
