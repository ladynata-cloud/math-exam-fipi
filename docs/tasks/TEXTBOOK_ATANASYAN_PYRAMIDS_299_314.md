# Atanasyan 2024 — additional pyramid exercises 299–314

## Identity and approved continuation

- Owner instruction: «продолжай», after verified publication of PR345 on 2026-10-26.
- Task: TEXTBOOK_ATANASYAN_PYRAMIDS_299_314; review level HIGH.
- Base: main `6c7339a730ba3591859bd4c8c0d8ce9be64efd7c`.
- Branch: `content/atanasyan-299-314`.
- Parent scope: [complete textbook](TEXTBOOK_ATANASYAN.md). Use the established course interaction; no new archetype.

Complete the additional pyramid block 299–314. Actual printed pages 87–88 / PDF pages 89–90 contain sixteen numbered exercises and eighteen cards: 299–306, 307а/б, 308–310, 311а/б, 312–314. Source SHA256: `bead97a383e438b32b9caaff72d61d27e8fa6cd20c6b86a5f234bc4cdb629770`. Each author and independent reviewer must visually read the actual source pages before deriving a solution.

## Published baseline

PR345 was explicitly authorized, squash-merged as the base above, and deployed by Pages run40322565353. Post-push Profile run40322565854 passed all three jobs. Eighteen public files / 36 canonical and cache-busted requests matched reviewed bytes. Published course: 495 cards, 1,819 steps and 1,877 model states, all main exercises 1–298, 37 theory points and 40 self-check questions. Bundle SHA256 `ef3c30c8c415dfd79dccb393584f01899797bb2de73bfd0fe24a7d4929abb37e`.

## Scope and acceptance

Preserve all 495 prior raw lesson files, 25 review batches, 1,099 screenshot cases, runtime/schema/builder and learner-state contracts. Add only eighteen source-specific lessons, source completeness contracts, independent review, reproducible bundle, additive tests/captures, exact historical-baseline adapters and task/status documentation.

- 299–302: regular triangular pyramid height; a section through specified midpoints; a 120° dihedral angle at a lateral edge with a given point-to-line distance; lateral edges over a parallelogram base.
- 303–306: rhombus with two vertical faces and two faces inclined at 30°; relation between two types of dihedral angles in a regular square pyramid; lateral/full areas with a prescribed apex angle or height-to-face angle.
- 307–310: section through a square-base diagonal parallel to a lateral edge and equal distances; face altitudes over a rhombus; section through the shorter leg and midpoint of height; lateral area with one perpendicular lateral edge.
- 311–314: total area and perpendicular foot in a specified lateral-face altitude; arbitrary regular n-gonal pyramid angles; triangular and square frusta with the exact source data.

Each source part gets its own card and progressively revealed model. Keep the initial view uncluttered; reveal auxiliary points and lines only when explained. Every construction states the containing plane. Explain all angle identifications, orthogonality, domains, existence/nondegeneracy and hidden case distinctions. General proofs must not depend on a special illustrative coordinate choice. Do not add invented source subparts or put the answer into the opening question.

Keep earlier steps and written work, contextual theory, readable fraction bars, powers/radicals and large phone-readable labels. Proof and formula answers remain manually assessed. The target is 513 reviewed cards and complete main exercises 1–314; the book remains incomplete.

Out of scope: 315 onward, new theory points, runtime/renderer or synchronization redesign, learner-state changes, accounts/hosting and source PDF/page-image publication. No private file IDs, machine paths, credentials or full source-book extraction in repository/handoffs.

## Independent review and validation

An independent reviewer who authored none of the lessons must check all source statements, proofs, help, theory references and actual coordinates before review flags become passed. Exact canonical content hashes bind the review; preserve review history after corrections. Paid Claude remains deferred under the whole-course owner decision; do not claim an external-provider verdict.

Required: reproducible build; catalogue/schema; hash-pinned historical projection with meaningful mutation checks; independent parameter/geometry oracles; full historical content/model/runtime gates; complete additive model and proof captures; browser partition/collector tests; exact-head cloud journeys; actual new-image, initial-screen and full-explanation inspection at 320/1280; formula layout, sitemap and whitespace checks. A screenshot manifest alone is not visual review. Do not weaken or remove any inherited assertion.

Final gate: `ATANASYAN_PYRAMIDS_299_314_REVIEW_OK`, only after exact-head checks and actual pixel inspection. Report passes, resolved/open failures and not-run trials separately. Real-pupil/physical-device trials are not claimed.

## Risk, rollback and handoff

Risks: confusing an internal dihedral angle with the acute angle between planes, silently imposing perpendicularity absent from the source, using a special model as general proof, selecting the wrong section polygon, and clipping long formulas. Independent derivations, non-special parameter checks and actual pixels address them.

