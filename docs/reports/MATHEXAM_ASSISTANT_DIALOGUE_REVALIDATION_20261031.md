# MaxExam dialogue revalidation — 2026-10-31

## Scope and release boundary

PR: https://github.com/ladynata-cloud/math-exam-fipi/pull/375
Original head: `5f041d9227fd2a1d2e30fc1a1676a3d06f8f81ca`
Current integration base: `c9bf66e2d95f48db0134d43cc590da89f8bc3053`
Review level: HIGH; accepted ADR0011.

The owner requested compatibility with published changes, repairs to confirmed
CI defects, independent review and fresh browser/integration checks. This
continuation includes no paid model calls, real learner configuration, account
mutation or provider activation. Branch integration/publication is separate
from production release. Exact published head and CI results are recorded in
the PR; this report does not turn pending checks into passes.

## Integration and preserved behavior

Current main contains published PRs379,376,368,378,380,382,377. Their commit
identities are recorded by Git history; their presence does not stand in for
new release permission or independent validation of unrelated functionality.
An ordinary integration commit retains both parents and all current-main
changes. A read-only merge first found one conflict, in PROJECT_STATUS.md;
the complete current status was kept and assistant records appended.

PR380's saved-task helper stylesheet and source-help behavior are preserved.
The assistant.css delta from current main is only four follow-up-control rules.
No root hosting configuration, model keys, learner settings or data migration
is changed. Existing helper and cabinet catalog versions still must match;
deploy/revert their source together. The exact-match handshake fails closed.

## What context actually means

| Path | Trusted task source | Dialogue behavior |
| --- | --- | --- |
| Saved Vilenkin textbook work | PR380 server source revision, task and saved step | Existing source hints; free model dialogue is not attached automatically |
| Embedded Peterson course | Existing local course task and step | Existing local source helper |
| Supported fixed Atanasyan adapter | Owned server taskSpec.prompt | Root condition overrides browser wording; follow-ups bind to this task |
| General Vilenkin NOD/NOK and decimal profile | Explicitly entered condition | Follow-ups retain that condition and earlier bounded explanations |

The generic attached-work caption now explicitly asks for the condition.
An attempt ID alone does not prove that manually entered wording matches the
open exercise. A universal automatic task/step dialogue adapter is not claimed.
Source-only help remains usable without an external model; free follow-ups
remain unavailable until separately enabled and acknowledged.

## Confirmed defects and repairs

### Pending answer after teacher control

Independent internal review reproduced an actual authenticated race using the
ordinary teacher control action: a pending structured-task follow-up returned
HTTP200, an answer and a continuation after teacher control was taken.

The server's structured context now checks the current controller both before
request reservation and again after the service reply. The UI independently
rechecks canAsk before rendering or anchoring a response. Failed in-flight
requests retain their allowance; read-only requests cannot reach the bridge.
Permanent API, DOM and two-service browser regressions verify this behavior.
The independent reproduction now returns HTTP409 with no answer or anchor.

### Atanasyan/Ichenskaya source provenance

The full canonical course advanced to 1,247 cards while the bounded 255-card
route still sealed the older full-course SHA. All selected lesson records,
catalogue entries and catalogue metadata were independently compared and are
unchanged. Only provenance was refreshed:

- Canonical source SHA256:
  `af1e3a373745d3a66e3e6f71b14d02de4cd81f0c688a8929c0475277cc22b574`.
- Bounded course SHA256:
  `0a55791957f465cf6f9c3736fe41ca8a4fb110601bbcf9c4e9843e38a3f5a0fe`.
- Assistant projection SHA256:
  `755cd5c4593594f296cb1a7e03af5ad29ba5413104561522901918f31c418013`.

An independent structural diff proves the bounded course differs only at
source.sha256; its teaching projection differs only at courseSha256 and
sourceSha256. The original selection digest and historical exact-byte content
oracle are unchanged. Exact whole-file dependent pins were updated to the
audited result. No mathematical check or source comparison was removed.

### Merzlyak

The old retained-engine failure is already repaired by published PR376,
commit `51f7fa5`. Its original archived-parent assertion and separate migration
validation are retained; no new Merzlyak code/test change was necessary.

### Unified cabinet browser privacy assertion

The previously pending old-head workflow also failed, at free-route browser
line240. That assertion searched every serialized operation row for the
four-digit synthetic PIN. Valid random UUIDs and SHA256 fingerprints can
contain those four digits without storing a credential. The unchanged current
test passed on repetition, and a deterministic UUID/hash collision reproduces
the old assertion failure.

