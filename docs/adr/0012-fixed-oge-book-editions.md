# ADR 0012: fixed OGE book editions

Status: Accepted

Date: 2026-10-31

Owner decision: on 2026-10-31 the owner instructed the executing agent to
complete every remaining item in the PR 387 handoff except external review
(“сделай всё кроме внешнего ревью”). This accepts the fixed-edition decision
below for this task and authorizes the historical-contract and diagnostic-year
repairs described in the task continuation. It does not authorize merge or
deployment. A separate exact-base/head release authorization and production
verification remain required. Acceptance does not certify learner scenarios
or publication of the new addresses.

## Context

Printed QR codes outlive ordinary trainer updates. The OGE book contains 71
unique destinations and 34 placed QR codes. Existing public URLs must keep
working, while the edition used by the book must retain its teaching content,
runtime, styles and local data. A successful HTTP response is insufficient.

## Decision

An edition has a permanent namespace, initially
`/book/oge/2026-10-31/v1/`, containing static copies with the original relative
path structure. The 71 short entries `/b/oge26-1/01/` through `/71/` are also
permanent. Their immutable redirects preserve query strings and fragments and
point only at this edition. The URL mapping is machine readable.

The build enumerates the source closure, including the actual task-13 redirect
target and dynamically selected local reference images. Every runtime, style,
image and instructional data dependency is copied inside the edition and
recorded with SHA-256. A source hash records where the copied content came from;
it does not establish correctness. Shared mutable assets and unpinned remote
runtime services are excluded. Published instructional citations may lead
outside the edition, with a visible “вне книги” marker.

The transformation is mechanical: preserve the existing exercise engines and
pedagogy, rewrite included paths, remove optional cloud/board, analytics and
download integrations, and keep the standalone contextual-help loader. Remote
fonts use the original system fallbacks. A fixed startup boundary gives each
edition separate localStorage and sessionStorage namespaces. It does not copy,
clear or migrate public-trainer results. Namespaced multi-tab events preserve
existing concurrent-work warnings. These are browser-local results, not cloud
cabinet records.

One required exception is the roads-grid trainer's use of the shared state
validator. Its copied bridge retains that validator and its existing inert
handle, while registration is always inert even inside an iframe. Removing the
whole module would break independent practice; no board connection is claimed.

The package carries an index manifest and exact file hashes. Its independent
integrity gate checks those hashes, alias targets, path closure, startup order
and network policy. The append-only gate reads manifests and blob identities
from the PR's base commit. A future change cannot modify, delete or add a file
inside a previously published edition or its alias namespace. A correction
requires a new version path and new aliases. CI runs the previous base verifier
as well as the proposed verifier when a previous verifier exists.

## Release conditions

- The owner accepts this ADR for the reviewed implementation.
- A separate registry identifies which applicable learner scenarios passed,
  failed, were not run, or do not apply; integrity is never called full testing.
- Browser verification exercises packaged entry URLs, dependency requests,
  mobile layout, help, completion and retained local results. Public-trainer
  checks do not silently substitute for package checks.
- The PDF, DOCX and all placed QR codes agree with the exact alias mapping.
- Independent review and the separate merge/deployment decision are recorded
  with exact provenance. External review is omitted only for the PR 387
  continuation under the owner's explicit instruction; no external verdict is
  claimed, and no standing exception is granted for other tasks.
- After publication, verify the deployed bytes and all short redirects before
  distributing the new book.

## Limits and alternatives

GitHub Pages and repository access control are operational dependencies. The
gate detects ordinary changes in reviewed PRs; it cannot cryptographically
prevent an administrator from replacing hosting or disabling checks. Pinning a
commit URL alone would not preserve root-relative dependencies or isolate saved
results. Download ZIPs remain useful but their ordinary public URLs are mutable.
Copying the entire site would freeze much unrelated content and increase the
maintenance/review surface. The bounded closure plus observed browser requests
is therefore accepted for this book.

If a critical security or factual issue requires withdrawal, the owner makes
an explicit operational decision. Record the reason and preserve the original
source/evidence; do not silently revise teaching content at the printed URL.
Publication is not implied by ADR acceptance. The external-review exception
above is limited to the owner's current PR 387 instruction.
