# Атанасян 7–9: условие и чертёж на первом экране

- Owner: Наталья Алябьева; requested 2026-11-02 Asia/Novosibirsk.
- Base: `main`, `01e412d4314445366bcd4773a3789129aa7264bd`.
- Branch: `fix/atanasyan-first-viewport-384`; review level: MEDIUM.
- Scope/start: current owner's instruction «Исправь расположение элементов…».
- References: GitHub #384, Linear MAT-17. ADR0006 remains Proposed.

## Goal and approved scope

Show the complete condition followed promptly by the unchanged mathematical
figure. Compact service navigation/title spacing; put bibliographic metadata
and the material permalink below the figure in a native closed disclosure.
Keep full titles, conditions, givens, mathematical goals, labels and all controls.
Move the generic learning prompt below the figure. Do not change authored
cards, source/revision IDs, proofs, answer checking, storage or student data.

## Verified starting point

Issue384 and MAT-17 remain open. Enumerated all418 remote branches and46 open
PRs; searched PR384 references and relevant title terms. Inspected the latest
source-provenance, compact-board-header and weekly-QA branches; they do not
contain this textbook-card fix. Main still renders service metadata ahead of
the condition. Historic release receipts bind runtime hashes; preserve their
provenance and validate any layout amendment separately without weakening
content/model or preservation gates.

## Acceptance and checks

- Short conditions and the entire initial SVG fit320×900 and1280×900;
  test390×844 and1440×900 too. Long conditions remain complete; the diagram
  immediately follows them with only its working controls in between.
- Compare actual bounding rectangles at scrollY=0, SVG painted geometry and
  label sizes, not merely visibility. Cover694,722, long titles/conditions,
  givens, fractions, all released cards and negative regression controls.
- Preserve drafts, checked/assisted state, revealed steps, zoom, fullscreen,
  theory return and catalog navigation in synthetic browser accounts.
- Existing source/model/runtime tests and required CI must pass.
- Capture comparable before/after viewport screenshots; inspect them visually.
- Final marker: ATANASYAN_FIRST_VIEWPORT_OK.

## Review, release and rollback

Focused technical/UI review and real Chromium evidence; external review not
performed under [standing owner policy](../OWNER_RELEASE_AUTHORIZATION.md).
No new trainer, learning-sequence architecture or external consultation.
Controlled squash-merge and established GitHub Pages publication authorized
after checks. Verify current remote base/head immediately before merge and
revalidate drift; verify merge tree/parent, deployed commit and public bytes.
Rollback is an ordinary revert of this task's layout/test amendment, preserving
all pupil storage and unchanged authored course data. No destructive actions,
force operations, private learner records or external messages are required.

## Execution record

Local implementation and validation complete; see [results](../reports/ATANASYAN_FIRST_VIEWPORT_384.md). Exact head, CI and production results will be recorded in the PR; missing checks are not passes.
