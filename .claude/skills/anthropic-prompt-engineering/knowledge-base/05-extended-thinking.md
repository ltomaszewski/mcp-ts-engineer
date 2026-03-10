# 05: Extended Thinking

**Source**: Anthropic Official Documentation (2025-2026)
**Principle**: Extended thinking enables Claude to reason through complex problems with allocated "thinking budget" tokens.

---

## What is Extended Thinking?

Extended thinking is a Claude feature that:
- Allocates dedicated tokens for internal reasoning before responding
- Improves performance on complex, multi-step problems
- Separates "thinking" from the final output
- Enables deeper analysis than standard prompting

---

## Adaptive Thinking (Claude 4.6 Default)

Starting with Claude 4.6, **adaptive thinking** replaces manual `budget_tokens` as the recommended approach. Claude dynamically decides when and how much to think.

### Configuration

```python
# Adaptive thinking (recommended for Claude 4.6)
client.messages.create(
    model="claude-opus-4-6",
    max_tokens=64000,
    thinking={"type": "adaptive"},
    output_config={"effort": "high"},  # low, medium, high, max
    messages=[{"role": "user", "content": "..."}],
)
```

### Effort Parameter

| Level | Best For | Notes |
|-------|----------|-------|
| `low` | High-volume, latency-sensitive workloads | Similar to no-thinking performance |
| `medium` | Most standard applications | Recommended starting point for Sonnet 4.6 |
| `high` | Complex reasoning, agentic coding | Default for Sonnet 4.6 |
| `max` | Hardest problems, deep research | Maximum reasoning depth |

### When to Use Adaptive vs Manual

| Pattern | Recommended |
|---------|-------------|
| Claude Opus 4.6 | Always use adaptive thinking |
| Claude Sonnet 4.6 agentic workflows | Try adaptive first; fall back to manual if needed |
| Claude Sonnet 4.6 predictable token usage | Manual with `budget_tokens` cap (e.g., 16384) |
| Older models (Sonnet 4.5, etc.) | Manual with `budget_tokens` |

### Steering Adaptive Thinking

Control how often Claude thinks:

**Encourage more thinking:**
```
After receiving tool results, carefully reflect on their quality and determine optimal next steps before proceeding.
```

**Reduce unnecessary thinking:**
```
Extended thinking adds latency and should only be used when it will meaningfully improve answer quality — typically for problems that require multi-step reasoning. When in doubt, respond directly.
```

### Migration from Manual Extended Thinking

```python
# Before (manual, older models)
client.messages.create(
    model="claude-sonnet-4-5-20250929",
    max_tokens=64000,
    thinking={"type": "enabled", "budget_tokens": 32000},
    messages=[{"role": "user", "content": "..."}],
)

# After (adaptive, Claude 4.6)
client.messages.create(
    model="claude-opus-4-6",
    max_tokens=64000,
    thinking={"type": "adaptive"},
    output_config={"effort": "high"},
    messages=[{"role": "user", "content": "..."}],
)
```

### Sonnet 4.6 Specific Guidance

- Default effort level is `high` — consider explicitly setting `medium` for most apps
- For coding use cases: start with `medium` effort + `budget_tokens: 16384`
- For chat/non-coding: start with `low` effort
- Set large max output token budget (64k recommended) at medium/high effort

---

## When to Use Extended Thinking

### Ideal Use Cases
- Complex STEM problems (math, physics, engineering)
- Multi-constraint optimization
- Strategic analysis with multiple frameworks
- Code generation requiring careful planning
- Decision-making with many variables

### When to Skip Extended Thinking
- Simple queries or lookups
- Speed-critical applications
- Tasks where latency matters more than depth
- Standard formatting or transformation tasks

---

## Technical Configuration

### Minimum Budget
- **Minimum**: 1024 tokens
- **Recommendation**: Start at minimum, increase based on need

> **Note**: With adaptive thinking, you no longer need to manually set `budget_tokens`. The `effort` parameter controls thinking depth automatically.

