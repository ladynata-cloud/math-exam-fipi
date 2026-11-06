# Assistant mathematical verification

- Task: MATHEXAM_ASSISTANT_MATH_VERIFICATION_20261104
- Owner: MathExam owner; direct request in the current conversation, continued
  with cloud execution while the owner rests.
- Date: 2026-11-04 Asia/Novosibirsk
- Base: main `846040b338fd21a69f52132a75e29e4a9e2669b6`
- Branch: `fix/assistant-math-verification-20261104`
- Review: HIGH (untrusted provider output and server response boundary).
- Architecture: accepted ADR0011, independent deterministic checking.

## Approved scope

Inspect current main, PR399 `7f4c054b9b8fb5b519dcab60e6fa4e461ed7c21f`
and PR420 `c819927e484ce3afeae187d269974cb1cf2ead68`. Both remain Draft and
unmerged at inspection. Main already labels model output `model-unverified`,
and already has rational arithmetic and linear-step checking; reuse those.

Add bounded independent checks of known final results and explicit intermediate
equations. Separate structure, mathematical claims and unverified prose. Enforce
UTF-8 byte limits and preserve cabinet continuation limits without truncation.
Add adversarial regression tests and rerun the PR399 tests on a temporary
composition, without importing or releasing its adapter into main.

No paid/live model calls, pupil activation, learner-data changes, new provider,
authentication/persistence/budget redesign, new trainer or curriculum expansion.
Historical evaluation PR420 stays immutable; its synthetic reference tasks are
reused with provenance. No claim of measured GPT quality.

## Acceptance and checks

Continuation, 2026-11-05: the owner requested further preparation without a
support letter while the future API use case remains undecided. MathExam has
an international audience; no audience nationality or access-location assumption
is an authorization check. This continuation fixes the false rejection of mixed
linear/numeric equality chains and adds regression tests at the existing OpenAI
composition boundary. It does not assert API eligibility or change release gates.

- Wrong final results and supported wrong equations cannot pass by JSON shape.
- Contradictions in recognized claims veto positive manual scoring too.
- Unknown prose/notations have no automatic mathematical pass state.
- Test 21 exact PR420 results and the 3 human-only prose cases; independently
  check references in Python without importing the runtime oracle.
- Run full service tests, source reproduction, cabinet compatibility, synthetic
  HTTP fallback/reservation checks and PR399 composition tests; applicable CI.
- Final gate: MATHEXAM_ASSISTANT_MATH_PREPARED_OK.
- Independent technical review is required before a HIGH release; do not
  mislabel author review or independent arithmetic as that review.

## Permissions and rollback

The owner's direct action request authorizes implementation, branch, commits,
push and PR. Standing OWNER_RELEASE_AUTHORIZATION.md applies after required
checks; external provider audit is not requested. Neither permission enables
the external API for pupils. No further routine publication confirmation needed.

Rollback is a scoped code revert; preserve both ledgers and pupil records.
Fail closed to existing offline materials on rejected output, without retry or
refund. Recognized unsupported/ambiguous notation remains explicitly unverified.
Source/API version compatibility and false-positive rejection are the main risks.
Execution evidence and unavailable checks belong in the task report and PR.
