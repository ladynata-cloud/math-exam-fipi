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

Implementation and controlled publication are authorized by the owner request
and `docs/OWNER_RELEASE_AUTHORIZATION.md` (PR408, current main 4410695). External
review is not performed under that standing decision; no repeated release
confirmation is needed. Risk-appropriate technical checks remain required.
Hosting integration still needs provisioned cloud credentials and verified host
identity. The concurrent PR398 changes only unrelated EGE resources, and PR408
updates governance. Their clean virtual composition was verified before ordinary
history-preserving branch synchronization. No other product scope was added.
