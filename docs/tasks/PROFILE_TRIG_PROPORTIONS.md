# Cross multiplication in right-triangle explanations

## Identity and goal

- Owner: course owner; date: 2026-10-10.
- Base: main, `f9a9a3607312dab4bbfd6e85d2e28d93822d3e9c`.
- Branch: `fix/profile-trig-proportions`; review: MEDIUM.
- Existing scope: the three gradual right-triangle explanations; no new trainer
  architecture or account behavior.

The owner requests cross multiplication whenever both sides are fractions,
with the product containing the unknown on the left, followed by the elementary
unknown-factor rule. The provided screenshot identifies the former cosine
step 3 as the explanation to replace.

## Approved scope

- Preserve steps 1/2 and the original ratio check in step 5.
- Step 3 writes the decimal as its unsimplified ordinary fraction, shows the
  two fractions with a visible cross, and places the unknown-factor product
  on the left. Use side names, without introducing another variable.
- Apply the owner's follow-up: extreme terms and their diagonal are red;
  mean terms and their diagonal are grey. State the familiar equality of
  extreme and mean products explicitly, with redundant words and line styles.
- Step 4 evaluates the known product and explains division by the known factor.
  Examples: hypotenuse times 8 = 120; cathetus times 100 = 700;
  cathetus times 10 = 150. Derive every value from current task metadata.
- Preserve five gradually revealed steps, retained history, assistance tracking,
  original task/draft and answer behavior; refresh changed asset versions.
- Adapt the existing metadata and learner-robot checks to the revised method.
- Reconcile verified publication of PR #225 in project status.

Excluded: other modules, new tasks, task answers/banks, authentication, server,
storage contracts, actual pupil records, dependencies and test frameworks.

## Acceptance and gates

- The two fractions and diagonal products are mathematically equivalent.
- Unknown stays on the left for both numerator and denominator cases.
- Unknown-factor rule and arithmetic are explicit, correct and metadata-driven.
- Fraction bars and cross remain readable at 360/1280, with a whole-equation
  accessible label. Information is not conveyed by colour alone.
- Existing first-help timing, five retained steps, keyboard, draft/reload and
  assisted-work classification remain intact.
- Required: geometry models, independent models, six triangle-browser journeys,
  syntax, git diff --check, visual review and full exact-head profile CI.
- No unrelated cabinet/server suite is needed for this scoped teaching change.

## Review, risk and rollback

MEDIUM: changed teaching sequence inside the existing explanation component.
Independent focused source and mathematical review; no external review required.
Risks: reversed diagonal pairs, accidental hardcoded arithmetic, narrow-screen
layout and early answer exposure. Existing checks cover these risks.
Rollback the three frontend files and their asset versions; preserve saved work.
Only public code and synthetic fixtures enter remote review.

## Permissions and execution

The current correction and standing cloud-publication instruction authorize
implementation, commits, Draft PR and publication after required checks. Active
developer guidance preserves this authorization across turns. Verify current
main and the reviewed tree before release; no force/reset/rebase, weakened gate,
security bypass or real pupil-data mutations are in scope.

## Execution record

- Geometry models: 36/36 passed. Independent models: 8/8 passed. Triangle
  learner robot: six journeys passed at widths 360/1280, all three types.
- Robot verifies both fraction parts, two visible opposite diagonals, exact
  red extreme and grey mean pairs, solid/dashed lines, the mnemonic, correct
  cross products and unknown-factor division. Six final screenshots inspected.
- Existing no-early-answer, assistance-before-DOM, five retained steps,
  keyboard focus, draft/reload and honest mastery-credit checks remain intact.
- Initial test assertions expected a separate known-product equation in step 4;
  the requested implementation correctly retains the unknown on the left.
  Corrected those test oracles to the intended unknown-left equality, retaining
  exact factors and computed products. Both suites then passed, and passed
  again after the owner's red/grey follow-up. No runtime defect was found.
- JavaScript syntax and git diff --check passed. Focused mathematical/source
  and mobile/desktop visual review found no blockers. Final committed-tree
  binding, exact-head CI and live publication verification remain release gates.
- No new test file/workflow/dependency and no real pupil account or data changes.
