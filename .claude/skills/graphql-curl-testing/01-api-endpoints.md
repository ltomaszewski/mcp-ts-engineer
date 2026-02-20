# GraphQL API Endpoints - curl Commands

All commands tested and verified. Use with `BASE_URL="http://localhost:3001/v3/graphql"`.

## Authentication (Public)

### Signup
```bash
curl -s -X POST "$BASE_URL" \
  -H "Content-Type: application/json" \
  -d '{"query": "mutation Signup($input: SignupInput!) { signup(input: $input) { accessToken refreshToken expiresIn user { email settings { timezone } } } }", "variables": {"input": {"email": "test@example.com", "password": "password123"}}}'
```

### Signup with Kid
```bash
curl -s -X POST "$BASE_URL" \
  -H "Content-Type: application/json" \
  -d '{"query": "mutation Signup($input: SignupInput!) { signup(input: $input) { accessToken refreshToken user { email selectedKidDetails { name age isHim } } } }", "variables": {"input": {"email": "parent@example.com", "password": "password123", "kid": {"name": "Emma", "dateOfBirth": "2023-06-15", "isHim": false, "sleepTime": "2024-01-01T19:30:00.000Z", "wakeTime": "2024-01-01T07:00:00.000Z"}}}}'
```

### Login
```bash
curl -s -X POST "$BASE_URL" \
  -H "Content-Type: application/json" \
  -d '{"query": "mutation Login($input: LoginInput!) { login(input: $input) { accessToken refreshToken expiresIn user { email } } }", "variables": {"input": {"email": "test@example.com", "password": "password123"}}}'
```

### Refresh Token
```bash
curl -s -X POST "$BASE_URL" \
  -H "Content-Type: application/json" \
  -d '{"query": "mutation RefreshToken($input: RefreshTokenInput!) { refreshToken(input: $input) { accessToken refreshToken expiresIn } }", "variables": {"input": {"refreshToken": "YOUR_REFRESH_TOKEN"}}}'
```

## Protected Endpoints

All require: `-H "Authorization: Bearer $ACCESS_TOKEN"`

### Get User
```bash
curl -s -X POST "$BASE_URL" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -d '{"query": "query { user { email settings { selectedKidId timezone pushNotificationEnabled } sleepScore } }"}'
```

### Get User with Sleep States
```bash
curl -s -X POST "$BASE_URL" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -d '{"query": "query { userWithSleepStates { email selectedKidDetails { name age isHim } selectedKidSleepData { sleepGoal totalAsleep } } }"}'
```

### Get Kids
```bash
curl -s -X POST "$BASE_URL" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -d '{"query": "query { kids { id name isHim ageInMonths onboarding { childName kidDateOfBirth sleepTime wakeTime } } }"}'
```

### Add Kid
```bash
curl -s -X POST "$BASE_URL" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -d '{"query": "mutation AddKid($input: AddKidInput!) { addKid(input: $input) { id name isHim ageInMonths } }", "variables": {"input": {"isHim": true, "onboarding": {"childName": "Jack", "kidDateOfBirth": "2022-03-20", "sleepTime": "2024-01-01T20:00:00.000Z", "wakeTime": "2024-01-01T07:30:00.000Z"}}}}'
```

### Update Settings
```bash
curl -s -X POST "$BASE_URL" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -d '{"query": "mutation UpdateSettings($input: UpdateSettingsInput!) { updateSettings(input: $input) { email settings { selectedKidId timezone pushNotificationEnabled } } }", "variables": {"input": {"selectedKidId": "KID_ID", "timezone": "America/New_York", "pushNotificationEnabled": true}}}'
```

## Sleep Sessions

### Query Sessions
```bash
curl -s -X POST "$BASE_URL" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -d '{"query": "query SleepSessions($input: ScheduleQueryInput!) { sleepSessions(input: $input) { id startDate endDate type isScheduled } }", "variables": {"input": {"kidId": "KID_ID", "startDate": "2024-12-01T00:00:00.000Z", "endDate": "2024-12-31T23:59:59.999Z"}}}'
```

### Add Session
```bash
curl -s -X POST "$BASE_URL" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -d '{"query": "mutation AddSleepSession($input: AddSleepSessionInput!) { addSleepSession(input: $input) { id startDate endDate type isScheduled } }", "variables": {"input": {"kidId": "KID_ID", "startDate": "2024-12-15T13:00:00.000Z", "endDate": "2024-12-15T14:30:00.000Z", "type": "Nap"}}}'
```

### Start In-Progress Session
```bash
curl -s -X POST "$BASE_URL" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -d '{"query": "mutation AddSleepSession($input: AddSleepSessionInput!) { addSleepSession(input: $input) { id startDate type } }", "variables": {"input": {"kidId": "KID_ID", "startDate": "2024-12-15T13:00:00.000Z", "type": "InProgress"}}}'
```

### End Session
```bash
curl -s -X POST "$BASE_URL" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -d '{"query": "mutation EndSleepSession($input: EndSleepSessionInput!) { endSleepSession(input: $input) { id startDate endDate type } }", "variables": {"input": {"id": "SESSION_ID", "endDate": "2024-12-15T14:30:00.000Z", "type": "Nap"}}}'
```

