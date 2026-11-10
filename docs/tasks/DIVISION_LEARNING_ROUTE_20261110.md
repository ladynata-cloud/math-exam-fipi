# Деление от первых шагов к самостоятельной работе

## Identity
- Date: 2026-11-10 (Asia/Novosibirsk).
- Base: main `d3d63656806551148b597045657c03d54eb65700`.
- Branch: `feat/division-learning-route`.
- Review: HIGH — coordinated learning flow, local saved progress and recovery links.

## Approved goal
The owner requested several increasingly difficult long-division trainers, the
existing Claude trainer and a divisor-multiples exercise; then explicitly asked
to rebuild division learning and connect basic-math exercises to subtraction,
column multiplication and multiplication-table practice when those skills block
the learner. This task is authorized to implement and publish that scope under
[standing permission](../OWNER_RELEASE_AUTHORIZATION.md).

## Design and scope
- Reuse current exact arithmetic planners and all existing public URLs.
- A visible division path connects meaning, choosing a digit, simple corner
  notation, carrying, zero, remainder, two-digit divisors and decimal division.
- Separate guided work, work with a multiples table, and an independent check.
- Show earned progress without treating a viewed answer as independent mastery.
- Provide explicit skill detours and preserve the exercise on return.
- Recover the verified final Claude source as a separate trainer; do not replace
  the current guided trainer or mutate the historical archive.
- Keep credentials, pupil accounts, board/server protocols and other courses
  outside this change. No paid provider or external review is requested.

## Acceptance and checks
- Useful links visible from basic arithmetic, division topic and trainer entries.
- All stage links resolve; existing URL/canonical and bank contracts preserved.
- Empty/wrong answers cannot advance; division arithmetic verified independently.
- Help, revealed results and repeats do not inflate independent progress.
- Started work survives supported detours; older standalone trainers keep the
  source tab open rather than claim unsupported restoration.
- Keyboard and 320/1280 px browser journeys, relevant existing DOM/math checks,
  source inventory, link checks, independent review and git diff --check.

## Risk and rollback
Main risks: mistaken source attribution, incorrect difficulty, saved-state loss,
false mastery and mobile clutter. Revert this task's release delta; leave old
and new local progress keys intact. New saved state must validate before use.

## Release
Requery main/head before merge and revalidate any drift. Publish by the existing
GitHub Pages workflow; verify deployed assets before claiming publication.
External provider review and real-pupil trials are not performed.

## Execution
The eight-stage route, progressive guided tasks, manually built multiples table,
Claude alternative, independent eight-problem check and skill detours are implemented.
The original Claude source is the 65,775-byte final June 5 upload
`long-division-stepwise (9).html` (Library `libfile_a3854539d8bc81918f5de663f47c7b7e`),
matched against the supplied Claude conversation. It is preserved as a separate
trainer and clearly describes its digit-selection scope.

Local checks passed: existing exact arithmetic (2,700 plans), progressive arithmetic
(9,450 plans), checkpoint arithmetic (8,000 problems), Claude plans (2,500 generated
plus 11,992 independent checks), saved-state/DOM checks, route links, offline HTML/ZIP,
existing URL contract and unchanged classroom bank, sitemap reproduction and SEO tests.
An independent agent reviewed arithmetic, restoration, help accounting and links;
its blocking findings were fixed and retested. No other model/provider review is claimed.

The local Chromium process cannot start because the environment refuses its socket;
no local browser/visual pass is claimed. The PR retains real Chromium checks at
320 and 1280 px, including return from support with the same task, step and draft.
The offline export report is `docs/reports/DIVISION_OFFLINE_EXPORT_20261110.md`.

Publication remains conditional on applicable CI and the main/head drift check.
No separate owner permission is pending.

## Concurrent source composition
Before opening the PR, main advanced to `69e09c78d84cef5a206dcc420ec08fcce46ec00f`: approved profile-course restoration, Alimov final-answer checking and OGE task 9 variety.
A read-only merge-tree check found only a navigator manifest conflict. An ordinary
merge preserved main's receipts and all course changes, added the three authored
division pages, and regenerated the combined sitemap. Teaching source had no conflicts.
Source bindings will be refreshed only against the exact committed composed source.

## First CI feedback
PR #542 on `47b567bc6d2eb2836e125287f778cca3156d5ab4` exposed missing self-canonical
metadata on ten old course wrappers newly made reachable by this route. Exact
HTTPS self-canonicals were added without changing exercises. The topic entrance
opens multiples mode on the current/default skill; the full route keeps its explicit
two-digit practice link. `tools/seo-check.py` now passes all 580 sitemap canonicals
and 214 topic links. No gate or checker was weakened. Existing meaningful attempts,
column multiplication and standalone-help checks also passed (56 tests).
