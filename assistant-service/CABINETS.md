# MaxExam 0.0 in selected MathExam cabinets

Prepared implementation, 2026-10-27. This guide is not a deployment record.
The [task](../docs/tasks/MATHEXAM_ASSISTANT_CABINETS_V1.md) authorizes preparation
for three privately selected pupils. Real accounts have not been bound and no
external model has been called. Merge and deployment require separate decisions.

## What the first version provides

| Private profile | Reviewed material | Current calculation / reasoning boundary |
| --- | --- | --- |
| `oge-geometry` | Five topics: triangles, circles, quadrilaterals/areas, grid geometry and statements | Conditions, theorems and next-step guidance; does not read a drawing or certify an arbitrary proof |
| `peterson-decimals` | Eight topics: place value, comparison, rounding, addition/subtraction, multiplication, division, powers of ten and ordinary/decimal fractions | Exact rational arithmetic for supported signed finite-decimal inputs, exact fractional results and repeating-decimal output; division by zero is rejected |
| `triangle-congruence` | Four topics: SAS, ASA, SSS and corresponding vertices / choice of criterion | Explicit premises and justification; rejects the idea that AAA or arbitrary SSA proves congruence |
| `atanasyan-first-steps` | Exact tasks 1–160, 232 exercise cards and 23 theory cards from the reviewed Atanasyan course | Source-based prompts, reasons and explanations for the selected step; an explicitly requested full solution remains subject to teacher review |

The fourth profile is an additive option for the
[first-steps course task](../docs/tasks/ATANASYAN_FIRST_STEPS_CABINET.md).
The limit remains three enabled pupil accounts in total, not three per profile.
This course profile always uses the local reviewed source, including when other
profiles have external inference enabled. It cannot be configured for external
transfer in this task.

The panel is named **MaxExam 0.0**. This is the application's name, not a claim
that separately trained neural-network weights exist. Offline mode explicitly
says the external model is not connected. Checked calculation, general reviewed
guidance, insufficient conditions and unverified model answers have distinct
labels. Original explanations are not copied textbook solutions.

Each request gives one next hint, simpler wording, or a full explanation chosen
by the pupil. Earlier steps stay visible in the current view. Feedback categories
are helpful, still difficult and possibly incorrect. The last two request simpler
subsequent wording in the current one-hour assistant session; they do not certify
or rewrite shared mathematics. A model answer is never automatically promoted to
reviewed knowledge.

The original 17 cabinet topics and the additional course entry are versioned,
checked source cards in
[`src/cabinet-topics.js`](src/cabinet-topics.js). Changes to these cards need
mathematical review and a normal repository change. The standalone assistant's
existing privileged candidate/approval workflow remains available for its own
topic catalogue; the cabinet bridge does not expose that operator interface or
automatically import arbitrary candidates. No raw pupil chat is a training set.

## Service and data boundaries

The browser calls only its existing cabinet origin, using the cabinet's HttpOnly
session, account fence, exact Origin and CSRF protection. The cabinet server
checks the pupil, profile, quota and current task, then calls the independent
assistant over a protected server-to-server route. Only the assistant can call
the configured provider. Neither service starts board, video or GPU resources.

The bridge carries a random pupil pseudonym, operation UUID, profile/topic,
bounded mathematical question, optional attempted step and hint preferences.
It does not carry the cabinet account ID, login, name, session, assignment ID,
photo, answer key or whole history. The pseudonym and bridge credential never
enter the model prompt. Random pseudonyms still represent linkable internal
data; input filtering is not proof that arbitrary text is anonymous.

Cabinet storage contains settings, daily counts and minimal request/feedback
metadata, not questions or answer text. On helper status/ask access, at most once
per minute, records older than 30 days lose their pupil/profile/topic/answer/
feedback links; old daily counts are removed. This is activity-driven cleanup,
not a promise of physical deletion exactly at the 30-day boundary. Replay hashes
remain and cannot restart a completed or uncertain operation. The cabinet stops
accepting new operations at 100,000 tombstones instead of deleting accounting.

The assistant keeps one-hour session/answer metadata, feedback totals for the
existing 30-day window and aggregate accounting under its existing retention
policy. Its replay tombstones also have a 100,000-operation cap. Its timer cleans
expired sessions; raw questions, attempted work and generated text are not saved.
Hosting access logs, backups and provider retention need their own operational
review. Do not log request bodies, cookies or credentials at an ingress proxy.

