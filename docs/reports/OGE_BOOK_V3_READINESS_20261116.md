# OGE book v3: preparation and review evidence

## Status and boundaries

Task: [OGE_BOOK_V3_READINESS_20261116](../tasks/OGE_BOOK_V3_READINESS_20261116.md),
review `HIGH`. This is a publication candidate on an isolated task branch.
The owner's START authorizes implementation, commits, push and a Draft PR;
the conversation explicitly requires separate authorization for merge and
deployment. No publication or publisher submission is claimed here.

Approved base: `83e1fc15a1b6b87f0133e0dec6753381e423bd92`.
Public source correction commit: `11449d27f9e6e1ffa208195b0d534e72f6a7f40b`.
Its tree `deeee7cfabe46d1c0c18d35822306a05123004a1` matches the reviewed local
logical source commit. GitHub integration published the same tree because Git
CLI authentication was unavailable. The final PR records its exact head and CI.

## Teaching corrections

| Finding | Result in the candidate |
| --- | --- |
| Old equation explanation in printed v2 links | v3 takes the already published #631 distinction between zero, positive and negative right sides of x²=k and the nonzero-division condition. |
| Task24/t20 highlights | Steps2–4 now identify C as the vertex of the stated30°,120°,90° angles; proof text and saved task IDs are preserved. |
| Task25/type15 rounded-angle answer | Exact tangent length and two expressions for triangle area replace rounded angles/cotangents. All ten pool entries pass an independent coordinate solver and actual answer acceptance. |
| Task16 diagnostic | The height associated with r=k√3 is3k√3; the correct side remains6k. |
| Task18 different model numbers | The current explicit different-numbers label is retained in v3; pending #628 is not imported. |
| Vieta | Both visible references define p=b/a and q=c/a and separate the theorem from convenient integer-root guessing. |
| Tires | Introduction includes percentage change and its original-value baseline. |
| Hyperbola | One parameter for k/x is distinguished from three for k/(x−a)+b. |
| Improper fraction | Equality of numerator and denominator is included. |
| Task25/type13 | The bisector theorem explains the missing ratio before calculating the cosine. |

The shared proof wrapper was inspected because it overrides some native help.
Only the related type13/type15 theory mappings and type15 final explanation
were synchronized. Four saved steps and the single final area question remain.
The author analogue's obsolete draft-status caption was also updated after
checking the official FIPI2027 page. All other mathematical banks, IDs and
storage schemas remain outside this task.

Independent cross-review accepted the geometry, highlighted vertices and
preserved contracts. A second reviewer accepted the dated generator and its
immutability guards. These are internal task reviews, not external-provider
approval or evidence from real pupils.

## Fixed website companion

- New namespace: `book/oge/2026-11-16/v3/`.
- Short links: `b/oge26-3/01/` through `b/oge26-3/71/`, with the previous ID map.
- Exact build:71 entries,165 source files,240 emitted files,8,820,563 bytes.
- Manifest SHA-256:
  `04e31a9be5f97702c09d103a538d217973aac2bd827be9b05f7541cf2cdf1c43`.
- Storage: `mathExamBook:oge-2026-11-16-v3:`. Public/v1/v2/v3 isolation is
  exercised by the runtime gate; the storage algorithm itself is unchanged.
- The optional date defaults to the historical31 October value. Invalid dates,
  another alias year, and reuse of a published alias with a new date are rejected.
- Historical v1/v2 and both alias namespaces are unchanged. The independent
  verifier protects their original Git blobs, not proposed checksums.

Reproduction command:

```sh
python3 scripts/build-oge-book-edition.py --version v3 --date 2026-11-16 \
  --base 83e1fc15a1b6b87f0133e0dec6753381e423bd92 --check
python3 tools/book-edition/verify.py --base 83e1fc15a1b6b87f0133e0dec6753381e423bd92
```

The current source includes navigation and optional closed model panels that
did not exist in v2. v3's browser evidence uses explicit fixed-manifest receipts
for these exact additions. It does not allow arbitrary text normalization or
an answer-key fallback for a changed condition.

## Download packages

Eight existing packages were updated: the practical1–5 collection and tasks7,
9,11,16,23,24,25. Task23 inherits the shared proof script but its questions,
answers and own explanations are unchanged.

