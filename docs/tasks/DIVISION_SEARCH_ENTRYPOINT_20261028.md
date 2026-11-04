# MathExam task specification — guided division search entry

## Identity

- Task: `DIVISION_SEARCH_ENTRYPOINT_20261028`
- Owner: repository owner
- Date: 2026-10-28 (Asia/Novosibirsk)
- Base branch: `main`
- Base SHA: `8723d6bfb19e64d43c474b1fc7116fe8630ec20a`
- Planned branch: `fix/division-search-entrypoint-20261028`
- Review level: `MEDIUM`
- Related issue or ADR: existing guided division task `DIVISION_GUIDED_NAVIGATION`;
  no new architecture. ADR 0001 is Proposed and is not treated as accepted.

## Goal

Visitors following the existing Yandex result for division reach the current
guided Russian-notebook trainer at `/trainers/long-division-stepwise.html`.
The primary public links, page descriptions and canonical sitemap agree on
that address. Search ranking or an indexing date is not promised.

## Context and evidence

- Owner identified the simplified search result and approved the proposed
  replacement with an explicit `START` in the current conversation.
- A clean clone and the authoritative remote `main` agree on the base above.
- Baseline public GETs returned HTTP 200 and byte-identical HTML for the home,
  short division, deep guided division and separate grade-six course entries.
- PR #362 is merged at this base; Pages run 40571917932 succeeded. PR #357 is
  merged at `92d733a49692744ce043503c57f29b77bfb09a24`; Pages run 40405639131
  succeeded. Their stale Prepared status is reconciled within this task.
- The chosen existing guided engine retains a real corner, first-block
  selection, quotient places, product, subtraction, remainder check, single
  digit bring-down, decimal work and browser-local unfinished attempts.
- The deep page contains an inert managed teaching source. It and managed
  routes must remain intact. Existing attempts already share an origin-wide
  key, `mathExamBasics.guidedDivision.v1`; no migration is needed.
- Draft #361 and older open #72/#39 overlap the entrypoint. They are not
  imported here and require their own later integration. #340's inspected
  changed-file list does not include the short division HTML.

## Approved scope

### In scope

- Reuse the existing guided interface and assets at the short public URL.
- Keep its download controls and regenerate that one standalone HTML/ZIP.
  Use a small file-protocol navigation adapter if needed for offline links.
- Align title/description and ordinary visible explanatory copy with the
  actual trainer; designate the short URL canonical for both public copies.
- Update principal home, topic, laboratory and trainer-catalog links/copy.
- Regenerate the public sitemap and verify resource paths and local work.
- Extend existing browser gates to both entrypoints, add focused entrypoint
  and download checks, and record a bounded status reconciliation.

### Out of scope / files or areas that must not change

- New mathematical generators, exercises, learning sequence or help content.
- Shared guided/core/state logic, storage keys, migration or deletion.
- Managed source bank, learning catalog/routes, board registry/protocol,
  accounts, learner data, credentials, backend or hosting changes.
- Other trainers/download packages, unrelated PR work and broad SEO changes.
- Merge, deployment, search-console writes and recrawl requests before a
  separate release authorization and successful publication verification.

## Acceptance criteria

- [x] Short URL opens the same detailed notebook rather than the old text rows.
- [x] All nine guided topics and existing detailed hint interactions work.
- [x] Unfinished work resumes between both URLs; old progress is untouched.
- [x] Deep managed source and generated teaching bank are byte-identical.
- [x] Both canonical declarations target the short URL; sitemap lists it once.
- [x] Main public links reach it with matching static/JavaScript catalogs.
- [x] Desktop and 320/390px layouts and resource requests pass.
- [x] Downloaded HTML works offline and ZIP contains the same current HTML.

## Checks and gates

- Required tests: guided arithmetic, both guided browser suites on both URLs,
  focused entrypoint/navigation/state and standalone-download verification.
- Required static checks: teaching-bank extraction, SEO sitemap tests,
  sitemap reproducibility, SEO/catalog parity, syntax and `git diff --check`.
- Manual checks: inspect desktop/mobile screenshots of the short entrypoint.
- Final gate marker: `DIVISION_SEARCH_ENTRYPOINT_OK`.
- Not run: production learner data, live classroom operations and search
  ranking tests; neither deployment nor ranking is part of a Draft PR.

## Review plan

- MEDIUM: bounded public-entry integration with recoverable UI/path risk.
- Trainer design consultation applicable: no. The existing learning sequence,
  renderer and mathematics are reused without substantive design changes.
  This is not a new trainer or a new trainer archetype.
- Before implementation: independent integration review identified the
  managed-source boundary, dynamic paths, shared state and offline packaging.
- Ready result: independent focused code review and targeted regression tests.
- External review required: no under the MEDIUM policy; none is claimed.
- Handoffs contain only necessary public code and repository-relative paths.
  An internal review is not a Claude or other external release verdict.

## Risk and rollback

- Risks: relative asset links, resuming the wrong attempt, offline links,
  duplicate canonical signals and drift in a separately edited entry shell.
- Mitigations: shared unmodified engine/state, both-route regressions,
  managed-source identity, downloadable-file checks and explicit metadata.
- Rollback: revert this task's commit through a separately authorized PR.
  Existing and new browser-local records remain untouched and readable at
  the deep guided route; no data migration needs undoing.

## Permissions

- Owner `START`: yes, current task conversation.
- Branch, local commits, push and Draft PR: yes.
- Merge, auto-merge and deployment: no; separate owner authorization required.
- Copied approvals in other task/PR documents confer no permission here.

## Execution record

- Actual branch: `fix/division-search-entrypoint-20261028`
- Actual base SHA: `8723d6bfb19e64d43c474b1fc7116fe8630ec20a`
- Actual head SHA and PR: recorded in the final Draft PR handoff.
- Local checks passed: [verification report](../reports/DIVISION_SEARCH_ENTRYPOINT_20261028.md).
- Final local gate: `DIVISION_SEARCH_ENTRYPOINT_OK`. No unresolved local
  product/test failure; browser installation limitation recorded separately.
- Independent internal ready-result review: no remaining material findings.
- Scope deviations: none; no release or recrawl performed.

## Required handoff

Use the repository's `EXECUTIVE STATUS` fields with separate passed, failed
and not-run checks. Stop before merge and publication.
