# EGE_BASE_21_EXAM_MAP_20261110

- Owner request, 10 November 2026 (Asia/Novosibirsk): rebuild the base EGE course so pupils see all 21 numbered task types.
- Base: `main`, `f4616a5df8d5b2af825dc902a7a3b8139842e482`.
- Branch: `feat/ege-base-21-exam-map`.
- Review: MEDIUM, bounded course navigation and read-only progress presentation.
- Start, implementation, branch, commits, push and PR are authorized by the direct request. Checked publication is covered by [standing owner authorization](../OWNER_RELEASE_AUTHORIZATION.md).

## Goal and scope

Make the default entrance and course map recognizably prepare for base EGE:
21 visible numbered cards, concise names, a direct start action, topic lists and
progress for each exam number. Retain the seven broader learning lines as a
secondary route, all existing lesson URLs, saved work, detailed reports and checks.
Return from a lesson to its exam number and keep the next topic within that number.

The existing bank supplies 111 distinct families, distributed by position as
`4,4,4,4,3,4,3,3,3,4,5,7,7,6,11,8,10,3,4,9,5`.
No new exercise bank, grader, persistence schema, board protocol, backend or
exam-readiness score is introduced. Counts refer to families, not mastery of
every possible exam subtype. Unknown saved results remain unknown.

## Evidence and design review

The published root and `course-journey.js` returned HTTP 200 and exactly matched
the validated base when work began. The previous main map exposed seven broad
lines; the existing per-lesson metadata already covered positions 1–21.

Official sources checked on 10 November:
- https://fipi.ru/ege/demoversii-specifikacii-kodifikatory
- https://doc.fipi.ru/ege/demoversii-specifikacii-kodifikatory/2027/ma_11_2027.zip
- https://doc.fipi.ru/ege/demoversii-specifikacii-kodifikatory/2027/Plan_izmeneniya_KIM_EGE_2027.pdf

The 2027 documents remain labelled drafts; no base-level structural change is
listed. Card names are editorial summaries, not verbatim official headings.
Independent internal source/design review confirmed all 21 mappings, 111 unique
families, read-only projection and bounded continuation. Its two minor findings
were addressed: position 15 names proportions, and the source page's stale
103-family count is corrected. This was not an external provider review.

## Acceptance and checks

- All 21 numbered cards are primary and each opens actual preparation.
- Each number page includes only its own families; all 111 occur once.
- Progress separates independent work and assistance; no writes occur on the map.
- Existing saved drafts, legacy reports and corrupt/blocked-store handling survive.
- Default route, number routes, task return and next-topic control are tested.
- Relevant unit/DOM suites and existing browser CI cover desktop and narrow screens.
- Actual browser preview checks number selection, lesson opening, return and layout.

Local test results, exact head, remote CI and publication evidence are recorded
in the PR. A prepared candidate is not described as published until Pages and
the deployed resources are verified. External review and real-pupil trials are
not performed.

## Risks and rollback

Risks: route regressions, confusing progress labels, hidden mobile controls,
cached mixed script versions. Scripts use versioned URLs and retain fallbacks.
A scoped revert restores the previous navigation without changing the bank or
saved-data schema; do not clear learner storage. Immediately before merging,
requery remote main/head and revalidate any drift as required by AGENTS.md.

## Executive status

Task: EGE_BASE_21_EXAM_MAP_20261110
Base: f4616a5df8d5b2af825dc902a7a3b8139842e482
Head and PR: recorded in PR metadata
Gate: local validation in progress; remote CI and publication not yet claimed
Scope deviations: none
Next user decision: none; standing release authorization applies after checks
