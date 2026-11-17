# MathExam: first-priority public SEO entrances

## Identity

- Task: `SEO_PRIORITY_ENTRIES_20261118`
- Owner: MathExam owner
- Date: 2026-11-18 (Novosibirsk)
- Base branch: `main`
- Base SHA: `1d585e3e708fbe8f3ab07081073bcbe83e1ac72e`
- Base tree: `08743fc7f7fa230ab6d0990516f16740790d2887`
- Planned branch: `codex/seo-priority-entries-20261118`
- Review level: `SMALL`
- Related documents: [SEO rules](../SEO.md), [previous course entrances](SEO_COURSE_ENTRANCES_20261110.md), [review policy](../REVIEW_POLICY.md).
- ADR status: not applicable; no architectural decision.

## Goal

Make the existing prioritized course entrances understandable from their initial
HTML and expose the missing public methods course in the sitemap. Keep the
current teaching content, interactive behavior and saved work intact.

## Context and evidence

- At 2026-11-17 21:43 UTC (18 November 04:43 Novosibirsk), the five reviewed
  entrance URLs returned HTTP 200 and matched this base byte for byte. The live
  sitemap also matched the base: 582 URLs, without `/ege-profil/azbuka-metodov/`.
- The methods entrance has no canonical. Its ordinary source contains no topic
  list; the existing application replaces `#alphabet-main` when it starts.
- The Merzlyak entrance has a canonical and useful metadata, but
  `#textbook-app` initially contains only a loading message. The existing engine
  replaces that container after loading the current course data.
- The arithmetic entrance already has a heading, an introduction, and links to
  the diagnostic and division path. Only its generic metadata needs clarification.
- The formula trainer has useful static content and a canonical, but no description.
- `/trainers/oge-course/` already has its self-canonical, metadata and 25 static
  topics. It is reviewed and retained unchanged; an indexing observation alone
  does not justify rewriting a complete entrance.
- `/school/` remains `noindex,nofollow` and absent from the sitemap.
- The existing navigator preservation gate requires every sitemap page to be
  covered, with one pre-existing Peterson helper exception. Adding the methods
  URL therefore also requires the unchanged navigator include pair and one
  recorded coverage addition; the gate and its exclusions remain unchanged.
- Open PR overlap was checked before implementation. #617 and #550 change the
  OGE course entrance, which is excluded from edits. #658 and #659 change Merzlyak
  data/engine files, which are excluded. #625, #641, #644 and #660 do not change
  the four entrance HTML files in this patch. Shared status documentation may
  require normal integration review later.
- No claim is made that these changes guarantee indexing or a ranking increase.

## Approved scope

### In scope

- Add the methods self-canonical and a single reviewed sitemap seed; regenerate
  the sitemap through the existing generator.
- Add brief static course introductions and verified topic lists inside the
  existing methods and Merzlyak application containers. Use only existing HTML
  destinations; do not add hash routes or JavaScript links.
- Clarify the methods/arithmetic titles and descriptions, and add the formula
  trainer's missing description with a precise title.
- Record this task and a minimal production/status reconciliation.
- After source review and a real source commit, refresh only the three affected
  existing navigator source bindings with the standard provenance tool. Register
  the methods page in `assets/assistant/pages.json` and `page-rollout.json`, with
  the exact existing navigator include pair and a source-bound coverage receipt.

### Out of scope

- Mathematical explanations, exercises, answers, progress/storage, course data,
  runtime JavaScript files, styles, learning sequences and offline packages.
- New pages, mass metadata rewriting, sitemap discovery expansion, indexing
  submissions, merge and deployment.

### Files or areas that must not change

- `trainers/oge-course/index.html`, `/school/` indexing directives, all runtime
  scripts/styles, book editions and independent open-PR work.
- Existing navigator script pairs, previous coverage membership and provenance;
  the methods page is the sole coverage addition.

## Acceptance criteria

- [x] Methods has one exact self-canonical and appears once in the sitemap.
- [x] Sitemap delta is exactly the methods URL; all other entries are unchanged.
- [x] Both static summaries name real current course topics and remain usable
  without JavaScript; normal application initialization replaces them.
- [x] Arithmetic/formula metadata describes existing content. Their body bytes
  and all four pages' existing script/style bytes are unchanged; the only new
  scripts are the exact shared navigator pair on the methods entrance.
- [x] OGE course and `/school/` bytes remain unchanged.
- [ ] Relevant SEO/course-entrance checks pass without weakened assertions.
- [ ] Source binding refresh uses a real reviewed source commit and passes the
  existing preservation gate before final handoff.
- [ ] Navigator page inventory grows only by the methods entrance; sitemap
  coverage becomes 582 of 583 with the same sole pre-existing exception.

## Checks and gates

- Required tests: `python3 tools/seo-sitemap.test.py`,
  `node tools/seo-catalog.test.cjs`, `python3 tools/course-entrances.test.py`,
  `node tools/seo-entrypoints.browser.cjs`, `node tools/course-entrances.browser.cjs`.
