# BOARD_PLATFORM_PREFLIGHT_20261125

- Base: `main` / `85a9971123fc752390c63f9a59e4bcd1be40378e`
- Branch: `work/board-platform-preflight-20261125`
- Review: MEDIUM (CI policy; no runtime authorization or storage changes).
- Scope: approved continuation of board reliability/registry engineering. #752 handles fixed-count tests; #753 handles reconnect; #716 is an older overlapping registry draft. This independent guard deliberately avoids editing their files.

## Goal

A new trainer must not break existing board authorization or become undiscoverable. CI compares the exact candidate with its merge parent rather than a hard-coded number of trainers. Existing authorized and catalog-only entries retain their identity and capability fields unless a precise, reviewed transition is recorded. New mirrors must have a picker route normalized by the actual picker. A previously reachable mirror cannot silently disappear from the picker. No new legacy HTML grants.

## Acceptance

- Valid additions and order changes pass without counter updates.
- Missing HTML, invalid manifest, missing picker route, silent capability removal/change, stale/duplicate receipt and unauthorized legacy expansion fail.
- Exact, new, reasoned transition receipts permit intentional compatibility changes except new legacy grants; receipt history is append-only and never grants runtime permissions. Reviewers must examine these changes. A receipt is not an owner's approval or an independent review verdict.
- Use first parent of GitHub's actual merge candidate; no stale hard-coded base in the workflow.
- No changes to student records, rooms, synchronization protocol, API credits, production or branch protection.

## How to use

Run `node --test tools/board-platform-preflight.test.cjs`, then
`node tools/board-platform-preflight.cjs <exact-base-sha>` in a full checkout.
Add normal new trainers only to the manifest and picker as appropriate. An intentional change to an existing ID's file, board compatibility, seed, versions, legacy or progress capabilities (including removal) needs one new row in `tools/fixtures/board-registry-transitions.json` with trainerId, exact before and after projections from capability(), and a meaningful reason. For removal after is null. Keep existing receipts unchanged. Review the migration and tests; new legacy grants require a separately designed policy change.

## Review and rollback

Local pure transition probes and GitHub CI are separate evidence; full Node/VM checkout and actual browser tests are not claimed before execution. No paid external model review requested. Revert this independent PR if necessary; there is no data migration. Publication subject to applicable tests and [standing policy](../OWNER_RELEASE_AUTHORIZATION.md). Owner requested continuing substantial work without further routine questions; no production deployment was performed by this task.
