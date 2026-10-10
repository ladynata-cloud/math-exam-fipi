# Public SEO and topic discovery

## Identity

- Task: `SEO_DISCOVERY_20261011`
- Owner: repository owner
- Date: 2026-10-11 (Asia/Novosibirsk)
- Base branch: `main`
- Verified base SHA: `b0b2fe8e4d2cbf15426a9a314674bf7a2edce4f9`
- Branch: `feat/seo-discovery-20261011`
- Review level: `MEDIUM`
- Related ADR: none; no application architecture change.

## Goal and owner instruction

The owner asks to configure mathexam.space for SEO so potential users can
find the project. Preserve OGE as the main public direction. Implement the
bounded, reviewable technical and content changes and verify publication.

Current owner request authorizes implementation. Prior user context confirms
standing authorization dated 2026-09-03 for commits, push, PR, merge and
production publication after successful checks, without another per-step
permission request. Later restrictions on specific unrelated PRs do not expand
this scope. No Claude or external AI-review is requested; focused independent
internal review is used. This task grants no access to private search-console
accounts and no permission to change any other PR.

## Context and production reconciliation

- Authoritative remote main at task start is the base above and contains the
  Soviet-math course merge #237. Prior task/release checks are not re-claimed.
- Published homepage and main course entrances return HTTP 200.
- Published robots.txt allows public crawling and points to sitemap.xml.
- Published sitemap matches the source file: 244 existing URLs, with omitted
  current public hubs and stale July lastmod values.
- Of the original sitemap pages, 208 lacked description and 219 lacked
  canonical. These omissions are not themselves prohibitions on indexing.
- Search Console and Yandex verification status cannot be inferred from HTML:
  DNS verification is possible. No private search statistics were accessed.

## Scope

### Included

- Metadata on 24 existing public course/catalog/trainer entrances: title,
  description, canonical, Open Graph and Twitter summary. WebSite/Person
  JSON-LD on the homepage uses only facts already visible on that page.
- Six static HTML pages under `topics/`: one directory and five substantive
  explanations, with worked mathematics and links to existing trainers.
- Shared topic-page stylesheet; no new runtime JavaScript or dependencies.
- One bounded homepage topic-links section and an OGE-first correction of
  the stale course-catalog introduction/featured card. All courses retained.
- Repeatable sitemap generation from explicit public seeds and allowed link
  paths, exclusion tests, metadata/link/preservation checks, read-only PR CI,
  and maintenance documentation.
- Operational status entry for this task.

### Excluded and preserved

- Learner task banks, solutions, application scripts/styles and progress.
- Accounts, credentials, parent/student data, cabinet/backend contracts.
- Existing URL paths, book links, personal or noindex/archived pages.
- Domain/DNS settings, hosting configuration, paid advertising and analytics
  identifiers. No search-account registrations or verification are claimed.

## Acceptance and checks

- 30 public entrances (24 existing + 6 new) have unique title/description,
  consistent canonical/social metadata and parseable structured data.
- Every new page works as static HTML; one H1, unique IDs, valid local links
  and fragments, and direct links to the existing training routes.
- Existing executable scripts and styles are identical to the base.
  Existing HTML bodies are identical except the two scoped public catalogs.
- Sitemap contains no duplicate, missing, noindex, private or redirect URLs;
  real existing canonical declarations are respected. No invented dates.
- Generator/checker and six exclusion/canonical black-box tests pass.
- Independent internal review verifies all mathematical examples and scope.
- Relevant existing CI passes for the reviewed head before publication.
- Verify authoritative main immediately before integration, retain concurrent
  work, and verify Pages plus actual public assets after publication.

Commands:

```bash
python3 tools/build-sitemap.py --check
python3 tools/seo-sitemap.test.py
python3 tools/seo-check.py --base b0b2fe8e4d2cbf15426a9a314674bf7a2edce4f9
git diff --check
```

Final local marker: `SEO_ENTRANCES_OK` and `SEO_PRESERVATION_OK`.
The PR records final head, exact checks, independent review and release state.

## Risk and rollback

The main risks are incorrect canonical targets, accidental inclusion of
nonpublic pages, stale sitemap output and unintended learner-runtime edits.
Explicit seeds, exclusion tests, base preservation checks and independent
review cover these risks. Topic pages add no storage or runtime integration.
Rollback is an ordinary revert of this task's merge; no migration is needed.

Browser-rendered visual QA is not claimed in the local static review. The
existing relevant browser CI still runs on the changed trainer/course entries.
HTTP verification of every historical sitemap entry is not claimed; local
existence and indexing directives are checked for every emitted URL.

## Permissions and handoff

- Branch, scoped edits, local checks, commit, push, Draft PR: authorized.
- Checked publication: covered by the standing owner instruction above.
- Force/reset/rebase, weakened gates, unrelated branch or account edits: not
  authorized and not used.
- External messages, paid services or unsolicited recurring jobs: not included.

The source specification is a task record, not evidence of external review.
Use the PR's final executive report for head/gate/publication evidence.
