# MathExam assistant: model, hosting and cost research

Checked: 2026-10-27 (Asia/Novosibirsk).

Task: [MATHEXAM_ASSISTANT_V1](../tasks/MATHEXAM_ASSISTANT_V1.md).
Architecture: [ADR 0011, Proposed](../adr/0011-independent-assistant.md).
Repository baseline: `92d733a49692744ce043503c57f29b77bfb09a24`.

## Decision for the first prototype

Prepare an independent `assistant-service/` with Node 24, a small curated
knowledge collection, deterministic mathematical examples, a private learner
interface and a durable SQLite store. Default operation is offline and makes
no model calls. This permits checking mathematics, hints, access boundaries,
feedback and spending controls without buying infrastructure or tokens.

For a later explicitly authorized model evaluation, the first supported paid
candidate is direct DeepSeek Flash: its current public rates allow conservative
cost accounting. Keep an explicitly configured Amvera Qwen option for a pilot
paid in roubles after its actual tariff, model identity and processing conditions
are confirmed. There is no automatic failover between providers. The optional
adapter accepts only reviewed exact HTTPS destinations, not arbitrary URLs.

This is ownership of the MathExam application, original teaching materials and
approved knowledge process. It does not create proprietary foundation-model
weights. No model has been trained, fine-tuned, downloaded or benchmarked in this
task. Synthetic provider responses establish an adapter contract, not the
quality or availability of a live LLM.

## What the repository establishes

The baseline [Dockerfile](../../Dockerfile) uses `node:24.21.0-alpine` and runs
[board-server/index.js](../../board-server/index.js). That process serves both
the board and `/api/learning` cabinet routes. The persistent cabinet database is
under `/data`. [video-worker](../../video-worker/package.json) already has an
independent package and [Dockerfile](../../video-worker/Dockerfile).

Consequently, stopping the existing board application also stops its cabinet
APIs. The new assistant must have its own entry point, Dockerfile, secrets and
volume; it must not depend on that process for authentication or answers.
Splitting the existing board/cabinet application is outside this task.

## Ready open-weight models

Only publisher model cards and publisher files are used below. A model-card
benchmark is not evidence that a weak Russian-speaking pupil will understand
its explanations.

