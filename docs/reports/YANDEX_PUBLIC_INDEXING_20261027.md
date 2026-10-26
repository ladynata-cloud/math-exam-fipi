# Public Yandex SEO audit and prepared metadata correction

Date: 2026-10-27 (Asia/Novosibirsk), audit completed 2026-10-26 19:59 UTC.
Base: `e50fcfb7ffe4a99447ee18e4d2ca2f937cd1dd68`.
Scope: [YANDEX_PUBLIC_INDEXING_20261027](../tasks/YANDEX_PUBLIC_INDEXING_20261027.md).

## Published baseline

- All 529 reviewed sitemap URLs returned HTTP 200 at their expected HTTPS URLs.
  All HTML bodies matched the base source. This proves availability, not indexing.
- `robots.txt` and XML sitemap respond successfully; the sitemap matches source,
  contains unique HTTPS URLs and is declared in `robots.txt`.
- No missing local link targets or insecure internal links were found by the
  static audit. All 529 pages have mobile viewport metadata and no page-level
  robots prohibition. This is not a visual mobile or Core Web Vitals certification.
- HTTPS and the www-to-apex redirect work. A deliberately nonexistent path
  returns a real 404. HTTP requests to the home and lesson pages still return 200
  without redirecting to HTTPS.
- The 30 existing SEO entrances pass their distinct title, description, canonical
  and social metadata checks. Six topic explanations remain static, with their
  existing structured data and valid local links.

## Prepared correction

- 455 previously missing canonical declarations identify the HTTPS document.
- The body-identical task-19 alternative points to `/trainers/task19-trainer.html`,
  the existing learning-plan/download entry. Neither route is deleted and neither
  route's existing script integrations are changed.
- The existing generator removes only that alternative from the sitemap: 529 to
  528 URLs. Every remaining sitemap page now has exactly one self-canonical.
- Ten basics trainers expose the title and topic lead already present in their
  `SPEC`, without waiting for JavaScript. Two triangle trainer titles distinguish
  the first and second congruence criteria.
- All 455 changed documents retain executable scripts, styles and indexing
  directives. Body content is byte-identical, with one formatting exception:
  removal of a trailing space after `</html>` in the minified decimal trainer.

## Validation

- Sitemap exclusions and canonical-route tests: 12 passed.
- Generated sitemap check: 528 public canonical URLs, no unexpected additions.
- The existing SEO gate now requires a self-canonical on every sitemap entry,
  catching metadata loss in future generator rebuilds.
- SEO entrance check: 30 distinct entrance sets, six static topic pages,
  191 valid local links, 553 canonical declarations and four consistent refreshes.
- Existing SEO preservation check: all 24 covered entrances pass against base.
- Full changed-document comparison: all 455 documents pass the narrower metadata
  scope and preserved scripts/styles/body/directive checks described above.
- Catalog parity: three catalogs pass; 69 existing destinations are available
  before JavaScript.
- Lesson funnel: six Node tests and two static tests pass.
- Initial cloud CI identified two additional metadata dependencies. The
  stereometry generator now emits the same canonical as its published HTML.
  Its rebuild is byte-identical. The percentage preservation check now requires
  the exact self-canonical and removes only that literal addition before checking
  the original immutable hashes. No historical fixture/hash was updated.
- Percentage preservation: four tests pass, including seven rejection cases
  across each of six trainers for missing/wrong/duplicate canonicals, canonical
  outside head, injected script, noindex and changed learner content.
- All 35 existing OGE basics contextual-help/state tests pass. Cloud reruns are
  recorded in the PR; the initial failed runs are not presented as successes.
- `git diff --check`: passes after retaining original CRLF lines and fixing the
  one trailing-space case. Initial whitespace findings were resolved, not waived.
- Initial local jsdom resolution was unavailable; catalog checks then passed
  using the installed jsdom dependency. Git CLI push authentication is unavailable;
  publication uses the connected GitHub integration.
- No new mathematical or browser interaction tests: executable code, CSS and
  learner content did not change. No post-deployment claim before release.
- Gate: `YANDEX_PUBLIC_INDEXING_OK` (local). Exact-head cloud CI is recorded in PR.

## Operational and content follow-ups

1. Enable **Enforce HTTPS** in GitHub Pages settings, then verify HTTP-to-HTTPS
   redirects for the home page and a nested route. The available repository
   connector does not expose this hosting-setting mutation.
2. After release, verify deployed bytes and the 528-entry sitemap. Reconcile
   sitemap registration and crawl requests in Webmaster before any repeat POST.
   A crawl request, successful crawl and inclusion in search are separate facts.
3. Five remaining duplicate-title clusters concern finance, vectors, two
   Pogorelov atlas lessons, rounding and Turing variants. Their implementations
   differ. Review intended public routes and actual content before consolidation;
   this patch does not guess that a similar title makes a route obsolete.
4. 425 existing pages still lack a custom meta description. This is a content
   improvement backlog, not evidence that those pages cannot be indexed. Prioritize
   real search/landing data once available and write accurate topic-specific text.
5. Do not add invented reviews, ratings, physical addresses, keyword lists,
   robots Host directives or artificial sitemap modification dates.

Public references:
- [Yandex: canonical URLs](https://yandex.ru/support/webmaster/ru/robot-workings/canonical)
- [Yandex: title and description duplicates](https://yandex.ru/support/webmaster/ru/indexing-options/title-description-doubles)
- [GitHub Pages: enforce HTTPS](https://docs.github.com/en/pages/getting-started-with-github-pages/securing-your-github-pages-site-with-https)

## Handoff

The Draft PR carries the exact base/head, full validation and release decision.
No merge, auto-merge or deployment is performed as part of the PR workflow.
Private account reports, credentials and local machine paths are excluded.
