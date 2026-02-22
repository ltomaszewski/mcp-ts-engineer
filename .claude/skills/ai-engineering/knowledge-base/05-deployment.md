# Production Deployment Checklist

End-to-end guide for deploying Claude Agent SDK systems to production.

---

## Deployment Tiers

### Tier 1: Developer Laptop

Lowest security requirements. Agent runs interactively.

```typescript
const devOptions = {
  permissionMode: "default",      // Interactive approval
  model: "sonnet",
  maxTurns: 50,
  maxBudgetUsd: 5.0
};
```

**Security**: Built-in permissions system, static analysis on commands.

### Tier 2: CI/CD Pipeline

Automated, non-interactive. Agent runs in controlled environment.

```typescript
const ciOptions = {
  permissionMode: "acceptEdits",  // Auto-approve edits
  model: "haiku",                 // Fast, cheap
  maxTurns: 15,                   // Tight limits
  maxBudgetUsd: 1.0,
  allowedTools: ["Read", "Grep", "Glob", "Bash"],
  hooks: {
    PreToolUse: [{
      matcher: "Bash",
      hooks: [ciCommandGuard]     // Only allow test/lint commands
    }]
  }
};
```

**Security**: Command allowlist, budget limits, no write access to production paths.

### Tier 3: Multi-Tenant Production

Processing customer data. Maximum security.

```typescript
const prodOptions = {
  permissionMode: "bypassPermissions",  // ONLY with container isolation
  model: "sonnet",
  maxTurns: 30,
  maxBudgetUsd: 3.0,
  allowedTools: ["Read", "Edit", "Write", "Glob", "Grep"],
  // No Bash, no WebFetch, no WebSearch
  hooks: {
    PreToolUse: [{
      hooks: [securityGuard, rateLimiter, auditLogger]
    }],
    PostToolUse: [{
      hooks: [auditLogger]
    }],
    Stop: [{
      hooks: [sessionCleanup]
    }]
  }
};

// MUST run in isolated container
// docker run --cap-drop ALL --network none ...
```

**Security**: Full container isolation, credential proxy, audit logging, rate limiting.

---

## Environment Configuration

### Required Environment Variables

```bash
# Authentication (choose one)
ANTHROPIC_API_KEY=sk-ant-...            # Direct API access
# OR
CLAUDE_CODE_USE_BEDROCK=1               # AWS Bedrock
AWS_ACCESS_KEY_ID=...
AWS_SECRET_ACCESS_KEY=...
# OR
CLAUDE_CODE_USE_VERTEX=1                # Google Vertex
GOOGLE_APPLICATION_CREDENTIALS=...
# OR
CLAUDE_CODE_USE_FOUNDRY=1               # Azure Foundry

# Proxy (optional, recommended for production)
ANTHROPIC_BASE_URL=http://proxy:8080    # Route through proxy

# Agent configuration
AGENT_MAX_TURNS=30
AGENT_MAX_BUDGET=3.0
AGENT_MODEL=sonnet
NODE_ENV=production
```

### Configuration Management

```typescript
// config.ts — typed configuration from environment
interface AgentConfig {
  model: "haiku" | "sonnet" | "opus";
  maxTurns: number;
  maxBudgetUsd: number;
  allowedTools: string[];
  permissionMode: string;
}

function loadConfig(): AgentConfig {
  return {
    model: (process.env.AGENT_MODEL as any) ?? "sonnet",
    maxTurns: parseInt(process.env.AGENT_MAX_TURNS ?? "30", 10),
    maxBudgetUsd: parseFloat(process.env.AGENT_MAX_BUDGET ?? "3.0"),
    allowedTools: (process.env.AGENT_TOOLS ?? "Read,Grep,Glob").split(","),
    permissionMode: process.env.AGENT_PERMISSION_MODE ?? "acceptEdits"
  };
}

// Validate config at startup
function validateConfig(config: AgentConfig): void {
  if (config.maxTurns < 1 || config.maxTurns > 200) {
    throw new Error(`Invalid maxTurns: ${config.maxTurns}`);
  }
  if (config.maxBudgetUsd < 0.01 || config.maxBudgetUsd > 100) {
    throw new Error(`Invalid maxBudgetUsd: ${config.maxBudgetUsd}`);
  }
  if (config.permissionMode === "bypassPermissions" && !process.env.CONTAINER_ISOLATED) {
    throw new Error("bypassPermissions requires container isolation");
  }
}
```

