# EGE_BAZA_COURSE_02_BLUEPRINT

## Identity

- Date: 2026-10-01
- Owner: repository owner
- Base branch: `course/ege-baza-foundation-module-1` (related Draft PR #147)
- Base SHA: `a3bffe0d7962d1da9751f37f40c0df2abaf5a45b`
- Production main observed: `010e89c75c0fe110b57c983c728b8216fb38cd9d`
- Branch: `course/ege-baza-product-blueprint`
- Review level: `SMALL`; documentation only, no runtime/contract/hosting change.
- Related ADR: none accepted by this document. Future runtime work must be
  classified separately; this level does not lower the first module's HIGH review.

## Goal and owner scope

The owner requested continued stepwise work, study of the РеРеп archive,
planning the complete course and its placement on the website, with publication
only when the whole course is ready. Follow-up clarification: focus the website's
first page on base-EGE preparation for a time. Other sections remain available.
These current user instructions authorize this planning task and Draft PR,
not merge/deployment or a claim that proposed product details were approved.

## Evidence

- Related first-module Draft PR #147, six skills and 60 tasks, not deployed.
- Existing base trainer, site root, OGE/profile registries and progress code;
  implemented board-server `/api/progress/` routes.
- Provided РеРеп notes: mini-groups, flipped classroom, teaching fundamentals,
  gamification, teenagers and first-week actions. Only original project analysis
  is committed; source files and private archives remain outside the repository.
- FIPI 2027 project page and base-level specification, checked 2026-10-01.

## Scope

In scope: product/learning/release plan; homepage brief; planned route structure;
teacher workflow; existing/proposed distinction; next bounded task; status update.

Out of scope: modifying index.html or module runtime; merging PR #147; deployment;
new accounts or payment flow; archive publication; final pricing/schedule;
claiming accepted ADR or independent review.

## Acceptance and checks

- [x] Whole-course publication and first-page-only emphasis recorded.
- [x] All 21 positions allocated across modules, with separate subtype audit pending.
- [x] Student and teacher workflows, progress and repeat behavior specified.
- [x] Real current functions separated from proposals and release criteria.
- [x] First module's pending browser/HIGH gates preserved.
- [x] Next task bounded; no runtime/public homepage changes.
- [x] Document links, changed-file allowlist and `git diff --check` verified.

Gate: `EGE_BAZA_BLUEPRINT_DOCS_OK` after these checks. Runtime/browser tests
are not rerun for this documentation-only delta. The existing browser blocker
remains unresolved; this task does not provide a browser PASS.

## Review, risk and rollback

Focused author review; external review optional for this SMALL docs-only delta.
Risk: mistaking a proposal for an implemented or approved contract. Mitigation:
explicit statuses and a separate definition of readiness. Rollback: revert this
documentation commit. It changes no saved learner data or public UI.

## Permissions and handoff

START: owner asked «продолжай» and requested this plan in the active conversation.
Branch/commit/push/Draft PR allowed. Merge, auto-merge and deployment not allowed.
Final PR contains exact base/head, checks and the standard EXECUTIVE STATUS.
