# Independent mathematics assistant with reviewed knowledge and bounded inference

Status: Accepted

Date: 2026-10-27 (Asia/Novosibirsk)

Task: [MATHEXAM_ASSISTANT_V1](../tasks/MATHEXAM_ASSISTANT_V1.md).
Evidence: [model, hosting and cost research](../reports/MATHEXAM_ASSISTANT_RESEARCH_20261027.md).
Review level: `NEW_ARCHETYPE`, including authentication, persistence and spending
boundaries that also require HIGH review depth.

Accepted by the owner on 2026-10-27 (Asia/Novosibirsk), in the current task
conversation: «Я утверждаю предложенную архитектуру. Подготовь ограниченное
испытание модели на синтетических школьных заданиях».

This records acceptance of the architectural decisions below and authorization
to prepare the [limited synthetic evaluation](../tasks/MATHEXAM_ASSISTANT_EVAL_V1.md).
It does not authorize paid model calls, infrastructure purchases, merge,
deployment or a pupil pilot. No external-review approval or waiver is implied.
Acceptance has the architectural authority defined by
[AGENTS.md](../../AGENTS.md) and [REVIEW_POLICY.md](../REVIEW_POLICY.md);
the independent release and spending permissions still apply.

## Context

MathExam needs a Russian-speaking mathematics helper that gives manageable
steps, remembers approved teaching knowledge, responds usefully to feedback and
can remain available when the interactive board and video renderer are stopped.
It must operate within a small explicit budget and protect pupil information.

The current [root Dockerfile](../../Dockerfile) runs the
[board server](../../board-server/index.js), which also mounts cabinet APIs.
[ADR 0010](0010-unified-learning.md) documents that existing account boundary.
The [video worker](../../video-worker/Dockerfile) is independently packaged.
Adding the helper to the board process would make its uptime depend on the
board and invite unnecessary access to cabinet data. Changing that established
board/cabinet architecture is outside this prototype.

Public Amvera documentation supports Docker, Node and persistent `/data`.
The owner's real CPU/RAM/GPU allocation could not be inspected. Open-weight
models are available, but their weight-file sizes do not establish total RAM,
latency or operating cost on the user's plan. The research therefore supports
an application-owned knowledge layer with an optional paid API boundary first.

## Accepted decision

### 1. One isolated service and a zero-spend default

Add `assistant-service/` with its own Node 24 entry point, private UI, Dockerfile,
Amvera example configuration and SQLite database. Keep the root hosting files,
existing board/cabinet data and video worker unchanged. Use an absolute database
path under the assistant's own `/data` volume. The initial deployment model is
one process/replica; adding replicas requires a separately reviewed shared
budget/session store and consistency design.

The default backend is deterministic, uses original checked examples and
retrieves only reviewed knowledge. It requires no key and makes no external
model calls. It must be labelled as an offline prototype, so a learner or
reviewer cannot mistake a scripted example for a live foundation-model result.
Unsupported questions must receive a bounded, honest response instead of a
fabricated general solution.

The assistant never starts, stops or purchases board, video or model resources.
Independent containers enable operational separation; merely hiding a UI panel
does not release its server resources. The existing board/cabinet coupling is
retained and documented.

### 2. A small replaceable provider boundary

Support future paid evaluation through an explicitly enabled server-side
adapter. The first economic candidate is DeepSeek Flash direct with conservative
peak-rate accounting. Amvera Qwen is a configurable alternative after confirming
its actual tariff and processing conditions. Neither provider is enabled by
this decision. Yandex and local Qwen inference remain researched alternatives,
not additional background services.

Configuration must name a reviewed exact HTTPS completion URL from a code
allowlist. Reject arbitrary URLs, user-supplied destinations, unexpected paths
and redirects. The browser receives no provider key and cannot select a URL or
override the spending model. Review is required to extend the destination list.

An API key alone cannot enable outbound generation. Require explicit model
enablement, price acknowledgement, configured budgets and user consent for
external transfer. Select one provider per configured operation; there are no
automatic retries, provider fallback, higher-priced model escalation or tools.
Cap input, context, output, response bytes, elapsed time and concurrent work.
For the documented DeepSeek interface, explicitly disable its default thinking
mode for the short-hint evaluation. Provider-version or price changes require
renewed validation rather than assuming an alias is immutable.

### 3. A teaching interaction, not an unrestricted agent

Use plain Russian and one understandable next action. Keep earlier displayed
steps available; let the learner request a further hint, a simpler explanation
or the complete explanation. Do not present the entire solution as the first
hint. Mathematical checks for supported deterministic examples should compute
the result independently rather than trust generated text.

