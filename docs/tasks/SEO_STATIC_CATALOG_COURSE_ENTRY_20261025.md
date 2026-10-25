# Public catalog links and the current Vilenkin course entry

## Identity

- Task: `SEO_STATIC_CATALOG_COURSE_ENTRY_20261025`.
- Date: 2026-10-25, Asia/Novosibirsk.
- Base branch: `main`.
- Base SHA: `693442f82e934bcea1b32507a8afc8bdd529542f`.
- Branch: `fix/seo-static-catalog-course-entry-20261025-ready`.
- Review level: `SMALL`; bounded catalog HTML and indexing metadata.
- Related public releases: PR #337 (SEO consistency), PR #339 (Vilenkin
  textbook learning). No architectural or trainer-contract change.

## Goal and public evidence

Expose the existing catalog destinations as ordinary source HTML links and
align the public Vilenkin entry with its already-published textbook route.

Three current catalogs populate empty containers with JavaScript:
`trainers/`, `ege-profil/trainers/parameters-18/`, and
`trainers/oge-basics/percentages/`. Their source HTML omits links that the
existing application shows after rendering. No new or historical catalog
items are promoted by this task.

PR #339 intentionally made `textbook.html` the normal Vilenkin entry, as
specified in `VILENKIN6_TEXTBOOK_LEARNING.md` and checked by
`textbook-entry.test.cjs`. The old entry still declares itself canonical and
is listed in the sitemap; the actual textbook target has no canonical. Its
initial main content is only a loading message. This is a current public-route
inconsistency, not evidence about any earlier search-engine indexing decision.

## Approved scope

- Add static fallback cards matching each catalog's existing data and URLs.
- Keep `trainers/` rendering unchanged. The other two catalogs append cards;
  add one container-clearing statement before each existing append sequence
  so progressive enhancement replaces the fallback without duplicate cards.
- Align Vilenkin entry canonical, target self-canonical, public course links,
  reviewed sitemap seed, and generated sitemap with `textbook.html`.
- Add a short, accurate H1/introduction in the target's existing `main`;
  the application continues replacing that container when it loads.
- Regenerate `offline.html` because its supported builder derives it from the
  old entry. Preserve its `noindex` and all embedded learning scripts.
- Add focused fallback/link parity and canonical route regressions; run
  existing SEO and affected Vilenkin tests; reconcile the two related public
  releases in project status.

### Preserved areas

Keep catalog data, destinations, filtering and progress logic unchanged.
Apart from the two catalog-clearing statements, executable scripts remain
unchanged. Preserve `learning=1`, `legacy=1`, file-mode and hash mapping,
learning contracts, IDs, saved work, mathematical content and all existing
`noindex` directives. Do not change archives, demo pages, robots policy,
authentication, hosting, cabinet state, or unrelated canonical declarations.
Private account reports and their URL classifications are not repository data.

## Acceptance and checks

- [x] Source HTML exposes exactly the existing catalog cards and destinations.
- [x] JavaScript replaces fallback cards without duplicates or changed URLs.
- [x] Vilenkin target is canonical and in sitemap; old public entry consolidates
  to it while managed/legacy/file routes keep their established behavior.
- [x] Generated offline artifact is reproducible and retains `noindex`.
- [x] Relevant SEO, entry and retained-work tests pass; final diff is reviewed.

Required checks: existing `seo-sitemap.test.py`, `build-sitemap.py --check`,
`seo-check.py`, focused catalog regression, affected Vilenkin entry/content/DOM
and managed regressions, reproducible offline build, `git diff --check`.
Final gate: `SEO_STATIC_CATALOG_COURSE_ENTRY_OK`.

## Review, risk and rollback

Self-review and an independent focused diff review are required for this task.
External model review is optional for this `SMALL` metadata/catalog change;
no new trainer design or learning sequence is introduced. No external-provider
verdict is claimed. Only public source and the scoped diff are handed off.

The main risk is duplicated catalog cards or an accidental public-entry change.
Parity tests and existing route tests cover those boundaries. Roll back the
scoped HTML/metadata/test commit and regenerate the sitemap/offline artifact;
no saved-work migration or account operation is involved.

## Permissions

The owner's current SEO-audit instruction authorizes implementation, local
commits, branch publication and one Draft PR. Merge, auto-merge and deployment
are not authorized. The two small catalog-clearing statements are explicitly
included in the implementation scope to avoid duplicate fallback cards.

## Execution record

