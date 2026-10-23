# Grade 10 Merzlyak: cabinet entry and shared board

## Identity and goal

- Owner: repository owner; task started by the current direct request.
- Date: 2026-10-24 (Asia/Novosibirsk).
- Base: `main`, `1f9d8aec82bd2909917ab22746d94571d87c59c4` (PR #312).
- Branch: `feat/merzlyak10-cabinet-board`.
- Review: `MEDIUM`, bounded integration in existing cabinet and board behavior.
- Goal: attach the published Merzlyak grade 10 basic geometry course to a
  teacher-selected pupil's cabinet and mirror its existing interactions on
  the classic shared board. All development and verification run in the cloud.

## Evidence and scope

The published course contains 989 reviewed cards and 736 numbered exercises.
Authored content, source inventory, model geometry and review flags are unchanged.
The existing teacher interface creates accounts and persists a per-pupil focus
note. There is no grade-10 profile enum and no arbitrary managed-course assignment.
Recognize the exact canonical public course URL in that existing note, with a
prominent grade-10 course/board entry and accurate labels. Keep existing work
available; do not migrate accounts, roles, profiles, credentials or the database.
Real pupil information and credentials belong only to the private cabinet, never
to this repository, test fixtures, review material or CI artifacts.

Reuse the implemented Bridge v1/Registry B1/B2 contract and the PR #312 example.
ADR 0001 remains Proposed; code and tests establish the reused behavior.
The accepted unified-learning ADR's account and origin boundaries stay intact.
Register only `trainers/merzlyak-10-base.html`, ID `merzlyak-10-base`, version
1.0.0, state schema 1, bridge protocol 1, no seed or legacy HTML. The wrapper uses
memory-only course state, no cabinet credential, no personal storage or credit.
Mirror the selected card, draft, revealed steps/help, feedback, model view/camera,
catalog selection and bounded theory-return trail through semantic state. Reject
malformed snapshots before mutation, and restore without replaying user actions.

Include one registry/picker entry, exact canonical URL aliases, cache versions,
an entry link on the original course, focused contracts and real multi-participant
browser tests. Preserve other trainers and all ordinary standalone course behavior.
Do not change the board SDK, server protocol, authentication, hosting configuration,
curriculum, cloud attempt schemas or group-board behavior.

## Acceptance and checks

- Pupil home/course/route and teacher preview identify grade 10 and expose the
  exact course and board links only for the selected attachment; peers and
  existing work are isolated. Similar/foreign URLs cannot select the attachment.
- Exact course URLs and all 989 card hashes map to the registered wrapper;
  existing registry entries and literal-path authorization remain unchanged.
- Teacher/observer state and rendered work agree; grant/revoke, both-role reload,
  late join and the next interaction work without echo or personal-store writes.
- Preserve standalone runtime, source/math/content gates and existing board and
  cabinet regressions. Inspect the final diff and run `git diff --check`.
- New checks: `tools/merzlyak-cabinet.test.cjs`,
  `tools/merzlyak-board-picker.test.cjs`, adapter contract and real-board browser
  gate, plus existing focus-link, registry, profile board and course runtime checks.
- Final gate: `MERZLYAK10_CABINET_BOARD_OK`. Record exact-head Actions and any
  failed/not-run check in the PR; do not equate a prepared integration with release.

## Review, risk and rollback

Independent review covers state validation, quiet restoration, storage isolation,
cabinet selection and regression guarantees. No teaching sequence or trainer
interaction is redesigned: a new paid pedagogical consultation is not required
for this MEDIUM integration. The old content-consultation job should run only
when its authored-content inputs change; all existing technical gates remain.
No external reviewer approval is claimed.

Risks: missing transient state, asynchronous disclosure echo, stale model closures,
misleading cabinet labels and frontend/backend registry version mismatch. Revert
only the scoped integration through the release process, retaining accounts,
notes, existing work and the published course. No data migration is necessary.
Publication must verify exact frontend files and the ninth mirror in Amvera's
authoritative registry; Pages success alone does not establish synchronization.
Course answers retain the published browser storage behavior. Shared board work
does not become a personal cabinet attempt or independent success automatically.

## Permissions and execution

The current direct user instruction authorizes implementation, cloud account
setup through existing teacher controls, branch, commits, push and a Draft PR.
Under AGENTS.md and the release skill, merge and deployment of the resulting
code still require a separate owner decision for the concrete base/head after
review. Earlier course-release approval applies only to that earlier PR.

Local browser installation failed because the downloaded Chromium archive was
empty/truncated; do not repeat that download. Execute real-browser gates on
GitHub Actions and record their actual results. Private account setup is checked
in the authenticated cloud teacher UI; synthetic tests never use real pupil data.
Final test totals, head, PR, independent verdict and release status belong in
the accompanying PR execution record.

## Existing regression readiness repair

The first exact-head run and one unchanged-head retry both failed the existing
expressions board browser check at accepted guided-step input state. Its prior
wait observed a new hash and a form/task ID also present on the old screen,
while the runtime renders the new route asynchronously on `hashchange`.
Strengthen only that test to wait for the actual first guided step and matching
fresh session, then assert teacher acceptance before observer synchronization.
Keep every original observer/history assertion; add bounded synthetic failure
diagnostics and rethrow. No production expressions, SDK or protocol code changes.
Independent review approved this bounded validation repair. The readiness gap
is established by code; the cause of the two earlier failures remains unproven
until the amended gate runs. Preserve both failures in the PR record.