---

## Infrastructure Patterns

### Docker Deployment

```dockerfile
# Dockerfile for agent runtime
FROM node:24-slim

# Non-root user
RUN groupadd -r agent && useradd -r -g agent -d /home/agent agent

# Install Claude Code CLI
RUN npm install -g @anthropic-ai/claude-agent-sdk@latest

# Install SDK
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --production

# Copy application
COPY dist/ ./dist/

# Security: non-root, read-only
USER agent
WORKDIR /workspace

ENTRYPOINT ["node", "/app/dist/index.js"]
```

```bash
# Run with security hardening
docker run \
  --cap-drop ALL \
  --security-opt no-new-privileges \
  --read-only \
  --tmpfs /tmp:rw,noexec,nosuid,size=100m \
  --tmpfs /workspace:rw,noexec,size=500m \
  --network none \
  --memory 2g \
  --cpus 2 \
  --pids-limit 100 \
  -v /path/to/code:/workspace:ro \
  -v /var/run/proxy.sock:/var/run/proxy.sock:ro \
  -e ANTHROPIC_BASE_URL=http://proxy:8080 \
  agent-runtime:latest
```

### Kubernetes Deployment

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: agent-worker
spec:
  replicas: 3
  template:
    spec:
      securityContext:
        runAsNonRoot: true
        runAsUser: 1000
        fsGroup: 1000
      containers:
      - name: agent
        image: agent-runtime:latest
        resources:
          limits:
            memory: "2Gi"
            cpu: "2"
          requests:
            memory: "512Mi"
            cpu: "500m"
        securityContext:
          allowPrivilegeEscalation: false
          readOnlyRootFilesystem: true
          capabilities:
            drop: ["ALL"]
        env:
        - name: ANTHROPIC_API_KEY
          valueFrom:
            secretKeyRef:
              name: agent-secrets
              key: anthropic-api-key
        - name: AGENT_MODEL
          value: "sonnet"
        - name: AGENT_MAX_TURNS
          value: "30"
        volumeMounts:
        - name: workspace
          mountPath: /workspace
        - name: tmp
          mountPath: /tmp
      volumes:
      - name: workspace
        emptyDir:
          sizeLimit: 500Mi
      - name: tmp
        emptyDir:
          sizeLimit: 100Mi
```

---

## Health Checks & Monitoring

### Health Endpoint

```typescript
import { createServer } from "http";

// Health check server (separate from agent)
const healthServer = createServer((req, res) => {
  if (req.url === "/health") {
    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(JSON.stringify({
      status: "healthy",
      uptime: process.uptime(),
      activeAgents: activeAgentCount,
      totalCost: totalCostUsd,
      lastActivity: lastActivityTimestamp
    }));
    return;
  }
  res.writeHead(404);
  res.end();
});

healthServer.listen(8081);
```

### Metrics Collection

```typescript
interface AgentMetrics {
  // Throughput
  totalSessions: number;
  activeSessions: number;
  completedSessions: number;
  failedSessions: number;

  // Cost
  totalCostUsd: number;
  avgCostPerSession: number;
  costByModel: Record<string, number>;

  // Performance
  avgTurnsPerSession: number;
  avgDurationMs: number;
  p95DurationMs: number;

  // Safety
  blockedOperations: number;
  securityViolations: number;

  // Errors
  errorRate: number;
  errorsByType: Record<string, number>;
}

