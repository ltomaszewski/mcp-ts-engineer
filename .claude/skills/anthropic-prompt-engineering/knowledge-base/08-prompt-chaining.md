# 08: Prompt Chaining

**Source**: Anthropic Official Documentation
**Principle**: Break complex tasks into discrete subtasks, each getting Claude's full attention.

---

## What is Prompt Chaining?

Prompt chaining connects multiple prompts in sequence, where each prompt:
- Handles one specific subtask
- Passes its output to the next prompt
- Receives full context allocation

---

## Why Chain Prompts?

| Benefit | Explanation |
|---------|-------------|
| **Accuracy** | Each subtask gets full attention, reducing errors |
| **Clarity** | Simpler subtasks = clearer instructions |
| **Traceability** | Easy to identify which step fails |
| **Flexibility** | Modify one step without affecting others |
| **Parallelization** | Independent steps can run concurrently |

---

## When to Chain

### Use Prompt Chaining For:
- Research synthesis (gather → analyze → synthesize)
- Document analysis (extract → transform → summarize)
- Content creation (research → outline → draft → edit)
- Multi-step code workflows (analyze → implement → test)
- Complex decisions (gather info → evaluate → recommend)

### Don't Chain When:
- Task is simple and self-contained
- Latency is critical
- Steps are too interdependent to separate

---

## Chaining Patterns

### Pattern 1: Linear Pipeline

```
Step 1 → Step 2 → Step 3 → Final Output
```

**Example: Content Creation Pipeline**
1. **Research**: Gather information on topic
2. **Outline**: Create structured outline
3. **Draft**: Write content following outline
4. **Edit**: Refine for quality and clarity

### Pattern 2: Fan-Out/Fan-In

```
        ┌─→ Analysis A ─┐
Input ──┼─→ Analysis B ──┼─→ Synthesis
        └─→ Analysis C ─┘
```

**Example: Multi-Document Analysis**
1. **Fan-Out**: Analyze each document in parallel
2. **Fan-In**: Synthesize findings into unified report

### Pattern 3: Self-Correction Loop

```
Generate → Verify → (Fix if needed) → Output
```

**Example: Research Summary**
1. **Generate**: Create initial summary
2. **Verify**: Grade for accuracy and completeness
3. **Fix**: Address identified issues
4. **Output**: Final verified summary

---

## Chain Implementation

### Step 1: Identify Subtasks

Break task into:
- **Distinct** operations (each does one thing)
- **Sequential** dependencies (what needs what)
- **Single-goal** objectives (one clear outcome per step)

### Step 2: Design Handoffs

Use XML tags for clean handoffs:

**Prompt 1: Extract**
```xml
<instructions>
Extract key information from this document.
Output findings in <findings> tags.
</instructions>

<document>
{{DOCUMENT}}
</document>
```

**Prompt 2: Analyze (receives findings)**
```xml
<instructions>
Analyze these findings for risks.
Output analysis in <analysis> tags.
</instructions>

<findings>
{{FINDINGS_FROM_STEP_1}}
</findings>
```

**Prompt 3: Recommend (receives analysis)**
```xml
<instructions>
Based on this analysis, provide recommendations.
Output in <recommendations> tags.
</instructions>

<analysis>
{{ANALYSIS_FROM_STEP_2}}
</analysis>
```

### Step 3: Handle Failures

Each step should produce parseable output:
- Use consistent XML tags
- Include success/failure indicators
- Provide enough context for retry

---

## Self-Correction Chains

### The Verify-and-Fix Pattern

**Prompt 1: Generate**
```xml
Summarize this research paper.
Focus on methodology, findings, and implications.

<paper>
{{PAPER}}
</paper>
```

**Prompt 2: Verify**
```xml
Your task is to verify this summary against the original paper.

<summary>
{{SUMMARY_FROM_STEP_1}}
</summary>

<paper>
{{PAPER}}
</paper>

Grade the summary on:
1. Accuracy (A-F): Are facts correct?
2. Completeness (A-F): Is anything important missing?
3. Clarity (A-F): Is it well-written?

Output your grades and specific issues in <feedback> tags.
```

