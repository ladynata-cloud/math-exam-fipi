# Refresh decimal-division assets after publication

## Identity and scope

- Date: 2026-10-09.
- Base: main, `0950fe33f6f4616dbe61fd11c133b0e334ed5834`.
- Branch: `fix/decimal-asset-version`.
- Review: SMALL, five asset-reference version changes in two HTML consumers.
- Standing owner publication authorization covers finishing the requested
  decimal-division release. This local handoff stops after a clean commit;
  the release owner independently reviews and publishes it.

## Context and goal

PR #212 merged as the base above with reviewed tree
`9a475f74f6137727b84f1cca94616a62426192ad`. Its exact-head checks and Pages
run `37886573202` passed. Cache-busted production assets matched reviewed
bytes, but a browser reload still used old CSS/JS because the consumer pages
retained their previous asset URLs.

Update those references to `v=20261009-decimal-goal` so returning learners
request the published explanation and borderless comma controls.

## Approved scope and acceptance

- In `trainers/arifmetika.html`, version `decimal-shift.css` and
  `decimal-shift.js`.
- In `trainers/oge-basics/multiplication-division/long-division-from-simple-to-decimals.html`,
  version `decimal-shift.css`, `decimal-shift.js` and `division-guided.js`.
- Reconcile `PROJECT_STATUS.md` and this task document only.
- Preserve all three asset contents byte for byte. No arithmetic, core,
  interaction, saved work, other asset references, accounts or server changes.
- Each changed URL must resolve to its existing local file, and the two
  consumer pages must still pass the existing decimal browser journeys.

## Checks and review

- Inspect the five-reference diff and validate paths and version identifiers.
- Confirm the three asset blobs equal the base commit.
- Run the existing decimal-shift browser suite, which exercises both trainers,
  keyboard, touch, linked shifts, saved work and multiplication return.
- `git diff --check`; local self-review. No new mirror test for mechanical URLs.
- Final marker: `DECIMAL_ASSET_VERSION_OK` after checks pass.
- External review is optional for SMALL; the release owner reviews the commit.

## Risk and rollback

Only URL query versions change. The asset path and its content are unchanged;
rollback is the isolated commit revert. Existing saved work needs no migration.
Production verification must reopen both ordinary consumer URLs and confirm
that the newly versioned assets are used, not just fetch cache-busted assets.

## Execution record

- GitHub API current `main` and fresh `git fetch origin main` both confirmed
  the authorized base above; no base drift or unrelated local changes.
- Five asset references updated; existing CSS and JS bytes untouched.
- Five version identifiers and local paths validated; reversing only those
  substitutions reproduces each base HTML file byte for byte. All three asset
  blobs match the base unchanged.
- Existing browser suite passed: both comma handles, six operand pairs,
  pointer capture, touch, keyboard, locking, 320/390px, retained guided draft
  and notebook, decimal completion and multiplication return in both trainers.
- `git diff --check` passed. Independent internal SMALL review approved the
  exact five-reference patch and scoped documentation with no blockers.
- Local gate: `DECIMAL_ASSET_VERSION_OK`. No publication by this task agent.
- Not run: a new arithmetic sweep or unrelated full-site tests, because all
  runtime and core contents are unchanged. No new tests added; no deviations.
