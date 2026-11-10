# Stereo expanded model: keep the navigator outside the drawing

## Identity

- Task: `STEREO_EXPANDED_NAVIGATOR_20261109`
- Owner: MathExam project owner; release coordinated in the current conversation.
- Date: 2026-11-09
- Base branch: `fix/peterson-route-help-20261109` (#513)
- Base SHA: `6ce2062030e326541f103160fc7b8751f017a3bf`
- Planned branch: `fix/stereo-expanded-navigator-20261109`
- Review level: `MEDIUM` — bounded visual exclusion around an existing modal state.
- Related: #502 shared course shell; #513 dependency chain. No architectural ADR change.

## Goal

While a stereo task drawing is expanded, its explanation and camera controls
remain unobstructed. Closing the drawing restores the same global navigator,
including any unfinished navigation question.

## Context and evidence

- Actual HTTP screenshots `qa-with-shell-box-expanded-320.png` and
  `qa-with-shell-box-expanded-1280.png` from the reviewed course UI evidence show
  the global navigator covering explanatory text on mobile and the lower edge
  of Reset on desktop. This is an observed defect, not a hypothetical redesign.
- The existing viewer marks an expanded shell with `.am-expanded`, places focus
  on its close button, and removes the state on Close or Escape. It already
  restores document overflow and scroll without replacing the live model.
- The navigator has one `#maxexam-public-assistant` host with an open shadow root.
  Its launcher and panel belong to that host. Hiding the host does not recreate
  its runtime or discard the transient question.
- `PROJECT_STATUS.md` contains historical preparation records. The current
  release coordinator separately confirmed the preceding Merzlyak publication;
  authoritative main at task preparation was
  `a4922cb5e7b211f86a086859cd8146b8482f0944`. This follow-up uses the explicitly
  approved unmerged #513 dependency and does not claim that chain is live.

## Approved scope

- One selector in `assets/course-ui.css`, limited to the stereo course body
  containing an expanded model inside its active workspace.
- Extend the existing `checkExpandedBox` HTTP browser scenario at 320/1280.
- This task record. Exactly three changed files are expected.

Do not change HTML, model or navigator JavaScript, mathematics, controls,
serializers, storage keys, cabinet/board behavior, route inventories, source
receipts, dependency heads, or the shared shell's other typography and layout.
There is no global navigator rollout or general overlay refactor in this task.

## Acceptance criteria

- [ ] Expanded stereo drawings hide both the navigator launcher and any open panel.
- [ ] Close and Escape restore the same navigator host and its prior open state.
- [ ] An unfinished navigator question remains intact; model focus is restored.
- [ ] Camera controls stay visible, enabled and unobstructed at 320/1280.
- [ ] Exact saved course bytes, draft, live model, camera and learning credit survive.
- [ ] Existing HTTP learning, source preservation and bindings checks pass.
- [ ] Current-head CI screenshots are reviewed before release.

## Checks and gates

- Existing viewer expansion and task-first DOM regressions.
- Navigator source-preservation and explicit-binding tests.
- Syntax and `git diff --check`.
- Existing `Course visual consistency` workflow: paired course layouts,
  stereo HTTP learner journey and Vilenkin HTTP learner journey. The stereo
  scenario retains its prior assertions and adds hidden/restored navigator,
  same-host identity, exact persistence and camera-control hit tests.
- Fresh 320/1280 screenshots and `expansion-escape-evidence.json` are required.
- Local Chromium is known to be unavailable in this executor; CI is the browser
  gate. Unavailable local rendering must not be reported as a pass.
- Final marker: `STEREO_EXPANDED_NAVIGATOR_OK`, only after actual-head CI and review.

## Review plan

- Independent focused technical review before handoff; current browser evidence
  must correspond to the reviewed candidate.
- No new learning sequence or mathematical content: trainer consultation is not
  applicable. No pupil study is claimed.
- External review is not requested under the standing owner policy and is not
  performed. Internal review is not an external provider approval.
- Handoff includes only the public scoped diff, relevant checks and exact refs.

## Risk and rollback

The primary risk is leaving navigation hidden after a drawing closes or hiding
it on unrelated pages. The selector depends only on the existing stereo body,
workspace and expanded-shell state; both close paths are tested. No new runtime
state or listener is introduced. Reverting these three files removes only this
visual guard and its tests. Preserve all predecessor learning-data adapters and
compatibility behavior; a full chain rollback is not authorized by this task.

No bound source document is modified. `course-ui.css` is loaded by reference and
is not a historical navigator HTML payload; source-binding refresh is therefore
unnecessary. Preservation gates must still pass with the receipt unchanged.

## Permissions and execution

The current coordinator instruction grants START, isolated branch creation,
local checks/commits, scoped upload and a Draft PR based on #513 under the
[standing owner policy](../OWNER_RELEASE_AUTHORIZATION.md). Only the coordinator
may merge or deploy this task. No force/rebase/reset, gate weakening, unrelated
head edits or new standalone QA branch is authorized.

- Actual base: `6ce2062030e326541f103160fc7b8751f017a3bf`.
- Gate: local checks and independent focused code review PASS; actual-head CI
  and screenshot acceptance pending.
- Passed: existing viewer expansion regression (both close paths, scroll,
  focus, exact camera and teardown); task-first DOM (39 units); task-first
  integration (39 numeric scenes and 24 proof destinations); navigator
  preservation 4/4; explicit bindings 5/5; syntax and diff checks.
- A first unittest discovery command matched no importable test module and ran
  zero tests. The direct existing test-file command then passed all five; the
  empty discovery is not counted as a pass.
- Independent review found no code blockers. The browser scenarios cover the
  closed navigator with Escape and the open navigator with Close, not all four
  combinations. Shadow-host cascade and visual exclusion still require Chromium.
- Failures: none in the executed targeted regressions.
- Not run: local Chromium unavailable; no current-head CI/browser pass yet.
- Scope deviations: none.

## Required handoff

```text
EXECUTIVE STATUS
Task: STEREO_EXPANDED_NAVIGATOR_20261109
PR:
Base: 6ce2062030e326541f103160fc7b8751f017a3bf
Head:
Gate:
Tests:
Failures:
Not run:
Scope deviations:
Recommendation:
Next user decision: none; coordinator owns release
```
