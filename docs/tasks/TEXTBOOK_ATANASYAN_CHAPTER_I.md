# Atanasyan2024: finish chapterI and its self-check questions

## Authorized scope

The owner requested a cloud course for every exercise and all theory with visible
models and progressively justified solutions, and explicitly authorized publication.
This stage completes the introduction and chapterI only; the rest of the book is
still marked pending. Merzlyak/Pogorelov remain later separate supplied sources.

Base:61a42de7d4f5d5aa0d440d9070294ceccffc6092, verified published PR298.
Seed reviewed tree:79bbcc6ba0e26474c0ce4872c390e69103cfb98b.
Branch:feat/atanasyan-chapter-i-84-115. Review level:HIGH.

## Content and behavior

- Add every question of main84–115,35cards, and all16 chapterI self-check
  questions in their distinct chapter-local source namespace. Do not inflate
  main-task coverage by counting self-checks as main exercises.
- Preserve all132 previously approved cards. The new51 cards are identical
  to independently approved author bundles except review/status metadata.
- RequiredParts preserves all lettered and unlettered source requests.
- Complete introduction/chapterI total:183cards,115main exercise numbers,
  14theory points,16self-check numbers;581justified steps and659model views.
- Show the number of fully available self-checks in the catalogue overview.
  This is the only new runtime behavior relative to the seed; the fraction
  feedback fix is inherited from PR298. Learner storage and proof grading
  remain unchanged.
- Keep initial givens visible. Reveal auxiliary constructions and answers only
  in relevant help/steps. Every proof transition names its theoretical basis.

## Independent content evidence

- Main84–115 source/math/pedagogy/models PASS by Codex ege_profile_inventory
  with independent coordinate reviewer profile_test_audit; sign-off
  2026-10-21T21:21:13Z. Exact source bundle SHA256:
  fd5edd8ac8eac4240d6a5ff8bb35984b8e2fc982c7131ebc763c0ea58d93ff6e.
- ChapterI self-checks1–16 PASS by Codex ege_base_inventory with independent
  coordinate reviewer geometry_scene_math_review; sign-off
  2026-10-21T21:16:30Z. Exact source bundle SHA256:
  7c054e3f23720cdef84126bd99a8726c648bf83bfe7bf90bd3dbdc06c31b2e77.
- Proofs, figures, source pages, finite/degenerate cases and every subquestion
  were read; numerical sampling is additional evidence, not a proof substitute.
  Original textbook PDF, scans and raw extracts are excluded from publication.

## Validation and release gate

Local source catalogue7tests, strict schema183cards/1291rows, immutable content
hashes, all source/theory references, retained runtime and source models pass.
The common geometry gate verifies614planar simple polygons and2192nonzero
segments. Chapter-local self-check identities remain separate from global
main/theory numbering.

Cloud acceptance: every183card at320/1280px;85representative screenshot cases
at both widths and4expanded drawings; retained cameras/drafts, nested theory,
scroll returns and real two-tab conflict recovery. Independently inspect new
screens and reuse previous visual review only for identical images. Exact Git
head/diff review is still required after the prepared stage is committed.

Paid Claude remains deferred; no Claude review is claimed. Before ordinary
squash check authoritative current main/head, all required exact-head CI and
review threads. After merge verify sole parent and exact reviewed tree, Pages
on the exact merge, and public canonical/alias file bytes and SHA256.

Gate:ATANASYAN_CHAPTER_I_COMPLETE_OK. This gate means introduction/chapterI,
not completion of the whole textbook. Scoped rollback is an ordinary revert
without deleting learner storage.
