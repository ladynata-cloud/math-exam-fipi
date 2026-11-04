# Makarychev algebra 7 (2024)

Static course at `/school/makarychev7/`, using the published grade-eight course interaction and shared exact-arithmetic computation practice.

## Coverage

- All 46 numbered topics in six chapters, including the six advanced topics.
- 160 concise theory blocks, 276 tasks and 795 worked steps.
- 92 selected textbook tasks/subparts, each with number and printed page; 184 explicitly labelled authored exercises.
- Navigator for all 1247 exercise numbers, with exact header-page mapping. It distinguishes available solutions from links to matching topics. Individual solutions are not claimed for every exercise or subpart.
- Ten interactive model families: number line, expressions, equations, functions, powers, divisibility, polynomials, identities, systems and half-planes.
- Twenty computation skills at three levels, with return to the same task, unfinished input and notes.

The uploaded textbook PDF is not published here. Source structure is in `source-map.json`; selected source conditions and original explanations are in four chapter JSON files. Regenerate `data.js` with `node school/makarychev7/build.cjs`.

## Behavior

The existing `../peterson6/math.js` supplies exact rational arithmetic and generated computation practice. No CDN or account is needed. The grade-seven storage key and export envelope are isolated from other courses. Work is browser-local, with JSON export/import; populated local task records take precedence over imported ones so drafts, steps and assistance history remain intact.

Symbolic answers accept recorded forms and aliases with notation normalization, including superscript powers and ordinary caret notation. This is not a general algebra system. Numeric answers accept equivalent fractions and decimals. Ordered pairs preserve coordinate order and use explicit separators; commas are not accepted as an ambiguous alternative to decimal notation.

Models display their domains. The system graph explorer uses y = kx + b; vertical lines and zero-coefficient cases are covered in theory and tasks. Algebra kernels also classify degenerate systems. Progress distinguishes independent and assisted first success; later hints do not rewrite the original success record.

## Verification

Run `test-course.cjs`, `test-models.cjs` and `test-state.cjs` with Node. `test-models.cjs --dom`, `test-ui.cjs` and `test-import.cjs` additionally require jsdom 26.1.0. CI installs this dependency in a temporary directory.

All 276 task journeys and 795 worked steps passed in-memory DOM verification, as did all 46 model mounts and 727 control changes. Tests cover corrupt storage, safe import, cross-course import rejection, assistance history, computation detours, all exercise-range boundaries and mathematical domains. Independent reviews checked all selected PDF conditions and chapter mathematics. Additional independent model probes covered 117649 systems and 1372 half-plane cases.

Desktop browser inspection includes the home page, a worked-step journey and formula-model switching. A 390 px responsive iframe inspection of the half-plane lesson/model showed no horizontal overflow (body width and scroll width both 375 px after scrollbar). Final CI and deployment evidence is recorded in the PR. Physical touch-device behavior, real-pupil sessions, shared-board synchronization and cloud learner storage are not claimed. Claude consultation/review was unavailable; independent agents are not external Claude approval.

## Scope and rollback

Additive course, catalog entry, sitemap seed and scoped CI. Existing foundational grade-seven pages, other courses and learner records are unchanged. Rollback removes these additive entries and the course route; there is no data migration.
