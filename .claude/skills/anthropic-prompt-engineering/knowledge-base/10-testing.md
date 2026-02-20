# 10: Testing and Evaluation

**Source**: Anthropic Official Documentation
**Principle**: Empirical testing with diverse examples is the only reliable way to validate prompts.

---

## The Testing Imperative

> "Test empirically—iterate based on actual outputs, not assumptions."
> — Anthropic Prompt Engineering Guide

Prompts that work in one scenario often fail in edge cases. Systematic testing prevents production failures.

---

## Testing Workflow

### The Iteration Cycle

```
1. Write Initial Prompt
       ↓
2. Test with 10+ Examples
       ↓
3. Identify Failure Modes
       ↓
4. Refine Prompt
       ↓
5. Retest (Including Passing Cases)
       ↓
6. Repeat Until Acceptable
```

### Never Skip Regression Testing

When fixing failures, always retest cases that previously passed. Fixes often break working scenarios.

---

## Test Case Design

### Minimum Test Set

For any prompt, test at minimum:
- **3-5 Happy path cases**: Normal, expected inputs
- **3-5 Edge cases**: Unusual but valid inputs
- **2-3 Error cases**: Invalid inputs that should be handled gracefully
- **1-2 Adversarial cases**: Inputs that might bypass instructions

### Test Case Categories

| Category | Purpose | Examples |
|----------|---------|----------|
| **Baseline** | Verify core functionality | Typical use cases |
| **Boundary** | Test limits | Max/min lengths, extreme values |
| **Edge** | Test unusual valid inputs | Empty strings, special characters |
| **Error** | Verify error handling | Invalid formats, missing data |
| **Adversarial** | Test robustness | Prompt injection attempts, conflicting instructions |

---

## Evaluation Methods

### 1. Human Evaluation

Best for: Quality, nuance, subjective criteria

```
For each output, rate 1-5 on:
- Correctness: Is the information accurate?
- Completeness: Is anything missing?
- Format: Does it match requirements?
- Tone: Is it appropriate?
- Usefulness: Would this solve the user's problem?
```

### 2. Model-Graded Evaluation

Best for: Scaling evaluation, consistency

Use Claude to evaluate outputs:

```xml
<instructions>
You are an evaluation assistant. Grade this output against the criteria.

<criteria>
1. Accuracy: Facts must be correct
2. Format: Must use bullet points
3. Length: Must be under 200 words
</criteria>

<output_to_evaluate>
{{OUTPUT}}
</output_to_evaluate>

Provide:
- Score (0-100)
- Pass/Fail for each criterion
- Specific issues found
</instructions>
```

### 3. Automated Checks

Best for: Format, structure, deterministic criteria

```python
def evaluate_output(output):
    checks = {
        "has_json": is_valid_json(output),
        "under_word_limit": word_count(output) <= 200,
        "has_required_sections": all_sections_present(output),
        "no_pii": not contains_pii(output),
    }
    return all(checks.values()), checks
```

### 4. A/B Testing

Best for: Comparing prompt variations

```
Prompt A: [Version 1]
Prompt B: [Version 2]

For each test input:
1. Run both prompts
2. Evaluate both outputs
3. Record which is better and why
4. Calculate win rate for each
```

---

## Debugging Failed Cases

### Step 1: Categorize the Failure

| Failure Type | Symptoms | Likely Cause |
|--------------|----------|--------------|
| Wrong format | Output structure doesn't match | Format instructions unclear |
| Missing content | Key information absent | Requirements not explicit |
| Hallucination | Invented information | No grounding instruction |
| Wrong scope | Too broad or narrow | Task boundaries unclear |
| Instruction ignored | Specific rule violated | Rule buried or contradictory |

### Step 2: Analyze the Failure

Ask:
1. What did the prompt say to do?
2. What did Claude actually do?
3. Why might Claude have interpreted it this way?
4. What would make the intent unambiguous?

### Step 3: Apply Targeted Fixes

| Failure Type | Fix Strategy |
|--------------|--------------|
| Wrong format | Add explicit format example |
| Missing content | Add checklist of required elements |
| Hallucination | Add "only use provided information" |
| Wrong scope | Define boundaries explicitly |
| Instruction ignored | Move rule to top, add emphasis |

---

## Test Documentation Template

```markdown
# Prompt: [Name]

## Test Case 1: [Description]
**Input**: [Test input]
**Expected**: [Expected output or criteria]
**Actual**: [What was produced]
**Result**: PASS / FAIL
**Notes**: [Any observations]

## Test Case 2: [Description]
...

## Summary
- Pass Rate: X/Y (Z%)
- Common Failures: [Pattern]
- Recommended Fixes: [Changes]
```

---

## Prompt Versioning

### Track Prompt Iterations

```
prompts/
├── customer_support_v1.md    # Initial version
├── customer_support_v2.md    # Fixed format issues
├── customer_support_v3.md    # Added edge case handling
└── customer_support_v3_test_results.md  # Test documentation
```

### Version Metadata

```markdown
# Prompt: Customer Support Response
**Version**: 3.0
**Date**: 2024-01-15
**Changes from v2**:
- Added explicit instruction for refund requests
- Fixed tone for angry customers
- Added example for partial refunds

**Test Results**:
- v2: 78% pass rate
- v3: 94% pass rate
```

---

## Continuous Monitoring

### Production Metrics

Track in production:
- **Success rate**: % of outputs meeting criteria
- **Failure patterns**: Common failure modes
- **Edge cases**: New scenarios not in test set
- **User feedback**: Explicit ratings or complaints

### Alerting Thresholds

```
If success_rate < 90%: Review recent changes
If same_error_count > 5: Investigate pattern
If new_edge_case: Add to test suite
```

---

## Testing Checklist

### Before Deployment
- [ ] 10+ test cases covering happy path
- [ ] Edge cases identified and tested
- [ ] Error handling verified
- [ ] Adversarial inputs tested
- [ ] Regression tests pass
- [ ] Format validation automated
- [ ] Results documented

### After Deployment
- [ ] Monitoring in place
- [ ] Failure logging enabled
- [ ] Feedback loop established
- [ ] Test suite updated with production edge cases

---

## Evaluation Prompt Library

### Factual Accuracy Evaluator

```xml
<task>
Evaluate the factual accuracy of this response.
</task>

<response>
{{RESPONSE}}
</response>

<source>
{{SOURCE_MATERIAL}}
</source>

<criteria>
1. Every claim must be supported by the source
2. No information should be invented
3. Inferences must be clearly marked as such
</criteria>

Output:
- Accuracy Score (0-100)
- List of unsupported claims
- List of invented information
```

### Format Compliance Evaluator

```xml
<task>
Check if this output matches the required format.
</task>

<output>
{{OUTPUT}}
</output>

<required_format>
{{FORMAT_SPEC}}
</required_format>

Check:
1. Structure matches specification
2. All required fields present
3. No extra fields
4. Correct data types

Output: PASS or FAIL with specific violations.
```

### Quality Rubric Evaluator

```xml
<task>
Grade this output using the rubric.
</task>

<output>
{{OUTPUT}}
</output>

<rubric>
A: Excellent - exceeds all requirements
B: Good - meets all requirements
C: Adequate - meets most requirements
D: Poor - missing key requirements
F: Fail - does not address the task
</rubric>

Provide:
- Grade
- Justification
- Specific improvements needed
```

---

**Next**: [11-templates.md](11-templates.md) - Ready-to-use prompt templates for Claude Code
