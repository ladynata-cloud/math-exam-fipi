# Corrected OGE book edition v2 — local preparation evidence

Task: [OGE_BOOK_EDITION_V2_DALI_20261031](../../tasks/OGE_BOOK_EDITION_V2_DALI_20261031.md).
Base: `4a90592077934d9a6d8a617b4afa50938798efb2`.
Review level: `MEDIUM`, inside Accepted [ADR 0012](../../adr/0012-fixed-oge-book-editions.md).

**Local preparation passes. V2 is an unpublished candidate, and its distribution
gate remains INCOMPLETE.** This report records checks before publication of the
task commit. The Draft PR and final evidence archive record the actual published
head and its CI separately; a local PASS is not an assertion about future CI.
The previous PR387 merge authorization does not authorize this task's release.

## Problem and correction

The published v1 Task11 page can request the literal image path
`'+DALI_PORTRAIT_DATA+'` while the HTML parser preloads content. Its live gate
recorded a real HTTP404 at entry 54 and 320px. The new regression preserves exact
v1 response bytes, splits delivery before the portrait image token, delays the
bootstrap, and requires a parser-initiated request plus browser/server 404.
If that negative control does not reproduce the defect, the test fails.

The public trainer now creates the portrait element without a `src` in the
HTML string and assigns the original data URI to the actual element afterward.
The JPEG remains 113621 bytes, 807×1024, SHA256
`b6c33803d9aeb035f88eb3d7ca2f8f3a6a5f7d6c2300f9a67ad0e0103299cba5`.
Alt text, credit, biography, exercise engines and mathematics are unchanged.

The correction is frozen at `/book/oge/2026-10-31/v2/` with 71 new aliases at
`/b/oge26-2/01/` through `/71/`. All 225 published v1 package/alias files retain
their exact base blobs and inventory. V2 contains the corresponding 225 files:
154 inside its book namespace and 71 aliases, with 150 source dependencies.
Its independent results use the established edition namespace without migrating
or clearing public or v1 results. Storage adapter behavior was not changed.

## Local results

| Check | Actual result |
| --- | --- |
| Source and v2 learner scenarios | 426/426 PASS: 120 basics + 93 exam cases per variant |
| Independent mathematics for those variants | 790 PASS, 0 FAIL, 0 PENDING |
| Final v2 package runtime | 142 entry/width checks + 10 boundary checks + 3 cross-edition checks, all PASS |
| Final v1 package control | 142+10+3 PASS; earlier v1 failures remain recorded |
| DALI regression | 6 mandatory baseline controls rejected the old bytes; 18 source/v2 initial/help/reload stages passed |
| Generator, integrity and delivery tests | 6+16+14 PASS; old base and current verifiers both PASS |
| Task 6/scope and source/arithmetic regressions | 48+58 PASS; existing contracts retained |
| Result collector | 31 PASS |
| Local HTTP rehearsal | 367 exact comparisons PASS; not production verification |
| Documents | 72 pages,71 destinations,79 link placements and34 decoded QR per format; 12 negative controls PASS |
| Visual document review | All 72 PDF pages actually inspected; non-URL wording/layout and 2027 caption preserved |
| XLSX register | 5 worksheets, 11,494 cells, 4 formulas and 426 scenarios preserved; native features and changed visual regions checked |
| Independent internal package review | PASS; 4 findings closed, 0 material findings open |

The final local runtime uses Chromium 140.0.7339.16 and runner SHA256
`3e76f8f6b982d47cd6d1d661264265bf56ee09aa5123457745168e364f7fbdc2`.
Its v2 report SHA256 is
`eb1a33380f756695af651800cf8f46ab3855b2e48f0997bd4b3a34251f8c0c9b`;
the v1 control is
`35aaad83cfec7e14610ad2144d53cc439da3b4edb6c421eeab8f7de59ca2f9b3`.
The machine-readable [verification record](verification.json) binds the tested
code, manifests, independent calculations and separate document/review evidence.
Book files and browser evidence are delivered separately; private books are not
added to Git. Browser images are inspected locally and excluded from the evidence
archive; their hashes and observations remain recorded. The 34 requested QR images
are included in that archive.

## Failures retained and limits of the checks

The fresh legacy-v1 learner suite passed 120 basics and 92 exam cases and failed
entry 54 at 320px with the DALI 404. Published v1 is unchanged. A later successful
package sweep does not erase that intermittent product failure. The new negative
control is the bounded reproducible proof of the correction.

An initial image-readiness test incorrectly treated a lazy image inside closed
native `details` as visible because its rectangle intersected the viewport.
The final predicate also requires native visibility. The 15-second deadline and
all network/page error checks remain strict; the same broken image must fail
after opening, and a decoded visible image must pass. There are no ID exemptions.

An initial cross-tab clear observation also failed. Its exact cause is
**UNKNOWN**: 10 instrumented probes did not find a post-clear writer. The final
test immediately requires `null` and zero scoped length in the clearing tab,
then waits for the exact native deletion event before the original cross-tab
snapshots. A deliberate no-op removal fails at the immediate assertion. Real
trainer reloads, both clear directions and preservation of public/other-edition
results remain tested. All intermediate reports are retained.

The first v2 math run had 787 PASS and 3 PENDING while the new Task 6 image/payload
binding was missing. After the exact visible problem and unchanged payload were
reviewed, all 790 comparisons passed. Environment/setup failures and the initial
regenerable-bytecode scope failure are retained separately from test results.

The tests cover recorded representative cases and specified finite assessments,
not every generated question or educational effectiveness. New production URLs,
physical phones and printed QR, iOS/Safari/Firefox, screen keyboard and pupil
trials have not been checked. External provider review was not requested and no
external approval is claimed. Independent internal review is not described as
an external verdict.

## CI and release boundary

The workflow retains the base verifier and historical contracts, adds the exact
v2 scope and deterministic candidate reproduction, runs source/v1/v2 learner and
math gates, and keeps the current Chromium lane. A separate pinned Chromium 140
lane exercises the old-byte negative control and corrected source/v2 portrait.
The old external-review job remains deliberate manual opt-in only. Its skipped
state is not a review approval.

After inspecting the Draft PR and its exact-head CI, the owner may separately
authorize merge and deployment for the current base/head. Before any merge the
authoritative remote `main` must equal that authorization's base; drift invalidates
the permission under the repository policy. After an authorized deployment,
repeat exact live bytes/aliases and browser checks before distribution. Closing
this unpublished Draft PR is the premerge rollback; silently revising v1 is not
an acceptable correction.
