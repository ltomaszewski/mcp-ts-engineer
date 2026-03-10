---
name: review-plan
description: Review the improvement plan using 8 parallel agent teammates, each specializing
  in a different quality dimension (security, testing, architecture, workflow, success
  patterns, challenge coverage, maintainability, feasibility). Cross-references against
  battle-tested research documents. Use when the user says "review plan", "audit plan",
  "review improvement plan", or "/review-plan".
---

# /review-plan

Review the improvement plan using 8 parallel agent teammates. Each agent specializes in a different quality dimension, cross-referencing against battle-tested research.

## Constraints

### ALWAYS
- Launch ALL 8 agents in a SINGLE message (parallel execution)
- Wait for ALL agents to complete before starting synthesis
- Read every agent's FULL report during synthesis — never skim or skip
- Cite which agents agree when reporting consensus findings
- Save the final synthesis report to `docs/improvement-plan-review.md`

### NEVER
- Start synthesis before all 8 agents have returned
- Skip an agent because others already covered the topic — each has a unique lens
- Invent findings not present in agent reports
- Give a STRONG_PASS verdict if any agent returned MAJOR_GAPS
- Modify the improvement plan during review — this is read-only analysis

## Prerequisites

Verify these files exist before proceeding:
- `docs/improvement-plan.md`
- `docs/ai-sdlc-challenges-research.md`
- `docs/ai-sdlc-success-stories.md`

If any file is missing, STOP and inform the user.

## Workflow

### Step 0: Pre-Flight Validation

Read the first 10 lines of each document to confirm expected content. If validation fails, STOP.

### Step 1: Launch All 8 Review Agents in Parallel

Use the Agent tool to spawn ALL 8 agents in a SINGLE message. Each agent:
- Reads all specified files using the Read tool BEFORE analyzing
- References specific sections, quotes, or metrics from the documents
- Outputs structured findings in the EXACT format specified
- Ends with a verdict and one-sentence justification

---

#### Agent 1 — name: "security-auditor"

```
You are a Security & Supply Chain specialist auditing an AI-SDLC improvement plan against industry research. Quality-first review — cost and speed are not concerns.

STEP 1 — Read these files completely using the Read tool:
- docs/improvement-plan.md
- docs/ai-sdlc-challenges-research.md
- docs/ai-sdlc-success-stories.md

STEP 2 — Focus on sections 1.1 (Supply Chain Validator) and 1.2 (Security Scanner).

Cross-reference against these SPECIFIC research claims:
- "45% of AI-generated code contains security flaws" (Veracode, Challenge #2)
- "AI code is 2.74x more likely to introduce XSS, 1.91x insecure object refs, 1.88x password mishandling" (Challenge #2)
- "20% of AI code recommends non-existent packages, 58% repeatable" (Challenge #3)
- "GitHub MCP protocol exploited via malicious commands in public repo Issues" (Challenge #2)
- "69% discovered vulnerabilities, 1 in 5 material business impact" (Challenge #2)

STEP 3 — Evaluate each claim:
1. Which specific improvement addresses it?
2. Is coverage FULL or PARTIAL? For PARTIAL: what attack vector is uncovered?
3. Is the 6-layer security scanner architecture justified or over-engineered?
4. Does the supply chain validator catch "58% repeatable hallucinations"?
5. Is MCP protocol exploitation risk addressed anywhere?

STEP 4 — Output findings in this EXACT format:

## Security & Supply Chain Review

### Strengths
- [what's well-designed — reference specific plan sections]

### Research Claims Coverage
| Claim | Source | Plan Section | Coverage | Gap |
|-------|--------|-------------|----------|-----|
| 45% security flaws | Veracode | 1.2 | FULL/PARTIAL | [gap if any] |
| 2.74x XSS | Endor Labs | 1.2 | ... | ... |
| 20% hallucinated pkgs | FOSSA | 1.1 | ... | ... |
| MCP exploitation | Fortune | ??? | ... | ... |
| 69% discovered vulns | GroweXX | 1.2 | ... | ... |

### Gaps Found
- [what's missing — cite the research finding]

### Recommendations
- [specific, actionable improvements]

### Verdict: [PASS | NEEDS_WORK | MAJOR_GAPS]
[One sentence justification]
```

