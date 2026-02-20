# 06: Tool Use (Function Calling)

**Source**: Anthropic Official Documentation
**Principle**: Detailed tool descriptions are the #1 factor in tool use performance.

---

## Tool Use Overview

Claude can call external functions (tools) to:
- Access real-time information
- Perform calculations
- Interact with APIs
- Modify files and systems
- Execute actions in the world

---

## Tool Definition Structure

### Required Fields

```json
{
  "name": "get_weather",
  "description": "Detailed description of what the tool does",
  "input_schema": {
    "type": "object",
    "properties": {
      "location": {
        "type": "string",
        "description": "The city and state, e.g. San Francisco, CA"
      }
    },
    "required": ["location"]
  }
}
```

### The Description is Critical

> "Even small refinements to tool descriptions can yield dramatic improvements. Claude Sonnet 3.5 achieved state-of-the-art performance on the SWE-bench evaluation after precise refinements to tool descriptions."
> — Anthropic Engineering

---

## Writing Effective Tool Descriptions

### The Golden Rule

**Write descriptions as you would explain to a new team member**: make implicit context explicit.

### Good vs. Poor Descriptions

**Poor Description**:
```json
{
  "name": "get_stock_price",
  "description": "Gets the stock price for a ticker.",
  "input_schema": {
    "properties": {
      "ticker": {"type": "string"}
    }
  }
}
```

**Good Description**:
```json
{
  "name": "get_stock_price",
  "description": "Retrieves the current stock price for a given ticker symbol. The ticker symbol must be a valid symbol for a publicly traded company on a major US stock exchange like NYSE or NASDAQ. The tool will return the latest trade price in USD. It should be used when the user asks about the current or most recent price of a specific stock. It will not provide any other information about the stock or company.",
  "input_schema": {
    "properties": {
      "ticker": {
        "type": "string",
        "description": "The stock ticker symbol, e.g. AAPL for Apple Inc."
      }
    },
    "required": ["ticker"]
  }
}
```

### What to Include in Descriptions

1. **What the tool does** - Core functionality
2. **When to use it** - Triggering conditions
3. **When NOT to use it** - Boundaries and limitations
4. **What it returns** - Output format and content
5. **Parameter meanings** - Not just names, but semantics
6. **Edge cases** - How unusual inputs are handled

**Aim for 3-4 sentences minimum**, more for complex tools.

---

## Parameter Design

### Use Unambiguous Names

```json
// BAD
"user": {"type": "string"}  // User what? ID? Name? Email?

// GOOD
"user_id": {"type": "string", "description": "The unique numeric user ID from the database"}
```

### Document Implicit Context

```json
{
  "query": {
    "type": "string",
    "description": "Search query using Lucene syntax. Supports operators: AND, OR, NOT, wildcards (*), phrase matching (\"exact phrase\"). Field-specific search: field:value. Example: 'status:active AND created:[2024-01-01 TO *]'"
  }
}
```

### Provide Examples in Descriptions

```json
{
  "date": {
    "type": "string",
    "description": "Date in ISO 8601 format. Examples: '2024-01-15', '2024-01-15T14:30:00Z', '2024-01-15T14:30:00-08:00'"
  }
}
```

---

## Tool Response Design

### Prioritize Signal Over Flexibility

Return contextually relevant fields:

```json
// For a user lookup, return:
{
  "name": "Jane Smith",
  "department": "Engineering",
  "email": "jane@company.com"
}

// NOT low-level identifiers:
{
  "uuid": "550e8400-e29b-41d4-a716-446655440000",
  "created_at_epoch": 1704067200,
  "status_code": 1
}
```

### Use Semantic Naming

```json
// BAD - Cryptic identifiers encourage hallucination
{"id": "a7b3c9d2", "type": 3}

// GOOD - Meaningful language
{"user_id": "user_jane_smith", "account_type": "enterprise"}
```

### Token Efficiency

```json
{
  "response_format": {
    "type": "string",
    "enum": ["concise", "detailed"],
    "description": "Output detail level. 'concise' returns summary only. 'detailed' includes all fields.",
    "default": "concise"
  }
}
```

### Implement Pagination

For tools that return lists:

```json
{
  "limit": {
    "type": "integer",
    "description": "Maximum results to return (1-100)",
    "default": 10
  },
  "offset": {
    "type": "integer",
    "description": "Number of results to skip for pagination",
    "default": 0
  }
}
```

> "Implement pagination, range selection, filtering, and/or truncation with sensible default parameter values for any tool responses that could use up lots of context. For Claude Code, tool responses are restricted to 25,000 tokens by default."
> — Anthropic Engineering

---

## Tool Use Patterns

### Pattern 1: Search Before Act

```json
[
  {
    "name": "search_files",
    "description": "Search for files matching a pattern. Use this BEFORE read_file to find relevant files."
  },
  {
    "name": "read_file",
    "description": "Read the contents of a file. Always search first to find the right file."
  }
]
```

