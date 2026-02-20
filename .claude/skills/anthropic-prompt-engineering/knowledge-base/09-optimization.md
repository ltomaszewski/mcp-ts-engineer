# 09: Optimization and Caching

**Source**: Anthropic Official Documentation
**Principle**: Strategic caching reduces costs by up to 90% and latency by up to 85% for long prompts.

---

## Prompt Caching Overview

Prompt caching allows you to:
- Reuse previously processed prompt content
- Reduce API costs significantly
- Lower response latency
- Enable longer context without proportional cost increase

---

## How Caching Works

### Cache Mechanics

1. **First request**: Full prompt is processed, cached portions are stored
2. **Subsequent requests**: Cached prefix is reused, only new content is processed
3. **Cache hit**: When prefix matches, costs and latency are reduced
4. **Cache miss**: When prefix differs, full processing occurs

### Cache Duration

| Duration | Use Case | Cost Impact |
|----------|----------|-------------|
| **5 minutes** (default) | Frequent reuse (every few minutes) | No extra cost (auto-refresh) |
| **1 hour** | Less frequent reuse | Additional cost |

**Recommendation**: Use 5-minute cache for regularly-used prompts. Auto-refresh keeps it active.

---

## Minimum Token Requirements

| Model | Minimum Cacheable |
|-------|-------------------|
| Claude Opus 4, Sonnet 4, Sonnet 3.7, Sonnet 3.5, Opus 3 | 1024 tokens |
| Claude Haiku 3.5, Haiku 3 | 2048 tokens |

Prompts shorter than these minimums cannot be cached.

---

## Cache Optimization Strategies

### Strategy 1: Stable Content First

Order your prompt with cacheable content at the beginning:

```
[STABLE - Cache This]
├── System prompt
├── Role definition
├── Core instructions
├── Tool definitions
├── Few-shot examples
└── Reference documents

[VARIABLE - Don't Cache]
└── User's current query
└── Session-specific context
```

### Strategy 2: Set Breakpoints Strategically

Place cache breakpoints at the end of stable sections:

```
<system_prompt>
  [System instructions - STABLE]
</system_prompt>
[CACHE BREAKPOINT]

<tools>
  [Tool definitions - STABLE]
</tools>
[CACHE BREAKPOINT]

<examples>
  [Few-shot examples - STABLE]
</examples>
[CACHE BREAKPOINT]

<user_query>
  [Current query - VARIABLE]
</user_query>
```

### Strategy 3: Maximize Examples with Caching

> "Developers often include an example or two in the prompt, but with prompt caching you can get even better performance by including 20+ diverse examples of high quality answers."

With caching, example-heavy prompts become cost-effective:
- Include 20+ diverse examples
- Cover edge cases thoroughly
- Cache the entire example set
- Only pay full cost once

---

## What Invalidates Cache?

| Change | Cache Impact |
|--------|--------------|
| Modified system prompt | Full invalidation |
| Changed tool definitions | Full invalidation |
| Added/removed images | Invalidation |
| Tool use settings changed | Invalidation |
| `tool_choice` parameter changed | Message blocks invalidated |
| Thinking parameters changed | Message content invalidated |

**Stable elements to cache**:
- System prompts
- Tool definitions
- Few-shot examples
- Reference documents

**Variable elements (don't cache)**:
- User queries
- Session-specific data
- Dynamic content

---

## Cache Content Block Limit

> "Automatic prefix checking only looks back approximately 20 content blocks from each explicit breakpoint."

If your prompt has >20 content blocks:
- Add explicit breakpoints throughout
- Or consolidate content into fewer blocks

---

## Concurrent Request Handling

> "A cache entry only becomes available after the first response begins."

For parallel requests needing cache hits:
1. Send the first request
2. Wait for response to start
3. Then send subsequent requests

---

## Caching with Extended Thinking

| Element | Cache Behavior |
|---------|----------------|
| System prompts | Cached across thinking parameter changes |
| Tools | Cached across thinking parameter changes |
| Message content | Invalidated by thinking changes |

**Implication**: If you toggle extended thinking on/off, message caches reset but system/tool caches persist.

---

## Token Efficiency Techniques

### Technique 1: Concise Instructions

```
# INEFFICIENT (many tokens)
Please analyze the following document and provide a comprehensive summary
of the key points. Make sure to include all important information while
keeping the summary at a reasonable length.

# EFFICIENT (fewer tokens)
Summarize this document. Include key points. Be concise.
```

### Technique 2: Structured Abbreviation

For repeated patterns, establish abbreviations:

```
## Abbreviations
- R = Required
- O = Optional
- E = Example
- X = Prohibited

## Rules
- Validate inputs (R)
- Log errors (R)
- Add metrics (O)
- Skip auth (X)
```

### Technique 3: Reference by Name

Instead of repeating content, reference it:

```
# INEFFICIENT
Analyze the data I provided earlier which includes customer names,
purchase dates, transaction amounts, and product categories...

# EFFICIENT
Analyze the data in <customer_data> tags.
```

### Technique 4: Pagination in Tool Responses

Limit tokens returned from tools:

```json
{
  "max_results": 10,
  "include_fields": ["name", "status"],
  "truncate_at": 1000
}
```

---

## Cost-Benefit Analysis

### When Caching Saves Most

| Scenario | Cache Benefit |
|----------|---------------|
| Long system prompts reused often | High |
| Large example sets | Very High |
| Reference documents queried repeatedly | Very High |
| Conversational agents with stable instructions | High |
| One-off queries with unique content | Low |

### Calculation

```
Standard Cost = (input_tokens × input_price) + (output_tokens × output_price)

With Caching:
First Request = (full_input × input_price) + (cache_write_cost) + output
Subsequent = (cache_read × reduced_price) + (new_tokens × input_price) + output

Savings = (cached_tokens × input_price) × (1 - cache_read_rate) × num_requests
```

---

## Implementation Patterns

### Pattern 1: Conversational Agent

```
[CACHED]
System prompt with personality, capabilities, constraints
Tool definitions
Common knowledge base

[NOT CACHED]
Conversation history (changes each turn)
Current user message
```

### Pattern 2: Document Q&A

```
[CACHED]
System instructions
Full document content
Example Q&A pairs

[NOT CACHED]
User's current question
```

### Pattern 3: Code Assistant

```
[CACHED]
System prompt
Codebase overview
Coding standards document
Test patterns

[NOT CACHED]
Specific file being discussed
User's current request
```

---

## Monitoring Cache Performance

Track these metrics:
- **Cache hit rate**: % of requests using cache
- **Token savings**: Tokens not reprocessed due to cache
- **Latency reduction**: Time saved per request
- **Cost savings**: $ saved from cached tokens

---

## Optimization Checklist

- [ ] Stable content is at the beginning of prompts
- [ ] Cache breakpoints are set after stable sections
- [ ] Content blocks are consolidated if >20
- [ ] Tool definitions are stable between requests
- [ ] Examples are extensive (20+) and cached
- [ ] Variable content is at the end
- [ ] Cache metrics are being monitored
- [ ] First request completes before parallel requests

---

**Next**: [10-testing.md](10-testing.md) - Evaluation and iteration methods
