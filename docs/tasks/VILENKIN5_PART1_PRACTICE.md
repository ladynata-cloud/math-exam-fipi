# Vilenkin grade 5 part 1 and arithmetic practice

Owner: Наталья Михайловна. Date: 2026-10-23 (Asia/Novosibirsk).
Base: `8a774d65dba0dfe01e4e5c86172ced1e73f3e36c`.
Branch: `course/vilenkin5-part1-practice`. Review: HIGH.

## Requested outcome

Create an interactive course from the supplied Vilenkin grade5 part1 textbook
(Prosveshchenie,2023,third revised edition). A learner who struggles with a
calculation can practise different examples of that calculation and return to
the original problem with their work preserved.

Cover all24 main topics, four applications and an entry recap. Each module has
original explanations, an interactive model, three worked examples, varied
practice and five reserved independent check items. Source page navigation is
distinct from automatically checked original solutions; this is not a claim to
solve every numbered textbook problem. Preserve the existing grade5/grade6
school courses and the newly published grade6 part1 course.

## Arithmetic practice

Reuse the established static trainer approach and exact rational answer parser.
Provide natural-number families for place values, tables, addition, subtraction,
multiplication, division, remainders, action order, powers, divisibility and units.
Offer three difficulty levels, fresh generated examples, contextual hints and
small retained steps. Opening help never advances a problem. A separate dialog
preserves the original course DOM, draft, current step and recorded assistance.
Independent results are distinguished from corrected and assisted results.
Separate bounded localStorage retains the arithmetic session; no account or
shared classroom protocol is introduced.

## Scope and technical checks

New isolated route `/courses/vilenkin-5-part-1/`, course catalogue and sitemap
entry, portable offline edition, supplied source page links. No backend, account,
permission, hosting setting or unrelated course edits.

Checks: source TOC/pages; lesson schema and fresh checks; independent generated
arithmetic oracles; DOM routes and controls; draft/step/assistance retention;
invalid and oversized input; corrupted storage/import; stale callbacks; offline
reproducibility; static SVG inspection; SEO/sitemap and diff checks. Browser
visual testing is unavailable after the managed browser policy block and is not
claimed as completed. Do not bypass that block with another browser mechanism.

## Review status

The preceding bounded Anthropic request returned HTTP400 insufficient credit
at23:25:28UTC on2026-10-22 (PR306,job120147261116). Its balance condition remains
unresolved, so no automatic paid retry is made. Design consultation and external
review for this new course are unavailable, not approved. The earlier explicit
review exception covered the grade6 release only. Continue useful preparation,
independent review and all technical gates; any required release exception must
be explicit for this task. The user's creation instruction authorizes preparing
the result and a Draft PR. No separate release approval is invented.

## Risk and rollback

Main risks are incorrect arithmetic explanations, confusing step size, losing
the original task on a practice detour and misstating independent success.
Keep source and remediation progress in separate keys and preserve unknown or
invalid old storage without overwriting it. Roll back only this additive route
and catalogue/sitemap entries; do not delete learner records.

## Completed preparation

29modules;87worked examples;522authored tasks;236retained worked steps. The
source navigator has151page entries and34original check references, explicitly
labelled as a page index.27distinct models are used across29lesson screens;
28models are implemented and independently checked.

Independent content review checked all29modules. Clarified day/time wording,
passenger seats and fence openings; specified nonzero factors and nonnegative
subtraction conditions. Corrected the path model to an invariant distance scale
and multiplication partial rows to omit unused leading cells. Integer input
accepts correctly grouped thousands without confusing mixed fractions.

Passed:9900generated practice tasks/40207step invariants, independent16500answer
cross-check,33arithmetic setting flows,116course views/29model mounts/72controls,
storage/import/quota/reload/provenance/return/stale-submit cases, source/topic
schema, six sitemap tests, sitemap518URLs, SEO entrances and diff check.
Vector inspection covered54default/extreme images and subsequent repaired
views; formula additionally checked all66speed/time combinations. These are
technical checks and independent agent reviews, not a real-pupil pilot,
browser viewport QA or external Claude approval. Actual exact-head CI and
release evidence will be recorded in the single task PR.
