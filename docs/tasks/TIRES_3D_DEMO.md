# Tire dimensions: rotating 3D discovery model

## Identity

- Task: TIRES_3D_DEMO
- Owner: MathExam owner, current conversation
- Date: 2026-10-21
- Base branch: main
- Base SHA: 9f9638ab1a8728eb72e190825b665bc34cf43abe
- Planned branch: feat/tires-3d-release
- Review level: MEDIUM
- Related issue or ADR: bounded replacement of the existing tire discovery illustration; no new platform contract or trainer archetype

## Goal

A learner can rotate a wheel, see that tire width runs along its axle, distinguish this from the radial profile height and rim diameter, and understand how the marking changes the physical dimensions. The model remains optional help on the current task.

## Context and evidence

The current `wheel` / `wheel-compare` helpers in `practical-discovery.js` draw two concentric circles. Their width slider affects calculated radial profile height but draws no axial width. The user's supplied screenshot confirms the misleading front-only view. The existing eight engines, scoring and drafts are covered by frozen-engine and discovery regression gates. The project status still describes the recent land lab work; its helper is already present at this verified base. This task does not rewrite that status or claim an unverified release.

## Approved scope

### In scope

- A self-contained mathematically scaled 3D tire/rim mesh, projected from vertices and depth sorted, with no external library or CDN.
- A three-quarter initial view, pointer/touch rotation, keyboard rotation, and front / tread / three-quarter presets.
- Highlight actual axial sidewall-to-sidewall width B, radial profile height H, rim diameter d in mm/inches and full diameter D; retain radius where existing help uses it.
- Sliders for B, profile percentage p and rim inches d; explicit units and relationships H = Bp/100 and D = 25.4d + 2H.
- Apply the same correct model to wheel comparison help and identify/retire misleading analogous helper diagrams without changing original grading engines.
- Preserve experiment state, answer drafts and progress. Opening/rotating help awards no credit.
- Focused geometry, DOM and cloud-browser tests at 320px, 360px and desktop; offline asset compatibility where the tire route exposes it.

### Out of scope

- A new paid lead capture flow, billing, account or cabinet migration.
- Other storylines or their training sequence, answer generation or grading.
- A paid Claude call: the owner explicitly deferred Claude API usage.

### Files or areas that must not change

Original inline task engines and fixtures, answer keys, persisted learner schema and authentication/deployment configuration.

## Acceptance criteria

- [x] Width endpoints differ by B millimetres only along the axle; profile H is radial and distinct.
- [x] Rim diameter is 25.4d mm and full diameter is 25.4d + 2H.
- [x] Changing each marking control changes the corresponding 3D geometry (numerical/DOM and rendered SVG checks; real browser confirmation remains below).
- [ ] Rotation and presets work with pointer, touch and keyboard; the initial view reveals width.
- [x] Selected dimension stays within the SVG frame; front view explains why width projects to a point (rendered SVG and DOM checks; mobile browser confirmation remains below).
- [x] Help reopening preserves model and answer drafts; exploration changes no score/progress (DOM regression checks).
- [ ] No page overflow at 320px and 360px, no external runtime request required.
- [x] Existing eight-engine and discovery Node gates stay intact and pass.

## Checks and gates

- Required tests: numerical geometry invariants, projection/preset assertions, DOM interaction/state retention, existing practical regression suites, focused CI browser interaction/layout checks.
- Required static checks: syntax, links where changed, diff whitespace, original engine hashes.
- Manual checks: cloud screenshots at narrow and desktop sizes, dimension endpoints and visual depth.
- Final gate marker: TIRES_3D_DEMO_OK only after actual relevant gates pass.
- Browser execution: cloud CI/CUA only; no locally launched Playwright browser.

## Review plan

- MEDIUM rationale: a bounded optional illustration changes across a few frontend files; no scoring or persistence contracts change.
- Trainer consultation applicable: yes for the visual interaction redesign; paid Claude consultation is explicitly deferred by the owner, so it is not run and is not claimed as approval.
- Design decision: use true ring/cylinder geometry with axial width and radial profile, and allow direct comparison through controlled rotation; keep one action and one selected measurement visible.
- Ready-result review: independent mathematical/technical review plus screenshots and actual gate output. Real pupil testing remains a separate validation question.
- External review required: parent/owner release review; no paid provider call under this task.
- Sanitized handoff: scoped code, public geometry, test evidence only; no private screenshot bytes, secrets, pupil details or private records.

## Risk and rollback

- Main risks: incorrect depth ordering, visually ambiguous end-on width, small-screen label overlap, rotation state lost after helper rebuild.
- Rollback: revert only the scoped helper, its static assets and test/spec additions.
- Compatibility: keep native task inputs and storage unchanged. No auto-credit or answer insertion.

## Permissions

- START granted by current owner request: yes.
- Isolated task branch/file edits and tests: yes.
- Cloud publication authorized by owner in current conversation; parent coordinates release after review.
- Local commit, push, Draft PR, merge and deployment by this child agent: no; hand off the tested diff to parent first.
- Force/reset/rebase/admin override: no.

## Execution record

- Actual branch: feat/tires-3d-release
- Actual base SHA: 9f9638ab1a8728eb72e190825b665bc34cf43abe
- Actual head SHA: recorded in the release PR
- PR: created by root after the focused candidate handoff
- Tests passed: all 53 practical Node tests, including 6 new tire geometry/state/offline checks, independently rerun by reviewer; frozen original inline-engine checks included. Link checker: 33 pages, no broken links. JavaScript syntax and diff whitespace checks passed. SVG renderings reviewed in quarter/disc/tread views and at maximum controls, with a fixed common millimetre scale.
- Tests failed: no remaining failure. Development checks exposed a slanted profile endpoint and cropped maximum-width label; both corrected and regression assertions added. An offline no-CDN assertion initially mistook the SVG namespace URI for a network dependency; corrected to exclude that namespace only.
- Tests not run: paid Claude consultation deferred by owner; actual Chromium/touch/mobile layout checks pending cloud CI. New CI script covers 320px, 360px, desktop, rotation/presets, reopening/state, no credit and served offline archive (13 planned cases). The script rejects execution outside CI before loading Playwright.
- Independent review: task19_new_uploads reviewed mathematical endpoints, mesh and projection, SVG previews, browser script and packaged assets; no remaining mathematical/code blocker reported. Review explicitly does not claim a cloud browser or deployment pass.
- Release status: cloud release candidate; final TIRES_3D_DEMO_OK marker withheld until actual cloud browser checks pass.
- Scope deviations: none

## Release composition

The independent candidate was committed at 8646f04efdcc0df294111386454ce4298b5d641b on the earlier 6f4213 base. Root applied its scoped patch onto the verified Task19 release 9f9638a in a fresh worktree. The only overlapping file was the one-line download manifest: the candidate changed only its date to 2026-10-21, which Task19 already set. Its new textbook asset definitions were retained byte-for-byte. No runtime conflict, force, reset or rebase was needed.
