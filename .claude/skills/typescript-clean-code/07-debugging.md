# 07 - Debugging Best Practices

**Source:** https://www.typescriptlang.org/tsconfig/#sourceMap
**TypeScript:** 5.9 | **Status:** Complete reference

---

## Source Maps Configuration

```json
// tsconfig.json
{
  "compilerOptions": {
    "sourceMap": true,
    "inlineSources": true,
    "declaration": true,
    "declarationMap": true,
    "target": "ES2022",
    "lib": ["ES2022"]
  }
}
```

## Break Method Chains

```typescript
// BAD: Hard to debug - can't inspect intermediate values
const result = users
  .filter(u => u.isActive)
  .sort((a, b) => a.name.localeCompare(b.name))
  .map(u => u.email)
  .slice(0, 10);

// GOOD: Each step is inspectable
const activeUsers = users.filter(u => u.isActive);
const sortedUsers = [...activeUsers].sort((a, b) =>
  a.name.localeCompare(b.name)
);
const emails = sortedUsers.map(u => u.email);
const result = emails.slice(0, 10);
```

## Descriptive Variable Names

```typescript
// BAD: Can't tell what values are
const x = calculate();
const temp = process(x);
const result = transform(temp);

// GOOD: Clear what each value represents
const grossAmount = calculateGrossAmount();
const discountedAmount = applyDiscount(grossAmount);
const finalPrice = addTax(discountedAmount);
```

## Use async/await for Stack Traces

```typescript
// BAD: Promise chains obscure stack traces
function fetchData() {
  return fetch(url)
    .then(res => res.json())
    .then(data => processData(data))
    .catch(err => handleError(err));
}

// GOOD: async/await preserves stack traces
async function fetchData() {
  try {
    const response = await fetch(url);
    const data = await response.json();
    return processData(data);
  } catch (error) {
    handleError(error);
  }
}
```

## Strategic Console Logging

```typescript
// Development debugging with context
function processOrder(order: Order): void {
  console.log('[processOrder] Starting', { orderId: order.id });

  const validated = validateOrder(order);
  console.log('[processOrder] Validated', { isValid: validated });

  const total = calculateTotal(order);
  console.log('[processOrder] Total calculated', { total });

  // ... rest of processing
}

// Remove or use proper logger in production
```

## VS Code Launch Configuration

```json
// .vscode/launch.json
{
  "version": "0.2.0",
  "configurations": [
    {
      "type": "node",
      "request": "launch",
      "name": "Debug TypeScript",
      "program": "${workspaceFolder}/src/index.ts",
      "preLaunchTask": "tsc: build",
      "sourceMaps": true,
      "outFiles": ["${workspaceFolder}/dist/**/*.js"]
    }
  ]
}
```

## Conditional Breakpoints

```typescript
// Add comments for conditional breakpoint locations
function processItems(items: Item[]): void {
  for (const item of items) {
    // Breakpoint condition: item.id === 'problematic-id'
    processItem(item);
  }
}
```

## Debugging Tips

1. **Use named functions** instead of anonymous for clearer stack traces
2. **Add context to errors** with cause property
3. **Log entry/exit** of complex functions during debugging
4. **Use debugger statement** for quick breakpoints
5. **Inspect closure variables** by hovering in debugger

```typescript
// Named function for clearer stack trace
const processUser = function processUser(user: User) {
  // Better than: const processUser = (user: User) => { ... }
};

// Debugger statement
function complexOperation() {
  const result = calculate();
  debugger; // Execution pauses here
  return transform(result);
}
```

## Production Debugging

```typescript
// Use structured logging with correlation IDs
async function handleRequest(req: Request): Promise<Response> {
  const requestId = generateRequestId();
  const logger = createLogger({ requestId });

  logger.info('Request received', {
    path: req.path,
    method: req.method
  });

  try {
    const result = await processRequest(req);
    logger.info('Request completed', { status: 'success' });
    return result;
  } catch (error) {
    logger.error('Request failed', { error });
    throw error;
  }
}
```

---

**Source:** https://www.typescriptlang.org/tsconfig/#sourceMap
**TypeScript:** 5.9
**Last Updated:** February 2026