### For High-Budget Workloads (>32K tokens)
Use batch processing to avoid:
- Network timeouts
- Connection limits
- System timeouts

### Language Considerations
- Extended thinking performs best in **English**
- Final outputs can be in any language Claude supports

---

## Prompting Techniques for Extended Thinking

### Technique 1: General Instructions First

Claude often performs better with high-level guidance than prescriptive step-by-step instructions.

**Less Effective**:
```
Think through this math problem step by step:
1. First, identify the variables
2. Then, set up the equation
3. Next, solve for x
...
```

**More Effective**:
```
Please think about this math problem thoroughly and in great detail.
Consider multiple approaches and show your complete reasoning.
Try different methods if your first approach doesn't work.
```

**Why**: Claude's creativity in approaching problems may exceed human-prescribed processes.

### Technique 2: Multishot with Thinking Tags

Provide examples that demonstrate reasoning patterns:

```
I'm going to show you how to solve a problem, then I want you to solve a similar one.

Problem 1: What is 15% of 80?

<thinking>
To find 15% of 80:
1. Convert 15% to a decimal: 15% = 0.15
2. Multiply: 0.15 × 80 = 12
</thinking>

The answer is 12.

Now solve this one:
Problem 2: What is 35% of 240?
```

Claude will generalize this pattern to its formal extended thinking.

### Technique 3: Reflection and Verification

Ask Claude to verify its own work:

```
Write a function to calculate the factorial of a number.

Before you finish, please verify your solution with test cases for:
- n=0
- n=1
- n=5
- n=10

And fix any issues you find.
```

---

## Complex Task Patterns

### Pattern 1: STEM Problems

Standard prompt (short thinking):
```
Write a python script for a bouncing ball in a square.
```

Enhanced prompt (extended thinking):
```
Write a Python script for a bouncing ball within a tesseract (4D hypercube).
Make sure to handle collision detection properly.
Make the tesseract slowly rotate.
Make sure the ball stays within the tesseract.
```

**Why it works**: 4D visualization requires mathematical planning that benefits from extended reasoning time.

### Pattern 2: Constraint Optimization

Standard prompt (short thinking):
```
Plan a week-long vacation to Japan.
```

Enhanced prompt (extended thinking):
```
Plan a 7-day trip to Japan with the following constraints:
- Budget of $2,500
- Must include Tokyo and Kyoto
- Need to accommodate a vegetarian diet
- Preference for cultural experiences over shopping
- Must include one day of hiking
- No more than 2 hours of travel between locations per day
- Need free time each afternoon for calls back home
- Must avoid crowds where possible
```

**Why it works**: Multiple constraints require systematic consideration.

### Pattern 3: Strategic Analysis with Frameworks

Standard prompt (short thinking):
```
Develop a strategy for entering the personalized medicine market.
```

Enhanced prompt (extended thinking):
```
Develop a comprehensive strategy for Microsoft entering the personalized medicine market by 2027.

Begin with:
1. A Blue Ocean Strategy canvas
2. Apply Porter's Five Forces to identify competitive pressures

Next, conduct a scenario planning exercise with four distinct futures based on regulatory and technological variables.

For each scenario:
- Develop strategic responses using the Ansoff Matrix

Finally, apply the Three Horizons framework to:
- Map the transition pathway
- Identify potential disruptive innovations at each stage
```

**Why it works**: Multiple analytical frameworks require sequential, structured reasoning.

---

## Extended Thinking + Tool Use

When using extended thinking with tool use:

### The Think Tool Pattern

For complex agentic tasks, provide a dedicated "think" tool:

```json
{
  "name": "think",
  "description": "Use this tool to think through complex problems. The contents are not visible to the user.",
  "input_schema": {
    "type": "object",
    "properties": {
      "thought": {
        "type": "string",
        "description": "Your thinking and reasoning process"
      }
    },
    "required": ["thought"]
  }
}
```