- Required static checks: `python3 tools/build-sitemap.py --check`,
  `python3 tools/seo-check.py`, `git diff --check`, exact base-to-working-tree
  script/style preservation and sitemap delta checks.
- Navigator checks: `node tools/public-home-coverage.cjs`,
  `node --test tools/public-navigator-preservation.test.cjs`,
  `python3 tools/public_navigator_bindings.test.py`, and the existing navigator
  regression command after the reviewed source-binding update.
- Manual checks: initial HTML at 320/1280 px with JavaScript disabled; both
  applications initialize with JavaScript enabled; topic names match their
  current catalog/data; no new invalid destinations; the shared navigator works
  on the newly covered methods entrance.
- Final gate marker: `SEO_PRIORITY_ENTRIES_20261118_OK`, only after the source
  binding update and required checks pass.
- Checks intentionally not run and why: record actual results below; no new
  mathematical behavior requires a new mathematics test suite.

## Review plan

- Review-level rationale: isolated metadata, static fallback HTML and standard
  coverage registration; no runtime code, mathematical content, dependencies or
  persistence changes.
- Trainer design consultation applicable: no; existing learning content and
  interaction are preserved.
- Before implementation: compare source to production and check open-PR file
  overlaps; no external design consultation requested or recorded.
- Ready-result review: parent agent reviews the exact diff before source commit;
  verify static topic accuracy, preserved runtime bytes and responsive rendering.
- External provider review required: no under the current owner policy.
- Sanitized handoff: public source, relative paths, exact base/head and test
  results only; no connected-account data or credentials.
- If external review is later used, require provider, PR, base/head, verdict and
  a verifiable source or timestamp.

## Risk and rollback

- Main risks: stale duplicated topic names, brief fallback layout before startup,
  and source-binding metadata lagging the reviewed source commit.
- Rollback plan: revert this task's final commits through the normal PR process.
- Compatibility: URLs, route logic, existing scripts, styles and saved work are
  unchanged. The methods page receives the existing public navigator, as required
  for its sitemap coverage.

## Permissions

- `START` granted by owner in the current conversation: yes, for first-priority fixes.
- Branch creation and scoped local edits allowed: yes.
- Local commits: deferred until the parent reviews the source diff.
- Push and Draft PR: handled centrally by the parent after review.
- Merge, auto-merge, deployment and indexing requests: **not authorized for this task**.
- Force operations, reset and rebase: not authorized.
- This task's narrower instructions override the standing publication policy.

## Execution record

- Actual branch: `codex/seo-priority-entries-20261118`
- Actual base SHA: `1d585e3e708fbe8f3ab07081073bcbe83e1ac72e`
- Actual head SHA: base until reviewed source commit.
- PR: not created; parent handoff pending.
- Commits: none yet; source review precedes navigator binding refresh.
- Tests passed: SEO sitemap unit tests (12), course-entrance tests (4), SEO
  catalog DOM check (75 destinations), methods-course tests (14), navigator
  binding unit tests (5), navigator regression (46/46), public-home coverage,
  sitemap reproducibility, SEO canonical/entrance checks, and `git diff --check`.
- Additional read-only verification: exact sitemap delta 582 to 583; existing
  scripts/styles and both metadata-only page bodies match the base byte for
  byte. The only script addition is the exact shared navigator pair on methods.
  JSDOM confirms all 11 static methods titles equal the rendered catalog, the
  six Merzlyak topics exist as reviewed records, both real engines replace the
  fallback, and the methods navigator answers through its existing route.
- Tests blocked by environment: both existing SEO/course-entrance browser
  commands were invoked with the supported `CHROMIUM_EXECUTABLE_PATH`; Chromium
  exits before page load with `socket() failed: Operation not permitted` in
  `process_singleton_posix.cc`. No browser result or 320/1280 layout PASS is
  claimed. JSDOM does not validate layout; its unsupported `window.scrollTo` is
  stubbed only in the one-off Merzlyak initialization check.
- Tests not run yet: complete navigator preservation after the real source
  commit/coverage update; browser verification must run in CI or another allowed
  browser environment. No final gate marker has been issued.
- Scope deviations: none.

### Pending provenance sequence

1. Parent reviews this exact source diff and creates a content-identical source
   commit on the task branch through authenticated GitHub access.
2. Verify the fetched commit tree and source bytes before updating local state.
3. Run `tools/public_navigator_bindings.py` against that real source SHA for the
   three existing bound HTML files: Merzlyak, arithmetic and formulas.
4. Add only `ege-profil/azbuka-metodov/index.html` to the sorted navigator page
   inventory. Record exact before/after hashes around the existing include pair,
   `provenance: sitemap`, sitemap coverage 582/583, and a `coverageUpdates` receipt
   with the same source SHA and this task. Preserve every previous record and
   the sole existing exception.
5. Run preservation/regression gates and hand the final provenance diff to the
   parent. No reset, rebase, force operation, merge or deployment is part of this
   sequence.

## Required handoff

```text
EXECUTIVE STATUS

Task:
PR:
Base:
Head:
Gate:
Tests:
Failures:
Not run:
Scope deviations:
Recommendation:
Next user decision:
```
