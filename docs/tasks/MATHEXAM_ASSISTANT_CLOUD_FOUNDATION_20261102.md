# Cloud assistant release foundation (items 1–5 of 100)

Owner: Natalya. Date: 2026-11-02. Base main:
`8307f6aa20651303f5f94b70ae28503832778af5`.
Branch: `feat/assistant-cloud-foundation-20261102`. Review: HIGH (delivery path).
Accepted architecture: ADR0011. Owner explicitly requested implementation of
all 100 improvements using cloud execution, and reaffirmed the total.

## Scope

Prepare deterministic source-only release packages, fail-closed normal Git
publication and code rollback, isolated preview workflow, source version UI,
and retained browser test evidence. No production secret is available to this
runtime; implementation/test readiness must not be described as active hosting
integration. Preserve existing Amvera root config, persistent /data and secrets.
No credential scraping, browser use, new paid service, force push, ledger reset,
provider enablement, real pupil test, account or permission change.

## Acceptance

Exact source SHA and file manifest; package excludes DB, auth and test artifacts;
normal publication rechecks expected remote; rollback creates a new commit and
retains database state. Metadata is public-source-only, safe text rendering.
Preview runs offline with synthetic data. CI retains screenshots/video/traces.
Test packager/publisher against local temporary bare repositories, failure and
rollback cases, real HTTP/version/UI and existing service/source gates.

## Review and permissions

Implementation, task branches, tests, commits and Draft PR are authorized.
HIGH release needs independent review or a current scoped owner exception;
preceding ten-item waiver is not recorded as a review of this new release path.
Hosting integration requires provisioned cloud credentials and verified host
identity. Prepare reviewable code first; identify exact remaining access/release
requirements without blocking independent program work. Final gate distinguishes
prepared workflow from activated production delivery. Roll back code only.
