# Individual board: visible disconnect and recovery (2026-11-25)

- Task: BOARD_RECONNECT_20261125
- Base: 85a9971123fc752390c63f9a59e4bcd1be40378e
- Branch: fix/individual-board-reconnect-20261125
- Review level: HIGH (shared room state, reconnection, local data).
- START: owner explicitly requested this task.
- Release: [standing owner authorization](../OWNER_RELEASE_AUTHORIZATION.md), after required checks.

## Evidence and scope

Teacher reported pupil saw old records. Open teacher tab showed invalid session, local board and disabled synchronization. The server's room lifetime/storage is unchanged. Existing client allowed teacher to write during a temporary transport outage and could replace optimistic local records on rejoin. This task targets only the individual board: truthful room status, writer lock before room acceptance, safe retry, local teacher recovery copies and explicit new-room flow. No changes to trainer banks, server auth, group board, TTL, API usage or student accounts.

## Acceptance

- During known-room loss, both roles are read-only until authenticated room state; the transport handshake alone is not enough. If only the pupil disconnects, the connected teacher sees a distinct offline-pupil notice and may keep writing to the server. Late drawing/control/participant events cannot mutate a disconnected board.
- Permanent rejection keeps teacher local records usable and visibly identifies the need for a new invitation.
- The authoritative room snapshot wins; unconfirmed teacher objects/pages are retained as separate browser-tab recovery copies, never silently replayed.
- Teacher can download or explicitly open a recovery copy locally; the previous local view is separately protected when opening an older copy. Storage failures are visible. Credentials are excluded from recovery snapshots. No server-side persistence or guarantee for unsent student changes.
- Two-client regression covers disconnection, blocked writes, restoration and subsequent delivery; existing terminal/bridge tests remain required.

## Checks / rollback

Run `tools/board-room-error.test.cjs`, `tools/board-writing.browser.cjs`, picker/registry and all applicable CI; verify exact head, independent technical review and production before merge/release. External provider audit not requested. Local container cannot resolve GitHub, so complete local execution is unavailable; use CI. Roll back by reverting this scoped client/test commit; no server data migration.

## Execution
Draft until required gates and independent technical review complete.
## Follow-up: initial trainer-state race (2026-11-25)

Fleet audit #755 run 45480897299: 60/74 passed, 14 observed real SDK state with no accepted host trainer state. Code review identified a possible shared initialization race: an explicit empty authoritative room snapshot may overwrite the initial SDK publication. Request the actual live adapter state again only for the current authorized writer and the same hydrated bridge when the authoritative initialized room explicitly has no trainer state. Never reuse a cached state, bypass permissions, or rehydrate the frame. Added deterministic late-empty, read-only and nonempty-authority regression cases. Existing reconnect checks remain in force. Main advanced through verified #752; merged its picker cache version without changing its trainer, catalog or SEO files. Full candidate CI and fleet evidence still required.
