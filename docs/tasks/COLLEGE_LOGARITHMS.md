# College logarithms: from first steps to short-answer exam practice

## Identity

- Task: `COLLEGE_LOGARITHMS`.
- Owner: MathExam project owner.
- Date: 2026-11-06 (Asia/Novosibirsk).
- Base branch: `main`.
- Base SHA: `8448ccecff1334cfa4e404c6040f855f2bb258e5`.
- Planned/actual branch: `feat/college-logarithms-20261106`.
- Review level: `MEDIUM`.
- Related architecture: the implemented college-functions course and semantic
  board bridge. ADR 0001 remains `Proposed`; implemented code and gates are the
  architectural evidence for this bounded adapter.

## Goal

Provide a gradual Russian-language logarithm course for a college learner:
meaning, properties, graphs, small equations and inequalities, then basic and
profile short-answer exam practice. Each exercise can open on the shared board
with synchronized work, hints and graph controls.

## Context and evidence

- The owner requested this course, accepted the 102-exercise plan, and gave
  `start` in the current task conversation on 2026-11-06.
- `trainers/college-functions/` already implements a nested public course,
  mathematical checks, graph plotting and a semantic board adapter.
- `trainers/board-compat.json` and `board-picker-data.json` are the existing
  registration points. The board URL must name the exact `index.html` file.
- FIPI topic references checked on 2026-11-06:
  https://doc.fipi.ru/navigator-podgotovki/navigator-ege/2026/Mat_baz_1_Chisla.pdf
  and https://doc.fipi.ru/navigator-podgotovki/navigator-ege/2026/Mat_prof_1.pdf.
  The exercises are original school-style practice, not copied official exam
  questions. No unstable exam task numbering is asserted.
- Production reconciliation: base contains PR457, merged 2026-11-05 UTC, after
  the already published PR456/458. GitHub release evidence and live behavior
  are reconciled in PROJECT_STATUS within this task, not in a separate PR.

## Approved scope

### In scope

- One isolated course at `trainers/college-logarithms/`.
- 6 prerequisite questions; 12 teaching modules of 6 exercises; 12 basic-level
  and 12 profile short-answer exercises: 102 in total.
- The 12 teaching modules: meaning; definition/domain; product/quotient;
  powers/identities; change of base; increasing graph; decreasing graph;
  translations/reflection; equations by definition; equal logarithms;
  equations using properties; simple inequalities.
- Large task-first interface, green actions, retained steps, contextual hints,
  fraction bars, accessible graph and number-line controls, local progress.
- Graph construction by points and controlled transformations. The assessment
  module does not reveal hints or mark inequality tasks as profile test items.
- Shared-board state adapter, registration/picker and public catalog entry;
  course metadata, sitemap; scoped tests and CI.

### Out of scope / files that must not change

- Server protocol, server authorization, shared bridge implementation and
  personal-result schemas. No new learner account or private course assignment.
- Other courses' mathematics or learner records; external AI providers.
- Merge, auto-merge and deployment: the owner's instructions supplied in this
  conversation explicitly require separate authorization. This narrower limit
  overrides the repository's standing publication policy for this task.

## Acceptance criteria

- [x] Exactly 102 correct exercises with a deliberate rise in difficulty.
- [x] Domain conditions, rejected roots and interval endpoints are checked.
- [x] Graphs respect x>h, base restrictions, shifts and decreasing bases.
- [x] Hints never erase work; opening theory counts as assistance; independent
      work is distinguished from helped/repeated work.
- [x] Task, current step, drafts, hints, errors and graph controls synchronize.
- [x] Late joining/reload and teacher/student control handoff work with native
      browser events. Remote state does not echo.
- [x] Board mode does not read/write personal progress or award homework credit.
- [x] Untrusted or impossible shared state is rejected atomically.
- [x] No horizontal overflow at 320×900 and 1280×900; the current problem and
      graph/action remain visible before long secondary content.
- [x] Catalog, picker, registry and sitemap agree on the new course route.

## Checks and gates

- Required tests: independent bank mathematics, numeric/interval parsing,
  learner journeys, adapter validation and real local Socket.IO transport;
  existing registry/college regressions.
- Required static checks: JS syntax, sitemap/SEO checks, `git diff --check`.
- Manual/browser checks: native Chromium clicks and inputs in two actual board
  windows; graph controls; control transfer; late join/reload; mobile screenshots.
