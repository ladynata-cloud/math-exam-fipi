# SEO_CANONICAL_COURSE_AUDIT_20261025

## Identity and authorization

- Date: 2026-10-25, Asia/Novosibirsk.
- Repository: `ladynata-cloud/math-exam-fipi`; base branch: `main`.
- Inspected base: `fbacc5b14cca8f698733212c91823ff82437e65b`.
- Branch: `fix/seo-canonical-course-audit-20261025`.
- Review level: `SMALL`: mechanical metadata, discovery links and validation;
  no application runtime, architecture, learner data or hosting changes.
- The current owner request explicitly authorizes the audit, confirmed fixes
  in GitHub, relevant tests and reviewable preparation for publication. This is
  the current task START and authorization for branch, commit, push and Draft PR.
- Merge, auto-merge and deployment are not part of this authorization.

## Goal and evidence

Distinguish intentional canonical alternatives from technical contradictions
and discovery gaps in new courses. Inspect the available Search Console
notification, public responses and repository evidence; do not infer Google's
actual excluded URL list or selected canonical from static HTML.

See [audit](../SEO_AUDIT_2026-10-25.md) and its public evidence files. The existing
520-URL sitemap and original six regression tests passed before this change;
the old checks did not cover canonical/refresh conflicts in omitted redirects.
Current source and public responses, not older project-status summaries, are
the evidence for this task. In particular the base contains the subsequently
published course/board integrations, including PR334.

## Approved scope

- Correct two canonical/meta-refresh contradictions.
- Remove a fragment from a noindex board wrapper's canonical only.
- Add four already-public course entrances to the sitemap manifest and map.
- Add ordinary public-catalog links for Peterson 6 and Merzlyak 10.
- Extend existing SEO validation and regression tests for these error classes.
- Record exact URLs, before/after behavior, limitations and public evidence.

Preserve correct canonicals, all noindex directives, existing redirects and
board navigation. Do not add hash task states to the sitemap. Do not change
sealed textbook implementations, accounts, runtime contracts, content,
authentication or GitHub Pages HTTPS settings.

## Acceptance criteria and checks

- [x] Existing correct homepage/course canonicals remain unchanged.
- [x] Two legacy redirect declarations agree with their destinations.
- [x] Atanasyan board wrapper keeps noindex and task navigation.
- [x] Sitemap changes consist of exactly four additions, no removals.
- [x] Peterson/Merzlyak have ordinary anchors from `/courses/`.
- [x] Existing and new regression checks pass.
- [ ] Authenticated GSC excluded-URL list and Google-selected canonicals read.
- [ ] Final published PR cloud-check results recorded in the PR.

Required local commands:

```sh
python3 tools/build-sitemap.py --check
python3 tools/seo-sitemap.test.py
python3 tools/seo-check.py --base fbacc5b14cca8f698733212c91823ff82437e65b
git diff --check
```

The prepared sitemap has 524 canonical URLs. Twelve regression tests pass;
the validator checks 30 entrances, 167 local links, 92 public-path canonical
declarations and four refresh destinations. A separate byte comparison of all
three changed trainer files confirms only their canonical tags changed.

## Review, risk and rollback

Independent focused internal review found no blocking issue. External-provider
review is optional for SMALL and was not requested; no external verdict is
claimed. No trainer teaching or interaction change requires consultation.

Risk: a metadata correction could select a wrong destination. Each destination
was checked in source and by public GET; the course and board runtimes are
unchanged. The guard deliberately requires exact redirect/canonical agreement;
future query-bearing or equivalent-alias redirects may need deliberate review.

Rollback: revert this scoped PR. No database, learner-state or deployment
migration is involved. Handoffs contain public source/HTTP evidence only;
no account identifiers, credentials, private GSC exports or local absolute paths.

## Execution record

Local checks pass. GSC authentication and PR/CI status must be reported
separately; preparation does not establish actual search indexing. The PR body
records final head SHA, cloud run links and any concurrent-main composition.

```text
EXECUTIVE STATUS
Task: SEO_CANONICAL_COURSE_AUDIT_20261025
PR: recorded in GitHub handoff
Base: fbacc5b14cca8f698733212c91823ff82437e65b
Head: recorded in GitHub handoff
Gate: local SEO_CANONICAL_COURSE_AUDIT_OK; GSC verification separate
Tests: 12 regression tests; 524 URL sitemap; SEO and preservation checks PASS
Failures: none in final local checks
Not run: authenticated GSC URL inspection pending; merge/deployment not authorized
Scope deviations: none
Recommendation: review technical fixes independently of GSC evidence gap
Next user decision: separate release authorization after concrete PR review
```
