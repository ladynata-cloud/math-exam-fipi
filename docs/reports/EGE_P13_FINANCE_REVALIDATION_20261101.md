# PR390 release revalidation — 2026-11-01

- New base: `3918c1645709fc8e7a92f026646d6e42fe0d6712`.
- Previously tested head: `6172fc5b439becd303aeac4559d4e8a9d7419c71`.
- Owner authorizes compatibility work and ordinary branch integration; external
  Claude remains waived. Separate production authorization remains pending.

## Concurrent changes and composition

GitHub metadata confirms three merged PRs since the original base:
PR391 source provenance (`37718f1c`), PR393 public showcase (`2a9e70be`),
and PR395 grade-six LCM/navigation (`3918c164`). The current owner's provided
history records their release decisions. No unknown main commit was included.
`git merge-tree` found exactly one conflict: docs/PROJECT_STATUS.md.
Both sides' status records are retained, with a current reconciliation above.
No runtime conflict occurred. Existing main learning/courses/board-server/
assistant-service files are byte-identical; finance state.js and applied-data.js
are unchanged. No real pupil account, answer, draft or progress was accessed.

## Bounded follow-up

The only product change relative to the old finance head is one source-link
caption: “проект демоверсии ЕГЭ-2027”. A new test requires draft labels on
2027 finance links, year labels on historical links, and the existing explicit
warning that historical models do not establish mandatory 2027 task types.
All financial task objects, solutions and models remain unchanged.
CI additionally retains the existing finance viewport screenshots as an artifact.

## Repeated checks

- `node --test tools/profile-*.test.cjs`: 273 PASS, 0 fail, 0 skipped.
- Focused finance checks: 10 PASS, including exact rational cash-flow oracles,
  78 answers, 442 steps, ledger cells, earned-value boundaries, integer/kopeck
  precision, original 18-object snapshot and resumed state.
- `npm --prefix ege-profil test`: PASS, including 7,600 generated geometry
  cases with zero discrepancies.
- `git diff --check`: PASS.
- Local browser run: BLOCKED before navigation, Chromium socket permission
  failure in this execution environment. No browser test assertion was changed.
  Exact-new-head CI must supply repeated 320×900 / 1280×900 finance journeys,
  full-course, help, board and remaining browser regression evidence.
- Initial local dependency failure: jsdom was absent; installing the pinned
  jsdom/playwright dependencies allowed the complete unit suite above to pass.
- No live bank completeness, current approval of 2027 official documents,
  physical device testing or production publication is claimed.

## Release gate

Exact integration head, CI outcomes and screenshot inspection are recorded in
PR390 after publication of this commit. Until they pass, release is not ready.
After success, request a separate owner squash-merge/publication decision for
this base and new head, requery main immediately before release and verify the
actual published assets. Existing rollback is a bounded authorized revert,
without a storage migration.
