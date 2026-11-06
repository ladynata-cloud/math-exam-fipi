# Author checkpoint: Makarychev 8, №345–436

This is an author self-check, not independent review.

## Scope and source

The content file `school/makarychev8/roots-345-436.json` covers all 92 textbook exercise numbers 345–436 with 439 new cards. Its per-number `coverage` lists the original subparts in source order, including 10 already existing cards in `ch2.json`. No existing task was edited. The source SHA-256 is `356695f0f11a489090ed72428320a6d6cc343747eec02968b716c2204caaced8`.

Printed source pages 81–103 were visually inspected; task references are on pages 83–85, 88–94, 96–98, and 100–103. The introduction and intermediate theory pages were used to interpret notation and graph actions. Each card has at least two mathematical steps. Topic counts of newly appended cards are p14: 73, p15: 110, p16: 66, p17: 83, p18: 107.

## Source fidelity and mathematical decisions

- №348–349 use a visible graph and explicitly request decimal rounding to tenths. Half-up rounding is used, including 0.25 → 0.3, 2.25 → 2.3, and 6.25 → 6.3.
- №350 retains the existing A and D cards unchanged; B and C are added.
- №353 includes the plotting action, all four intersection questions with coordinates where applicable, and three open constructions of a line with zero, one, or two intersections. The last three use the `root-line-count` validator with user-supplied rational k and b. The proof substitution is t = √x ≥ 0.
- №353г has the unique intersection x = 2 − √7/2, y = (√7 − 1)/2; the graph question asks for the coordinates rounded to tenths.
- №355б has x = ∛16 ≈ 2.52, not a fabricated square-root expression. №355в has no solutions.
- №373 and №430 require numerical or algebraic witnesses for the identities, rather than accepting the displayed right-hand side as a proof.
- №374 includes all three natural solutions n = 10, 14, 38, justified by all positive divisor pairs of 75.
- №382 adds both the specified numerical evaluations and the all-real domain question.
- №389–390 and №403 retain absolute-value/sign cases, including a negative external factor. №403 does not silently assume that every free variable is nonnegative.
- №410 includes all three displayed equalities, the general condition b = a² − 1 with natural a ≥ 2, and a new numerical example.
- №411 includes both Heron computations and the fourfold area increase when all sides are doubled.
- №412 follows the actual bookbinding story: students rebound 144 books; daily counts are 36, 48, 60.
- №422–429 preserve original domains after cancellation. In №426г, a = b > 0 is valid and yields √a/2, so it is a separate card. In №429а, x = √y > 0 yields 1/2; in №429б, a = −√b with b > 0 yields −√b/2. These cases must not be lost by multiplication by a zero conjugate.
- Source figure 20 is represented by its three labeled lines. Enlarged inspection of figure 21 confirms line a is y = x/5 − 2 and line b is y = −2x + 1: b crosses the y-axis at 1, not 0.

## Validation boundary

The author checked JSON integrity, unique IDs, complete 345–436 coverage, retention of all 10 original IDs, and minimum step counts. A preliminary canonical checker check passed before the final `root-line-count` addition. Runtime, independent mathematics/source review, all-card browser journeys, and full repository gates belong to the integrating task and are not claimed here.
