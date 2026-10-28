# MathExam assistant prototype — verification record

Date: 2026-10-27 (Asia/Novosibirsk). Task:
[MATHEXAM_ASSISTANT_V1](../tasks/MATHEXAM_ASSISTANT_V1.md).
Base: `92d733a49692744ce043503c57f29b77bfb09a24`.
Review level: `NEW_ARCHETYPE`. [ADR 0011](../adr/0011-independent-assistant.md)
remains Proposed. Exact publication head and remote CI results belong in the
single Draft PR; this record does not predict a deployment or external verdict.

## Executed locally

| Check | Result | Evidence and bounds |
| --- | --- | --- |
| `npm --prefix assistant-service test` | 53/53 groups passed | Actual Node 24.22.1, real local HTTP and SQLite, injected provider responses only |
| Mathematical reference cases | Passed | 36 fixed cases; 2,430 signed equations, 800 fraction combinations, 3,200 NOD/NOK results against independent arithmetic/brute-force references; signed decimal rounding and zero boundaries |
| Private API/security | Passed | Exact Origin/Host, CSRF, session ownership/expiry, safe text, no cabinet access, bounded request/response and rejected personal-data patterns |
| Financial controls | Passed with simulated provider | Atomic reservations, two database connections, restart, calendar boundaries, deduplication, no retries, timeout, retained failed-call reserve and durable circuit breaker |
| Knowledge lifecycle | Passed | Pending isolated; explicit approval/version history; new approved cards precede builtins; backups/restoration |
| Actual browser | 4/4 groups passed | Chromium 140; 3 local mock-contract flows plus actual offline server on desktop 1280×920 and mobile 390×844 |
| Browser presentation | Passed | Screenshots inspected; no horizontal overflow; earlier hints survive an entered attempt; explicit full answer, simpler hint, deletion and safe error messages |
| Browser privacy | Passed | No local/session storage, HttpOnly cookie, no third-party requests; unsafe markup rendered as text |
| Syntax, workflow structure, whitespace | Passed | JavaScript syntax checks, read-only-permission test workflow, `git diff --check` |

The initial sandbox denied loopback listening; the authorized local test retry
ran successfully. The original test client attempted to override Fetch's Host;
it was corrected to raw local HTTP to exercise the existing Host restriction.
Neither the restriction nor assertions were weakened. The browser download's
primary mirror returned an invalid archive; the official alternate mirror
successfully supplied the pinned test browser.

The first GitHub Actions attempt passed all 53 service groups and the independent
public SEO gate, then stopped before browser tests: `ubuntu-latest` had advanced
to Ubuntu 26.04, which the pinned Playwright 1.55 does not support. The workflow
now explicitly selects supported Ubuntu 24.04. No test or assertion was removed;
the final exact-head browser/container result is recorded in the Draft PR.

The offline service's observed resident memory after the browser flow was about
44 MiB in this development environment. This is an idle observation, **not** a
production load, Amvera measurement, reserved-container requirement or LLM RAM
measurement. A modest gateway tariff remains an estimate pending deployment QA.

## Independent internal reviews

Separate agents reviewed the runtime/security and mathematical/pedagogical
modules. This is same-team independent work, not an external provider's release
verdict. The following concrete findings were corrected and regression checked:

1. Backup output was briefly created with `0644`; it is now exclusively created
   at `0600` before SQLite copies any bytes. An 8 MiB synthetic backup was also
   independently observed before/during/after copying.
2. A feedback body could cross session expiry after request authentication;
   expiry is now checked again inside the write transaction. The delayed-body
   reproduction now returns 401 without mutation.
3. A multiplication marker with no coefficient (`*x`, `-*x`) was accepted;
   malformed equations now require clarification while normal `x`/`3*x` remain.
4. Zero-coefficient/number-theory feedback did not simplify hints; dedicated
   shorter hints now cover all five levels.
5. Entering an attempt reset the UI's existing hints; task identity now retains
   the same condition while allowing new attempts and separate consent.
6. New approved card IDs were behind builtins; reviewed revisions now lead the
   bounded three-card topic retrieval. Pending content remains excluded.
7. A structured model response could contain several steps or an obvious final
   answer while labelled a hint. Multiple-step/explicit-answer responses are
   rejected; semantic over-answering remains a live-model evaluation risk.

No remaining HIGH/MEDIUM blocker was found in the reviewed private offline core.
This statement does not approve production, real-student use or paid inference.

## Reviewable screens

- [Desktop](assets/mathexam-assistant/desktop.png)
- [Mobile](assets/mathexam-assistant/mobile.png)

Both screens use a synthetic equation; no learner identity, key or account data
was captured. The screenshots are source-review artifacts, not a public pilot.

## Container and release gates

The local environment has no Docker CLI/daemon. The new
[assistant workflow](../../.github/workflows/math-assistant.yml) builds the
actual Node 24.21.0 Alpine image and checks UID 1000, private access, exact math,
backup, persistence after restart, deletion and zero API calls. Its exact-head
result must be read from the Draft PR; local Node tests alone do not establish
that the container passed.

Not performed in this task:

- Any real paid model call, account balance change, server creation, model
  download for inference, GPU rental, deployment or merge.
- Provider token-limit/thinking/billing contract verification, Russian
  explanation quality on a live model, sustained load or a real-pupil pilot.
- Confirmation of actual Amvera account CPU/RAM/GPU, ingress plan, region,
  Qwen package pricing, data-processing terms or the writable mounted volume.
- External release review and owner acceptance of the proposed architecture.

The application caps are conditional on the configured prices and the provider
honouring its contract. A circuit breaker cannot undo an already billed request
if the provider violates that contract. Price acknowledgement expires after seven
days; provider-side caps and a separately approved small balance remain part of
the future paid-pilot decision.

## Production status reconciliation (read only)

PR [#357](https://github.com/ladynata-cloud/math-exam-fipi/pull/357) is merged as
the task base. These public files returned HTTP 200 and matched that base exactly:

| File | SHA-256 |
| --- | --- |
| `index.html` | `8a58acd17e75e86f190205a2ff8da5b158e2449cdbbbb312e3c8bd2fc4437d45` |
| `sitemap.xml` | `4ce7b08cd9178dea6d7a2a2ffcc6d636d5cfe2f8a892bfaaf4a000d7403218cd` |
| `robots.txt` | `84a1b2da3e72a2331bee1f7d155bb6723a43624f68ef80d834ab3ebc4ca22660` |

The status document's preceding SEO section was reconciled within this task.
No unrelated open PR was modified or incorporated. No claim about search-engine
indexing follows from matching published bytes.

## Handoff

Recommend reviewing the private offline prototype and proposed architecture.
Before any paid pilot, verify account/provider terms, accept a precise budget and
complete required release review. Merge and hosting activation each remain
separate owner decisions. Do not connect a branch that deploys automatically.