---

#### Agent 2 — name: "test-quality-auditor"

```
You are a Test Quality specialist auditing an AI-SDLC improvement plan. Quality-first review.

STEP 1 — Read these files completely using the Read tool:
- docs/improvement-plan.md
- docs/ai-sdlc-challenges-research.md
- docs/ai-sdlc-success-stories.md

STEP 2 — Focus on section 2.3 (Test Quality Assessment + Mutation Testing).

Cross-reference against:
- "AI produces tests that hit coverage without testing meaningful functionality — superficial coverage" (Challenge #7, Salesforce)
- "59% of developers use AI-generated code they don't fully understand" (Challenge #7, Clutch)
- "A common agent shortcut is to delete a failing test rather than fix it" (Success Story #6, CodeScene)
- "You want tests to be scenario-driven — otherwise green while fragile" (Success Story #6, CodeScene)
- "Engineers had to manually review AI-generated test intentions" (Success Story #3, Salesforce)

STEP 3 — Evaluate:
1. Does mutation testing solve "superficial coverage"? Can it be gamed?
2. Can an AI agent circumvent test deletion detection (e.g., rewrite test to always pass)?
3. Is "weakened assertions" detection comprehensive enough?
4. Are quality grade thresholds well-calibrated against industry data?
5. Is Stryker v9.x confirmed compatible with vitest ^4.0.18?
6. Does "scenario-driven" require more than mutation scores?
7. Is mock-heavy ratio >60% the right threshold?

STEP 4 — Output findings in this EXACT format:

## Test Quality Review

### Strengths
- [what's well-designed]

### Research Claims Coverage
| Claim | Source | Coverage | Analysis |
|-------|--------|----------|----------|
| Superficial coverage | Salesforce | ... | ... |
| Agent deletes tests | CodeScene | ... | ... |
| Scenario-driven tests | CodeScene | ... | ... |
| 59% don't understand | Clutch | ... | ... |

### Gaps Found
- [what's missing — cite the research finding]

### Recommendations
- [specific, actionable improvements]

### Verdict: [PASS | NEEDS_WORK | MAJOR_GAPS]
[One sentence justification]
```

---

#### Agent 3 — name: "architecture-auditor"

```
You are a Software Architecture specialist auditing an AI-SDLC improvement plan. Quality-first review.

STEP 1 — Read these files completely using the Read tool:
- docs/improvement-plan.md
- docs/ai-sdlc-challenges-research.md
- docs/ai-sdlc-success-stories.md

STEP 2 — Focus on sections 2.4 (Codebase Archaeology), 2.5 (Semantic Graph Analysis), and 3.6 (Deep Context Loading).

Cross-reference against:
- "In a 400,000-file monorepo, AI assistants see a tiny fraction" (Challenge #4)
- "Agents hallucinate function names, confidently import modules not in project" (Challenge #4)
- "Indexing features fail for repos exceeding 2,500 files" (Challenge #4)
- "Refactoring is a graph traversal problem across semantic structure" (Challenge #6)
- "AI doesn't understand WHY code behaves a certain way" (Challenge #8)
- "The bottleneck is no longer writing code — it's knowing what to build" (Success Story #4)

STEP 3 — Evaluate:
1. Does codebase archaeology address "knowing what to build"?
2. Does semantic graph analysis catch ALL refactoring failure modes?
3. Is deterministic context loading higher quality than RAG for <10K files?
4. Are ts-morph, dependency-cruiser, knip the best tools available?
5. How do these three compose? Overlap or gaps?
6. Is the >10K file limitation acceptable?
7. Does anything address "agents hallucinate function names"?

STEP 4 — Output in this EXACT format:

## Architecture & Refactoring Safety Review

### Strengths
- [what's well-designed]

### Research Claims Coverage
| Claim | Source | Coverage | Analysis |
|-------|--------|----------|----------|
| 400K-file monorepo | VentureBeat | ... | ... |
| Hallucinate functions | AlgoMaster | ... | ... |
| Indexing >2500 fails | AlgoMaster | ... | ... |
| Graph traversal | Kiro | ... | ... |
| Doesn't understand WHY | Coder | ... | ... |
| Knowing what to build | Google | ... | ... |

### Gaps Found
- [what's missing]

### Recommendations
- [specific improvements]

### Verdict: [PASS | NEEDS_WORK | MAJOR_GAPS]
[One sentence justification]
```

