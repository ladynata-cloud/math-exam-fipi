# Independent integration review: Atanasyan captions and advanced grade 7

Reviewed: 2026-10-28. Reviewer: independent OpenAI regression/source reviewer, non-author of the builder, runtime captions, board-adapter compatibility change, model-file scanner and focused browser diagnostic reviewed here.

Published comparison base: `fa8d1b7ced31a5941ad52d8a21a48b63daaa84a8`.

Verdict: PASS for the scoped code and hashes below. Open code findings: none. This record does not approve mathematical material outside its stated preservation comparison, replace the independent advanced source reviews, certify a completed full browser run, or authorize merge/deployment.

## Scope and independence

The review covers the separate `7-advanced` build path, source/model identity matching, publication-manifest isolation, runtime caption and paragraph presentation, the caption compatibility fix in the fixed task-92а board adapter, model-file discovery, and the new focused drawing-diagnostic option. It also checks that CI retains the full browser gate by default.

The reviewer authored the caption expectation helper, most preservation/regression tests, and the small title-expectation substitutions in `browser_check.js`. Those changes are **not independently approved by this record**. The browser review concerns the other author's section selection, diagnostic restrictions, evidence scope and unchanged default traversal. The preservation-test files and adapter test are included below only to identify the inspected seven-file binding amendment and executed regressions, not to imply independent review of their reviewer-authored implementation.

## Reviewed behavior

- The supplement reads only its dedicated preparation/model namespace. Its source range is checked for every number 413–461 exactly once, parts are nonempty and unique, and missing/duplicate/unmatched models fail composition. The result has 50 cards for 49 numbers. Numeric chapters I–V remain separate; the supplement is not chapter VI.
- The supplement uses its own content digest, `release-review-advanced-07.json` and `scope.key = 7-advanced`. Approval requires matching content and runtime hashes, all five review categories, reviewer and date. Missing or copied chapter-V approval cannot publish it. A supplement model edit invalidates its own approval without invalidating unchanged chapter content; a shared runtime edit invalidates every section.
- Captions use presentation functions without rewriting persisted lesson title, source, revision or ID. Chapter and paragraph captions use the explicit source inventory ranges. Chapter-wide review questions and additional exercises do not acquire a nearby paragraph by page inference. The advanced block has its own section caption and related chapter references.
- The legacy task-30 display is narrowly normalized from stored `1/2AB` / `1/4AB` to `AB/2` / `AB/4`, avoiding the incorrect denominator `2AB` / `4AB`. Stored labels and saved-work identity remain unchanged.
- The model scanner adds the new file namespace and reports unsupported filenames; the geometric validator is unchanged.
- `GEOMETRY_TEXTBOOK_FOCUS_SECTION=7-advanced` requires `GEOMETRY_TEXTBOOK_VIEWS_ONLY=1`. Unknown sections and contradictory modes fail. Focused evidence declares `scope: focused-advanced-drawing-diagnostic`, `focusSection`, and 50 inspected cards; its 755-card `lessons` value denotes the entire candidate, not inspected coverage. It emits the views-only success marker, never the full-browser marker.
- Without focused environment flags, traversal still covers all 755 lessons at widths 320 and 1280 and includes the existing interaction gates. CI supplies no focus/views-only flags. Changing the capture section changes saved review images, not which lessons the full gate checks.

## Finding closed during review

The initial caption implementation introduced `sourceInventory.paragraphs` as a display input without including that inventory in the review digest. A mutation in a temporary copy could therefore change a paragraph reference while preserving every section's reviewed status.

The builder now hashes `source-inventory.json` as a runtime input. After the adapter compatibility fix below, the amendment checker requires exactly the previous five inputs plus `source-inventory.json` and `assets/board-adapter.js`, verifies their current SHA-256 values, and permits only the independently indexed `paragraphs` addition to the original inventory. The companion actual-runtime digest uses the same seven inputs. Repeating the temporary mutation changed the runtime hash, retained the authored mathematics hash and invalidated approval for all five chapters and the supplement. The added mutation regression also passed. No synthetic approvals were written to production manifests.

## Board-adapter compatibility finding closed

The engine caption change initially left the fixed task-92а board adapter matching theory buttons against raw persisted titles. Buttons labelled “Почему? К пункту …” therefore could bypass the adapter's `data-theory-link` routing, losing the board-managed nested theory stack. The compatibility fix uses `engine.lessonTitle` consistently for matching, overlay titles and child links, passes the source inventory into the embedded engine, and uses the same source caption/location helpers in overlays. Both board and managed-work context notes now say “К задаче №92а”.

The diff does not alter board or learning registrations, content version, normalization, storage keys, state serialization, theory frame identities, supported routes, read-only guards or event protocol. Added paragraph context is a paragraph element and does not change the contract's indexed disclosure structure. The existing four-reference nested-dialog test and the new dynamically revealed justification regression exercise this behavior.

