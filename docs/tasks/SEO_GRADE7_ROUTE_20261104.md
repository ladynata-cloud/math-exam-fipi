# Discover the new public grade-seven geometry route

- Date: 2026-11-04; review SMALL.
- Base: main 5294d0cac871c092739aa0acdeba3d8e64f55164.
- Branch: fix/seo-grade7-route-20261104.
- Authorization: current recurring SEO task, including publication after checks, confirmed by owner on 2026-11-03; OWNER_RELEASE_AUTHORIZATION.md applies. No external review requested.

The published /geometry-course/grade7/ route returns HTTP 200, contains useful static explanations and trainer links, has its own canonical and no noindex. It was absent from the 532-URL sitemap and had no incoming public HTML anchor. Add one descriptive link in the existing grade-seven catalog card and one reviewed sitemap seed, then regenerate sitemap. This fixes discovery; it does not establish a search-engine exclusion reason.

Scope: courses/index.html, tools/seo-public-pages.json, sitemap.xml and this task record. Preserve all mathematics, scripts, styles, canonicals, existing links and learner data. Private board wrappers retain noindex and are not promoted. No account or infrastructure changes.

Acceptance: target reachable through an ordinary catalog anchor; generated sitemap adds exactly this canonical URL; prior URLs retained. Required checks: 12 sitemap tests, sitemap freshness, seo-check, exact diff inspection, git diff --check, applicable cloud SEO/browser checks. Verify fresh main/head before merge, then Pages and live changed files. Record exact head and final check results in PR.

Self-review and ordinary revert rollback suffice for this low-risk static navigation patch. No migration. Current production includes PR418/424 and the grade-seven board release PR430; prior fixes are retained. External review not performed under explicit owner waiver. No new owner decision is required after checks pass.
