# Claude rounding before quotient estimation

## Identity and authorization

- Date: 2026-10-19 (Asia/Novosibirsk).
- Base: `main`, `cf3b55bdbb338ac27f7dfb4b14bf4fb824a3aecb` (published PR264).
- Branch: `feat/rounding-before-estimation`.
- Review level: MEDIUM; bounded navigation and existing trainer improvements.
- Owner requested the existing Claude rounding trainer before estimation, with
  tens, hundreds and larger places. The follow-up explicitly authorizes cloud
  completion and publication while the owner is away. This includes branch,
  commits, Draft PR, merge and deployment of this scoped change. No further
  permission prompt is required; repository base-drift checks still apply.

## Goal and evidence

The pupil can practise rounding separately before using it to choose a quotient
digit. The selected existing page is `trainers/rounding-stepwise.html`, identified
in prior conversation as Claude's trainer and verified as the page added by
merged PR36. Older `rounding*.html` versions are excluded.

The current trainer already has four visible steps and unlimited random tasks,
but only offers mixed easy/medium places and no thousands selection. Its binary
floating rounding misclassifies exact decimal halfway cases such as 1.005 to
hundredths. The current division route has 15 managed stages and multiplication
has 16; these existing IDs, contracts, saved work and progress stay unchanged.

## Scope

- Insert an explicit preparatory card immediately before estimation in both
  public and cabinet routes. Link the same trainer from estimation pages and
  cabinet support. Keep original work open in its tab.
- Extend the existing Claude page with an explicit place selector, tens through
  millions and existing decimal places; retain its four clickable steps.
- Keep next examples available indefinitely, avoid adjacent duplicate tasks,
  round decimal strings exactly, allow correction in the same example and keep
  the complete answer behind the explicit solution action.
- Preserve existing shared local statistics and other topics; damaged records
  or unavailable storage must not be overwritten or stop practice.
- Synchronize this trainer's downloadable HTML/ZIP only; update targeted checks,
  cache references and this task/status documentation.
- No new managed trainer, cabinet grade, mirror, backend, authentication,
  persistence schema, iframe permission or unrelated curriculum change.

## Acceptance and checks

- The visible rounding card precedes course estimation on both routes; it opens
  the selected stepwise page, never an older rounding trainer.
- All existing 31 managed route stages and 16/15 progress totals remain intact;
  the separate practice is not represented as saved cabinet work.
- Each supported place offers continuing varied examples. Correct half-up
  rounding includes 1.005 → 1.01, 9.995 → 10.00 and carry across whole places.
- Wrong answers remain editable; first hints do not disclose the final answer.
- Legacy shared statistics, unrelated topics and corrupt records are preserved.
- Targeted trainer/route DOM checks; existing route, support and arithmetic
  regression checks; relevant exact-head cloud workflows; `git diff --check`.
- Independent focused review before merge, then live public/cabinet assets and
  browser verification. Gate: `ROUNDING_BEFORE_ESTIMATION_OK`.
- External Claude review is not required for MEDIUM and is not claimed.

## Risk and rollback

The main risks are a link to the wrong legacy trainer, a broken return to the
original work, arithmetic carry errors and misleading progress. Tests target
these boundaries. Rollback is a normal reviewed revert of this scoped commit;
no data migration is needed. Never clear existing local statistics, weaken tests,
change server policy or edit real pupil attempts to validate this change.

## Execution record

- Focused local trainer checks: 10/10, including 297,000 decimal rounding cases
  against an independent BigInt oracle and 2,700 generated conditions across
  nine places and two number-size modes.
- New route checks: 8/8. Existing cabinet route: 15/15; public parallel route
  regression passes. Multiplication support DOM: 12/12; public continuation:
  8/8; multiplication support unit checks: 13/13.
- Practice inventory regenerated with the one new preparation: 119 linked URLs,
  120 including the hub, 17 implementation families; old 31 managed stages,
  77 supplements and 10 aliases are preserved.
- Downloadable HTML and ZIP contain the updated source without the download
  panel. The existing adaptation prompt is preserved.
- Cloud Chromium checks are wired into the existing pinned CI tools. Browser
  fixtures serve the reviewed repository bytes even for absolute public links;
  no production pupil account or work is used in the synthetic trials.

Exact head, PR, checks and final production evidence will be recorded in the
single task PR. Preceding production was verified as PR264; current task status
must not predict publication before deployment verification.
