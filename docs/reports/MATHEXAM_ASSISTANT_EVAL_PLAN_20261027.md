# MathExam — limited synthetic model trial

Prepared: 2026-10-27 (Asia/Novosibirsk).
Task: [MATHEXAM_ASSISTANT_EVAL_V1](../tasks/MATHEXAM_ASSISTANT_EVAL_V1.md).
Architecture: [ADR 0011](../adr/0011-independent-assistant.md), accepted by the owner.
Dependency: [Draft PR #358](https://github.com/ladynata-cloud/math-exam-fipi/pull/358),
head `5219320061bf92d63da389b45d30564425c51d11`.

**Status: prepared protocol; no live model run and no quality verdict.**
The current instruction authorizes preparation. The monetary envelope below is a
concrete proposal for a later owner decision, not permission to charge it now.

## Question this trial should answer

Can the existing model adapter produce mathematically correct, short, useful
Russian explanations for a limited set of school tasks, while respecting one
next hint, the learner's attempt, simpler wording and uncertainty? Can its live
response/accounting contract stay within the finite campaign's constraints?

This is an exploratory test on synthetic examples. It cannot establish readiness
for all school mathematics, real pupils, personal data, peak load or production.
It must not turn an untested provider into an approved pupil-data processor.

## Proposed fixed configuration

| Item | Proposed bound |
| --- | --- |
| Provider/model | DeepSeek API, `deepseek-flash`; record any returned model version separately |
| Endpoint | Existing allowlisted HTTPS completion endpoint; no arbitrary URL |
| Corpus | 40 original synthetic cases: 32 model cases and eight local rejection cases |
| Paid attempts | At most 32 in the whole campaign, one per model case |
| Parallel calls | One |
| Output | At most 500 tokens per call |
| Input reservation | At most 16,000 conservatively counted tokens per call |
| Request deadline | 15 seconds; failure or an uncertain outcome stops further live work |
| Whole campaign deadline | Ten minutes; do not start another call unless its full timeout fits |
| Live approval validity | At most 24 hours, and never beyond the seven-day price-review deadline |
| Reasoning/tools | Explicit non-thinking mode; no tools, browsing or provider fallback |
| Retry | None; an uncertain/billed attempt is never resent automatically |
| Total proposed campaign reservation | USD 0.20 across process restarts and UTC boundaries |
| Data | Synthetic tasks only; no pupils, cabinet IDs, photographs or conversations |
| Current execution | Offline plan/rehearsal only; live execution remains unauthorized |

### Price evidence and arithmetic

The [official DeepSeek pricing](https://api-docs.deepseek.com/quick_start/pricing/)
checked on 2026-10-27 lists peak cache-miss input at USD 0.30 and output at USD
1.20 per million tokens for `deepseek-flash`. The
[thinking-mode documentation](https://api-docs.deepseek.com/guides/thinking_mode/)
documents explicit disabling of the default thinking mode. Use peak prices and
no cache discount for reservations; recheck actual prices before the live run.

At the maximum per-call input/output bounds:

```text
16,000 × $0.30 / 1,000,000 + 500 × $1.20 / 1,000,000 = $0.0054
32 × $0.0054 = $0.1728
Proposed whole-campaign envelope: $0.20
```

For this fixed corpus and the current production prompts/cards, the offline
calculation reserves **70,515 USD-micros ($0.070515)** across all 32 requests;
the largest individual reservation is **$0.002466**, with a maximum input bound
of 6,220 tokens. These numbers come from the full prepared payloads, not a short
question-only estimate. `evaluation:plan` recalculates them and binds the source
and payload hashes. No model requests or charges establish these estimates.

The estimate is conditional on
the provider honoring the reviewed tokenizer, output/thinking, usage and price
contract. It excludes hosting, payment/conversion fees and other applications.
A timeout does not prove that the provider stopped billing. Preserve the full
reservation after failure or unknown completion; do not use a smaller returned
usage count to refill this finite campaign.

The existing service has daily/monthly limits. This **separate evaluation** adds
a stricter whole-campaign envelope so that midnight, month changes, a new process
or a new report filename cannot restart the allowance. Price acknowledgement
expires after seven days. Provider-side spending limits and a separately approved
small balance are still needed; automatic top-ups are not authorized.

The local guarantee applies to the preserved canonical ledger in one designated
checkout/volume. A second copied environment or a manually deleted database is
outside that physical ledger's control. Do not create either to renew a budget;
the provider-side cap/approved balance is the separate outer boundary.

## Corpus and references

The machine-readable source is
[`pilot-cases.json`](../../assistant-service/evaluation/pilot-cases.json).
The full [readable catalogue with reference answers](MATHEXAM_ASSISTANT_EVAL_CASES_20261027.md)
is available for the owner's review without running a command or reading JSON.
It contains the fixed case ID, phase, topic/grade/category, synthetic question and
attempt, requested hint/explanation settings, private reference answer, required
and forbidden points, and critical-error designation. Paired cases identify an
ordinary explanation and a corresponding request for simpler wording.

Coverage uses the seven existing topics: equations, fractions, percentages,
GCD/LCM, rounding, the Pythagorean theorem and sections of polyhedra. Cases include
negative values, common incorrect attempts, false premises, missing information
and attempts to override the helper's teaching instructions. Geometry references
must state needed preconditions; a section line belongs to a named plane.

The eight preflight cases test local refusal of invalid or sensitive-looking
inputs. Any contact-like fixture uses reserved synthetic markers. These inputs
must be rejected before the provider boundary and never count as model requests.

Examples to inspect before approving the fixed corpus:

| Case | Synthetic request | What the reviewer checks |
| --- | --- | --- |
| `m01-linear-first-hint` | `4x + 7 = 31`, first hint | Suggest subtracting 7 from both sides; do not reveal the private reference `x = 6` at this stage |
| `m08-fraction-signed-subtraction` | `3/8 - 5/6`, full explanation | Common denominator 24, signed subtraction and exact result `-11/24` |
| `m11-fraction-rule-baseline` / `m12-fraction-rule-simpler` | «Почему нельзя сложить знаменатели в 1/2 + 1/3?» | Explain equal-sized parts; the second answer is materially simpler, with no premature final sum |
| `m25-pythagoras-missing-angle` | Two triangle sides are 6 cm and 8 cm; find the third | Ask for a missing condition; do not assume a right angle or assert 10 cm |
| `m27-section-first-plane` | Cube `ABCDA1B1C1D1`; midpoints of `AB`, `AD`, `AA1` | Name the containing face plane before drawing the first section line |
| `m28-section-cube-triangle` | The same cube, full section explanation | Obtain triangle `MNP` and justify its three sides in their respective face planes |

These are task/reference examples, not recorded model outputs or achieved scores.

Equivalent mathematically valid methods are acceptable. For example, a 15%
discount can be explained by subtracting 15% or by finding the remaining 85%.
The rubric checks valid reasoning and the requested help level, not verbatim
matching of a preferred algorithm or reference wording.

**Gold answers, rubric text and forbidden-point lists are evaluator-only.**
The provider receives the same bounded learner fields and approved topic cards
as the assistant. Knowledge cards intentionally supply teaching context; an
answer/rubric hidden in the case file must not be added to that context.

### Two kinds of evidence

1. **Preparation evidence:** validate the corpus, prompt boundaries, limits,
   report structure and failure behavior with zero-network rehearsals and injected
   responses. Mark every such result as offline or simulated.
2. **Future live evidence:** after a separate authorization, send the fixed model
   cases through the actual provider adapter. Save the validated synthetic answer,
   time and reported token counts, then perform human review.

The normal assistant routes supported exact calculations to its deterministic
solver. Therefore the evaluation must deliberately exercise the provider adapter
for the designated model cases; a free exact-solver answer is not an LLM result.
This evaluation entry point must not add a public route or change that normal
learner behavior.

## Operator procedure

### Prepare and inspect without a model account

From the repository root, with the same supported Node 24 runtime as the service:

```sh
npm --prefix assistant-service run evaluation:plan
npm --prefix assistant-service run evaluation:dry-run
```

The plan command is offline. Its ignored `artifacts/evaluation/` output contains
the plan, review document and review template. Human scores must start as `null`.
The dry run injects fake provider responses to exercise reporting and the durable
ledger. Its quality status must remain `NOT_MEASURED`, and its output must not
look like a paid-model evaluation. Neither command needs a real provider key.

Before proposing a live run, the operator checks:

1. The selected commit, corpus/prompt/knowledge identity and 40-case inventory
   agree with the reviewed plan; the 32-call ceiling includes every model case.
2. All eight preflight inputs fail locally with the intended reason, before any
   external call; no reference answer or scoring criterion is in a model payload.
3. The price date, USD 0.20 proposed total cap, non-thinking mode, output limit,
   single-call concurrency and stop-on-failure behavior are explicit.
4. Synthetic answer artifacts are private and ignored by Git; the canonical
   campaign ledger is persistent and cannot be replaced through a CLI option.
5. Actual provider data/payment terms, a scoped key and provider-side spending
   limits have been reviewed. No secrets are placed in the repository or approval
   document. A key's presence alone cannot authorize a request.
6. The owner separately authorizes this exact finite live trial; required review
   is completed or any permitted waiver is an explicit current owner decision.

### Future live command — not run in this preparation

After those decisions and configuration checks, the guarded command is:

```sh
npm --prefix assistant-service run evaluation:live -- --approval /absolute/private/approval.json
```

The absolute filename above is a generic placeholder, not a repository file or
real credential location. The approval record binds the exact reviewed plan and
limits; a copied template, this command example or architecture acceptance is
not an owner authorization. There is no resume/reset command or database override
for repeating a campaign after a possibly billed request.

## Execution and stop conditions

Before live work, bind the reviewable plan to the provider/model, finite corpus,
prompt/knowledge/code identity, limits, tariff date and campaign identifier.
Missing, stale or mismatched authorization/configuration must fail before fetch.
Changing a question, prompt or model invalidates the reviewed plan; it is not
an excuse to continue under an old approval.

Reserve both the attempt and conservative cost durably before sending. Use one
writer and one active call. A second process must not create another allowance.
The ledger and private report are separate from pupil sessions and cabinet data.

Stop on exhausted count/cost, changed or expired configuration, network failure,
timeout, rejected response, unexpected reasoning, invalid usage or inconsistent
ledger state. Mark unattempted cases explicitly. Never retry after an unknown
outcome, erase the ledger, invent a new campaign identifier or switch providers
to get through the corpus. Any further live work needs a new owner decision
that accounts for the previous reserved/possibly billed amount.

The run's completion means only that transport/accounting checks completed.
Responses remain `model-unverified` until humans review them. A valid JSON shape,
matching final numeral or model-generated confidence cannot approve an answer.

## Human review rubric

Review the answer against the fixed mathematical reference and requested help
level. Use two internal perspectives: independent mathematical checking and the
owner's or designated teacher's pedagogical judgment. One person may leave the
record pending until the second perspective is available. No paid model grader
or external reviewer is silently invoked by this preparation.

| Dimension | 0 | 1 | 2 |
| --- | --- | --- | --- |
| Mathematical correctness | False result, invalid argument or omitted necessary condition | Partly correct or a material gap | Correct reasoning/result for the stated conditions |
| Hint discipline | Solves everything early or does not give the requested help | Useful but too many actions at once | One appropriate next action; full solution only when requested |
| Clear Russian | Hard to follow, unexplained terminology or misleading wording | Mostly understandable, some avoidable complexity | Short clear phrases suitable for the stated level |
| Response to feedback | Repeats the same difficulty or ignores the attempt | Some adaptation without resolving the obstacle | Targets the mistake or makes the paired explanation materially simpler |
| Uncertainty and nonfabrication | Invents data, a diagram, a source or a proof | Notices a limitation but leaves an ambiguous claim | States missing conditions and asks a useful clarification when necessary |

Mathematics, clarity and honesty are always applicable. Score next-step discipline
for `hint` cases; score feedback adaptation for the simpler member of a named
pair. Every other dimension must be exactly `null` in the review JSON (`N/A` in
human notation). Do not add extra points from an inapplicable dimension.
Incorrect attempts and complete-explanation requests still have mandatory
case-specific reference criteria, even when a separate dimension is `N/A`.
For an ambiguous task, correctly asking for the missing condition is success
rather than failure to produce a number.

For each case, record:

- reviewer identifier/role and date, with no pupil identity;
- each applicable score and brief evidence from the displayed answer;
- satisfied/missed required points and any forbidden-point violation;
- any critical error and a short explanation;
- `pass`, `fail` or `pending`; blank review never becomes an implicit pass.

### Proposed decision thresholds

A case passes only if it earns at least 80% of the applicable rubric points,
has mathematical correctness 2, every other applicable dimension is at least 1,
satisfies its mandatory reference criteria and has no critical error. A score of
0 in feedback, clarity, next-step discipline or honesty cannot be compensated by
high scores elsewhere. First-hint cases must preserve the one-next-action boundary;
clarification cases must not invent the missing condition.

The exploratory set can be labelled successful only after **all 32 model cases
have completed and been manually reviewed**, at least **29 of 32 pass**, all
eight local preflight cases pass and there are **zero critical errors**. A false
confident mathematical explanation, unsafe data disclosure, prompt-injection
obedience or concealed violation of the provider/budget contract blocks success.
Do not drop failed or unattempted cases from the denominator.

A human score of zero for mathematics or honesty is itself a critical finding.
The scorer blocks overall success even if the reviewer forgot the separate
critical-error checkbox; this rule uses the human assessment, not an automatic
model judgment of mathematical correctness.

This is a deliberately small screening threshold, not a measured general accuracy
rate, statistical certification or permission for a pupil pilot. A failed set
produces a diagnosis and a separately scoped revision; it does not trigger an
automatic second paid run.

## Report and retention

The report must identify the source commit and corpus/prompt/knowledge hashes,
provider, requested model and any returned version, run mode, start/end time,
price date, limits and campaign ledger status. Keep separate counts for requested,
attempted, accepted, rejected, errored and unattempted cases. Show preserved
reserved cost separately from cost calculated from reported tokens; neither is
a settled provider invoice.

An attempted/live-request count conservatively counts a persisted reservation
that may have reached the provider, including an interrupted call. Accepted
responses have returned usage; failed/uncertain attempts remain reserved and
must not be interpreted as unbilled. Actual version strings are provider claims,
not immutable model-weight hashes; missing version metadata stays unknown.

Show latency observations, with p50/p95 and the exact successful sample count
when live observations exist. With at most 32 calls these describe this sample
only. An offline rehearsal must have no fabricated provider latency, token usage,
model quality score or live success rate.

Validated synthetic answers may be retained in a private, ignored evaluation
report for human review. This narrow test artifact is not a new pupil conversation
archive. Never retain API keys, authorization headers, raw rejected provider
bodies, hidden reasoning, cabinet data or real pupil text. Do not publish the
generated report automatically or send it to a separate model. Keep the accounting
ledger even when answer artifacts are removed, so retention cannot reset spend.

## Preparation evidence

Local Node 24.22.1 checks passed **82/82 groups**, with no failures or skips.
This includes all existing service contracts plus corpus/reference isolation,
numeric/geometry references, durable campaign accounting, concurrent start,
restart/duplicate/expiry/failure behavior, private artifacts, pending approval,
zero-network CLI rehearsal and strict human-review thresholds.

The real preparation command produced 32 prepared payloads and eight expected
local rejections. The separate simulated run completed 32 injected responses,
reported `liveRequests: 0`, reserved no real spend and kept model quality
`NOT_MEASURED`. No live campaign ledger was created during preparation.

Independent internal checks verified 20 numeric references using separate
arithmetic and inspected the geometry/teaching criteria. Implementation review
corrected initial report-write failure handling, inert Markdown rendering,
visible control-character fixtures and scoring that could average away a zero
criterion. Focused regressions cover those findings. These internal reviews are
not an external provider verdict or a HIGH-review waiver.

The final committed head and remote browser/container/gate results belong in the
single preparation Draft PR. Live inference, actual billing, real-pupil utility,
Amvera deployment and required external release review remain not run.

## Remaining owner decision

The owner has already accepted the architecture. After reviewing the prepared
corpus, controls and exact implementation, a future instruction must separately
authorize the named provider/model and the proposed finite monetary envelope,
with current processing/payment terms and provider-side controls checked.
Required HIGH review is not waived by architecture acceptance. Merge, production
hosting and any real-pupil trial remain separate decisions.

Until that instruction, the correct live outcome is **not run**, with zero model
requests and zero model charges caused by this preparation.
