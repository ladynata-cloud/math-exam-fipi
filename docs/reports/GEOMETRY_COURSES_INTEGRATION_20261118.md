# Geometry corrections composed with sections harmonization

## Exact candidate and authorization

- PR: #658; dependent harmonization: #627.
- Observed main: `dcf771600a49a5f34a9695c0d10522db78ce2478`.
- Previous #658 head: `4bd581f3ef48979806289aebdd20fdfdfa4ab310`.
- Updated #627 head: `69dfdbc03d8065c59904ecb218344a4f1f87014e`.
- Composed source commit: `6b9ffd6a624cd6731802cd6ef92bb48e50fc92e8`.
- Composed source tree: `c00f816b0493bd5ee2503cda9271422717d8c5f3`.
- Source delta relative to the #627 composition: 49 files; unchanged public course/card IDs and storage keys.
- Authorization: the owner's request to complete the unfinished work, the explicit approval to reconcile and release #623/#627, and `docs/OWNER_RELEASE_AUTHORIZATION.md`. No new permission is required solely for normal branch maintenance or publication after checks.

The merge retains both parent histories. No force, rebase, reset, test waiver or change to branch protection was used. The main release remains a separate operation after fresh CI and the required main/head drift check.

## Resolved intersections

The sections runtime retains research-state sanitation and manual construction from #627 together with the separate written-proof scene and finite-face visibility from #658. Three Merzlyak cards retain the additional guided questions, nested help and focused views from #627, and the corrected finite-face/plane distinctions, supporting-line directions and drawing data from #658.

For cards 001, 002 and 005, the mathematical contract and original view projection match the exact previously reviewed #658 source. Their explicit expected hashes in the harmonization test now name that approved source. Every existing assertion remains active; the other three cards and all 983 unrelated cards keep their previous preservation checks.

The independent review is recorded in `tools/merzlyak-10-base/independent-review-sections-composition-20261118.json`. Its author is distinct from the integration author. The original inspected file hashes and the metadata-only draft projection are both recorded. The ledger then promotes only status/review fields; all educational bytes are unchanged. Original source scans were not reopened: source fidelity here means exact preservation of statement/source metadata against the previously reviewed commit.

The existing navigator manifest is retained from current main and refreshed for exactly three HTML pages against the composed source commit. All other bindings remain intact.

## Completed local validation

- Sections and scoped Merzlyak: 144/144 Node tests, with no failed/skipped tests in the final run; independent coordinate/finite-edge tests: 8/8.
- Independent integration review: 35/35 additional DOM tests and explicit coordinate/plane/ratio checks for the three Merzlyak cards.
- Strict content-review audit: all 989 cards pass source, mathematics and pedagogy evidence checks; supplementary model tests: 5/5.
- Sections deterministic build check, standalone HTML identity, ZIP CRC and embedded HTML identity pass.
- Profile Atanasyan static gate: 12 lessons, 124 steps, 68 model views and 39 links. Stereo literacy and textbook runtime gates pass.
- Current textbook composition is exactly equal to the published 1425-card JSON, including all review identities and storage revisions.
- Textbook layout amendment: 5/5; public navigator source-binding unit tests: 5/5 and complete public-page preservation: 4/4.
- `git diff --check` passes.

An early sparse-checkout run lacked a historical review receipt and therefore correctly rejected publication identity. After materializing the unchanged receipt from Git, the full composed JSON and publication identity matched exactly. No source or receipt was changed to bypass that result. An earlier highly parallel Node run ended one progress-test process without an assertion trace; the isolated progress suite passed 23/23 and the final full run passed all 144 tests with concurrency limited to two. These preliminary results are not described as successful runs.

## Remaining release evidence

Fresh native CI and browser acceptance must finish on the final branch head. The final branch update also includes this report and the regenerated source bindings. Real-pupil acceptance and external-provider review were not performed. Release must verify the actual merge parents/tree, deployment commit and live result. Rollback uses a normal revert while retaining saved-work compatibility.
