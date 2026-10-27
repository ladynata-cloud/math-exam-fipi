# Guided division search entry — local verification

- Date: 2026-10-28 (Asia/Novosibirsk)
- Task: [DIVISION_SEARCH_ENTRYPOINT_20261028](../tasks/DIVISION_SEARCH_ENTRYPOINT_20261028.md)
- Base: `8723d6bfb19e64d43c474b1fc7116fe8630ec20a`
- Branch: `fix/division-search-entrypoint-20261028`
- Review: MEDIUM, focused independent internal code review completed.
- Local gate: **`DIVISION_SEARCH_ENTRYPOINT_OK`**.
- Exact published branch head, PR and subsequent CI outcomes are recorded in
  the Draft PR handoff. This report does not authorize merge or publication.

## Result and boundaries

The already indexed short URL runs the established guided notebook. It uses
the same mathematical planner, renderer, hints and origin-wide attempt store
as the existing deep page. Its introductory text describes the actual actions.
The deep page remains operational, including its managed loader; both public
copies identify the short URL as canonical. The sitemap contains only the
primary copy. Main home, topic, laboratory and trainer-catalog links agree.

Only the existing short-page download is rebuilt, with fourteen CSS/JS assets
embedded. Its file-protocol URL adapter makes outgoing navigation work from
an offline file; it does nothing to HTTPS behavior or learner state.

The guided engine and core, arithmetic route, managed teaching bank, board
compatibility manifest and all unrelated download entries are unchanged.
The old simplified trainer's stored progress is not deleted or migrated; the
new view continues the detailed trainer's existing work and statistics.

## Baseline reconciliation

- Authoritative `main` and a clean clone agreed on the recorded base.
- [PR #362](https://github.com/ladynata-cloud/math-exam-fipi/pull/362) is merged
  at that base. [Pages 40571917932](https://github.com/ladynata-cloud/math-exam-fipi/actions/runs/40571917932)
  and [course checks 40571919301](https://github.com/ladynata-cloud/math-exam-fipi/actions/runs/40571919301)
  succeeded on the merge commit.
- [PR #357](https://github.com/ladynata-cloud/math-exam-fipi/pull/357) is merged
  as `92d733a49692744ce043503c57f29b77bfb09a24`.
  [Pages 40405639131](https://github.com/ladynata-cloud/math-exam-fipi/actions/runs/40405639131)
  succeeded. Historical limitations in its release record remain applicable.
- Before editing, HTTP 200 responses for the home, both division entries and
  the separate grade-six course entry were byte-identical to the checked base.
  This is a bounded deployment check, not a new audit of every published page.

## Passed checks

| Check | Evidence |
| --- | --- |
| `node tools/division-guided.test.cjs` | 2,700 deterministic plans; exact rational arithmetic, zeros, remainders, decimal cases, input validation and cumulative notebook indices. |
| `node tools/learning-remediation-bank.cjs --check` | 35 source trainers; generated bank remains exactly 396,075 bytes. |
| `node tools/division-guided.browser.cjs` | Passed separately on the old deep and new short URL: nine topics, explicit continuation, genuine hints, exact reload, topic restore, duplicate protection, stale tabs, damaged storage and 320/390px. |
| `node tools/division-notebook.browser.cjs` | Passed separately on both URLs: click/keyboard first-block selection, no answer leakage, equal decimal scaling, comma/zero placement, aligned bring-down arrows, existing v1 resume and reduced-motion mobile layouts. |
| `node tools/division-search-entry.browser.cjs` | Exact deep-to-short-to-deep continuation, previous answers, hint use and unfinished draft; old progress sentinel unchanged; canonical/sitemap agreement; course/hash links; static links/resources; offline completion and HTTPS navigation. |
| Standalone download verification | File protocol with HTTP blocked: 48 : 2 = 24 including reload, 1005 : 5 = 201, 8 : 2.5 = 3.2 including decimal help; three records; zero browser errors or HTTP requests. |
| Download package identity | Fourteen embedded assets match source; ZIP contains exactly current HTML and prompt, matching their separate files byte for byte; repeat scoped build is byte-identical. |
| `python3 tools/seo-sitemap.test.py` | 12 tests passed. |
| `python3 tools/build-sitemap.py --check` | 527 canonical public URLs; the one deep duplicate is omitted. |
| `python3 tools/seo-check.py` | 30 distinct primary titles/descriptions/canonicals, six topic pages, 191 local links, 554 public canonical declarations and 527 exact sitemap canonicals. |
| `node tools/seo-catalog.test.cjs` | All three source/rendered catalogs agree; 69 existing linked destinations; unrelated Vilenkin canonical check retained. |
| Syntax and `git diff --check` | Passed for the added scripts and complete change. |

Existing full browser suites keep all assertions and select a second entry
with `DIVISION_ENTRY_PATH=/trainers/long-division-stepwise.html`. The workflow
runs both suites against both paths, then the new focused integration suite.

Local browser evidence uses Playwright 1.62.1 with the installed Chromium
140.0.7339.16. Desktop and mobile screenshots were inspected. Exact-head CI
retains the project's pinned Playwright/browser setup; its outcome is reported
separately in the PR rather than inferred from the local environment.

The entire deep-page body is byte-identical to base. Its inert managed source
block has unchanged SHA-256:
`1cacd991838d73bf93e91d6acf1a63785d66e982ba043492e316f4178136dbbf`.

## Findings and limitations

- Initial SEO validation still designated the deep URL a self-canonical
  entrance. Its explicit primary entry now follows the approved short URL;
  additional checks require the deep alternative's exact canonical/OG target,
  exclude it from the sitemap and require the primary. No generic canonical
  rule was relaxed.
- A local attempt to install the newer CI browser received an invalid/truncated
  archive. Local tests used the already installed Chromium instead. This is an
  environment limitation, not a passing result for the missing browser.
- Independent internal review found no remaining material issue. No external
  Claude consultation/release verdict is claimed: this task relocates an
  existing trainer without redesigning its learning sequence.
- There is no new live-learner/classroom, search-rank, or production-release
  result. The historical division-lab suite is outside this task's active gates
  and was not run; current guided arithmetic and interaction gates were run.
- Overlapping unpublished work in Draft #361 and older #72/#39 is not imported.
  Those branches need their own later integration review.

## Release follow-up

After a separate exact-base/head owner authorization, apply the repository
base-drift guard, publish and verify the live short/deep pages, assets,
canonicals and downloads. Only then consider a narrowly scoped recrawl of the
changed primary/duplicate pages after checking prior submissions and quota.
Submission acceptance, indexing and search position are separate observations.

Rollback is a separately authorized revert of this change. No stored work
requires conversion or deletion; the deep guided entry retains the same state.
