# 02: Prompt Structure with XML Tags

**Source**: Anthropic Official Documentation
**Principle**: Structured prompts with XML tags produce consistent, parseable outputs.

---

## Why Structure Matters

Claude processes unstructured prompts but performs significantly better with clear structure:

| Metric | Unstructured | Structured (XML) |
|--------|--------------|------------------|
| Format consistency | ~70% | ~95% |
| Instruction following | Variable | High |
| Output parseability | Manual | Programmatic |
| Debugging ease | Difficult | Clear |

---

## XML Tag Fundamentals

### Basic Syntax

```xml
<tag_name>
  Content goes here
</tag_name>
```

### Nesting

```xml
<outer>
  <inner>
    Nested content
  </inner>
</outer>
```

### Self-Referencing

Always reference tags by name in your instructions:
```
Using the data in <sales_data> tags, generate a report following the format in <output_format>.
```

---

## Standard Prompt Architecture

### The Canonical Structure

```
[System Context / Role]

<context>
[Background information, domain knowledge]
</context>

<instructions>
[Step-by-step task directives]
</instructions>

<examples>
[Input/output pairs demonstrating expected behavior]
</examples>

<input>
[The actual data to process]
</input>

<output_format>
[Exact structure for the response]
</output_format>
```

### Example: Full Structured Prompt

```
You are a senior financial analyst at AcmeCorp.

<context>
AcmeCorp is a B2B SaaS company. Investors value transparency and actionable insights.
This report will be presented at the Q2 board meeting.
</context>

<instructions>
1. Analyze the provided financial data
2. Include sections: Revenue Growth, Profit Margins, Cash Flow
3. Highlight both strengths and areas for improvement
4. Use the formatting from the example
</instructions>

<example>
<input>Q1 data: Revenue $10M, Growth 15%, Margin 68%</input>
<output>
Revenue Growth:
- Q1 revenue: $10M (15% YoY increase)
- Driven by: Enterprise client expansion

Profit Margins:
- Gross margin: 68%
- Trend: Stable
</output>
</example>

<financial_data>
{{SPREADSHEET_DATA}}
</financial_data>

<output_format>
Use bullet points. Each section should be 3-5 lines maximum.
Start with the most important insight for each section.
</output_format>
```

---

## Tag Reference Library

### Input Tags

| Tag | Purpose | When to Use |
|-----|---------|-------------|
| `<document>` | Primary content to process | Files, articles, reports |
| `<code>` | Source code | Code review, debugging |
| `<data>` | Structured data | JSON, CSV, tables |
| `<context>` | Background information | Domain knowledge, history |
| `<user_input>` | User-provided content | Distinguishes from system content |

### Instruction Tags

| Tag | Purpose | When to Use |
|-----|---------|-------------|
| `<instructions>` | Task directives | Main task steps |
| `<constraints>` | Limitations | What NOT to do |
| `<requirements>` | Must-have elements | Non-negotiables |
| `<guidelines>` | Soft preferences | Nice-to-haves |
| `<persona>` | Role definition | Complex character instructions |

### Output Tags

| Tag | Purpose | When to Use |
|-----|---------|-------------|
| `<output_format>` | Response structure | Format specifications |
| `<example_output>` | Sample response | Format demonstration |
| `<thinking>` | Reasoning space | Chain of thought |
| `<answer>` | Final response | Separated from thinking |
| `<result>` | Computed output | Calculations, analysis |

### Multi-Document Tags

```xml
<documents>
  <document index="1">
    <source>annual_report_2023.pdf</source>
    <document_content>
      {{ANNUAL_REPORT}}
    </document_content>
  </document>
  <document index="2">
    <source>competitor_analysis.xlsx</source>
    <document_content>
      {{COMPETITOR_ANALYSIS}}
    </document_content>
  </document>
</documents>
```

---

## Long Context Optimization

### Rule: Long Content at Top

For prompts with large documents (20K+ tokens):

```
[Long documents go HERE - at the top]

<documents>
  {{LARGE_DOCUMENT_CONTENT}}
</documents>

[Instructions and query go BELOW the documents]

<instructions>
Based on the documents above, analyze...
</instructions>
```

**Why**: Queries at the end can improve response quality by up to 30% for complex, multi-document inputs.

### Ground Responses in Quotes

