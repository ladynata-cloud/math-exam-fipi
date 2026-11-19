# Public mirror board: confirmed completed ink

- Owner: Наталья Алябьева
- Date: 2026-11-20, Asia/Novosibirsk
- Base: `main`, `ab6083cdb99f5124c1c4b6930cf19ae4b032d5da`
- Branch: `fix/board-durable-outbox-20261120`
- Review: HIGH (persistence, delivery contract, access boundaries)
- START: owner's direct request «давай ты переделаешь?» after the discussion of
  botiroff's comment under https://habr.com/ru/articles/1109506/.

## Goal and scope

The public Socket.IO mirror board must retain completed ink until the server
confirms durable storage, retry the same operation without duplication, and
recover the room after a process restart. This is the public
`trainers/trainer-board.html` entry linked from the article. Cabinet SQLite and
the REST group board are separate implementations and are unchanged. Held
PRs #526/#679 are not dependencies and are not incorporated.

The baseline public board stores rooms in a Map and sends completed strokes
without acknowledgements. The baseline group board already has durable append
and operation IDs; that is not evidence of durability for the public board.

In scope: explicit server capability, isolated private room snapshots, bounded
idempotent completed-ink protocol, browser outbox, honest ink status, export of
unconfirmed/rejected local work, restart/failure/regression tests. Existing
transient stroke previews and trainer mirroring remain compatible.

Out of scope: new trainers, AI helpers, cabinet/group schemas, unrelated PRs,
automatic messages to the commenter, changing real learner records.

## Acceptance

- [x] Completed stroke/text/image is locally retained before sending; operation
  identity and immutable payload survive reload.
- [x] Positive ACK identifies this operation, room, stable page and page epoch,
  and is sent only after a durable write. Explicit per-operation ACKs avoid
  the lost-sequence-gap problem of a single maximum sequence number.
- [x] Lost ACK/repeated delivery never duplicates or resurrects cleared ink.
- [x] New operations require current writer, control version and page epoch;
  a previously accepted duplicate can be acknowledged after control changes.
- [x] Pending ink stays visible on the matching page. Rejected work remains
  exportable; it is not silently replayed onto another page or participant.
- [x] A storage failure blocks new input and preserves in-memory work. The
  UI never calls an unsupported, unconfirmed or unfinished write saved.
- [x] Two tabs cannot overwrite each other's queue. Browser records and
  exports do not contain room bearer credentials.
- [x] Private room state survives restart, including accepted IDs, page
  history and control identity; stale online socket counts do not survive.

## Verification and review

Required: all board-server tests; board-ink/images/room-error/article-entry
regressions; independent `tools/board-delivery.test.cjs`; existing native
`board-writing` CI; focused independent HIGH review; `git diff --check`.
External provider review is not performed under the standing owner policy.
No real learner data are used in tests. Test records are synthetic.

Gate: `PUBLIC_BOARD_DURABLE_INK_OK` requires completed applicable checks;
local results, CI, and operational rollout are recorded separately.

## Deployment and rollback

Persistence is opt-in via `BOARD_ROOM_STORE_DIR`, a private directory on the
existing persistent volume. Without it the server retains legacy behavior and
explicitly reports `durable:false`; the new client does not claim server
saving. No Docker/Amvera configuration or production data are changed in this
implementation step. A directory is owned by one server process; no replica
sharing is supported. The existing six-hour inactive-room retention policy
remains; this is not an indefinite archive of lessons.

Before enabling on Amvera, verify a private backup and isolated restore of
the shared `/data` volume, deploy the compatible server, enable the new
directory, and verify capabilities plus a synthetic two-window lesson. Do
not infer that enabling an environment variable has happened from this file.

Rollback: retain private snapshots and browser outbox keys. Disable the new
entry only after outstanding writes are reconciled/exported. An older server
must not overwrite the new room store; it cannot restore these rooms. A
frontend rollback cannot be called a durable-room rollback. Preserve a
compatible reader and old room snapshots during recovery.

## Authorization and execution

The direct request authorizes scoped development, commits, push and PR.
[Standing owner policy](../OWNER_RELEASE_AUTHORIZATION.md) applies to release
after the checks and operational prerequisites. A missing backup/restore or
deployment access is a technical blocker, not a request to repeat approval.
No force, rebase, reset, protection bypass or weakened tests are permitted.

Final base/head, PR, independent review and exact checks are recorded in the PR
handoff. No production success is asserted by this specification.

### Local acceptance, 20 November

- 424/424 full board-server tests; 56/56 existing ink/images/room-error/article
  regressions; 24/24 independently authored delivery tests: PASS.
- Independent HIGH technical review: PASS on the final runtime blobs; no
  external-provider review. `git diff --check`: PASS.
- Initial missing JSDOM/stereo fixture failures were environment preparation
  failures and were rerun after installing the pinned test dependency and
  checking out the referenced fixtures. No assertions were removed.
- Native browser/CI and operational release are not covered by these local
  counts. Amvera console was inspected and requires sign-in in this cloud
  session; production backup, restore, environment change and deploy were not
  performed. The task remains a deployment candidate, not a published feature.
