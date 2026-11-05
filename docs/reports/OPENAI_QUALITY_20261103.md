# Independent technical review and protected setup — 6 November 2026

The owner authorized an independent agent to review the program without access
to the key. A separate Codex review agent completed that review in this task
session. Verdict: **APPROVE_FOR_BOUNDED_TRIAL, technical scope only**. This is an
independent agent review, not an external provider audit or account approval.

Reviewed remote implementation: `0cb3685c0890e55c5f1b5b25e179ed2bac92517c`;
equivalent local commit: `45289a15e3d7acb4fc4d8616024ff7d82042979e`;
tree: `52b8c617f0e9c00f4e5c9d192f32835148b21237`;
plan digest: `c381c3c57f64be18ea0a1d1f2731516f191f2814295ace3e45ec0d176171c840`.
The reviewer verified the local identity; the executing agent checked remote
tree equivalence. This documentation update does not modify executable files
or the plan digest.

- Reviewer: 13 Node groups and 24 reference checks passed; 32 planned requests,
  zero live calls. Eight additional transport checks passed. Concurrent reserve
  attempts from two processes admitted only one; restart remained blocked and
  the reservation persisted. Symlink/hardlink ledgers were rejected.
- Fixed endpoint, rejected redirects, no retries, reservation-before-request,
  safe error handling and key isolation were verified. No critical/high defect
  defeating those protections was found. Maximum reserved cost remains $0.456
  under the $0.50 campaign ceiling; this is not a provider invoice.
- **MEDIUM, nonblocking for the bounded trial:** a schema-valid cabinet answer
  can exceed the next-turn history envelope. For example, a 999-byte answer
  containing `text: '㍍'.repeat(300)` passes answer validation but fails dialogue
  construction after NFKC normalization. A 3452-byte ordinary Cyrillic answer
  also reproduces it. The existing audit's one rejected oversized example does
  not establish general compatibility. Check `answerFitsDialogue` before
  accepting a cabinet answer and add both boundary cases in a subsequent code
  correction. The current runner stops safely; it may produce fewer than 32
  results. This limitation is not a measured model failure.

The executing agent separately verified the selected private Codespace:
13 groups, 24 references and 32 mock calls passed on Node 24.22.2 / Python 3.14.2.
The canonical private state directory and setup marker survived stop/start;
directory permissions are 700. The owner's repository-scoped Codespaces secret
was injected after restart and checked only as booleans. No key value was read
into the conversation or provided to the reviewer. Live enablement is off and
no live ledger exists. Paid Codespaces usage is blocked by the owner's $0 budget.

The account UI confirmed the dedicated project, restricted expiring key, allowed
pinned model and $500 remaining credits through 1 December. Account IDs and
screenshots are excluded from this public report. **Permitted account/access
arrangements remain unconfirmed:** a foreign execution region alone does not
establish them. No ready admission was issued and no API call was made.

```text
EXECUTIVE STATUS
Task: OPENAI_QUALITY_20261103 independent review and protected setup
PR: #420 Draft
Base: b9ba38b27f5b306f0d81d01c67e0a636e5a06b84
Reviewed implementation: 0cb3685c0890e55c5f1b5b25e179ed2bac92517c
Gate: TECHNICAL_REVIEW_PASSED; ACCESS_UNCONFIRMED; LIVE_BLOCKED
Tests: 13 Node groups; 24 references; 32 mocks; extra transport/concurrency checks
Failures: no failing final tests; one nonblocking history-size finding
Not run: live API; model-quality assessment; pupil pilot; deployment
Scope deviations: none; code and campaign digest unchanged
Recommendation: resolve factual access eligibility before enabling the trial
Next user decision: factual access clarification, no repeated spending approval
```

---

# Earlier continuation — 6 November 2026 (Asia/Novosibirsk)

The isolated evaluator now uses corrected PR429 context and mathematical checks,
with the original PR399 transport. No live model calls or model training occurred.
The original 16 dialogs / 32 turns and eight coverage probes are unchanged.

