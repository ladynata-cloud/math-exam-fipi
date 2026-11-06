# Open the assigned grade-10 Merzlyak course on the teacher’s board

## Identity and goal

- Task: ASSIGNED_MERZLYAK_BOARD_20261106; 2026-11-06.
- Owner: repository owner; START covers implementation, verification, push and a Draft PR.
- Base: main at 8d7fdd8c984a83213b1b4fddea371efc2a7f8c25.
- Branch: fix/assigned-merzlyak-board-20261106. Review: HIGH (teacher/pupil role and shared-room boundary).
- Source: the existing board adapter published in PR #314 and the current multi-course program.
  Registry B1/B2 are implemented; ADR 0001 remains Proposed.

## Problem and scope

A teacher can open the registered course directly on the board, but the assigned-program
card does not offer the board action that the older focus-based course card already has.
Provide the action for this specific course. Tell the teacher how to create a room
and the pupil which link joins the same room. A generic board link cannot open a
teacher’s existing room. Independent practice and shared-room work are separate.

## Acceptance and verification

1. In the teacher’s student card and read-only pupil preview, open the exact registered
   trainer using the existing cabinet-return wrapper, without starting a pupil attempt.
2. On the pupil’s program routes, distinguish the teacher’s invite from a separate board.
   Another assigned course or stale focus note must not select this trainer.
3. Verify the full production-shaped flow with two isolated browsers and a local
   Socket.IO room: assigned card, reload, create/join, visible task 2.19, draft in both
   directions, hand off control, return to the exact teacher card. Check SQLite and
   browser storage for unwanted changes and public requests for identity leakage.
4. Retain existing registry, cabinet and board gates. Use synthetic profiles in all
   automated tests. Independent technical review and exact results belong in the Draft PR.

## Evidence and limits

A separate two-role exercise on the published site confirmed shared task selection,
answer feedback, the requested hint and step after reconnect, and rotation of the
parallelepiped in exercise 3.1. No real pupil account was used to perform work.
An active invitation must come from the teacher’s room; the ordinary course page
is still individual practice. No personal links, screenshots or identifiers are
part of the repository handoff.

## Boundaries and rollback

Only the assigned-program UI, the registered public board destination, cabinet
cache keys, the focused test/workflow and status note change. No lesson content,
course engine, shared-state schema, room server, account records, enrolments or
credit policy change. Individual course authoring and learning-state work have
a separate specification. Revert this change to remove the new entry point;
the existing public trainer and private saved work remain usable.

## Handoff

Stop after the Draft PR; merge and deployment require separate explicit owner
authorization. Before any authorized merge, check the current remote main SHA against
the authorized base as required by the owner. No force, rebase or admin overrides.
