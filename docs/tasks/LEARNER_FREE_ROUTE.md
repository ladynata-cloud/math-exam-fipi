# Самостоятельный маршрут и сдача письменной работы

## Identity

- Owner: ladynata-cloud
- Date: 2026-10-05 (Asia/Novosibirsk)
- Base: `main`, `4df45e5d3b5825a21451f5cc90838260fb9f6f39`
- Branch: `feature/learner-free-route`
- Review: HIGH — bounded extensions of the existing account/homework contracts.
- Related architecture: ADR 0010 (Accepted). No new authentication provider.

## Goal and current owner instructions

A pupil chooses the order and pace of study, revisits earlier prerequisites,
sees actual progress, submits work with one explicit action, and receives
additional original homework to solve on paper and return as photographs.
The teacher supplies both login and password. A short first-entry interactive
guide uses large readable instructions, optional sound/voice and repeat/skip.
Key pilot topics have small explanatory videos next to the work.

## Scope

- Optional preassigned password when a teacher creates a pupil; retain the
  existing invitation workflow. Hash securely after authorization and CSRF.
  Never store or return the raw password in history, database DTOs or browser
  storage. The teacher's session must remain the teacher's.
- Free-choice route using verified managed catalog items and optional earlier
  foundations. Preserve the original attempt on a detour and provide return.
- Show the authenticated learner their own teacher plan and outcome summaries;
  do not turn one correct answer or watching a video into mastery of a topic.
- Durable explicit submission snapshots, with version/photo provenance and
  separate teacher feedback. A submission does not manufacture a correct answer.
- Original paper sets separate from textbook work: fixed authored mathematical
  families, generated variations, immutable published conditions, private answer
  keys, print/text access, existing protected photo upload and teacher review.
- Introductory sandbox guide and three small public teaching clips. Existing
  clips have text and clicks; natural server narration remains a separate
  activation/verification step. Optional browser narration must have a readable
  fallback and cannot be advertised as a tested particular voice.
- Publish reviewed code and create the requested pupil account only through an
  authorized authenticated teacher/operator session when available.

## Boundaries

- Do not put the pupil's name, login, password, photos or results in public Git.
- Do not bypass the cloud browser's native-credential protection, expose a
  public bootstrap endpoint or put operator secrets in code.
- Do not claim a complete old-Atanasyan/Makarychev course. Existing legacy
  textbook trainers are not silently represented as managed cross-device work.
- Do not send messages to the pupil/parents, auto-grade photographs, synthesize
  unbounded paid media, or modify hosting tariffs.
- Keep existing classroom, reset/archive, exam and account-isolation behavior.

## Acceptance and gates

- [x] Teacher creates an active pupil with supplied credentials; old invitation
  flow still works; duplicate login cannot overwrite access.
- [x] Learner plan is private and read-only; teachers keep write authority.
- [x] Free route and prerequisite return preserve the exact attempt across reload.
- [x] Progress distinguishes independent, assisted, started and sent/reviewed work.
- [x] Submission is authorized, durable and idempotent; no false mastery, no
  archived/draft/active-exam leakage, no stale result called current.
- [x] Authored paper tasks have independently checked mathematics; pupil DTOs
  and printed/text versions contain no answer key.
- [x] Published paper conditions are fixed; photo submission/review/correction
  cycle remains private and survives repeat requests.
- [x] Welcome guide is readable on mobile and keyboard, skippable/repeatable;
  sounds require an intentional action, missing voice never blocks work.
- [x] Full relevant local backend/browser gates, independent local review and
  whitespace/diff checks pass.
- [ ] Exact-head CI and production asset checks pass (release evidence in PR).

Gate: `LEARNER_FREE_ROUTE_GATE_OK` after recorded evidence, not before.

## Permissions and review

The owner explicitly authorized all current work to be published without a
separate external review in this conversation on 2026-10-05, then supplied the
prerequisite, progress, submission, introductory-guide and paper-homework
requirements as steering of the same task. This is the publication authorization
for this scope; no additional routine approval is required. Independent local
security/mathematics/browser review and exact-head checks still apply. There is
no claimed external-provider verdict. Base drift is checked before merging.

## Risks and rollback

Account security, draft leakage, answer-key exposure, duplicate submissions and
mathematical errors are covered by focused tests. Rollback restores prior code
while retaining the database and new additive tables; no destructive schema
rollback or deletion of student work. Persistent `/data` must be preserved.
The unverified production teacher activation and video provider remain explicit
operational blockers, not reasons to weaken access control.

## Execution

Local final gate: `LEARNER_FREE_ROUTE_GATE_OK`.

- Full server suite on Node 24.21.0: 118/118 PASS.
- Paper mathematics: 8,400 generated tasks independently recalculated.
- Real new browser flow passes: ready credentials, own-plan privacy, free topic
  order, two-level foundation return/reload, unchanged exact task/state/id,
  submission without mastery promotion, authored paper conditions/private keys,
  real photo upload, revise/resubmit and rejected stale teacher acceptance.
- Pending trainer actions and selected/unsaved photos block hand-in; no raw
  passwords enter browser storage. Peer photograph access returns 404.
- Welcome guide, skip/repeat/keyboard and three fixed compact MP4 sources pass.
- Existing cabinet (eight pupils), live homework/photos, exam, and mock teaching
  browser checks pass. Legacy invitation is explicitly selected where tested.
- Remediation: all 36 managed and 36 standalone trainers, 224 actions and
  mobile/desktop checks pass. A real adapter regression covers all 36 exact
  server envelopes and rejects tampered identity/content. The discovered server
  metadata mismatch was fixed without relaxing strict task validation.
- Independent local audit's stale-review and premature-hand-in findings were
  reproduced, corrected and rechecked. All reported blockers are closed.
- The final reviewed diff contains only synthetic fixture identities. Media
  files are the unchanged three authored click-only clips from PR #185.

Production account creation, teacher activation, natural server voice and actual
device voice availability have not been verified. The cloud browser is blocked
by native-credential protection; no bypass or guessed account was used.
