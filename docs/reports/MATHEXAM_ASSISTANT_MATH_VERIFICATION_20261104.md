# Assistant math verification — preparation evidence

Date: 2026-11-04 Asia/Novosibirsk. Task:
[MATHEXAM_ASSISTANT_MATH_VERIFICATION_20261104](../tasks/MATHEXAM_ASSISTANT_MATH_VERIFICATION_20261104.md).

## Continuation: equality-chain correction, 2026-11-05

Rechecked PR399 `7f4c054b9b8fb5b519dcab60e6fa4e461ed7c21f`, PR420
`c819927e484ce3afeae187d269974cb1cf2ead68` and PR429
`f04d39fe036bb54949136093caac54a4ac6070d4`; all remained open drafts.
The inspected main was `6a117de590a61e4a716db43b93f17db54b5c665e`.
The correction was published as `d798b05036141e997d617bd2ad8be8cdbbe4440f`.
GitHub reported a merge conflict, preventing the pull-request CI from starting.
Complete, non-truncated tree comparison found only `docs/PROJECT_STATUS.md`
changed on both branches. All prepended/appended entries from both sides were
preserved. The subsequent merge imports that pinned main into the task branch,
retaining every unrelated main file. All assistant runtime, source courses,
linked test dependencies and applicable existing policy files were unchanged
on main, so the tested runtime remains byte-identical. Candidate merge/CI
identities are recorded in the PR handoff. This is branch integration, not a
site release.

The checker incorrectly treated every link of `-3x=19-4=15` as a linear
equation requiring a unique root, rejecting the true numeric identity `19-4=15`.
It now classifies each adjacent link separately. A known false link also survives
unsupported neighbours; `log(x)=15=16` cannot hide `15=16`. Recognized incompatible
units remain rejected across unitless links. Unsupported chains remain unverified;
no explanation receives `mathematicallyVerified: true`.

Two new regression groups and the expanded 238-equation corpus failed against
the previous implementation (12 groups passed, 3 failed), then passed with the
correction. Final results in this continuation:

- **233/233 service tests**, zero failures/skips.
- **247/247 tests with immutable PR399**, including its 14 unchanged tests,
  plus **2/2 dedicated OpenAI mathematical-boundary tests**. Every transport
  was injected; no external requests. The composition script now includes the
  dedicated tests so CI repeats this evidence.
- **21 independent Python reference checks**, 3 human-only cases unchanged;
  both curriculum source reproduction gates passed.
- Syntax and whitespace checks passed for changed code.

Local verification used exact GitHub source snapshots and the same three-way
file composition as the repository script. The original large course JSON was
restored after an empty sparse-download result; its SHA256 matched the pinned
`9c269243f2940f0f86d5ba5ee918759cd52c19152f006f093bb2412447ba2776`.
Earlier incomplete-source runs failed and are not counted as final passes.
Exact candidate GitHub CI evidence belongs in the PR handoff, not this pre-push
report. Independent HIGH review is still outstanding.

The owner clarified the project's international audience and deferred the API
use-case choice. A support letter is not a prerequisite for these offline checks.
This work does not establish permitted API access, supply protected credentials,
or revise the frozen PR420 paid runner. No live model quality or cost was measured;
**actual external API calls: 0; API spend: $0**. Pupil routes remain unchanged.

## Inspected sources and non-duplication

- main `846040b338fd21a69f52132a75e29e4a9e2669b6`.
- PR399 head `7f4c054b9b8fb5b519dcab60e6fa4e461ed7c21f`, still Draft/unmerged.
- PR420 head `c819927e484ce3afeae187d269974cb1cf2ead68`, still Draft/unmerged.
- Existing exact rational, radical and interval parsers and linear equation
  solver are reused. Existing `model-unverified` labels remain unchanged.
- Both reported defects remained reproducible before this change. No prior
  mathematical validator was present at the provider response boundary.
- Main subsequently advanced to `7649cb1368f2c5631f79d25fa8414373481f9ed7`
  through PR428 (OGE homepage). Its seven paths do not touch this runtime,
  its tests or dependencies. Branch/CI identities are recorded in the PR.

## Result and scope

The provider separates structure from bounded mathematical evidence. Recognized
wrong claims are rejected, triggering the existing offline fallback. Current
exact evaluation rechecks actual answer text and vetoes detected errors even
under maximum manual scores. Validation metadata is outside the existing answer
object, preserving ledger/cabinet compatibility and the unverified-model label.

The 24 synthetic PR420 cases supply 21 automatically comparable final results;
d10/d14/c07 remain human-only. Arithmetic, complete root sets, rational pi
multiples, interval endpoints, recognized units and linear solution sets are
checked. Final and intermediate claims in all four text fields are inspected.
A correct final cannot override a detected contradiction. General linear and
selected arithmetic/rounding inputs are supported beyond the fixed corpus.

