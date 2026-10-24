# Nikolsky 10 course (2022)

## Identity and scope

- Owner request: create an interactive course in the same style as the latest textbook courses. The owner corrected the mistakenly attached Alimov book and supplied Nikolsky, grade 10, 2022. Alimov work in this conversation is cancelled.
- Date: 2026-10-24 (Asia/Novosibirsk).
- Base: `main`, `d524c9107133d6a948ff11c18095b5ca01b660de`.
- Branch: `course/nikolsky10-2022`.
- Review level: MEDIUM. Reuses the Makarychev8/Peterson6 task, hints, rational checking and local progress architecture; adds scoped content and topic illustrations.
- Owner creation request and replacement upload authorize scoped implementation, checks, branch and Draft PR. Merge and deployment are not authorized in this conversation.

## Goal

Cover all 90 numbered topics in the supplied 2022 Nikolsky grade-10 algebra textbook, including the 31 starred topics. Use short original theory, meaningful guided steps, selected accurately attributed source tasks, authored exercises, interactive models and optional computation detours that retain the originating work.

## In scope

- `school/nikolsky10/` static course, content, exact source topic map, tests and documentation.
- A course catalog entry, scoped CI and this task specification.
- Explicit scope indicators: topic coverage is distinct from a solution bank for every exercise/subpart. No exhaustive textbook solution claim.
- Browser-local work, isolated key, JSON import/export and independent/helped accounting.

## Preserved boundaries

No existing course runtime or progress data is changed. No cabinets, accounts, board transport, hosting settings, payments or cloud learner data are altered. The source PDF and private attachment metadata are not published. No board synchronization is claimed.

## Acceptance and validation

- Every topic in the verified source map has theory and at least three solved exercises.
- Source-labelled tasks have an exercise/subpart and printed page checked from the supplied PDF.
- All task and step answers pass the actual checker; malformed input fails.
- Important boundaries: real domains, extraneous roots, zero denominators, inverse-trig principal ranges, trig graph poles and probability assumptions.
- Actual DOM journeys cover every task and step; regressions cover hints, drafts, computation return, corrupt/future state preservation and merging imported work.
- Model calculations and mathematical boundaries are checked separately; a real browser preview is attempted and its result recorded honestly.
- `NIKOLSKY10_CONTENT_OK`, `NIKOLSKY10_UI_OK` and model/state/import checks.

## Review plan and consultation

Before implementation the focused design question was: how to retain the established calm task-first workflow for high-school domains and inverse trigonometry, without hiding prerequisite arithmetic or implying that the topic illustration is the exact task solution. The selected design reuses the current Makarychev8 workflow, separates textbook and authored tasks, and labels reusable illustrations.

Claude consultation is not completed: no Anthropic credential is configured in this execution environment, no Claude/Anthropic tool is exposed, and a provider plugin search returned no result. No provider call, design advice or external approval is claimed. Continue scoped preparation and technical/independent checks; record the missing consultation in the release handoff. Prior exceptions in other tasks are not reused.

Independent agents review content and interaction. These reviews are not Claude review or real-pupil validation. The ready-result consultation remains not run for the same access reason.

## Risk and rollback

Primary risks are mathematical transcription, finite symbolic answer aliases and visual density at narrow widths. The checker is not a general symbolic algebra engine. Rollback removes only the new course directory, its catalog entry and scoped CI; existing course data remains isolated. Publication remains a separate owner decision under the repository workflow.

## Implementation and validation result

- Delivered 90 topics, 270 theory blocks, 270 tasks, 815 guided steps, 56 selected source tasks/subparts and 214 authored tasks. The exact source map includes 31 starred topics.
- Model coverage: 22 families across all 90 topics, plus 20 shared computation skills with three difficulty levels.
- Content, model calculations and DOM controls, retained-state, four import-preservation tests, and every task/step UI journey passed. Regressions cover explicit exercise subparts, leading-zero paragraph searches, escaped fraction/exponent formatting and equivalent rational multiples of pi.
- Independent content reviews checked source conditions, domains, interval endpoints and inverse-function ranges. Nine exponential/logarithmic inequalities were also sampled at 201 points each; probability review included independent enumerations.
- The actual browser displayed the home page and logarithm lesson correctly. Its logarithm model responded to an alternate base, and an accepted intermediate answer stayed visible before successful task completion.
- Not run: mobile viewport visual inspection, pupil validation, and Claude consultation/release verdict (provider access unavailable). Automated DOM tests are not substituted for those checks.
- The remote base advanced during implementation. The task branch remains based on the declared commit; no rebase or branch repair is authorized. Current-main composition and release-base evidence belong in the PR handoff before any separate merge decision.