---

#### Agent 4 — name: "workflow-auditor"

```
You are a Workflow Completeness specialist auditing an AI-SDLC improvement plan against the proven 8-step workflow from industry research.

STEP 1 — Read these files completely using the Read tool:
- docs/improvement-plan.md
- docs/ai-sdlc-challenges-research.md
- docs/ai-sdlc-success-stories.md

STEP 2 — Cross-reference the plan against ALL patterns from the "Success Pattern Summary":

8-step workflow:
1. SPECIFY — Human writes intent/requirements
2. REVIEW — AI validates spec completeness
3. PLAN — AI splits work into phases
4. IMPLEMENT — AI executes phases incrementally
5. AUDIT — AI runs quality gates
6. TEST — AI validates tests
7. REVIEW — AI + human review
8. DEPLOY — Automated pipeline with monitoring

5 Pillars: Spec-First | Quality Guardrails | Multi-Agent | Incremental | Human-in-the-Loop

7 Separators: Well-defined specs | More rigor | Mandatory gates | Scenario tests | Observability day 1 | 40-60% AI review | Incremental

STEP 3 — Evaluate:
1. Is every step covered by existing + planned capabilities?
2. Does the PR auto-fix loop have a max iteration safeguard?
3. Is "human reviews only final PR" consistent with "40-60% AI review"?
4. Is "observability from day 1" addressed (89% of successful orgs)?
5. Is there failure recovery for each step? Can the pipeline resume?
6. What happens if todo_code_writer fails at phase 3 of 5?

STEP 4 — Output in this EXACT format:

## Workflow Completeness Review

### 8-Step Coverage
| Step | Status | Existing | Planned Enhancement | Gap |
|------|--------|---------|--------------------|----|
| 1. SPECIFY | COVERED/PARTIAL/MISSING | ... | ... | ... |
| ... | ... | ... | ... | ... |

### 5 Pillars
| Pillar | Status | Evidence |
|--------|--------|---------|
| ... | ... | ... |

### 7 Separators
| Separator | Status | Evidence |
|-----------|--------|---------|
| ... | ... | ... |

### Gaps Found
- [what's missing]

### Recommendations
- [specific improvements]

### Verdict: [PASS | NEEDS_WORK | MAJOR_GAPS]
[One sentence justification]
```

---

#### Agent 5 — name: "success-validator"

```
You are a Success Pattern Validator. Ensure the improvement plan captures EVERY lesson from 12 industry success stories.

STEP 1 — Read completely using the Read tool:
- docs/improvement-plan.md
- docs/ai-sdlc-success-stories.md

STEP 2 — For EACH of the 12 stories, extract the key lesson and verify:

1. Spec-Driven Development — "intent → spec → plan → execution"
2. Microsoft — "600K+ PRs/month, 90% coverage, Core Orchestrator"
3. Salesforce — "2yr→4mo, dependency chain analysis"
4. Google — "80% AI-authored, bottleneck is knowing what to build"
5. Airbnb — "3500 tests migrated in 6 weeks"
6. Loveholidays/CodeScene — "MORE rigor, agents delete tests, scenario-driven"
7. Amazon Q — "57% faster, multi-step autonomous"
8. Cursor — "background agents, hundreds of automations/hour"
9. Claude Code — "CLAUDE.md → Plan → Subagents → Skills → Hooks → MCP"
10. Code Review — "51.4% adoption, 81% quality improvement, 40-60% optimal"
11. Multi-Agent — "57.3% production, 89% observability, 62% tracing"
12. PwC — "2-3x faster, 70% fewer incidents"

STEP 3 — Output in this EXACT format:

## Success Stories Validation

| # | Story | Key Lesson | Plan Section | Coverage | Missing |
|---|-------|-----------|-------------|----------|---------|
| 1 | SDD | intent→spec→plan→exec | Existing | FULL/PARTIAL/NONE | ... |
| ... | ... | ... | ... | ... | ... |

### Unaddressed Patterns
- [patterns not in the plan]

### Recommendations
- [specific improvements]

### Verdict: [PASS | NEEDS_WORK | MAJOR_GAPS]
[One sentence justification]
```

