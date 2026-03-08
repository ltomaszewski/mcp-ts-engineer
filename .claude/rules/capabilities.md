---
globs: src/capabilities/**, src/core/capability-registry/**
---

# Capability Development

Guide for creating and managing MCP capabilities.

## Capability Structure

```typescript
interface CapabilityDefinition {
  name: string;                  // Unique capability identifier
  title: string;                 // Human-readable title
  description: string;           // What the capability does
  inputSchema: ZodSchema;        // Zod schema for validation
  handler: CapabilityHandler;    // Async implementation function
}
```

## Adding New Capabilities

1. Create directory: `mkdir -p src/capabilities/my-capability/{prompts,__tests__}`

2. Define schemas (`my-capability.schema.ts`):
```typescript
import { z } from "zod";
export const MyCapabilityInputSchema = z.object({
  input: z.string().min(1).max(10000),
  options: z.object({
    model: z.enum(["haiku", "sonnet"]).default("haiku"),
  }).optional(),
});
export type MyCapabilityInput = z.infer<typeof MyCapabilityInputSchema>;
```

3. Create prompts (`prompts/v1.ts`):
```typescript
export const PROMPT_V1 = `You are a specialized assistant.\nTask: {task}`.trim();
```

4. Implement capability (`my-capability.capability.ts`):
```typescript
export const myCapabilityDefinition: CapabilityDefinition = {
  name: "my_capability",
  title: "My Capability",
  description: "What this does",
  inputSchema: MyCapabilityInputSchema,
  handler: async (input, context) => {
    const { sessionManager, aiProvider, costTracker } = context;
    const session = await sessionManager.openSession({ capabilityName: "my_capability", metadata: { input } });
    try {
      const result = await aiProvider.query({ sessionId: session.sessionId, prompt: PROMPT_V1.replace("{task}", input.input), maxTurns: 1, budgetUsd: 0.01, timeoutMs: 30000 });
      await costTracker.recordCost(session.sessionId, result.costUsd);
      await sessionManager.closeSession(session.sessionId, { success: true, result: result.response });
      return { result: result.response, metadata: { cost_usd: result.costUsd, turns: result.turns } };
    } catch (error) {
      await sessionManager.closeSession(session.sessionId, { success: false, error: error instanceof Error ? error.message : String(error) });
      throw error;
    }
  },
};
```

5. Register in `src/capabilities/index.ts`:
```typescript
registry.registerCapability(myCapabilityDefinition);
```

6. Add tests: schema validation, handler logic, integration

## Capability Visibility

Capabilities can be `public` (default) or `internal`:

- **Public**: Exposed as MCP tools, invokable by external clients
- **Internal**: Only accessible via `context.invokeCapability()` from other capabilities

### When to use `internal`:
- Sub-capabilities that are implementation details of an orchestrator
- Helper capabilities that should only be called by other capabilities
- Workflow steps that don't make sense to invoke independently

### Example:
```typescript
// Public orchestrator - exposed to clients
export const orchestratorCapability: CapabilityDefinition = {
  id: "orchestrator",
  type: "tool",
  // No visibility = defaults to "public"
  processResult: async (input, aiResult, context) => {
    const step1 = await context.invokeCapability("internal_step_1", {});
    return { step1 };
  },
};

// Internal step - NOT exposed to clients
export const internalStep: CapabilityDefinition = {
  id: "internal_step_1",
  type: "tool",
  visibility: "internal",
};
```

## Known Issue: Working Directory Path Duplication

Claude Code CLI agents may change their working directory during execution, causing file writes to nested duplicate paths (e.g., `target/target/src/...`).

**Mitigation**:
1. Phase prompts instruct agents to avoid `cd` and use absolute paths
2. `.gitignore` excludes nested path patterns
3. Remove nested directories after execution if detected
