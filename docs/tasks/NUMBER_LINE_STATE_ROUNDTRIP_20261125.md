# NUMBER_LINE_STATE_ROUNDTRIP_20261125

Base candidate: 58f2071e4405f1920d720e5e4b4dd32f73ad340c (#753). Scope: one adapter state canonicalization, no math, generated examples, progress storage or server policy changes.

Fleet run 45532175617: 74/75 passed; negative-numbers-line failed at handoff with both peers connected and the SDK state received. Inspection finds a deterministic representational inconsistency: initial renderer emits classes "instr " and "feedback ", whereas applyBoardTrainerState normalizes those to "instr" and "feedback". The actual structured-state roundtrip should be exact. Fix canonical class serialization and rendering, preserve all semantic classes and accept legacy strings. Three extracted-real-function regression tests exercise the actual functions, not copied substitutes.

The public navigator source receipt is updated only for this exact reviewed source commit and exact navigator pair; all other source bindings stay unchanged. This is not a mathematical or external audit approval. Full fleet rerun is required to establish that this explains the sole remaining failure. Keep draft stacked until #753 is published and revalidation is complete. No production rooms, real pupil data or paid API. Revert the isolated change if needed.
