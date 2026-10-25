# OGE 15–19: audited geometry practice on the shared board

## Identity

- Date: 2026-10-25 (Asia/Novosibirsk)
- Base: `main`, `aa048f28d9797bca5468169a0f703b21dee1b4cd`
- Branch: `feat/oge-15-19-board`
- Review: HIGH (five integrations and previously unpublished task-15 candidate)
- Related: existing Trainer Bridge/Registry implementation; ADR 0001 remains Proposed.

## Goal and current authorization

The owner requested checking the latest OGE tasks 15–19 against current exam
examples and teaching practice, making them work on the shared board, and
placing the checked trainers in the selected learner's cabinet, entirely in
the cloud. This is the task START and authorization for the requested final
publication after validation. It is not an external review verdict, account
credential authorization, or permission for unrelated releases.

## Evidence and scope

- The course currently points task 15 to one external-angle lesson. Tasks
  16–19 lack semantic board registration; opening an iframe is not mirroring.
- Reuse the frozen task-15 PR146 candidate with the separately preserved
  PR214 remediation, without merging either unrelated branch.
- Preserve existing task generators, banks and mathematical checking.
- Add bounded shared-practice adapters using the existing SDK and state schema;
  preserve task, draft, retained steps, feedback, requested help and model state.
- Keep shared-room state separate from personal statistics, cabinet attempts
  and independent-credit claims. Personal quizzes remain standalone.
- Fix the square/circle and trapezoid-midline help models where their geometry
  did not illustrate the requested relationship.
- Add registry entries, discoverability and fixed cabinet plan cards through
  the existing saved-plan mechanism. No authorization/storage migration.
- Check actual two-participant behavior, late join, reload and control transfer.
- Student identities, credentials, room tokens and private records are excluded
  from repository source, tests and review material.

## Official source check

FIPI still labels the materials as projects for 2027. Its change summary says
there are no changes for mathematics. The demonstrated examples are not a
statistical claim about frequencies in real exams.

- https://fipi.ru/oge/demoversii-specifikacii-kodifikatory
- https://doc.fipi.ru/oge/demoversii-specifikacii-kodifikatory/2027/ma_9_2027.zip
- https://doc.fipi.ru/oge/demoversii-specifikacii-kodifikatory/2027/Plan_izmeneniya_KIM_OGE_2027.pdf

Prototypes checked: triangle bisector/equal segments; square circumscribed
about a circle; diagonal dividing a trapezoid midline; grid distance; logical
geometric statements. Task 19 currently offers single-statement skill practice;
it must not be described as a complete three-statement exam simulator.

## Acceptance and checks

- [x] All five trainers register with semantic, validated state and no HTML fallback.
- [x] Invalid state is rejected atomically; remote apply does not echo.
- [x] Shared practice does not mutate personal learning progress.
- [x] Task selection, draft, help, steps, feedback and model state round-trip.
- [x] Existing mathematics and pertinent registry/cabinet regressions pass.
- [ ] Live shared-room behavior and deployed identity are verified.
- [ ] Selected cabinet plan is saved and checked in learner preview.

## Review and rollback

Independent mathematical, content and integration reviews are performed by
separate agents. External Claude credentials are not available in this runtime. The scoped CI
workflow attempts one bounded review through the existing repository secret;
no external advice or approval is asserted until a verifiable response arrives.
Any missing required external review remains a release blocker.

Rollback is a scoped ordinary revert of adapters, registration and presentation
links; no learner data migration or deletion. Existing personal work and other
trainers must remain intact. Never force, reset, rebase, disable TLS or weaken
gates to obtain a pass.

## Execution record

- Combined board/state/model/transport suite: 52/52 PASS. Actual local Socket.IO
  transports snapshots from all five real adapters; late join, grant/revoke,
  non-controller rejection and room isolation pass. DOM harnesses stub only SDK
  registration; they are not represented as a real-browser postMessage gate.
- Registry/actual HTTP/profile/cabinet regressions: 77/77 PASS.
- Task15: 26 types, 66 full guided journeys and 1320 independent geometric oracle
  cases; original generator/figure selftests retained.
- Tasks16–18: all 86 subtypes, archive samples, retained steps, malformed states,
  repeated feedback bounds, assistance and original mathematics gates pass.
- Task19: existing 83 checks passed; nine new board tests pass. All 234 card
  models round-trip; standalone help provenance and offline identity retained.
- Navigation 5/5 and SEO/sitemap 6/6 PASS; 521 canonical public URLs. Old external-
  angle lesson remains linked and all prior navigation destinations are retained.
- Independent OpenAI reviews fixed post-answer assistance label divergence, an
  immediate native-disclosure timing edge, bounded repeated feedback and exact
  disclosure/assistance validation. They are not external Claude approval.
- Earlier local failures: old fixed registry counts, outdated navigation lesson
  assertion, missing historical shallow-clone baseline and generated offline
  copy. These were resolved without removing assertions or weakening tests.
- Not run: new production shared rooms, real learner trial, physical tablet,
  production mobile layout. Cloud browser cannot reach this runtime's localhost.
  A local picker browser attempt stopped before launch because its Chromium
  executable was absent; no browser pass is claimed from that attempt.
- The selected cabinet is not present in the current teacher roster. Its legacy
  server returns an upstream connection timeout. No account, credential, other
  learner record or live plan was modified.
- Exact PR/base/head, CI/external review and any release evidence belong in the
  PR record. No production publication or selected-cabinet activation is claimed.
