# 04: Chain of Thought Prompting

**Source**: Anthropic Official Documentation
**Principle**: Giving Claude space to reason step-by-step dramatically improves accuracy on complex tasks.

---

## What is Chain of Thought (CoT)?

Chain of thought prompting encourages Claude to break down problems step-by-step before providing a final answer. This technique:

- **Improves accuracy** on math, logic, and analysis tasks
- **Increases coherence** through structured thinking
- **Enables debugging** by exposing Claude's reasoning
- **Reduces errors** by forcing systematic approaches

> "Always have Claude output its thinking. Without outputting its thought process, no thinking occurs!"
> — Anthropic Prompt Engineering Guide

---

## When to Use CoT

### Use Chain of Thought For:
- Complex math or logic problems
- Multi-step analysis
- Decisions with multiple factors
- Problem-solving requiring creativity
- Tasks where intermediate steps matter

### Skip Chain of Thought For:
- Simple factual questions
- Formatting or transformation tasks
- Speed-critical operations
- Tasks where latency > accuracy

---

## Three Levels of CoT Prompting

### Level 1: Basic CoT

Simply add "Think step-by-step" to your prompt.

```
What is 15% of 340, then add 25?

Think step-by-step.
```

**Output**:
```
Let me work through this step-by-step:
1. Calculate 15% of 340: 0.15 × 340 = 51
2. Add 25: 51 + 25 = 76

The answer is 76.
```

**Pros**: Simple, works for straightforward problems
**Cons**: No guidance on HOW to think

### Level 2: Guided CoT

Specify the reasoning steps Claude should follow.

```
Analyze this investment opportunity.

Think through:
1. First, identify the key risk factors
2. Then, evaluate the potential returns
3. Consider the time horizon
4. Finally, make a recommendation with confidence level
```

**Pros**: More consistent reasoning process
**Cons**: Mixing thinking with answer can be messy

### Level 3: Structured CoT with XML

Separate reasoning from the final answer using tags.

```
Analyze this investment opportunity.

Think through the problem in <thinking> tags:
1. Key risk factors
2. Potential returns
3. Time horizon considerations

Then provide your recommendation in <answer> tags.
```

**Output**:
```
<thinking>
1. Risk factors:
   - Market volatility is high
   - Company is pre-revenue
   - Competition is increasing

2. Potential returns:
   - 5x upside if successful
   - Total loss if fails

3. Time horizon:
   - 5-7 years to potential exit
   - High opportunity cost
</thinking>

<answer>
I recommend against this investment. While the potential 5x return is attractive, the pre-revenue status and high competition create unacceptable risk for most portfolios. Confidence: 75%.
</answer>
```

**Pros**: Clean separation, easy parsing, consistent format
**Cons**: More tokens, slightly higher latency

---

## Structured CoT Templates

### Template: Analysis Task

```
<instructions>
Analyze [SUBJECT] using the following framework.

First, in <thinking> tags:
1. Identify the key elements
2. Evaluate each element against [CRITERIA]
3. Note any gaps or concerns
4. Weigh the trade-offs

Then, in <conclusion> tags:
- Provide your assessment
- List supporting evidence
- State your confidence level (low/medium/high)
</instructions>
```

### Template: Problem Solving

```
<instructions>
Solve this problem: [PROBLEM]

In <approach> tags:
1. Restate the problem in your own words
2. Identify what you know and what you need to find
3. List possible solution strategies

In <solution> tags:
1. Work through your chosen strategy step-by-step
2. Show all calculations
3. Check your answer

In <answer> tags:
- State the final answer
- Note any assumptions made
</instructions>
```

### Template: Decision Making

```
<instructions>
Help me decide: [DECISION]

In <analysis> tags, consider:
1. What are the options?
2. What are the pros and cons of each?
3. What criteria matter most?
4. What risks exist for each option?

In <recommendation> tags:
- State your recommended option
- Explain the key reasons
- List the conditions under which you'd change your recommendation
</instructions>
```

---

## Advanced CoT Techniques

### Self-Verification

Ask Claude to check its own work:

```
Solve this equation: 3x + 7 = 22

1. Solve step-by-step in <solution> tags
2. Verify your answer by substituting back in <verification> tags
3. If verification fails, redo the solution
4. Provide final answer in <answer> tags
```

### Multiple Approaches

Have Claude try different methods:

```
Solve this problem: [PROBLEM]

In <approach_1> tags, try a direct calculation approach.
In <approach_2> tags, try estimation or approximation.

In <comparison> tags, compare the results.
In <answer> tags, state your final answer with confidence.
```

