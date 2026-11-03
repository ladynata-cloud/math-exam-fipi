# Atanasyan chapter IV self-check — production integration

## Approved continuation, 2026-11-02 (Asia/Novosibirsk)

The owner explicitly requested continuation of PR402: reuse all thirteen independently
reviewed cards, integrate them into the current course, verify mobile use and saved
steps, run GitHub Actions and publish after successful applicable checks.
Review level: HIGH. Same task, branch and PR402; no new content authoring.
Standing release authority: [owner policy](../OWNER_RELEASE_AUTHORIZATION.md).
This current instruction supersedes the historical editorial-only preparation scope.

- Validated integration base: `01e412d4314445366bcd4773a3789129aa7264bd`.
- Preserved candidate: `cd75819969d48dd6f14a24d89029b9d00507a77a`.
- Branch: `content/atanasyan-chapter-iv-selfcheck-20261102`.
- Source/math/pedagogy verdict: [unchanged independent report](../reviews/ATANASYAN_CHAPTER_IV_SELFCHECK_INDEPENDENT.md), final PASS 2026-11-01T21:33:52Z.

## Scope

Publish exactly thirteen existing cards covering questions1–10, including Cyrillic
3а/б/в and5а/б, 31 proof steps and45 model states. Copy the reviewed content exactly;
change only publication/review metadata. Add ten explicit source-part contracts,
thirteen content-review hashes, one review batch and the generated course bundle.
Expected total:653 reviewed cards,50 complete self-check questions.

Preserve all640 historical raw lessons, review records, source identities/revisions,
renderer, schemas, runtime, styles and learner-storage contracts. Detailed help remains
optional and proof steps remain visible once revealed. A saved proof is never called
mathematically certified by the software. Additional exercises396–439, chapterV,
new account/backend behavior and unrelated UI redesign are outside this task.

## Verification

- Exact independently reviewed candidate hashes, text, source parts and model objects.
- Frozen640-card source/catalog/registry/raw-file projections with corruption controls.
- Existing full source/schema/content/mathematics/runtime/model/browser gates.
- All653 cards in the full browser matrix; all13 additions additionally at320/390/1280,
  including optional help, rotation/expansion, Q10 fraction bars, saved work and reload.
- Historical browser cases remain the exact leading sequence; add60 new cases.
- Requery authoritative main/head immediately before release, revalidate any drift,
  verify squash parent/tree, established Pages deployment and live course hashes/count.

Gate: `ATANASYAN_IV_SELFCHECK_INTEGRATION_OK` plus successful required CI.
The prior independent verdict covers unchanged content, not unrun production tests.
No new paid/external-provider review is required or claimed.

## Branch maintenance and rollback

Sixteen newer main commits concern assistant work, reference sheets and owner policy.
The read-only virtual composition conflicts only in PROJECT_STATUS.md. Ordinary merge
preserves both sets of journal records and every concurrent product file.
Rollback is an ordinary revert of this scoped additive release; no learner migration,
delete, force, reset, rebase, TLS bypass or gate weakening is part of the work.
Physical-device trials and real-pupil use are not claimed. Exact CI/release evidence
is maintained in PR402 and the [integration report](../reviews/ATANASYAN_CHAPTER_IV_SELFCHECK_INTEGRATION.md).
