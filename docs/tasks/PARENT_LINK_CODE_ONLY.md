# One permanent parent link and one code field

- Date: 2026-10-10 (Asia/Novosibirsk)
- Base: `92bd34a6163b2115c940a76ba08160cd270dcceb`
- Branch: `fix/parent-link-code-only`
- Review: HIGH independent internal under accepted ADR 0010 and the standing
  owner checked-publication instruction/external-review waiver.

## Goal and evidence

The ready-code endpoint and animated waiting state are already published by
PR #232, but the parent still sees an editable login, role choices, checkbox,
introductory list and instructions. The owner wants one permanent personal link
and a code entered by hand, with no extra concepts to explain.

## Approved scope

- The valid personal parent link opens a compact code-only form: heading,
  **Код** input and **Войти** button. Remove the visible login, role choice,
  show-password checkbox and long onboarding prose from this ordinary route.
- Preserve the existing non-secret personal link across reload and logout.
  Code replacement keeps that same identity/link. Never place a code in a URL.
- Strictly validate link identity. Malformed/removed/changed fragments must
  not silently reuse a previous hint. A link cannot replace an authenticated
  parent, and an in-flight request retains its captured intended identity.
- Teacher-ready cards/messages and parent return UI show link and code without
  a separate login concept. Remove invitation issuance from the standard
  teacher dialog while preserving older issued links and API compatibility.
- Preserve generic manual login fallback, existing long-password acceptance,
  waiting feedback, retry behavior, secret cleanup and family/session isolation.
- Refresh affected asset versions and reconcile prior release evidence.

No server contract, credential validator, database, session lifetime, account
provisioning, actual credential reset, messaging or hosting settings change.
No pupil/course/learning-history changes.

## Acceptance and validation

- A parent opening the personal link has one visible credential field and one
  submit action; ordinary submission asks for no activation or second code.
- Reload and logout preserve that entry path; a wrong code gives a clear error
  and allows retry. Existing PINs, leading zeroes and old passwords still work.
- Invalid links, links opened while authenticated, concurrent login/hashchange
  and cached-page restores cannot expose a different family or reuse secrets.
- Ready messages contain link and code only; issuing a new code retains the
  permanent link. Copy fallback, lost acknowledgement and lifecycle cleanup
  continue to pass. Old invitation activation remains covered through fixtures.
- Focused parent browser gate and relevant role/family/shared credential gates;
  syntax/diff checks, independent HIGH review, required exact-head CI.
- Verify production changed bytes, health and minimal parent UI. QA uses
  synthetic accounts; no real authentication secrets enter Git.

Gate: `PARENT_LINK_CODE_ONLY_OK` after checks and publication verification.
Record exact head/tree, failures, not-run checks and release evidence in the PR.

## Authorization and rollback

The current owner request authorizes this scoped simplification; the existing
checked-publication instruction persists. No repeated permission is needed.
No force, reset/rebase, protection changes or extra external review are used.

Rollback only the affected UI files. Existing permanent links, PIN/legacy
verifier, parent records, credentials and learner history remain compatible.
There is no database or credential rollback. Internal independent review is
not claimed as external-provider approval.
