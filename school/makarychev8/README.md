# Makarychev algebra 8 (2024)

Static course at `/school/makarychev8/`, built around the existing Peterson course interaction and shared exact-arithmetic practice module.

## Coverage

- 51 topics in six chapters, including the six advanced topics.
- 172 short theory blocks, 306 tasks and 958 worked steps.
- 102 selected textbook tasks/subparts with number and printed page, plus 204 explicitly labelled authored exercises.
- Exercise navigator for all 1340 numbers. It distinguishes existing solutions from topic links; it does not claim solutions to every numbered exercise, every subpart, or the advanced problem bank.
- Six interactive model families and 20 computation practice skills, three difficulty levels, preserved return to the original task.

The uploaded textbook PDF is not copied into this public directory. Source structure is recorded in `source-map.json`. Selected source conditions and all authored explanations are in the chapter JSON files. Regenerate `data.js` with `node school/makarychev8/build.cjs` after editing content.

## Behavior and dependencies

The browser loads the existing `../peterson6/math.js` for exact rational arithmetic and generated computation practice. No external CDN or account is required. The new course has its own storage key; it does not modify any previous course progress. Results are local to the browser, with JSON export/import. Existing populated task records take precedence over imported ones, preserving notebooks, steps and assistance history.

Symbolic answers accept the forms and aliases recorded in content, with harmless notation normalization. This is not a general computer algebra system. Numeric answers accept exact equivalent fractions and decimals; root sets are unordered. Ordered pairs use explicit text formats.

## Verification

Run `test-course.cjs`, `test-models.cjs`, and `test-state.cjs` with Node. `test-ui.cjs` and `test-import.cjs` additionally require jsdom 26.1.0. The workflow installs that dependency in an isolated temporary directory.

On 2026-10-24, all 306 task journeys and 958 worked steps passed in-memory DOM verification. State/recovery, draft import, computation detours, source-search boundaries and model-domain contracts passed. Independent content review covered all chapter answers and selected PDF source conditions. Reproducible fixes included Vieta-specific steps, signed-difference wording, speed domain restrictions, decimal-unit wording, and import draft preservation.

Browser visual QA is **not completed**: the cloud browser policy rejected the preview observation. No mobile screenshot, pixel-level layout, real-pupil validation, live board synchronization or cloud learner-storage claim is made. Claude consultation/release review was not run; no configured local Anthropic API credential or suitable connector was available. Independent agents are not an external Claude approval.

## Release boundary

This task adds the course, catalog entry, sitemap entry and scoped CI workflow. It does not create cabinets or register a shared-board adapter. Deployment awaits the separate repository-owner release decision required by the repository workflow.