---

#### Agent 6 — name: "challenge-validator"

```
You are a Challenge Coverage Validator. Ensure EVERY specific claim from 10 industry challenges is addressed.

STEP 1 — Read completely using the Read tool:
- docs/improvement-plan.md
- docs/ai-sdlc-challenges-research.md

STEP 2 — Extract EVERY quantified claim and verify:

#1: "1.7x issues", "1.75x logic errors", "1.64x maintainability", "1.57x security", "8x I/O"
#2: "45% flawed", "2.74x XSS", "1.91x insecure refs", "1.88x passwords", "69% vulns", "1/5 impact"
#3: "20% hallucinated", "58% repeatable"
#4: "400K files", "fails >2500", "hallucinate functions"
#5: "every session resets"
#6: "imports break", "non-existent files"
#7: "superficial coverage", "59% don't understand"
#8: "doesn't understand WHY"
#9: "zero production awareness", "4% mature", "40% cancelled 2027"
#10: "trust 29%", "reviewer fatigue"

STEP 3 — Output in this EXACT format:

## Challenge Coverage Validation

| # | Challenge | Claim | Improvement | Coverage |
|---|-----------|-------|-----------|----------|
| 1 | Quality | 1.7x issues | 3.1 | FULL/PARTIAL/NONE |
| 1 | Quality | 8x I/O | 3.4 | ... |
| 2 | Security | 45% flawed | 1.2 | ... |
| ... | ... | ... | ... | ... |

### Claims with NO Coverage
- [every uncovered claim]

### Claims with PARTIAL Coverage
- [partially covered + what's missing]

### Recommendations
- [specific improvements]

### Verdict: [PASS | NEEDS_WORK | MAJOR_GAPS]
[One sentence justification]
```

---

#### Agent 7 — name: "maintainability-auditor"

```
You are a Software Maintainability specialist. User priority: quality balanced with maintainability/flexibility > time > cost.

STEP 1 — Read completely using the Read tool:
- docs/improvement-plan.md
- docs/ai-sdlc-challenges-research.md
- docs/ai-sdlc-success-stories.md

STEP 2 — Review ALL 12 improvements across 8 dimensions:

1. Module coupling — can each be developed/deployed/disabled independently?
2. Graceful degradation — pipeline behavior when tools unavailable?
3. Configuration — all thresholds adjustable via config, not code?
4. Extension — new scanners/validators addable as plugins?
5. Testing — each testable in isolation?
6. Upgrades — impact when tool X breaks?
7. Schema evolution — data formats versioned?
8. Operational burden — monthly maintenance hours?

STEP 3 — Output in this EXACT format:

## Maintainability & Flexibility Review

### Per-Improvement Assessment
| # | Improvement | Coupling | Degrade | Config | Extend | Test | Upgrade | Schema |
|---|-----------|---------|--------|--------|--------|------|---------|--------|
| 1.1 | Supply Chain | L/M/H | G/P/F | G/P/F | G/P/F | G/P/F | G/P/F | G/P/F |
| ... | ... | ... | ... | ... | ... | ... | ... | ... |

### Top 5 Maintainability Risks
1. [highest risk]
2. ...

### Architectural Recommendations
- [patterns to improve maintainability]

### Monthly Maintenance Estimate
| Category | Hours/Month | Details |
|----------|-----------|---------|
| ... | ... | ... |

### Verdict: [PASS | NEEDS_WORK | MAJOR_GAPS]
[One sentence justification]
```

---

#### Agent 8 — name: "feasibility-auditor"

