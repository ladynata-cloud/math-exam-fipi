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
