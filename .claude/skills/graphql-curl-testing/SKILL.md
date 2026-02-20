---
name: graphql-curl-testing
description: GraphQL API testing with curl - authentication flow, protected endpoints, sleep sessions. Use when testing API endpoints, debugging requests, or validating GraphQL functionality.
---

# GraphQL curl Testing

> Tested curl commands for validating and debugging the Bastion GraphQL API.

---

## When to Use

**LOAD THIS SKILL** when user is:
- Testing GraphQL API endpoints with curl
- Debugging authentication or API requests
- Validating signup, login, or protected endpoints
- Testing domain-specific APIs
- Troubleshooting API responses

---

## Critical Rules

**ALWAYS:**
1. Use single-line JSON — avoids shell parsing issues
2. Use `/bin/bash` for scripts — zsh can have escaping issues
3. Pretty print with `jq` — `curl ... | jq .`
4. Use `-s` flag — silent mode hides progress bars
5. Extract values with jq — `$(echo "$RESP" | jq -r '.data.login.accessToken')`

**NEVER:**
1. Use multi-line JSON in curl commands — shell parsing breaks
2. Hardcode tokens in scripts — use variables
3. Skip error checking — always check for `errors` array in response
4. Forget Content-Type header — GraphQL requires `application/json`

---

## Core Patterns

### Base URLs

```bash
# Local
BASE_URL="http://localhost:3001/v3/graphql"

# Development
BASE_URL="https://bastion-server-dev.azurewebsites.net/v3/graphql"

# Production
BASE_URL="https://bastion-server-prod.azurewebsites.net/v3/graphql"
```

### Shell Variable Escaping

```bash
# Pattern for including shell variables in JSON
curl ... -d '{"variables": {"email": "'"$EMAIL"'"}}'
```

### Quick Signup

```bash
curl -s -X POST "$BASE_URL" \
  -H "Content-Type: application/json" \
  -d '{"query": "mutation { signup(input: { email: \"test@example.com\", password: \"password123\" }) { accessToken refreshToken } }"}'
```

### Quick Login

```bash
curl -s -X POST "$BASE_URL" \
  -H "Content-Type: application/json" \
  -d '{"query": "mutation { login(input: { email: \"test@example.com\", password: \"password123\" }) { accessToken } }"}'
```

### Protected Query with Token

```bash
curl -s -X POST "$BASE_URL" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -d '{"query": "query { user { email } }"}'
```

### Full Authentication Flow

```bash
#!/bin/bash
BASE_URL="http://localhost:3001/v3/graphql"
EMAIL="test@example.com"
PASSWORD="password123"

# Login
RESP=$(curl -s -X POST "$BASE_URL" \
  -H "Content-Type: application/json" \
  -d '{"query": "mutation { login(input: { email: \"'"$EMAIL"'\", password: \"'"$PASSWORD"'\" }) { accessToken } }"}')

# Extract token
ACCESS_TOKEN=$(echo "$RESP" | jq -r '.data.login.accessToken')

# Use token for protected query
curl -s -X POST "$BASE_URL" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -d '{"query": "query { user { id email } }"}' | jq .
```

### Health Check

```bash
curl -s -X POST "$BASE_URL" \
  -H "Content-Type: application/json" \
  -d '{"query": "{ __typename }"}' \
  -o /dev/null -w "%{http_code}"
# Should return: 200
```

---

## Anti-Patterns

**BAD** — Multi-line JSON (shell breaks):
```bash
curl -d '{
  "query": "mutation { login }"
}'
```

**GOOD** — Single-line JSON:
```bash
curl -d '{"query": "mutation { login(input: {...}) { accessToken } }"}'
```

**BAD** — No error checking:
```bash
TOKEN=$(curl ... | jq -r '.data.login.accessToken')
# May be null if login failed!
```

**GOOD** — Check for errors:
```bash
RESP=$(curl -s ...)
if echo "$RESP" | jq -e '.errors' > /dev/null; then
  echo "Error: $(echo "$RESP" | jq -r '.errors[0].message')"
  exit 1
fi
TOKEN=$(echo "$RESP" | jq -r '.data.login.accessToken')
```

---

## Quick Reference

| Task | Command |
|------|---------|
| Health check | `curl -s -X POST "$URL" -H "Content-Type: application/json" -d '{"query": "{ __typename }"}'` |
| Pretty print | `curl ... \| jq .` |
| Extract field | `jq -r '.data.fieldName'` |
| Check errors | `jq -e '.errors'` |
| HTTP status only | `-o /dev/null -w "%{http_code}"` |
| Silent mode | `-s` |
| Variable in JSON | `'{"key": "'"$VAR"'"}'` |

### Error Response Format

```json
{
  "errors": [{ "message": "Error", "extensions": { "code": "ERROR_CODE" } }],
  "data": null
}
```

Common codes: `UNAUTHENTICATED`, `BAD_USER_INPUT`, `FORBIDDEN`

---

## Deep Dive References

| When you need | Load |
|---------------|------|
| Complete endpoint examples | [01-api-endpoints.md](01-api-endpoints.md) |

---

**Source:** Internal API testing guide