- Final preparation gate: `COLLEGE_LOGARITHMS_READY` only when the specified
  local checks pass and CI results are recorded. No live gate before release.
- Not run: external provider consultation/review, real-pupil lesson and production
  publication until separately authorized. These are never recorded as passes.

## Review plan

- MEDIUM: bounded new content and adapter within the existing board architecture;
  no shared runtime, protocol, authentication or server-persistence change.
- Learning design was independently reviewed before implementation: prerequisites,
  small steps, misconception feedback, domain checks and graph/inequality links.
- Ready-result review: independent mathematics and adapter review, then learner
  journeys, native browser behavior and scope/diff inspection.
- External consultation: not performed; not requested for this task. No external
  provider approval is claimed or copied from another task.
- Remote handoffs contain only scoped public code and fictional math examples.
  No private learner identity, credentials or machine-specific paths are committed.

## Risk and rollback

- Main risks: incorrect domain/inequality checks, misleading graph scale,
  hidden assistance, lost drafts, first-event lag, stale live board registry.
- Rollback: ordinary revert of this isolated course and its registration/catalog
  entries; no deletion or modification of existing learner data.
- Compatibility: version 1.0.0, semantic state schema 1 and bridge protocol 1.
  The eventual release must verify the deployed server registry as well as Pages.

## Permissions

- START: yes, current conversation.
- Branch, local commits, push and Draft PR: yes.
- Merge, auto-merge and deployment: no; separate owner authorization required.
- Force/reset/rebase/admin override/TLS bypass: not authorized.

## Execution record

- The initial clone had an unrelated checkout temporary file. It was left intact;
  a separate worktree was created at the verified base and confirmed clean before
  implementation. No user files were removed.
- Actual base: `8448ccecff1334cfa4e404c6040f855f2bb258e5`.
- Completed: 102 exercises, 236 checked steps, 15 module groups; the 12 teaching
  modules are followed by two 12-question assessments. All 102 learner journeys
  and independent mathematical checks pass.
- Local combined test run: 319/319 PASS, including existing college-course and
  registry regressions. Native Chromium 134: 24/24 browser/real-board checks PASS.
  Board picker UX, 12 sitemap tests, sitemap freshness, SEO and syntax checks PASS.
- Additional legacy `B2_SMOKE_SECTION=roads`: FAIL before the changed registry
  expectation, on a click targeting the already hidden scenario chip. The roads
  course and that scenario code are unchanged. This broader legacy scenario is
  not claimed as passing; details are retained in the preparation report.
- Ready-result mathematical/application and adapter reviews found issues that
  were corrected and covered by regressions; no findings remain. These are
  internal independent agent reviews, not an external provider approval.
- A concurrent implementation was discovered in Draft
  [PR460](https://github.com/ladynata-cloud/math-exam-fipi/pull/460), head
  `d330ef529639f68a29930eb035642ed9618b39f6`, branch `feat/college-logarithms`.
  It contains 60 exercises and uses the same public URL, task path and trainer ID.
  Its publication permission belongs to its own task context and is not reused.
- The current task's completed 102-exercise implementation is preserved on its
  own authorized branch. A second PR is deliberately deferred pending the owner's
  choice of canonical implementation/consolidation, under the one-task/one-PR
  rule. No existing PR or branch was overwritten or closed.
- Authoritative main advanced to `6a3b51a6492da7c90a0c9353857174318088bd14`
  (PR429 and PR399). This task has not merged, rebased or reset its branch.
  No current-main composition or production-ready claim is made.
- Final preparation marker `COLLEGE_LOGARITHMS_READY` is not issued: local
  gates pass, but a canonical PR decision and candidate CI remain outstanding.
- Execution details and the bounded comparison are in
  [the preparation report](../reports/COLLEGE_LOGARITHMS_PREPARATION.md).
- Scope deviation: no implementation expansion; Draft PR creation deferred to
  avoid conflicting implementations of the same route. Merge/deploy remain
  outside the current permission boundary.

## Required handoff

```text
EXECUTIVE STATUS

Task:
PR:
Base:
Head:
Gate:
Tests:
Failures:
Not run:
Scope deviations:
Recommendation:
Next user decision:
```
