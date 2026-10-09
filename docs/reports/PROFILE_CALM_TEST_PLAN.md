# Calm course — learner simulations and strict checkpoint protocol

Status: final browser verification passed on 2026-10-09T15:35:30.180Z with Chromium CPU throttled 4×: **4/4 learner profiles, 186/186 checks**. No runtime errors, missing local resources, or source drift. The detailed, path-free result is `docs/reports/profile-calm-learner-robots-results.json`.

The four learner models are scripted interaction patterns. They do not model a diagnosis and cannot establish human learning. `tools/fixtures/profile-calm-personas.json` records their misconceptions and responses. Test answers must come from visible statements and explicit rules, not production answer keys.

| Profile | Action sequence | Required result |
|---|---|---|
| Loses place after a pause | Accept one step; begin the next answer; toggle calm mode; reload; leave and resume | Same task, current step, unfinished draft, and accepted history; no unearned completion |
| Loses the intermediate goal | In the 72 km motion problem, enter the final speed while asked for an intermediate number; misidentify x as time; then perform four small actions | Wrong quantity rejected; one active micro form; its draft survives reload; small actions do not auto-complete the main step; final speed is required |
| Needs a worked example | Begin independent answer; open example; complete a different guided condition and a short-plan condition; resume independent work; request repair of that same condition | Example uses guided pool; original independent session is assisted; task and draft survive; no unassisted credit; later genuinely new practice remains possible |
| Transfers without a topic label | Enter mixed checkpoint; respond to thirteen neutral items; pause and resume; finish | No method title or hints; one accepted valid response per item; strict result separate from lesson-practice credit; honest reuse/exhaustion handling |

## API and selector agreement

Planned routes are `#calm`, `#calm/N`, `#example/lessonId`, `#practice/lessonId/guided`, `#practice/lessonId/independent`, `#repair-task/lessonId`, and `#checkpoint`. The calm-mode control is `#calm-toggle`.

The runner should preserve existing `#answer-form`, `#answer`, `#submit-answer`, `#feedback`, `#next`, `#solution-history`, and `.result-panel` where those semantics still apply. Worked examples use `#worked-example`, `#example-next`, and `#example-practice`. Same-condition repair opens with `#repair-current` and uses the ordinary guided form. Checkpoint uses `#checkpoint-form`, `#answer`, `#checkpoint-submit`, `#checkpoint-next`, and `#checkpoint-result`; its state is separately stored under `mathexam.profileCheckpoint.v1`.

## Strict checkpoint invariants

1. Normal lesson `independent` work and the mixed checkpoint are different protocols. The checkpoint has its own saved state and score; it must not call ordinary independent completion or inflate lesson records.
2. An item shown previously in ordinary practice, a worked example, remediation, or a prior checkpoint is not a new strict item. The current engine already uses each lesson's last three tasks for independent practice, so these are only eligible when truly unseen.
3. The act of showing an item must persist its exposure before the learner can leave or reload. Reopening that item restores the same run rather than awarding fresh-item status.
4. Reserving all thirteen items requires care: a separate reservation should not falsely claim that unshown items were seen, and ordinary practice in another tab must not accidentally reuse a planned strict item. Any simplification must be described honestly.
5. Blank and unreadable input do not consume an answer. A first valid answer is locked. Repeated Enter, reload, or revisiting an earlier item cannot improve that answer or double-count it.
6. Pre-completion feedback must not reveal the answer or method in time to repair a supposedly strict response. Explanations can be presented after the run is completed or explicitly abandoned for assisted practice.
7. A neutral within-run number is acceptable. A title such as “Производная” or “Движение”, a lesson navigation link, a formula hint, or an interactive model control that reveals the method defeats the no-topic-label condition. Necessary problem diagrams remain allowed.
8. A simple pause, reload, or return to the checkpoint does not constitute mathematical help. Deliberate navigation to an example, prerequisite explanation, or repair while strict work is active must either end that strict attempt or mark it assisted; it must not silently remain an unassisted strict result.
9. Exhausting the finite unseen pool must produce an explicit message or honest training mode. No fallback may present familiar tasks as new strict control.
10. Incomplete, unavailable, or corrupted checkpoint state must not become a completed 0/13 result or an unsupported mastery claim.

Technical protocol tests are distinct from the four learner profiles. They may inspect metadata to verify IDs and saved outcomes, but metadata must not supply the learners' answers.

## Intended output

`tools/profile-calm-learners.browser.cjs` emits structured JSON with persona events, passed and failed checks, viewport, source hashes, and explicit limitations. A failed assertion, browser exception, missing resource, or source change during the run will produce a failing exit status. This new runner will not modify the previous learner robots or production code.

## Final execution evidence

The runner was executed against the completed calm UI, micro support, separate checkpoint state, and stale-form fixes. Source SHA-256 values are included in the JSON and were checked again against the working tree after the run.

| Learner profile | Passed checks | Outcome |
|---|---:|---|
| Теряет место после паузы | 14/14 | PASS |
| Путает промежуточный результат и окончательный ответ | 42/42 | PASS |
| Решает после образца и разбора своего условия | 31/31 | PASS |
| Выбирает способ без подсказки названием темы | 88/88 | PASS |

The additional technical protocols passed 11/11 checks: help from the strict checkpoint stays assisted; stale checkpoint input and submit refresh the shown condition without writing to a different item; an old guided answer cannot become the next step's answer after another tab advances.

The mixed fixture intentionally submits **4 instead of 16** for the expression with powers. Its expected outcome is therefore **12/13**. The gate passes because that first wrong answer remains locked, the other twelve independently calculated responses are accepted, and ordinary lesson credits do not increase. This is a designed robot response, not a pupil's score.

The stage-path profile completes **worked example → different guided condition → short-plan condition → independent attempt**, then repairs the exact independent condition and restores its original unfinished draft. Work after a sample or repair receives no unassisted credit; a later new condition can earn ordinary practice credit.

The micro profile verifies that only one answer form is visible while small actions are open, the micro draft and accepted actions survive reload, and finishing the small actions still requires answering the main question.

Run with installed Playwright/Chromium (optional `NODE_PATH` and `CHROMIUM_EXECUTABLE_PATH` may point to their installation):

```bash
PROFILE_CALM_OUTPUT=profile-calm-results.json node tools/profile-calm-learners.browser.cjs
```

No deployment or commit was performed by the test subtask.

## Cloud scheduling regression

Cloud run 37951799923 exposed a synchronization error in the test: guided and independent modes share `#answer-form`, so waiting for that selector after clicking “Разобрать эту задачу” could match the old independent screen. The fixture could then type into a form that the pending hash-route render was about to replace.

The runner now waits for the expected hash, mode heading, and guided step together before entering an answer. It also checks the visible input value before submitting. The same wait is used at other mode transitions. No production code was changed for this test fix.

The complete 186-check runner passed with `PROFILE_CALM_CPU_RATE=4`, deliberately slowing the browser's main page to exercise asynchronous route rendering. All final source hashes matched the working tree again after execution.
