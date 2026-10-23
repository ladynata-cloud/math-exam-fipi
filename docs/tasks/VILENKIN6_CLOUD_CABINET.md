# Vilenkin 6 part 1 in the cloud cabinet

## Identity and scope

- Date: 2026-10-24 (Asia/Novosibirsk).
- Base: `main`, `1f9d8aec82bd2909917ab22746d94571d87c59c4`.
- Branch: `feat/vilenkin6-cloud-cabinet`.
- Review: HIGH, because the existing account persistence boundary gains a course.
- Owner request: create a grade-six pupil cabinet, attach the already published
  Vilenkin part-one course and synchronize the work in the cloud.
- This is an integration with the existing managed-learning architecture, not
  a new account service or a change to the classical board protocol.

## Verified starting point

The public course has 27 modules, 81 examples and 475 authored tasks. Its
standalone progress is browser-local. The existing cabinet uses authenticated
same-origin requests, durable SQLite, versioned actions, controller permissions,
teacher observation and credential-free trainer frames. Motion grade six is the
implemented per-lesson reference. Canonical course data is unchanged.

## Implementation

- Register all 27 modules, `vilenkin6-part1:lesson-0` through `lesson-26`.
- Keep each module in a separate saved attempt, including drafts, completed
  steps, assistance, checkpoint results, model controls and owned textbook notes.
- Preserve standalone browser data; managed mode must neither read nor write it.
- Validate canonical source and module ownership server-side; recheck mathematics
  and checkpoint scores, keep fixed-bank repeats distinct from new independent work.
- Reuse the current origin/channel handshake, read-only state, account ownership,
  conflict handling and durable storage. Do not increase the generic 64 KiB cap.
- Make note and answer budgets visible; reject an oversized edit without silently
  deleting text or claiming it has been saved.
- Add a grade-six course direction and a cabinet course/route for all modules;
  preserve other profiles and migrate existing profile constraints atomically.
- Include the bounded course contracts/data in the production container.

## Acceptance and checks

- Course source and standalone retained-work checks still pass.
- All 27 registered modules validate and evaluate their original authored tasks.
- Managed state restores drafts, hints, models, notes and the current screen;
  invalid origins, channels, modules, data and read-only changes fail closed.
- Persistence tests cover reopen, controller handoff, duplicate operations,
  conflicts, peer isolation, account migration and honest repeat credit.
- Cabinet route tests cover all modules, assignment selection, resume and account
  isolation, with no attempt creation merely from viewing the course.
- Full backend tests, relevant existing cabinet checks, focused DOM tests,
  deterministic offline bundle and `git diff --check` are required.
- Synthetic tests do not establish a real-pupil pilot or production verification.
- Final gate: `VILENKIN6_CLOUD_CABINET_OK`.

## Review, release and rollback

Independent code review is required. No new teaching sequence or authored
mathematics is introduced, so a new design consultation is not needed. Exact-head
external release review remains required by policy. The known Anthropic balance
failure is unresolved; no further paid retry, approval or standing waiver is
inferred. Record the final exception decision separately if the owner makes one.

The current user request authorizes implementation and publication. Real pupil
records and credentials belong only in the private cabinet, never in this
repository, tests, logs or review payloads. The browser's automatic approval
review blocked account creation as a new persistent access grant; that operation
is pending action-time owner confirmation and must not be retried indirectly.

Rollback is a forward compatibility patch: disable the new course entry and
assignment UI while retaining the expanded profile enum, migration, Vilenkin
decoder, catalog and container data. Preserve the SQLite file and existing work.
The old server cannot open the expanded constraint or interpret new attempts;
therefore a raw old-image rollback is unsafe. Never downgrade a live database or
delete student work automatically. A backup restore that discards later work
requires a separate data-loss decision. The atomic migration and compatibility
rollback are covered by synthetic storage tests. No production backup has been
performed or claimed by this task.

## Execution record

Implementation is complete. Local final checks: 299/299 backend tests; 11 V6
contract/persistence tests included in that total; 8 cabinet DOM tests; 5 actual
bridge protocol tests; managed 108 views, 27 models and 16 scenarios; standalone
108 views, 27 models and 80 controls; content/catalog/preparation checks and
`git diff --check`. The offline bundle is regenerated deterministically.

The first full backend run exposed a missing course directory in the container
fixture and its old inventory counts. The fixture now mirrors the scoped Docker
copy, preserves the previous 244 non-geometry entries and verifies the exact 27
new module IDs. The final complete run passed 299/299.

Independent code review is complete with no remaining blocking finding. DOM,
message-bus and synthetic SQLite tests are not live browser/two-device evidence.
The current production service reports healthy durable storage, but no new
production cabinet, assignment, backup, synchronized attempt, merge or deployment
is claimed. Exact-head CI, PR identity and owner decisions are recorded in the PR.

The first exact-head CI run also found an old geometry integration assertion
that assumed no additional catalog families. It is updated to preserve the
original 217 identities separately and require exactly the 27 V6 module IDs.
