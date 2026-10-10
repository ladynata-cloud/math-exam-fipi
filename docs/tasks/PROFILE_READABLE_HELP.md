# Readable captions and direct links to worked solutions

## Identity and goal

- Owner: project owner; date: 2026-10-10.
- Base: `main` at `92bd34a6163b2115c940a76ba08160cd270dcceb`.
- Branch: `fix/profile-readable-help`; review: **MEDIUM**.
- Request: enlarge small text throughout the profile course; turn the message
  “Открыт разбор задачи · решение с помощью” into a link to that explanation.
- Existing SPA routes, task models, worked solutions and optional foundation
  detours remain the established implementation. No new architecture or ADR.

## Scope and acceptance

- Main course captions are at least 16 px; primary help captions and controls
  are 18 px. Known caption styles in the 22 linked trainers receive the same
  readable treatment, including position 16 and embedded course pages. Preserve
  mathematical notation; embedding still does not add course navigation.
- Both help-status variants link to their current explanation. Activate by
  mouse or keyboard without changing the hash route, task, draft, accepted
  answers, or already revealed steps. Reopen a collapsed explanation.
- Show a clear “Решение с помощью — по шагам” heading in generic and triangle
  walkthroughs, including examples and results using the shared renderer.
- Preserve one-step disclosure, honest assisted credit and stale-attempt guards.
- Keep SVG coordinate typography separate from HTML captions to avoid moving
  mathematical labels into each other. All task mathematics remains unchanged.
- No cabinet, authentication, backend, real learner record, OGE or base-course
  changes. Existing versions in linked pages change only their shared CSS URL.

## Checks and review

- Targeted browser regression: all 13 positions, all practice modes, rich trig,
  model help, keyboard navigation, collapsed/reopened help, stale attempts,
  normal/calm mode, desktop/mobile, readable captions and retained learner state.
- Existing worked-solution and independent-model unit gates; triangle and
  worked-solution browser regression; unified-course/legacy-page layout audit.
- Required complete Profile 2027 CI on the exact published head; preserve all
  existing checks. Independent focused internal review, not an external-review
  claim. Run diff/check, inspect changed-file scope and cache versions.
- Before publication compare current remote main; revalidate any composed
  concurrent changes. After merge verify tree, parent and deployed Pages run.
- Risk: larger text can wrap in legacy layouts, and a hash link could otherwise
  trigger SPA routing. Cover both with targeted tests.
- Rollback: revert this scoped PR; no data migration or persistence changes.

## Authorization

The owner's current edit request and standing instruction to publish cloud
changes authorize completing this scoped task. Higher-priority session
instructions preserve that authorization and require carrying the work through
publication without asking for redundant START/merge approval. No repository
permission policy is edited; no force operation or gate bypass is authorized.

## Execution record

- Initial worktree clean; branch isolated from neighboring cabinet work.
- Local gates passed: 15 solution/model unit tests, six triangle walkthrough
  browser journeys, 42 existing solution journeys, 84 focused help-link journeys,
  and 44 existing school-help return journeys.
- A first intermediate unit run exposed duplicate first-step assistance
  callbacks. Corrected by separating the rich walkthrough current-attempt guard
  from its once-only assistance callback; unchanged existing tests now pass.
- Independent internal review found equation-part and graph-explorer target
  gaps. Corrected and covered by focused browser regression.
- Test and release evidence, exact head and PR recorded in the pull request.
- Any failed intermediate checks and corrections will be included there.
