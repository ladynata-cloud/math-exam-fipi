# Preserve a model while reading the lesson

## Identity
- Task: equation model collapse/reopen preservation.
- Owner: MathExam; explicit overnight implementation scope, 9 November 2026 (Asia/Novosibirsk).
- Base: main `f9fa7ae93d2237c0b850b64a541f2ac0bfb3e3c3`.
- Branch: `fix/equation-model-collapse-20261109`.
- Review level: MEDIUM, bounded existing interaction with no storage or mathematical contract change.
- Related ADR: no new archetype or architecture; existing model remains authoritative.

## Goal and evidence
On `/equations/#linear`, subtracting the constant changed `2x + 4 = 10` to `2x = 6`. Collapsing and reopening “Исследовать на модели” recreated the initial equation and disabled undo. The current app called `model(t)` on every open toggle. The graph probe was recreated in the same way. This interrupts the learner's prediction, transformation and explanation while reading the lesson.

## Approved scope
Initialize the existing balance/graph once per current rendered exercise. Closing and reopening its details retains transformations, undo history, selected operation and graph probe. A new rendered exercise still initializes a new model. Keep the connected-element guard against queued events from detached details. Root agent owns publication.

Out of scope: persistence over reload, changes to storage, new mathematics, pilot lessons, percentages, shared-board protocols, claims of measured learning effectiveness.

## Acceptance
- Balance operation and enabled undo survive closing/reopening the current model.
- Undo still restores the preceding equality.
- A graph probe survives closing/reopening.
- A new task starts a fresh model and disabled undo; detached prior details cannot initialize it.
- Existing learner state, help accounting and all fifteen lessons remain valid.

## Checks and review
- `node --test tools/equations/resume.test.cjs` (including two new DOM regressions).
- `node tools/equations/check.cjs` and `node tools/equations/regression.cjs`.
- `node tools/equations/browser.cjs` and `node tools/equations/resume.browser.cjs` in actual Chromium through the existing equations-resume workflow; production variant verifies exact public app bytes first.
- `node --check equations/app.js`, `git diff --check`, focused independent code review.
- External provider audit not performed/not required under standing owner policy.
- Real learners not observed; tests establish behavior, not pedagogical efficacy.

## Risk and rollback
Only a closure-scoped initialization flag is added. The closure is recreated with the lesson render, so no model is shared across tasks. Revert this package as one ordinary commit if a regression occurs; no data migration or deletion is needed.

## Permissions
Owner START and overnight scope authorize this bounded improvement and publication after checks, under [standing authorization](../OWNER_RELEASE_AUTHORIZATION.md). Ordinary branch/PR/merge permitted; no fresh owner confirmation required. No force/reset/rebase/admin bypass or weakening gates.

## Execution record
Local verification passed: 16 saved-work DOM tests (including balance/graph collapse regressions), 7,500 generated mathematical conditions, 858 exact transformations, syntax and `git diff --check`. Actual Chromium and production: pending CI/release, not yet claimed; local Chromium launch is blocked by the container socket permission. Independent focused review by `/root/ready_review`: PASS on app SHA256 `40037767c22e93f539e89997e494fff77bdc7d0c84bcf08504a1c9dd72a052ce`, with 16 DOM, 7,500 mathematical and 858 exact-transformation checks repeated. The graph browser regression uses real ArrowRight input (40 increments of 0.1), not unsupported range filling. README now distinguishes collapse preservation from new-render/reload reset. Source change limited to app handler; workflow reused unchanged.
