# Prepare a permanent cabinet hostname

## Identity

- Task: `CABINET_OWN_DOMAIN_20261012`
- Owner: repository owner
- Date: 2026-10-12 (Asia/Novosibirsk)
- Base branch: `main`
- Base SHA: `6d3eb6391ece697d5b5217817dbdbc2653090da4`
- Branch: `fix/cabinet-domain-20261012`
- Review level: `HIGH` (trusted parent origin and account entry routing)
- Architecture: [ADR 0010](../adr/0010-unified-learning.md), `Accepted`

## Goal and current evidence

The owner requested restoring usable cabinets for the following day. Prepare
the existing application for the candidate origin `https://cabinet.mathexam.space`
so its public address can remain stable after a hosting change.

The public website remains available, while current cloud-browser checks of
the Amvera cabinet and its control panel returned HTTP 502. A new server and
DNS access have not been obtained. The candidate hostname is not an operating
service. This patch is preparation only and must remain an unpublished draft.

The existing server accepts an explicit `LEARNING_PUBLIC_ORIGIN` and keeps
account cookies/API separate from public trainer frames. The child bridge,
however, currently trusts only the Amvera origin and localhost. Executing the
unchanged bridge with the candidate HTTPS origin reproduces `enabled: false`.
Existing localhost browser checks cannot detect that production-origin failure.

## Approved scope

- Retarget only account `/learning/` entries in fifteen public source files.
- Add the exact candidate HTTPS origin to the bridge allowlist, preserving
  the existing Amvera origin and local development rules.
- Refresh changed public script URLs, including both trainer bridge loaders,
  to avoid cached links or an old origin allowlist during an eventual release.
- Execute the real bridge against production-origin fixtures and reject
  arbitrary hosts, suffix attacks, wrong sources, channels and instances.
- Update the affected navigation expectations and run the new gate in the
  existing learning workflow. Reconcile project status without claiming launch.

Out of scope: authentication, roles, database schema/data, account creation,
curriculum, anonymous board/progress endpoints, video-worker, server purchases,
DNS changes, merge and deployment. No local-storage replacement for cabinets.
Keep the independent Amvera video application and its stored media unchanged.

## Acceptance and release block

- Both exact trusted HTTPS origins can complete bridge hydration; other
  parent origins and invalid message envelopes remain rejected.
- Public account entries target the candidate hostname; paths and fragments
  are retained. Anonymous board/progress and video endpoints do not change.
- No secrets or actual pupil identifiers occur in source or test fixtures.
- Preparation gate: `LEARNING_CABINET_ORIGIN_OK`; this is not a live gate.
- **Do not merge or publish these links until all of the following are verified
  on the selected server:** authoritative DNS, valid HTTPS, durable healthy
  `/api/learning/status`, exact configured account Origin, teacher/pupil/parent
  entry and role isolation, a saved attempt visible after reload and process
  restart, and independent backup/restore. A HTTP 200 login page is insufficient.

## Mandatory release order

This combined preparation draft is **not ready for a direct merge**. Live
trainer checks on the candidate cabinet depend on the bridge served by the
public website, so the final release must be separated into two reviewed steps:

1. Publish only the compatible old-plus-new bridge and its cache-versioned
   loaders. Keep all public cabinet links on their existing destination.
2. Verify the new server, exact `LEARNING_PUBLIC_ORIGIN`, DNS/TLS and all live
   role/trainer/persistence/backup checks above. Only then publish the public
   link changes and verify entry from the live website.

Do not treat this ordering as authorization to publish either step now. This
draft retains both parts for review; release preparation must separate them
without adding runtime fallback storage or bypassing account checks.

## Checks and review

Run the production-origin gate, affected public navigation/catalog gates,
focused foundations and course-video entry browser checks when tools are
available, JavaScript syntax and `git diff --check`. Broad mathematics and
backend suites need not run locally for this URL/allowlist-only patch; the
existing cloud workflow retains its complete assertions.

HIGH independent review is required. External review remains pending under
the repository policy; no earlier waiver or task text is treated as a current
review verdict. Record provider, PR, base/head, verdict and timestamp if used.
All review handoffs contain public source and synthetic test data only.

## Risk, rollback and permissions

Publishing before the target service is ready would replace current links
with another unavailable destination. Keep this draft blocked by the explicit
live checks above. A mistaken wildcard would expand frame trust; tests execute
the real allowlist and message boundary instead of copying it.

Before launch, rollback is withdrawal of this unpublished patch. After a
separately authorized launch, revert the public routing only to a verified
working server; never remove the current trusted origin while active cabinets
still use it. Preserve the database and independent video application throughout.

The current request authorizes scoped preparation, validation and a Draft PR.
Root handles review and commit. This delegated task performs no commit, push,
merge, DNS edit or release. Purchasing and provisioning remain separate steps.

## Execution record

- PASS `LEARNING_CABINET_ORIGIN_OK`: real bridge ready/hydrate/applied/change
  for both exact HTTPS origins, rejected spoofed origin/source/channel/instance,
  and all fifteen public entry source files.
- PASS `LEARNING_CATALOG_REFERENCE_CONTENT_OK` and
  `EGE_BAZA_NAVIGATOR_OK` (269 registry/state/DOM checks).
- PASS syntax checks of all fourteen changed/new JavaScript files and
  `git diff --check`.
- INHERITED FAILURE: `tools/oge-focus-navigation.test.cjs` stops at its
  unchanged primary-route assertion for `/trainers/oge-basics/`. Executing the
  exact base gate against base file contents reproduces that same assertion.
  No unrelated navigation assertion was changed to hide this baseline failure.
- Foundations and course-video browser gates were not run: Playwright is
  installed but its Chromium executable is absent in this environment. Their
  origin expectations were updated without weakening the remaining assertions.
- Independent HIGH source review found no P1/P2; its release-order observation
  is recorded above. Final review provenance belongs in the Draft PR handoff.
- No commit, publication, live account operation or deployment was performed.
  Real DNS, TLS, production roles, persistence and external review remain pending.
