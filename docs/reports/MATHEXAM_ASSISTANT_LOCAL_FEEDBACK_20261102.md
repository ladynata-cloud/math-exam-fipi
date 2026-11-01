# Local assistant feedback: preparation evidence

- Date: 2026-11-02 (Asia/Novosibirsk).
- Task: [MATHEXAM_ASSISTANT_LOCAL_FEEDBACK_20261102](../tasks/MATHEXAM_ASSISTANT_LOCAL_FEEDBACK_20261102.md).
- Base: `059ee8c9f5baeb0b333c96d9b8516edb570666b2` on `main`.
- Branch: `feat/assistant-local-error-feedback-20261102`.
- Review level: MEDIUM. Focused source review and independent mathematical
  expectations; no external-review claim.

## Result

The deterministic assistant now explains several recognizable wrong numerical
attempts. Wording says "Похоже" because a number cannot establish how someone
reasoned. Equivalent correct answers take precedence over every error pattern;
unknown mistakes retain the generic feedback. The existing simpler mode uses
shorter explanations, and a hint still contains one step.

| Synthetic task | Wrong attempt | Feedback direction | Requested full result |
| --- | --- | --- | --- |
| `1/2 + 1/3` | `2/5` | Make the fractional parts the same size; do not add denominators | `5/6` |
| `3x + 5 = 20` | `25/3` | Undo the separate term with the inverse action on both sides | `5` |
| `3x + 5 = 20` | `15` | Divide both sides by the coefficient still attached to x | `5` |
| `0,1 + 0,2` | `0,12` | Add counts of tenths rather than concatenate digits | `0,3` |
| `1,2 + 0,03` | `0,15` | Align equal place values | `1,23` |
| `0,2 * 0,3` | `0,6` | Count decimal places in both factors | `0,06` |
| `3,6 : 0,12` | `0,3` | Scale both dividend and divisor by the same factor | `30` |
| `НОК 12, 18 и 30` | `6` | Distinguish common divisor from common multiple | `180` |

The shared NOD/NOK solver accepts two to five positive integers, each no larger
than 999999. It uses exact integer arithmetic and retains the previous maximum
result envelope of 999999999999. The explanation decomposes every input,
selects minimum/maximum prime-factor multiplicities and checks division for
every input. This serves both the standalone assistant and cabinet profiles.

Mixed separators require whitespace after a comma: `НОК 1,5 и 12` and
`НОК(1,5;12)` are unsupported. Existing comma-only integer notation such as
`НОК(12,18,30)` and two-number compact notation remain supported. This is a
bounded grammar, not an interpretation of arbitrary textbook prose.

## Verification

| Check | Evidence |
| --- | --- |
| Full local service suite | `npm --prefix assistant-service test`: 140/140 pass, 0 skipped, Node 24.22.1 |
| New regression groups | 9 groups covering feedback, equivalent correct answers, decimal errors, arithmetic enumeration, grammar/limits, partial hints and real local HTTP |
| Independent multi-input oracle | All 3,875 ordered lists of length 3–5 with values 1–5; direct enumeration of divisors/multiples, 7,750 mathematical expectations checked through both entrypoints |
| Signed fraction/decimal feedback | 256 fraction cases with independent cross-products plus 50 decimal place-value cases; exact and equivalent correct answers always win |
| OpenAI compatibility | 154/154 tests on the isolated composition with PR399 head `7f4c054b9b8fb5b519dcab60e6fa4e461ed7c21f`; only synthetic transports |
| Existing pair behavior | Original independent 1–20 pair coverage retained; the obsolete unsupported-three-input example is replaced with the new six-input rejection boundary |
| Source-only courses | `node assistant-service/scripts/build-course-knowledge.cjs --check`: both ATANASYAN and ICHENSKAYA source gates pass |
| Transport and cost | Synthetic cabinet HTTP with a throwing fetch stub, fake enabled provider configuration and fake consent: 0 transport calls, 0 API requests, 0 reserved micros |
| Local browser execution | Attempted; all four tests failed at Chromium startup, before UI assertions, with `socket() failed: Operation not permitted` |
| Diff hygiene | `git diff --check` passes; no runtime dependencies or generated course projections changed |

