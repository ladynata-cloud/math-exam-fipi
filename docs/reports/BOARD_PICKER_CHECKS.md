# Board trainer picker checks

EXECUTIVE STATUS

Task: easier trainer selection and usable mobile embedding, review level MEDIUM.
PR: none created by this executor; local handoff only.
Base: `a325f74909fd3ba322089702a8954bcfd300e5cb`.
Head: the local commit containing this report; exact commit/tree supplied in the handoff.
Gate: PASS on the final implementation.

## Delivered behavior

- Searchable catalogue of 376 unique existing trainer pages, with EGE basic first, section filters and recent history.
- Manual links and teacher-only `?trainer=` entry; rejection of non-HTTP(S), credential-bearing and recursive board links.
- Loading status, 404 retry, embedding-denied feedback and a separate-page link. Cross-origin embedding that cannot be diagnosed is described as uncertain.
- Expand/restore without iframe reload; at 360px width the embedded trainer has a 500px frame and a compact header.
- Existing board storage keys, drawings, bridge, registry/ACL contracts and the compatibility manifest are preserved. Picker metadata makes no mirror authorization claims.

## Tests

- `node tools/board-picker-smoke.cjs`: `BOARD_PICKER_UX_OK`, 376 catalogue paths unique and present; search, recent/manual history, unsafe links, teacher/student query behavior, loading, 404 recovery, denied embedding, 500px mobile frame, expansion and drawing persistence passed. No production room writes.
- `node tools/trainer-registry-client-cutover-smoke.cjs`: full `TRAINER_REGISTRY_B2_BROWSER_REGRESSION_OK`. All default sections ran: path and registry matrices, arrival orders, fail-closed behavior, reconnect, live teacher/student and roads-grid standalone/conformance/collaboration.
- The fail-closed section also passed separately while checking iframe request behavior.
- `node --check` passed for the picker and both test scripts. `git diff --check` passed.
- A 360px screenshot was inspected for the compact header, visible controls, catalogue and frame placement.

Browser: local Chromium through Playwright. Full collaboration tests used a local server with isolated scratch dependencies (`express@4.21.2`, `cors@2.8.5`, `socket.io@4.8.1`, `socket.io-client@4.8.1`); no repository dependency files changed.

## Failures found and resolved

- The first full run could not use the old quick selector while its new details section was collapsed. The desktop quick list now stays open; mobile uses the new catalogue.
- The next full run found a baseline-stale assertion: the test expected 12 compatibility entries (and 13 selector options), while the unchanged base manifest already contained 32 entries. With explicit coordinator authorization, replaced fixed counts with exact served/local manifest equality, unique IDs and paths, existing in-repository files, and exact selector/manifest path equality. The exact three mirror IDs and every existing content and teacher/student check remain. The final full run passed.

## Limits and handoff

Not run: production room creation, deployment, or exhaustive interactive validation of all 376 embedded trainers. Browser policy can prevent complete diagnosis of cross-origin pages; the separate-page action remains available.

Scope deviation: the explicitly approved stale assertion repair in the existing integration test. No backend, bridge, manifest schema, ACL or global-rule change.

Rollback: revert this scoped commit. Recent-history data uses its own optional key and requires no drawing migration.

Recommendation: integrate the reviewed local commit and add newly published course links through the coordinator's separate integration work. No external Claude review is claimed.
Next user decision: none needed for this local handoff; no push, PR, merge or deployment performed here.
