# SEO_SKILL_ENTRANCES_20261124

- Owner: MathExam project owner; current conversation approved execution.
- Date: 2026-11-24 (Novosibirsk).
- Base: main `f3fa3209fc5a666acdf52a063281a09fb26a18cc`.
- Branch: `seo/skill-entrances-20261124`; review level MEDIUM (four public HTML pages; no trainer runtime change).
- ADR 0001 remains Proposed.

## Goal and evidence

Follow the independent Claude design consultation from 2026-11-23 UTC (not exact-head approval): connect school-skill search queries with existing public learning material. Repository main contains 631 sitemap URLs; robots.txt permits crawl and declares the sitemap. The four target pages have self-canonicals and meaningful static HTML. The grade-five outlines already exist; keep their generated main mounts unchanged. PR #740 separately handles division/methodology and is not merged; avoid changing its content files. Yandex and Google impressions/clicks are not established by this repository inspection.

## Approved scope

Improve the existing fraction and percent explanation pages (metadata, examples, self-check and relevant contextual links), link from the two existing grade-five courses through their persistent footer, and maintain exact navigator source bindings. Add targeted regression checks in the existing course-entrances suite. No new public URLs, no modifications to sitemap/robots, original routes, lesson engines, maps, banks, board, storage, account, services, analytics, dependencies or deployment configuration. Do not publish on external platforms or call paid APIs.

## Acceptance and review

- Static source retains one H1, exact canonical and navigator pair; topic metadata and JSON-LD agree.
- All newly linked destinations exist in main sitemap; Peterson fragment IDs are present in static outline. Generated grade-five main mounts remain byte-identical. Footer links are present both before and after app boot (browser confirmation pending).
- Fraction answers 11/12, 17/24, 2/3, 5/6; percent answers 30, 300, 30%; repeated price change 1200 → 1020 → 1173.
- Existing SEO, course entrances, public navigator and applicable workflow checks required before release. Gate SEO_SKILL_ENTRANCES_READY is NOT asserted until exact-head checks complete.
- Consultation was general SEO advice, no external final audit and no real-student evidence.
- Rollback: revert the scoped PR; no migration. Publication policy: docs/OWNER_RELEASE_AUTHORIZATION.md; no merge until checks and current base verification, honoring any later owner restriction.

## Technical audit notes

Source robots.txt and sitemap.xml exist; live fetch of those endpoints and interface sitemap status still require independent verification. Geometry directory canonical is correct in source; NOT_CANONICAL for index.html alone is not a defect. Do not combine robots disallow and noindex for the same removal workflow. No duplicate new landing pages; later stages: query data, other skills, exam entries, dissemination drafts.

## Execution record

Source checks and arithmetic assertions performed in connector scripting; full repository local checkout and browser/CI not yet performed. Exact source and binding commits, PR status and release blockers are recorded in PR.

## Follow-up after PR #740 (2026-11-24)

New validated base for this candidate: `eb1203bad1736cd74a0be125ed2860fcb088b7c0`. Owner requested implementation of the Fable recommendations, subject to evidence. Keep this existing PR and retain the three original HTML changes to fractions, percentages and Peterson. Restore Vilenkin part 1 index and its binding to current main: its generated offline artifact failed the byte reproducibility gate when title/footer changed. Move contextual learning entry to the already public full Vilenkin 5 course overview instead; preserve both generated main mounts and offline bundle. Scope is amended accordingly (four public pages). Keep the static link regression, adapting the expected origin and adding the divisibility and fractions destinations. Preserve all published #740 files and bindings; no change to sitemap, robots, course runtimes, learner data or analytics. Source metadata shows Google sitemap was last processed before #740; fresh live HTTP verification is still unavailable. Search-data-based selection and external distribution remain separate measurement and editorial work, not grounds to invent more pages. No paid calls, no scheduled tasks.

Release gate: rerun applicable exact-candidate CI. Do not weaken the offline check or claim live verification.
