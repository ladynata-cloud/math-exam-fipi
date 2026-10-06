# Written division: a visible notebook and decimal transitions

- Date: 2026-10-07 (Asia/Novosibirsk).
- Base: `main`, `74776f448a82aa220d08c1312e20ea314d571dac`.
- Branch: `feature/division-notebook-decimals`.
- Review: MEDIUM — bounded public trainer interface; existing planner and
  browser-local attempt contract are retained.

## Goal and evidence

The owner asked to recover the best previous long-division teaching experience
and make decimal division equally clear, as part of an OGE / PreOGE site.
`trainers/arifmetika.html` matches the described collection of arithmetic
operations: its division uses Russian school notation, column alignment and
decimal levels. The rich archived `long-division-stepwise-5-dab0dd89.html`
adds selection of the first partial dividend, an arch, quotient places and
visible bring-down guidance. Filenames alone do not prove Claude authorship.

The current `trainers/long-division-stepwise.html` is a different, reduced
version; it must not be mistaken for the rich archived trainer. The public
guided division page already has an exact planner covering decimal division.
Improve its teaching and presentation, preserving its tested arithmetic and
saved attempts, rather than replace it with the older arithmetic implementation.

## Scope

- Keep `long-division-from-simple-to-decimals.html` as the public route.
- Make selecting the first partial dividend an actual interaction, with a
  visible arch, keyboard alternative and no preselected correct answer.
- Show the one-digit bring-down with an arrow; retain the written solution.
- Explain equal multiplication of both operands, the quotient comma and
  appended zeros with earned, stepwise visual changes.
- Keep one current question, explicit continuation, optional help, mobile
  layout, topic progress and the manual teacher report.
- Preserve the existing action sequence, answers and local storage identity.
- Leave archived trainers, canonical managed teaching definitions, pupil
  accounts, classroom contracts and registry untouched.

Homepage and laboratory navigation are a separate approved branch and PR.
No sound, new authentication, backend migration or video generation is needed.

## Acceptance and verification

- Integer and decimal examples keep Russian long-division alignment, including
  internal quotient zeros and multiple appended zeros.
- A correct response is checked before it changes the notebook; the learner
  deliberately advances. A future result is not revealed in the preparation.
- Previous work, input drafts and completed results survive reload; a stale
  tab cannot overwrite another tab's newer attempt.
- First-digit selection, arithmetic input, hints, topic switching and reporting
  work with keyboard and touch on desktop and 320/390-pixel screens.
- Animation respects reduced-motion settings and requires no audio.
- Required gates: existing guided arithmetic and browser tests, focused new
  visual-interaction checks, unchanged managed-bank extraction, relevant CI,
  internal mathematics/UI review and `git diff --check`.
- Gate marker: `DIVISION_NOTEBOOK_DECIMALS_OK`.

## Risk, permissions and release

Main risks are a misplaced column or arrow, an answer disclosed too early,
decimal notation, inaccessible controls and an accidental saved-step change.
Rollback is a revert of this bounded PR. Do not delete local progress keys.

The current owner request authorizes implementation; her standing explicit
authorization covers publication and merge, with external review waived.
Internal checks remain. Recheck authoritative remote main, reviewed scope and
head before merge; if main advances, verify the composed patch and rerun its
affected gates without discarding concurrent changes. Verify deployed assets
and public-page behavior after publication. No external review is claimed.

## Execution

Local verification passed:

- 2,700 deterministic plans checked against independent exact rational
  arithmetic, action indices, zero/remainder/decimal edge cases and validation.
- All nine topic journeys passed on desktop and 320/390-pixel viewports,
  including hints, deliberate continuation, drafts, reload, report fallback,
  duplicate completion prevention, stale tabs and corrupt storage protection.
- The new focused notebook gate passed first-prefix selection by click and
  keyboard, a literal old v1 saved attempt, earned equal scaling, quotient
  commas, appended-zero equivalence, reduced motion and measured SVG arrow
  endpoints for `8 : 2,5` and `0,084 : 0,4`.
- Independent mathematics review found no incorrect supported division. The
  planner intentionally accepts short finite answers, up to four decimal
  places; no arbitrary-problem input is exposed in this page.
- Managed teaching-source bytes remain unchanged; the 35-trainer extracted
  teaching bank check passes. No pupil records were used in test fixtures.
- Internal code and screenshot review checked column alignment, visibility of
  accepted work, absence of prematurely disclosed answers and mobile layout.

Exact-head CI and publication evidence will be recorded in the PR. No external
review is claimed; the owner's waiver applies.
