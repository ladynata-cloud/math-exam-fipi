# Independent joint review: Atanasyan IV §3 Sphere

## EXECUTIVE STATUS

Task: `ATANASYAN_SPHERE_372_395`

PR: #386; the executing agent records the final committed head separately.

Base: `139b944a70f2e8ba4d340d152d08807fad03e5da`

Head: Recovered candidate `a1e4b7611ec4b829ccdc5ab0023d9679ab2899e5` plus the exact theory051 amendment bound below. This is a content verdict, not an exact-head CI verdict.

Gate: `PASS_INDEPENDENT_SOURCE_MATHEMATICS_AND_WRITTEN_PEDAGOGY`

Tests: Three independent scoped reviews cover all46 cards; selected source/identity/coordinate checks are attributed below. The original complete oracle evidence is retained with its original author.

Failures: No open source, mathematical or written-pedagogy findings remain at the exact payloads below.

Not run: This panel has not approved the responsive images, full amended browser journeys, exact-head CI or deployment.

Scope deviations: None within this review. Only the two review reports were edited; no lesson, review flag, registry, oracle, test or ref was changed by the report recorder.

Recommendation: Register the exact panel identity and timestamp, then finish the separate image, integration and CI gates.

Next user decision: Merge and publication still require separate explicit owner authorization.

## Current binding

Panel: **Codex independent source, mathematics and written-pedagogy panel: visual_middle, visual_late, release_audit; no reviewed-candidate lesson authorship**

Main panel review completed: **2026-10-31T01:04:51.530Z**

Formatting-only follow-up: **2026-10-31T01:10:17.075Z**. The main panel registration timestamp is retained; the later review binds the isolated display normalization described below.

Machine-readable record: [ATANASYAN_SPHERE_CONTENT.json](ATANASYAN_SPHERE_CONTENT.json). The source is the 2024 twelfth edition, printed100–111 / PDF102–113.

| Binding | SHA256 |
|---|---|
| Original source PDF | `bead97a383e438b32b9caaff72d61d27e8fa6cd20c6b86a5f234bc4cdb629770` |
| Current46-card canonical aggregate | `fd5ee10548e6a7aba2287364fbf2648db1b3c81bab64195a9f8cc2d4f77c4a73` |
| Amended theory051 canonical payload | `a7e5f4a85bd60135b5c2a1843ac8b0815010aa287f717ee94b68182b7f8bf6bc` |
| Unchanged inherited oracle | `99cde0f45bf77a4a088982641f8fc0b34fc22f3252b75ab21615bdee45ce8737` |

Canonicalization removes only top-level `status` and `review`, recursively sorts object keys, preserves array order and hashes UTF-8 Node `JSON.stringify`. The aggregate uses lexicographically ordered card IDs. All45 other content hashes remain identical to the recovered candidate. Theory051's complete visualization, including geometry, sphere primitives, view labels, note and caption, is also unchanged.

The exact current batch has **46cards,192solution steps,197model views and105help entries**. It contains37 exercise parts372–395 and9 theory points43–51. Exercise382б remains included with its source area12cm² without an extra factor of π.

## Independent panel and provenance

| Reviewer | Exact scope | Evidence SHA256 |
|---|---|---|
| visual_middle | 19exercise cards372–382, including both382parts | `f2e49ebdf9c09cbf136c1765573c971c0883d08f9ec55e59581867327ac2e671` |
| visual_late | 18exercise cards383–395 | `2c613115e2c52b60830cb63a1d0d9f8a133368b3294f852a25bebf6f2564f100` |
| release_audit | 9theory cards043–051; original findings and coordinate review | `84c58bf358daf25a34c8662c185319144a5f9d415f1b07358df2011108284dde` |
| release_audit | Full rereview of the amended051 | `48f2d1c4c3439d4e02300bb3ac8541d3dee6b177efa0c234fcad4420554190e4` |

The evidence artifacts are respectively `sphere-existing-candidate-early-review.json`, `sphere-existing-candidate-late-review.json`, `sphere-existing-candidate-theory-review.json` and `sphere-theory051-followup-review.json`, retained in the handoff evidence. Their scopes are disjoint and cover every current payload. None of these reviewers authored the recovered candidate lessons. Separate interrupted drafts in other worktrees were not the reviewed candidate. The executing root authored the051 repairs; release_audit reread the entire amended card.

Each scoped reviewer read all relevant conditions, goals, prompts, written solutions, justifications, help, answer instructions, captions, model notes and view labels. Their respective targeted check records contain619checks,328coordinate checks and4520source/identity/coordinate checks, with no failures. These counts have different scopes and are not a replacement for the full course gates.

## Theory051 findings and resolutions

The recovered report's previous PASS did not establish complete source coverage. A fresh review found the omitted source remark1 on printed109/PDF111, incorrect asymptote wording and an incomplete focus/directrix boundary. These findings and their original exact content hash remain in the JSON history.

| Finding | Exact resolution independently checked |
|---|---|
| Missing second Dandelin sphere and focal sum/difference proof | Steps9–11 construct both spheres for a≠s, treat their nappes and signed plane distances, prove contact-point ordering and derive the constant sum for ellipse or absolute difference for hyperbola. The parabola has no second finite sphere. |
| Asymptotes incorrectly included in the converse | Help h2 now covers both hyperbola branches and explicitly excludes asymptotes using z²−y²=1 versus z=±y. |
| Unproved MH>0 and missing local conic equivalence | Step3 excludes F and all section points from the directrix by the tangent-generator contradiction P∈α. Help h5 proves the reversible focus/directrix quadratic and all three canonical cases. |
| Strict half-space wording in a preliminary amendment | Final steps10–11 place tangent spheres in closed half-spaces, while generator contact points are strictly in the corresponding open half-spaces. |

