# OGE_104_CATALOGUE recovery and validation — 2026-11-03

Task: [OGE_104_CATALOGUE](../tasks/OGE_104_CATALOGUE.md), MEDIUM;
[MAT-9](https://linear.app/mathexam/issue/MAT-9).
Final validation base: `ea5b6cb9e931eee63224fbc4c13b2ac43326cc19`.
Initial continuation base: `b9ba38b27f5b306f0d81d01c67e0a636e5a06b84`.
Final remote head, CI run URLs and cloud transport evidence are recorded in the
Draft PR. This is preparation evidence, not a production-release claim.

## Recovery

`MathExam_OGE104_Gotovyi_paket.zip` contains a valid Git bundle, branch
`task/oge-2027-104-pdf-catalogue`, head `2ef2ec0834dbeb6986fde66b73d61d43822f4e26`,
tree `deae9bc94599f0d3636bbe0cbda211969e21a14e`, base
`37718f1c0138ba031314b8f4716b73c9d963bc81`. ZIP SHA256:
`c6e1e32f5dcd790576b7d605ea8570dfd5882a52850be86e16c34ae3062f0a16`.

The complete author archive also survived. SHA256:
`dd73d43382a8dcc9a659a7d5f65de520a9d4f1eabff40a7c94457c9a6d9af827`.
Its CRC and all 1,738 manifest entries passed again. All 315 publication PDFs,
the manifest, and the three independently saved collections match that archive.
No question, answer, solution or PDF was regenerated.

Remote branch and exact-head-branch PR lookups plus broader catalogue/104 PR
searches found no existing task branch or corresponding PR before recovery.
Current main has no catalogue. A verified HTTPS HEAD on the intended public
catalogue URL returned 404. The recovered Git commit is later than the original
22:45 progress note and already includes a first mobile-padding correction.

Initial main added 26 task commits to the old base. A read-only virtual merge
identified one conflict in `docs/PROJECT_STATUS.md`; an ordinary local merge
preserved both sections and all current-main product changes. No force, reset
or rebase was used. The prior [report](OGE_104_CATALOGUE_20261101.md) is historical.

Before the final CI rerun, main advanced to `ea5b6cb` through unrelated PR #402
(Atanasyan self-check). A second read-only virtual merge again identified only
the project-journal conflict. An ordinary merge preserves both journal entries
and all 53 other incoming files byte-for-byte; the task delta remains 331 files.
Relevant catalogue/navigation/sitemap checks were repeated on this combined tree.

## Correction and fresh verification

At 320 px, the old `Решения` label exceeded the button's inner edge by 0.344 px
with the fallback system font. Cards now use a 310 px minimum grid width when
space permits, and mobile card padding is 14 px. This also avoids cramped columns
at the old 570/850 px breakpoints. Labels remain at least 15 px; the final local
run has at least 1 px clearance and touch targets at least 70 x 44 px.

| Check | Fresh observed result |
| --- | --- |
| Source-identical PDFs | 315/315; 64,902,824 bytes |
| Families and correct three-file card pairing | 8 x 13; 104 cards |
| Individual hash/size/page/header checks | 312 files; 1,084 pages |
| Student task numbers / solution headings | 2,600 each, exactly 1–25 per variant |
| Printed short answers versus source bank | 1,976/1,976 |
| Ordered collection-page equivalence | 1,084 text and 1,084 raster comparisons |
| Local HTTP/PDF/hash responses | 315/315 |
| Filter / exact-number searches | 8 filters; all 104 numbers; empty/reset cases |
| Labels and touch targets, JS on/off | 8,736 measurements, 28 layouts |
| Homepage/OGE clicks, 320/1280 px, JS on/off | 8 |
| JavaScript page errors | 0 |
| Existing sitemap tests | 12 passed |
| Sitemap generator / canonical checks | 532 URLs; all 531 base URLs preserved |
| Existing static catalogue parity test | 71 destinations passed against base |
| Archived calculation validators rerun on saved bank | 240 original + 2,256 subsequent calculation cases passed |

Widths: 320, 375, 570, 571, 678, 679, 680, 768, 850, 851, 1003, 1004,
1005 and 1280 px. Local browser: Chromium 134.0.6998.35. Actual card screenshots
at 320/571/851/1280 px and the desktop grid were inspected. A ten-page PDF sample
covers all eight practical families, an answer sheet and a solution sheet.
This is not a fresh visual audit of all 1,084 individual pages.

Calculation validators were called on saved data without running generators.
Proof-instance structure was checked; proof prose is not formally certified.
Historical proof-family/all-page reviews retain their source identity. Bank SHA256:
`719ecb2ed53b59a78a3f8ad3cefef2c2260d3d2d0a7ff88607f5d202761f1404`.

## Cloud, failures and limits

The focused workflow checks the actual PR head and saves PDF reports, responsive
measurements and screenshots. Existing SEO workflows are unchanged. Their final
results and exact-head provenance are in the Draft PR.

CLI push lacked Git HTTPS credentials. Connected GitHub writes work, but the
13,132,766-byte collection exceeds the connector's 16 MiB request limit after
Base64 encoding. Temporary cloud run
[41497420291](https://github.com/ladynata-cloud/math-exam-fipi/actions/runs/41497420291)
assembled that exact file from two hash-checked chunks, verified the complete
SHA256 and committed with a normal task-branch push. The final candidate contains
no chunks or recovery workflow. Its complete Git tree matched the local candidate.
This transports existing bytes; it does not generate or recompress the PDF.

The first cloud run passed the focused catalogue, SEO, lesson showcase, Peterson
and EGE-base workflows. The OGE-course workflow exposed an inherited stale
assertion at `tools/oge-focus-navigation.test.cjs:29`: it banned any EGE mention
in homepage `main`, including the 5–11 lesson invitation merged in PR #393
(`2a9e70b`). The unmodified gate failed identically on base `b9ba38b` and the
catalogue candidate. Gate SHA256 before correction:
`1511cee6235f0aa69c689afb6feb02ec7691b842b90efab6dd449cbb47692590`.
The narrow correction requires the published lesson invitation and all three
lesson links, retains other whole-page exclusions, and applies the full
exam/course exclusion to the dedicated OGE starting route. All other assertions
remain intact. The corrected local gate passes 245 internal links; deliberate
missing-contact-link and foreign-exam-in-OGE mutations are rejected. Final cloud
reruns and their actual commit are recorded in the Draft PR.

Initial checker development incorrectly rejected a repeated identical title on
answer pages; it now requires a nonempty header set containing only the correct
variant number. Regular local Chromium could not start because of process/socket
restrictions. Headless shell completed the focused gate; a failed attempt to
reopen its context was resolved by starting a fresh browser for each JS mode.
These failed attempts are not counted as passing runs. The unchanged full SEO
browser gate requires its cloud result because the local constrained browser
could not complete both contexts.

Not performed: new full proof review, full 1,084-page visual review, physical
phones, Safari/Firefox, real pupils, external provider audit, merge or deployment.

## File identity and reproduction

The [exact file inventory](OGE_104_CATALOGUE_FILES_20261103.txt) lists all final
base-to-candidate paths. The manifest binds all 312 individual files. Collections:

| File | SHA256 |
| --- | --- |
| `OGE_2027_vse_104_varianta.pdf` | `f1af9b8b335e24fc312232ab3616cfe6a9a297673bfe18235fbad89cbe926789` |
| `OGE_2027_otvety_104_varianta.pdf` | `47d5920ad018bf19d0e473e3a2df6147f3a33dd0d7cfc2112b92c83d15f86209` |
| `OGE_2027_resheniya_104_varianta.pdf` | `4d87900d8f6ee878ea9ec519581de791663b2b65b9f8655f7ebb825e2ca9b8bd` |

Run `python3 tools/oge-pdf-catalogue/check.py --base <validated-base>` and
`node tools/oge-pdf-catalogue/browser.cjs`. Optional `--source <archive-directory>`
adds source-byte and printed-answer comparisons. The author archive is not
published in this PR. Rollback is an ordinary scoped revert; no state migration.
