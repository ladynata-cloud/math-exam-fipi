# Согласованное оформление учебных курсов

## Identity
- Date: 2026-11-09 (Asia/Novosibirsk)
- Initial base: main `adc2c9445f6ce7f0a56bca67ed2bc31b8b82ec3c`
- Final acceptance predecessor: PR #504 `fcdf3a07d8cc2d275fe077d95ea0b7933d5c53e7`, tree `ea6220e34d03e9d3d66dc0ae991de4fc5b6da981`.
- Branch: `codex/course-design-standard`
- Review: MEDIUM — opt-in CSS on existing course entrances, no state or engine changes.
- Scope approval: current owner request to align OGE/EGE/VPR/textbooks/sections design with new principles.
- Release: the owner explicitly authorized uploading prepared changes, merging checked PRs and publishing on mathexam.space after checks. The release coordinator records the final composition and performs merges.

## Goal and scope
Apply a shared visual shell to the 29 explicitly listed pages in
`assets/course-ui-pages.json`, document the learning UI standard, and explain
the learning cycle in the existing course catalogue. Shared font hierarchy,
primary actions, card shape, mobile header and keyboard focus. Model palettes,
math engines, task banks, answers, progress schemas and course URLs are unchanged.
Learning routes, trainer behavior and sections from the preceding PRs remain
the exact baseline; this styling delta does not replace their implementation.

## Acceptance and checks
- Every scoped entrance opts in once and retains all prior scripts and routes.
- CSS is parsed successfully; text and primary actions meet 4.5:1 contrast.
- Verify representative home/task screens in the browser and mobile layout.
- Existing navigator preservation, relevant HTML/source checks and CI.
- Diff review, no new persistence or external calls, `git diff --check`.
- Gate: COURSE_DESIGN_STANDARD_OK only after results recorded.

## Review and rollback
Focused review of selectors and interaction states. No universal button rule
that recolours answer choices; no CSS inference of learning progress.
External review not performed under standing policy. No new trainer or
mathematical sequence is introduced. Real-pupil usability is not measured.
Rollback by reverting this task's stylesheet includes, body attributes and
catalogue guide; no data migration or pupil data restoration is needed.

## Context reconciliation
PROJECT_STATUS and the earlier acceptance records below include historical
preparation notes. Final acceptance compares against the actual stacked
predecessor, not the initial main snapshot. The release coordinator merges
the preceding work with history and verifies the final base/head/tree.

## Execution
Checks, final commit, CI and release evidence are recorded in the PR.

## Acceptance follow-up, 2026-11-09

The previous head 60e65399 completed 43 workflows: 36 success, 7 failure.
The failures were current (not queue delays): compact mobile profile and
Makarychev drawings, profile zoom wrapping, Vilenkin helper overlap, and
historical Atanasyan source fingerprints.

The interim composition preserves main `39705bc5669acb5b97a33c72f5badc044faff298`:
EGE base/profile learning maps, OGE8 corrections, Vilenkin SEO entrances from
PR #493 and the Merzlyak learning path and trainers from PR #503. HTML conflict resolution
retains main in full and adds only the two CSS opt-ins. All 27 HTML files restore
main exactly after removing those opt-ins and the single catalogue guide.
No course JavaScript, bank, answer, persistence key or data schema is changed.

The CSS follow-up preserves authored compact header/heading spacing and allows
long labels to wrap at 200% zoom. Historical layout gates accept only an exact
hash-bound reversible stylesheet/body opt-in and still reject changed scripts,
lessons and markup; historical fingerprints and course data are unchanged.
Browser coverage additionally pins the complete profile similarity and
Makarychev41 drawings within the 900px first screen at both test widths.

State checks passed for OGE, VPR, EGE base/profile, Peterson and Makarychev,
including independent versus assisted results, reload, import and stale tabs.
Final browser and full CI results belong to the exact final PR head and are
reported in the PR acceptance record. Local browser process launch is unavailable;
CI screenshots and browser tests provide the full viewport evidence.

The earlier release hold was superseded by the owner's explicit upload,
checked-merge and publication authorization. Final head/base acceptance and
production validation remain required; preparation does not declare release.