- Initially prepared and reviewed against main
  `76f99426e32e7afa5917a26f540ea84274e5d9b0`. Before a Draft PR, main advanced
  through public PR #342 (lesson contacts) to the base SHA above. A fresh
  isolated branch from that main preserves the contact stylesheet, navigation,
  contact sections, public lesson page and its sitemap entry alongside this
  SEO patch. Earlier preparation branches have no PR and remain untouched;
  only the ready branch is the final task branch. No merge or deployment ran.
- PASS on the fresh composition: 12 sitemap regressions; generated sitemap
  with 527 URLs; SEO preservation against current main
  `693442f82e934bcea1b32507a8afc8bdd529542f` (96 canonical declarations,
  185 topic links); source/render/base catalog parity against the original
  reviewed main (69 destinations); OGE navigation regression (241 links);
  Vilenkin public/managed/legacy/file entry regression; whitespace check.
  PR #342 contact assets, invitations, lesson URL and seed are retained.
  The implementation files used by the earlier Vilenkin runtime/browser checks
  remain identical, so those unchanged broad suites were not repeated.
- Independent final composition review PASS: the Vilenkin card is the only
  course-catalog content change relative to current main; all 13 non-overlapping
  PR #342 files and its lesson route remain intact. The earlier reviewed
  executable scripts are unchanged. No remaining blockers.
- Worktree was clean after removing disposable Python bytecode.
- Static catalogs: 56 trainer cards in 14 sections, 12 parameter cards
  (seven ready destinations), and six percentage cards. All 69 destination
  links match the JavaScript render and the reviewed base. Placeholder chapter
  cards remain unavailable. Static trainer counters now show 56 and 14.
- Vilenkin: entry canonical and Open Graph URL, textbook canonical, three public
  catalog links and its factual description, reviewed seed and sitemap agree
  on `textbook.html`. Generated offline changes only the two inherited URL
  metadata tags; `noindex,follow` and embedded scripts remain identical.
- PASS: `python3 tools/seo-sitemap.test.py` (12 tests),
  `python3 tools/build-sitemap.py --check` (526 URLs),
  `python3 tools/seo-check.py --base 76f99426e32e7afa5917a26f540ea84274e5d9b0`
  (30 entrances/topics, 95 canonical declarations, four refresh destinations),
  and `node tools/seo-catalog.test.cjs 76f99426e32e7afa5917a26f540ea84274e5d9b0`
  with isolated `jsdom@26.1.0` (source/render/base parity, existing targets,
  Vilenkin canonical and sitemap).
- PASS: Vilenkin `check.cjs`, `dom.cjs`, `textbook-check.cjs`,
  `textbook-entry.test.cjs`, `textbook-dom.cjs`, `managed-dom.cjs`;
  `node --test board-server/test/learning-vilenkin6.test.js
  tools/vilenkin6-course/bridge.test.cjs` (16 tests);
  `node tools/learning-vilenkin6.dom.cjs` (eight tests).
- PASS: existing `textbook-browser.cjs` with local Chromium: 384 task views,
  desktop/mobile widths 1280/390, source figures, retained step/hint/draft work,
  skip link and preserved managed entry. This is local release-regression
  evidence; no new production learner/account operation is claimed.
- PASS: real Chromium with JavaScript disabled at width 390: all 56/12/6
  catalog cards remain visible and navigable in source HTML.
- PASS: script syntax, exact executable-diff inspection (only the two approved
  clear statements), reproducible offline build, and `git diff --check`.
- Independent scoped review PASS on 2026-10-25 at 17:12 UTC: no remaining
  blockers. The review found a script-preservation gap in the bounded fallback
  exception. The check now compares scripts before removing fallback markup;
  a negative control proves an injected script inside those markers is rejected.
  The reviewer rechecked SEO, sitemap, preservation and the exact two-statement
  executable diff. Unchanged robots and embedded offline scripts were verified.
- Head / PR: recorded in the final handoff, after commit/publication.
- Failures: none in completed checks. CI on the eventual PR head is pending;
  external-provider review is optional for this SMALL change and was not run.
  Scope deviations: none. No merge or deployment was performed.

```text
EXECUTIVE STATUS

Task: SEO_STATIC_CATALOG_COURSE_ENTRY_20261025
PR: pending
Base: 693442f82e934bcea1b32507a8afc8bdd529542f
Head: pending
Gate: SEO_STATIC_CATALOG_COURSE_ENTRY_OK (local; PR CI pending)
Tests: SEO, source/render/base parity, Vilenkin standalone/textbook/managed/browser PASS
Failures: none
Not run: exact-head GitHub CI, optional external-provider review
Scope deviations: none
Recommendation: publish one Draft PR; do not merge
Next user decision: separate release decision after the reviewed result
```