Visible conversation text stays in page memory. Account changes, relevant route
changes and page exit dispose it and abort pending UI requests. No helper text
is put in browser persistent storage. A response arriving after account,
permission or task revocation is withheld by the server as well.

## Task context and assistance

For a course opened in another tab, enter only the mathematical condition. The
panel says it cannot see that tab. Public OGE and Peterson pages do not provide a
universal current-task feed to the cabinet. Opening a link does not synchronize
its screen, score or completion with this helper.

When the cabinet supplies an owned, published, non-archived attempt, help is
marked before any response is delivered. The current structured projection is
limited to the fixed Atanasyan adapter's task prompt; its existing exercise 92а
and theory cards do not amount to structured support for every congruence task.
Other owned attempts retain explicit manual entry. Whole attempt state is never
forwarded. An unfinished exam or diagnostic blocks helper questions entirely.

The new native first-steps course supplies only
`courseContext={courseId:"atanasyan-first-steps",lessonId,stepIndex}`. The index is
zero-based. The cabinet independently resolves the condition from its packaged
public `learning/atanasyan-first-steps/course.json`; it does not accept a browser
condition, solution, topic or arbitrary source URL for this route. The separate
helper resolves the same identifiers against its reviewed minimal source
projection and checks the course digest and exact condition before answering.
An unknown task, out-of-range index, mismatched revision or profile is rejected.
This route does not expand or change the existing managed 92а attempt contract.

The browser records assistance before asking and captures the selected task and
step for the returned label. Hint levels explain that same step; they do not
advance it. Full explanations are shown only after the pupil explicitly asks.
The current course progress is local to the pupil's browser, so the server can
validate an in-range source step but cannot independently prove it was already
revealed there. Source-based guidance does not certify the pupil's own proof or
replace the teacher's review. The helper homepage links to the native course
instead of offering an unsupported manual-question form for this profile.

An arbitrary manually entered question cannot prove that unrelated work was
independent. The helper does not award grades, forge course completion or infer
which unseen textbook exercise a pupil is doing. Existing cabinet assistance
accounting applies to the linked attempt, not automatically to all open tabs.

## Configuration for a later reviewed release

The integration defaults to disabled. The exact public catalogue is duplicated
as `board-server/assistant-profile-catalog.json`; a test and service handshake
require equality with the independent service. Deploy compatible versions.
Changing these variables requires restarting the corresponding application.

Regenerate the helper's minimal public source projection after a reviewed course
change with `node assistant-service/scripts/build-course-knowledge.cjs`; use
`--check` to verify committed bytes. Both services ship their own authoritative
copy and fail closed on a digest mismatch. The assistant image's existing
`COPY knowledge ./knowledge` includes the projection. No model, credential or
pupil work is bundled into it.

| Application | Variable | Meaning |
| --- | --- | --- |
| Cabinet | `LEARNING_ASSISTANT_ENABLED=1` | Enables the gateway; does not select pupils or enable external inference |
| Cabinet | `LEARNING_ASSISTANT_ORIGIN` | Exact HTTPS origin of the separate assistant, no path or trailing slash |
| Cabinet | `LEARNING_ASSISTANT_BRIDGE_KEY` | Protected 43–128-character base64url secret shared only with the assistant |
| Assistant | `ASSISTANT_CABINET_BRIDGE_KEY` | Same bridge secret; must differ from pilot and provider keys |
| Assistant | `ASSISTANT_MODE=offline` | Initial model-free mode; no API credential needed |
| Assistant | `ASSISTANT_CABINET_EXTERNAL_ENABLED=0` | Keeps external cabinet requests disabled even if another private interface uses API mode |
| Cabinet | `LEARNING_ASSISTANT_EXTERNAL_ENABLED=0` | Independent external-transfer kill switch |
| Cabinet | `LEARNING_ASSISTANT_PROVIDER_DATA_REVIEWED` | Must be `1` before external mode is configured, after the actual review |

Use the existing production settings from [README](README.md), including separate
private `/data` storage, HTTPS origin, persistence acknowledgement and a separate
pilot UI secret. A bridge key alone is not enough to start the production helper.
The key belongs in hosting secrets, never a URL, frontend bundle, chat, screenshot
or repository. HTTP is accepted only for explicit nonproduction loopback tests
with `LEARNING_LOCAL_DEV=1` on the cabinet side.

For later external mode, all ordinary assistant provider, price, budget and
data-review requirements still apply. Additionally enable the assistant cabinet
switch, both cabinet review/switch settings, the teacher's private external
permission and the pupil's checkbox for that individual request. The checkbox
resets after each request. Teacher permission and a child clicking it do not by
themselves establish the legal basis for processing pupil data.