UTF-8 output and dialogue limits are explicit. Accepted cabinet model output
leaves room for the next maximum-length well-formed follow-up. Oversized or
ill-formed text is rejected, never truncated; existing history limits remain.

No external model call, pupil data access, adapter activation or deployment.
PR399/420 are not merged or edited. Their historical evidence remains historical;
the frozen PR420 runner does not silently acquire new source manifests/approval.

## Initial checks completed on 2026-11-04

- **231/231 current service tests**, 0 failures/skips in the final run.
- **245/245 composed service tests**, including all 14 unchanged PR399 OpenAI
  groups on a temporary three-way composition. No adapter file is imported
  into the task branch; all network transports are synthetic.
- **21 reference checks** in independent Python, no JS runtime/oracle imports;
  3 explicitly human-only prose cases. Reference root-set membership is based
  on the stated analytic factorization/unit-circle solution, not a live model.
- **238 generated linear equations**, each checked with correct steps, a wrong
  intermediate root and an identity that would discard the solution set.
- Counterexamples: valid JSON with wrong x=6 and no forbidden label; correct
  final with false intermediate arithmetic; contradictory title/text/check;
  missing/extra roots; open/closed excluded endpoints; equivalent fractions,
  mixed numbers, decimal comma and radicals; incompatible recognized units;
  ambiguous/unsupported syntax stays unverified.
- Byte checks: Cyrillic/emoji overflow, exact 3500-byte boundary and one-byte
  overflow, lone surrogates, NFKC expansion, raw-response cap, per-question
  dialogue allowance and real board-cache/prepareDialogue round trip.
- Real local cabinet HTTP: deterministic first answer uses no provider;
  synthetic wrong follow-up is withheld, offline answer is returned, one
  reservation is retained, no retry, replay remains rejected after restart.
- Both source reproduction gates PASS: `ATANASYAN_ASSISTANT_SOURCE_OK` and
  `ICHENSKAYA_ASSISTANT_SOURCE_OK`. JS syntax and whitespace checks PASS.
- GitHub Actions evidence for the published candidate belongs in its PR;
  this committed preparation report does not claim pending CI passed.

## Failures resolved and checks not claimed

An initial integration run rejected the new metadata in the strict evaluation
ledger answer shape. Moving validation beside the answer fixed that compatibility
failure without weakening the ledger. Initial sparse-checkout runs also lacked
existing linked curriculum pages; original files were restored and all tests
rerun. Intermediate negative-reference test inputs used unsupported interval/pi
syntax; they were replaced with mathematically wrong *valid* representations,
while unsupported-input tests remain separate and require `unverified`.

Local Docker/browser, independent technical review, external provider audit,
real GPT quality/latency, authenticated production flows and real pupil pilot
are not claimed. Standard GitHub CI supplies browser/image checks when complete.
HIGH independent technical review remains a release requirement under repository
policy; author review and independent arithmetic are not a substitute. No new
owner publication permission is needed; no external audit is requested.

## Limits and rollback

This is a bounded claim checker, not a general proof checker. Prose, theorem
selection, relevance of true intermediate arithmetic, unknown notation, diagrams
and arbitrary domains of definition remain unverified. A matched final result
never establishes the correctness of the whole explanation. Quoted/hypothetical
claims are treated conservatively, and narrative ambiguity can cause rejection
or no verdict. Full recognition limits and commands are documented in
[MATHEMATICAL_VALIDATION.md](../../assistant-service/MATHEMATICAL_VALIDATION.md).

Rollback is a scoped code revert. No migration, ledger reset, pupil work deletion,
provider flag, auth setting or cost configuration is changed. Failed external
responses keep the existing conservative reservation and cannot trigger retries.

```text
EXECUTIVE STATUS
Task: MATHEXAM_ASSISTANT_MATH_VERIFICATION_20261104
PR: recorded in GitHub handoff
Base: 6a117de590a61e4a716db43b93f17db54b5c665e
Head: recorded in GitHub handoff
Gate: MATHEXAM_ASSISTANT_MATH_PREPARED_OK; not a release gate
Tests: 233 current; 247 with PR399 plus 2 dedicated; 21 independent references; source/syntax/whitespace
Failures: none remaining in final workspace tests; initial failures explained above
Not run: real models/pupils; independent technical review; local Docker/browser
Scope deviations: none
Recommendation: retain external inference OFF; finish exact-candidate CI/review before release
Next user decision: none for preparation; no repeated publication/audit authorization
```