Do not expose tools, shell execution, browser access, arbitrary retrieval or
access to student records to a model. The prompt includes only the current
bounded mathematics question, requested assistance level and selected approved
knowledge. Model output is untrusted text with an explicit provenance label;
safe rendering must not interpret it as executable HTML. A correct final number
does not prove that the explanation is pedagogically suitable.

### 4. Knowledge has a deliberate approval boundary

Keep original reviewed seed knowledge in versioned source and approved runtime
additions in persistent storage. Retrieval excludes pending/rejected candidates.
Operator approval is an explicit privileged action with provenance; a learner's
vote or a model's confidence cannot approve a mathematical fact.

Use categorical feedback to influence the next response, for example by asking
for smaller steps. Aggregate feedback can identify material needing attention,
but it does not rewrite shared explanations or publish candidate knowledge.
The public learner boundary cannot execute operator approval.

These are retrieval, preference and editorial operations. They never update
model weights or create an automatic fine-tuning dataset. Any future training
requires a separate scope, data decision and evaluation.

### 5. Minimize pupil data and make deletion meaningful

Use separate pseudonymous, short-lived pilot sessions, distinct from cabinet
accounts. Store only the minimal session, categorical feedback and accounting
state needed for these functions. Do not persist raw questions, generated
conversations, uploaded photographs or free-text feedback in this version.
Do not export cabinet profiles, attempts, recordings or session identifiers to
the provider. API credentials stay in hosting secrets; session credentials stay
outside URLs, logs and browser persistent storage.

Private access, exact-origin request validation, appropriate session/CSRF
protections, request limits and safe text rendering form the application boundary.
Validate both browser flows and direct API requests; a hidden interface is not
access control. Expiry and explicit deletion must remove the relevant session
data without erasing aggregate budget consumption or permitting a quota reset.

External-transfer consent and input filters reduce exposure but cannot establish
that arbitrary text has no personal information. Provider retention, processing
locations and hosting access logs are separate unresolved rollout conditions.
Do not promise zero retention, complete anonymity or an approved domestic-only
data path without verified operational evidence.

### 6. Reserve costs before work begins

Persist budget counters and reservations transactionally before sending a paid
request. Use conservative input/output allowances and integer accounting units
at reviewed upper rates. Enforce a per-session request-count limit and separate
service-wide daily and calendar-month monetary limits. The session limit is not
a per-session money allocation, and there is no lifetime monetary cap. Accounting
days and calendar months use UTC; a new UTC day/month starts its corresponding
period allowance. A concurrent request, session replacement/deletion or service
restart cannot reset the existing global period counters.

If a provider request times out, fails after sending, or returns unusable usage
information, preserve its conservative charge allowance. Do not infer zero cost
from an unknown outcome. No retry should duplicate a possibly billed operation.
When configuration is incomplete, unacknowledged or invalid, paid operation
fails closed. Offline answers remain separately identifiable.

This ledger constrains calls made by this assistant; it is not a provider invoice
or a cap on Amvera hosting, other applications, ingress or subscription renewals.
Its monetary reservation is an upper bound only while the chosen provider
honours the reviewed token, maximum-output, reasoning and price contract. Actual
Amvera Qwen handling of these limits has not been validated. Synthetic responses
cannot establish it. A detected usage-contract violation disables further paid
calls durably, but cannot undo a first nonconforming request or retroactively
cap the provider's charge. These are explicit blockers for paid activation.
Provider-side automatic top-ups/packages must remain disabled unless separately
authorized. Never delete a ledger to resume spending; recovery needs an audited
backup and a fresh budget decision.

## Alternatives and trade-offs

| Option | Assessment |
| --- | --- |
| Add the assistant to `board-server` | Smaller immediate code surface, but makes assistant uptime depend on the board and joins student/account boundaries. Does not meet resource independence. |
| Rent a local-model/GPU server now | Gives weight/processing control, but available hardware, performance and budget are unverified. No purchase is authorized. |
| Run a compact quantized Qwen locally later | Viable experiment once memory, latency, Russian pedagogy and operating cost are measured. Keep it replaceable behind a separately reviewed local adapter. |
| Anonymous public chatbot with a provider key | Allows uncontrolled usage and data transfer before usefulness or protection is established. Outside the private prototype scope. |
| Automatic learning from chat transcripts | Risks preserving pupil data and poisoning shared knowledge; does not meet the reviewed-knowledge requirement. |
| Separate offline prototype plus optional bounded API | Allows useful mathematical and security verification now, while preserving provider choice. It cannot yet prove unrestricted live-model quality. |

