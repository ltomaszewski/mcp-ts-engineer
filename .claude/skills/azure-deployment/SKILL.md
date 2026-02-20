---
name: azure-deployment
description: Azure App Service deployment - zip deploy, webapp commands, environment configuration. Use when deploying bastion-server to Azure, configuring app settings, or troubleshooting deployments.
---

# Azure App Service Deployment

> Deploy bastion-server to Azure App Service with fast zip deployment.

---

## When to Use

**LOAD THIS SKILL** when user is:
- Deploying bastion-server to Azure
- Configuring Azure App Service settings
- Troubleshooting deployment issues
- Viewing Azure logs
- Setting environment variables

---

## Critical Rules

**ALWAYS:**
1. Include `node_modules` in zip — fast deploy (~65s vs 10+ min with Oryx)
2. Use `--async true` — prevents CLI timeout during app startup
3. Use `az webapp deploy` — current recommended command
4. Verify with curl after deploy — app takes ~30-60s to start
5. Build before deploying — `npm run build` first

**NEVER:**
1. Use `az webapp deployment source config-zip` — deprecated command
2. Enable `SCM_DO_BUILD_DURING_DEPLOYMENT` — Oryx build is slow and unreliable
3. Deploy without building first — missing `dist/` folder causes startup failure
4. Panic on "timeout" message — deployment often succeeds despite CLI timeout

---

## Core Patterns

### Deploy to Development

```bash
cd apps/bastion-server

# 1. Build
npm run build

# 2. Create zip WITH node_modules
zip -r deploy.zip dist node_modules package.json staticWebPage \
  -x "*.git*" -x "*.test.ts" -x "**/tests/*" -x "*.map"

# 3. Deploy
az webapp deploy \
  --resource-group bastion-server-rg \
  --name bastion-server-dev \
  --src-path deploy.zip \
  --type zip \
  --async true

# 4. Clean up
rm deploy.zip
```

### Deploy to Production

```bash
cd apps/bastion-server

# 1. Build
npm run build

# 2. Create zip WITH node_modules
zip -r deploy.zip dist node_modules package.json staticWebPage \
  -x "*.git*" -x "*.test.ts" -x "**/tests/*" -x "*.map"

# 3. Deploy
az webapp deploy \
  --resource-group bastion-server-rg \
  --name bastion-server-prod \
  --src-path deploy.zip \
  --type zip \
  --async true

# 4. Clean up
rm deploy.zip
```

### Verify Deployment

```bash
# Wait ~30-60 seconds, then:
curl -s -o /dev/null -w "%{http_code}" \
  https://bastion-server-dev.azurewebsites.net/v3/graphql \
  -X POST -H "Content-Type: application/json" \
  -d '{"query":"{ __typename }"}'
# Should return: 200
```

### Stream Logs

```bash
az webapp log tail \
  --name bastion-server-dev \
  --resource-group bastion-server-rg
```

### Restart App

```bash
az webapp restart \
  --name bastion-server-dev \
  --resource-group bastion-server-rg
```

### View Environment Variables

```bash
az webapp config appsettings list \
  --name bastion-server-dev \
  --resource-group bastion-server-rg \
  --output table
```

### Set Environment Variable

```bash
az webapp config appsettings set \
  --name bastion-server-dev \
  --resource-group bastion-server-rg \
  --settings KEY="value"
```

### Download Logs

```bash
az webapp log download \
  --name bastion-server-dev \
  --resource-group bastion-server-rg \
  --log-file /tmp/logs.zip

unzip /tmp/logs.zip -d /tmp/app-logs
cat /tmp/app-logs/LogFiles/*docker*.log | tail -100

rm -rf /tmp/logs.zip /tmp/app-logs
```

---

## Anti-Patterns

**BAD** — Deprecated config-zip command:
```bash
az webapp deployment source config-zip ...  # ❌ Deprecated
```

**GOOD** — Use webapp deploy:
```bash
az webapp deploy --src-path deploy.zip --type zip --async true
```

**BAD** — Excluding node_modules (slow Oryx build):
```bash
zip -r deploy.zip dist package.json  # Missing node_modules!
```

**GOOD** — Include node_modules:
```bash
zip -r deploy.zip dist node_modules package.json staticWebPage
```

**BAD** — No --async flag (CLI timeout):
```bash
az webapp deploy --src-path deploy.zip --type zip  # Hangs!
```

**GOOD** — Use --async true:
```bash
az webapp deploy --src-path deploy.zip --type zip --async true
```

---

## Quick Reference

| Environment | Resource Group | App Service | URL |
|-------------|----------------|-------------|-----|
| Development | `bastion-server-rg` | `bastion-server-dev` | https://bastion-server-dev.azurewebsites.net |
| Production | `bastion-server-rg` | `bastion-server-prod` | https://bastion-server-prod.azurewebsites.net |

| Task | Command |
|------|---------|
| Deploy | `az webapp deploy --src-path deploy.zip --type zip --async true` |
| View logs | `az webapp log tail --name APP --resource-group RG` |
| Restart | `az webapp restart --name APP --resource-group RG` |
| Set env var | `az webapp config appsettings set --settings KEY=value` |
| List env vars | `az webapp config appsettings list --output table` |

### Required Environment Variables

| Variable | Purpose |
|----------|---------|
| `DATABASE_URL` | Production database connection |
| `DATABASE_URL_DEV` | Development database connection |
| `JWT_SECRET` | JWT signing secret |
| `NEST_PORT` | Port (Azure overrides with PORT=8080) |

### Port Configuration

Azure sets `PORT=8080`. App must listen on this:

```typescript
// src/main.ts
const port = process.env.PORT || process.env.NEST_PORT || 3001;
await app.listen(port);
```

---

## Troubleshooting

| Issue | Cause | Solution |
|-------|-------|----------|
| "Cannot find module" | node_modules not in zip | Include node_modules in zip |
| Deployment "Timeout" | Normal for --async | Verify with curl, app starts in ~3 min |
| 502 Bad Gateway | App still starting | Wait 1-2 min, check logs |
| App not starting | Missing env vars | Check `az webapp config appsettings list` |

---

**Source:** [Azure App Service Deploy](https://learn.microsoft.com/en-us/azure/app-service/deploy-zip)