- 13/13 Node test groups passed; 24/24 exact reference checks passed.
- Audit and all 32 simulated calls passed; mocked output is labelled NOT_MEASURED.
- Wrong `x = 6` is rejected during mathematical scoring. Correct `−3x = 19 − 4 = 15`
  and `x = −5` is accepted. The earlier oversized-answer example is rejected before
  accepting output; the independent review above records remaining history-size
  incompatibility. Favourable human marks cannot override detected
  errors, invalid answer shape or a detected final answer in the first hint.
- The comparison includes real deterministic cabinet and standalone responses.
  Free follow-up understanding is NOT_TESTED, not scored as a model capability.
- 53 source files are SHA-256 pinned. The new plan digest invalidates old admission.
- Monetary limits and no-retry / persistent-ledger rules are unchanged. No keys,
  credentials, account identifiers or pupil data are added to the repository.
- First local run exposed the comparison calling the standalone handler with a
  cabinet topic; corrected to use the actual cabinet handler and all tests passed.
- Self-review completed; independent live review and account facts remain pending.
- CI status for the new exact head is recorded in PR420 after the workflow ends.

Runtime credentials and a permanent campaign state directory are absent here.
Grant balance/expiry and access eligibility were not newly confirmed. No admission
check was set to true without evidence. The test is PREPARED_ONLY, LIVE_BLOCKED.

Official model/pricing page checked 6 November:
https://developers.openai.com/api/docs/models/gpt-5.4-mini
Optimization guidance (evaluation/prompting before considering weight training):
https://developers.openai.com/api/docs/guides/model-optimization

Rollback: revert only this evaluator continuation; preserve any future spending
ledger. Nothing was deployed to MathExam or enabled for pupils.

```text
EXECUTIVE STATUS
Task: OPENAI_QUALITY_20261103 continuation 2026-11-06
PR: #420, existing Draft
Base: c819927e484ce3afeae187d269974cb1cf2ead68 (previous PR head)
Head: recorded by PR metadata
Gate: PREPARED_ONLY; LIVE_BLOCKED; MODEL_QUALITY_NOT_MEASURED
Tests: 13 Node groups; 24 references; 32 mock calls; audit; diff check
Failures: none in final local verification
Not run: live API; independent live technical review; pupil pilot; deployment
Scope deviations: none
Recommendation: use protected execution/account setup before bounded live trial
Next user decision: execution/account access; no repeated $0.50 approval
```

---

## Historical report before the continuation

# OpenAI quality evaluation — 3 November 2026 (Novosibirsk)

Real API calls: **0**. Cost incurred by this work: **$0**. GPT mathematical and
pedagogical quality: **NOT_MEASURED**. No pupil data or production changes.

## Verified sources

PR399 remains Draft on `7f4c054b9b8fb5b519dcab60e6fa4e461ed7c21f`; its earlier
assistant CI run 41343989918 succeeded. Current mathematical/context code is pinned
to `b9ba38b27f5b306f0d81d01c67e0a636e5a06b84`, incorporating the previously completed
improvements. Every imported file is SHA-256 checked.

The owner-provided email was read privately: $500 issued to mathexam on 1 November,
expires at renewal on 1 December. Gmail authentication headers show pass.
A screenshot supplied by the owner on 3 November (Novosibirsk) shows organization
mathexam, Credit remaining $500.00 and 0 requests. This confirms the displayed
balance at that moment, while the grant-expiry date comes from the email. The email,
headers, screenshot, address and organization ID are not copied into this public
repository. No API key is present in the execution environment. OpenAI Developers
was found but is not connected at this checkpoint.

