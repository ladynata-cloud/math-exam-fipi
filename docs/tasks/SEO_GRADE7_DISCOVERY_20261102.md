# Public discovery of two grade-seven geometry courses

## Identity and approval

- Date: 2026-11-02.
- Task: fix the confirmed public HTML navigation gap found in the requested SEO audit.
- Base: `main`, `cf7b101aa09df93a5cd5e66e3ee52900b8a942ea`.
- Branch: `fix/seo-grade7-discovery-20261102`.
- Review level: `SMALL`; static navigation only, no architecture change.
- Approval: the current owner request explicitly authorizes confirmed SEO fixes,
  tests, commits, push and a separate Draft PR. It explicitly reserves publication
  for a separate decision; that task-specific restriction governs this PR.

## Evidence and scope

Both `/geometry-course/first-steps/` and
`/geometry-course/ichenskaya-7-works/` are published, return HTTP 200, have their
own HTTPS canonical, allow indexing and appear in the 531-URL sitemap.
Neither has a normal HTML link from the public geometry or grade-seven catalog.
The only public HTML link to first-steps comes from Ichenskaya; Ichenskaya has
no incoming HTML anchor among the sitemap pages. This is a discovery and
navigation gap, not proof of a search engine's exclusion reason.

Add ordinary, descriptive links from both existing catalogs. Update the
geometry catalog generator as well, so regeneration retains these entrances.
Keep all course content, scripts, styles, canonicals, sitemap, stored answers,
accounts and hosting unchanged. No search-account data belongs in this PR.

## Acceptance and validation

- Both target courses are reachable from each catalog with JavaScript disabled.
- Existing navigation and metadata are retained.
- Generator and published catalog source contain the same two added links.
- `python3 tools/seo-sitemap.test.py`: 12 tests passed.
- `python3 tools/build-sitemap.py --check`: 531 canonical URLs, unchanged.
- `python3 tools/seo-check.py`: public entrances, links and canonical checks passed.
- `node tools/seo-catalog.test.cjs`: static/rendered parity and destinations passed.
- DOM inspection with scripts disabled: both links present in both catalogs.
- `git diff --check`: passed.
- `tools/seo-entrypoints.browser.cjs`: not completed locally; Chromium launch
  is blocked by the environment (`socket() failed: Operation not permitted`).
  The existing Public SEO and sitemap workflow runs this check in GitHub.
- Ancillary tracking check: six `lesson-funnel.test.cjs` tests passed. The
  historical `lesson-funnel-static.test.py` could not compare its hard-coded
  old base in the shallow checkout; it is not a gate for this navigation patch.

## Review, risk and rollback

Self-review: exactly four navigation links and their generator representation;
no executable code or learner storage changes. External review not performed
and not required for SMALL. The risk is limited to catalog layout and link
placement. Rollback is an ordinary revert of this scoped change; no data
migration or cleanup is needed.

## Handoff

Draft PR only. Record exact head and cloud checks in the PR description.
Merge and deployment are not authorized by this task's explicit restriction.
