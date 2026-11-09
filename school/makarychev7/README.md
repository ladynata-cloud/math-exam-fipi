# Makarychev algebra 7 (2024)

Static course at `/school/makarychev7/`, using the published grade-eight course interaction and shared exact-arithmetic computation practice.

## Coverage

- All 46 numbered topics in six chapters, including the six advanced topics.
- 160 concise theory blocks, 280 tasks and 805 worked steps.
- 92 selected textbook tasks/subparts, each with number and printed page; 188 explicitly labelled authored exercises.
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

The original 276 task journeys and 795 worked steps passed in-memory DOM verification, as did all 46 model mounts and 727 control changes. Tests cover corrupt storage, safe import, cross-course import rejection, assistance history, computation detours, all exercise-range boundaries and mathematical domains. Independent reviews checked all selected PDF conditions and chapter mathematics. Additional independent model probes covered 117649 systems and 1372 half-plane cases.

Desktop browser inspection includes the home page, a worked-step journey and formula-model switching. A 390 px responsive iframe inspection of the half-plane lesson/model showed no horizontal overflow (body width and scroll width both 375 px after scrollbar). Final CI and deployment evidence is recorded in the PR. Physical touch-device behavior, real-pupil sessions, shared-board synchronization and cloud learner storage are not claimed. Claude consultation/review was unavailable; independent agents are not external Claude approval.

## Scope and rollback

Additive course, catalog entry, sitemap seed and scoped CI. Existing foundational grade-seven pages, other courses and learner records are unchanged. Rollback removes these additive entries and the course route; there is no data migration.


## Active learning audit application — 2026-11-09

All 46 topic pages and 20 computation trainers now preserve a bounded journal of
answers, checked steps and used help, with the first submitted answer stored
separately. Empty or unrecognized numeric input and a correct value in the wrong
requested representation do not consume a mathematical attempt. Result labels
distinguish first-attempt independence, assistance, independent correction and
familiar conditions. Historical results without explicit assistance provenance
remain unknown and cannot become verified independence on reload or import.

Ten authored model-family investigations use a written prediction, a real
parameter change and a checked explanation. Formula, table and graph continue
to use the existing mathematical model. Numeric fields supplement sliders;
parameters, system presets and equation transformation stages survive return
and reload. The model starts after the prediction. Changing it invalidates the
previous explanation check. Model completion never awards independent task
credit. This is ten reusable family investigations across 46 topics, not 46
new independently authored investigations.

After help or correction, the next action selects an untouched, distinct
condition in the same topic, or a new generated computation example. If no new
condition remains, familiar review creates a separate `review:<task>:<seed>`
record without overwriting the original answer, notes or completion. Review is
not independent mastery. The five-day reminder is a MathExam product choice,
measured from the latest known successful topic attempt; no date is fabricated
for historical work. Learner validation of this interval is still outstanding.

When embedded in a frame, the native course is a demonstration with ephemeral
state. It does not read or overwrite personal localStorage and does not import
or export personal work. This does not implement shared-board synchronization.

`test-audit.cjs` verifies the new behavior in JSDOM, including all 46 topic
entry points, ten investigation families, recovery, repeated attempts,
historical provenance and a same-origin iframe storage sentinel. Run it with
the same jsdom dependency as `test-ui.cjs`. The original 276 problems, 795 steps,
number mapping and answer keys are unchanged. External provider review and a
real-pupil pilot have not been performed.

Rollback must retain the sanitizer and support for new `learning`,
`provenanceKnown`, timestamp and `review:` records. Reverting to a serializer
that drops these fields would lose learner work on the next save; use a
corrective release or presentation-only rollback instead.