Rollback is a scoped revert of the eighteen lessons and corresponding content/test increment. Existing learner-state contracts remain unchanged.

The continuation authorizes implementation, checks, commits, push and one Draft PR. Publication of this new block needs the separate owner release decision required by AGENTS.md; prior approval covered PR345. No force/reset/rebase, automatic branch repair, admin override or weaker check.

The PR records exact base/head/tree, review provenance, all gates and image coverage. Reconcile the preceding verified release in PROJECT_STATUS.md within this task; do not create a status-only PR.

## Source-answer cross-checks

The actual answer page was also visually inspected: printed 264 / PDF 266. For 299 the source parameter is m and must remain m in the authored explanation. For 301 the answer 4√6 confirms the intended distance to the line containing DA; its perpendicular foot lies beyond D, which the solution explains explicitly.

For 309 the printed condition (right base with legs 6 and 8, equal lateral edges, height 6, section through the shorter leg and midpoint of height) gives area 20 square decimetres. Three independently obtained derivations agree. One coordinate check uses A=(0,0,0), B=(6,0,0), C=(0,8,0), S=(3,4,6); the section plane z=3y/4 meets SC at (2,16/3,4), giving altitude 20/3 to the side AB=6 and area 20. The printed answer key instead states 80/3. Preserve the actual condition and include a short explicit note after the derivation; do not silently alter the problem or substitute the printed answer. Keep this card manually assessed and record both source pages in the independent review.

## Verified authoring checkpoint

Eighteen new cards add 106 justified steps and 111 model states. Candidate: 513 cards, 1,925 steps, 1,988 states and 1,375 catalogue rows, with all main exercises 1–314, 37 theory points and 40 self-check questions. All prior 495 raw lesson files, 25 review batches and 1,099 browser cases remain exact.

Independent source, mathematics and written-pedagogy review passed at 2026-10-26T14:06:36.794Z. The current canonical aggregate is `83063ffb98db747f11fea0f9bcc6831110d0ba269cd2d953d1f21aa6c95b530e`. Review history preserves the earlier snapshots before one terminology correction in 302 and before the subsequent geometry-only correction in 313; the preceding aggregate was `e3fc5a7de49703ba6e9c4e2606a9e3a9130e7525d4f6b36147079ac7a6fc7c28`. All eighteen cards also received a cross-review by an author of different cards. Independent coordinate oracles cover 160 parameter families, arbitrary regular polygon sizes 3–12, 142 authored planar polygons and 348 segments. Root separately checked six invalid affine variants; all were rejected.

Full integrated content and historical suites, catalogue/schema, model geometry, runtime, parallel content, eight mathematical suites, actual fraction renderer, sitemap, 56 partition/collector checks, full and four-shard browser-free preflights and whitespace pass. Bundle: 4,108,146 bytes; SHA256 `1eb217a08214833cbcd99a80d46d808130fb8ca8ade682ebdee0ad98aaf59ed9`.

The additive inventory contains 124 cases / 248 new mobile and desktop images. Full cloud targets are 1,026 card-width journeys, 7,942 label states and 2,450 screenshots, including four expanded images. These are expected counts until the actual cloud runs complete.

Renderer diagnostics found nearly edge-on figures before cloud execution. Rigid rotations preserve all source dimensions. A new scoped browser regression measures actual screen polygon area relative to its face-on area and area divided by maximum vertex distance at the captured and default orientations, restoring the exact camera. For a triangle, the latter metric equals half its minimum altitude. Historical assertions remain unchanged. The first actual mobile images of 313 showed that the short legs of its intrinsically small normal triangle were hard to distinguish. The author applied an additional rigid 30° rotation around the vertical axis to all its model points; all source dimensions and written content were preserved and independently re-reviewed. A targeted regression requires at least an 8px minimum altitude for this triangle in both orientations, while retaining the general projection thresholds. Fresh cloud images and independent visual inspection of this corrected snapshot remain pending; a numerical projection check is not a visual verdict.

The first two symmetry workflow attempts exhausted the 15-minute job budget after slow dependency installation. Source and mathematical checks passed in both; the second also printed the successful browser result for 30 journeys and 86 model states immediately before cancellation. Both cancelled outcomes remain in the release evidence. The sole workflow repair increases that job budget to 25 minutes; steps, dependency pins and assertions are unchanged. A fresh run on the corrected head is required.

Earlier cloud and pixel evidence belongs to the preceding snapshot. A final cloud or pixel pass for the corrected snapshot, real-pupil/device trials and publication are not claimed at this checkpoint. The PR records subsequently completed exact-head cloud and visual evidence.
