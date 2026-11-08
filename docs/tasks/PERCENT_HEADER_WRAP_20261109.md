# Percent mode menu remains visible

## Identity
- Task: PERCENT_HEADER_WRAP_20261109
- Owner: MathExam owner; overnight approved implementation
- Date: 2026-11-09 Asia/Novosibirsk
- Base branch/SHA: main, 35b11556
- Planned branch: fix/percent-header-wrap-20261109
- Review level: MEDIUM
- ADR: no architecture change

## Goal and evidence
Actual Chromium screenshots from percent mini-check CI at 320 and 768 pixels show
clipped navigation after selecting a mode. `practical-minimal.js` wraps `.main-nav`
in native details inside `.nav-scroll`. The original max-content single-row nav
makes that outer scroll container scroll the summary too. Keeping the menu and
all five choices visible makes returning to the current exercise practical.

## Approved scope
Only percent-page scoped CSS, a dedicated Chromium regression/workflow, and this
specification. Wrap mode buttons and constrain the header menu. Preserve native
details and keyboard navigation. No engine, mathematics, assistance accounting,
storage, shared navigation script or floating navigator changes. Compose the
already reviewed mini-check resume PR before release; do not duplicate its edits.

## Acceptance criteria
- At 320/390/768/1280 widths, summary and all five open menu buttons remain fully
  within horizontal viewport bounds after every mode click.
- Outer header container has no horizontal overflow or scroll offset.
- Enter opens/closes the native summary; Tab reaches the first mode and Enter
  activates it. No force clicks or DOM state mutations in the browser fixture.
- Open/closed screenshots captured with completed CSS animations.
- Previously reviewed percent resume behavior remains passing after composition.
- Inline script bytes unchanged by this package.

## Checks and gates
- `node --test tools/percent-action-clarity.test.cjs tools/oge-practical-minimal.test.cjs`
- `node tools/percent-header.browser.cjs`, then `--production` after deployment
- Existing percent-check-resume workflow on the composed candidate
- Syntax, diff check, unchanged inline script comparison
- Gate: PERCENT_HEADER_BROWSER_PASS; PERCENT_HEADER_PRODUCTION_PASS only on live
- Local browser is unavailable due cloud sandbox socket restrictions; actual CI
  Chromium and screenshot review required. No real-learner effectiveness claim.

## Review plan
MEDIUM: bounded responsive interaction. Independent code/UX review requested from
another execution agent. No new teaching pattern or mathematical change; external
provider review not performed under standing owner policy. Parent release agent
records exact head, authoritative main, CI and production evidence.

## Risk and rollback
Risk: wrapping raises header height; inspect all four widths. Native details can
still collapse it. Roll back the CSS-only change with a normal reviewed revert
if necessary; no data migration or deletion. Existing mini-check runtime retained.

## Permissions
Owner's overnight START and standing [publication authorization](../OWNER_RELEASE_AUTHORIZATION.md)
cover this bounded existing-course UX correction. Branch/commit allowed. Parent
agent owns source bindings, PR, composition, merge and deployment after checks.
No separate owner decision or external audit is pending.

## Execution record
Branch and base as above. Local/CI outcomes and exact candidate hashes supplied
in handoff; do not treat a queued browser test as passed. No scope deviation.