### Pattern 2: Namespaced Tools

Group related tools with prefixes:

```json
[
  {"name": "github_search_issues", "description": "..."},
  {"name": "github_get_issue", "description": "..."},
  {"name": "github_create_issue", "description": "..."},
  {"name": "jira_search_issues", "description": "..."},
  {"name": "jira_get_issue", "description": "..."}
]
```

### Pattern 3: Consolidated Tools

Instead of many granular tools, combine related operations:

```json
// Instead of: list_users, list_events, create_event, update_event, delete_event

{
  "name": "manage_calendar",
  "description": "Manage calendar events. Supports: list, create, update, delete operations.",
  "input_schema": {
    "properties": {
      "operation": {
        "type": "string",
        "enum": ["list", "create", "update", "delete"]
      },
      "event_data": {
        "type": "object",
        "description": "Event details (for create/update)"
      },
      "event_id": {
        "type": "string",
        "description": "Event ID (for update/delete)"
      }
    }
  }
}
```

---

## Controlling Tool Use

### Tool Choice Options

| Option | Behavior |
|--------|----------|
| `auto` (default) | Claude decides whether to use tools |
| `any` | Claude must use one tool, but chooses which |
| `tool` | Claude must use the specified tool |
| `none` | Claude cannot use any tools |

### Forcing Specific Tool

```python
tool_choice = {"type": "tool", "name": "get_weather"}
```

**Note**: When using `any` or `tool`, Claude won't provide natural language before the tool call.

---

## Parallel Tool Use

Claude can call multiple tools simultaneously when operations are independent.

### Encouraging Parallel Calls

Add to system prompt:
```
For maximum efficiency, whenever you need to perform multiple independent operations, invoke all relevant tools simultaneously rather than sequentially.
```

For stronger enforcement:
```
<use_parallel_tool_calls>
Whenever you perform multiple independent operations, invoke all relevant tools simultaneously rather than sequentially. Prioritize calling tools in parallel whenever possible.
</use_parallel_tool_calls>
```

### Proper Result Formatting

**Critical**: All tool results must be in a single user message:

```json
// CORRECT: Single user message with all results
{
  "role": "user",
  "content": [
    {"type": "tool_result", "tool_use_id": "toolu_01", "content": "Result 1"},
    {"type": "tool_result", "tool_use_id": "toolu_02", "content": "Result 2"}
  ]
}

// WRONG: Separate messages (breaks parallel tool use pattern)
{
  "role": "user",
  "content": [{"type": "tool_result", "tool_use_id": "toolu_01", "content": "Result 1"}]
},
{
  "role": "user",
  "content": [{"type": "tool_result", "tool_use_id": "toolu_02", "content": "Result 2"}]
}
```

---

## Error Handling

### Reporting Tool Errors

```json
{
  "type": "tool_result",
  "tool_use_id": "toolu_01A09q90qw90lq917835lq9",
  "content": "ConnectionError: the weather service API is not available (HTTP 500)",
  "is_error": true
}
```

### Good Error Messages

```json
// BAD: Opaque error
{"error": "E_CONN_001"}

// GOOD: Actionable error
{
  "error": "connection_failed",
  "message": "Could not connect to weather API. The service may be down.",
  "suggestion": "Try again in a few minutes or use an alternative data source."
}
```

---

## Tool Response Format Testing

> "Even your tool response structure—XML, JSON, or Markdown—can have an impact on evaluation performance."

Test different formats for your use case:

```json
// JSON format
{"temperature": 72, "conditions": "sunny"}

// Markdown format
"**Temperature**: 72°F\n**Conditions**: Sunny"

// XML format
"<weather><temperature>72</temperature><conditions>sunny</conditions></weather>"
```

---

## Claude 4 Specific Guidance

### Explicit Tool Use Instructions

> "Claude 4.5 models are trained for precise instruction following. If you say 'can you suggest some changes,' it will sometimes provide suggestions rather than implementing them."

Add to system prompt:
```
By default, implement changes rather than only suggesting them.
When you can accomplish a task using tools, do so immediately rather than explaining what you would do.
```

### Thinking Before Tool Use

For complex tool decisions:
```
Before making a tool call, briefly consider:
1. Is this the right tool?
2. Do I have all required parameters?
3. What do I expect the result to be?
```

---

## Tool Definition Checklist

- [ ] Name is clear and descriptive (verb_noun format)
- [ ] Description is 3+ sentences explaining what, when, and how
- [ ] Each parameter has a detailed description with examples
- [ ] Required parameters are marked
- [ ] Edge cases and limitations are documented
- [ ] Return format is specified
- [ ] Error conditions are described
- [ ] Related tools are mentioned (e.g., "Use X before this tool")

---

**Next**: [07-agentic-prompts.md](07-agentic-prompts.md) - Designing autonomous agent systems
