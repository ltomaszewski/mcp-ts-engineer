# PRD Schema Template

**Note:** The code fences below are for illustration only. Write the spec as plain markdown WITHOUT wrapping code fences.

**Inline code rule:** Wrap terms in backticks when they would appear literally in source code: field/property names (`placementType`), class/struct names (`AdLocation`), method names (`sdk_init`), enum cases (`.banner`), constants (`ChartboostAdPreview`), data types (`String`, `Bool`), file names (`AppState.swift`), literals (`320x50`, `true`, `nil`), HTTP verbs (`POST`), commands (`pod install`). Do NOT backtick product names (Firebase), concepts (guest mode, local storage), role names (demand team), or action descriptions (saves, renders).

Use this exact structure for the output file.

---

## Header

```markdown
# **PRD \- [Title from 1-pager]**

| Name | [feature/project name from 1-pager] |
| :---- | :---- |
| Owner | [owner name from 1-pager or TBD] |
| Reviewers | [Reviewer 1 name] In Review [Reviewer 2 name] In Review [Reviewer 3 name] In Review |
| Tech Lead | [tech lead name or TBD] |
| Design Lead | [design lead name or TBD] |
| Tech Writers | [tech writer name or TBD] |
| Document status | Draft |
| Release date | [from 1-pager or TBD] |
| Last updated | [current date] |
| Epic link | [JIRA epic link or TBD] |
| 1-Pager | [path to 1-pager file] |
```

Reviewers are a row inside the main header table (not a separate subsection). List each reviewer name followed by their status inline, separated by spaces. Populate reviewer names from the 1-pager or additional files. If no reviewers are specified in the input files, default to listing the Owner and Tech Lead as reviewers. All start as "In Review" for Draft. Valid statuses: **In Review**, **Approved**, **Changes Requested**. Use left-aligned column format (`:----`) to match Google Docs import style.

---

## Section: Problem

```markdown
## Problem

### Problem Statement

[What pain exists, who feels it, evidence. Use the 1-pager's language, enrich with codebase context.]

### Why Now

[Strategic urgency -- why this over other work. Timing, market pressure, dependencies, technical debt.]

### Customer Evidence

[Links to or summaries of support tickets, research, user interviews, data.]
```

---

## Section: Goals & Success Metrics

```markdown
## Goals & Success Metrics

### Primary Metric

[One quantified outcome that defines success. Mark TBD if not in inputs.]

### Secondary Metrics

- [Supporting indicator 1]
- [Supporting indicator 2]

### Anti-Metrics

- [What should NOT get worse as a result of this work]
```

---

## Section: User Stories

Use Job Story format (preferred) or User Story format. Pick one, be consistent.

```markdown
## User Stories

- When [situation], I want to [motivation], so I can [outcome]
- When [situation], I want to [motivation], so I can [outcome]
```

---

## Section: Scope

```markdown
## Scope

### In Scope

- [Explicit item 1]
- [Explicit item 2]

### Out of Scope

- [Explicit exclusion 1] -- [brief reason]
- [Explicit exclusion 2] -- [brief reason]

### Future Considerations

- [Deferred item 1] -- [when it might be revisited]
```

---

## Section: Requirements

```markdown
## Requirements

### P0 - Must Have

- **R1**: [requirement] -- Given [context], when [action], then [result]
- **R2**: [requirement] -- [acceptance criteria]

### P1 - Important

- **R3**: [requirement] -- [acceptance criteria]

### P2 - Nice to Have

- **R4**: [requirement] -- [acceptance criteria]

### Non-Functional Requirements

- **Storage**: [constraint]
- **Performance**: [constraint]
- **Security**: [constraint]
```

Use bullet points with bold ID prefix for requirements. Format: `- **ID**: requirement -- acceptance criteria`. Acceptance Criteria use **Given/When/Then** or **Checklist** format. Only include NFR categories at risk.

---

## Section: Dependencies & Risks

```markdown
## Dependencies & Risks

### Dependencies

- [External team, API, library, or release blocking or affecting this work]

### Risks

- **[risk]** -- Likelihood: [High/Med/Low], Impact: [High/Med/Low]. Mitigation: [mitigation]

Likelihood: High = >50% chance, Med = 20-50%, Low = <20%. Impact: High = blocks launch or causes data loss, Med = delays >1 week or degrades UX significantly, Low = minor inconvenience. Every High-impact risk must have a mitigation strategy.

### Assumptions

- [What we believe true but have not validated]
```

---

## Section: Design References

```markdown
## Design References

- [Link to Figma mockup or prototype]
- [Link to design system components]
```

If none: "Design work not yet started. To be created based on this spec."

---

## Section: Open Questions

```markdown
## Open Questions

- [unresolved question] -- Owner: [who should answer], Status: Open
- [unresolved question] -- Owner: [who should answer], Status: Open
```
