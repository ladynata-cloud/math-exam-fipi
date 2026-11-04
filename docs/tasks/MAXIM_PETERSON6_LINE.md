# MathExam task specification: separate grade-six Peterson practice line

## Identity

- Task: `MAXIM_PETERSON6_LINE`
- Owner: repository owner
- Date: 2026-10-27 (UTC)
- Base branch: `main`
- Base SHA: `92d733a49692744ce043503c57f29b77bfb09a24`
- Planned branch: `feat/maxim-peterson6-line`
- Review level: `MEDIUM`
- Related ADR: none; no platform or shared-board architecture change.

## Goal

Make the owner's already approved thirteen-topic practice course available as
the separate "Линейка Максима" page at
`https://mathexam.space/trainers/maxim-peterson6/`, with its existing printed
materials, browser-local progress, teacher report and progress transfer.

## Context and evidence

- The owner approved the course and subsequently explicitly requested its
  placement on the main website as a separate named learning line. The owner
  excluded cabinet assignment.
- The prepared standalone course was already checked for mathematics, retained
  work, assistance accounting, unique-condition progress and JSON transfer.
  The actual browser also verified reload retention and CSV download.
- Remote `main` and the clean local baseline were verified at the SHA above.
  The published `/index.html` returned HTTP 200 and matched that baseline.
- The top status entry still describes the SEO preparation, although the
  baseline is its merged PR #357. This task records that reconciliation without
  rewriting unrelated historical status entries.
- Existing `trainers/motion-grade6/`, `trainers/peterson6.html` and
  `school/peterson6/` are different courses and integrations. They are retained.
- ADR 0001 is Proposed and does not supply architectural approval for this task.

## Approved scope

### In scope

- One new `trainers/maxim-peterson6/` directory: the prepared autonomous HTML
  and four PDF files, with a local `.gitignore` allowlist for those exact
  student handouts because the repository otherwise ignores PDF files.
- Course title, main heading, description and HTTPS self-canonical identifying
  this standalone line. Preserve the prepared learning sequence and checking.
- The original nine topics and four additions: river speed units, river flow
  as a percentage, raft percentage problems and two-pipe joint work.
- Retain textbook examples, generated practice, contextual hints, CSV report,
  strict JSON backup/restore and `mathexam-maxim-peterson6-route-v1` storage.
- Focused regression check and a scoped CI workflow, this specification and
  one status entry.

### Out of scope

- Cabinet accounts, course assignments, cloud learner data, shared board,
  bridge protocols, authentication, analytics or server changes.
- Replacing other courses, registering this personal direct-link line in a
  public catalog, or changing sitemap policy.
- New teaching interactions, a new generator architecture, automatic teacher
  messages or a claim that synthetic checks demonstrate learning gains.

### Files or areas that must not change

Existing course folders, cabinet/learning code, board-server, shared registries,
existing workflows, sitemap, robots rules and repository operating policies.

## Acceptance criteria

- [x] Separate page identifies "Линейка Максима" and retains all thirteen topics.
- [x] All twenty-seven selectable textbook entries/subparts and generated
  analogues remain available.
- [x] Four local PDF links resolve from the nested course folder.
- [x] Five distinct solutions, including three independent solutions, mark
  a topic ready; duplicate conditions cannot inflate the count.
- [x] Assistance from abandoned attempts remains attached to the condition.
- [x] Current work survives serialization/reload; invalid import is rejected.
- [x] CSV report and JSON transfer retain their existing behavior.
- [x] No real learner records, screenshots, secrets or workspace paths enter
  the repository. The requested first-name course branding is intentional.
- [ ] The scoped Draft PR contains only the declared files and passes its
  exact-head checks before an owner release decision.

## Checks and gates

- Required regression: `node tools/maxim-peterson6.test.cjs`.
- Static checks: PDF signatures and relative paths, canonical, dependency
  isolation, sanitized diff and `git diff --check`.
- Existing exact-head CI: `Public SEO and sitemap`, without modifying its gates.
- Scoped exact-head CI: `Maxim Peterson 6 learning line`.
- Final local gate: `MAXIM_PETERSON6_LINE_LOCAL_OK`.
- Existing full-site SEO checks run in CI on the full checkout; local sparse
  preparation does not claim that an incomplete checkout passed those checks.
- Production verification after authorized release: five assets return 200,
  match the reviewed bytes, and the actual course starts on the public origin.

## Review plan

- MEDIUM: an isolated existing static course with recoverable browser-local
  state; no shared runtime, backend or deployment mechanism changes.
- Independent mathematics and progress reviews of the prepared course were
  completed internally. A focused integration review checked route isolation,
  metadata and existing site contracts. These are not external Claude verdicts.
- The trainer consultation workflow has been read. No callable authorized
  Claude/Anthropic integration is available in this session; its design
  consultation and ready-result review are unavailable/not completed. A move
  of already approved code is not recorded as a blanket consultation exemption.
- Continue scoped preparation as the consultation policy permits. Resolve any
  required current-task exception with the owner before release; no previous
  exception or copied approval marker is reused.
- Any external handoff must contain only minimized public code and fictional
  learner examples, without identities, records, secrets or machine paths.

## Risk and rollback

- Browser storage is origin-specific. Existing progress from another origin
  can be transferred with the existing JSON backup, not automatic sync.
- Keep the dedicated key and format unchanged to avoid unrelated progress.
- The page is reachable by its direct URL; it grants no account access.
- Rollback is a separately authorized revert of this scoped addition. Other
  courses and their progress stores are unaffected by removing this directory.

## Permissions

- Scope and execution start: the owner's current direct instruction to place
  the already approved course on the website and deliver it as a separate line.
- Scoped branch, implementation, checks, commit, push and Draft PR preparation:
  covered by that requested work.
- Merge/auto-merge: no exact PR/base/head authorization has been recorded.
- Deployment: requested outcome, but final release must also satisfy the
  repository's separate exact-base/head owner authorization and review policy.

## Execution record

- Actual branch: `feat/maxim-peterson6-line`.
- Actual base SHA: `92d733a49692744ce043503c57f29b77bfb09a24`.
- Local regression: 15 checks passed, 0 failed; 27 selectable textbook entries
  checked against expected answers, and 26 bounded generated examples.
- Local gate: `MAXIM_PETERSON6_LINE_LOCAL_OK`; `git diff --check` passed.
- Actual head and PR: reported by the Draft PR, not fabricated here.
- Passed/failed/not-run checks and remaining decisions: recorded in its body.

## Required handoff

Use `EXECUTIVE STATUS` with Task, PR, Base, Head, Gate, Tests, Failures,
Not run, Scope deviations, Recommendation and Next user decision.
