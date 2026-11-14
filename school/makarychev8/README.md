# Makarychev algebra 8 (2024)

Static course at `/school/makarychev8/`, built around the existing Peterson course interaction and shared exact-arithmetic practice module.

## Coverage

- 51 topics in six chapters, including the six advanced topics.
- 174 short theory blocks, 1789 tasks and 4116 worked steps.
- 1564 textbook tasks/subparts with number and printed page, plus 225 explicitly labelled authored exercises/review adaptations. Exercises 1–109 and the entire square-roots chapter, 268–509, include all source subparts, substitutions, secondary questions and constructions. Other source ranges retain their selected examples.
- Exercise navigator for all 1340 numbers. It distinguishes existing solutions from topic links; it does not claim solutions to every numbered exercise, every subpart, or the advanced problem bank.
- Six interactive model families and 20 computation practice skills, three difficulty levels, preserved return to the original task.

The uploaded textbook PDF is not copied into this public directory. Source structure is recorded in `source-map.json`. Source conditions and authored explanations are in the chapter JSON files and `exercises-{1-24,25-54,55-74,75-109}.json`. These append 93, 124, 73 and 126 cards to topics 1–4 respectively; original task indices, IDs and existing learner records remain unchanged. Regenerate `data.js` with `node school/makarychev8/build.cjs` after editing content.

## Behavior and dependencies

The browser loads the existing `../peterson6/math.js` for exact rational arithmetic and generated computation practice. No external CDN or account is required. The new course has its own storage key; it does not modify any previous course progress. Results are local to the browser, with JSON export/import. Existing populated task records take precedence over imported ones, preserving notebooks, steps and assistance history.

Symbolic answers accept the forms and aliases recorded in content, with harmless notation normalization. This is not a general computer algebra system. Numeric answers accept exact equivalent fractions and decimals; root sets are unordered. Ordered pairs use explicit text formats. In №108 the learner enters both lines as `k1; b1; k2; b2`; either line order and exact equivalent rational coefficients are accepted. The plotted preview follows the draft, and the intersection is checked separately as an exact ordered pair.

## Verification

Run `test-course.cjs`, `test-models.cjs`, and `test-state.cjs` with Node. `test-ui.cjs` and `test-import.cjs` additionally require jsdom 26.1.0. The workflow installs that dependency in an isolated temporary directory.

On 2026-10-24, all 306 task journeys and 958 worked steps passed in-memory DOM verification. State/recovery, draft import, computation detours, source-search boundaries and model-domain contracts passed. Independent content review covered all chapter answers and selected PDF source conditions. Reproducible fixes included Vieta-specific steps, signed-difference wording, speed domain restrictions, decimal-unit wording, and import draft preservation.

Historical release limitation (2026-10-24): browser visual QA was **not completed**: the cloud browser policy rejected the preview observation. No mobile screenshot, pixel-level layout, real-pupil validation, live board synchronization or cloud learner-storage claim is made. Claude consultation/release review was not run; no configured local Anthropic API credential or suitable connector was available. Independent agents are not an external Claude approval.

## Release boundary

The course has a catalog entry, sitemap entry and scoped CI workflow. It does not create cabinets or register a shared-board adapter. Requested course continuations follow the standing owner publication policy dated 2026-11-02; applicable verification remains required. The current-base continuation is recorded in `docs/tasks/MAKARYCHEV8_ROOTS_CURRENT_BASE_20261114.md`; implementation, verified CI and publication are reported separately. The active conversation requires separate explicit merge authorization.

## Exercises 1–24 verification

`python school/makarychev8/test-exercises-1-24.py` (SymPy 1.14.0) independently checks source formulas, all subpart counts, substitutions, real domains, zeros with exclusions, signs, extremal equality cases, polynomial identities and discounts. `node school/makarychev8/test-browser.cjs` (Playwright) tests every new card at 320/390/768/1280 px, all new worked steps, all 24 number searches, old links and saved notes. The browser suite serves only local static files and does not access pupil accounts.

## Exercises 25–109 verification

Run the analogous `test-exercises-25-54.py`, `test-exercises-55-74.py` and `test-exercises-75-109.py` source/math gates, then `test-browser-25-54.cjs`, `test-browser-55-74.cjs` and `test-browser-75-109.cjs` with Playwright. The source fixtures are independently transcribed and use exact algebra and original denominator restrictions. №75–109 additionally verifies all 596 prior task objects/positions by a fixed snapshot, the proof questions, both word-problem substitutions, the complete two-line construction and the exact intersection.

For №75–109 the oracle checks 3320 assertions; the new browser gate covers 504 prompt/width views, 301 worked steps and all 35 number searches. Wrong signs, unsummed fractions, cancelled domain restrictions, inexact intersections and the wrong requested mass are explicitly rejected. The full DOM suite still walks every one of the 722 tasks and 1955 steps in a single saved-work session; it yields to the event loop every 20 tasks so jsdom can release detached render trees. Source PDF pages and browser screenshots are reviewed separately from these executable checks.


## Complete square-roots chapter (268–509)

