# Atanasyan IX: verify fresh HTTPS response bodies

## Identity and scope

- Owner request: continue the Atanasyan course entirely in the cloud, 2026-11-03.
- Release follow-up to PR425; review level: SMALL, isolated test-harness correction.
- Base: main, `849ad1b95a8a5bea9527eec60341c93b86a7d688`.
- Branch: `fix/atanasyan-ix-https-cache-20261103`.
- Authorization: [standing owner policy](../OWNER_RELEASE_AUTHORIZATION.md).
- Only the HTTPS smoke, this task and the corresponding status note may change.
  Course content, runtime, publication receipts, gates, CI triggers and pupil
  work identities remain byte-identical to the published, reviewed release.

## Observed problem and intended result

PR425 is merged and Pages41616529373 deployed its exact commit. HTTPS smoke
41616530417 reached all14 journey records and verified all7 published resource
hashes and6 browser-loaded asset hashes, but correctly retained a failed result:
48 repeated asset responses were HTTP304, while the harness requires HTTP200.
It did not declare completed=true or httpsReleaseVerified=true.

Enable transparent browser-context routing before navigation. Playwright
documents that routing disables the HTTP cache. Every request still continues
to the real HTTPS endpoint; strict HTTP200, origin, exact-body SHA256, ordinary
TLS verification and all learner-work assertions remain unchanged.
[Official API documentation](https://playwright.dev/docs/api/class-browsercontext#browser-context-route).
This tests fresh delivery; it does not claim a separate warm-cache validation.

## Acceptance, review and checks

- Self-review and independent focused review of the two-line harness delta.
- `node --check tools/geometry-textbook/chapter09-live.browser.cjs` and
  `git diff --check` on the actual candidate.
- Exact tree comparison proves every course/runtime/full-course-gate input
  unchanged from849ad1b and the successful d7 content candidate.
- Affected cloud PR public-entry smoke must pass on the new head. Fresh refs,
  controlled squash merge and exact parent/tree/delta verification follow.
- After Pages deploys the actual merge, real HTTPS smoke must report complete,
  no errors,1407 reviewed cards,160 IX cards, exact source and browser asset
  hashes, direct entries and retained drafts/steps/theory return at320/1280px.
- Reuse full product/source/visual evidence from run41608792493 only for the
  unchanged inputs. Broad full-course CI may run automatically because of the
  existing tools path filter; record its actual status without relabelling a
  pending run as passed. Do not change or cancel gates to obtain approval.
- Preserve the original HTTPS failure and the corrected run as separate facts.

No trainer design, mathematical or product behavior change is introduced.
External review is not requested and is not claimed. Risk: the verifier could
mask a network problem; transparent continuation and unchanged body/status
assertions prevent that. Rollback is an ordinary revert of this scoped patch;
no learner data or course records are modified. No new owner decision is needed.
The PR records actual head, applicable checks, merge, deployment and final gate
`ATANASYAN_IX_HTTPS_RELEASE_OK`; this specification does not pre-approve a run.
