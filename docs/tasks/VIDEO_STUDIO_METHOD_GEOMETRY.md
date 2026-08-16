# Video studio: formula layout, logarithmic method, and anchored pyramid

## Identity

- Task: Refine the tasks 18–20 video studio without changing its publishing architecture
- Owner: ladynata-cloud
- Date: 2026-08-16
- Base branch: `main`
- Base SHA: `011b8d83f27acb31e919bcb9252ee3d958b84832`
- Planned branch: `agent/video-studio-method-geometry-20260816`
- Review level: `MEDIUM`
- Related issue or ADR: `docs/adr/0002-video-factory-v1.md`
- ADR status, if applicable: `Proposed`

## Goal

Make the tasks 18–20 studio clearer for a learner: remove the unexplained “ДВИ” label, keep mathematical notation aligned, teach logarithmic systems through expressing a variable from the first equation and substituting it into the second, and show every pyramid with its base attached to a horizontal reference plane and an explicit height.

## Context and evidence

- The production studio is implemented in `trainers/dvi/math-18-20-video-studio.html`; the directory name is an existing URL implementation detail and is not user-facing copy.
- The existing task 19 generator removes the logarithm first and then eliminates a variable; the owner explicitly requested the substitution-first method.
- The three pyramid presets already use one shared SVG renderer. Two presets show a height, while the corner-of-a-cube preset has no height and presents its base in an oblique plane.
- ADR 0002 is Proposed and remains advisory. This task does not change worker separation, storage, authentication, or deployment.

## Approved scope

### In scope

- Remove the user-facing word “ДВИ” from the studio.
- Stabilize fraction, system, question, and answer alignment.
- Rewrite task 19 theory, hints, generated steps, and recap to use substitution from the first equation.
- Add a horizontal reference plane, lock pyramid tilt to that plane, and label height `SO = h` in all pyramid presets.
- Extend the existing authoring gate and task documentation.

### Out of scope

- Renaming the existing `/trainers/dvi/` URL or directory.
- Changing the mathematical tasks or final answers.
- Changing video-worker APIs, authentication, persistence, quotas, or deployment.
- Merge or production deployment.

### Files or areas that must not change

- `video-worker/**`
- Student progress and teacher panel implementation
- Other trainers
- Production configuration

## Acceptance criteria

- [ ] No user-facing “ДВИ” remains in the studio title, header, or tabs.
- [ ] Fractions and systems align with surrounding text without baseline jumps, and answer rows have stable vertical alignment.
- [ ] Every task 19 variant starts by expressing a variable from the first linear equation, substitutes it into the logarithmic equation, solves one-variable equation, restores the second variable, and checks the logarithm domain.
- [ ] Every pyramid base lies in `z = 0`, is drawn on a visible horizontal reference plane, cannot be tipped away from it by vertical dragging, and has an explicit `SO = h` segment.
- [ ] Existing video preview, manifest, rendering, and student/ideal modes remain compatible.

## Checks and gates

- Required tests: `npm.cmd --prefix video-worker test`
- Required static checks: `node tools/video-factory-v1-gate.mjs`; inline JavaScript syntax check; no exact user-facing “ДВИ” match
- Manual checks: desktop and narrow viewport for tasks 18–20; task 19 preset flow; task 20 presets and horizontal drag; preview/MP4 controls remain present
- Final gate marker: `VIDEO_FACTORY_V1_AUTHORING_CHECK_OK`
- Checks intentionally not run and why: production smoke test is deferred because deployment is out of scope for this Draft PR

## Review plan

- Review-level rationale: bounded, reversible pedagogical and visual changes in one existing trainer; no server, data, authentication, or deployment change
- External review required: no
- Sanitized handoff constraints: no credentials, tokens, student data, or private URLs
- Required provenance if external review is used: provider, PR, base SHA, head SHA, verdict, and verifiable source or timestamp

## Risk and rollback

- Main risks: a generated task 19 branch could teach a wrong sign; the 3D projection could obscure a label; formula alignment could regress on a narrow screen
- Rollback plan: revert the task commit/PR; no data migration or persistent state is involved
- Data or compatibility considerations: generated answers and video manifest schema must remain compatible; no stored progress format changes

## Permissions

- `START` granted by owner in the current task conversation: yes
- Branch creation allowed: yes
- Local commits allowed: yes
- Push allowed: yes
- Draft PR allowed: yes
- Merge allowed: **no unless separately authorized after review**
- Auto-merge allowed: **no unless separately authorized**
- Deployment allowed: **no unless separately authorized**

## Execution record

- Actual branch: pending GitHub reconnection
- Actual base SHA: `011b8d83f27acb31e919bcb9252ee3d958b84832`
- Actual head SHA: pending
- PR: pending
- Commits: pending
- Tests passed: `VIDEO_FACTORY_V1_AUTHORING_CHECK_OK`; `npm.cmd --prefix video-worker test` (30/30); desktop and 390 px browser smoke; task 19 substitution flow; all pyramid specifications; vertical base lock and horizontal rotation; no browser console errors
- Tests failed: none after fixes; the browser smoke caught and closed one malformed distractor and one crowded height-label layout before publication
- Tests not run: production smoke test (no deployment permission)
- Scope deviations: none

## Required handoff

```text
EXECUTIVE STATUS

Task: Refine video studio method and pyramid geometry
PR: pending
Base: 011b8d83f27acb31e919bcb9252ee3d958b84832
Head: pending
Gate: VIDEO_FACTORY_V1_AUTHORING_CHECK_OK
Tests: video-worker 30/30; desktop/mobile browser smoke; generated-method and pyramid geometry checks
Failures: none
Not run: production smoke test (deployment not authorized)
Scope deviations: none
Recommendation: pending checks
Next user decision: review the Draft PR; merge/deploy remains a separate decision
```

