# Atanasyan: executable construction instructions and undo

- Owner: current request to recheck geometry-course, fix perpendicular construction, undo and unclear midpoint screen.
- Date: 2026-11-10 Asia/Novosibirsk.
- Base: main 82ed551bd6922eb4e84551ec8dbfdcc387a4e6d8.
- Branch: fix/geometry-manual-construction-undo.
- Review: HIGH (shared interaction across 63 standalone lessons).
- Release: standing OWNER_RELEASE_AUTHORIZATION after applicable exact-candidate checks.

## Scope and acceptance

Preserve course navigation, existing stored work and unrelated course files. Put concrete next actions, relevant tools and undo above the figure. A partial selection must undo before a completed construction. Reset must be undoable. Named baseline AB must be drawn. Circle intersections and reflected points must be visible/reachable; fit also supports older drawings. Midpoint readout shows the two halves; perpendicular readout shows its actual angle. Allow perpendicular through a baseline endpoint and keep it defined when the source reaches AB. Reject coincident lines as parallel. Empty coordinate inputs do not mean zero.

Review all 63 unit missions and claims. Correct bounded mathematical wording and circular prerequisite in the parallelogram area proof. Advanced topic-specific models remain limited; do not advertise complete replacement of all generic preparatory exercises. External provider review and real-pupil pilot not performed.

## Verification

- Existing geometry arithmetic/oracle suite; object-label and exact standalone binding tests.
- Added DOM/pointer regression suite covering all 63 missions and undo/error/degenerate cases.
- Full existing 63-lesson browser path plus dedicated pointer, reload and 320/1280 browser cases in CI.
- Local managed preview unavailable: another workspace preview is active. Do not interrupt another task or substitute a bypass.
- Independent technical/content review requested; findings and final verdict recorded in report/PR.
- Navigator source receipts refreshed only for the 63 changed standalone HTML pages, after source commit.

## Risk and rollback

No stored-work format migration or clearing. Existing drawings are retained verbatim on restore. New proof step IDs reset obsolete scaffold completion without changing writing or numeric progress. Roll back presentation/interaction code with an ordinary corrective commit; preserve learner drawings and compatibility. Browser CI and navigator preservation are required before merge.

## Helper follow-up

The owner additionally requested a new Claude brief and starting the contextual helper. It is a separate bounded task, reusing the existing assistant service and addressing fields/geometry; paid API activation is not implied. The course fixes remain necessary independently.

## PR #533 artifact-path follow-up — 2026-11-10

Owner scope: repair evidence upload on existing PR #533; do not merge or publish.
This later restriction overrides the release permission above for this task.
Review level for the bounded CI follow-up: SMALL; the original product scope remains HIGH.
Starting head: `d6a5fa6013b43054c9077989bcb4bea6047fbd12`.

Both browser checks use `GEOMETRY_EVIDENCE_DIR` in CI, pointing to
`artifacts/geometry-manual` inside the Actions workspace. Their existing local
fallback is preserved. All original mathematical, module and browser commands,
assertions and viewports remain mandatory and unchanged.

Before upload, require all 13 nonempty PNG screenshots and the exact successful
10-scenario `manual-results.json`. Upload only those explicit filenames plus
optional `browser-failure.png`; hidden files are excluded. Fresh browser contexts
use synthetic test answers. Browser profiles, progress exports, environment
files and raw logs are not uploaded. Mathematical and full-course browser
summaries remain in the CI log. Verify the downloaded Actions archive against
this allowlist and the current PR head. Rollback is an ordinary revert of this
bounded CI follow-up; no learner data or public course code is changed.

The PR currently conflicts with `main`. A push trigger restricted to this exact
PR branch runs the same checks at its current head without composing or merging
branches. Checkout uses the PR head for PR events and the pushed SHA for push
events. This workflow has read-only contents permission and no deployment step.
