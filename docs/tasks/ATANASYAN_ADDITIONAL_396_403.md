# Atanasyan 10–11: additional cylinder exercises 396–403

## Identity

- Owner: repository owner, current course-continuation conversation.
- Date: 2026-11-02 UTC / 2026-11-03 Asia/Novosibirsk.
- Base branch: main.
- Base SHA: ea5b6cb9e931eee63224fbc4c13b2ac43326cc19.
- Branch: codex/atanasyan-cylinder-additional-396-403.
- Review level: MEDIUM — a bounded content increment using the existing schema,
  renderer, optional explanations and persistence. No storage, authentication,
  deployment mechanism or shared runtime behavior changes.
- Related ADR: none; this uses the already implemented textbook architecture.

## Goal and approved scope

Continue the Atanasyan 10–11 course after the published PR402. The owner said
«продолжай», then «делай облачно». The next coherent source block is additional
cylinder exercises 396–403, ending before the cone exercises. Add nine cards,
including separate original parts 400а and 400б, to the existing course.
Expected result: 662 cards and main exercises 1–403 complete.

Keep original source numbers, mathematically justified steps, large interactive
drawings and explanations opened only on request. Preserve all 653 published
cards (including the 13 cards of PR402), existing identities/revisions and saved
learner work. Cloud GitHub edits and GitHub Actions are the implementation and
verification path; no local course build or browser test is required.

Included: nine lessons, eight explicit completeness contracts, one review batch,
generated catalogue/bundle, exact preservation projection, mathematical and
mobile regressions, task/review/status documentation. Reconcile the preceding
PR402 publication from its actual release evidence.

Excluded: exercises 404 onward, further theory, new interaction patterns, renderer
or storage changes, private textbook uploads and any external provider audit.
Do not recreate the already published PR402 cards.

## Source and learning design

- Book: Atanasyan 2024, grades 10–11, source SHA256
  bead97a383e438b32b9caaff72d61d27e8fa6cd20c6b86a5f234bc4cdb629770.
- Conditions visually checked on printed page112 / PDF114; answers checked on
  printed page265 / PDF267 where supplied.
- Only source identity/page metadata and independently written explanations/models
  enter the repository. No original PDF, page image, raw extract or private link.
- 400б requires both assignments of height/diameter, giving 2 and5/4.
- 401 requires both positive roots (2±√3)/2; 402 distinguishes height p/2 from
  radius p/4. 403 includes five exposed surfaces of an open cup, totaling414π.
- Design review: author-side, source-led progression from a geometric observation
  to an equation and a checked result. Each of38 steps has reasons; all40 model
  states are reachable through condition/help/steps. Proof answers remain manual.
- External consultation/audit: not performed and not required under the current
  standing owner policy. No independent/provider verdict is claimed.

## Acceptance criteria and gates

- [ ] 662 available cards;403 complete main exercises;50 self-check questions;
      51 theory points; no partially published source group.
- [ ] All653 prior raw files, catalogue metadata and review records preserved.
- [ ] Reproducible Python course build; schemas; source contracts; finite planar
      geometry; historical content/runtime/storage and shared-consumer checks.
- [ ] Source-derived mathematics:2400 parameter families, model incidence/area
      checks and six negative mathematical controls.
- [ ] Five negative integration controls reject loss, content drift, old revision
      change, Latin replacement of Cyrillic subparts and missing source contracts.
- [ ] All nine cards at widths320/390/1280:27 journeys,120 states, correctly stacked
      fractions, rotation, enlargement, closed help and persisted steps/drafts.
- [ ] Full662-card cloud regression and all applicable Actions pass on the
      actual integration head.
- [ ] Exact current-main/head guard, merge identity, successful Pages deployment
      and live662-card publication with all nine routes verified.

Final focused markers:
ATANASYAN_ADDITIONAL396_CONTENT_OK,
ATANASYAN_ADDITIONAL396_MATH_OK,
ATANASYAN_ADDITIONAL396_BROWSER_OK.

Tests run only in GitHub Actions. Physical devices, real-pupil trials and a new
independent external audit are not claimed. Full-source visual inspection and
author mathematics review precede CI; CI is separate evidence, not a provider
review.

## Risk and rollback

Main risks: losing one case in400б/401, confusing diameter/radius, omitting a cup
surface, clipping formulas/labels on phones, or changing historical saved work.
Controls: source review, analytic families and deliberate negative cases,
hash-frozen653 preservation and actual mobile/reload scenarios.

Rollback: ordinary revert of this release commit followed by the normal checks
and Pages deployment. Do not erase browser storage. The runtime and storage key
format remain byte-identical; old answers and newly created drafts stay intact.

## Permissions

The current continuation instruction authorizes this bounded next course block.
Branch, commits, push and Draft PR are allowed.
Publication is authorized after applicable checks by
[standing owner policy](../OWNER_RELEASE_AUTHORIZATION.md). Controlled
squash-merge follows exact remote main/head verification; no fresh blanket
publication approval or external-audit waiver is pending.
No force/reset/rebase/admin override or weakened gates.

## Execution record

The exact head, PR number, Actions results, release identity and live checks are
recorded in the task PR and [review record](../reviews/ATANASYAN_ADDITIONAL_396_403.md).
At initial preparation: source and author mathematics review complete; cloud CI,
visual artifact review and publication are pending. This is not a release PASS.

```text
EXECUTIVE STATUS
Task: Additional cylinder exercises396–403
PR: to be created for this branch
Base: ea5b6cb9e931eee63224fbc4c13b2ac43326cc19
Head: recorded by GitHub commit/PR
Gate: PENDING — cloud validation required
Tests: source review and author analytic derivations complete
Failures: no CI result yet
Not run: physical devices, real-pupil trial, external provider audit
Scope deviations: none
Recommendation: run all relevant Actions and review actual artifacts
Next user decision: none under standing policy
```