### Metacognitive Prompting

Ask Claude to assess its own reasoning:

```
After solving, reflect in <reflection> tags:
- What assumptions did I make?
- Where might I be wrong?
- How confident am I in each step?
- What would change my answer?
```

---

## Examples

### Example 1: Financial Analysis (Without CoT)

```
User: Should I invest $10,000 in stocks or bonds if I need the money in 5 years?

Claude: Based on the information provided, I would recommend bonds. The
guaranteed 6% return provides certainty for your financial planning,
which is important when you have a specific timeline.
```

**Problem**: Lacks depth, doesn't quantify outcomes, misses nuance.

### Example 1: Financial Analysis (With Structured CoT)

```
User: Should I invest $10,000 in stocks or bonds if I need the money in 5 years?

Think step-by-step in <thinking> tags, then answer in <answer> tags.

Claude:
<thinking>
1. Understanding the goal:
   - Need $10,000+ in 5 years (fixed timeline)
   - Cannot afford significant risk (specific deadline)

2. Analyzing stocks (12% historical return):
   - Best case: $10,000 × (1.12)^5 = $17,623
   - Worst case: Could lose 50% in a crash = $5,000
   - 5 years is short for market recovery

3. Analyzing bonds (6% guaranteed):
   - Guaranteed: $10,000 × (1.06)^5 = $13,382
   - No downside risk
   - Certainty for planning

4. Key factors:
   - Short timeline limits recovery from downturns
   - Fixed deadline means certainty has high value
   - The gap ($4,241) isn't worth the risk of loss
</thinking>

<answer>
I recommend bonds. You'll have $13,382 guaranteed in 5 years. While
stocks could yield $17,623, they could also drop to $5,000 in a
downturn with no time to recover. For a fixed-timeline goal, the
certainty of bonds outweighs the potential stock upside.
</answer>
```

---

### Example 2: Code Debugging (Structured CoT)

```
Debug this code:

function fibonacci(n) {
  if (n <= 1) return n;
  return fibonacci(n - 1) + fibonacci(n - 2);
}
console.log(fibonacci(50));

In <analysis> tags, identify the problem.
In <solution> tags, provide the fix.
In <explanation> tags, explain why.
```

**Claude's Response**:
```
<analysis>
The code is functionally correct but has a severe performance issue:
- Fibonacci(50) makes ~2^50 recursive calls
- Same values are recalculated repeatedly
- Time complexity: O(2^n) - exponential
- Will take hours/days to complete
</analysis>

<solution>
function fibonacci(n, memo = {}) {
  if (n <= 1) return n;
  if (memo[n]) return memo[n];
  memo[n] = fibonacci(n - 1, memo) + fibonacci(n - 2, memo);
  return memo[n];
}
console.log(fibonacci(50)); // Returns instantly
</solution>

<explanation>
Added memoization to cache previously computed values:
- Each unique n is calculated only once
- Subsequent calls return cached result
- Time complexity reduced from O(2^n) to O(n)
- fibonacci(50) now returns in milliseconds
</explanation>
```

---

## Integration with Extended Thinking

When using Claude's extended thinking feature (thinking budget > 0):

1. **Let Claude think freely first**: Extended thinking is internal, structured CoT is visible
2. **Use XML tags in output**: Separate the final structured response
3. **Don't duplicate**: If using extended thinking, simpler CoT prompts suffice

```
# With extended thinking enabled, you can simplify:

Analyze this complex data and provide recommendations.

Format your response:
<summary>[1-2 sentence summary]</summary>
<recommendations>[Numbered list]</recommendations>
<confidence>[High/Medium/Low with reasoning]</confidence>
```

---

## When CoT Fails

### Symptoms of CoT Problems
- Claude goes in circles
- Reasoning contradicts itself
- Final answer doesn't match reasoning
- Excessive verbosity

### Solutions
1. **Add structure**: Move from basic to guided to structured CoT
2. **Simplify the task**: Break into smaller subtasks
3. **Add examples**: Show good reasoning in examples
4. **Constrain output**: Limit steps or words
5. **Use extended thinking**: Offload complexity to internal reasoning

---

## CoT Best Practices Checklist

- [ ] Task requires multi-step reasoning (not simple lookup)
- [ ] Thinking is output (not just internal)
- [ ] XML tags separate thinking from answer
- [ ] Steps are specific and numbered
- [ ] Verification step included for critical tasks
- [ ] Output format is clearly specified
- [ ] Examples demonstrate good reasoning

---

**Next**: [05-extended-thinking.md](05-extended-thinking.md) - Advanced reasoning with thinking budget