The complete nine-test JSDOM adapter suite passed against the final adapter hash below in a temporary fixture. That fixture used exactly the five actual reviewed lesson/catalog records (task 92а and theory points 14, 4, 1, 5) read from the published Git base, plus current paragraph metadata and current runtime files. Working-tree course data, production statuses and approval manifests were never rewritten for this check. It is isolated adapter compatibility evidence, not publication approval or a real-board browser run.

The new regression checks the displayed theory captions and paragraph references, the newly rendered step-1 link, nested 14 → 1 state, silent exact restoration, return navigation, retained draft/revealed steps and zero personal-storage access. A negative control restored only the old raw-title comparison in the temporary adapter; the regression then failed on the missing `data-theory-link`. The final adapter was restored and its SHA-256 recorded. Explicit board and managed context-caption assertions also passed.

A temporary runtime mutation now tests the adapter as well as the engine. Each edit independently invalidates all five chapter approvals and the supplement; the paragraph mutation test also passed with the seven-file digest. The preservation rule permits the adapter's reviewed caption delta while retaining exact mathematics/rendering/contracts and original teaching payloads.

## Executed checks and limits

Direct comparison against `git show` at the published base, independent of the new snapshot fixture, confirmed:

- All 705 previous authored lesson payloads and catalog payloads match exactly, with identical ordering and storage IDs. Only `status` and `review` were explicitly excluded because actual amended approval had not yet been issued at this checkpoint.
- All 44 previously published preparation/model files are byte-identical. Existing chapter authored-content hashes and book metadata are unchanged.
- Removing the added 19 paragraph entries yields the exact previous source inventory.
- The mathematics formatter, planar renderer, learning contracts and board/learning bridges retain their exact published bytes. The adapter itself has the explicitly reviewed caption compatibility delta described below.

Four targeted temporary-copy tests passed: paragraph edits invalidate every runtime review; the supplement cannot borrow chapter-V approval; supplement model edits invalidate only their section; runtime edits invalidate every section. These tests were executed as supporting evidence, not represented as an independent audit of the reviewer's own test implementation.

Five probes of the actual browser script's configuration prefix passed: default full-course/755, focused diagnostic/50, rejection without views-only, rejection of an unknown section, and rejection of combined interaction-only/views-only modes. The prefix probes intentionally did not launch a browser. Node syntax checks passed for `assets/engine.js` and `browser_check.js`.

Final reviewed-manifest preservation and a fresh full browser run remain separate release checks. Earlier focused drawing diagnostics must not be used as substitutes. The final bundle/model hashes may change as authors close rendered-image findings; this code review does not certify those later content bytes.

## Reviewed file hashes

| File | SHA-256 |
| --- | --- |
| `tools/geometry-textbook/build_course.py` | `c5c04cbc59fd553dc92f5c5a38168ae088ad4285b1cfb0b7c9a0a6bdb535a2ec` |
| `tools/geometry-textbook/check_models.py` | `6a2a4d9a32ee43cc01b54f6271da3a83272278b1b2bdcbd8e39f9dd6d359510a` |
| `tools/geometry-textbook/browser_check.js` | `edf2531242b07a73dd0b6302a0f99594128acb44bded288ebbafc73e2c2e9b11` |
| `geometry-course/textbook/assets/engine.js` | `85d395dbfb66f8a1409f1d2f930fbb6f742c0085239d34d18ec2a901f3bd6492` |
| `geometry-course/textbook/index.html` | `098ee5017758a8fb892af5da256cbc945ba4002cbfd82b1a0bcbd4c339f01804` |
| `geometry-course/textbook/source-inventory.json` | `e01036d2efaea5591e874b0669f8cbfba0ab8c9a67170042f78bb73efc9c10b6` |
| `tools/geometry-textbook/paragraph-source-map.json` | `481d77b01fd272a54e6dcc8b370b39779190582917893e1bfa13806ef34df2a6` |
| `.github/workflows/atanasyan-planimetry.yml` | `21fa20003bc279a944ad8f142d8b1fede28e28ef31b78874ed9dd1b95e9c9b0f` |
| `tools/geometry-textbook/published_preservation.py` (seven-file amendment only) | `c216eac758ab71dfccb5630109ed6b646850f7e7288378e18a1fda14a65f4693` |
| `tools/geometry-textbook/review_scope_test.py` (runtime/paragraph mutation execution only) | `43c366396b0dee3790534cf0b7c16709dd08763065dc5ce3ad4d22e5ead3d213` |
| `geometry-course/textbook/assets/board-adapter.js` | `e1c366fd77f2cc822894be7e21139ce99b9e7b3c568392b122f2a3b386b7545b` |
| `tools/atanasyan-board-adapter.test.cjs` (execution evidence only) | `643ccb7b95fab67debfa8f4976ad889fa79a907801f70144014b70f77434c796` |
