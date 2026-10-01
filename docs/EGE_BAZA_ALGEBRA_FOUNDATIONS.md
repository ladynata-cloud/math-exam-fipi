# Algebra, foundations and percentages — assembled review version

Date: 2026-10-02. Task: `EGE_BAZA_ALGEBRA_FOUNDATIONS`.
Base: Draft #152, `ee4af5359dfc72d995d99e595ab98f0857606ad6`.

## Entry and coverage

Open `ege-baza/index.html`. The original two modules remain available. New sidebar
links open isolated learning sections; their results do not inflate old progress.

| Section | Implemented content | Check boundary |
| --- | --- | --- |
| Exponential / logarithm | Reflected graphs, bases above/below 1, moving points, domain and properties, 8 problems / 24 guided steps | 8 separate function check questions |
| Foundations | Signed operations, four fraction operations, mixed numbers, decimals, powers/roots, identities, equations; natural multiplication/division/remainders, place value and carrying/borrowing, divisibility/reduction, comparison, units and interpreting word problems | 14 skills × 6 practice + 2 check = 84 + 28 |
| Percentages | 100-cell model (including comparisons over 100%), changing reference base, ratio recipe, direct/inverse proportionality, successive changes, mixtures/evaporation, fixed-base vs compound growth | 17 problems / 61 steps, 6 error clinics, 24 checks |
| Tasks 19–21 | 12 guided types: digit restrictions, digit permutations, product of digits, deletion; return/meeting motion, average speed, mixture; integer score search, four rectangles, row-sum bounds with a constructed table, shortest arc | 12 separate checks; variable-answer rules accept all valid constructions |
| Geometry improvement | Choose a useful construction first; midpoint + median or perpendicular + proof; connect chords for an angle on a diameter | Previous separate geometry check retained |

The 17 transfer questions in the percentage lessons also form part of the 24-item
check. Viewing transfer practice marks later checks as exposed/educational. They
are not advertised as two disjoint banks. Repeated checks and access to training
during a check cannot earn the first independent-check label. Foundational checks
also track exposure across per-skill and whole-foundation checks.

All new authored examples are original. Existing local prerequisite trainers were
inspected for instructional mechanisms. Previously retrieved FIPI 2027 draft
materials informed the broad 16–18 connections; this document does not claim final
2027 approval or complete task-subtype coverage. No unseen Methodizer course is
claimed to have been reproduced or audited.

## Virtual learners: method and results

These are deterministic browser interaction scenarios with declared starting
errors and independently specified answer keys. They are not real students, not
measurements of learning gain, and not independent pedagogical review.

| Profile | Actions exercised | Observed result |
| --- | --- | --- |
| Fraction gap | Stops inside decreasing exponential inequality; enters wrong fraction; corrects it; returns | Original task, step and base 1/2 preserved |
| Guesser / help-seeker | Empty answer, skipped questions, returns to explanations and retries | Invalid input rejected; assistance/repeat label retained; no independent credit |
| Wrong percentage base | Treats post-discount price as discount fraction; uses basic-action detour; switches comparison base | Specific explanation, preserved step; same absolute difference yields different relative percentages |
| Confident learner | Completes function, foundation and percentage checks using independently calculated answers | All expected check answers accepted; reports downloadable |
| Phone / keyboard learner | 360/768/1280 layouts, touch preset, keyboard slider; geometry point-button alternatives | No tested horizontal overflow; controls update state without requiring drag precision |

Additional scripted errors for tasks 19–21 include confusing distance travelled
with distance from home and assuming all quiz questions were answered.

Findings fixed during author validation:

1. Numeric input originally rejected 30000 in a square-unit conversion. Bounded
   integer input expanded; rational equality uses normalized pairs, avoiding
   overflow-prone cross-products.
2. A reduction problem originally accepted an unreduced equivalent fraction.
   This particular exercise now requires reduced slash notation (or equivalent
   decimal), while ordinary fraction-answer questions accept equivalent fractions.
3. The mobile foundation menu pushed the lesson too far down. It now uses a
   compact skill selector on narrow screens.
4. Percentage navigation initially styled inactive tabs as active because of
   `aria-current="false"`; inactive attributes are now removed.
5. Exposure across overlapping checks is explicitly tracked, including transfer
   practice, rather than reporting every new check route as unseen work.

## Validation commands

Run from repository root. Browser dependencies/runtime paths are supplied by the
environment, not committed to this repository.

- `node tools/ege-baza-algebra-percent.test.cjs`
- `node tools/ege-baza-algebra-percent.browser.cjs` with `CHROMIUM_EXECUTABLE_PATH`
- `node tools/ege-baza-labs.test.cjs` — 381 mathematical assertions.
- `node tools/ege-baza-labs.browser.cjs` with `CHROMIUM_EXECUTABLE_PATH`.
- `node tools/ege-baza-navigator.test.mjs` — 242 registry/state/DOM checks;
  requires jsdom (may be supplied through `NODE_PATH`).
- `node tools/ege-baza-navigator.browser.mjs` with `NAVIGATOR_CHROMIUM_PATH` —
  30 checks, including actual module opening/return and file preview.
- `python3 tools/build-ege-baza-preview.py <output.zip>` — 38 files, local link
  validation, archive integrity. Existing auxiliary site resources remain online.
- `node tools/ege-baza-assembled.browser.cjs` with `COURSE_PREVIEW_DIR` and
  `CHROMIUM_EXECUTABLE_PATH` checks the extracted archive itself.
- `node tools/ege-baza-reasoning.test.cjs` — all task keys, 9,000 digit inputs,
  alternative answers, integer bounds and constructive table sums.
- `node tools/ege-baza-reasoning.browser.cjs` with `CHROMIUM_EXECUTABLE_PATH` —
  12 guided scenarios/checks, timeline pause, construction tools, 3 widths.
- JavaScript syntax checks and `git diff --check`.

The assembled ZIP is the review deliverable. The legacy lab-only builder retains
its earlier purpose; use the assembled builder for the new connected sections.

6. The assembled file preview exposed old directory-only module links. The
   portable builder now writes explicit `index.html` links so both old modules
   and their course-return links work when opened from disk. Hosted source
   URLs remain unchanged.

## Readiness limits and next review

This is a working assembled prototype, not a finished full course. The existing
registry still identifies ten prototype lessons and 22 planned lessons. New
laboratories do not automatically make those planned lessons complete.

The foundations are targeted remediation for the course, not every topic in all
six primary/middle-school years. Long division with all written intermediate
rows, a comprehensive geometry-construction workspace and a large parameterized
assessment bank remain extensions. Geometry permits exact constrained
constructions, not arbitrary GeoGebra editing.

New-section state is temporary and disclosed on every page; export a report
before closing. Old module state/backup remains unchanged. No cross-device group
journal, teacher dashboard or integrated progress migration was introduced.
The preview requires a WebGL-capable browser for 3D; existing auxiliary links
require internet. Safari/physical-device, screen-reader and novice classroom
pilots remain unrun. Independent review and accepted ADR are required before
rollout, followed by separately authorized publication.