## Select exactly the intended accounts

After review, release authorization and access are available, use the authenticated
teacher view to open each intended pupil's actual cabinet. Verify the account
and course/history rather than guessing from a first name. Select the matching
profile, start with 10 requests per UTC day, keep external permission off, and
save. Repeat only for the three approved accounts. Names, logins and IDs belong
only in private runtime records, never a public PR or fixture.

The server allows at most three enabled pupils and a per-pupil daily limit of
1–20. Saved settings have a version, so a stale teacher page cannot silently
overwrite another edit. Disabling/re-enabling, changing a profile, restarting or
logging in again cannot renew the same day's allowance. The fourth pupil is
blocked both in the interface and by direct API calls.

Actual account binding was not possible in this task because no authenticated
teacher browser connection was available. The preparation does not claim the
three real cabinets already display the panel.

## Cost and failure behavior

The cabinet reserves a request before work. One request is in flight across the
pilot; transport has a hard 20-second limit and a 64 KiB answer bound. Failed,
cancelled or uncertain requests retain their allowance and are never retried
automatically. The UI makes at most one status GET after a failure to refresh
the remaining count; that GET does not repeat inference.

Paid requests, if later enabled, use the assistant's existing durable reservation
ledger with global daily/monthly money limits, per-day API counts, current price
review and usage-contract circuit breaker. Supported exact decimal calculations
stay offline even when external permission exists. These limits do not cap
hosting subscriptions, other applications or provider auto-top-ups.

The earlier authorization of at most 32 synthetic DeepSeek calls / USD 0.20 is
bound to the separate evaluation campaign at commit
`060a445d27e939a3d68a8e1885986ad56d5c89d5`. It is not a pupil-traffic budget,
permission for another provider, or a portable approval for this new head.
No API access is configured, and no live quality score is available.

## Provider decision remains open

Checked 2026-10-27 against primary sources:

- [DeepSeek terms](https://cdn.deepseek.com/policies/en-US/deepseek-terms-of-use.html)
  include a restriction in §3.4(8) on chatbots/content specifically appealing to
  under-18s. A closed classroom cabinet does not by itself resolve that restriction.
- [Amvera's inference documentation](https://docs.amvera.ru/LLM/doc-inference-ru.html)
  documents Qwen API access and a token from its LLM account section. The actual
  Qwen package cost, processing location, prompt retention and permitted pupil
  use still need verification. Application hosting terms do not prove inference
  data handling, and the endpoint name does not establish processing geography.
- [Yandex AI Studio's current terms](https://yandex.ru/legal/cloud_terms_yandex_ai_studio/ru/)
  allow embedding generation and describe non-retention/non-training after proper
  logging disablement (§5.5–5.6). Its
  [technical instruction](https://aistudio.yandex.ru/ru/docs/ai-studio/operations/disable-logging)
  specifies `x-data-logging-enabled: false` per request. This is a candidate for
  another scoped integration/evaluation, not an implemented adapter or approval
  for unrestricted pupil use. Quality, billing and all applicable terms remain
  separate checks.

Do not purchase a provider package merely to obtain a key. A key authenticates
API use; it is not a trained model or an automatic learning mechanism. A later
fine-tuning project would need an explicitly chosen open model, a lawfully usable,
teacher-checked dataset, training resources and independent evaluation.

## Verify and roll back

From the repository root with Node 24 and locked board dependencies installed:

```sh
npm --prefix assistant-service test
npm --prefix board-server test
node --test --test-isolation=none tools/learning-assistant-browser.test.cjs
node tools/learning-assistant-e2e.browser.cjs
node assistant-service/scripts/build-course-knowledge.cjs --check
git diff --check
```

The browser commands need Playwright and Chromium resolvable in the test
environment. They fail rather than silently skip missing dependencies. All
accounts are synthetic; the real two-service browser scenario throws if any
model transport is attempted. See the [evidence report](../docs/reports/MATHEXAM_ASSISTANT_CABINETS_20261027.md).

To stop a single pupil's access, disable that private setting. To stop the whole
pilot, set the cabinet enable flag to `0` and restart it. To stop only external
spending, turn off the cabinet external switches and assistant external cabinet
switch. Preserve both databases and reservation/tombstone history; do not delete
them to regain allowance. Stop the independent assistant application if needed.
The video worker remains separately controlled. Board and cabinets still share
one existing process: stopping that process stops cabinets too. This task does
not claim to have split those two existing components.
