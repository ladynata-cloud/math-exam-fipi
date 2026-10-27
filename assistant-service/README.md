# MathExam assistant — private prototype

An independent Russian mathematics helper with gradual hints, original knowledge
cards and feedback. The default is an **offline, local prototype**: it uses checked
calculations and curated explanations, makes no model requests and needs no paid
resource. The optional external-model adapter is implemented but disabled. A real
model's mathematical quality, billing contract and pupil-data conditions have not
been validated in this task.

See the [task and permission boundary](../docs/tasks/MATHEXAM_ASSISTANT_V1.md),
[research and dated prices](../docs/reports/MATHEXAM_ASSISTANT_RESEARCH_20261027.md)
and [accepted architecture](../docs/adr/0011-independent-assistant.md). The owner
accepted ADR 0011 on 2026-10-27. That acceptance does not authorize merge,
deployment or paid requests.

The separately approved [cabinet extension](CABINETS.md) prepares **MaxExam 0.0**
for three privately selected pupils. It retains the independent service and
default-off external inference. It is a prepared change, not a live connection
to real pupil accounts.

## Run the free local prototype

Use **Node.js >=24.15.0 and <25**. There are no runtime dependencies; SQLite comes
from `node:sqlite`. From the repository root:

```sh
node --version
npm --prefix assistant-service start
```

Open **http://127.0.0.1:3000**. With the default environment, the server binds only
to loopback, does not require a pilot key and creates
`assistant-service/data/assistant.sqlite`. The exact host matters: `localhost`
is a different configured origin. The board, cabinets and video worker need not
be running. Stop this process with Ctrl+C; its database remains for the next run.

These defaults assume a clean development environment. Existing environment
variables take precedence. [`.env.example`](.env.example) documents configuration;
**`npm start` does not load `.env` automatically**. Supply variables explicitly
through the process environment or a protected hosting secret configuration.
Keep actual credentials and database files out of Git.

### Try the learner flow

Choose a topic, use its example, and request the first step. Further hints appear
one at a time while earlier steps remain visible. “Показать весь разбор” explicitly
opens the complete explanation. A numeric attempt can be compared with the exact
answer for supported calculations; this is not a general proof checker.
“Объясни проще” or an incorrect-answer report adjusts subsequent explanations in
the current session. “Удалить мой сеанс” clears the session and visible work.

| Topic | Example | Current offline scope |
| --- | --- | --- |
| Linear equations | `3x + 5 = 20` | Bounded integer-coefficient equations of the supported linear form, including zero-coefficient cases |
| Fractions | `1/2 + 1/3` | Addition or subtraction of two supported ordinary fractions |
| Percentages | `15% от 240` | Finding a percentage of a number; arbitrary increase/decrease word problems are outside the exact solver |
| GCD / LCM | `НОК 12 и 18` | Two bounded positive integers |
| Rounding | `Округли 9,96 до десятых` | Supported decimal numbers and named place values, including negative values and carries |
| Pythagorean theorem | `Как отличить гипотенузу от катетов?` | General concept guidance; arbitrary numerical geometry is not verified |
| Plane sections | `Как начать строить сечение по трём точкам?` | General construction principles; no generated diagram or verified arbitrary construction |

The exact supported grammar is in [tutor.js](src/tutor.js), with positive,
negative and ambiguous cases in the [evaluation corpus](evaluation/cases.json).
Unsupported wording receives a bounded response requiring a separate check.
Answer labels distinguish `deterministic`, `curated-guidance`, `needs-teacher`
and `model-unverified`. A source card is context, not proof that a generated
answer is correct. The original seed cards were checked within the prototype;
teacher acceptance of their pupil-facing use and external release review remain
outstanding. Architecture acceptance is recorded separately in ADR 0011.

## Validate changes

From the repository root:

```sh
npm --prefix assistant-service test
git diff --check
```

The test command covers calculations, input validation, HTTP authentication and
origin checks, durable budgets, concurrency, restart, privacy, feedback,
knowledge approval and mocked provider contracts. No provider key is required
and provider tests never call a live model.

Browser checks are separate. Install Playwright **1.55.0** and its Chromium
browser in the test environment, then, with the local offline server running:

```sh
LIVE_ASSISTANT_URL=http://127.0.0.1:3000 node --test --test-isolation=none assistant-service/test/browser.test.cjs
```

