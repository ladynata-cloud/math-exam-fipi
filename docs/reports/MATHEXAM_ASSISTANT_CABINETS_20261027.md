# MaxExam 0.0 cabinet preparation — evidence and limits

Date: 2026-10-27 (Asia/Novosibirsk).
Task: [MATHEXAM_ASSISTANT_CABINETS_V1](../tasks/MATHEXAM_ASSISTANT_CABINETS_V1.md).
Base: `060a445d27e939a3d68a8e1885986ad56d5c89d5`.
Branch: `feat/math-assistant-cabinets-20261027`, stacked on Draft PR #359 / #358.
Review level: HIGH. Exact published head and remote runs are recorded in the PR.

## Result

Prepared an authenticated, default-disabled connection from the existing cabinet
to the independent helper. Three private account selections can use OGE geometry,
Peterson decimals and Atanasyan triangle-congruence profiles. The product heading
is MaxExam 0.0; offline cards explicitly say that no external model is connected.

The full real local path works: browser login and CSRF, teacher configuration,
cabinet gateway, independent assistant HTTP service, retained hints, full answer
and feedback. Synthetic teacher/pupil fixtures stand in for real accounts.
Actual pupil binding, provider calls, merge and deployment did not occur.

See the [operator guide](../../assistant-service/CABINETS.md) for configuration,
privacy, context limits, retention, budget behavior and rollback.

## Validation

| Check | Evidence |
| --- | --- |
| Full assistant service suite | 107 groups passed, zero failures/skips; includes existing evaluator, 14 bridge groups and 11 topic groups |
| Full board/cabinet suite | 328 tests passed, zero failures/skips after the documented fixture corrections |
| Helper browser suite | 10 groups passed: desktop/mobile, inert rendering, retention, quota refresh without retry, service recovery, teacher settings, account/route disposal, mixed-key exam routes and polling during a delayed ask |
| Real two-service browser journey | `MATHEXAM_ASSISTANT_CABINET_E2E_OK`; 9 completed requests across all 3 profiles, feedback stored in both services, fourth pupil rejected |
| External traffic in end-to-end journey | 0 model calls, 0 external browser requests, 0 uncaught page errors |
| Existing cabinet and profile-entry browser regressions | Passed |
| Existing full authentication browser regression | Local Playwright 1.55 / Chromium 1187 failed at the denied-clipboard fallback assertion; the exact base app/index overlay reproduces the same failure. No authentication code/test was weakened. CI's pinned browser runtime remains the authoritative full-run check |
| Independent math inspection | 30 accepted manually derived boundary cases correct; 2 long-decimal subtraction strings rejected by the conservative privacy filter; topic tests also include 90 independent decimal oracles |
| Visual inspection | Normal synthetic question at desktop and 390px; no horizontal overflow; retained first hint and reachable controls |
| Static checks | JavaScript syntax, catalogue parity and `git diff --check`; final link/scope/sanitization outcome recorded in PR |

Synthetic UI captures:
[desktop](assets/mathexam-assistant-cabinets/desktop.png) and
[mobile](assets/mathexam-assistant-cabinets/mobile.png).

The initial full board run had three failures, all resolved before the final
328/328 run. The new 31-day-retention test incorrectly used an already expired
cabinet session; it now proves expiry and obtains a fresh session before testing
unlinking and the surviving replay boundary. The runtime-layout fixture copied
only JavaScript despite Docker copying JSON too; it now includes runtime JSON.
An unchanged group-history assertion mistook an `s2` substring in a random opaque
ID for another seat. The test now forces that collision and checks complete
foreign-seat keys/values plus every real synthetic invitation secret on both
history pages. Existing group-lessons runtime code is unchanged.

These corrections preserve test intent. The unrelated local clipboard failure
is separately reported, not reclassified as a pass. Remote CI must run on the
exact final head; a workflow definition or old green run is not that evidence.

## Independent internal review

Separate implementation agents reviewed the topic mathematics and both transport
boundaries. Findings fixed before handoff include secret reflection through
answer IDs/source IDs/notices, a hard transport deadline even for a noncooperative
body stream, permission/task revocation after asynchronous inference, UUID case
normalization for replay, acceptance of legitimate exact decimal results and
retention of the current pupil's text during ordinary attempt polling.

Teacher wording was clarified for negative-number comparison and optional
grid-aligned bases. The helper's route exclusion follows the main renderer's
exam/preview query flags, including mixed-key URLs. These are internal technical
and mathematics reviews; they do not satisfy the external HIGH-review record.

