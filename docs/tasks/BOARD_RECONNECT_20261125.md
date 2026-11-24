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

- During known-room loss, both roles are read-only until authenticated room state; the transport handshake alone is not enough.
- Permanent rejection keeps teacher local records usable and visibly identifies the need for a new invitation.
- The authoritative room snapshot wins; unconfirmed teacher objects/pages are retained as separate browser-tab recovery copies, never silently replayed.
- Teacher can download or explicitly open a recovery copy locally. Storage failures are visible. Credentials are excluded from recovery snapshots. No server-side persistence or guarantee for unsent student changes.
- Two-client regression covers disconnection, blocked writes, restoration and subsequent delivery; existing terminal/bridge tests remain required.

## Checks / rollback

Run `tools/board-room-error.test.cjs`, `tools/board-writing.browser.cjs`, picker/registry and all applicable CI; verify exact head, independent technical review and production before merge/release. External provider audit not requested. Local container cannot resolve GitHub, so complete local execution is unavailable; use CI. Roll back by reverting this scoped client/test commit; no server data migration.

## Execution
Draft until required gates and independent technical review complete.