For long document tasks, ask Claude to quote before answering:

```xml
<instructions>
1. First, find and quote relevant passages from the documents in <quotes> tags
2. Then, based on these quotes, provide your analysis in <analysis> tags
</instructions>
```

This technique cuts through "noise" in long documents and improves accuracy.

---

## Combining Tags with Other Techniques

### XML + Chain of Thought

```xml
<instructions>
Think through this problem step by step in <thinking> tags.
Then provide your final answer in <answer> tags.
</instructions>
```

### XML + Multishot Prompting

```xml
<examples>
  <example>
    <input>Customer: My order never arrived</input>
    <thinking>
      - Issue: Missing delivery
      - Tone: Frustrated but not angry
      - Action: Check status, apologize, offer resolution
    </thinking>
    <response>
      I sincerely apologize for this inconvenience. Let me check the status...
    </response>
  </example>
</examples>
```

### XML + Role Definition

```xml
<persona>
You are Dr. Sarah Chen, a senior data scientist with 15 years of experience.
- Communication style: Direct, technical, uses metaphors
- Background: PhD in Statistics from MIT
- Approach: Always validates assumptions before analysis
</persona>

<constraints>
- Never speculate without data
- Always mention confidence intervals
- Cite methodology used
</constraints>
```

---

## Output Parsing Patterns

### Reliable Extraction

When you need to programmatically extract Claude's output:

```xml
<instructions>
Provide your response in the following format:

<result>
<summary>[One-sentence summary]</summary>
<key_points>
- [Point 1]
- [Point 2]
- [Point 3]
</key_points>
<recommendation>[Your recommendation]</recommendation>
</result>
</instructions>
```

### JSON in XML

```xml
<output_format>
Return your analysis as JSON inside <result> tags:

<result>
{
  "score": <0-100>,
  "issues": ["<issue1>", "<issue2>"],
  "recommendation": "<string>"
}
</result>
</output_format>
```

---

## Common Patterns

### Pattern 1: Document Analysis

```xml
You are analyzing a legal contract.

<contract>
{{CONTRACT_TEXT}}
</contract>

<instructions>
1. Identify risks in <risks> tags
2. List unusual terms in <unusual_terms> tags
3. Provide recommendations in <recommendations> tags
</instructions>
```

### Pattern 2: Data Transformation

```xml
<input_data format="csv">
{{CSV_DATA}}
</input_data>

<instructions>
Transform the data according to:
1. Filter: Only rows where status = "active"
2. Transform: Convert dates to ISO format
3. Output: JSON array in <output> tags
</instructions>

<output_schema>
[{"name": string, "date": "YYYY-MM-DD", "value": number}]
</output_schema>
```

### Pattern 3: Multi-Step Workflow

```xml
<workflow>
Step 1: Read <requirements> and understand the goal
Step 2: Analyze <current_implementation>
Step 3: Identify gaps in <gaps> tags
Step 4: Propose solutions in <solutions> tags
Step 5: Provide implementation plan in <plan> tags
</workflow>

<requirements>
{{REQUIREMENTS}}
</requirements>

<current_implementation>
{{CODE}}
</current_implementation>
```

---

## Anti-Patterns

### 1. Inconsistent Tag Names
```xml
<!-- BAD -->
<example>...</example>
<sample>...</sample>  <!-- Different name for same concept -->

<!-- GOOD -->
<example>...</example>
<example>...</example>
```

### 2. Tags Without Reference
```xml
<!-- BAD -->
<data>{{DATA}}</data>
Analyze the above.

<!-- GOOD -->
<sales_data>{{DATA}}</sales_data>
Analyze the data in <sales_data> tags.
```

### 3. Overly Complex Nesting
```xml
<!-- BAD: Too many levels -->
<outer><middle><inner><deep>content</deep></inner></middle></outer>

<!-- GOOD: Flat when possible -->
<section_a>content</section_a>
<section_b>content</section_b>
```

---

## Validation Checklist

- [ ] All tags are closed properly
- [ ] Tag names are descriptive and consistent
- [ ] Tags are referenced by name in instructions
- [ ] Long content is placed at the top
- [ ] Output format is specified with tags
- [ ] Nesting is used sparingly (max 2-3 levels)

---

**Next**: [03-system-prompts.md](03-system-prompts.md) - Designing system instructions for agents and skills
