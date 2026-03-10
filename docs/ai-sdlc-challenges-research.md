# Biggest Challenges in AI-Assisted Software Engineering — Battle-Tested Findings

Research compiled March 2026. All claims grounded in web search results with citations.

---

## 1. AI Code Quality Is Declining, Not Improving

After two years of steady gains, AI coding assistants hit a quality plateau in 2025 and began declining. Tasks that took 5 hours with AI assistance (vs 10 without) now take 7-8+ hours. A major factor: **training data poisoning** — as inexperienced AI-assisted coders flooded repositories, the models trained on progressively worse code. [IEEE Spectrum](https://spectrum.ieee.org/ai-coding-degrades)

CodeRabbit's analysis of real PRs found AI-generated code creates **1.7x more issues** than human code: 1.75x more logic errors, 1.64x more maintainability issues, 1.57x more security findings, and ~8x more excessive I/O operations. [CodeRabbit Report](https://www.coderabbit.ai/blog/state-of-ai-vs-human-code-generation-report)

> **Gap in mcp-ts-engineer:** The `pr_reviewer` catches issues post-implementation, but there's no **code quality regression tracking over time** — no way to detect if the AI agents themselves are producing progressively worse code across sessions.

---

## 2. Security Vulnerabilities at Scale

**45% of AI-generated code contains security flaws** (Veracode 2025). AI code is 2.74x more likely to introduce XSS, 1.91x more likely to create insecure object references, and 1.88x more likely to mishandle passwords vs human developers. [Veracode](https://www.veracode.com/blog/ai-generated-code-security-risks/) | [Endor Labs](https://www.endorlabs.com/learn/the-most-common-security-vulnerabilities-in-ai-generated-code)

69% of developers surveyed discovered vulnerabilities from AI-generated code in their systems; **1 in 5 reported material business impact**. [GroweXX](https://www.growexx.com/blog/ai-code-security-crisis-2026-cto-guide/)

Real incidents in 2025: GitHub's MCP protocol was exploited via malicious commands in public repo Issues to hijack AI agents and exfiltrate data. Critical vulnerabilities were found in Cursor, GitHub Copilot, and Google Gemini coding tools. [Fortune](https://fortune.com/2025/12/15/ai-coding-tools-security-exploit-software/)

> **Gap in mcp-ts-engineer:** The `audit_fix` runs Biome lint + basic checks, but lacks **dedicated SAST/DAST security scanning** (OWASP top 10, dependency vulnerability deep scan, secret detection). The `pr_reviewer` has a security agent, but it's pattern-matching, not running actual security tooling.

---

## 3. Slopsquatting — AI Package Hallucination Attacks

A new supply chain attack vector: LLMs hallucinate non-existent packages, and attackers register them with malicious code. Testing of 576,000 code samples found **~20% recommended non-existent packages**, and 58% of hallucinated packages were repeatable (not random). [FOSSA](https://fossa.com/blog/slopsquatting-ai-hallucinations-new-software-supply-chain-risk/) | [BleepingComputer](https://www.bleepingcomputer.com/news/security/ai-hallucinated-code-dependencies-become-new-supply-chain-risk/)

> **Gap in mcp-ts-engineer:** No capability validates that packages added by `todo_code_writer` actually exist in npm/PyPI registries, or checks newly added dependencies against known malicious package databases. The `audit_fix` checks `npm audit` but not hallucinated package names.

---

## 4. Context Window Brittleness & Large Codebase Failures

In a 400,000-file monorepo, AI assistants "see" a tiny fraction — like understanding a novel by reading one paragraph at a time. Custom decorators buried three directories deep, subtle overrides in sibling microservices, and critical business logic remain invisible. [VentureBeat](https://venturebeat.com/ai/why-ai-coding-agents-arent-production-ready-brittle-context-windows-broken) | [Augment Code](https://www.augmentcode.com/tools/ai-coding-assistants-for-large-codebases-a-complete-guide)

Agents hallucinate function names that don't exist, confidently import modules not in the project, and indexing features fail for repos exceeding 2,500 files. [AlgoMaster](https://blog.algomaster.io/p/using-ai-effectively-in-large-codebases)

> **Gap in mcp-ts-engineer:** The fresh-context-per-step architecture is a strength (prevents context pollution) but also a weakness — **each step has zero memory of prior steps' reasoning**. The planner outputs a JSON plan, but the engineering step can't reference *why* the planner made specific decisions. No semantic code index or retrieval-augmented generation (RAG) over the codebase.

---

## 5. The "Goldfish Memory" Problem

Every new chat session resets the agent to the knowledge of a brand new hire. Long-running projects lose accumulated context about architecture decisions, failed approaches, and domain-specific conventions. [Pete Hodgson](https://blog.thepete.net/blog/2025/05/22/why-your-ai-coding-assistant-keeps-doing-it-wrong-and-how-to-fix-it/)

> **Gap in mcp-ts-engineer:** The `SessionManager` tracks lifecycle/cost but not **accumulated project knowledge**. There's no learning loop — if `todo_code_writer` fails phase 3 due to a specific pattern, the next invocation will likely fail the same way. No cross-session memory or "lessons learned" persistence.

---

## 6. Multi-File Refactoring Breaks Everything

When AI renames functions or moves files, imports break and references point to non-existent files. Refactoring is a **graph traversal problem** across the codebase's semantic structure — cascading through call sites, type definitions, imports, tests, and docs. Asking for too much in one operation produces inconsistent results. [Kiro](https://kiro.dev/blog/refactoring-made-right/) | [VentureBeat](https://venturebeat.com/ai/why-ai-coding-agents-arent-production-ready-brittle-context-windows-broken)

> **Gap in mcp-ts-engineer:** The phase-based approach in `todo_code_writer` helps (small incremental phases), but there's no **semantic graph analysis** to verify cross-file consistency after changes. The `finalize` audit step checks lint/types but not semantic completeness (e.g., "did we update all call sites?").

---

## 7. AI-Generated Tests: Coverage Without Quality

AI produces tests that hit coverage metrics without testing meaningful functionality — "superficial coverage." Salesforce found engineers had to manually review AI-generated test intentions to ensure they weren't just gaming coverage numbers. [Salesforce Engineering](https://engineering.salesforce.com/how-cursor-ai-cut-legacy-code-coverage-time-by-85/)

59% of developers use AI-generated code they don't fully understand. When this extends to tests, you get a false sense of safety. [Clutch](https://clutch.co/resources/devs-use-ai-generated-code-they-dont-understand)

> **Gap in mcp-ts-engineer:** The `todo_reviewer` validates TDD coverage in the spec, and `finalize` runs tests, but neither assesses **test quality** — mutation testing, assertion density, boundary value analysis, or whether tests actually verify business logic vs. just exercising code paths.

---

## 8. Legacy Code & Business Logic Comprehension

AI pattern-matches against training data but doesn't understand *why* code behaves a certain way. It can't grasp company-specific risk tolerance, customer SLAs, or why a weird edge case in payment processing exists. Cross-file dependencies in legacy systems require experienced engineering judgment to sequence correctly. [Coder](https://coder.com/blog/ai-assisted-legacy-code-modernization-a-developer-s-guide)

> **Gap in mcp-ts-engineer:** The spec-driven workflow assumes someone writes a good spec. But there's no capability for **codebase archaeology** — understanding existing code deeply before writing specs. No "analyze this module and explain its business rules" capability.

---

## 9. Operational Awareness: The Deploy-to-Production Gap

AI agents write code and pass tests but have zero awareness of production behavior — monitoring, alerting, deployment pipelines, feature flags, database migrations, rollback strategies. Only **4% of organizations** have achieved full production maturity with AI, and over 40% of agentic AI projects are predicted to be cancelled by 2027. [LangChain State of Agents](https://www.langchain.com/state-of-agent-engineering) | [VentureBeat](https://venturebeat.com/ai/why-ai-coding-agents-arent-production-ready-brittle-context-windows-broken)

> **Gap in mcp-ts-engineer:** The entire pipeline stops at "commit." No capability for: database migration generation/validation, deployment manifest updates, feature flag configuration, monitoring/alerting setup, runbook generation, or rollback plan creation.

---

## 10. Developer Skill Atrophy & Trust Erosion

Developers report feeling "so stupid" when working without AI — skills that were instinct became manual and cumbersome. [MIT Technology Review](https://www.technologyreview.com/2025/12/15/1128352/rise-of-ai-coding-developers-2026/)

Meanwhile, developer trust in AI dropped from 40% to **29%** between 2024-2025, even as 84% adopted the tools. Review pipelines weren't built for the volume AI generates, and reviewer fatigue leads to more missed bugs. [Stack Overflow](https://stackoverflow.blog/2026/02/18/closing-the-developer-ai-trust-gap/)

> **Gap in mcp-ts-engineer:** No **human-in-the-loop checkpoints** between phases. The workflow is fully autonomous (DRAFT→IMPLEMENTED). No capability for "pause and get human approval before proceeding to implementation" or "flag high-risk changes for human review before commit."

---

## Summary: Gaps the Pipeline Doesn't Address Yet

| # | Gap | Severity | Description |
|---|-----|----------|-------------|
| 1 | **Supply chain validation** | Critical | No package existence/integrity verification for AI-added dependencies |
| 2 | **Dedicated security scanning** | Critical | No SAST/DAST tooling, only pattern-matching review agents |
| 3 | **Human-in-the-loop gates** | High | Fully autonomous pipeline with no approval checkpoints |
| 4 | **Cross-session learning** | High | No memory of past failures, repeated mistakes across invocations |
| 5 | **Test quality assessment** | High | Coverage quantity tracked, but not assertion quality or mutation testing |
| 6 | **Codebase archaeology** | High | No "understand existing code" capability before spec writing |
| 7 | **Operational/deploy awareness** | Medium | Pipeline stops at commit — no migrations, monitoring, deploy artifacts |
| 8 | **Semantic graph analysis** | Medium | No cross-file consistency verification beyond lint/types |
| 9 | **Code quality regression tracking** | Medium | No trend analysis of AI output quality over time |
| 10 | **RAG/code indexing** | Medium | Fresh context per step means no deep codebase retrieval |

---

## Sources

- [IEEE Spectrum — AI Coding Degrades: Silent Failures Emerge](https://spectrum.ieee.org/ai-coding-degrades)
- [CodeRabbit — AI vs Human Code Generation Report](https://www.coderabbit.ai/blog/state-of-ai-vs-human-code-generation-report)
- [VentureBeat — Why AI Coding Agents Aren't Production-Ready](https://venturebeat.com/ai/why-ai-coding-agents-arent-production-ready-brittle-context-windows-broken)
- [MIT Technology Review — AI Coding Is Everywhere](https://www.technologyreview.com/2025/12/15/1128352/rise-of-ai-coding-developers-2026/)
- [Veracode — AI-Generated Code Security Risks](https://www.veracode.com/blog/ai-generated-code-security-risks/)
- [Endor Labs — Most Common Security Vulnerabilities in AI-Generated Code](https://www.endorlabs.com/learn/the-most-common-security-vulnerabilities-in-ai-generated-code)
- [GroweXX — The AI Code Security Crisis of 2026](https://www.growexx.com/blog/ai-code-security-crisis-2026-cto-guide/)
- [Fortune — AI Coding Tools Security Exploits](https://fortune.com/2025/12/15/ai-coding-tools-security-exploit-software/)
- [FOSSA — Slopsquatting: AI Hallucinations and Supply Chain Risk](https://fossa.com/blog/slopsquatting-ai-hallucinations-new-software-supply-chain-risk/)
- [BleepingComputer — AI-Hallucinated Code Dependencies](https://www.bleepingcomputer.com/news/security/ai-hallucinated-code-dependencies-become-new-supply-chain-risk/)
- [Augment Code — AI Coding Assistants for Large Codebases](https://www.augmentcode.com/tools/ai-coding-assistants-for-large-codebases-a-complete-guide)
- [AlgoMaster — How to Use AI Effectively in Large Codebases](https://blog.algomaster.io/p/using-ai-effectively-in-large-codebases)
- [Pete Hodgson — Why Your AI Coding Assistant Keeps Doing It Wrong](https://blog.thepete.net/blog/2025/05/22/why-your-ai-coding-assistant-keeps-doing-it-wrong-and-how-to-fix-it/)
- [Kiro — Refactoring Made Right](https://kiro.dev/blog/refactoring-made-right/)
- [Salesforce Engineering — How Cursor AI Cut Legacy Code Coverage Time by 85%](https://engineering.salesforce.com/how-cursor-ai-cut-legacy-code-coverage-time-by-85/)
- [Clutch — Devs Use AI-Generated Code They Don't Understand](https://clutch.co/resources/devs-use-ai-generated-code-they-dont-understand)
- [Coder — AI-Assisted Legacy Code Modernization](https://coder.com/blog/ai-assisted-legacy-code-modernization-a-developer-s-guide)
- [LangChain — State of Agent Engineering](https://www.langchain.com/state-of-agent-engineering)
- [Stack Overflow — Closing the Developer AI Trust Gap](https://stackoverflow.blog/2026/02/18/closing-the-developer-ai-trust-gap/)
- [Stack Overflow — Are Bugs and Incidents Inevitable with AI Coding Agents?](https://stackoverflow.blog/2026/01/28/are-bugs-and-incidents-inevitable-with-ai-coding-agents/)
- [The Register — AI-Authored Code Needs More Attention](https://www.theregister.com/2025/12/17/ai_code_bugs/)