## Evidence required before rollout

The task's exact-head report must distinguish pass, failure and not-run results.
Required prototype evidence includes supported mathematics, retained-step and
feedback behavior, candidate isolation, access controls, safe rendering, budget
concurrency, restart/failure persistence, retention/deletion and desktop/mobile
browser checks. All should run without a paid model call.

The owner has accepted this archetype; the reviews required by repository policy
remain outstanding release conditions. A valid external verdict must identify provider,
PR, base, head, verdict and a verifiable source/timestamp. Internal agent review
is separate evidence. Resolve the actual Amvera configuration, persistent-volume
permissions, ingress limits, backup restoration and provider processing/payment
conditions. Conduct an explicitly authorized live evaluation with synthetic
mathematics examples and a small fixed spend cap before any pupil pilot.

Merge/deployment each remain separate owner decisions. Apply the repository's
authoritative-current-main base-drift guard immediately before any authorized
merge. No test marker or this accepted ADR changes that rule.

## Rollback

Keep the prototype unlinked from public menus and existing cabinets. Disable
the provider boundary or stop only the assistant application; board/cabinet and
video processes remain unchanged. Retain the assistant's private volume and
budget ledger, and restore only a verified snapshot into an explicit recovery
destination. Reverting code must not zero spending counters or silently expose
unapproved knowledge. Actual container startup, backup/restore and provider
turnoff remain operational release checks if not available in local validation.

## Approved cabinet extension — 2026-10-27

The owner's subsequent instruction to connect three selected pupil cabinets
authorizes [MATHEXAM_ASSISTANT_CABINETS_V1](../tasks/MATHEXAM_ASSISTANT_CABINETS_V1.md).
This extends the initial standalone-only interface boundary above with a narrow
authenticated cabinet gateway. It does not move inference or the assistant's
database into the board process. Original standalone rollout restrictions remain
historical context; the new approved task defines this bounded extension.

The cabinet stores private account/profile permissions and durable request
counts. An independent service key protects mathematical requests to the
assistant; a random pseudonym stays out of provider prompts. At most three
accounts can be enabled. The browser never receives bridge/provider secrets.
An owned structured attempt is marked assisted before help is delivered; linked
public courses use explicit manual context. Active assessment blocks help.

External cabinet inference has its own default-off switches, provider review,
teacher permission and per-request acknowledgement. Existing monetary
reservations and replay protection apply. Reviewed cabinet knowledge remains
versioned source material; feedback changes session wording and editorial
priorities, never weights or automatically approved facts. The name MaxExam 0.0
is a product label, not evidence of a trained model.

Disable the gateway or a private account setting to withdraw cabinet access,
while preserving both ledgers. The helper and video retain separate resources;
the existing board/cabinet process is still shared. Actual account binding,
provider eligibility, required external review and separately authorized
merge/deployment remain operational prerequisites. See the
[cabinet operator guide](../../assistant-service/CABINETS.md) for limits and data
retention details. The prior finite synthetic budget does not authorize pupil
traffic or a different model.

## Approved structured practice extension — 2026-11-02

The owner's instruction to implement all100 numbered improvements authorizes
[package8](../tasks/MATHEXAM_ASSISTANT_CABINET_TOOLS_20261102.md), including opt-in
cabinet resume and teacher tools. This is a narrow extension of the no-retention
prototype: only deterministic generated task descriptors, bounded categorical
results and help state may be retained with explicit learner opt-in. Raw pupil
questions, answers and conversations remain unpersisted. Disabling retention
erases this progress, without resetting existing usage or monetary ledgers.
The existing owned teacher can see retained skill/error aggregates; the opt-in
copy states this. Generated-task disputes retain minimal reproducible math and
an enum, not pupil identity or free text.

Teacher notes use draft and explicit versioned approval and remain labelled
separately from deterministic math. Homework previews require an explicit
assignment action. Solution/method policies are enforced by cabinet endpoints;
these formative tasks are not a secret examination system and cannot prove a
learner used a particular method. Sandbox grading does not touch pupil progress.
A pure deterministic practice core is shared with the cabinet, without moving
inference, provider keys or the independent helper database into that process.
Existing three-account admission and active-assessment blocks remain. Provider
and purchase permissions remain unchanged. Standing publication authorization
supersedes older per-PR permission and mandatory external-review statements.
