# Grade 6 assistant dialogue — preparation evidence

Task: [MATHEXAM_ASSISTANT_GRADE6_DIALOGUE_V1](../tasks/MATHEXAM_ASSISTANT_GRADE6_DIALOGUE_V1.md)

Base: `6fb959fc0130a0bb8842601d19297e305ac91ac0` (main).
Date: 2026-10-30 (Asia/Novosibirsk).
Final committed head and PR are recorded in the PR rather than a self-referential
commit field. Preparation gate: `MATHEXAM_ASSISTANT_GRADE6_DIALOGUE_PREPARED_OK`.

## Implemented behavior

- Vilenkin grade 6 NOD/NOK profile reuses the existing exact BigInt solver and
  existing public trainers. Hints preserve the next-action/full-solution choice.
- Follow-up UI preserves the original task and previous displayed steps. Each
  follow-up needs a fresh external-transfer acknowledgement beside its field.
- Browser supplies an answer pointer, not arbitrary history. Gateway validates
  account/session/settings/task binding and sends a bounded snapshot to helper.
- Context has an absolute 15-minute lifetime from the first answer, maximum 60
  entries, 3 prior pairs and 3500 UTF-8 bytes including the new question. It is
  never written to SQLite or browser storage. Restart forgets text, not quotas.
- The helper treats past model text as untrusted data. Unsupported follow-ups,
  timeouts or provider failures do not silently claim a contextual answer.
- Source-only courses, existing cabinet authentication, assessment exclusion,
  durable quotas/replay and provider spending reservations are retained.

## Validation

Node v24.22.1; isolated jsdom 26 and Playwright 1.55 / Chromium 1187.
All checks use synthetic accounts and mocked model responses. No real provider
request or API credit was used; no production configuration was changed.

| Check | Result |
| --- | --- |
| `npm --prefix assistant-service test` | 131 passed, 0 failed/skipped |
| `npm --prefix board-server test` | 343 passed, 0 failed/skipped |
| `node --test tools/learning-assistant-local.test.cjs tools/learning-assistant-dialogue.test.cjs tools/peterson-assistant.test.cjs` | 30 passed, 0 failed/skipped |
| `node --test --test-isolation=none tools/learning-assistant-browser.test.cjs` | 19 desktop/mobile checks; `MATHEXAM_ASSISTANT_CABINET_BROWSER_OK` |
| `node tools/learning-assistant-e2e.browser.cjs` | 8 existing end-to-end scenarios, 15 completed requests; `MATHEXAM_ASSISTANT_CABINET_E2E_OK`; 0 provider calls |
| Generated assistant course sources | `ATANASYAN_ASSISTANT_SOURCE_OK`, `ICHENSKAYA_ASSISTANT_SOURCE_OK` |
| `git diff --check` | Passed |

New mathematical tests compare all pairs 1–20 against independent enumeration,
plus large coprime inputs, repeated factors, ones and invalid numeric formats.
New gateway tests cover stale parents, account/session/task/settings mismatch,
expiry, privacy, consent, unavailable provider access, quotas and source routes.
UI checks cover task changes, late responses, account disposal, consent reset,
text-only rendering, offline labeling and mobile layout.

## Review and limitations

Independent internal review found a retention-renewal defect: follow-ups could
previously extend the lifetime of the oldest message. It was corrected by
inheriting the original chain deadline; minute 14/14.5/15 regression passes.
The reviewer reported no further confirmed unresolved findings. This is internal
technical review, not an external exact-head release verdict.

Not run: actual model quality/latency/billing trial, external HIGH review,
production deployment/backup restoration and container restart smoke on this
host. Existing CI contains the container gate. No claim is made that successful
mocked conversation proves suitable explanations for real children. Current
provider data, age/geography conditions and budget must be verified for rollout.

The additional profile changes the synchronized cabinet/helper catalog. Both
services must be updated together under a separate release plan; mismatched
catalogs fail closed. There is no automatic assignment of a private pupil account.
