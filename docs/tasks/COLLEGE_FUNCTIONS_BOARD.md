# College function graphs: shared board and selected learner course

## Identity

- Date: 2026-10-25.
- Base branch/commit: `main`, `741e9ce987cc9bdb452463d2d835632e5233c472`.
- Branch: `feat/college-functions-board`.
- Review: `MEDIUM`, a bounded adapter using the existing semantic bridge,
  runtime registry and teacher-selected course presentation. No new server
  protocol, authentication scheme or persistence contract.
- Source: the published college graph trainer from PR336 and the owner's
  current request to synchronize it with the board, then create a college
  learner cabinet and place this course there.

## Goal and authorized scope

Teacher and pupil see the same function, partial answers, retained stages,
plotted points, hints and feedback. They can hand control to each other and
continue after reload or late join. The selected learner receives the course
through the existing cabinet profile form after the public release is ready.

In scope: isolated college trainer adapter and early board-mode detection;
explicit semantic registry/picker entry; exact public-course URL attachment;
focused regression tests and CI; publication and live verification; creation
of the expressly requested learner and assignment via normal teacher UI.

Out of scope: other learners, parent access, shared bridge/server changes,
authorization settings, new data schemas, global cabinet defaults and changed
mathematical tasks or teaching sequence. No private learner identifiers,
credentials, room tokens or screenshots belong in the public repository.

## Acceptance and checks

- Current task and all visible work synchronize through the existing SDK.
- A room never imports or modifies standalone local progress, and joint work
  does not award individual independent credit.
- Late joins and reload hydrate from the room; remote apply produces no echo.
- Invalid/foreign/oversized semantic state is rejected atomically; displayed
  mathematics and completed summaries reconstruct from trusted course data.
- Explicit nested HTML route matches the server registry and board picker.
- Standalone 119-test behavior remains valid.
- Focused adapter/transport, registry and selected-course regression gates.
- Actual browser verification of the public board plus the selected cabinet.
- Final live gate: `COLLEGE_FUNCTIONS_BOARD_CABINET_OK` only after all live
  functionality and saved course placement are verified.

## Review and release

Independent internal review covers semantic validation, isolation, classroom
handoff, preservation of work and existing course behavior. This integration
uses existing patterns and does not redesign the lesson sequence. No external
Claude consultation or external release verdict is claimed.

Current owner instructions authorize the requested public-site integration and
the specifically named cabinet. Previous task permissions are not used to
expand scope. Recheck current main, exact head, checked tree and applicable CI
before normal merge. Do not weaken checks, force-push or change protections.
Record passed, failed and unavailable checks separately in the PR.

## Risk and rollback

Main risks: stale backend registry, partial input loss during hydration,
unwanted personal-progress changes and inconsistent graph/hint state. Gates
must test those boundaries explicitly. Registry availability must be verified
on the deployed board server, not inferred from a successful static deployment.

Rollback is a normal revert of this isolated adapter/registration/attachment
change. Preserve the original standalone trainer and existing learner records.
If necessary remove only this new course reference using the existing versioned
profile form; do not delete the learner or any saved work automatically.

## Execution record

Initial repository was clean and authoritative `main` matched the stated base.
The prior static release is verified and preserved. Exact commits, CI runs,
internal review findings and live deployment evidence are recorded in the PR.
Selected learner verification remains private and is reported to the owner.

Local final gate: 163/163 tests pass (119 original course tests, seven new
SDK/Socket.IO board tests, five cabinet tests and 32 registry/server tests).
Existing selected-course regressions also pass. Six sitemap tests, generated
sitemap check, SEO entrance/link check and `git diff --check` pass.

Independent internal review passed after correcting a board-mode next-task
cycle that initially alternated between the first two examples. All eight now
cycle in order. An independent reviewer roundtripped visible work for all 40
tasks, including incorrect table feedback, hints and marked points.

Local browser-picker smoke could not launch because this container has no
Chromium executable. No local browser was installed; the existing cloud CI
browser gates and actual cloud-browser release check supply this evidence.
This infrastructure limitation is not recorded as a product pass.
