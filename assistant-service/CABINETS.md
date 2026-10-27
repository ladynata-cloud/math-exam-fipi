# MaxExam 0.0 in selected MathExam cabinets

Prepared implementation, updated 2026-10-28. This guide is not a deployment record.
The [task](../docs/tasks/MATHEXAM_ASSISTANT_CABINETS_V1.md) authorizes preparation
for three privately selected pupils. Real accounts have not been bound and no
external model has been called. Merge and deployment require separate decisions.

## What the first version provides

| Private profile | Reviewed material | Current calculation / reasoning boundary |
| --- | --- | --- |
| `oge-geometry` | Five topics: triangles, circles, quadrilaterals/areas, grid geometry and statements | Exact bounded calculations and six statement explanations, plus next-step guidance; does not read a drawing or certify an arbitrary proof |
| `peterson-decimals` | Eight topics: place value, comparison, rounding, addition/subtraction, multiplication, division, powers of ten and ordinary/decimal fractions | Exact rational arithmetic for supported signed finite-decimal inputs, exact fractional results and repeating-decimal output; division by zero is rejected |
| `triangle-congruence` | Four topics: SAS, ASA, SSS and corresponding vertices / choice of criterion | Explicit premises and justification; rejects the idea that AAA or arbitrary SSA proves congruence |

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

The 17 cabinet topics are versioned, checked source cards in
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
changes and page exit dispose it and abort pending UI requests. Questions and
answers are not written to browser Web Storage. The explicit public-condition
handoff below uses a URL fragment, which can remain in ordinary browser history;
it never includes a pupil's answer or account data. A response arriving after account,
permission or task revocation is withheld by the server as well.

## Task context and assistance

For a course opened in another tab, enter only the mathematical condition. The
panel says it cannot see that tab. Public OGE and Peterson pages do not provide a
universal current-task feed to the cabinet. Opening a link does not synchronize
its screen, score or completion with this helper.

### First-part OGE geometry collection and explicit handoff

The owner withdrew the earlier supplied AGENTS.md instructions during this
increment. Its preparation record therefore does not impose those former
consultation/exception gates. The dependency service and gateway are still
unreleased; live deployment and private activation are factual outstanding work.

The [geometry increment](../docs/tasks/OGE_GEOMETRY_ASSISTANT.md), dependent on
PR #360, adds `#geometry` and five topic entries to the existing cabinet. A saved
plan that already references the canonical geometry trainers shows one collection
entry and retains all its original trainer cards. This does not create or complete
managed attempts and does not change any real pupil's plan or assistant settings.

Each public trainer has a collapsed “Помощник MathExam” control. It can open the
native current-task hint or explicitly transfer the current public condition into
`#geometry-help`. The outgoing link carries only an allowlisted topic/source and
at most 1,000 characters of mathematical text. It does not contain pupil work,
account identifiers, hidden answers, a drawing or later edits from the source tab.
Native assistance is marked before opening the new tab; closing help does not
remove that mark. The source draft and drawing remain in the trainer. These
controls are absent in embedded/shared-board and native assessment modes.

The receiver validates the exact route and source/topic pair, keeps the current
account, and pre-fills a form only for the already-authorized `oge-geometry`
profile. Opening the link makes no question POST and does not enable the helper
or a provider. The pupil must check the text, add data present only in the drawing,
and submit deliberately. Ordinary sign-in can preserve this bounded handoff.

`src/geometry-tutor.js` accepts only complete, narrowly specified question forms:
triangle angle sums and Pythagoras; the two square/circle area configurations;
explicit shared-arc angle relationships; trapezoid midlines and their diagonal-
divided parts; relevant side/height or diagonal area formulas; grid distance with
an explicit scale; and six exact geometric statements with proof/counterexample.
Finite decimals use exact rational arithmetic; irrational lengths retain a square
root. Hints give one step without the final result, including the maximum hint
level. The full solution requires a separate request. Supported calculations stay
offline even when external permission exists.

This is not a general natural-language geometry solver. Extra or contradictory
premises, missing drawing data, units not supported by the grammar, unsupported
notation and arbitrary proofs receive an honest `needs-teacher` response.
Mathematical input preserves superscripts/subscripts instead of compatibility-
flattening them into different numbers; privacy detection still checks normalized
forms. A saved or transferred task is not promised to match a supported solver.

Task19 practice keeps assisted correct answers in its repeat queue. A subsequent
unassisted answer to the same statement can clear that queue, but this is not
proof of mastery on a fresh analogous problem. Historical local records made by
the previous version are not migrated automatically.

When the cabinet supplies an owned, published, non-archived attempt, help is
marked before any response is delivered. The current structured projection is
limited to the fixed Atanasyan adapter's task prompt; its existing exercise 92а
and theory cards do not amount to structured support for every congruence task.
Other owned attempts retain explicit manual entry. Whole attempt state is never
forwarded. An unfinished exam or diagnostic blocks helper questions entirely.

An arbitrary manually entered question cannot prove that unrelated work was
independent. The helper does not award grades, forge course completion or infer
which unseen textbook exercise a pupil is doing. Existing cabinet assistance
accounting applies to the linked attempt, not automatically to all open tabs.

## Configuration for a later reviewed release

The integration defaults to disabled. The exact public catalogue is duplicated
as `board-server/assistant-profile-catalog.json`; a test and service handshake
require equality with the independent service. Deploy compatible versions.
Changing these variables requires restarting the corresponding application.

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

During the earlier PR #360 preparation no authenticated teacher connection was
available. The 2026-10-28 geometry task verified the intended existing cabinet
read-only and found all five saved trainer links. No account was enabled or
modified, and the prerequisite service/gateway changes remain unmerged. These
observations do not claim that a real cabinet already displays the new panel.

## Cost and failure behavior

The cabinet reserves a request before work. One request is in flight across the
pilot; transport has a hard 20-second limit and a 64 KiB answer bound. Failed,
cancelled or uncertain requests retain their allowance and are never retried
automatically. The UI makes at most one status GET after a failure to refresh
the remaining count; that GET does not repeat inference.

Paid requests, if later enabled, use the assistant's existing durable reservation
ledger with global daily/monthly money limits, per-day API counts, current price
review and usage-contract circuit breaker. Supported exact decimal and geometry calculations
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
node --test --test-isolation=none tools/learning-oge-geometry.test.cjs tools/oge-geometry-helper.test.cjs
node tools/learning-oge-geometry.browser.cjs
node tools/oge-geometry-helper.browser.cjs
node tools/oge-geometry-event-order.browser.cjs
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
