# MathExam task: animated course entrance help

## Identity and goal
- Date: 2026-11-09 (Asia/Novosibirsk).
- Owner: Наталья Михайловна.
- Base: main, 30e1af62a4ac5fe9717b51a080ca9d7f5e0169af.
- Branch: feat/oge-course-start-guide-20261109.
- Review: MEDIUM; bounded optional navigation help, no persistence changes.
- Owner START: «Давай реализуем это на курсе подготовке к ОГЭ» after the proposal for start/resume animations.

Help a learner identify the current topic and the actual start/continue button in the existing OGE course. The animation runs on the real interface, keeps text sharp at mobile widths and can be paused, replayed or closed.

## Context and scope
The current course at trainers/oge-course/index.html already has seven lines and a read-only progress map. oge/learning-map-view.js recommends a topic and saves a separate navigation cursor only on real link clicks. Continuation returns to a topic, not a guaranteed exact exercise. This is the current implementation baseline, irrespective of older project-status entries about preparing the map.

In scope: two optional help buttons, a compact inline guide, finite pointer/highlight animation on the existing CTA, truthful empty/resume copy, reduced-motion/manual steps, keyboard/touch support, relevant regression and browser checks, exact source binding refresh.

Out of scope: results, course recommendation algorithms, storage keys, mathematics, trainers, cabinet/server integration, unrelated courses and the OGE marketing landing page. The demonstration must not navigate or dispatch a real link click.

## Acceptance and checks
- A new learner sees how to start; a returning learner sees their actual topic.
- Empty or blocked storage does not invent a saved lesson.
- Help itself never writes/deletes results or navigation state.
- Pause, replay, close, Escape and a finite ending work; no automatic opening.
- Reduced motion shows manually controlled steps with no moving pointer.
- Existing real links and no-JavaScript fallback remain usable.
- Targeted DOM regressions, existing OGE map/entrance regressions, navigator preservation/binding checks, syntax and diff checks.
- Chromium CI: desktop/mobile layouts, keyboard, guide controls, real navigation, continuation and no-JavaScript routes. Supported local preview for visual inspection where available.
- Gate: OGE_COURSE_GUIDE_OK.

## Review and rollback
Focused independent review of interaction, labels, accessibility and data preservation. External provider audit is not requested; no real-pupil effectiveness study is claimed. This does not introduce a new trainer archetype.

Risk: the guide could obscure the CTA, misdescribe continuation or change keyboard order. Mitigation: real DOM targets, inline layout, explicit mobile/keyboard scenarios and storage preservation tests. Rollback: revert this isolated PR; no data migration or cleanup required.

## Permissions and release
Branch, local commits, push and Draft PR are authorized by the current task. Publication after applicable checks is authorized by [standing owner policy](../OWNER_RELEASE_AUTHORIZATION.md). No force, reset, rebase, admin override or weakened gate. Requery authoritative main/head before merge; inspect and validate any concurrent composition, then verify deployment and public files.

## Execution
Exact base/head, review results, passes/failures/not-run checks and release evidence are recorded in the task PR. Repository project status was read; its older OGE preparation descriptions are superseded for this task by current main code and the published map's release record.
## Continuation, 9 November 2026

EXECUTIVE STATUS

Task: OGE_COURSE_GUIDE_20261109
PR: #505; local continuation not uploaded
Base: 463d6bf
Head: source da058b75, navigator binding 23d7f780
Gate: local PASS; updated remote CI pending
Tests: 22 OGE guide/map tests, 4 navigator preservation tests, 5 binding tests; syntax and diff checks PASS
Failures: no local functional test failures; automatic approval review rejected branch upload twice
Not run: final-head CI/browser/production checks; external review and pupil pilot
Scope deviations: none; instructional source files remain identical to reviewed PR head f9439729
Recommendation: push existing task branch after explicit approval, complete CI and publish
Next user decision: explicit authorization to upload and release after successful checks, as requested by automatic approval review

Authorized base: standing owner policy
Actual current main at composition: 463d6bf
Base drift detected: yes, published EGE basic/profile and OGE root/anchor fixes
Authorization valid/invalid: standing policy applies; automatic execution approval blocked external write
Virtual merge result: only navigator receipt conflicted; retained main history and rebound the single course entrance
Rerun gates: all 31 local tests passed
New owner authorization required: requested by automatic approval review
Merge/deployment: not performed

## Explicit release approval received

On 9 November 2026 the owner explicitly authorized uploading the prepared
changes to ladynata-cloud/math-exam-fipi, merging checked PRs and publishing
on mathexam.space after successful checks. Previous execution-approval holds
above are historical. Actual-head CI and controlled production verification
remain required. Authenticated GitHub integration is used because Git CLI
write credentials are unavailable.
