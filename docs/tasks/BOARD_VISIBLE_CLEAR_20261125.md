# BOARD_VISIBLE_CLEAR_20261125

Base: 0bdb4f2031c5c73e10eed8b4eb09dc58e9756036
Branch: fix/board-visible-clear-20261125
Review: SMALL (move existing control, no state/protocol/storage changes).

Owner reported twice during a sixth-grade lesson that clearing all handwritten records is hard to find. Move the existing single #clear control from the settings dialog to the primary writing toolbar, immediately beside the eraser, with an icon, visible Russian label and accessible name. Keep the exact existing clearPage() handler, confirmation, writer authorization, pending-operation and active-pointer checks. It clears every object on the current sheet (including images), not the trainer or any other sheet. The plus button remains the nondestructive way to start a new sheet.

Acceptance: visible control at desktop/mobile widths, single ID, old settings no duplicate, no horizontal overflow, confirmation cancellation preserves records, confirmed local clear preserves previous sheet and trainer, shared clear sends exactly one event and reaches both viewers, read-only pupil cannot clear. Existing browser and picker checks remain intact. No change to the production board or live pupil data during development. Release under [standing owner authorization](../OWNER_RELEASE_AUTHORIZATION.md) only after current candidate CI; revert isolated commit to roll back.

No external review/API calls. Existing high-risk reconnect PR #753 is not included in this branch; its independent technical review and release remain separate. 