Playwright must be resolvable through the test environment's modules or
`NODE_PATH`; it is not an application dependency. Optional test variables are
`CHROMIUM_EXECUTABLE_PATH`, `BROWSER_SCREENSHOT_DIR`, and
`LIVE_ASSISTANT_PILOT_KEY` for a local fixture with private access enabled.
The browser file includes mock API contract tests and a real local-service flow
at desktop and mobile widths. Missing Playwright or `LIVE_ASSISTANT_URL` causes
explicit skips; a skip is not a successful browser check.

The dedicated [CI workflow](../.github/workflows/math-assistant.yml) installs
the pinned browser runtime, starts an isolated offline server, runs browser
checks, and defines a nonroot Docker build/restart/persistence smoke test.
`MATHEXAM_ASSISTANT_PROTOTYPE_OK` is a prototype gate only. The existence of the
workflow is not evidence that its remote run or a production deployment passed.
The local offline browser evidence is available in the
[desktop](../docs/reports/assets/mathexam-assistant/desktop.png) and
[mobile](../docs/reports/assets/mathexam-assistant/mobile.png) captures.

## Prepare the finite synthetic model trial

The owner authorized preparation of the
[synthetic trial](../docs/reports/MATHEXAM_ASSISTANT_EVAL_PLAN_20261027.md) and later
authorized its bounded DeepSeek campaign: at most 32 calls / USD 0.20 at prepared
head `060a445d27e939a3d68a8e1885986ad56d5c89d5`. No live call occurred: API access
and required review remain unresolved. That authorization does not fund cabinet
traffic or another provider/head. Its [40 original cases](evaluation/pilot-cases.json) contain 32 model
tasks and eight local input-rejection checks. Reference answers and scoring
criteria never enter the provider prompt. The evaluator calls the same provider
adapter directly; the normal assistant still solves supported arithmetic offline.

These commands need no provider key and make zero external requests:

```sh
npm --prefix assistant-service run evaluation:plan
npm --prefix assistant-service run evaluation:dry-run
```

Outputs are private, Git-ignored files under `assistant-service/artifacts/evaluation/`:

- `plan.json`: exact source revision, corpus/payload digests and conservative cost.
- `approval.pending.json`: an **unapproved** template, never an owner decision.
- `review.md` and `review-template.json`: conditions, references and blank human scores.
- `dry-run-report.json` and matching review files: simulated transport evidence
  explicitly labelled `NOT_MEASURED`; no claim about a real model's quality.

The proposed campaign is one sequence of at most 32 calls: 500 output tokens,
15 seconds per call, ten minutes overall and a **USD 0.20 whole-campaign cap**.
Its ledger at `assistant-service/data/evaluation/pilot.sqlite` is separate from
pupil sessions. A duplicate, failed or interrupted campaign cannot be started
again. Reservations are not refunded. There is no reset, resume, provider,
corpus, ledger-path or budget override on the CLI. Preserve the designated
checkout/volume: copies or manually deleted ledgers are separate environments,
so provider-side spending controls remain necessary.

Before a later paid run, verify the existing authorization against the exact
plan, provider conditions and budget; finish required review and prepare a scoped key
outside Git. Require a clean committed checkout. A private approval JSON file
must match the current plan digest, have `status: approved`, a real owner-decision
reference, explicit data/payment review, and timestamps valid for no more than
24 hours and before the seven-day price deadline. It contains no API key.

The future command is:

```sh
npm --prefix assistant-service run evaluation:live -- --approval /absolute/private/approval.json
```

Only that command reads `ASSISTANT_API_KEY`. It also requires
`ASSISTANT_EVAL_ALLOW_PAID=1`, `ASSISTANT_EXTERNAL_ENABLED=1` and
`ASSISTANT_PROVIDER_DATA_REVIEWED=1`. Supply those through a protected process
environment after authorization; their presence is not permission by itself.
Other service ENV cannot select a different endpoint, model, ledger or budget
for this finite evaluator. The evaluator is not copied into the application
Docker image and exposes no HTTP route.

Each live result remains pending human review. Save scores in a separate private
JSON file; never replace the blank template. After all 32 responses exist:

```sh
npm --prefix assistant-service run evaluation:review -- --report /absolute/private/live-report.json --scores /absolute/private/reviewed-scores.json
```

The review requires all cases, their report digest and a teacher/reviewer role.
Inapplicable dimensions are exactly `null`; a passing case needs mathematics 2,
every other applicable score at least 1, at least 80% of applicable points and no
critical error. At least 29/32 cases must pass with zero critical errors overall.
A manual zero for mathematics or honesty is always a critical error, regardless
of a separate checkbox.
Simulation, incomplete cases and blank reviews cannot produce a model-quality
verdict. Passing this small synthetic set never authorizes a pupil pilot or release.

