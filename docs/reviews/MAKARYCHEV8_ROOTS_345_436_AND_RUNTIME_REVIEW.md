# Independent source and runtime review: square roots

Task: `MAKARYCHEV8_SQUARE_ROOTS_COMPLETE`.
Review level: HIGH.
Review date: 2026-11-06.
Base: `6c64ac63e6bad70993ec50995d3a39976b1b0a36`.

The reviewer authored 437–509 but did **not** author 345–436 or the runtime changes
reviewed below. This record is an independent agent review of the specified
files, not an external-provider audit and not a merge authorization.

## Source/math review of 345–436

Source SHA256:
`356695f0f11a489090ed72428320a6d6cc343747eec02968b716c2204caaced8`.

All exercise pages were read visually: printed 83–85, 88–94, 96–98, 100–103.
Figure 21 was additionally rendered at 200 dpi to determine its intercepts and
unit-cell scale. Extracted text was used only to navigate. No source images,
raw OCR or machine-specific paths are included in this record.

The independent fixture `roots-oracle-345-436.json` covers all 92 numbers and all
449 source cards: 439 new cards plus 10 preserved cards. Every expected final was
calculated from the textbook or an exact mathematical derivation independently
of the author answer fields. There are 70 additional meaningful wrong answers
for signs, omitted roots, domains, conjugates, proof conclusions, construction
counts and source-figure equations. All 449 positive and 70 negative cases pass.

Coverage includes every repeated substitution, both equations within 361а/б,
all sign branches of 403, all constructive questions of 353/410, and the valid
zero-conjugate cases of 426г and 429а/б. Retained steps were also inspected for the
proofs, approximations, modulus/domain conditions, source graph coordinates,
open examples and exceptional rationalizations; the general all-step checker
contract is recorded separately below.

### Findings resolved

1. **Source transcription 429д:** the source numerator is 9, not 6. The author
   corrected the complete card to `9/(3−2√2) = 27+18√2`. The independent fixture
   rejects the former `18+12√2` result.
2. **Valid-answer forms:** 382б now accepts “все действительные x”; 416д/е and 419в/г
   accept ordinary reordered expansions such as `a+2√(ab)+b`. Corresponding
   retained-step variants were added by the author.
3. Choice expectations in the review fixture use the actual capitalized button
   labels “Да”/“Нет”; no old task payload was altered to fit the fixture.

Reviewed content SHA256:
`3af0a4f7a704d1e0f4c0b66631df59a8773eb36bd1eebfd91e34787aa3023f0f`.

## Runtime review

Scope: `app.js`, `check.js`, `task-graphs.js`, `style.css` in Makarychev8.
Build, workflow and browser-test code receive a separate independent review.

The review checked:

- Exact rational interval boundaries and pairwise distinctness; reduced-fraction
  square classification; bounded irrational-example syntax.
- Exact BigInt discriminant and nonnegative-root classification for the arbitrary
  line/root intersection exercise. An additional independent SymPy oracle
  solved 85 rational-coefficient equations and agreed with the checker.
- Ordered point checking, shifted-root domains, absolute-value branches, open
  endpoints at x=0 and disconnected hyperbola branches.
- 16 complete learner point sets agree with their curve evaluator; 2117 new
  retained steps accept their canonical answers.
- Existing storage key, task IDs, explicit route indices, import validation and
  completion snapshots are preserved. New mathematical-key buttons insert at
  the caret through the existing input handlers rather than replacing state.
- Input normalization retains radicand boundaries, required transformed forms
  and sign distinctions; no dynamic expression evaluation was introduced.

### Runtime findings resolved

1. Home/progress topic links initially opened legacy index 0, skipping newly
   added first exercises. They now use the source-study entry. JSDOM verified
   p10→268а, p14→345а, p16→386а while the old explicit p14/0 route still opens A
   from 350. Search 350 now orders its cards A, B, C, D by the study order.
2. Figure 21 claimed a unit grid while the initial automatic grid used steps of 5.
   The renderer now draws unit minor grid lines for these bounded ranges and
   labels larger ticks separately. JSDOM verified 20 equally spaced vertical
   grid lines spanning x=−5 through 14.

### Verification

- Independent source fixture: 449 correct answers and 70 wrong answers PASS.
- Independent SymPy line-intersection cases: 85 PASS.
- Root engine: 732 checks PASS.
- Existing state suite: 20 assertions and workflow checks PASS, including reload,
  assistance snapshots, detour drafts and 45 distinct practice examples.
- Existing task-graph checks PASS, including legacy graph holes and pair input.
- Independent JSDOM checks for entry routes, old indexed routes, search order,
  progress links and figure 21 grid PASS.

JSDOM checks do not establish rendered layout. Local Chromium was unavailable
under the environment's socket policy; real browser journeys, responsive layout
and screenshot evidence remain required in CI. No physical-device or pupil
trial is claimed.

Reviewed runtime SHA256 values:

| File | SHA256 |
| --- | --- |
| app.js | `4bc218ca5bda36a538682a32461d4dc8d1849fb2edc74ff7e50cacc5baeb6fa1` |
| check.js | `ecbc2585509e318d59c56689715d6cfc2a7b1afa3ec50db097856d31556bfbe8` |
| task-graphs.js | `3b44d3481aa47e10038f3f4b09b133ec9cf2a4c3acd5f46f58f6f2435c05d2db` |
| style.css | `8727bcbcb05bad4df56f749f59e340da3fece63b17e6cf0245cfcce9383adb71` |

## Verdict

PASS for the reviewed source/math and runtime scopes at these file hashes; no
unresolved findings. Proceed to the full task gate and real-browser CI. A scoped
revert is the rollback path; learner storage must not be deleted. This record
does not review the author's own 437–509 range and does not replace the separate
build/workflow/browser-test review or the release authorization boundary.
