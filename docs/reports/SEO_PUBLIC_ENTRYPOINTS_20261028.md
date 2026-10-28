# Public search entry corrections — verification

- Date: 2026-10-28 (Asia/Novosibirsk)
- Task: [SEO_PUBLIC_ENTRYPOINTS_20261028](../tasks/SEO_PUBLIC_ENTRYPOINTS_20261028.md)
- Base: `81abfce101edc83bc591e938dfd42bbfc7a039ec`
- Branch: `fix/seo-public-entrypoints-20261028`
- Review level: MEDIUM; independent internal product review completed.
- Local gate: **`SEO_PUBLIC_ENTRYPOINTS_OK`**.
- The exact committed head, Draft PR and subsequent CI results are recorded in
  the PR handoff. This report does not authorize merge or deployment.

## Result

Three formerly empty multiplication addresses now lead to existing working
trainers. The public catalog links directly to mixed multiplication practice,
the Pythagoras table and multiplication methods. The last includes a lesson
on multiplying by nine, so its card no longer claims a dedicated nine-only
trainer. Saved old addresses retain canonical, HTML refresh, JavaScript and
visible-link navigation. These are HTML transitions, not HTTP 301 redirects.

NOK and NOD have ordinary public cards and explicit sitemap seeds. The catalog
has 58 cards; the sitemap has 529 reviewed canonical public addresses. Two
OGE-13 links now go directly to the current trainer. The older tire lesson's
broken map link is repaired, with a visible link to the current variant trainer.

Selected OGE and multiplication pages have descriptive initial headings or
metadata. Brief explanations for inequalities, geometric statements, NOK and
NOD follow the exercise. The new number-theory explanation is hidden only in
the existing embedded mode; the board's working viewport is preserved.

`trainers/rounding-stepwise.html` is the established general stepwise entry,
supported by the owner's earlier `ROUNDING_BEFORE_ESTIMATION` scope and current
interaction checks. Other rounding pages retain their different exercises,
storage and canonical addresses; they now have more specific titles and links
to the main stepwise page. The separate rounding-and-packages mini-course is
unchanged. The old tire page remains a fixed worked-example lesson rather than
being treated as an identical copy of the current whole-variant trainer.

No exercise engine, answer checker, storage schema, managed source, board
protocol, account or AI integration changes. Existing trainer script blocks
and external script tags are identical to base. HTML script changes are limited
to catalog data and the three new compatibility entries. CSS changes are only
the embedded exclusion and a legible color for the new link on the dark older
rounding page. No functioning AI chat or ranking improvement is inferred.

## Baseline reconciliation

- The authoritative remote main, fetched base and clean task worktree agreed.
- PR #365 was already merged at the recorded base; [Pages run 40599525841](https://github.com/ladynata-cloud/math-exam-fipi/actions/runs/40599525841)
  completed successfully on that commit.
- Public HTTPS GETs for the home and short division page returned 200 and
  byte-identical base HTML. The preceding Prepared status is corrected within
  this task; unrelated historical releases are not re-certified.

## Passed checks

| Check | Evidence |
| --- | --- |
| `python3 tools/seo-sitemap.test.py` | 12 tests pass. |
| `python3 tools/build-sitemap.py --check` | Exact generated sitemap: 529 canonical public URLs. |
| `python3 tools/seo-check.py` | 30 entrance titles/descriptions/canonicals, six topic pages, 191 local links, 558 canonical declarations and seven refresh destinations pass. |
| `node tools/seo-catalog.test.cjs` | Static/JS parity for 58, 12 and six cards; 71 nonempty destinations; repaired compatibility routes, direct OGE-13 and NOK/NOD discovery pass. |
| Negative empty-page probe | In-memory whitespace-only and comment-only replacements for a real catalog destination are both rejected. Repository files were not changed by this probe. |
| `node tools/learning-remediation-bank.cjs --check` | All 35 managed source trainers and the 396,075-byte generated bank remain unchanged. |
| `python3 tools/oge-basics-claude.test.py` | 15 existing checks pass. |
| Rounding DOM/preparation | Both existing scripts pass, preserving exact rounding, retry, place selection, help and the original course tab. |
| OGE 11/13 and course references | Eight relevant test files pass, including mathematical, hint, minimal-screen and course-entry contracts. |
| `node tools/oge-algebra-contract.test.mjs` | 668 checks, zero failures; `OGE_ALGEBRA_GATE_OK`. |
| OGE 19 | All ten `task19-*.test.cjs` files pass, including mathematics, board, helper, textbook and downloadable-file contracts. |
| Practical OGE | All nine `oge-practical-*.test.cjs` files pass across the initial run and unchanged isolated retries described below. |
| Number theory | Existing mathematical and DOM suites pass. |
| Basics help/standalone | Three existing helper, standalone and special-help DOM files pass. |
| `git diff --check` | Pass. |

