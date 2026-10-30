# MaxExam public navigator — main integration, 2026-10-31

## Candidate identity

- Source PR: [#361](https://github.com/ladynata-cloud/math-exam-fipi/pull/361).
- Source head: `391f595ab3639fe24990911691d24192a58b44ab`.
- Current base: `c9bf66e2d95f48db0134d43cc590da89f8bc3053` (`main`, PR #377).
- Branch: `feat/public-assistant-main-20261031`.
- Task: [MATHEXAM_PUBLIC_ASSISTANT_V1](../tasks/MATHEXAM_PUBLIC_ASSISTANT_V1.md), HIGH.
- Replacement PR and exact final head: recorded in the final handoff after commit.

## Why a new composition is needed

The old branch was stacked on an earlier cabinet draft. Its dependencies and
newer learning/SEO updates are now published through #358/#369/#376/#368/
#378/#380/#382/#377. This candidate transfers only navigation code and required
compatibility support onto current main. No old trainer HTML is copied over a
newer version. Original branch history is retained; no force/rebase/merge is used.

Old cloud results: 40 workflows, 32 successes, seven failures, one cancelled.
These are historical diagnostics, not current release evidence. The seven
failure families included script-loader assumptions, closed-launcher obstruction,
page-header selectors, missing immutable scope objects and an ancillary CSS
export-parity change. The unrelated CSS change is omitted in this composition.

## Coverage and preserved boundaries

595 public pages receive one exact deferred script pair. The sitemap has 531
pages: 528 receive the navigator, two protected textbook shells stay unchanged,
and one retains its existing Peterson task helper. Another existing practice
helper page is outside the sitemap. The 67 extra eligible public documents are
recorded in `tools/public-assistant-pages.json` with discovery sources.

All 832 existing HTML files match base after removing the exact block. Existing
URLs, canonical/SEO metadata, lesson contents and course data are retained.
Protected textbooks remain link destinations. Private cabinets/board wrappers,
archives, sources, exports and redirects are excluded. The existing Peterson
and practice helpers retain their original interface and assistance accounting.

## Product boundaries

This is a prepared rules-and-catalogue navigator. It cannot see the current
exercise, check a submitted answer, converse as a general language model or
certify full textbook coverage. Ambiguous requests receive explicit choices.
No provider, model endpoint, paid resource or learner record is connected.
Input and answers stay in bounded page memory; clearing/pagehide discard them.
Independent site analytics remain a separate boundary, so no blanket claim that
other scripts cannot see page data is made.

## Verification

### Completed local checks

- Navigation: 22/22 groups, 132 checked catalogue entries, current file/PDF/router
  targets, exact query allowlist, exam precedence, ambiguity and refusal/access
  handling. Explicit no-model/no-answer-inspection disclosure is tested.
- Coverage/admission/strict SEO exception: 8/8; all 595 inclusions and 832 base
  HTML blobs verified; current task file scope checked separately.
- Sitemap: 12/12; 531 exact self-canonicals; 30 SEO entrances, 203 local links,
  560 canonical declarations and seven consistent redirects. Base SEO source
  preservation passed on all 24 protected entrance pages.
- Actual SEO browser: six compatibility routes, 30 catalogue clicks at
  320/390/1280px and public/embedded NOD/NOK scenarios passed.
- Navigator browser: 13 groups, all manifest paths and aliases, 320/390 and
  short-screen layouts, safe rendering/links, no text requests/storage access,
  scoped keys, clear/pagehide, iframe/private suppression, unchanged drafts and
  preserved existing Peterson/practice helpers. Screenshots were inspected.
- Original OGE20–22 browser: three trainers at three widths passed, including
  actual settings clicks, retained work, keyboard and offline scenarios.
- Original special OGE browser: nine route/viewport cases passed; original
  header, saved work and provenance assertions remain.
- Guided division notebook and search-entry browsers passed on the current
  source: one-action progression, decimal presentation, old-v1 resume, drafts,
  hints, canonical/deep-link aliases and offline completion remain intact.
- Original affected route/DOM/picker fixtures passed after bounded URL-loader
  corrections. The Peterson picker remains byte-identical to current main and
  its six groups pass; no unused public-helper allowance remains there.
- Task6 focused/minimal/interactive: 39/39; original immutable scope preserved.
- Practical DOM/mathematics suites: seven file suites passed immediately; the
  two archive-dependent suites initially hit sandbox `unzip` restrictions, then
  their unchanged 14 tests passed under the normal execution permission.
- Profile link gate: 85 checks, zero failures or JavaScript errors. Profile15
  content/link gate: 12 lessons, six families, 124 steps and 32 links passed.
- Stereo generation reproduced the source with the exact block. Pogorelov
  offline export exactly matches base: 245493 bytes, SHA256
  `8193d76de7c5da604330f4d51f0208f31921386aafee32b9381f03e21a9035c3`.
- Syntax and `git diff --check` passed. No model was called.

### Known failure and limits

The complete contextual-OGE browser gate stops on an existing percentages layout:
`percentages/percent-of-number-and-whole.html` has scroll width324 at viewport320.
Five matched random seeds reproduce identical prompt/layout geometry on the
integrated page and the exact base HTML with the helper block removed:
header/practice/footer x24, width300, right324. This complete gate remains failed;
its later scenarios are not claimed as run. The formerly obstructed six-level
prerequisite controls were separately tested with the original center-hit
sequence and pass at320/360/1280. No unrelated percentage CSS or assertion was
changed to manufacture a pass.

The complete practical-OGE browser gate also stops on an existing diagnostic:
`practice-1-5-entry-diagnostic-2026.html` at320 has document/body width340.
It completes 11 cases, then fails on case12; the remaining28 are not reached.
The exact main HTML and stylesheet reproduce identical340px width and identical
mode-button rectangles (the teacher button ends at339.5px). The old PR's ancillary
wrapping change was not ported because it changed the source stylesheet without
its frozen downloadable counterpart. No offline archive or original assertion
was altered. This full39-case gate is also reported failed, not passing.

Exact-head cloud CI is recorded in the replacement PR after publication of the
branch. Local successes do not establish all cloud outcomes. External HIGH
review, production rollout and live pupil activation have not run. The owner
has not granted a review exception or an exact-base/head release decision.

### Independent internal review

A separate agent reviewed navigation, referral/privacy, widget isolation,
coverage, strict SEO admission and generator/export boundaries. It found four
P2 defects: explicit EGE level losing to pathname, role-first tutor refusals,
inflected login errors counted as difficulty and competing exams silently
resolved. All four were fixed and independently reproduced as passing.
Final internal verdict: PASS at2026-10-30 22:04UTC (31October05:04 Novosibirsk).
This is internal review, not an external HIGH verdict.

Reviewed runtime blobs: data.js `df31ce32945bbcb45aace303d83d471fca652f1f`,
widget.js `c92c51efe21ba7cc100422c798c1e1a2b3694d72`,
widget.css `3b91089b66f6bb464197c597de99a39663f5af41`.
Final commit identity is checked against these reviewed blobs in the PR.

### Production reconciliation before release

Read-only HTTP checks returned200 for the live homepage, canonical short division
trainer, sitemap and robots. Each response exactly matched current base main;
no public navigator was present. This establishes the starting publication,
not deployment of this candidate.

### Visual evidence

![Desktop navigation](assets/mathexam-public-assistant/desktop.png)

![320px navigation](assets/mathexam-public-assistant/mobile.png)

## Rollback

Remove the exact marked inclusion from the manifest pages; verify original HTML
blobs and rerun coverage, SEO and affected browser checks. No learner storage or
assistant-service ledger migration/deletion belongs to this UI rollback.
