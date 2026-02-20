# 01: Core Principles of Prompt Engineering

**Source**: Anthropic Official Documentation
**Principle**: Explicit, context-rich prompts produce consistent, reliable outputs.

---

## The Golden Rule

> "Show your prompt to a colleague, ideally someone who has minimal context on the task, and ask them to follow the instructions. If they're confused, Claude will likely be too."
> — Anthropic Prompt Engineering Guide

---

## Principle 1: Be Explicit and Direct

Claude interprets instructions literally. Ambiguity leads to inconsistent outputs.

### Bad Practice
```
Please remove all personally identifiable information from these customer feedback messages.
```

### Good Practice
```
Your task is to anonymize customer feedback for our quarterly review.

Instructions:
1. Replace all customer names with "CUSTOMER_[ID]" (e.g., "Jane Doe" → "CUSTOMER_001")
2. Replace email addresses with "EMAIL_[ID]@example.com"
3. Redact phone numbers as "PHONE_[ID]"
4. If a message mentions a specific product (e.g., "AcmeCloud"), leave it intact
5. If no PII is found, copy the message verbatim
6. Output only the processed messages, separated by "---"
```

### Key Techniques
- Use numbered lists for sequential steps
- Define exact output formats (not "summarize" but "output 3-5 bullet points")
- Specify what NOT to do when boundaries matter
- Include examples of edge cases

---

## Principle 2: Provide Rich Context

Claude performs better when it understands the purpose, audience, and workflow.

### Context Dimensions

| Type | Question to Answer | Example |
|------|-------------------|---------|
| **Purpose** | What will results be used for? | "This summary will be shared with the executive team" |
| **Audience** | Who is the output for? | "Write for developers with 5+ years experience" |
| **Workflow** | Where does this fit in? | "This is step 2 of a 4-step review process" |
| **Success Criteria** | What does good look like? | "A successful response includes specific code examples" |

### Template: Contextual Introduction
```
You are [ROLE] working on [TASK].

Context:
- This is for [AUDIENCE]
- The output will be used to [PURPOSE]
- Success means [CRITERIA]

Here is the task:
[TASK DESCRIPTION]
```

---

## Principle 3: Use Structured Formatting

XML tags create clear boundaries that Claude respects consistently.

### Why XML Tags?
1. **Clarity** - Clearly separate different parts of your prompt
2. **Accuracy** - Reduce errors from Claude misinterpreting sections
3. **Flexibility** - Easily modify sections without rewriting everything
4. **Parseability** - Extract specific parts of Claude's response programmatically

### Tag Naming Guidelines
- Use descriptive, lowercase names: `<document>`, `<instructions>`, `<examples>`
- Be consistent within a prompt: don't mix `<example>` and `<sample>`
- Reference tags by name: "Using the contract in `<contract>` tags..."
- Nest tags for hierarchy: `<document><content></content><metadata></metadata></document>`

### Standard Tag Library

| Tag | Purpose | Example Use |
|-----|---------|-------------|
| `<instructions>` | Task directives | Steps Claude should follow |
| `<context>` | Background information | Domain knowledge, history |
| `<document>` | Input content | Files, data to process |
| `<examples>` | Reference cases | Input/output pairs |
| `<formatting>` | Output requirements | Style, structure rules |
| `<thinking>` | Reasoning output | Chain of thought space |
| `<answer>` | Final response | Separated from thinking |
| `<constraints>` | Limitations | What NOT to do |

---

## Principle 4: Provide Diverse Examples

Examples (multishot prompting) dramatically improve consistency and accuracy.

### Example Guidelines

1. **Quantity**: 3-5 examples is optimal; 20+ for complex tasks with caching
2. **Diversity**: Cover edge cases, not just happy paths
3. **Format**: Match the exact format you want in outputs
4. **Quality**: Examples set the quality bar - use your best work

