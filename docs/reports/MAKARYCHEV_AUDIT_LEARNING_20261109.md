# Макарычев: применение аудита к курсам и тренажёрам

Task: [MAKARYCHEV_AUDIT_LEARNING_20261109](../tasks/MAKARYCHEV_AUDIT_LEARNING_20261109.md).
Base: `89ee66bfe5068f16364d61d091fcbf1a1cbd6287`.
Evidence: [audit findings and limitations](MAKARYCHEV_AUDIT_EVIDENCE_20261109.md).

## Result and exact scope

| Surface | Existing content retained | New common behavior |
| --- | --- | --- |
| Makarychev 7 | 46 topics, 276 tasks, 795 steps; 20 computation skills | Ten model-family investigations, prediction and explanation records, exact parameter controls, attempt/help journal, fresh practice, five-day repetition, separate familiar attempts |
| Makarychev 8 | 51 topics, 722 tasks, 1955 steps; 20 computation skills | Six model-family investigations, synchronized shifted reciprocal graph/formula/table/domain, attempt/help journal, fresh practice, five-day repetition |
| Makarychev 9 thematic | 93 detailed lessons across 31 textbook points | Five laboratory families with saved prediction/explanation, exact task/draft/hint/model restoration, first attempt and bounded history, specific feedback and independent practice |
| Makarychev 9 numbered | Exercises 1–97: 311 parts, 774 steps | Fourteen model families with prediction and notes; preserved learner answers, first attempt and assistance, honest old records, same-skill fresh course practice and five-day review |

These are reusable improvements across the existing content, not 190 newly
authored distinct experiments. Textbook source banks, exercise IDs, answers and
storage keys remain unchanged. Exercises 98–891 and PR #482's additional root
exercises are not included.

The 24 initial grade-seven workshop lessons and old grade-seven/eight overview
routes remain separate. New links lead to the corresponding native course;
old work is not silently migrated. Old grade-nine overview lessons link to the
detailed point. The shared course catalogue recognizes the Makarychev 7/8
aliases, and the grade-seven landing page exposes the full 46-topic course.

## Learning and data guarantees

- Correct final answers, checked numeric steps and free explanations are
  distinct evidence. Free prose is saved for discussion, not automatically
  scored as a proof. Research activity never creates independent mastery.
- Empty and unrecognized submissions receive input guidance. Mathematical
  mistakes retain the learner's input; help is offered after errors without
  claiming that an offer was used.
- The first answer is retained separately from bounded recent history.
  Independent first attempts, assisted work, corrections and familiar
  repetitions have distinct labels. Missing old assistance provenance remains
  unknown through validation and subsequent saves.
- Reopening models, notes or hints restores the relevant task state. Fresh
  practice does not overwrite the earlier example. Existing standalone work
  and related-course data remain readable.
- A reciprocal function with zero numerator remains undefined at the original
  forbidden input. The graph displays an open point; the table preserves the
  undefined entry and no false vertical asymptote is shown.
- Framed Makarychev demonstrations use ephemeral work and preserve personal
  localStorage bytes. This is isolation from personal progress, not a new
  real-time collaboration protocol or a claim of backend synchronization.
- Five-day review in native/numbered courses is a product choice. The thematic
  grade-nine course retains its existing spaced-review schedule.

## Validation record

Local content checks passed for Makarychev 7 (276/795), Makarychev 8 (722/1955),
Makarychev 9 thematic (13020 final-answer checks / 357 frames), and numbered
Makarychev 9 (97/311/774). Source banks remain byte-identical to the base.

Targeted new state/DOM tests cover all four surfaces: model families, domain
boundaries, corrected and assisted results, independent fresh tasks, old
provenance, exact reload, bounded histories, keyboard controls and iframe
personal-data sentinels. Existing model, state, import and shared-school
regressions are retained. The final handoff records exact local runs and independent
review; an earlier run is not represented as a later candidate's result.

Initial concurrent native-course DOM runs exceeded local resources (SIGKILL);
one retry was stopped. A later grade-seven run at a 768 MB heap cap failed with
heap exhaustion. Grade seven now uses the same event-loop yield after every
20 completed tasks as the existing grade-eight harness. Every task, assertion
and the same window/saved state are retained; this test-only change received
independent review. Final sequential runs at the same 768 MB cap passed normally:
grade seven **276 tasks / 795 steps**, grade eight **722 tasks / 1955 steps**,
including detour/return, notebook reload, invalid routes and corrupt storage.
Required full suites remain enabled in the existing Makarychev workflows. The new combined workflow runs the four
audit regressions and a real-browser cross-course suite, retaining screenshots
and evidence at 320×900 and 1280×900.

The local browser extension was unavailable and the managed cloud preview
failed with navigation/frame timeouts. No local visual pass is claimed. A
grade-seven foundation check passed its mathematics section, then could not
launch the missing local Chromium binary; its CI browser coverage remains.

Independent HIGH ready-result review approved the source changes with no unresolved
blocking findings. The reviewer independently passed M7 audit (46 topics / 10
families), M8 audit (13 tests), M9 thematic audit (93 entrypoints), M9 mathematics
(13020 checks / 357 frames), numbered audit (9 tests / 14 families), shared state
(7400 generated checks), browser-script syntax and whitespace. M7 imports also
passed all five cases. The final full native DOM runs also passed as described above. Remote CI and
real-browser acceptance remain required.

The candidate was composed with upstream `e5ca2174becd89064710af625b517feeab00e4bd`
and the changed source paths were revalidated. Initially no PR or remote branch was created because automatic review rejected
the upload twice. The owner then explicitly confirmed this 35-file package,
checked merge and publication on 2026-11-09. Release proceeds through the
authenticated GitHub connector; final remote refs, CI and production evidence
are recorded in the PR, not inferred from local results. External provider review and
real-pupil/mini-group trials were not performed.

## Release and rollback

The owner supplied the requested package-specific publication confirmation.
Mandatory successful checks remain a condition of merge/publication.
Before merging, re-read remote main/head, inspect any concurrent changes and
validate the composed result. Preserve pending #497/#499 work if it lands.
The navigator binding is refreshed only against a real committed source.

Recovery must preserve new saved-work readers and fields. Prefer a corrective
release or presentation-only rollback. Do not clear learner storage, restore a
serializer that drops new draft/history data, or remove retained review IDs.