## Reconciled production evidence

Authoritative remote `main` still points to
`92d733a49692744ce043503c57f29b77bfb09a24`. PR #359 remains Draft and unmerged at
the base above. Read-only public checks returned HTTP 200 and matched that main
source byte-for-byte:

| File | SHA-256 |
| --- | --- |
| `index.html` | `8a58acd17e75e86f190205a2ff8da5b158e2449cdbbbb312e3c8bd2fc4437d45` |
| `sitemap.xml` | `4ce7b08cd9178dea6d7a2a2ffcc6d636d5cfe2f8a892bfaaf4a000d7403218cd` |
| `robots.txt` | `84a1b2da3e72a2331bee1f7d155bb6723a43624f68ef80d834ab3ebc4ca22660` |

These public checks do not verify private account identities, hosting resources,
provider keys or a deployed helper. No authenticated teacher browser connection
was available; no real pupil IDs were guessed, exported or changed.

## What remains unmeasured or unavailable

- Model mathematical and pedagogical quality on these pupil profiles. All model
  transports in local tests were synthetic or explicitly forbidden.
- Provider billability, actual Amvera CPU/RAM/GPU allocation, inference geography,
  backup/ingress settings and the selected account's payment terms.
- Exact-head external HIGH review. No earlier permission or internal agent
  verdict is presented as an external review or reasoned owner waiver.
- Real pupil account binding and production smoke tests, pending authenticated
  access and a separately approved release.

The profile-specific coverage is deliberately bounded: exact decimal arithmetic
is not an arbitrary word-problem solver; a geometry card is not a verified proof
of an unseen exercise; the current Atanasyan structured adapter does not cover
all congruence exercises. Some phone-like long numeric strings are rejected by
the input filter. Feedback records an editorial signal, not proof of correctness.

## Owner's model-selection direction

The owner now prefers a strong teaching model and wants to consider three
participants: OpenAI, GigaChat and a Chinese model, for which Qwen is a candidate.
This is a direction for a separately bounded provider/evaluation change. This
cabinet PR does not add those adapters, issue keys, invoke all three per question
or spend the earlier DeepSeek synthetic authorization on a different model.

An appropriate next design is one pupil-facing MaxExam interface, selective
model consultation and teacher-reviewed knowledge. A mathematical disagreement
is reviewed against the condition, exact calculation and justified proof, not
settled by model majority vote. Model-generated material remains pending until
reviewed. No weight training is implemented or implied.

Primary documentation checked on the report date:

- [OpenAI model guide](https://developers.openai.com/api/docs/guides/latest-model)
  distinguishes GPT-6 Astra for the most demanding work and GPT-6.1 Sol for a
  lower-cost balance. These descriptions do not establish performance on our
  school tasks. The [supported-country list](https://developers.openai.com/api/docs/supported-countries)
  does not include Russia; access and offering access must be eligible before
  recommending a purchase or a deployed integration.
- [OpenAI's under-18 guidance](https://developers.openai.com/api/docs/guides/safety-checks/under-18-api-guidance)
  has additional safeguards and requires zero data retention before processing
  personal data of children under 13 or the applicable consent age. The
  [data guide](https://developers.openai.com/api/docs/guides/your-data) distinguishes
  no default training from retention: `store:false` alone is not approved ZDR.
- [GigaChat's current individual tariff](https://developers.sber.ru/docs/ru/gigachat/tariffs/individual-tariffs)
  includes free API allocations, including Ultra. Its
  [commercial-use rule](https://developers.sber.ru/docs/ru/gigachat/tariffs/commercial)
  limits Freemium to personal noncommercial use. Personal synthetic assessment
  does not establish permission to publish its generated material or run pupil
  cabinets under that tariff.
- [Amvera Qwen documentation](https://docs.amvera.ru/LLM/doc-inference-ru.html)
  establishes a technical API option; its actual package price, inference data
  handling and pupil-use conditions still need verification.

API connection is not training: the selected model generates a response; the
application supplies context and stores only approved knowledge. A future
weight-training project needs its own licensed data, resources and evaluation.

## Release recommendation

Keep the prepared change Draft. Preserve all accounting and leave external
inference disabled. Complete the exact-head CI/review, verify the intended
accounts privately, resolve the model/provider conditions and obtain the
separate release decision. Do not merge or activate the service from this report.
