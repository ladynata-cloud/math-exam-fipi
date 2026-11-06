# Проценты из курса Виленкина на общей доске

- Date: 2026-11-06, Asia/Novosibirsk.
- Base: main `370fbe7af674d46ff0c8cb2c2d6de28992c4dfc3`.
- Branch: `feat/vilenkin6-percent-board-20261106`.
- Review: MEDIUM, one bounded adapter using the existing board SDK/registry.
- Owner scope: «подключи задачи на проценты к доске», following the request to solve the pupil's existing textbook tasks together.
- Implementation and publication authorized by the direct request and [standing owner decision](../OWNER_RELEASE_AUTHORIZATION.md). No further publication approval required. External audit not requested/performed.

## Goal and scope

Open the exact eight tasks from textbook point 2 in the existing shared board. Reuse `units-A.json` and `TextbookMath`; retain all source task IDs, statements, answers and eighteen steps. Synchronize task choice, modes, answers, checked steps, errors, hints after two mistakes, rules and shared notes. Add direct board links to the eight existing cabinet cards and a board picker entry.

The new trainer uses the established bridge envelope and registry admission. Server protocol, authentication, room permissions, database, saved pupil attempts, other chapters and multi-number LCM/GCD are unchanged. Board practice does not award independent-work results. A new room starts with fresh shared work. Existing board room state supports reconnect/reload while the room exists.

## Acceptance and checks

- All eight source tasks and eighteen steps pass independent arithmetic checks.
- Teacher and pupil see equal state and visible answers after typing, mistakes, hints, checking, navigation and control transfer.
- Reload restores shared work and board ink; no personal progress keys/learning API writes.
- Cabinet links preserve exact task selection without creating attempts or exposing identity.
- Widths 320/390/1280 have no horizontal overflow and show the condition in the first screen.
- Core, cabinet DOM, exact registry, transport, SDK and browser regression tests pass.
- Final gate: `VILENKIN6_PERCENT_BOARD_OK`.

## Risks and rollback

Both public static assets and the Amvera registry must be deployed before claiming shared availability. A stale server registry is a release blocker for live synchronization, even if Pages is current. Rollback is a revert of this task's adapter/entry links and registration, with no learner-data deletion/migration. Public questions are fetched from the same source file as the cabinet; no copied bank to drift.

## Execution record

Results, exact head/PR, main drift, deployment and live checks are recorded in the PR. Preparation in this document is not evidence of a production release.