class MetricsCollector {
  private metrics: AgentMetrics = { /* initial values */ };

  onSessionComplete(result: SessionResult): void {
    this.metrics.totalSessions++;
    this.metrics.completedSessions++;
    this.metrics.totalCostUsd += result.cost;
    // Update running averages...
  }

  onSessionFailed(error: Error): void {
    this.metrics.failedSessions++;
    this.metrics.errorsByType[error.name] = (this.metrics.errorsByType[error.name] ?? 0) + 1;
  }

  onOperationBlocked(): void {
    this.metrics.blockedOperations++;
  }

  getMetrics(): AgentMetrics {
    return { ...this.metrics };
  }
}
```

---

## Error Handling

### Graceful Degradation

```typescript
async function runAgentWithFallback(prompt: string): Promise<string> {
  // Try primary model
  try {
    return await runWithModel(prompt, "sonnet", 30, 3.0);
  } catch (error) {
    console.warn("Primary model failed, falling back to haiku:", error);
  }

  // Fallback to cheaper model with lower expectations
  try {
    return await runWithModel(prompt, "haiku", 15, 1.0);
  } catch (error) {
    console.error("Fallback also failed:", error);
    throw new Error(`Agent failed on both models: ${error}`);
  }
}

async function runWithModel(
  prompt: string,
  model: string,
  maxTurns: number,
  maxBudget: number
): Promise<string> {
  let result = "";
  for await (const msg of query({
    prompt,
    options: { model, maxTurns, maxBudgetUsd: maxBudget }
  })) {
    if ("result" in msg) {
      if (msg.is_error) throw new Error(msg.result ?? "Unknown error");
      result = msg.result ?? "";
    }
  }
  return result;
}
```

### Retry with Backoff

```typescript
async function retryAgent(
  prompt: string,
  options: QueryOptions,
  maxRetries: number = 3
): Promise<string> {
  let lastError: Error | undefined;

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      let result = "";
      for await (const msg of query({ prompt, options })) {
        if ("result" in msg) {
          if (msg.is_error) throw new Error(msg.result ?? "Agent error");
          result = msg.result ?? "";
        }
      }
      return result;
    } catch (error) {
      lastError = error as Error;
      const delay = Math.min(1000 * Math.pow(2, attempt), 30000);
      console.warn(`Attempt ${attempt + 1} failed, retrying in ${delay}ms:`, error);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }

  throw lastError ?? new Error("Max retries exceeded");
}
```

---

## Pre-Deploy Checklist

### Configuration
- [ ] API key in secure secret store (not environment file)
- [ ] Model selection appropriate for workload
- [ ] `maxTurns` and `maxBudgetUsd` configured
- [ ] Tool whitelist minimal and explicit
- [ ] Permission mode appropriate for deployment tier

### Security
- [ ] Container isolation for multi-tenant
- [ ] Credential proxy for API keys
- [ ] File access hooks block sensitive paths
- [ ] Command hooks block destructive operations
- [ ] Network restrictions prevent data exfiltration
- [ ] Non-root execution
- [ ] Audit logging enabled

### Reliability
- [ ] Error handling with graceful degradation
- [ ] Retry logic with exponential backoff
- [ ] Health check endpoint
- [ ] Metrics collection
- [ ] Alerting for failures and cost anomalies

### Monitoring
- [ ] Session cost tracking
- [ ] Tool usage metrics
- [ ] Error rate dashboards
- [ ] Security violation alerts
- [ ] Budget utilization alerts

### Testing
- [ ] Safety evals passing
- [ ] Functional evals passing
- [ ] Performance evals within budget
- [ ] Regression evals stable

### Operations
- [ ] Runbook for common failures
- [ ] API key rotation process
- [ ] Scaling plan for load increases
- [ ] Incident response procedure
- [ ] Log retention policy

---

**Version:** SDK 0.2.x | **Source:** https://platform.claude.com/docs/en/agent-sdk/overview
