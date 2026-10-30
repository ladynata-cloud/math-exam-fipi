# Vilenkin 6 source helper — implementation handoff

## Outcome

An owned saved Vilenkin textbook task can open a helper using its exact course
revision and current step. A small hint, worked step and full solution are
separate explicit actions. The condition appears beside the hint, including
horizontal fraction bars. This is a source-based course helper, not free chat or
the trained Qwen adapter. It needs no PR375, provider key, assistant bridge,
external API permission or paid requests.

The server derives help from the canonical course and records assistance before
returning the bounded text. The cabinet uses its normal mutation queue and
temporarily makes the trainer read-only, including when pending help is restored
after reload. It then rechecks ownership, current revision, control, archive and
global active-exam state before displaying text. Native disclosure flags remain
unchanged, so ACK hydration cannot reveal a native solution early. Completed
independent and manual results remain intact; their review is a history event.

Failed help requests contain no pupil input and therefore do not create a
rejected-draft deadlock. Rejected pupil state/check/drawing data is preserved by
the existing workflow. Closing the panel or changing account, route, step or
source suppresses late responses. All rendering uses text nodes and bounded
fraction components rather than source HTML.

## Verification

| Check | Result |
| --- | --- |
| Full backend suite | 358/358 passed |
| New helper backend tests | 10/10, including all 194 source tasks and all 615 authored steps |
| Affected helper/cabinet/trainer DOM group | 57/57 passed |
| Final presentation-only widget tests | 9/9 passed |
| Two-origin Chromium/API/SQLite flows | 7/7 passed |
| Static syntax and `git diff --check` | Passed |
| Provider requests / production account access | 0 / none |

The seven browser flows cover delayed ACK with no premature reveal or editable
iframe, retained drafts, desktop/mobile layout, saved-help reload, control-race
failure and clean retry, reload while a help operation is still queued, a newly
started exam between ACK and context recheck, and review of a completed
independent result. Synthetic desktop and 390px screenshots were inspected;
both condition and actual hint are visible in the final mobile panel.

Independent local technical review passed with no remaining findings. Its final
non-document content pin is the SHA-256 of sorted repository-relative path,
NUL, file bytes, NUL for the 13 changed/new runtime, test and CI files:

`3d297ddcc80afe3d2f06102ea7110bb1e9e6634158d9888b55ca0bfb09a1d2c5`

This is not external Claude review or release authorization. No Claude tool is
exposed; the preceding Vilenkin consultation failed for insufficient provider
credit and there is no evidence that access changed. No review waiver is
recorded. Learning effectiveness with an actual pupil has not been tested.

## Scope and rollback

The change is stacked on PR378's source-course tree, local base
`52c45ff36cc458a948de70ec7629abfeb7c5b205`. The equivalent remote parent is
`9ee61ebb939eb7b1b840fe5ddfdc26287de637ea`. Source JSON, mathematics, task sequence,
published course inventory, assistant-service profiles and real pupil settings
are unchanged. This implementation agent did not merge or deploy anything.

Rollback first disables/removes the helper UI and retains the compatible server
action handler until pending operations and older clients are reconciled. No
schema migration is needed; existing history understands the saved state and
`after` fields. Removing the handler immediately could strand a pending request
in an old client's rejected-work queue.

## Executive status

Task: source-based Vilenkin textbook helper.
PR: prepared locally for a separate Draft PR; publishing is owned by the root agent.
Base: `52c45ff36cc458a948de70ec7629abfeb7c5b205`.
Head: the implementation commit containing this report.
Gate: local technical checks and independent review passed; external review pending.
Tests: backend 358, affected DOM 57, final widget 9, browser seven flows passed.
Failures: no remaining product/test failure.
Not run: external Claude review, live pupil validation, production deployment.
Scope deviations: none; final access recheck and queue recovery close identified races.
Recommendation: publish as a separate Draft PR; resolve release review requirements before rollout.
Next user decision: root agent will present the concrete release state and remaining authorization/review requirements.
