# Makarychev algebra 8 (2024)

Static course at `/school/makarychev8/`, built around the existing Peterson course interaction and shared exact-arithmetic practice module.

## Coverage

- 51 topics in six chapters, including the six advanced topics.
- 172 short theory blocks, 722 tasks and 1955 worked steps.
- 518 textbook tasks/subparts with number and printed page, plus 204 explicitly labelled authored exercises. Exercises 1–109 have all source subparts, substitutions, secondary questions and constructions; later topics retain their selected examples.
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

The course has a catalog entry, sitemap entry and scoped CI workflow. It does not create cabinets or register a shared-board adapter. Requested course continuations follow the standing owner publication policy dated 2026-11-02; applicable verification remains required. The current continuation is recorded in `docs/tasks/MAKARYCHEV8_EXERCISES_75_109.md`; implementation and publication are reported separately.

## Exercises 1–24 verification

`python school/makarychev8/test-exercises-1-24.py` (SymPy 1.14.0) independently checks source formulas, all subpart counts, substitutions, real domains, zeros with exclusions, signs, extremal equality cases, polynomial identities and discounts. `node school/makarychev8/test-browser.cjs` (Playwright) tests every new card at 320/390/768/1280 px, all new worked steps, all 24 number searches, old links and saved notes. The browser suite serves only local static files and does not access pupil accounts.

## Exercises 25–109 verification

Run the analogous `test-exercises-25-54.py`, `test-exercises-55-74.py` and `test-exercises-75-109.py` source/math gates, then `test-browser-25-54.cjs`, `test-browser-55-74.cjs` and `test-browser-75-109.cjs` with Playwright. The source fixtures are independently transcribed and use exact algebra and original denominator restrictions. №75–109 additionally verifies all 596 prior task objects/positions by a fixed snapshot, the proof questions, both word-problem substitutions, the complete two-line construction and the exact intersection.

For №75–109 the oracle checks 3320 assertions; the new browser gate covers 504 prompt/width views, 301 worked steps and all 35 number searches. Wrong signs, unsummed fractions, cancelled domain restrictions, inexact intersections and the wrong requested mass are explicitly rejected. The full DOM suite still walks every one of the 722 tasks and 1955 steps in a single saved-work session; it yields to the event loop every 20 tasks so jsdom can release detached render trees. Source PDF pages and browser screenshots are reviewed separately from these executable checks.