**Prompt 3: Fix (if needed)**
```xml
Improve this summary based on the feedback.

<summary>
{{SUMMARY_FROM_STEP_1}}
</summary>

<feedback>
{{FEEDBACK_FROM_STEP_2}}
</feedback>

<paper>
{{PAPER}}
</paper>

Output the improved summary only.
```

---

## Worked Examples

### Example 1: Legal Contract Analysis

**Chain Structure**:
1. Risk Identification
2. Email Drafting
3. Tone Review

**Prompt 1: Identify Risks**
```xml
You're the Chief Legal Officer. Review this SaaS contract for risks.

<contract>
{{CONTRACT}}
</contract>

Focus on: data privacy, SLAs, liability caps.
Output findings in <risks> tags.
```

**Prompt 2: Draft Email**
```xml
Draft an email to the vendor outlining concerns and proposing changes.

<risks>
{{RISKS_FROM_STEP_1}}
</risks>

Output the email in <email> tags.
```

**Prompt 3: Review Tone**
```xml
Review this email for tone, clarity, and professionalism.

<email>
{{EMAIL_FROM_STEP_2}}
</email>

Provide feedback and, if needed, a revised version.
```

### Example 2: Architecture Review

**Chain Structure**:
1. Technical Analysis
2. Document Drafting
3. Quality Grading

**Prompt 1: Analyze**
```xml
As a senior solutions architect, analyze this multitenancy strategy.

<strategy>
{{STRATEGY}}
</strategy>

Focus on: scalability, security, cost-effectiveness.
Use grades (A-F) for each dimension.
Output in <analysis> tags.
```

**Prompt 2: Draft Document**
```xml
Create a strategy review document for engineering leadership.

<strategy>
{{STRATEGY}}
</strategy>

<analysis>
{{ANALYSIS_FROM_STEP_1}}
</analysis>

Include: executive summary, detailed analysis, recommendations.
Output in <document> tags.
```

**Prompt 3: Grade Document**
```xml
Grade this strategy document.

<document>
{{DOCUMENT_FROM_STEP_2}}
</document>

<priorities>
{{COMPANY_PRIORITIES}}
</priorities>

Evaluate: clarity, actionability, alignment with priorities.
Provide grades (A-F) and improvement suggestions.
```

---

## Optimization Tips

### Parallel Execution

For independent subtasks, run in parallel:

```python
# Independent analyses can run concurrently
results = await asyncio.gather(
    analyze_document_a(doc_a),
    analyze_document_b(doc_b),
    analyze_document_c(doc_c),
)
# Then synthesize
synthesis = await synthesize(results)
```

### Debug by Isolation

If a chain fails:
1. Run each step independently
2. Identify which step produces poor output
3. Refine that step's prompt
4. Rejoin the chain

### Context Preservation

Pass only what the next step needs:
```xml
<!-- DON'T: Pass entire original document through every step -->

<!-- DO: Extract and pass only relevant findings -->
<relevant_findings>
{{EXTRACTED_FINDINGS}}
</relevant_findings>
```

---

## Chain Design Checklist

- [ ] Each step has a single, clear objective
- [ ] Handoffs use consistent XML tags
- [ ] Dependencies are properly ordered
- [ ] Independent steps can be parallelized
- [ ] Failure at any step is detectable
- [ ] Each step's output is parseable
- [ ] Context passed is minimal but sufficient

---

## Common Workflows

| Workflow | Steps |
|----------|-------|
| **Research** | Search → Read → Synthesize → Format |
| **Code Review** | Read → Analyze → Suggest → Verify |
| **Content** | Research → Outline → Draft → Edit → Polish |
| **Debugging** | Reproduce → Diagnose → Fix → Test |
| **Refactoring** | Analyze → Plan → Implement → Verify |

---

**Next**: [09-optimization.md](09-optimization.md) - Caching and token efficiency