**When to use**:
- Multi-step tool sequences
- Evaluating information from previous tool calls
- Complex decisions about next steps
- Reasoning about errors or unexpected results

### Interleaved Thinking

Claude Sonnet 4.6 supports **interleaved thinking** — Claude can think between tool calls, not just at the start. This enables:
- Reflection on tool results before next action
- Mid-workflow course corrections
- Better multi-step reasoning in agentic loops

Guide interleaved thinking with prompts like:
```
After receiving tool results, carefully reflect on their quality and determine optimal next steps before proceeding. Use your thinking to plan and iterate based on this new information.
```

### Tool Use Constraints with Extended Thinking

- `tool_choice: {"type": "any"}` is **NOT supported** with extended thinking
- `tool_choice: {"type": "tool", "name": "..."}` is **NOT supported**
- Only `tool_choice: {"type": "auto"}` (default) and `tool_choice: {"type": "none"}` are compatible

---

## Output Management

### Preventing Repetition

Sometimes Claude repeats its thinking in the output. Add this instruction:

```
Do not repeat your extended thinking in your response.
Only output the final answer.
```

### Long-Form Output

For detailed content generation:

```
Please create an extremely detailed table of [SUBJECT].

For very long outputs, first create a detailed outline with word counts.
Then index your paragraphs to the outline and maintain specified word counts.
```

---

## Budget Optimization

### Start Small, Scale Up

1. Begin with minimum budget (1024 tokens)
2. Test on representative samples
3. Increase budget only when outputs are truncated or shallow
4. Monitor for diminishing returns

### Cost-Quality Trade-offs

| Budget | Best For |
|--------|----------|
| 1024-4096 | Standard complex tasks |
| 4096-16K | Multi-step analysis |
| 16K-32K | Very complex STEM/strategy |
| >32K | Specialized research (use batch) |

---

## Debugging Extended Thinking

### Common Issues

| Issue | Solution |
|-------|----------|
| Thinking is shallow | Increase budget |
| Output repeats thinking | Add "don't repeat thinking" instruction |
| Goes in circles | Simplify task or break into subtasks |
| Timeouts | Use batch processing for large budgets |

### Reading Thinking Output

Extended thinking is returned in the API response. Use it to:
1. Debug unexpected outputs
2. Understand Claude's reasoning
3. Identify where prompts need clarification
4. Improve instructions based on actual reasoning patterns

---

## Anti-Patterns

### 1. Pushing for Tokens' Sake
```
# BAD
Think for as long as possible about this simple question.

# GOOD
Think through this problem thoroughly. If you arrive at a confident answer quickly, that's fine.
```

### 2. Over-Prescribing Steps
```
# BAD
Follow these exact 15 steps to solve...

# GOOD
Think about this problem thoroughly. Consider multiple approaches.
```

### 3. Ignoring Budget Limits
```
# BAD
(Using 100K thinking budget for a simple query)

# GOOD
(Start at 1024, increase only when needed)
```

### 4. Using Manual Budget When Adaptive Is Better
```
# BAD (for Claude 4.6)
thinking={"type": "enabled", "budget_tokens": 32000}

# GOOD (for Claude 4.6)
thinking={"type": "adaptive"}
output_config={"effort": "high"}
```
**Exception**: Use manual `budget_tokens` on Sonnet 4.6 when you need predictable token costs.

---

## Validation Checklist

- [ ] Task actually benefits from extended reasoning
- [ ] Started with minimum budget
- [ ] Instructions are high-level, not prescriptive
- [ ] Verification step is included for critical outputs
- [ ] Using batch processing if budget > 32K
- [ ] Prompt is in English for best thinking performance
- [ ] Output format prevents thinking repetition
- [ ] Using adaptive thinking for Claude 4.6 (not manual budget)
- [ ] Effort parameter set appropriately (medium for most, high for complex)
- [ ] Interleaved thinking enabled for agentic workflows

---

**Next**: [06-tool-use.md](06-tool-use.md) - Function calling and tool integration
