# Create Meaningful Commit Following Project Rules

Your task: Guide the user through creating a commit message that follows the project's predefined rules and execute `git commit`.

## MUST DO (in order)

1. **Check Current State**
   - Run `git status` to verify there are staged files
   - If nothing staged, tell user they need to `git add` files first
   - If working tree is clean, stop and ask what they want to commit

2. **Gather Context**
   - Run `git diff --staged` to see actual changes
   - Run `git log --oneline -5` to check recent commits
   - Analyze the changes to understand scope and type

3. **Determine Commit Type**
   - Based on changes, identify the type:
     - `feat` - New feature
     - `fix` - Bug fix
     - `docs` - Documentation
     - `refactor` - Code refactoring
     - `perf` - Performance
     - `test` - Tests
     - `chore` - Maintenance/deps
     - `ci` - CI/CD config
   - Confirm with user if ambiguous

4. **Determine Scope**
   - Valid scopes: server, mobile, types, utils, config, auth, schedule, notifications, user, navigation, state-management, ui, screens, components, docs, infra, deps
   - Based on files changed, suggest scope
   - Ask user to confirm or provide custom scope

5. **Draft Subject Line**
   - Imperative mood: "Add", "Fix", "Update", not "Added", "Fixed"
   - Max 50 characters
   - No trailing period
   - Clear and concise

6. **Draft Body (Recommended)**
   - **What changed**: 2-3 bullet points describing the changes
   - **Why it changed**: Business/technical reason
   - **How it works**: Implementation details if non-obvious
   - **Fixes/Closes**: Reference issue if applicable (#123)

7. **Validate**
   - Show the complete commit message to user
   - Ask for confirmation before proceeding
   - Run `npx commitlint --edit` to validate (or just show validation would happen)

8. **Create Commit**
   - Run `git commit -m "..."` with the message
   - Show the result and commit hash

## Validation Rules

- **Type**: Must be one of: feat, fix, docs, refactor, perf, test, chore, ci
- **Scope**: Must be from valid scopes list (or omit)
- **Subject**:
  - Imperative mood (no -ed endings)
  - Under 50 characters
  - No trailing period
  - Starts with lowercase (except proper nouns)
- **Body**:
  - Blank line between subject and body
  - Max 100 chars per line
  - Explain what, why, and how
- **Footer**:
  - Reference issues: "Fixes #123" or "Closes #456"

## Format Template

```
<type>(<scope>): <subject under 50 chars>

- What changed: [description]
- What changed: [description]

Why it changed: [business/technical reason]

How it works: [if non-obvious]

Fixes: #[issue]
```

## Examples

```
feat(schedule): Generate sleep schedules for kids

- Added schedule generation algorithm based on age and sleep duration
- Created SleepScheduleService with new GraphQL resolver
- Added comprehensive test coverage for edge cases

Sleep schedule generation helps parents understand optimal bedtime for their children based on recommended sleep hours per age group.

Algorithm uses age-appropriate sleep duration targets and calculates optimal bedtimes by working backwards from wake time.

Closes #42
```

```
fix(auth): Resolve JWT token refresh on session expiry

- Fixed infinite loop in token refresh logic
- Added proper error handling for expired tokens
- Updated refresh token validation to check expiration

Tokens were not refreshing properly when access token expired, causing 401 errors on subsequent requests. Now properly validates refresh token before issuing new access token.

Fixes #89
```

## Important Notes

- **NEVER commit without reading the diff** - Understand what you're committing
- **ALWAYS show the complete message before committing** - User must approve
- **Ask questions if unclear** - Better to clarify than create bad commits
- **Reference recent commits** - Maintain consistency with project patterns
- **If commitlint fails**: Explain the error and help fix it, then retry