The repaired guard validates the opaque metadata formats, still scans all
non-identity payload strings and rejects credential-bearing field names.
Positive controls must detect injected nested plaintext and credential fields,
as well as malformed IDs/hashes. A before/after full operation-table snapshot
also proves actual synthetic credential issuance cannot create or modify a
receipt. This repairs a test false positive, not a demonstrated production
secret leak. Existing browser storage, session and DOM privacy checks remain.

## Fresh local validation

All accounts and databases used below are synthetic. No production API or
paid model endpoint was invoked.

| Check | Result |
| --- | --- |
| Full assistant service tests | 131/131 passed |
| Full board/cabinet backend tests after control fix | 369/369 passed |
| Assistant dialogue, context labels, local-task and Peterson DOM tests | 34/34 passed |
| Cabinet desktop/mobile browser checks | 19/19 passed |
| Existing two-service offline E2E | 8 scenarios, 15 completed requests, zero provider calls |
| Saved Vilenkin source helper browser compatibility | 7/7 passed |
| New browser → cabinet → helper dialogue E2E | 5/5 groups passed; 4 in-process mocked provider calls, zero external network |
| Unified free-route browser with receipt privacy controls | Passed |
| Atanasyan bounded source and full textbook builders | Passed; 255 selected /1,247 full cards |
| Ichenskaya source builder and mathematical audit | Passed; 110 cards, 332 mathematical checks |
| Combined Atanasyan/Ichenskaya source/runtime checks | 24/24 passed |
| Helper course-context suite | 6/6 passed |
| Both helper knowledge projection builders | Passed |
| Merzlyak retained-engine and independent wrapper | Passed; 989 available records |

Initial local attempts failed because sparse checkout omitted required course
modules; they are recorded as environment failures and were rerun after the
actual source files were restored. The first Chromium CDN download was
truncated; the installer's official alternate mirror succeeded. No TLS or
product check was disabled. Fresh GitHub container and broad integration gates
remain separate exact-head evidence and are reported in the PR.

## Independent review

A separate internal reviewer inspected dialogue binding, session/settings and
task isolation, privacy validation, quotas/replay, fixed lifetime, cache caps,
source-only exclusions, rollback, the provenance repair and corrective diffs.
The control race and an incorrect topic-selection branch in the new mocked
E2E fixture were fixed and independently rechecked. The test now asserts the
appropriate NOD explanation rather than accepting unrelated geometry wording.
No unresolved internal finding remains in the reviewed runtime scope.

Reviewed runtime SHA256:
- board-server/learning-assistant.js:
  `840ee59594b583a3742e69678aee7d44dfb4105455aee0e7f9cf3d3ed730605e`.
- learning/assistant.js:
  `666edb090702f3f8abfcf4f9d892b868a19f473bc5eb4035bd480a60338d7990`.
- tools/learning-assistant-dialogue.e2e.cjs:
  `4994288165f56edc5d1894c57c47016bef86a17f47a6d879e2cdbeedd89b7dbf`.
- tools/learning-free-route.browser.cjs:
  `82ec2b2b91a32334ca33d9bf52521bb70808d7ee586fe077b78a99650f5104ca`.

Final independent test review also caught and corrected missing receipt checks
for a PIN in an object key or numeric primitive. Both now have positive leak
fixtures; only validated opaque metadata is exempted. Final internal verdict
is PASS, with no unresolved finding. Reviewer findings and validation are not
represented as an external provider review.

This is internal independent review, **not an external HIGH provider verdict**.
No suitable external review tool was exposed. The owner prohibited enabling
paid model calls without separate agreement; no paid review was attempted.
The HIGH policy requires external exact-head review or an explicit owner waiver
with rationale. Prior releases' exceptions are not reused.

## Remaining gates and rollback

- Complete current exact-head GitHub checks, including actual container gates.
- Obtain external HIGH review, or an explicit task-specific owner exception.
- Verify current base/head and applicable release permission immediately before
  merge; production rollout/byte checks are not claimed here.
- Live model quality, latency, age/geography/data eligibility and budgeted
  evaluation remain prerequisites before separately authorizing pupil inference.

Model output is untrusted and marked unverified. Prompt constraints and output
shape checks do not prove every live explanation is pedagogically correct or
free of indirect answer disclosure. Deterministic NOD/NOK hints are tested for
partial steps; full solutions remain an explicit action. No live model-quality
claim is made from a mocked transport test.

Rollback: disable the helper or normally revert this scoped patch, restoring
both profile catalog sides together. Preserve cabinet and helper ledgers,
saved work and ordinary source-help history. Dialogue is process-local and
expires within the original 15-minute lifetime; it has no database migration,
training export or persistent transcript to roll back.
