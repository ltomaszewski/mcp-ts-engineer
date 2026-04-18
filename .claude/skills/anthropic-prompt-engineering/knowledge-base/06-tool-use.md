# 06: Tool Use (Function Calling)

**Source**: Anthropic Official Documentation (2025-2026)
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

## Opus 4.7 Tool-Use Behavior

Claude Opus 4.7 makes different default choices than 4.6:

- **Fewer tool calls by default.** The model reasons more before acting. Raise effort to `xhigh` or `max` to increase tool usage when needed.
- **Fewer subagents spawned by default.** 4.7 is more conservative about fan-out. Explicitly describe when subagents are warranted in your system prompt.
- **Built-in progress updates.** 4.7 produces progress messages during long agentic traces natively. Remove scaffolding prompts that forced "give me an update every N steps."
- **Interleaved thinking between tool calls** is automatic when adaptive thinking is enabled — no beta header needed (previously `interleaved-thinking-2025-05-14`).
- **High-resolution vision**: images up to 2576px / 3.75MP. **1:1 pixel-to-coordinate mapping** — no scale factor applied. Critical for computer-use and screenshot analysis where pixel-precise targeting matters.
- **Improved memory-tool usage.** 4.7 is better at writing and retrieving from the memory tool — pair with memory for long-horizon multi-session work.
- **Sampling parameters rejected** (`temperature`, `top_p`, `top_k`). Behavior tuning happens through tool descriptions and system prompt only.

### Beta headers now GA on 4.7 — REMOVE

These three headers are no longer needed (and sending them is a cleanup flag):
- `effort-2025-11-24`
- `fine-grained-tool-streaming-2025-05-14`
- `interleaved-thinking-2025-05-14`

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

> "Even small refinements to tool descriptions can yield dramatic improvements in tool use performance."
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

> "Claude 4.6 models are trained for precise instruction following. If you say 'can you suggest some changes,' it will sometimes provide suggestions rather than implementing them."

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

### Overtriggering on Claude 4.6

Claude 4.6 is significantly more proactive about using tools. If your prompts were designed to reduce undertriggering on older models, they may now **overtrigger**:

- **Dial back aggressive language**: Replace "CRITICAL: You MUST use this tool when..." with "Use this tool when..."
- **Remove over-prompting**: Instructions like "If in doubt, use [tool]" will cause overuse on 4.6
- **Use targeted guidance**: Instead of "Default to using [tool]," use "Use [tool] when it would enhance your understanding"

---

## Advanced Tool Use Patterns

### Tool Search Tool (Dynamic Discovery)

Instead of loading all tool definitions upfront, use the Tool Search Tool for dynamic discovery. Mark infrequently-used tools with `defer_loading: true`.

**Performance**: 85% reduction in token usage; accuracy improved from 49% to 74% (Opus 4) and 79.5% to 88.1% (Opus 4.5).

```json
{
  "tools": [
    {"type": "tool_search_tool_regex_20251119", "name": "tool_search_tool_regex"},
    {
      "name": "github.createPullRequest",
      "defer_loading": true
    }
  ]
}
```

**For MCP servers** — defer entire servers while keeping high-use tools accessible:

```json
{
  "type": "mcp_toolset",
  "mcp_server_name": "google-drive",
  "default_config": {"defer_loading": true},
  "configs": {
    "search_files": {"defer_loading": false}
  }
}
```

**When to use**:
- Tool definitions consuming >10K tokens
- 10+ tools available
- Multi-server MCP setups
- Tool selection accuracy issues

**When less beneficial**:
- Small tool libraries (<10 tools)
- All tools used frequently every session

---

### Programmatic Tool Calling (Code Execution)

Claude writes Python code to orchestrate multiple tools, processing outputs in a sandboxed environment. Only final results enter Claude's context — **preventing "context pollution"** from intermediate data.

**Performance**: 37% token reduction; eliminates 19+ inference passes for 20+ tool calls.

**Step 1: Mark tools callable from code**

```json
{
  "tools": [
    {"type": "code_execution_20250825", "name": "code_execution"},
    {
      "name": "get_team_members",
      "allowed_callers": ["code_execution_20250825"]
    }
  ]
}
```

**Step 2: Claude generates orchestration code**

```python
team = await get_team_members("engineering")
levels = list(set(m["level"] for m in team))
budget_results = await asyncio.gather(*[
    get_budget_by_level(level) for level in levels
])
# Only final aggregated results return to Claude's context
print(json.dumps(exceeded))
```

**When to use**:
- Processing large datasets needing only aggregates
- Multi-step workflows with 3+ dependent tool calls
- Filtering/transforming before Claude sees data
- Parallel operations across many items

**When less beneficial**:
- Simple single-tool invocations
- Tasks where Claude should see all intermediate results

---

### Tool Use Examples (input_examples)

Add concrete usage examples directly to tool definitions. JSON Schema defines structural validity but can't express usage patterns — examples show real conventions.

**Performance**: Accuracy improved from 72% to 90% on complex parameter handling.

```json
{
  "name": "create_ticket",
  "input_schema": {
    "properties": {
      "title": {"type": "string"},
      "priority": {"enum": ["low", "medium", "high", "critical"]},
      "labels": {"type": "array"},
      "reporter": {"type": "object"}
    }
  },
  "input_examples": [
    {
      "title": "Login page returns 500 error",
      "priority": "critical",
      "labels": ["bug", "authentication"],
      "reporter": {"id": "USR-12345", "name": "Jane Smith"}
    },
    {
      "title": "Add dark mode support",
      "labels": ["feature-request"],
      "reporter": {"id": "USR-67890", "name": "Alex Chen"}
    },
    {"title": "Update API documentation"}
  ]
}
```

**What examples teach Claude**:
- Format conventions (dates, IDs, labels)
- Optional parameter inclusion patterns
- Parameter correlations and pairings
- Nested structure patterns

**Best practices**:
- Use realistic data (real city names, plausible prices)
- Show minimal, partial, and full specification patterns
- Keep to 1-5 examples per tool
- Focus on ambiguous areas JSON Schema cannot express

---

### Feature Layering Strategy

Start with the biggest bottleneck:
1. **Context bloat from definitions** → Tool Search Tool
2. **Intermediate results in context** → Programmatic Tool Calling
3. **Parameter errors** → Tool Use Examples

These features are complementary and can be layered together.

### Enabling Advanced Features

```python
client.beta.messages.create(
    betas=["advanced-tool-use-2025-11-20"],
    model="claude-sonnet-4-6",
    max_tokens=4096,
    tools=[
        {"type": "tool_search_tool_regex_20251119", "name": "tool_search_tool_regex"},
        {"type": "code_execution_20250825", "name": "code_execution"}
    ]
)
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
- [ ] Consider `defer_loading: true` if tool library is large (10+)
- [ ] Add `input_examples` for tools with complex parameters
- [ ] Mark tools for programmatic calling if orchestration would reduce context

---

**Next**: [07-agentic-prompts.md](07-agentic-prompts.md) - Designing autonomous agent systems
