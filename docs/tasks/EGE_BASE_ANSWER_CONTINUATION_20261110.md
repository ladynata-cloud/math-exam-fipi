# Ясное продолжение после правильного ответа

## Identity and goal
- Task: EGE_BASE_ANSWER_CONTINUATION_20261110
- Owner: MathExam owner; date: 2026-11-10 Asia/Novosibirsk.
- Base: main, 049eeb943bc3df5e43dd4d643d76f3c3003d568e.
- Branch: fix/ege-base-answer-continuation; review level: MEDIUM.
- Scope is the owner's report that after a correct answer in the cylinder/cone/sphere trainer on the board it is unclear whether to return or continue. This is treated as a request to fix that bounded interaction, under the standing publication authorization.

## Verified evidence and scope
The shared task-first renderer offered continuation only when a journey was supplied. Board wrappers do not supply that journey, so their two buttons were «Другие числа» and «Выбрать задание». The optional help separated feedback from actions. The same renderer serves 111 public EGE-base families and the existing bounded board wrappers.

Show «Задача решена», an explicit next task or end-of-line destination, another example in the same topic, and the task list beside the successful answer, above help. Keep the result until a deliberate action. Repeated submission cannot add credit. Restore completion on reload. For board wrappers, use their own bounded LESSONS sequence and preserve editable shared answers, state validation, and zero personal-storage access.

Excluded: new task banks, marking rules, storage formats, synchronization protocols, room connectivity, managed cabinet controllers, OGE/profile trainers, and real student data. No claim to fix the screenshot's separate mirror-connection warning.

## Acceptance and learning review
- Correct answers expose a primary next action; errors and blank answers do not.
- Names distinguish another topic from another example of the current topic.
- No automatic transition; givens, answer, help and notes remain available.
- Last board family returns to its task list; last public family returns to its learning line. No silent wrap.
- Shared edited answers regain their uncompleted UI and reproduce identically after state transfer.
- Desktop and 320 px layouts keep actions readable without horizontal overflow.

MEDIUM: bounded presentation/context change within an existing renderer; no server, protocol, persistence schema, permissions, or deployment architecture changes. Focused source and learning review plus regression suites are required. External provider review was not requested or performed under the standing policy.

## Checks
Required: task-first 111-family DOM suite; journey contracts/DOM; EGE board roundtrips and bounded navigation; stereo figures; shared geometry regression; syntax/diff; existing task-first/board/browser CI for final head. Browser preview uses isolated local fixtures, never pupils' accounts. Full remote checks and publication evidence belong in the PR record.

## Risk and rollback
Main risks: stale completion after editing on the board, navigation escaping the selected family set, focus/overflow, and saved-result compatibility. Rollback is a normal scoped revert of the renderer, styles and context arguments. No data deletion or migration.

## Permissions
Requested scope authorizes implementation, checks, task branch, logical commit and Draft PR. Release uses [standing owner authorization](../OWNER_RELEASE_AUTHORIZATION.md): controlled merge after applicable checks and fresh main/head verification, then established Pages publication and live acceptance. No new owner decision required; no force, reset, rebase, bypass, or weakened gate.

## Execution record
Initial optional-catalogue fixture used a nonexistent lesson ID and was corrected to roundbody. An initial board regression revealed stale completion after editing; the implementation was corrected without weakening the test. A missing NODE_PATH caused a test startup failure, then was corrected. A preview configuration initially pointed at the repository root; a separate static QA copy corrected it without changing tracked hosting files. Final gate details, base/head and publication status are recorded in the PR.

Local final validation passed: 111 complete task-first paths with completion/reload/fallback assertions; 293 journey DOM checks; 16 journey contract tests; 6 EGE board tests including explicit next/last navigation; shared geometry and meaningful-attempt regressions (19 tests in the combined board/geometry/attempt run); 1008 stereo diagram checks; syntax and whitespace. CUA verified actual standalone and board-wrapper transitions plus a 320×900 iframe with all completion actions visible. Full automated viewport/browser matrix remains required in CI. No two-party live room or real pupil pilot was run.

Production reconciliation: the published task-first.js and board-session.js both returned HTTP 200 and matched the validated main baseline exactly. This fix is therefore still local at this checkpoint; no publication is claimed. Source review confirms task generation, marking, saved format and board-state schema remain unchanged; the wrapper supplies only bounded next-target and answer-editability options. The existing rejection of malformed state and zero-personal-storage checks remain intact.
