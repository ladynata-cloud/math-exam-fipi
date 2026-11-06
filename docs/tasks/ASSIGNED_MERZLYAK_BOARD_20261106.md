# Open the assigned grade-10 Merzlyak course on the teacher’s board

## Identity and goal

- Task: ASSIGNED_MERZLYAK_BOARD_20261106; 2026-11-06.
- Owner: repository owner. On 2026-11-06, after the release review, the owner explicitly
  authorized updating PR #466 to the new base, fixing the selected-task reset and
  publishing after successful checks.
- Authorized continuation base: main at 5a9d2416a0e9eace137c20ebacd0293e1facc419.
  The original implementation used 8d7fdd8c984a83213b1b4fddea371efc2a7f8c25.
- Branch: fix/assigned-merzlyak-board-20261106. Review: HIGH (teacher/pupil role and shared-room boundary).
- Source: the existing board adapter published in PR #314 and the current multi-course program.
  Registry B1/B2 are implemented; ADR 0001 remains Proposed.

## Problem and scope

A teacher can open the registered course directly on the board, but the assigned-program
card does not offer the board action that the older focus-based course card already has.
Provide the action for this specific course. Tell the teacher how to create a room
and the pupil which link joins the same room. A generic board link cannot open a
teacher’s existing room. Independent practice and shared-room work are separate.

The release review reproduced an additional prerequisite: selecting an exercise before
creating a room loses the selection because the host seeds and reloads its iframe.
Preserve the current, validated Merzlyak lesson identity through that existing restart.
Keep the registered destination, other trainers' seed behavior and the normal room
hydration flow. Do not copy a child URL or private work into the invitation.

## Acceptance and verification

1. In the teacher’s student card and read-only pupil preview, open the exact registered
   trainer using the existing cabinet-return wrapper, without starting a pupil attempt.
2. On the pupil’s program routes, distinguish the teacher’s invite from a separate board.
   Another assigned course or stale focus note must not select this trainer.
3. Verify the full production-shaped flow with two isolated browsers and a local
   Socket.IO room: assigned card, reload, select task 2.19, create/join, the same task
   visible to both participants before another course click, draft in both directions,
   hand off control, return to the exact teacher card. Cover room creation after the
   pre-room hydration deadline as well. Check SQLite and
   browser storage for unwanted changes and public requests for identity leakage.
4. Retain existing registry, cabinet and board gates. Use synthetic profiles in all
   automated tests. Independent technical review and exact results belong in the Draft PR.
5. Check catalogue return, non-exercise lesson identities, invalid/unknown fragments,
   wrong or cross-origin frames, and unchanged behavior for other trainers. Preserve
   only a known lesson identity; do not transfer arbitrary pre-room answers or storage.
6. After merge, verify the published Pages resources and the actual Amvera cabinet
   build, then exercise the new entry, selected task, invitation and control handoff.
   Keep the existing persistent data volume and the pupil's current programme.

## Evidence and limits

A separate two-role exercise on the published site confirmed shared task selection,
answer feedback, the requested hint and step after reconnect, and rotation of the
parallelepiped in exercise 3.1. No real pupil account was used to perform work.
An active invitation must come from the teacher’s room; the ordinary course page
is still individual practice. No personal links, screenshots or identifiers are
part of the repository handoff.

## Boundaries and rollback

Only the assigned-program UI, the registered public board destination, cabinet
cache keys, Merzlyak lesson selection at room creation, the focused test/workflow and
status note change. No lesson content,
course engine, shared-state schema, room server, account records, enrolments or
credit policy change. Individual course authoring and learning-state work have
a separate specification. Revert this change to remove the new entry point;
the existing public trainer and private saved work remain usable.

## Handoff

The owner's explicit continuation authorizes the branch update, narrow task-selection
fix and publication after successful checks. Before merge, check the authoritative
current remote main SHA against the authorized continuation base. A further base
movement follows the owner-provided base-drift guard. No force, reset, rebase or admin
overrides; failed or unexecuted gates are not treated as passing.
