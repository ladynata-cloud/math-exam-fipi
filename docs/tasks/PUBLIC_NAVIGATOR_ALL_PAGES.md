# Public navigator across reachable learning pages

## Identity and authorization

- Owner: Наталья Михайловна; date: 6 November 2026.
- Task: `PUBLIC_NAVIGATOR_ALL_PAGES`; review level: MEDIUM.
- Branch: `feat/public-navigator-all-pages`.
- Preparation base: PR441 head `f9f3aae35e6f35efcf55b0fc5f70019c906d3245`.
- The owner requested completion of unfinished work and authorized publication,
  with external provider review waived. The coordinating agent owns exact-base
  reconciliation, merge and production release. This branch does not merge itself.

## Goal and evidence

A visitor can open the existing local MathExam navigator while using a public
course or trainer, including a direct visit from search. The existing helper
uses local catalogue rules and does not call a model service.

An actual browser crawl found 613 public HTML documents from the sitemap and
their rendered links. Source inspection identified 13 additional public
destinations reached through course buttons, lesson-specific prerequisites or
popup trainers; following their links added the river laboratory. All 627 routes
loaded locally. The inventory includes 550 of 551 sitemap routes; Peterson keeps
its existing task-aware helper. The count is documents, not exercises or a
claim that every authored course is complete.

## Approved scope

- Add only the two current deferred navigator script includes to 608 documents;
  preserve the 19 already integrated documents.
- Record the full 627-page inventory, discovery provenance and exclusions.
- Preserve every other byte in the added HTML documents: mathematical content,
  sources, inline engines, controls, styles, links and saved-work identifiers.
- Keep historical source/review hashes by strictly inverting only the exact
  include pair, bound to the entire before/after payloads. Add negative controls.
- Test actual routes at desktop, narrow mobile and landscape widths in four
  browser shards, plus existing mathematical/source gates and helper regressions.

No new teaching, assistant rules, model calls, account flow or data migration.
Immutable book editions/aliases, cabinet and board shells, existing Peterson
helper pages, offline packages, redirects, empty files and unlinked legacy
duplicates are excluded. The manifest is `assets/assistant/page-rollout.json`.

## Acceptance and gates

- Exactly one working navigator on each inventoried top-level public page.
- Launcher and dialog fit all three viewports; keyboard, lookup, privacy handling,
  closing and clearing remain usable; no additional launcher in an embedded page.
- The exact new include pair can be removed to recover the original full payload;
  wrong attributes, missing/duplicate scripts or any other content change fail.
- Existing mathematical fixtures, source hashes and review receipts remain intact.
- Required: preservation tests, 43 navigator dialogue regressions, four actual-route
  browser shards, affected mathematical/source/persistence gates and diff check.
- Gate: `PUBLIC_NAVIGATOR_ALL_PAGES_OK` only after all required checks pass.

## Review and rollback

MEDIUM: broad visual integration without new learning sequences or persistence.
No trainer design consultation is needed. Real pupils and physical devices are
not claimed. Main risks are legacy CSS/event interactions and historical
whole-document checks; isolated shadow styling, full route checks and exact
byte inverses address them. Rollback is an ordinary revert of this scoped delta.

## Execution

Results, final head, composed base and production acceptance are recorded in the
PR and release handoff. External provider review is not performed under the
owner's instruction; a copied marker is not provider evidence.

Preparation checks passed: all 608 original document byte identities and
negative controls; 43 dialogue regressions; 62 current book/math/persistence
contracts; frozen v1/v2 integrity and 10 prospective-book generator tests.
Geometry's existing publication identities remain valid without changing a
receipt; the stereo historical-layout boundary also passes. The script pair
is deferred in the document head (or before the implicit body on two legacy
documents), preserving old inline-script extraction and all teaching bytes.

Full navigator interaction coverage is 1,881 page/viewport combinations in
four shards, with exact comparison against the original page if an existing
load error occurs while external requests are blocked. Source book replay and
final browser/CI results are pending at this preparation commit. Local Chromium
is 134.0.6998.35; CI keeps the pinned current browser. Production is not claimed.