## Real browser verification

- **Updated stepwise rounding:** existing Chromium journey passes at 320, 390
  and 1060 pixels, with 30 examples solved from visible prompts, wrong-answer
  retries, all nine places, continuing practice and the original tab retained.
- **Compatibility entries:** all three old multiplication URLs reach the fixed
  targets. JavaScript retains the query and fragment. With JavaScript disabled,
  HTML refresh reaches the correct target; its static fallback does not carry
  query/fragment. Visible fallback links are separately exercised by real clicks.
- **Catalog:** real clicks open all three multiplication destinations and both
  number-theory trainers. Catalog/filter views and changed rounding/tire headers
  pass at 390 and 1060 pixels with no horizontal document overflow.
- **Number theory:** NOK/NOD pass at 390 pixels in public mode and in actual
  iframes. The new explanation has zero height when embedded; removing that
  hidden element does not change the exercise document's height.
- **Visual corrections:** the added link in the older dark rounding page now
  uses a readable light color; the advanced rounding H1 is shortened. Both
  affected 390-pixel screens were rechecked after correction.
- Navigation/layout runs report zero JavaScript errors and no external
  requests. No real learner account or external AI endpoint was used.

## Download identity and scope

The existing scoped builder regenerated only `rounding-stepwise`, `task19-trainer`
and `oge-1-5-trainers` packages. The manifest build date is updated by that tool.

- Rounding and task-19 ZIPs retain two members each; only their corresponding
  HTML changes. Adaptation prompts and executable scripts are unchanged.
- The practical ZIP retains all 35 members. Besides the tire title/description,
  the normal build picks up already-published canonical metadata in 12 other
  HTML members, including the canonical map destination for `index.html`.
  Removing only canonical lines makes those 12 members byte-identical to base.
- No members are added or removed. JS, CSS, other assets and all script blocks
  in that archive are unchanged. Eight archived practical trainers boot offline
  in the existing regression suite, including the relocated shared board script.

## Findings, retries and exclusions

- An initial parallel practical run reported two failed files. The offline
  suite could not spawn `unzip` in the sandbox (`EPERM`); the first 3D result
  supplied no actionable assertion detail. Unchanged isolated reruns with the
  permitted execution environment pass all six 3D tests and eight offline
  cases. No test, timeout, protection or assertion was weakened.
- A preliminary OGE-6 diagnostic found a historical whole-repository scope
  assertion comparing against `df63bacb2f82acf5f8543297c372b414925d6113`. It also
  fails on the unchanged production tree because of an already-published
  unrelated workflow. Its 16 mathematical/runtime checks passed. The optional
  OGE-6 heading/paragraph edit is excluded from this package; its existing
  subject-specific title/description remain intact. The historical test is
  neither changed nor represented as passed.
- Generic metadata-only `seo-check.py --base` is not applicable to deliberate
  visible-heading and explanatory-text edits: it requires body-byte identity.
  The standard SEO gate remains required; script/control/managed-source
  preservation and targeted runtime checks cover this task's actual boundaries.
- Independent internal review found no remaining P0–P2 product issue. This is
  not an external Claude verdict. No new trainer design consultation is needed
  for this bounded navigation/copy change.
- Real learner data, live AI responses, fresh SERP positions, index acceptance,
  production publication and post-release behavior are not tested here.

## HTTPS operational follow-up

At task start, HTTP requests for `/` and `/trainers/long-division-stepwise.html`
both returned 200 without a Location header. HTTPS works, but a canonical tag
does not implement the missing transport redirect.

GitHub documents **Settings → Pages → Enforce HTTPS** as the administrative
setting that redirects HTTP requests. It requires repository admin access:
[official Pages HTTPS guidance](https://docs.github.com/en/pages/getting-started-with-github-pages/securing-your-github-pages-site-with-https).
The current repository connector does not expose a Pages-settings mutation.
No hosting change is claimed in this PR. After separately authorized hosting
configuration, verify redirects for both paths and successful HTTPS responses.

## Release and rollback

After separate owner authorization for the exact base/head, apply the base-drift
guard, publish and verify the changed public HTML, sitemap, CSS and packages.
Search-console recrawl is a separate post-publication operation; the preceding
division recrawl had an unknown write result and must not be blindly repeated.

Rollback is a separately authorized revert. This task requires no conversion
or deletion of learner work.
