# OGE_104_CATALOGUE verification, 2026-11-01

Task: [OGE_104_CATALOGUE](../tasks/OGE_104_CATALOGUE.md), MEDIUM.
Base: `37718f1c0138ba031314b8f4716b73c9d963bc81`.
Local product gate: **OGE_104_CATALOGUE_OK**.
Publication state: **BLOCKED before push and Draft PR; not deployed**.

## Source and results

The source archive SHA256 is
`dd73d43382a8dcc9a659a7d5f65de520a9d4f1eabff40a7c94457c9a6d9af827`.
All 1,738 manifest entries and ZIP CRC checks passed before preparation.
The 315 PDF files and manifest remain byte-identical to that source.

| Check completed in this task | Result |
| --- | --- |
| Ordered variants, three files each | 104/104 PASS |
| Individual PDF SHA256, size and page count | 312/312 PASS |
| Correct variant in each page header | 1,084/1,084 PASS |
| Solution headings 1 through 25 | 104/104 files PASS |
| All PDF bytes / manifest identical to source | 315/315 and manifest PASS |
| Eight practical families, 13 variants each | PASS |
| Unique catalogue PDF links equal actual file set | 315/315 PASS |
| Existing `seo-sitemap.test.py` | 12 tests PASS |
| Existing `build-sitemap.py --check` | 532 canonical URLs PASS |
| Existing `seo-check.py` | entrance, canonical and sitemap checks PASS |
| Existing `seo-catalog.test.cjs` with base comparison | 71 destinations PASS |
| Existing `seo-entrypoints.browser.cjs` | 6 compatibility routes, 30 clicks PASS |
| Source catalogue browser gate against composed checkout | 315 HTTP/PDF/hash checks PASS |
| Catalogue search, eight filters, reset and no-JavaScript | PASS |
| New homepage/OGE entry clicks, JS on/off, 320/1280 px | 8 clicks PASS |
| Final button text containment/touch size, 4 widths, JS on/off | 2,496 measurements PASS |
| Actual final narrow/desktop visual sample | PASS |
| Protected trainer/backend/course/book/CI files | Unchanged from base |
| Independent internal product review and CSS follow-up | No remaining material findings |

Sitemap adds only `https://mathexam.space/oge/variants/2027/`, retaining all
531 previous URLs. The unchanged generator produces the sorted 532-URL result.
The original interactive variant is untouched and linked from the catalogue.

## Exact product binding

The independent internal review and local checks bind these SHA256 values.
They are not an external-provider or exact-head release verdict.

| File | SHA256 |
| --- | --- |
| `.gitignore` | `d7500d1d09c099bd2de241ace4c4aabc923190f345a6a72a71e8ce38faaae109` |
| `index.html` | `01a9bddc920a5e724ddc3216f5f8489620ba133f91fa3e24781ed3191ac3139b` |
| `oge/index.html` | `75baf1909bb176d0d516b2ef26da90fa203dd23093f15b2a6e452cfa617e6fd4` |
| `sitemap.xml` | `d3189d9ae2b623f9e35749d85fc38267e5b8bd4c27324fc8f04fcbfa013a030b` |
| `tools/seo-public-pages.json` | `ad5900b36b5fdf984973a96e8de89ae59d572d49d6d57667d2771dec4bb18bc7` |
| `oge/variants/2027/index.html` | `ebedf9d4e8c5621878d96f88f9925a323ec27d4eb20ce0c1870940bbd8c5a78f` |
| `oge/variants/2027/manifest.json` | `db3a40f8b5acd010d29ff09f0569006b2665c192ce02144784334625eb123451` |

## Findings and environment attempts

- The source handoff's base text copies contained an extra newline and its
  sitemap was appended manually. Those preparation defects were corrected by
  fresh minimal edits against Git bytes and the existing generator.
- Mobile inspection found `Решения` extending 2.4 px beyond its button at
  320 px. A mobile-padding adjustment preserves the 15 px font, three adjacent
  buttons and desktop styling. All 312 labels then fit at four widths with
  and without JavaScript; all buttons remain at least 70 by 44 px.
- Initial setup lacked jsdom and Chromium. Exact CI jsdom 26.1.0 was installed
  temporarily. A restricted child-process `git show` attempt returned EPERM;
  the unchanged gate passed with the permitted process capability.
- The initial browser download was invalid/truncated. A temporary Playwright
  1.55.0 installer retrieved Chromium 140.0.7339.16, build1187, via its official
  Microsoft-mirror fallback. The primary Playwright runtime remained1.62.1.
  Existing executable-path overrides ran unchanged gates. TLS remained enabled.
- The first small-PDF GitHub blob attempt was interrupted without a result;
  a read-only GET for its expected Git SHA returned404. A separate root
  create-blob attempt for the small `.gitignore` text also stalled and was
  user-aborted. Neither successful blob creation nor a remote task branch/PR
  was confirmed. This was not an automatic-approval rejection.
- The long stalled call outlived the temporary workspace. The complete product
  was restored from the source package and exact edits. Every hash above and
  all315 source-PDF comparisons were reverified, so the earlier completed
  browser/review evidence still applies to the restored product bytes.

## Status reconciliation and limits

Current main adds only geometry PR391 to the preparation base. Primary GitHub
metadata confirms its merge and successful Pages run41248923855 for that exact
base. The project status records that evidence without claiming a fresh live
course-byte or coordinated cabinet/assistant certification.

Source mathematics/full-page review remains historical evidence; no new full
mathematical, all-page PDF visual, physical-phone, Safari/Firefox or real-learner
review is claimed. Product files are unchanged from the tested/reviewed bytes.
Remote exact-head CI and production checks are not run because push/PR is
blocked. No merge, auto-merge or deployment is performed under START.

## Risk, recovery and next step

Local hashes, pairing checks, HTTP/browser gates and the scoped diff address
wrong-file, missing-binary, navigation and sitemap risks. No learner state,
credentials, hosting settings or workflow is changed. Rollback is a separately
authorized revert of this one task change, restoring integration files and
removing the new catalogue together; no data migration is needed.

Resume from the local task commit, restore an authorized working GitHub write
path, push this branch and open one Draft PR. Verify exact-head CI and current
main, then obtain separate base/head-bound merge and deployment permission.
