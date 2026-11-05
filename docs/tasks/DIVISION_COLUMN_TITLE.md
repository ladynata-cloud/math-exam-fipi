# Division column title — 5 November 2026

## Identity and approved scope
- Owner request: «может быть вообще заменить название тренажеров по делению? Деление столбиком (уголком)?»
- Base: main, cdbb3aecd1e1b2087f6ee6c858ffcaa031c55bc8.
- Branch: codex/division-column-title-20261105.
- Review level: SMALL; bounded presentation-only wording.
- Goal: use «Деление столбиком (уголком)» consistently in the main division entrances while retaining distinctions between stepwise, notebook and independent practice.
- Scope: page titles/headings, catalogue labels and search text, homepage/topic/course/OGE/lesson links, navigator display strings and division course label; refresh the generated inventory source hash.
- Excluded: addresses, canonical URLs, IDs, query/fragment contracts, search-recognition tags, mathematics, exercise generation, storage, layout, immutable book editions and archive/prototype pages.
- No architecture change or ADR is applicable.

## Authorization
The current owner request approves this bounded change; branch, commits, push and Draft PR are in scope. Publication follows [OWNER_RELEASE_AUTHORIZATION](../OWNER_RELEASE_AUTHORIZATION.md) after applicable checks. No external provider audit was requested or performed.

## Acceptance and checks
- Main title: «Деление столбиком (уголком) — пошаговый тренажёр | MathExam».
- Static and JavaScript catalogue cards use matching new labels.
- HTML route and structural attributes (href/src/id/name/action/type) unchanged; JSON-LD parses.
- Navigator display strings updated; recognition tags and destination URLs unchanged.
- 43 existing navigator regression cases pass, JS syntax checks pass, whitespace diff check has no diagnostics.
- Required CI: relevant SEO, guided-division and navigator workflows plus other path-triggered checks.
- Cloud browser checks, exact pre-merge main/head and production verification are recorded in the PR.
- Gate: DIVISION_COLUMN_TITLE_OK after successful applicable CI.
- Full local checkout was unavailable during initial preparation; source patch and checks used exact-base files retrieved through GitHub. Full repository checks run in cloud CI. No new mirrored implementation tests were added.

## Risk and rollback
Longer headings may wrap on small screens; existing cloud mobile/browser checks apply.
A normal revert of this release restores wording. No data migration, URL change, or mathematical behavior change.
Release record and final authoritative base/head/deployment evidence are kept in the PR.

## CI findings and necessary repair
Initial CI passed the SEO, navigator and guided division checks. The arithmetic inventory correctly detected the changed course-map source hash; only sourceSHA256 is refreshed, with all entries and counts unchanged.

The fixed-book generator check exposed an existing integration problem on base cdbb: the newly installed public navigator added three optional live-site assets to future book candidates (229 instead of the required 226). The current patch had not changed the generator/test. Exclude exactly navigator-data.js, navigator-widget.js and widget.css through the existing REMOVED mechanism, and add sanitizer plus dependency-closure regressions. The 226-file assertion and immutable book integrity remain strict; published book/** files are unchanged. The sanitizer regression fails against the original generator and passes against the repair; four targeted tests and syntax checks passed locally. Full build and browser verification run in cloud CI.