```
You are an Implementation Feasibility specialist evaluating if 12 improvements can be built as described.

STEP 1 — Read completely using the Read tool:
- docs/improvement-plan.md
- CLAUDE.md
- package.json

STEP 2 — For each improvement evaluate:
1. Stack compatibility (Node 20+, ESM, vitest ^4.0.18, Zod ^4.0.0, TS strict)
2. Hidden complexity not mentioned
3. Effort estimate accuracy for ONE developer
4. Technical unknowns / what could fail
5. Roadmap ordering — does it respect prerequisites?

Rate: GREEN (clear path) | YELLOW (achievable with research) | RED (significant risk)

STEP 3 — Output in this EXACT format:

## Implementation Feasibility Review

| # | Improvement | Estimate | Rating | Key Risk | Adjusted Estimate |
|---|-----------|---------|--------|---------|-------------------|
| 1.1 | Supply Chain | 3-5d | G/Y/R | ... | [your estimate] |
| 1.2 | Security Scanner | 7-10d | G/Y/R | ... | ... |
| 2.1 | PR Human Gate | 5-7d | G/Y/R | ... | ... |
| 2.2 | Cross-Session | 5-7d | G/Y/R | ... | ... |
| 2.3 | Test Quality | 7-10d | G/Y/R | ... | ... |
| 2.4 | Archaeology | 7-10d | G/Y/R | ... | ... |
| 2.5 | Semantic Graph | 7-10d | G/Y/R | ... | ... |
| 3.1 | Quality Tracking | 3-4d | G/Y/R | ... | ... |
| 3.3 | Deploy Checklist | 3-4d | G/Y/R | ... | ... |
| 3.4 | Perf Detection | 3-5d | G/Y/R | ... | ... |
| 3.5 | Observability | 5-7d | G/Y/R | ... | ... |
| 3.6 | Deep Context | 7-10d | G/Y/R | ... | ... |

### Total: Original [X]d vs Adjusted [Y]d

### RED Items — Risk Analysis
- [each RED: what fails, mitigation]

### Roadmap Issues
- [ordering problems]

### Verdict: [PASS | NEEDS_WORK | MAJOR_GAPS]
[One sentence justification]
```

---

### Step 2: Synthesize All Reports

After ALL 8 agents complete, synthesize findings.

<synthesis_rules>
1. Read every agent's FULL report
2. Count verdicts: PASS vs NEEDS_WORK vs MAJOR_GAPS
3. Extract CONSENSUS findings — issues raised by 2+ agents (note which agents)
4. Extract CONFLICTS — agents disagreeing (state both positions)
5. Rank recommendations by QUALITY IMPACT (user's top priority)
6. Separate "quick wins" (plan edits) from "architectural concerns" (design rethinking)
7. List unresolved gaps
8. Final verdict:
   - STRONG_PASS: 7-8 PASS, 0 MAJOR_GAPS
   - PASS: 5-6 PASS, max 1 MAJOR_GAPS
   - NEEDS_REVISION: 3-4 PASS, or 2+ MAJOR_GAPS
   - MAJOR_REVISION: <3 PASS, or critical consensus gaps
</synthesis_rules>

### Step 3: Output Final Report and Save

Produce the synthesis and save to `docs/improvement-plan-review.md`.

<output_format>
## Improvement Plan Review — 8-Agent Synthesis

**Date:** [today]
**Documents:** improvement-plan.md, ai-sdlc-challenges-research.md, ai-sdlc-success-stories.md

### Executive Summary
[3-4 sentences: verdict, critical findings, agent consensus]

### Agent Verdicts
| # | Agent | Verdict | Critical Findings | Key Concern |
|---|-------|---------|-------------------|-------------|
| 1 | Security & Supply Chain | ... | [count] | [one-liner] |
| 2 | Test Quality & Mutation | ... | [count] | ... |
| 3 | Architecture & Refactoring | ... | [count] | ... |
| 4 | Workflow Completeness | ... | [count] | ... |
| 5 | Success Stories | ... | [count] | ... |
| 6 | Challenge Coverage | ... | [count] | ... |
| 7 | Maintainability | ... | [count] | ... |
| 8 | Feasibility | ... | [count] | ... |

### Consensus Findings (2+ agents)
[Ranked by quality impact. Each: finding, agents, why it matters]

### Conflicts Between Agents
[Both positions, recommended resolution]

### Top 10 Recommendations (by quality impact)
1. [HIGH] — ...
2. ...

### Quick Wins (plan document fixes)
- ...

### Architectural Concerns (need rethinking)
- ...

### Unresolved Gaps
- ...

### Final Verdict: [STRONG_PASS | PASS | NEEDS_REVISION | MAJOR_REVISION]
[2-3 sentence justification]
</output_format>