Across the eight ZIPs, only one HTML member in each changed;66 other members
are byte-identical to the base. Seven single-file HTML downloads exactly match
their corresponding ZIP member. The1–5 launcher is unchanged. Its collection
received only the exact tire-introduction correction: regenerating the entire
historical collection also pulled unrelated source/navigation changes, so those
unrelated members were retained from the reviewed base instead. No other
package was modified. The download manifest only refreshes its update date.

The navigator provenance utility bound the exact eight changed HTML sources
to the public source correction commit; wrapper JavaScript is not a navigator
page. Existing baseline records and historical source-binding records remain.

## Local verification

| Check | Result |
| --- | --- |
| Algebra contract |668 checks PASS |
| Task9 regression family |222 tests PASS |
| Tire independent answers |105 answers PASS |
| Geometry contract |1,873 checks PASS |
| New geometry regressions, current source |5/5 PASS, including actual DOM proof-wrapper overrides |
| Same independent regressions, frozen v3 |5/5 PASS |
| Existing proof DOM suite |10/10 PASS |
| Generator with date/alias negative controls |18/18 PASS |
| Frozen-package negative controls |17/17 PASS |
| Deployment-verifier unit tests |14/14 PASS; this is testing the verifier, not deploying v3 |
| Frozen integrity and append-only |3 editions valid,2 published editions protected |
| Navigator preservation and binding utility |4/4 and5/5 PASS |
| Video context and historical preservation |21/21 Node tests PASS |
| Python video context, including v3 negative controls |11/11 PASS |
| Worked-step context, including exact v3 proof UI |9/9 PASS |
| Focus navigation |522 internal links checked, PASS |
| Minimal algebra help |26/26 PASS |
| Author analogue |73/73 PASS after exact historical navigation adaptation and heading-selector correction |
| ZIP member preservation |8 packages;66 unchanged members;7 matching standalone HTML files |

The analogue test previously failed on the unchanged base because it did not
recognize the published navigator/return script. Its original foreign-script
rejection remains after removing only the hash-bound navigator and one exact
return asset pair. A second old regex crossed closing h3 tags and counted a
separate start link as another card; completed headings are now counted, still
requiring exactly one card, with stray-link and duplicate-card controls.

Local Chromium stops at startup with `socket() Operation not permitted`, before
any trainer page is opened. Local browser checks therefore are **not run**;
GitHub CI runs the preserved browser scenarios and added v3 coverage. The PR
records final outcomes and any remaining failures for its exact head. A prior
distribution-suite process ended137 without a result; it is not counted PASS.
The local learner-entry suite did not finish and was interrupted without a
result; no pass is claimed. Its required workflow fetches the exact historical
and new source commits before running the suite.

## Private book deliverables

The private v3 manuscript and PDFs are delivered separately to the owner.
No manuscript, private extracted text or review images are in this repository.
The edition has a printed contents list and page numbers, targets the2027 exam,
distinguishes the2026 publication year and dated2026 score recommendations,
and adds four complete independently solved exit tasks for21/22/24/25.

The large205×290mm format retains readable11-point body text. Eleven
mathematical diagrams were rebuilt from their exact data at about600dpi with
vector masters;32 independent geometry/size checks passed. The unchanged
crocodile illustration is placed at100mm width for304.8dpi. Matching v3 short
links and QR images are checked in DOCX and PDF; final pagination, font and
rendering checks accompany the private files.

Official preparation references:

- [FIPI OGE examination documents](https://fipi.ru/oge/demoversii-specifikacii-kodifikatory).
- [2026 score recommendations, letter02-20 dated25.02.2026](https://doc.fipi.ru/oge/normativno-pravovye-dokumenty/02-20_25.02.2026.pdf).
- [Ridero requirements for a supplied print interior PDF](https://ridero.ru/faq/kak-podgotovit-maket-tekstovogo-blo/).

The printed v3 URLs become publicly usable only after separately authorized
merge, deployment and complete live verification. A physical proof copy,
publisher acceptance, full cover spread/spine and real-pupil pilot are not
claimed by automated or screen-based checks.