### Edit Session
```bash
curl -s -X POST "$BASE_URL" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -d '{"query": "mutation EditSleepSession($input: EditSleepSessionInput!) { editSleepSession(input: $input) { id startDate endDate type } }", "variables": {"input": {"id": "SESSION_ID", "startDate": "2024-12-15T13:15:00.000Z", "endDate": "2024-12-15T14:45:00.000Z", "type": "Nap"}}}'
```

### Delete Session
```bash
curl -s -X POST "$BASE_URL" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -d '{"query": "mutation DeleteSleepSession($id: ID!) { deleteSleepSession(id: $id) }", "variables": {"id": "SESSION_ID"}}'
```

## Profile & Logout

### Get Profile
```bash
curl -s -X POST "$BASE_URL" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -d '{"query": "query { profile { name age email totalHours distinctDaysCount sessionsByMonth { monthYear days } } }"}'
```

### Logout
```bash
curl -s -X POST "$BASE_URL" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -d '{"query": "mutation Logout($input: RefreshTokenInput!) { logout(input: $input) { success message } }", "variables": {"input": {"refreshToken": "YOUR_REFRESH_TOKEN"}}}'
```

### Logout All
```bash
curl -s -X POST "$BASE_URL" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -d '{"query": "mutation { logoutAll { success message } }"}'
```

### Delete Account
```bash
curl -s -X POST "$BASE_URL" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -d '{"query": "mutation { deleteAccount }"}'
```

## Complete Test Script

Save as `test_api.sh` and run with `/bin/bash test_api.sh`:

```bash
#!/bin/bash
BASE_URL="http://localhost:3001/v3/graphql"
EMAIL="test_$(date +%s)@example.com"

echo "=== SIGNUP ===" && echo "Email: $EMAIL"
SIGNUP=$(curl -s -X POST "$BASE_URL" -H "Content-Type: application/json" \
  -d '{"query": "mutation Signup($input: SignupInput!) { signup(input: $input) { accessToken refreshToken } }", "variables": {"input": {"email": "'"$EMAIL"'", "password": "password123", "kid": {"name": "Baby", "dateOfBirth": "2024-01-15", "isHim": true, "sleepTime": "2024-01-01T19:30:00.000Z", "wakeTime": "2024-01-01T07:00:00.000Z"}}}}')
echo "$SIGNUP" | jq .
ACCESS_TOKEN=$(echo "$SIGNUP" | jq -r '.data.signup.accessToken')
REFRESH_TOKEN=$(echo "$SIGNUP" | jq -r '.data.signup.refreshToken')

echo -e "\n=== LOGIN ==="
LOGIN=$(curl -s -X POST "$BASE_URL" -H "Content-Type: application/json" \
  -d '{"query": "mutation Login($input: LoginInput!) { login(input: $input) { accessToken } }", "variables": {"input": {"email": "'"$EMAIL"'", "password": "password123"}}}')
echo "$LOGIN" | jq .
ACCESS_TOKEN=$(echo "$LOGIN" | jq -r '.data.login.accessToken')

echo -e "\n=== GET USER ==="
curl -s -X POST "$BASE_URL" -H "Content-Type: application/json" -H "Authorization: Bearer $ACCESS_TOKEN" \
  -d '{"query": "query { user { email settings { timezone } } }"}' | jq .

echo -e "\n=== GET KIDS ==="
KIDS=$(curl -s -X POST "$BASE_URL" -H "Content-Type: application/json" -H "Authorization: Bearer $ACCESS_TOKEN" \
  -d '{"query": "query { kids { id name } }"}')
echo "$KIDS" | jq .
KID_ID=$(echo "$KIDS" | jq -r '.data.kids[0].id')

echo -e "\n=== ADD SESSION ==="
SESSION=$(curl -s -X POST "$BASE_URL" -H "Content-Type: application/json" -H "Authorization: Bearer $ACCESS_TOKEN" \
  -d '{"query": "mutation AddSleepSession($input: AddSleepSessionInput!) { addSleepSession(input: $input) { id type } }", "variables": {"input": {"kidId": "'"$KID_ID"'", "startDate": "2024-12-15T13:00:00.000Z", "endDate": "2024-12-15T14:30:00.000Z", "type": "Nap"}}}')
echo "$SESSION" | jq .
SESSION_ID=$(echo "$SESSION" | jq -r '.data.addSleepSession.id')

echo -e "\n=== DELETE SESSION ==="
curl -s -X POST "$BASE_URL" -H "Content-Type: application/json" -H "Authorization: Bearer $ACCESS_TOKEN" \
  -d '{"query": "mutation DeleteSleepSession($id: ID!) { deleteSleepSession(id: $id) }", "variables": {"id": "'"$SESSION_ID"'"}}' | jq .

echo -e "\n=== TESTS COMPLETE ==="
```

## Tips

1. **Pretty print**: `curl ... | jq .`
2. **Extract token**: `TOKEN=$(echo "$RESP" | jq -r '.data.login.accessToken')`
3. **Debug**: Add `-v` flag
4. **Variable in JSON**: `'{"email": "'"$VAR"'"}'`
5. **Use bash**: Run with `/bin/bash script.sh`