Current [API credit rules](https://developers.openai.com/api/docs/guides/chatgpt-api-credits)
apply credits to eligible API usage in the linked organization and use free grants
before purchased credits. The selected Chat Completions endpoint is within the
API Platform program in principle; current displayed balance is confirmed; project/model access is unverified.
[Model documentation](https://developers.openai.com/api/docs/models/gpt-5.4-mini)
confirms the pinned snapshot, structured output and $0.75/$4.50 per million tokens.

The [supported-country list](https://developers.openai.com/api/docs/supported-countries)
does not include Russia. Its restriction addresses both access and offering access.
A foreign runner or VPN alone does not establish eligibility. The actual account
and intended access arrangement require verification; no workaround is implemented.

[Services Agreement](https://openai.com/policies/services-agreement/) requires
necessary rights/consents and parental/guardian consent for minors' use.
[Under-18 guidance](https://developers.openai.com/api/docs/guides/safety-checks/under-18-api-guidance)
requires additional age-appropriate safeguards and calls for ZDR before processing
personal data below 13 or the applicable digital-consent age. It also recommends
current flagship models for minors; this unchanged mini adapter remains an evaluation
candidate. [Data controls](https://developers.openai.com/api/docs/guides/your-data)
separate store=false from abuse monitoring, normally up to 30 days with exceptions.
These tests use invented mathematical texts only; they do not establish pupil readiness.

As of 3 November the [29 October 2025 usage policies](https://openai.com/policies/usage-policies/revisions/2025-10-29/)
remain effective. The latest page announces a version effective **20 November 2026**;
it was not incorrectly treated as already effective.

## Reproduced findings, not measured GPT errors

| Finding | Evidence | Necessary correction before pupil use |
| --- | --- | --- |
| A wrong final answer passes strict JSON | For -3x+4=19 a fabricated response saying x=6, with one step and no label “Ответ”, is accepted | Use exact verification for supported arithmetic; evaluate semantic hint leakage in all fields. JSON alone cannot certify mathematics. |
| Valid response can break the next turn | A valid 1790-character Cyrillic text exceeds the 3500-byte dialogue envelope | Align response and history byte budgets; keep task identity and bounded previous content; test real outputs. |
| Standalone history absent | Its builder sends only original task and latest attempt; no previousTurns | Introduce a separately reviewed bounded dialogue contract or clearly restrict context claims. |
| Advanced API routes blocked | 8 coverage probes rejected; 7 topics exist locally, derivative topic absent | Decide and test intended external scope; do not bypass the allowlist by relabelling topics. |
| Some ordinary formulations unsupported locally | Probability narrative and two trig formulations return needs-teacher | Expand parsers or approved fallback, retaining domain and interval checks. |

The size counterexample is synthetic and deliberately large; its frequency at the
500-token limit is not measured. It proves an incompatible byte contract, not that
all or most real answers fail. API routing restrictions can be intentional safeguards.

## Results by coverage probe

| Type | Local result for this exact input | OpenAI result | Actual cost |
| --- | --- | --- | --- |
| Quadratic equation | Correct 2;3, substitution/factorization checked | Not run; offline-only route | $0 |
| Rational inequality | Correct (-∞;-2)∪[1;+∞), domain checked | Not run; offline-only route | $0 |
| Two draws without replacement | needs-teacher; reference 3/10 | Not run; offline-only route | $0 |
| Logarithmic equation | Correct x=9, domain x>1 checked | Not run; offline-only route | $0 |
| Exponential equation | Correct x=3 | Not run; offline-only route | $0 |
| Trigonometry on interval | needs-teacher; reference π/6,5π/6 | Not run; offline-only route | $0 |
| Derivative/extrema | No derivative topic | Not run; no route | $0 |
| Profile exam equation | needs-teacher; reference 0,π/3,π,5π/3,2π | Not run; offline-only route | $0 |

All 16 dialogs in cases.json have separate reference answers, required explanations,
wrong attempts and follow-up questions. Their 32 responses are placeholders only.
All 24 mathematical/method references were checked separately from assistant code;
SAS and the unit-circle reasoning also received manual mathematical review.

The plan caps one campaign at $0.50; maximum contractual reservation is $0.456.
Short-history planning reserve is $0.219737, not an invoice. Actual latency, actual
model cost, correctness, quality of explanations and stability remain unmeasured.

Cloud workflow runs only exact-reference and mock-transport checks, never requests
OpenAI secrets. Live is disabled in ephemeral CI to avoid losing its lifetime ledger.
Technical self-review and automated tests are complete; independent technical review,
live account checks and real model evaluation remain incomplete. Existing external
waiver is respected; no new external-audit permission is requested.

Cloud evidence: [run 41496295700](https://github.com/ladynata-cloud/math-exam-fipi/actions/runs/41496295700) passed on implementation head `21b046e741db2cec5483a1d2eab52b4b06e02267`; 11 Node groups, 24 reference checks, 32 simulations. Artifact upload succeeded. This documentation follow-up does not change executable files or the plan digest.
