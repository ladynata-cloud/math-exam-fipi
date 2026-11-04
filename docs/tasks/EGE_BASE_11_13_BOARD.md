# Latest basic EGE: positions 11 and 13 on the shared board

## Identity and authorization

- Task: EGE_BASE_11_13_BOARD
- Date: 2026-10-25 (Asia/Novosibirsk)
- Base: main at `aa048f28d9797bca5468169a0f703b21dee1b4cd`
- Branch: `fix/ege-base-11-13-board`
- Review level: MEDIUM, bounded adapters within the existing board protocol.
- Owner request: inspect positions 11 and 13 of the latest basic EGE course,
  verify current content and shared-board behavior, and prepare two pupil
  cabinets with the corresponding synchronized trainers. The follow-up
  explicitly requires using the most recently updated course.
- Implementation, tests, logical commits and Draft PR are within that request.
  Merge and deployment remain subject to the separate authorization required
  by AGENTS.md and the release workflow.

## Verified baseline

The current course is `/ege-baza/path/`, using the task-first presentation
published in PR #295 on 2026-10-22. It contains 107 EGE families; positions 11
and 13 have 5 and 7 respectively. The legacy `/trainers/ege-baza/course/` is
the first foundational module, not the full latest course.

Before this task, the board picker could open these lessons, but there was no
registered shared-board adapter. `learning-bridge.js` and `managed.js` provide
another learning-session integration, not classic board mirroring. No initial
stereometric diagram was rendered by `PathTaskFirst.primaryVisual`.

The official FIPI project-2027 retains the structure of basic mathematics:
https://fipi.ru/ege/demoversii-specifikacii-kodifikatory
https://doc.fipi.ru/ege/demoversii-specifikacii-kodifikatory/2027/Plan_izmeneniya_KIM_EGE_2027.pdf
https://doc.fipi.ru/ege/demoversii-specifikacii-kodifikatory/2027/ma_11_2027.zip

Both positions concern stereometry. Current families include water displacement,
pouring between cylinders, glued bodies, cone similarity, lateral surfaces and
box diagonals. The two-cube surface exercise is simpler than the stepped solid
in the demonstration; full FIPI subtype coverage is not claimed.

## Scope

- Reuse the existing latest task bank, task-first screen and model controllers.
- Add two registered board entry points and a strict, memory-only session
  adapter for the existing 12 families. Shared work must not read or overwrite
  personal course progress or claim independent success.
- Synchronize task, seed, final/step drafts, completed steps, feedback,
  disclosures and validated model state; support late join and reload.
- Add task-specific schematic drawings containing only given values; preserve
  mathematical answers, seeds and learning sequence. Correct the description
  of ten exposed source-cube squares versus six faces of the resulting box.
- Add fixed cabinet cards pointing to the latest course and the same board
  routes; preserve other attached courses and all pupil histories.
- Configure the requested real cabinets through the existing teacher UI.
  Pupil names, account identifiers and credentials never enter this repository.

Out of scope: authentication, server contracts, deployment configuration,
generic course conversion, new mathematical families, and unrelated courses.

## Review and checks

This is an integration and diagram correction, not a new learning archetype or
substantial redesign of the learning sequence. No paid design consultation is
required for the unchanged sequence. No Claude/Anthropic tool is exposed in
this session; no external Claude verdict is claimed.

Required: independent focused review; mathematical regression checks; existing
task-first retained-state checks; new schema/cabinet/diagram tests; real local
Socket.IO teacher/pupil sessions including late join, reload and control
transfer; board registry/picker regressions; syntax and whitespace checks.
Use synthetic accounts only in automation. Keep production inspection and
local test evidence explicitly separate.

## Risk and rollback

Main risks are stale remote UI, feedback loops, cross-course state acceptance,
misleading diagrams and accidental personal-progress changes. Closed state
validation and browser convergence tests address these risks. Rollback is a
normal revert of this scoped patch; no migration, account deletion or history
rewrite is needed. Existing profile focus text remains ordinary text if the
new card renderer is reverted.

## Execution record

- New adapter checks: 5/5 pass, including all twelve families, model roundtrip,
  independent final/step drafts, accepted steps, malformed state rejection,
  and the long-paste regression after a step field is recreated.
- Real local board + Socket.IO + Chromium: both wrappers, teacher/pupil
  convergence, all twelve family titles, late join, reload, control transfer,
  invalid-state rejection, quiet followers and no trainer personal-storage
  access pass at desktop and 390px widths.
- Diagram checks: 1008 cases pass. Twenty-four actual browser screenshots
  at 1280/390px have no overflow or JavaScript error; representative drawings
  were visually inspected and corrected.
- Existing mathematics: 6000 generated conditions, 75 expanded families and
  168 legacy cases pass. Existing task-first checks pass all 107 families,
  retained drafts/models, legacy stages, assistance accounting and exam flow.
- Cabinet checks: 26 cases pass across the new cards and existing Merzlyak and
  number-theory routes. Registry checks: 32/32 pass with exact 49-entry catalog
  and 20-mirror expectations. Picker browser regression passes 1454 entries.
- Independent focused review found and verified fixes for cache invalidation,
  a recreated field's input limit and stale outer board titles. No remaining
  code-level blocker. This is an independent agent review, not a Claude or
  external exact-head release verdict.
- The two requested production accounts were created using the teacher UI.
  The basic-EGE direction and both exact course references were saved and
  confirmed by the UI. New attached cards await deployment of this patch.
- No merge, deployment or production synchronized-room claim is made here.

### Release verification still required

After explicit owner release authorization, verify current main against the
authorized base, merge the reviewed patch, wait for Pages deployment, and
deploy the same reviewed application on Amvera. Its registry is loaded at
process startup; Pages alone does not activate new server-side mirror entries.
Verify the production registry exposes both entries, inspect both configured
cabinet cards, and perform a fresh two-endpoint live smoke.

The existing classic board has one pupil participant identity per room. Two
tabs using the same pupil link both receive that identity on control transfer.
Use a separate room for each pupil; the local late-join test does not claim
simultaneous independent editing by two pupils in one classic room.