### Template: Multishot Prompt
```xml
<examples>
  <example>
    <input>
      [First input case]
    </input>
    <output>
      [Expected output - matches desired format exactly]
    </output>
  </example>
  <example>
    <input>
      [Edge case input]
    </input>
    <output>
      [How to handle edge case]
    </output>
  </example>
  <example>
    <input>
      [Error case input]
    </input>
    <output>
      [How to handle errors]
    </output>
  </example>
</examples>

Now process this input:
<input>
  [Actual input]
</input>
```

---

## Principle 5: Match Output Format

Claude's response style mirrors the prompt style. Use this to your advantage.

### Format Matching Techniques

| If You Want... | Then Your Prompt Should... |
|----------------|---------------------------|
| Bullet points | Use bullet points in examples |
| JSON output | Show JSON in examples |
| Concise responses | Use terse language |
| Technical depth | Include technical vocabulary |
| Specific length | Provide examples at that length |

### Anti-Pattern: Format Mismatch
```
# BAD: Prose prompt asking for structured output
Write a detailed analysis of this code and identify any bugs. Make sure to output your findings in a JSON format.

# GOOD: Structured prompt for structured output
Analyze this code for bugs. Output your findings as JSON:

<format>
{
  "bugs": [
    {"line": <number>, "issue": "<description>", "severity": "high|medium|low"}
  ],
  "summary": "<one-line summary>"
}
</format>
```

---

## Principle 6: Start Minimal, Add Complexity

Begin with the simplest prompt that might work. Add constraints only when needed.

### Iteration Workflow

1. **Start simple**: Write minimum viable prompt
2. **Test**: Run 10+ examples
3. **Identify failures**: Note which cases fail and why
4. **Add specificity**: Address failure modes with explicit rules
5. **Repeat**: Until acceptable success rate

### What to Add When Failing

| Failure Mode | Add This |
|--------------|----------|
| Wrong format | Explicit format instructions + examples |
| Missing content | Numbered checklist of required elements |
| Too verbose | Word/sentence limits + "be concise" |
| Wrong tone | Tone keywords + example in desired tone |
| Hallucinations | "Only use information from the provided context" |
| Skipping steps | Step-by-step numbered instructions |

---

## Principle 7: Explicit > Implicit

Never assume Claude knows what you mean. Make everything explicit.

### Implicit vs Explicit

| Implicit (Bad) | Explicit (Good) |
|----------------|-----------------|
| "Summarize this" | "Summarize this in 3-5 bullet points, max 20 words each" |
| "Clean this data" | "Remove rows where 'status' is null or 'date' is before 2020-01-01" |
| "Make it better" | "Improve clarity by: splitting long sentences, replacing jargon with plain language" |
| "Handle errors" | "If input is invalid, return `{error: 'validation_failed', details: '...'}`" |

---

## Quick Checklist: Before Submitting a Prompt

- [ ] Would a new team member understand exactly what to do?
- [ ] Is the output format explicitly defined?
- [ ] Are edge cases and error handling specified?
- [ ] Is context (purpose, audience, workflow) included?
- [ ] Are examples provided for complex tasks?
- [ ] Are XML tags used for multi-section prompts?
- [ ] Is the prompt as simple as possible while still complete?

---

## Anti-Patterns to Avoid

### 1. The Vague Request
```
# BAD
Analyze this.

# GOOD
Analyze this sales report for Q3 trends. Identify the top 3 growth areas and 2 concerns. Format as a bullet list.
```

### 2. The Missing Context
```
# BAD
Write a response to this email.

# GOOD
You are a customer support agent for AcmeCorp. Write a professional response to this customer complaint about shipping delays. Acknowledge the issue, apologize, and offer a 15% discount on next order.
```

### 3. The Conflicting Instructions
```
# BAD
Be concise but also be thorough and detailed.

# GOOD
Provide a comprehensive analysis (500-700 words) organized into 3 clear sections.
```

### 4. The Assumed Format
```
# BAD
Give me the data in a table.

# GOOD
Output as a markdown table with columns: Name | Date | Amount | Status
```

---

**Next**: [02-prompt-structure.md](02-prompt-structure.md) - XML tags and structural organization
