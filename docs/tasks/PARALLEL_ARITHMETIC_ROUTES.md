# Parallel multiplication and long division routes

- Date: 2026-10-19 (Asia/Novosibirsk)
- Base: main at 27369c058e9626f97a2041327bddf066e815d24d (published PR259)
- Branch: feat/parallel-arithmetic-routes
- Review: MEDIUM; reuse existing numeric action, validation, progress and mirror patterns.

## Owner request

Enlarge the small explanatory and answer-choice text; use «слишком мало»
when describing how many times to take a number; give multiplication and long
division separate parallel progress routes, including actual column multiplication.
The direct implementation request authorizes development and a Draft PR.
Publication requires the separate release decision specified in AGENTS.md.

## Scope

- Two visible vertical tracks with independent progress and next action; all
  steps remain available and neither track requires completion of the other.
- Reuse existing topics; place multiplication support in its own track.
- Add two column multiplication lessons using existing numeric step/state/check
  contracts: one-digit and two-digit multiplier, digit placement, carry,
  shifted partial rows and their addition, with previous entries kept visible.
- Preserve existing content IDs, canonical tasks, attempts, access rules and
  database schema. New lessons have separate IDs to preserve old saved work.
- Larger readable arithmetic typography, wrapping on narrow screens, corrected
  display-only choices while preserving saved choice IDs and answer values.
- Cabinet and public routes, return links and repeat practice agree.

## Acceptance and gates

- Independent track progress and continuation, fresh/resume, teacher entry,
  read-only and unavailable-history cases; old IDs remain discoverable.
- Column arithmetic against multiplication oracle across seeded cases,
  intermediate carry/zero/shift checks, browser-DOM actions and saved-state
  restoration; future digits do not appear before acceptance.
- Old canonical snapshots remain unchanged; existing division/continuation
  tests, catalog/reference, backend compatibility and SEO checks pass.
- Focused independent review; exact-head CI before publication.
- Gate marker: PARALLEL_ARITHMETIC_ROUTES_OK.

## Risks and rollback

Navigation could misclassify saved progress; tests use separate IDs and confirm
no cross-track completion. New column lessons use existing action persistence;
no learner data migration or automatic edits. A revert restores the prior UI;
retain the new lesson decoder if real attempts are created after publication.