| Candidate | Confirmed publisher facts | Assessment for MathExam |
| --- | --- | --- |
| [Qwen3-4B-Instruct-2507](https://huggingface.co/Qwen/Qwen3-4B-Instruct-2507) | 4 billion parameters; Apache 2.0; instruction model with non-thinking output | Useful compact text-only candidate for a later Russian hint evaluation. Its concise output mode fits short explanations; teaching quality remains unmeasured. |
| [Qwen3-4B-GGUF](https://huggingface.co/Qwen/Qwen3-4B-GGUF) | Official Apache 2.0 GGUF; Q4_K_M file is 2.5 GB | Concrete CPU-compatible local experiment through llama.cpp. This is the original Qwen3-4B variant, not the Instruct-2507 weights. |
| [Qwen3-8B-GGUF](https://huggingface.co/Qwen/Qwen3-8B-GGUF) | Official Apache 2.0 GGUF; Q4_K_M file is 5.03 GB | Larger local comparison candidate; neither speed nor Russian mathematics quality is established here. |
| [Qwen3.5-4B](https://huggingface.co/Qwen/Qwen3.5-4B) / [Qwen3.5-9B](https://huggingface.co/Qwen/Qwen3.5-9B) | Current official open-weight cards, Apache 2.0, multimodal architecture | Worth evaluating later; text-only serving should avoid the unused vision path. No exact quantized artifact or runtime memory was verified, so the Qwen3 GGUF sizes must not be assigned to these models. |
| [Qwen2.5-Math-7B-Instruct](https://huggingface.co/Qwen/Qwen2.5-Math-7B-Instruct) | Apache 2.0; publisher identifies English/Chinese mathematics as its primary scope | A possible specialist comparison, not the default Russian conversational tutor. Its mathematics label alone does not establish Russian pedagogy. |

The measured file-size evidence is the official
[4B file list](https://huggingface.co/Qwen/Qwen3-4B-GGUF/tree/main) and
[8B file list](https://huggingface.co/Qwen/Qwen3-8B-GGUF/tree/main). The entries
refer to one `Q4_K_M.gguf` file, not the size of the repository containing several
quantizations. GB here follows the publisher's displayed file size.

### File size is not a runtime-memory requirement

The service also needs working buffers, the inference runtime and context/KV
memory. Concurrency and longer context increase demand. As **planning estimates
only**, reserve approximately 6–8 GB RAM for a 4B Q4 experiment and 8–12 GB for
an 8B Q4 experiment with a short context and one active generation. These are
neither Amvera measurements nor guaranteed minimum requirements. CPU execution
does not require a GPU, but acceptable latency on a fractional or small CPU
allocation must be measured. No tokens/second estimate is asserted.

A future GPU test must verify supported accelerator access, driver/runtime
compatibility, available VRAM and price separately. No public GPU allocation
for this user's account has been established. Downloading free weights does
not make continuous serving free.

## What Amvera supports, and what remains unknown

The [public application tariff page](https://docs.amvera.ru/general/price.html)
listed these allocations on the checked date:

| Plan | CPU | RAM | SSD | RUB / 30 days |
| --- | ---: | ---: | ---: | ---: |
| Пробный | 0.1 | 100 MB | 2 GB | 170 |
| Начальный | 0.25 | 500 MB | 5 GB | 290 |
| Начальный Плюс | 0.5 | 1 GB | 7 GB | 490 |
| Стандартный | 1 | 2.5 GB | 15 GB | 1,450 |
| Ультра | 2 | 6 GB | 25 GB | 4,300 |
| Ультра Плюс | 3 | 9 GB | 35 GB | 7,750 |

Billing is per minute, charged hourly. Stopped/frozen applications are not
charged when storage stays within the plan; excess disk is 35 RUB/GB/30 days.
The table does not list GPU. It is not an inventory of the owner's resources.

For a small API gateway, 500 MB–1 GB is an initial engineering estimate requiring
measurement. A local LLM points toward the much larger memory plans and still
needs latency testing. Neither inference speed nor affordability follows from
the existing Express server's presence.

[Docker documentation](https://docs.amvera.ru/applications/configuration/docker.html)
allows a dedicated Dockerfile and `run.containerPort: 3000`. Docker Compose is
not supported. [Node documentation](https://docs.amvera.ru/applications/environments/nodejs-server.html)
permits official `node` image tags. The assistant can use the project's Node 24
generation without changing the root board image.

[Persistent storage](https://docs.amvera.ru/applications/storage.html) is mounted
at `/data` by default. The assistant's database and approved runtime knowledge
must use an absolute path inside its own volume. A repository-relative `data/`
folder is not that volume. Backups and restore checks remain necessary.

[Stopping an application](https://docs.amvera.ru/applications/run.html) is a
per-application operation; zero replicas also stops it. After more than 30 days
stopped, automatic freezing can remove artifacts and domain bindings. Thus
board and video can be on demand, while the assistant remains independent;
long-term stop is not a substitute for backups.

[Networking documentation](https://docs.amvera.ru/applications/configuration/network.html)
describes a free base ingress plan with limits and optional paid ingress plans.
Request/response size, timeout, concurrent connections and requests/minute must
be checked before a live pilot. Same-region internal names are available, but
Amvera does not encrypt that internal traffic automatically. This prototype
does not need an internal connection to the board or video application.

### Actual account inspection was unavailable

No specialized Amvera connection was exposed in this task. The connected-browser
plugin could not access the originating browser context, so no authenticated
Amvera tab could be inspected. The user's current CPU, RAM, GPU, free disk,
region, replicas, token balance and enabled subscriptions remain **unverified**.
No login, new subscription, model call, deployment or resource change occurred.

## API economics

All examples below are scenarios, not observed usage. One turn is assumed to
contain **1,000 total input tokens** (including instructions and retrieved
knowledge) and **500 output tokens**. No cache saving is assumed. A long chat,
long retrieved passages or hidden reasoning can change the result.

For rates quoted per million tokens:

`cost = turns × (input_tokens × input_rate + output_tokens × output_rate) / 1,000,000`

| Option | Input / output rate | 1,000 turns | 10,000 turns | Prototype position |
| --- | --- | ---: | ---: | --- |
| DeepSeek Flash direct, off-peak | USD 0.15 / 0.60 per 1M tokens | USD 0.45 | USD 4.50 | Optional disabled adapter |
| DeepSeek Flash direct, peak | USD 0.30 / 1.20 per 1M tokens | USD 0.90 | USD 9.00 | Use these higher rates for conservative reservations |
| Amvera Qwen | Exact account tariff not verified | Unknown | Unknown | Configurable only after tariff and processing review |
| Yandex Alice AI LLM Flash | RUB 0.10 / 0.20 per 1,000 tokens, VAT included | RUB 200 | RUB 2,000 | Research alternative; no adapter activation |
| Yandex Qwen3.6 35B | RUB 0.20 / 0.30 per 1,000 tokens, VAT included | RUB 350 | RUB 3,500 | Research alternative; no adapter activation |

[DeepSeek pricing](https://api-docs.deepseek.com/quick_start/pricing/) identifies
`deepseek-flash` as DeepSeek-V4.1-Flash-1017 on the checked date. Peak hours are
weekdays 01:00–04:00 and 06:00–10:00 UTC, excluding Chinese public holidays.
The prototype's future cost allowance uses peak, uncached rates regardless of
the request time. [Thinking-mode documentation](https://api-docs.deepseek.com/guides/thinking_mode/)
states that thinking is enabled by default; the bounded hint adapter must
explicitly request `thinking: { type: 'disabled' }`, cap output and exclude tools.

[Amvera Inference documentation](https://docs.amvera.ru/LLM/doc-inference-ru.html)
lists OpenAI-compatible chat completions and Qwen aliases including
`qwen3_30b` and `qwen3_235b`. The documented endpoint is
`https://inference.waw0.amvera.ru/v1/chat/completions`; current aliases can be
checked through `/v1/models`. The [marketing tariff page](https://amvera.ru/llm)
shows token packages for other models, but a LLaMA price must not be reused for
Qwen. Its dated roadmap text also warrants confirming the current account offer.

[Yandex pricing](https://aistudio.yandex.ru/ru/docs/ai-studio/pricing) supplies
the two rouble rates above for synchronous requests. They are comparison
options, not evidence that credentials, quotas or a Yandex adapter exist here.

Hosting, currency conversion/payment charges, tax where not included, storage
and ingress are additional to token costs. No RUB/USD exchange rate is assumed.
Direct-API payment availability for this user is unverified. Application spending
caps cannot control charges from other apps or provider subscriptions.

## Privacy, knowledge and improvement

The assistant is a private pilot with its own pseudonymous, short-lived sessions.
It does not read cabinet accounts, names, grades, photographs, board recordings
or video jobs. Session preferences and categorical feedback can simplify the
next explanation; raw conversations and free-text feedback reports are not
required for that feature. Provider payloads must omit session credentials and
identifiers, use only selected task text and approved knowledge, and require
explicit external-transfer consent.

Input filtering reduces accidental disclosure; it cannot guarantee that a
free-form question contains no personal information. Hosting access logs and
provider retention are separate from the application's own database. The
[DeepSeek platform terms](https://cdn.deepseek.com/policies/en-US/deepseek-open-platform-terms-of-service.html)
do not establish a task-specific zero-retention arrangement. Amvera processing
location and prompt retention were not established. A gateway hostname alone
cannot establish all locations where a request is processed.

For any later Yandex integration, its
[logging documentation](https://aistudio.yandex.ru/ru/docs/ai-studio/operations/disable-logging)
states that request data is saved by default and documents
`x-data-logging-enabled: false` to exclude the request content from service
improvement. That option is not a blanket statement about every operational log.
The current prototype does not make Yandex calls.

Maintain distinct stores of meaning:

| Information | Allowed effect |
| --- | --- |
| Versioned original explanations and operator-approved additions | Can be retrieved as answer evidence |
| Feedback such as “too difficult” | Can request simpler wording or smaller steps on the next turn |
| A proposed knowledge correction | Remains outside retrieval until explicit operator review |
| Model-generated answer | Unverified explanation; never auto-promoted to authoritative knowledge |

None of these operations updates model weights. Later fine-tuning would be a
separate project requiring a rights-cleared dataset, evaluation, cost decision
and authorization. This task does not quietly accumulate pupil chats for it.

## Spending and rollout conditions

The design reserves a conservative cost allowance durably before an outbound
call. [The configuration](../../assistant-service/src/config.js) enforces a
per-session request-count allowance, plus global daily and calendar-month
monetary allowances. There is no lifetime or per-session money cap. Periods use
UTC; session replacement/deletion and process restart preserve global counters.
Configured request and monetary limits must survive concurrency and unknown
provider outcomes. A timeout or malformed response is not proof of a free request, so
ambiguous reservations remain consumed. No automatic retry, model escalation,
provider failover or package purchase is allowed. Offline mode needs no API key;
paid configuration requires explicit enablement, current price acknowledgement,
nonzero bounded budgets and a reviewed provider destination.

The application's conservative reservations assume that the provider honours
the reviewed price, token accounting, maximum-output and non-thinking contract.
In particular, Amvera Qwen limit semantics have not been checked by a live call.
Post-response auditing can close the paid circuit for later calls, but cannot
prevent or refund a first charge that violates those assumptions. Consequently,
offline contract tests are not evidence of an unconditional cap on an external
provider's invoice. Live contract and billed-usage verification is a paid-pilot
gate, still blocked pending separate authorization.

Before any paid or public pilot, all of the following remain necessary:

1. Complete the scoped mathematical, API, persistence, privacy and browser gates;
   record the exact tested head in the task/PR. This research report asserts no
   test counts or external review verdict.
2. Obtain the `NEW_ARCHETYPE` architecture acceptance and required independent/
   external review under [REVIEW_POLICY.md](../REVIEW_POLICY.md). Internal agents
   are not an external provider's verifiable release review.
3. Verify the real Amvera account configuration, one-replica persistent volume,
   ingress limits, restore procedure and isolation from board/video.
4. Select one provider, confirm payment and processing conditions, set small
   owner-approved daily/monthly application allowances and provider-side spending
   controls, and disable automatic additional-package buying.
5. With separate authorization, evaluate live answers on synthetic Russian
   school tasks: numerical correctness, understandable short hints, no premature
   full solution, uncertainty, prompt injection, timeout and actual billed usage.
6. Request separate owner permission for the concrete reviewed merge and rollout.
   Passing an offline gate does not authorize either.

No paid benchmark, Amvera deployment, real-pupil pilot or public publication was
performed as part of this research. A live provider's suitability remains a
release question even when every offline contract test passes.