## Environment reference

Configuration is validated at startup in [config.js](src/config.js) and is fixed
for the lifetime of the process. Restart after a configuration change. Default
values below describe direct Node startup; the container overrides are listed
in the hosting section.

### Service and request limits

| Variable | Default | Meaning and accepted values |
| --- | --- | --- |
| `NODE_ENV` | Unset | Exact `production` enables production origin and persistence requirements |
| `ASSISTANT_MODE` | `offline` | `offline` or `api`; a key alone never enables model calls |
| `HOST` | `127.0.0.1` | Only `127.0.0.1` or `0.0.0.0` |
| `PORT` | `3000` | Integer 1–65535 |
| `ASSISTANT_PUBLIC_ORIGIN` | `http://127.0.0.1:${PORT}` | Exact origin, with no trailing slash, path, query or fragment; HTTPS in production; HTTP only for loopback in development |
| `ASSISTANT_PILOT_KEY` | Empty | A 43–128 character secret using letters, digits, `_` and `-`; required except for the loopback offline development demo |
| `ASSISTANT_DB_PATH` | Absolute path to `assistant-service/data/assistant.sqlite` | Absolute SQLite path; production requires a normalized path beneath `/data/` |
| `ASSISTANT_PERSISTENCE_CONFIRMED` | Unset | Must be `1` in production after verifying the assistant's own persistent volume |
| `ASSISTANT_SESSION_REQUESTS` | `60` | Maximum asks in one session; 1–100 |
| `ASSISTANT_DAILY_REQUESTS` | `1000` | Global daily asks, including offline asks; 1–10000 |
| `ASSISTANT_DAILY_API_REQUESTS` | `100` | Global daily API reservations; 1–1000 |
| `ASSISTANT_CONCURRENCY` | `2` | Concurrent reserved provider calls; 1–4 |
| `ASSISTANT_MAX_OUTPUT_TOKENS` | `500` | Requested provider output limit; 100–800 |
| `ASSISTANT_TIMEOUT_MS` | `15000` | Provider deadline in milliseconds; 100–30000 |

Additional fixed bounds are a one-hour session, 200 active sessions, ten asks
per session per minute, login limits of 20 attempts per remote address and 100
globally per ten minutes, an 8 KiB request body and a 64 KiB provider response.
Question text is limited to 1000 characters. The browser limits attempts to
300 characters; the API accepts up to 400. The conservative input-token bound
must not exceed 16000. These fixed bounds are code changes, not extra ENV knobs.

### Paid mode — no enabled defaults

Every item below is required when `ASSISTANT_MODE=api`. This table documents the
adapter; it does not authorize activation. Use a separately scoped provider key
and provider-side spending controls after the release gates are completed.

| Variable | Required value or rule |
| --- | --- |
| `ASSISTANT_EXTERNAL_ENABLED` | Exact `1`, explicit server-side enablement |
| `ASSISTANT_PROVIDER_DATA_REVIEWED` | Exact `1`, only after the owner reviews actual processing, retention and other applicable provider conditions |
| `ASSISTANT_PROVIDER` | `deepseek` or `amvera` |
| `ASSISTANT_MODEL` | `deepseek-flash` for DeepSeek; `qwen3_30b` or `qwen3_235b` for Amvera |
| `ASSISTANT_API_KEY` | Hosting secret, 16–2048 printable non-whitespace ASCII characters |
| `ASSISTANT_CURRENCY` | `USD` for DeepSeek; `RUB` for Amvera |
| `ASSISTANT_INPUT_PER_MILLION` | Positive currency units per **1,000,000 input tokens**, including the applicable peak/cache-miss rate |
| `ASSISTANT_OUTPUT_PER_MILLION` | Positive currency units per **1,000,000 output tokens** |
| `ASSISTANT_DAILY_BUDGET` | Explicit positive currency amount for the UTC day |
| `ASSISTANT_MONTHLY_BUDGET` | Explicit currency amount for the UTC calendar month, at least the daily budget |
| `ASSISTANT_PRICE_REVIEWED_ON` | Actual review date, `YYYY-MM-DD`; valid from that date's UTC midnight for seven days, never a future date |

All monetary strings use a decimal point, at most six decimal places and a
maximum of 10000 currency units. Commas, scientific notation and negative
amounts are rejected. Prices and budgets have no paid-mode defaults. The
database records its accounting currency and rejects a different currency;
changing providers does not erase existing reservations.

