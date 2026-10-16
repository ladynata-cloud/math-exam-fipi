# Serve the inline assignment geometry renderer

## Identity and goal

- Owner request: finish the large interactive drawing directly in assignments.
- Date: 2026-10-17 (Asia/Novosibirsk).
- Base: `main` at `c102cee9b7c98c74c30384bfce0ccdd1568b25c2` (PR 251).
- Branch: `fix/assignment-geometry-asset`.
- Review: **MEDIUM**, focused review of one existing static-resource allowlist
  entry. No API, authentication, authorization, storage or deployment contract
  changes; retain all existing response headers and the exact-path allowlist.

## Evidence and scope

PR 251 deployed its four learning assets to both public Pages and Amvera, byte
for byte. Amvera health and durable learning storage are available, but the
renderer URL returns HTTP 404: `board-server/index.js` omits
`grade7-geometry-core-models.js` from its explicit static-file list. The existing
UI fallback keeps assignments usable but hides the requested inline drawing.

Add only that existing public renderer to the list. Extend the existing
container-equivalent integration test to fetch every script and stylesheet
referenced by `/learning/`, including version query strings, and compare bytes,
MIME and existing security/cache headers. Assert unrelated paths remain 404.
Do not copy or fork the renderer, widen directory access, alter CSP, change
Dockerfile, pupil data, geometry content, accounts, saved attempts or evaluation.

## Acceptance, tests and review

- Reproduce HTTP 404 on the exact merged baseline using the new regression.
- All referenced cabinet scripts/styles return 200 with exact source bytes.
- Renderer keeps `nosniff`, same-origin policy and the existing cabinet CSP.
- Unlisted path scripts and server source still return 404.
- Run registry/runtime integration tests, geometry model and DOM gates, syntax
  checks and `git diff --check`; cloud learning CI before release.
- Gate: `ASSIGNMENT_GEOMETRY_ASSET_READY` after applicable checks pass.
- Focused self-review; no external review required or claimed for this bounded
  static-asset correction. Use synthetic data only.
- Live inline visual and physical-touch acceptance remain pending until deploy.

## Risk, rollback and permissions

Risk: exposing the wrong file or missing another entry-page dependency. Exact
path, response bytes and negative route checks cover this boundary. Revert the
single allowlist addition to roll back; the existing UI fallback remains, and
no data migration or progress repair is involved.

The current task authorizes necessary correction, tests, local commit, push and
Draft PR. The explicit release authorization already executed applied to PR 251;
this corrective PR requires its own exact-head authorization under AGENTS.md and
mathexam-release. No merge, auto-merge or deployment is performed here.

## Execution

The new runtime-layout regression reproduced the production renderer HTTP 404
on the merged baseline before the allowlist fix. After correction: all seven
registry/runtime integration tests pass, as do 378 saved geometry variants,
1305 equality checks, assignment DOM interactions and saved-state isolation.
Syntax and diff checks pass. Focused review confirms one allowlisted public
script and unchanged existing headers. Exact-head cloud gate recorded in PR;
live visual/touch acceptance and corrective deployment remain pending.
