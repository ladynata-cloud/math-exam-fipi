# Открытие тренажёров в цифровой доске

- Base: `a325f74909fd3ba322089702a8954bcfd300e5cb`.
- Branch: `release/board-ease-20261002`.
- Review level: MEDIUM; bounded frontend work reusing the existing board bridge.
- Authorization: current owner request delegated to this executor; local implementation and commit. Integration and publication belong to the coordinating executor.

Goal: choose an existing trainer by topic, section or recent history, with EGE basic first, without copying its URL. Keep enough iframe space on a 360px screen, allow expansion, and show useful loading/error recovery.

Scope: `trainer-board.html`, isolated picker JS/CSS/catalog data and focused tests. Support `?trainer=` for teacher entry, ordinary HTTP(S) and same-origin paths; reject script/data/file schemes and recursively opening the board. Catalog metadata never authorizes mirror.

Preserve board storage keys and drawings, room/server/ACL behavior, registry projection and bridge protocol. Do not change backend, board-compat schema or global rules. Do not create production rooms.

Required gates: existing `tools/trainer-registry-client-cutover-smoke.cjs`; focused browser tests for selection, search, recent history, errors, unsafe URLs, expansion, 360px height and drawing persistence; `git diff --check`.

Rollback: revert this scoped frontend commit. The added recent-history key is independent of saved drawings and requires no board data migration. External review is not claimed. No push, PR, merge or deployment is performed by this executor.