The browser regression now exercises fraction feedback and NOD/NOK lists of
three, four and five inputs through the real isolated service, preserves the
first hint after requesting the full solution, and checks widths 320/390/1280.
The added journey starts a fresh synthetic session through the existing UI so
each journey stays within the unchanged ten-requests-per-minute limit.
Local Chromium startup is unavailable in this execution environment; its failed
launch used Playwright 1.62.1 and the installed Chromium executable. The existing
GitHub workflow uses its pinned Playwright 1.55.0 on Ubuntu 24.04 and also runs
container restart/source-course checks. Those CI results must be read on the
published PR head, not inferred from local service tests.

## Additional signed-value verification

The continuation retains the existing PR401 implementation and adds two
regression groups to its existing test file. No second implementation or PR
was published. All runtime files are byte-identical to reviewed candidate
`0a8fca108d1c8fb623be4452445e9cdc7e48a34b`; only tests and documentation changed.
The README and cabinet capability table now describe the implemented 2–5
number scope and numeric bounds instead of the obsolete two-number limit.

The 256 signed fraction cases check correct-answer precedence when a common
wrong-operation pattern coincides with the actual result, including zero and
cancellation. Expected values use independent integer cross-products, without
the production rational reducer. The 50 decimal cases combine both signs,
addition/subtraction, integers and trailing zeroes with an independent scaled
integer oracle. This adds 306 cases to the existing 3,875-list NOD/NOK oracle.

The complete current-head suite passes 140/140. The isolated OpenAI composition
passes 154/154 with all original tests retained; this is compatibility evidence,
not a live provider test or permission to activate PR399. The existing browser
startup restriction below was not retried locally. Previous CI runs 41344559666 and 41345313197
belong to earlier heads; the updated PR records final exact-head CI separately.

## Review, limits and release boundary

- PR375 was confirmed merged by GitHub at 2026-11-01 18:42:23 UTC as
  `059ee8c9f5baeb0b333c96d9b8516edb570666b2`; this check establishes repository
  state, not a new production audit.
- During publication of Draft PR401, PR400 advanced main to
  `5bbfe3a4615b6410dacf7f1344aa57b909a986ef`. A read-only merge identified
  only a `PROJECT_STATUS.md` conflict; no assistant runtime files overlapped.
  PR400 already reconciles PR375 in that shared status file. The redundant
  status edit from this task was withdrawn, preserving the upstream record
  in the resulting composition. This report retains this task's evidence.
  No merge, rebase or history rewrite of the task branch is needed.
- Source review checked rational equality, sign handling, zero divisors,
  coinciding mistake patterns, large outputs, decimal/list ambiguity and
  retention of the existing hint/full contract. A numeric attempt only supports
  a tentative explanation; this does not diagnose the learner's mental model.
- Existing root-task context and follow-up mechanisms are inherited from
  merged PR375. No new free-form dialogue interpretation or model capability
  is claimed by these changes.
- Source-only textbook helpers keep their curated behavior. Separate course
  navigation and multi-number course exercises are not copied into this PR.
- PR399 remains separate. Its model semantic validation, real explanation
  quality, provider availability and pupil-data requirements remain open gates.
- No external inference, real pupil records, production configuration changes,
  merge or deployment occurred. Fake keys/subjects in tests are synthetic.
- Rollback: revert this bounded patch; no storage migration is involved.

The local mathematical gate passes. Final preparation requires successful
applicable CI on the published head; the Draft PR records that result. Even
successful preparation does not constitute release or pupil-testing approval.

```text
EXECUTIVE STATUS

Task: MATHEXAM_ASSISTANT_LOCAL_FEEDBACK_20261102
PR: single Draft PR for the named branch; exact identity in GitHub
Base: 059ee8c9f5baeb0b333c96d9b8516edb570666b2
Head: published commit recorded in the Draft PR
Gate: LOCAL_MATH_OK; browser/container CI pending at local report time
Tests: 140/140; OpenAI composition 154/154; both source projections; independent arithmetic; zero transport
Failures: local browser startup blocked by the execution environment
Not run: live model inference, pupil testing, production deployment
Scope deviations: none
Recommendation: inspect exact-head CI, then review the deterministic improvement
Next user decision: separate release decision after the Draft PR is reviewed
```
