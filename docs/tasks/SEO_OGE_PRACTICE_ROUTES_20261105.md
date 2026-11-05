# ОГЭ: от пробника к разбору и самостоятельной практике

## Identity and authorization

- Date: 2026-11-05; owner: MathExam.
- Base: `main`, `0d96ad84f0dd9dcadf123b3845db75c5476be93a`.
- Branch: `feat/seo-oge-practice-routes-20261105`.
- Review: **SMALL**, static learning guidance and links in two existing pages.
- Owner requested immediate SEO/usability improvements in the current task.
- Branch, commit, Draft PR, checked merge and publication are authorized under
  [OWNER_RELEASE_AUTHORIZATION.md](../OWNER_RELEASE_AUTHORIZATION.md).
- No architectural change or external provider review; external review waived
  by standing owner policy. No delegation or paid consultation performed.

## Goal and evidence

Give a pupil arriving at the OGE PDF catalogue a useful next step after finding
an error, and connect the existing geometry explanation to prerequisite study,
targeted practice and a mixed paper. These are content/navigation improvements,
not a claim that a technical indexing block or ranking increase was proven.

The published catalogue already provides 104 variants and 315 PDF links but
does not explain how to choose remedial practice. The geometry topic page has
two worked examples and a generic route paragraph. PR441 separately covers
trainer return navigation; PR442 covers the home/OGE/catalogue structure.
Neither PR modifies the two pages in this task. Existing releases and their
canonical choices are retained; no status-only PR is required.

## Approved scope

- Two native, keyboard-accessible disclosure sections in the PDF catalogue:
  how to practise and where to go after an error. Content is in source HTML.
- Specific routes from the geometry topic to the first steps, grade 7,
  task 15–19 trainers and the existing OGE variant catalogue.
- Preserve all existing titles, descriptions, canonical tags, worked examples,
  PDFs, 104 cards, filter script, student storage and account settings.
- Do not edit the concurrent PR441/442 files, add new URLs, change noindex,
  force indexing, or treat an accepted indexing request as an indexed page.

## Acceptance and checks

- Existing SEO/sitemap tests and generator freshness check pass.
- All internal link destinations exist; new routes remain available without JS.
- Original PDF hrefs, variant cards, script bodies and SEO metadata stay identical.
- Inspect disclosures at mobile/desktop widths and test the existing catalogue
  filters; run applicable GitHub Public SEO and OGE catalogue workflows.
- Inspect final diff and `git diff --check`; record exact checks and release
  hashes in the PR. Gate: `SEO_OGE_PRACTICE_ROUTES_OK`.

## Review, risks and rollback

Self-review checks that each link matches its learning purpose and that no
exam promises, invented availability or new mathematical claims are added.
Live-pupil learning outcomes and ranking effects are not measured by these tests.
The primary risk is increasing reading burden: guidance is optional and
collapsed, while the existing downloads and filters remain accessible.
Rollback is a normal revert of this bounded commit; no migrations or user-data
changes exist. Before merge, recheck remote main/head, revalidate any drift,
then verify deployment and byte identity of both live HTML pages.

## Local execution evidence

- 12 sitemap tests passed; sitemap freshness and SEO checks passed (533 URLs,
  199 local links, 850 canonical declarations, 151 refresh destinations).
- Static/JavaScript catalogue parity passed (71 valid destinations).
- PDF check passed: 104 variants, 315 PDF files, 2600 task/solution headings,
  1084 individual/collection page comparisons.
- Exact before/after comparison preserved metadata, script bodies and all PDF
  hrefs. Both changed HTML files have valid local link destinations.
- Chromium 140: actual disclosure opening, keyboard Enter, geometry link click,
  course link visibility, absence of horizontal overflow and catalogue filtering
  passed at 320, 390 and 1280px, with JavaScript enabled and disabled (six runs).
  Mobile screenshots were inspected. The default Playwright browser version
  was not installed; the existing Chromium executable was explicitly selected.
- Gate: `SEO_OGE_PRACTICE_ROUTES_OK`; no failing content/static/browser checks.
- Release CI and publication evidence are recorded in the PR, not presumed here.
