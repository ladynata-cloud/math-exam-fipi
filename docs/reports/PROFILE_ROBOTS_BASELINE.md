# PROFILE learner robots — baseline and verification

EXECUTIVE STATUS

- Task: PROFILE_READINESS_ROBOTS; reproducible simulations for a learner with ОГЭ grade 4 and substantial trigonometry gaps.
- PR: managed by the parent task; this test subtask does not publish or deploy.
- Base: `aabdb8d9396bef502ced049e7867774c1885ddef`.
- Head: working-tree course fixes, identified by source SHA-256 values below.
- Gate: `PROFILE_LEARNER_ROBOTS`.
- Tests: six deterministic learner personas; desktop and 360 px; answer checking, help, repair, reload, keyboard, independent credit, repeated work.
- Failures: baseline has five missing-final-answer failures; verification has zero failures.
- Not run: real pupils, clinical/cognitive assessment, long-term learning outcomes.
- Scope deviations: none; the robot files and this report do not modify production code.
- Recommendation: these representative interaction scenarios pass; use the separate whole-bank and foundation gates for content breadth.
- Next user decision: none for these tests.

## What the baseline exposed

The original trigonometry flow could declare a task completed after preparatory questions. Five personas reached a result panel without ever entering the requested numerical result. For example, 450° was split into five quarter-turns and reduced to a 90° terminal ray, but the learner was never required to enter the actual coefficient 5/2 in `450° = (5/2)π`. The positive-root and coordinate cases had the same structural gap.

The negative-power expression already required its numerical result in the last step, so that persona passed the original flow. The test does not require a redundant final field when the final listed step already asks for the requested answer.

Baseline: **299/304 checks passed**, **1/6 personas passed**, five failures, zero browser runtime errors and zero failed local resource requests.

Verification: **341/341 checks passed**, **6/6 personas passed**, zero browser runtime errors and zero failed local resource requests.

| Persona | Baseline checks | Verification checks |
|---|---:|---:|
| ОГЭ на 4, слабая тригонометрия: путает оси | 49/50 | 55/55 |
| Берёт положительный корень в левой полуокружности | 52/53 | 61/61 |
| Теряет полный оборот при переводе в радианы | 44/45 | 55/55 |
| Пробел в отрицательных показателях степени | 53/53 | 54/54 |
| Торопится: пустой ввод, буквы, повтор Enter | 49/50 | 55/55 |
| Нуждается в подсказке и возвращении на свой шаг | 52/53 | 61/61 |

## Explicit learner behavior

`tools/fixtures/profile-learner-personas.json` contains every answer, misconception, corrected rule, and transfer example. Answers were calculated from visible statements. The learner runner never imports the course question banks and never reads `task.answer` or `steps[].answer` from browser globals. Reading saved `answers` only verifies which responses the UI accepted. Initial storage selects a named task and starts at step zero; it does not award completion or supply an answer.

The models are deliberately limited:

- Axis confusion: chooses x for sin, then uses `P = (cos α; sin α)` and checks a new coordinate pair.
- Positive root: ignores the quarter, then distinguishes the nonnegative square root from the signed cosine.
- Radians: answers 1/2 for 450°, sees the rejection, revisits the rule, then answers 5/2.
- Negative power: answers −5 for 5⁻¹, then uses the reciprocal 1/5.
- Hasty input: submits blank text, `abc`, and `1/0`; none counts as a mathematical error. Enter works and repeated submission cannot duplicate progress.
- Return after help: confuses a reference angle, opens a hint and the prerequisite explanation, restores the same step and draft after reload, and retains previous steps.

Every persona completes assisted work, then attempts an independent task with an intentional error and help. That task earns no unassisted credit. Two later new tasks can earn separate credits; one success never claims two. A familiar repeated task cannot add a new independent credit, and its clean completion is explicitly described as “Повтор решён без подсказок”. Reload cannot duplicate a completion.

These are scripted interface and teaching-support checks. Corrections and subsequent answers are deterministic fixtures; **the result does not establish that a real pupil has learned the material**, nor does it estimate a learning success rate.

## Reproduce

The runner emits one detailed JSON object to stdout and exits nonzero on a failed check. The object includes each check, submitted responses, visible hints and repair explanations, final records, failures, source hashes, and timestamps. Source changes during a run fail the gate. A compact, path-free checked-in result is available in `docs/reports/profile-learner-robots-results.json`. Optionally set `PROFILE_ROBOTS_OUTPUT` to also write that JSON to a file.

```bash
PROFILE_ROBOTS_OUTPUT=profile-robots-results.json \
node tools/profile-learner-robots.browser.cjs
```

On another machine use its installed Playwright and Chromium; the environment variables are optional if Playwright can locate its own browser. All page requests go to an ephemeral local HTTP server. No external account is used.

For the original baseline, a read-only overlay supplied the base commit versions of `app.js`, `state.js`, `algebra-data.js`, and `equations-data.js`; other static assets came from the worktree. No repository file was rolled back. `PROFILE_ROBOTS_SOURCE_ROOT` identifies this overlay root, preserving relative paths such as `ege-profil/start/app.js`. `PROFILE_ROBOTS_PHASE=baseline` selects the explicit pre-fix intermediate-step fixtures for the cosine and special-angle personas and omits the new repeat-status assertion. The required final-answer assertion remains enabled. `PROFILE_ROBOTS_FIXTURE` can identify an alternate explicit fixture file when reproducing an earlier fixture version.

## Evidence identity

Baseline started: `2026-10-09T14:39:57.759Z`. Verification started: `2026-10-09T14:43:34.695Z`. Verification finished: `2026-10-09T14:43:48.874Z`.

| Source | Baseline SHA-256 | Verified SHA-256 |
|---|---|---|
| `app.js` | `feeb077b602d7ad20a1ec79fcd4a4d314156a46c190acfec7aa45947ac2fc898` | `22aadbb6fe7a0855f263eafcb747c8c78df3a3c299da71160a13bd5cb187e36b` |
| `state.js` | `a492c3491fac4c1b257aeafc004b205f2eaa1a9b712e243dfefd18125910cf92` | `a492c3491fac4c1b257aeafc004b205f2eaa1a9b712e243dfefd18125910cf92` |
| `algebra-data.js` | `1c80de33566856076b46924347be2d45a3cfa4232848a4348b7c86cf392bd279` | `6f1526827b5efdb6259cae74af93e4849161de9368efef48d5a14fa2de73f70a` |
| `equations-data.js` | `45c8090c44e6c163e1ae7cb00e2a6540179f490096e4f0d28111016b1c2de423` | `45c8090c44e6c163e1ae7cb00e2a6540179f490096e4f0d28111016b1c2de423` |
