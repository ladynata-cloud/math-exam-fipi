# Атанасян 10–11: дополнительные задачи о сфере №414–421

## Identity

- Owner: MathExam owner; current request «выполни незакрытые задачи. порядок определи самостоятельно».
- Date: 2026-11-06.
- Task: ATANASYAN_ADDITIONAL_414_421.
- Base branch: main.
- Verified base SHA: `955c83154eed49554b648c03b66e1eba16932222`.
- Branch: `content/atanasyan-sphere-414-421-20261106`.
- Review level: MEDIUM — fourteen authored cards in the existing sphere renderer, with fixed storage, schema and runtime.
- ADR: no new architectural decision; ADR 0001 remains Proposed.

## Goal and verified starting point

Continue the published Atanasyan 10–11 course after №413. Add every original
part of №414–421 as fourteen complete cards: 414а/б/в, 415а/б, 416а/б,
417, 418а/б, 419а/б, 420 and 421. The intended result has 688 reviewed
cards and main exercises 1–421 complete. №422 starts the next source section.

At task start the production course returned HTTP 200 with 674 cards and
SHA256 `5b253776895b913125eb2e64ecc112192a847fdb2c779709dfc886d26c7cc2f0`,
identical to the verified base. This confirms the PROJECT_STATUS record of
PR439, the published twelve-card №404–413 increment. Earlier status history
is retained; this task does not claim that the whole textbook is complete.

## Exact source and discrepancy

The owner supplied the 2024 twelfth edition, PDF SHA256
`bead97a383e438b32b9caaff72d61d27e8fa6cd20c6b86a5f234bc4cdb629770`.
The author visually read printed pages 113–114 (PDF 115–116) and the answer
page 265 (PDF 267). These exercises have no accompanying source figure.
Only source metadata, original explanations and original coordinate models
are committed; the PDF, page scans and complete OCR are not repository inputs.

The printed answer list to №419а gives the AD expression before the AB
expression although the condition asks for AB, then AD. Derive and identify
each length independently: with s = sinφ and 0 < φ < 60°,
AD = 2R√((3 − 4s²)/3) and AB = 4Rs√((3 − 4s²)/3).
The coordinate audit must distinguish them at a non-special angle such as
φ = 45°. Record the source discrepancy in the review, without copying the
swapped assignment into the learner answer. Explain both the nondegenerate
domain and that the sphere centre can lie outside tetrahedron ABCD.

## Approved scope

### In scope

- Fourteen source-bound cards, complete proofs, on-demand hints, exact theory links and geometric models using existing renderer capabilities.
- Explicit treatment of fixed points in sphere symmetries, both directions of the intersection locus, and equal section areas of the spherical shell.
- Completeness contracts for exactly eight existing source-index positions.
- A strict append-only review/content/browser boundary preserving all 674 previous raw cards, source metadata, catalogue identities and reviews.
- A deterministic course rebuild and focused mathematics, model, browser and preservation checks.
- Task/review/status records and a separate Draft PR.

### Out of scope and fixed files

- №422 onward, later chapters, the planimetry course and unrelated open tasks.
- Changes to the previous 674 lesson files, shared board or its registry, accounts, learner data, renderer, schema or storage keys.
- New trainer architecture or external-provider review.

## Acceptance criteria

- [x] All fourteen original parts present; every step has a valid reason and every model state is reachable.
- [x] Exact 674-card predecessor preserved; full course has 688 available reviewed cards, 421 main exercise numbers, 51 theory points and 50 self-check questions, with no partial source number.
- [x] Independent mathematical review covers №419's source discrepancy and all boundary/converse arguments.
- [x] Actual browser journeys cover every card and model state at 320, 390 and 1280 px, cold entry, on-demand steps, rotation/enlargement, theory return, draft and reload persistence.
- [x] Every actual screenshot is visually inspected and recorded separately from automated geometry/layout checks.
- [x] Full local source-model checks and the focused real browser pass without weakened assertions; the historical four-shard browser run is a separate CI gate.
- [ ] Exact-head CI and PR evidence recorded; root coordinator owns the final release.

## Checks and gates

- New gates: additional414 content, independent mathematics, negative controls, and focused browser journeys.
- Existing gates: reproducible build, catalogue, schema, all preceding content boundaries, model geometry, runtime, visibility and browser partition coverage.
- Static checks: `git diff --check`, exact changed-file set and unchanged runtime/schema hashes.
- Manual checks: source pages, full written solutions, actual mobile/desktop images, particularly two intersecting spheres and the generic two-rectangle construction.
- Final marker: `ATANASYAN_ADDITIONAL414_CONTENT_OK` plus `ATANASYAN_ADDITIONAL414_BROWSER_OK`, only after actual success.
- Not performed: external-provider audit under the owner waiver; real-pupil and physical-device trials.

## Review plan

Before implementation, the learning question is how a spatial sphere problem
reduces to equal distances, a perpendicular section and a right triangle.
Keep given points visible initially and disclose auxiliary geometry with the
corresponding explanation. A concrete model illustrates the proof without
replacing a proof for arbitrary radii or angles. Do not expose computed answers
on cold entry. Symmetry and locus proofs must establish the reverse inclusion,
not only show that one chosen point works.

The author checks source, mathematics and written pedagogy. A separate internal
reviewer checks the finished mathematics and images; actual reviewer identity,
timestamp and content hashes belong in the review record. External consultation
was not requested and has not occurred. Supplied source pages are private
task material and are not included in a remote public handoff.

## Risk and rollback

Main risks are radius/diameter confusion, reversing №419's lengths, assuming
the sphere centre lies inside the tetrahedron, treating coincident equal
spheres as a circle, incomplete locus converses, and confusing the area of a
section disk with sphere surface area. Negative mathematical controls and
parameter families address these risks. Roll back by an ordinary scoped
revert and redeployment; do not delete learner records or rewrite history.

## Permissions

The current owner request and coordinator's explicit assignment provide START
for this bounded continuation: branch creation, scoped edits, tests, local
commits, push and Draft PR are authorized. Publication consent and external
review waiver persist. This executing child does not merge or deploy; the root
coordinator checks the authoritative base/head and handles release. Later
explicit owner instructions and the supplied AGENTS.md take precedence over
general repository policy.

## Execution record

All fourteen cards, source contracts and focused gates are implemented.
The independent review records all 58 written steps and 180 model views; its
222 capture hashes bind to the final lesson content. The author read every
complete start page at all three widths. The 37 local source-model commands
passed. Exact-head CI and the production release are recorded separately in
the PR; no production result is inferred from a local candidate.

```text
EXECUTIVE STATUS
Task: ATANASYAN_ADDITIONAL_414_421
PR: separate Draft PR; its body records authoritative base, head and CI
Base: starting scope 955c83154eed49554b648c03b66e1eba16932222
Head: recorded in the PR after commit
Gate: local source-model, content, mathematics, independent visual and public-mode browser PASS
Tests: 37 source-model commands; 14 models; 42 journeys; 180 model states; all 222 release PNGs identical to the visually reviewed capture
Failures: original 416б first-screen overflow corrected; no unresolved local failure
Not run: external provider audit, real pupils, physical devices
Scope deviations: none
Recommendation: check exact-head CI, then verify scope and published bytes before release
Next user decision: none for this authorized scope
```
