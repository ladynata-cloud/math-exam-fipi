# MathExam: bounded OpenAI provider adapter

## Identity and authorization

- Task: MATHEXAM_ASSISTANT_OPENAI_20261102
- Date: 2026-11-02 (Asia/Novosibirsk)
- Base: main `6b9c327f2ca438cb7e7620ef302876de467fac19`
- Branch: `feat/assistant-openai-adapter-20261102`
- Review: HIGH (external destination, accounting and pupil-data boundary)
- Architecture: accepted ADR 0011, replaceable, default-off provider boundary.
- Current owner request: «что у нас помощником. давай его продолжим развивать».
  This direct instruction authorizes continued implementation, validation,
  commits and a Draft PR. It does not authorize merge, deployment, paid calls,
  changing real pupil settings, or a review exception.

## Goal and verified starting point

Prepare the missing OpenAI option in the existing private helper. Source help
is already implemented; PR380 is merged. PR375 (follow-up dialogue) and PR385
(public navigation) are still unmerged Drafts. This task neither duplicates
their changes nor claims those features are published. Current main supports
DeepSeek and Amvera but has no OpenAI adapter.

## Scope

Add one allowlisted OpenAI endpoint and pinned GPT-5.4 mini snapshot, standard
uncached USD price floors, a bounded non-reasoning request, explicit no-storage
request flag, refusal validation and response model/tier checks. Preserve all
existing consent, quota, replay, reservation and durable circuit behavior.

Allowed paths: assistant-service/src/config.js, assistant-service/src/provider.js,
assistant-service/test/openai.test.js, assistant-service/README.md,
assistant-service/OPENAI.md, this specification, the matching report under
docs/reports/, and docs/PROJECT_STATUS.md.

Excluded: browser/cabinet UI, curriculum, learner data, hosting, keys, spending,
Qwen training/export, public chatbot, legacy evaluation campaign approval,
merging or repairing PR375/385. No new trainer or learning sequence is created;
trainer design consultation is not applicable.

## Acceptance and checks

- Default remains offline; a key alone never activates outbound requests.
- Only the documented pinned model/endpoint and explicit USD rates are allowed.
- Request has store=false, reasoning_effort=none, service_tier=default and
  max_completion_tokens; no tools, retries, identifiers or answer keys.
- Invalid/refused/truncated/over-budget replies never become verified help.
- Synthetic cabinet HTTP tests cover consent, exact free calculations,
  reservation before transport, replay after restart and persistent circuit.
- Full existing assistant tests, course knowledge reproduction, syntax and
  git diff --check must pass. Source helpers and old providers stay compatible.
- No live model quality, account credit balance or production activation claim.
- Gate: MATHEXAM_ASSISTANT_OPENAI_PREPARED_OK.

## Review and rollback

Focused self-review and adversarial tests are included. Independent/external
HIGH review is a release gate and is not implied by this preparation request.
Any external handoff must omit credentials and private/pupil data. Its evidence
must name provider, PR, base, head, verdict and verifiable timestamp/source.

Disable external mode to roll back; preserve both service ledgers and pupil
work. Reverting the additive adapter needs no migration. An API key, model
credit or store=false does not establish provider eligibility or zero retention;
actual deployment/data conditions and bounded live evaluation remain open.
