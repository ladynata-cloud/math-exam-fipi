# Atanasyan 7–9: first viewport, issue #384 / MAT-17

Base: `01e412d4314445366bcd4773a3789129aa7264bd`.
Review level: MEDIUM. Scope/start: the owner's current direct implementation
request. Release authorization: [standing policy](../OWNER_RELEASE_AUTHORIZATION.md).
External review not performed; no provider verdict claimed.

## Result and review

Only two production files change: `assets/engine.js` and `assets/style.css`.
The card keeps its complete title and condition, then displays the unchanged
SVG. Book/chapter/paragraph references and the permalink remain accessible in
the closed native bibliography disclosure below the figure. The two exact
generic instructional prompts move below the figure; any other mathematical
goal remains with the condition. Drawing controls follow the diagram.
The initial SVG is not clipped by its own 70vh container; requested zoom still
uses the previous inner scroll limit. Fullscreen, source references, navigation,
drafts, proof steps and feedback remain functional.

Every authored lesson, model, proof, source ID, revision and review record is
byte-identical to base, as are the entire course.json and old review receipts.
The exact reversible two-file presentation delta is recorded in
`tools/geometry-textbook/first-viewport-amendment.json`. Historical content gates
reconstruct only those exact bytes before validating their existing frozen
contracts. Unknown edits remain unnormalized and invalidate publication; all
old assertions and forgery tests remain. Current presentation bytes have their
own SHA256 map in the browser evidence. The bundle implementation identity is
the original content-reviewed snapshot, not a claim that the CSS is unchanged.

## Local evidence

- 26 source/model/runtime gate commands passed, including existing historical
 release/forgery checks, independent math probes, 1247-caption and 4370-checkpoint
 DOM review. The final layout amendment suite passes 5 positive/negative tests.
- All 1247 cards × 4 viewports = 4988 actual initial-view measurements passed.
 Viewports: 320×900, 390×844, 1280×900, 1440×900. Chromium 134.0.6998.35.
- 13 representative cards × 4 screens = 52 exact before/after comparisons;
 SVG width/height and condition font size match the original in every pair.
 Screenshots are full viewport captures at scrollY=0, never locator crops.
- Negative controls prove the gate rejects an oversized header, hidden condition
 and shrunken SVG. Original 694/722 failures are explicitly reproduced.
- Two mobile/desktop persistence scenarios passed: draft, 2 retained proof steps,
 assistance/camera fields, zoom scroll limit, fullscreen, bibliography and
 catalog return. Existing real-browser interaction gate: 20 scenarios passed,
 including theory navigation and stale-tab conflict preservation.
- Public baseline returns HTTP 200 and matches the base HTML/engine/CSS hashes.

| Card | Viewport | Condition top, before → after | SVG top, before → after | New SVG bottom |
| --- | --- | --- | --- | --- |
| main-694-part-1 | 320×900 | 566.11 → 182.98 | 922.06 → 286.75 | 509.62 |
| main-722-part-1 | 1280×900 | 489.17 → 123.38 | 737.11 → 204.73 | 816.34 |
| theory-73-part-1 | 320×900 | 789.23 → 361.39 | 1237.77 → 557.73 | 780.61 |
| main-44-part-1 | 320×900 | 538.06 → 182.98 | 1565.52 → 919.98 | 1119.98 |

Long conditions/givens remain fully present. If their actual combined content
exceeds one screen, the diagram immediately follows them (gap≤24px); scrolling
is necessary. This is not a claim that every long statement plus figure fits.
No real-pupil learning trial, Safari or Firefox validation was performed.

## Resolved test/setup failures

The first new harness used the wrong accessible zoom-button name and did not
clear a prior synthetic scenario before the second size. Both were corrected
without changing application behavior or assertions. Historical synthetic
fixtures initially copied amended assets after reconstruction; they now restore
only the exact old bytes before running their unchanged historical scenarios.
Modern Chromium download was unavailable locally; actual Chromium 134 headless
shell supplied local evidence. CI retains the existing pinned Playwright version
and full browser gates. These setup failures are not counted as passes.

## Release and rollback

CI and publication are pending at this commit; exact-head checks, fresh remote
base/head, controlled squash merge, Pages commit and public parity will be
recorded in the PR. Standing permission applies; no repeated owner approval.
Rollback: ordinary revert of this task's runtime/amendment/test change, with
no student-data migration or deletion.

EXECUTIVE STATUS

Task: First viewport for Atanasyan 7–9
PR: created after this local commit
Base: 01e412d4314445366bcd4773a3789129aa7264bd
Head: recorded in PR
Gate: local source/model/runtime and browser PASS; CI pending
Tests: 26 groups, 4988 viewport scenarios, 52 before/after pairs, 20 existing interactions
Failures: earlier harness/setup failures resolved; no remaining local failures
Not run: external audit, real-pupil trial, Safari/Firefox, publication at this commit
Scope deviations: none; historical binding adapted for the exact UI-only delta
Recommendation: publish after exact-head CI under standing authorization
Next user decision: none required