The allowlist contains only
`https://api.deepseek.com/chat/completions` and
`https://inference.waw0.amvera.ru/v1/chat/completions`. There is no configurable
arbitrary URL. Redirects, tool calls, automatic retries and automatic provider
switching are disabled. DeepSeek requests explicitly disable thinking mode.

The [official DeepSeek pricing](https://api-docs.deepseek.com/quick_start/pricing/)
checked on 2026-10-27 gave peak uncached input/output prices of **USD 0.30 / 1.20
per million tokens**. Configuration rejects lower DeepSeek values; this is a
minimum conservative planning rate, not a guarantee against a future increase.
Exact Amvera Qwen prices and its output/reasoning accounting contract are still
unverified. Do not substitute a different model's advertised tariff. See the
[research](../docs/reports/MATHEXAM_ASSISTANT_RESEARCH_20261027.md) for sources,
local-model alternatives and assumptions. Expired price acknowledgement prevents
API startup; a running service falls back to offline work after it expires.

Even with API mode configured, a paid request requires the learner's explicit
consent for the current task. Supported exact calculations remain offline.
Consent does not replace the owner's provider review or an applicable data
processing basis. The UI clears consent when a new question begins.

### What spending controls guarantee

Before sending a request, a SQLite transaction reserves the conservative input
bound plus configured maximum output at the acknowledged prices. It enforces
global daily and calendar-month budgets in **UTC**, request quotas, duplicate
request IDs and concurrent-call limits. The ledger survives process restart and
session deletion. There is a per-session **request-count** limit, not a
per-session monetary limit or lifetime spending ceiling.

Reservations are never refunded automatically, including on timeout, cancellation,
provider failure or a successful shorter response. Actual returned token counts
are recorded separately. This intentionally allows the local budget to run out
before the provider invoice reaches it. Failed generation falls back to offline
guidance without a second provider call.

These are enforceable **local reservation limits**. An invoice upper bound still
depends on the provider honoring the reviewed tokenizer, `max_tokens`, reasoning,
usage and pricing contract. The input estimate counts every serialized UTF-8 byte
plus a 1024-token framing margin; it is not a provider invoice. An observed usage
or reasoning-contract violation opens a durable circuit and blocks later paid
calls. It cannot undo the first violating charge. A timeout or abort cannot
guarantee that upstream billing stopped. Provider-side limits and an authorized
live contract check remain activation gates. There is no automatic circuit-reset
command; investigate the cause without deleting the accounting database.

## Data, access and deletion

No pupil name, email, cabinet ID or account connection is required. The service
does not read cabinet databases. The entry form asks for mathematical text only;
bounded filters reject common contact details, URLs and credential-like text.
Those filters are an aid, not proof that all personal information has been removed.

Question text, attempts and answer text are **not stored in SQLite**, application
logs or browser local/session storage. They remain in request memory and the open
tab. The model payload, when separately enabled and consented, contains only the
task, attempt, selected topic, hint settings and selected knowledge cards. It
does not contain the session secret, cabinet profile or a conversation archive.
Provider retention and infrastructure/proxy logs require their own review.

| Stored data | Retention and purpose |
| --- | --- |
| Hashed session and CSRF tokens, simpler-explanation flag, request counts, answer metadata | Session expires after one hour; no question or answer text |
| Request IDs, status and cost bounds | Removed by the one-hour cleanup cutoff; pending rows preserve concurrency without a session link after deletion |
| Feedback totals by UTC day, topic and category | Current UTC day and the preceding 29 days, with cleanup on the next scheduled pass |
| Aggregate daily/monthly usage and reservations | Current UTC calendar month and the preceding twelve months; no session link |
| Knowledge candidates and approved revisions | Retained as the teaching/audit record; do not put learner text, names or secrets into cards |

Cleanup runs on startup and approximately every minute while the service runs.
Expiry removes the session link but retains anonymous feedback aggregates for
their retention period. Explicit session deletion removes answer metadata and
subtracts feedback still linked to that session, clears the browser work and
aborts its active requests. Global spending totals and detached pending leases
remain so deletion cannot reset budgets. Deletion cannot recall data already
sent to a provider or erase an older operator/hosting backup. Apply a separate
backup-retention policy before any real pupil pilot.

The private pilot uses a shared access key, not production pupil authentication.
Session cookies are HttpOnly and SameSite=Strict, with Secure on HTTPS. Mutations
require the exact configured Origin and a session CSRF token; the proxy must
preserve the expected Host. Forwarded headers are not trusted for identity or
origin. Responses use a restrictive content policy, plain-text rendering and
no-store/noindex headers. Login address hashes are salted per process and held
only in memory. Indexing directives do not substitute for access control.

## Operator: knowledge, feedback and backups

The CLI is local to the assistant's volume and has no public administration
endpoint. Run it from `assistant-service/` with the same database path as the
server. The command itself makes no provider request. If paid-mode configuration
has expired, explicitly use `ASSISTANT_MODE=offline` for the operator process;
this does not reset the existing ledger or currency.

```sh
npm run operator -- status
npm run operator -- propose /absolute/path/card.json
npm run operator -- approve CANDIDATE_ID teacher --confirm-reviewed
npm run operator -- reject CANDIDATE_ID teacher --confirm-reviewed
npm run operator -- backup /absolute/private/backup-new.sqlite
```

`status` shows aggregate usage, circuit state, feedback totals and pending cards.
`propose` accepts one JSON object of at most 16 KiB matching an individual card
in [knowledge/core.json](knowledge/core.json): `id`, `topic`, `title`,
`explanation`, `steps`, `check`, `source` with `label`/`url`, and `version`.
Use a supported topic and an HTTPS source under this repository's GitHub path
or `mathexam.space`. Check mathematical content, age-appropriate wording,
provenance and absence of personal data before approving. Use a reviewer role
such as `teacher`, never a pupil or reviewer's real name. Accepted role syntax
is a lowercase letter followed by 1–39 lowercase letters, digits or hyphens.

A pending or rejected candidate never enters answers. Approval creates an
immutable, incremented version. Retrieval selects the latest approved version
of each card, newest approvals first, then seed cards not replaced by that ID,
and uses at most **three cards per topic**. Newly approved guidance can therefore
affect offline explanations as well as future model context. This is plain
topic-based retrieval: there are no embeddings or vector database.

Feedback has only `helpful`, `unclear` and `incorrect` categories. It can simplify
the current session's next answer and inform later manual review; it does not
create or approve facts automatically. Persisted approved cards constitute
knowledge accumulation. **No model weights are trained or updated.**

`backup` uses SQLite's backup API, requires a new absolute filename, and creates
the file with mode `0600` before copying. A failed or partial backup is not a
verified recovery point. Keep backups in a protected location separate from the
active file and verify integrity plus an offline restart against a copied
database. Restore only while the service is stopped, preserve the current file
for recovery, and retain accounting reservations. There is no automated restore
or knowledge-history deletion command in this prototype.

## Independent hosting plan and rollback

[Dockerfile](Dockerfile) uses Node 24.21.0 Alpine, runs as the `node` user
(UID 1000), and binds port 3000. It sets `NODE_ENV=production`, `HOST=0.0.0.0`,
`ASSISTANT_MODE=offline` and `ASSISTANT_DB_PATH=/data/assistant.sqlite`.
Production startup additionally requires an HTTPS public origin, a private
pilot key and explicit persistence confirmation. Give UID 1000 write access to
the assistant's own volume; do not solve permissions by sharing cabinet data
or running the app as root.

The future Amvera application must be **separate**. Select this service's
[amvera.yml](amvera.yml) as that application's configuration, with the repository
root as Docker build context and `assistant-service/Dockerfile` as Dockerfile.
Its settings are `containerPort: 3000` and `persistenceMount: /data`.
Do not replace the repository-root configuration or point the existing app at
the assistant. If the Amvera UI's configuration selection differs, verify it
before any launch. These files do not create an application or paid resources.

Use **one replica/process** with a durable writable volume. A second replica
requires a separately reviewed shared ledger/session design. Backups, actual
CPU/RAM, storage, proxy limits and provider conditions must be checked in the
owner's account; public tariff research did not establish the account allocation
or available GPU. The API architecture does not require a local GPU or loaded
model weights. Local Qwen hosting remains a researched alternative requiring
RAM and latency measurements, not an enabled background process.

The assistant can remain available independently of board/video. The existing
root board server also hosts pupil cabinets, so stopping it stops both. This
prototype does not split that process. Video already has a separate worker.
Each application's real start/stop and billing behavior must be managed in its
hosting account; closing a page or hiding a panel does not release resources.

Rollback is to switch the assistant to offline mode, restart it, or stop only
its application. Preserve its `/data` and reviewed backups; restore a previously
verified offline version if needed. Do not delete the usage database to clear a
limit, circuit or operational error.

Before paid or public use, complete owner architectural acceptance, required
external exact-head review, current provider price/data review, authorized live
quality and billing-contract validation, actual Amvera/container/persistence
checks, and a small approved pupil pilot. Then obtain the separate release and
paid-activation permissions required by repository policy. No real paid model
benchmark, resource activation or publication is claimed by this README.