Final viewport review also found two pre-existing 320px entrance overflows
(Makarychev7:338px; Alimov:342px), caused by long titles in flex lesson cards.
Only textbook card text is allowed to shrink and wrap; models are untouched.
The paired browser gate now requires absolute absence of page overflow at both
widths for every scenario, rather than merely no increase from the control.

## Concurrent SEO composition record

Remote candidate `6d1bd6d15026b4ea703979a16bf4902339735b41` independently
composed main `d063ca10` and retained the Vilenkin SEO links. That intermediate
candidate preserved the other 26 original scoped HTML files and course-ui.css
from `f1c93d04`. Its reviewed source checkpoint `d3412e1b` and navigator receipt
are retained by the local continuation. The two additional styled entrances
below extend that intermediate candidate; its CI does not attest to this later
29-page composition. Final acceptance uses the final composed head and base.

Remote candidate `a7c10e84930b7845cf1458bcb54c0ca59eb7b78a` subsequently
composed main `39705bc5` via PR #503, including new Merzlyak runtime, progress
fields and compact task controls. All 22 incoming files and its reviewed source
checkpoint `85b5887b` are retained. The new runtime requires composed Merzlyak
browser checks; earlier renderer evidence does not verify this new runtime.
Reverting the design changes must retain the new serializers and progress
fields from #503; do not roll back or clear pupil data.

## Merged Vilenkin entrances, 2026-11-09

Main `d063ca10200c9fa208df15077b11a6bea67659e5` adds the two public course
entrances `/courses/vilenkin-5/` and `/courses/vilenkin-6/`. Both are primary
destinations from the course catalogue and belong to the same visual scope.
The inventory now contains 29 entrances. Each new page receives only the
stylesheet include and body opt-in; its source, routes, canonical metadata and
existing navigator remain unchanged. A selector limited to Vilenkin
`.topic-actions` gives the main action the shared colour and preserves the
secondary action. No runtime, state, task bank or model changes are included.

The manifest automatically adds both pages to the paired browser cases at
320×900 and 1280×900: 29 entrances plus five internal regressions, 68 results.
Source restoration, navigator and SEO checks cover the composed pages. These
pages remain navigator `existingPages`; no source bindings are invented for
them. Publication waits for the final composition and its exact-head checks.

Local continuation checks passed: all 29 HTML files recover the merged
main byte-for-byte after removing the shell and catalogue guide; navigator
preservation 4/4, binding negatives 5/5, sitemap tests 12/12, canonical/entrance
checks and static catalogue parity. The action selector matches only the two
new primary links. Final browser acceptance for these additions is pending CI.
The two entrances are present in main; production publication is verified
separately and is not inferred from the merge.

## Future fixed-edition dependency boundary

The OGE course stylesheet adds exactly one dependency to a future book build:
`assets/course-ui.css`. A dedicated generator check verifies its sole source
entry, empty dependency list, source hash, exact frozen copy and URL, early
bootstrap and unchanged storage namespace. Removing only that exact include
recovers the previous asset set; all other prior outputs stay byte-identical
apart from the entry and the bootstrap/manifest closure metadata. The bootstrap
runtime is identical and its configuration gains only the stylesheet path.
Existing published v1/v2 files and their integrity/isolation checks are not
changed. On the actual predecessor the measured closure is 237 files; adding
the stylesheet makes 238. Removing only the guide assets leaves 236; removing
only active-learning assets leaves 235. Each separate exact-delta guard remains.

## Final stacked composition

The accepted source baseline is PR #504 `fcdf3a07d8cc2d275fe077d95ea0b7933d5c53e7`.
It includes #505, #497, #499, #508, #507, #474 and #504 on main `39705bc5`.
All 29 scoped HTML pages recover that exact predecessor after removal of the
two styling opt-ins and the single catalogue guide. The current geometry
builder retains its complete rendering expression, then applies the catalogue
opt-ins after the existing navigator insertion. Course
runtime, input safety, progress fields, models, task banks and published book
files remain the predecessor's bytes. Existing navigator receipt histories and
coverage are preserved; only the 23 styled bound-page rows need a new source
checkpoint. No bindings are added for the two Vilenkin `existingPages`.

The guide and active-learning future-book guards are retained alongside the
stylesheet guard. Exact-head CI and screenshots for this final composition are
required; earlier-head evidence is not labelled as final acceptance.
