# Атанасян 10–11: условие и модель на первом экране

## Identity and authorization

- Date: 2026-11-05, Asia/Novosibirsk.
- Task: ATANASYAN_MOBILE_LAYOUT; review level: MEDIUM (bounded layout and DOM order).
- Base: main, 0d96ad84f0dd9dcadf123b3845db75c5476be93a, PR439 published.
- Branch: codex/atanasyan-mobile-layout.
- Owner explicitly requested implementation, browser/mathematical regression and publication in this conversation. Branch, commits, push, Draft PR, controlled squash and deployment are authorized by this request and [standing policy](../OWNER_RELEASE_AUTHORIZATION.md).

## Goal and approved scope

Prioritize the complete condition and readable geometry model at 320, 390 and
1280 CSS pixels. Collapse secondary bibliography while retaining exact book,
edition, chapter/paragraph, printed and PDF pages. Use the existing engine and
viewer. Keep large mathematical text/labels, rotation, expansion, step history,
source access, saved work and catalog navigation. Cover all twelve cards404–413
and previous introduction, parallelism, perpendicularity, polyhedra, cylinder,
cone, sphere, theory, self-check and the longest previous condition.

Only the textbook engine, scoped CSS, its navigation markup, a focused browser
gate/workflow and task/status evidence are in scope. No lesson content, answer,
model coordinate, storage contract, shared viewer or other course is changed.
No new architecture or ADR is required.

## Acceptance and verification

- Initial viewport measurements record both width and height, scroll position,
  complete prompt/model bounds, text size, controls, help and source disclosure.
- Primary viewports: 320×900, 390×844, 1280×900; short-phone limitations also
  measured at 320×568 and 390×664, without shrinking content to force a fit.
- No page overflow or clipped mathematical labels; models remain at least
  360px high and 250px wide; condition at least20px and labels at least19px.
- Full source disclosure opens and closes. Every sampled card rotates, expands,
  returns to prior steps, retains all steps/drafts on reload and returns to catalog.
- Existing content/math/model/runtime gates and full applicable CI remain intact.
- Post-release test verifies exact deployed HTML/CSS/engine/bundle SHA256 bytes,
  repeats viewport and interaction checks, and records actual dimensions.
- Gate: ATANASYAN_MOBILE_LAYOUT_OK; failures and not-run checks remain explicit.

## Review, risk and rollback

Self-review of layout semantics, responsive reading order, keyboard access,
source identity and exact diff; existing mathematical and browser regressions.
External provider audit and real-pupil/physical-device testing are not performed
under standing policy. Main risk is a long condition needing scroll on a short
phone; report measured exceptions. Other course CSS imports must remain unaffected
by the new engine-specific root class. Rollback: ordinary revert of this release
and established Pages deployment; saved work and lesson revisions are untouched.

## Execution record

Local source-label and runtime gates pass. Browser installation in the local
runner returned an invalid download archive; browser verification therefore runs
in GitHub Actions. Detailed candidate, CI, screenshot inspection, dimensions and
release evidence are recorded in the PR, without claiming pending checks passed.
