# Division: move both commas together and revisit multiplication

## Identity and permission

- Owner: site tutor; request on 2026-10-09 (Asia/Novosibirsk).
- Scope: synchronized decimal-comma dragging, following Vilenkin grade 5;
  nearby multiplication-table practice with a return to the unfinished division.
- Base `main`: `1aace4083532f27cdc36f54b70ce20be67f5d25c`.
- Branch: `course/decimal-comma-drag`. Review: **HIGH** because the adapter
  touches the interpretation of a persisted draft and help counters.
- Standing owner publication authorization and separate external-review waiver
  apply. This record is not review evidence. Independent internal review required.
- One bounded extension of existing arithmetic/guided presentation. The existing
  mathematical plans, storage schemas and managed teaching contract remain.

## Teaching evidence

Read Vilenkin N. Ya., Zhokhov V. I., Chesnokov A. S., Shvartsburd S. I.,
Mathematics grade 5, 1990, §37, pp. 250–251:
<https://djvu.online/file/emcL5tbuIG7LY>.
Chapter transcription also checked:
<https://xn--24-6kct3an.xn--p1ai/Математика_5_кл_Виленкин/37.html>.

Use an author-written interactive explanation: scale both operands by the same
power of ten until the divisor is natural; append zeros as needed. The dividend
may remain fractional. Source pages are not reproduced; only the mathematical
method informs the presentation. Dragging previews an equivalent division;
the existing deliberate answer checks still establish progress.

## Acceptance

- Either comma can be grabbed with mouse or touch; both move the same number
  of places, including live movement and snapping at release.
- Exact decimal strings, no floating-point rounding, no independent operand
  movement. Zeros and original positions remain understandable.
- Keyboard and large buttons duplicate the gesture. Cancelled gestures restore
  the prior value. Locked/accepted preparation cannot be altered accidentally.
- Existing old n5f three checks and guided four preparation actions remain;
  no step reordering, automatic answers, result inflation or saved-work migration.
- Multiplication practice is visibly available beside division, opens one short
  exercise at a time, and closes to the unchanged task, draft and written rows.
  Opening it marks an unfinished division as assisted; it does not create a
  completed course result. No real pupil data or accounts.
- Test one-, two- and three-place shifts, integer dividend with padding,
  dividend remaining fractional, too few/too many places, touch, keyboard,
  320/390px layouts, reload and previously accepted saved steps.

## Boundaries and rollback

No backend, accounts, board protocol, canonical bank or unrelated course changes.
Legacy division generator remains; the shared visual component also supports
the three-place cases already in detailed division. Revert this bounded PR to
roll back. Stored action order and format are unchanged and remain readable by
the previous release. Existing local progress is never reset.

## Gates

- `tools/decimal-shift.test.cjs`: exact mathematical properties.
- `tools/decimal-shift.browser.cjs`: actual drag/touch/keyboard and table overlay.
- Existing arithmetic-course and PreOGE core/persona suites.
- Existing division-guided core/browser and notebook browser suites.
- Canonical teaching bank equality and affected-page link checks.
- Independent final code review, `git diff --check`.
- Final marker: `DECIMAL_COMMA_DRAG_OK` only after all checks pass.
- Real-pupil learning effectiveness is outside software testing.

## Execution

Local gate **DECIMAL_COMMA_DRAG_OK**, 2026-10-08 18:19 UTC:

- Exact decimal model: 11 edge examples and 2800 rational scaling/quotient
  properties, including six-place precision and zero dividend.
- Existing arithmetic: 43 levels / 377 phase actions; PreOGE contracts and
  six fictional learner browser journeys, including interrupted work.
- Guided core: 2700 deterministic plans. Guided and notebook browser suites
  passed with the actual new shared component loaded, including old v1 resume,
  stale tabs, corrupted storage, 320/390px and reduced motion.
- New browser suite: both handles on six operand pairs, simultaneous physical
  movement, pointer capture, real touch, cancellation, keyboard, normal page
  scrolling, deliberate checks, extra-shift errors, durable guided draft,
  completion and multiplication-help return in both trainers at 320/390px.
- Canonical managed bank: unchanged 35 sources / 396075 bytes. Both affected
  HTML pages passed link checks; JS syntax and `git diff --check` passed.
- Independent HIGH internal reviewer approved the final implementation and
  workflow changes on 2026-10-08 18:17 UTC, no blocking findings. The reviewer
  separately reran exact-model and whitespace gates, reviewed browser scenarios,
  recorded results and screenshots; did not independently repeat browser runs.
  One wording observation about padded zeros was corrected before approval.

No failed local checks remain. Real pupils and non-Chromium browsers were not
tested. No external review was performed under the owner's standing waiver.
GitHub exact-head CI, publication and live checks follow this local record.
Publishing must recheck authoritative remote main and reviewed-tree identity.
No previous unpublished work is included.