For the two-sphere proof, with a=sinφ, s=sinθ and h>0, the axial parameters are t₁=h/(a+s) and t₂=h/(a−s); radii are |tᵢ|s. The signed distances determine whether the spheres occupy opposite or the same closed half-spaces. A generator contact on α would force the whole generator and P into α, which is excluded. This establishes the point order before adding or subtracting distances. The constant is |t₁−t₂|cosθ and the focal separation is |t₁−t₂|cosφ. Circle, parabola, both hyperbola branches and the vertex-plane angle cases are addressed explicitly.

For the local lemma, F=(f,0), f>0, and the directrix X=0 give √((X−f)²+Y²)=e|X| with e>0. Squaring is reversible and gives (1−e²)X²+Y²−2fX+f²=0. There is no X=0 solution. Completing the square gives ellipse or hyperbola; e=1 gives a parabola. The earlier valid full cone-plane quadratic proof remains intact.

The existing ellipse/hyperbola views illustrate the curves. The amended explanation explicitly states that the single retained sphere in the hyperbola view belongs to the earlier elliptical construction; it does not identify it as either of the new auxiliary spheres. This report does not claim new rendered-image approval.

## Preserved source and mathematical work

The current panel found no blocking source, proof or selected-coordinate issue in43–50. In particular,46 states the shrinking maximum-face-diameter condition and honestly defers the sphere-area proof to62;48 supplies a complete axial-center construction for every permitted plane;49 proves the positive chosen-nappe construction instead of assuming a ray intersection;50 supplies the full canonical/focal ellipse lemma and a reversible coordinate converse.

The original reviewer `release_verification` recorded the complete source materialization, twelve rendered-source-page comparisons,3300parameter cases,276boundary cases, all46actual models and29rejected negative controls. That original record and its exact oracle hash are retained as **inherited evidence**, not a new execution or a source-render comparison personally repeated by this panel. The current scoped reviews and the full051 proof rereview have their own attribution.

The oracle [sphere-math.test.py](../../tools/stereo-textbook/sphere-math.test.py) was not edited or rerun by the current report recorder. The geometry is unchanged. Any subsequent oracle change requires a new explicit file binding and corresponding evidence.

## Retained history

The JSON preserves the initial review, the385/46 boundary/source-link follow-up, the387 caption follow-up, the complete recovered per-card record, the fresh CHANGES_REQUIRED findings and this amendment. The earlier report is available in the handoff evidence as `sphere-content-report-before-joint-panel.json` (SHA256 `ebfba91f42bb8cb533c329da5967a2277122d1ecb4dc060aadb3b8e6783ffd0f`); its Markdown is retained as `sphere-review-before-joint-panel.md` (SHA256 `33352b7fae2de348e5170f57c3a87923912676455fdcff8b1fb8775a45e6d0a9`).

| Stage | Aggregate or relevant payload |
|---|---|
| Initial original review | `58ff02a5f68856b099364ff62f2f3bfdd2b65a401f89c0c39a1a6583c17aa563` |
| Original385/46 follow-up | `398f9f1fb57af286159c08ee565bb17f96a99743fd665a73c1cf11a92b2347fc` |
| Recovered candidate after387 caption follow-up | `b30c75c0bae3e8131510f703b5dee4712042c2bdf1ba1a82fc6eb256f1d13310` |
| Previous051 payload with the now-resolved omissions | `ef7d1d48972c3d322e95bc5e65f26a4cc57580f50a4719fe04c0cb65ad9a461b` |
| Current46-card aggregate | `fd5ee10548e6a7aba2287364fbf2648db1b3c81bab64195a9f8cc2d4f77c4a73` |

The old PASS for051 is explicitly superseded for completeness; it is not reused as sufficient approval of the omitted assignment. All four resolutions above are bound to the current051 payload.

## Formatting-only follow-up

The executing agent changed exactly one sentence fragment in theory051 step3:

- Before: `Поэтому MF/MH=cosφ/cosθ=e.`
- After: `Поэтому MF/MH=(cosφ)/(cosθ)=e.`

The parentheses make the trigonometric fraction recognizable to the existing conservative display formatter. Independent inverse replacement reconstructed the prior approved payload SHA256 `7215244fdf5ec90fe93dbe64bb8817bb1e700541dec3b211c192a439c8f1e07c` exactly. The current payload is `a7e5f4a85bd60135b5c2a1843ac8b0815010aa287f717ee94b68182b7f8bf6bc`; all45other payloads and review rows, all geometry/view text and the oracle bytes remain unchanged. Counts remain192steps,197views and105help entries.

Reviewer: `release_audit`; follow-up time: **2026-10-31T01:10:17.075Z**. The main joint-panel timestamp **2026-10-31T01:04:51.530Z** remains the registration date; the JSON records this later content-binding time separately. Evidence artifact: `sphere-theory051-formatting-followup-review.json`, SHA256 `3256ab11596cb365d29b08ca23984ac2bbb44f57c9997fc5217ca924b1e13929`.

The executing root reported a passing actual StereoMath DOM check on161strings with no raw fractions or detached superscripts. This scoped reviewer did not repeat that DOM run. The previous failed gate log is retained by the executing agent. Full responsive image review and subsequent gate results remain separate. The preceding46-card aggregate `2f8592fb5e50599ae284b4c912897c8dd2d7263c6619375212668d0d53b3bb92` is preserved in the JSON history.

## Remaining boundaries

Actual responsive image review is **pending**. The executing team must verify the current text and added steps/help in the browser and finish applicable integration and exact-head CI gates. This report grants no merge or deployment authorization and claims no external paid-provider review, physical-device or pupil trial. The37 exercise cards retain manual answer assessment; arbitrary written proofs are not automatically certified.