The three `roots-{268-344,345-436,437-509}.json` files append 338, 439 and 269
source cards to the existing topics 10–19. Together with the 20 preserved source
cards, they cover all 1066 source cards/subparts across all 242 numbered exercises,
including additional exercises 447–509. `roots-review.json` adds 21 interactive
adaptations of the chapter's control questions and two missing theory blocks.
The chapter has 1127 cards in total, including its 40 existing authored practice
cards. No prior task is replaced or renumbered.

`coverage` gives the full source order, including preserved IDs. `studyOrder`
uses those original indices for entry, navigation and number-search results;
explicit old URLs still open the same card. The home page identifies the fully
covered ranges without claiming all 1340 exercises are solved.

The course checks the learner's own rational/irrational examples, distinct
rational values in strict intervals, coefficients producing the requested kind
of quadratic roots, and arbitrary straight lines with 0/1/2 intersections with
`y=√x`. Line classification uses exact integer arithmetic on rational
coefficients after substituting `t=√x≥0`, including tangency and the origin.
Symbolic transformations retain explicit accepted forms; this is not a general
computer algebra system. The input supports `sqrt(...)`, `√`, powers, inequalities
and a small mathematical keyboard.

Graph constructions begin without the requested completed curve. Entered point
values produce the learner's drawing, including shifted roots, `√|x|`, `x|x|`,
the two branches of `|x|/x`, hyperbolas and parabolas. Original excluded zeroes
remain open; source number-line figures and labelled straight-line figures stay
beside the question. Reference graphs are labelled as parts of graphs, not a
claim that every intersection is inside the displayed window.

### Gates and independent review

- `test-roots-source.py`: all 242 source numbers, full independently reviewed
  answer coverage, exact reviewed file hashes, every original 722 payload/address,
  complete source-order mapping and all 21 review cards. The three oracle files
  were derived by reviewers who did not author their assigned source range.
- `test-roots-engine.cjs` (jsdom): exact mathematical boundary cases, invalid
  answers, free constructions, radical notation, discontinuities and SVG geometry.
- `test-browser-roots.cjs` (Playwright): every new condition at 320/390/768/1280px,
  every new worked step, every chapter number search, old links, storage/import,
  the learner's graph construction and alternate free answers through reload.
- Existing source/math, model, state, import, DOM and four prior browser suites
  remain enabled. The full DOM suite walks all 1789 tasks and 4116 steps.

Local mathematical/schema/state gates pass. The local browser process is blocked
by the environment's socket policy, so rendered-layout and screenshot evidence
must come from the exact-head GitHub Actions run. Its result and the final gate
are recorded in the task PR, not inferred from DOM checks or this README.
No actual-pupil, physical-device, board integration or publication claim follows
from preparing this chapter. See the task and independent review records in
`docs/reviews/MAKARYCHEV8_ROOTS_*`.

Continuation verification on 2026-11-07 corrected mixed-fraction drawings,
clipped curve labels and cropped zero axes. The root engine now has 769 passing
checks. Coupled runtime assets use one release cache version to prevent stale
checker/new-data combinations. Source and complete DOM gates pass; isolated SVG
review covers all 85 diagram states. After the owner's explicit START, Draft
PR482 was created and native CI ran. The ordinary course job passed; the roots
job found the figure of 353a ending 3.55px below the 320x900 first screen. The
mobile source/prompt spacing correction preserves readable content and the
unchanged browser assertions. The exact navigator source binding is refreshed
for the reviewed cache-version update, with all other bindings retained.
Corrected and composed-candidate CI/visual evidence is still required. The
complete release gate is pending; the expanded chapter has not been published.

### PR 482 release-candidate follow-up

The native gate now checks every one of the 1127 chapter cards at four widths
(4508 initial views and 264 figure placements), including preserved cards. It
keeps the 900 px bound, checks that the navigator does not obscure conditions or
figures, and records viewport measurements and screenshots. It also restores
two synthetic legacy records through real browser reloads, protecting old
accepted radical notation, completed steps, drafts and notes. The roots engine
has 778 passing checks; the independent old-checker comparison preserves 25234
previously accepted responses. All 722 old task payloads and 1955 steps remain
identical. Mathematical content and learner storage keys are unchanged.

PR 482 historically included native checks on an isolated composition with its
reviewed main. The current continuation starts from main directly, preserves its
newer equal-axis correction and reuses the full course and roots gates on the new
candidate. Its actual source checkpoint is bound through the canonical navigator
tool. See the current task for exact-head CI, review and release status; historical
PR 482 results do not establish acceptance or publication of this candidate.

### Current-main continuation, 2026-11-14

The current continuation retains the newer equal-axis model and its regression
unchanged. Its generated course is byte-identical to the reviewed PR 482 content.
Independent integration review found that the new numeric/tuple answer kinds
needed the current course's format-correction handling: incomplete values now
retain the draft without creating a mathematical attempt; genuine wrong answers
still remain in the learning history. The 883-check roots engine includes actual
form handlers, corrected first attempts, reload and guided-step history. Seven
additional native browser journeys check these corrections at 320 px. All source
receipts and authored content are unchanged; actual-head browser evidence and
separate merge authorization remain required.
