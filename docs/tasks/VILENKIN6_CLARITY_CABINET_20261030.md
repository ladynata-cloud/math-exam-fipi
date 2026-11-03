# Vilenkin 6: learner clarity, source identity and revised cabinet course

- Date: 2026-10-30, Asia/Novosibirsk.
- Base: main, `6fb959fc0130a0bb8842601d19297e305ac91ac0`.
- Branch: `fix/vilenkin6-clarity-cabinet-20261030`.
- Review: HIGH (new saved-work adapter using the existing learning protocol).
- Owner scope: validate teaching before/around GCD and LCM, connect the entire
  updated course to the existing grade-six cabinet, label every trainer by its
  source exercise/point/paragraph/chapter, provide a prime table and elementary
  and grade-five refreshers; ultimately cover every exercise in both parts.

## Verified starting point

The public first-part revision has 24 units, 192 selected tasks and 605 steps.
The cabinet still uses the older 27-module course. Its IDs and saved work must
not be reassigned to different tasks. Both supplied 2024 PDFs match the existing
edition hashes. The 44 numbered topics are points, not 44 paragraphs: the book
has six paragraphs in two chapters. Neither the old topic course nor the 192
selected tasks constitutes a solution of every exercise.

## Deliverables and acceptance

- Reproduce and document learner-facing failures, including uncertainty about
  real-pupil outcomes; automated success is not evidence of learning gains.
- Correct the confirmed hint/feedback and source-caption defects; keep numbers,
  mathematical targets, source pages and prior public task IDs unchanged.
- Provide a checked prime table through 1000, divisibility reminders and
  contextual elementary/grade-five support with a return to the same task.
- Add a distinct `vilenkin6-textbook` per-task cloud contract, catalog and
  cabinet route. Validate ownership, read-only observation, retained drafts,
  help accounting and replay through the existing protocol. Preserve old
  `vilenkin6-part1:lesson-*` work and the standalone browser store.
- Keep course assignment private and apply it only to the requested cabinet
  through the teacher UI after the ready build is published.
- Inventory every numbered exercise in both supplied parts, distinguishing
  selected subparts, verified complete exercises and missing work. Never label
  an indexed PDF page or a sampled subpart as a complete interactive solution.
- Full-book completion remains an OPEN acceptance criterion until every source
  number and subpart has an independently reviewed solution. The present audit
  must report that gap explicitly; this specification does not waive it.

## Checks

Existing source/math, DOM, 390/1280-pixel browser, entry-routing and legacy
managed checks; new support/prime and source-hierarchy checks; per-task contract,
catalog and real two-service persistence/ownership regression tests. Revalidate
changed source-review hashes only after independent review, preserving earlier
evidence as historical evidence. No weakening of a guard to obtain a pass.

## Review and release

The design brief is the acceptance list above, bounded to existing task-first
and learning-contract patterns. No Claude API tool is exposed. The prior
Vilenkin ready-result review returned insufficient Anthropic credit; no changed
access or paid retry is assumed. Consultation is unavailable, not approved.
Source inventory, preparation, independent mathematics/pedagogy review and
technical checks continue. Exact-head external review or an explicit scoped
owner exception remains required before release under the review policy.

The current user instruction authorizes preparing and publishing the requested
course and private assignment. It does not authorize weakening gates, deleting
saved pupil work, paid provider activation, or releasing unrelated PR375.
Publication must identify the exact tested result and all incomplete criteria.

## Rollback

Withdraw the new route/catalog entry while retaining its distinct contract and
stored attempts. Old course IDs and records remain readable. Do not restore a
database snapshot over later work or map new tasks onto old attempt IDs. Keep
new public browser work under its existing versioned key.
