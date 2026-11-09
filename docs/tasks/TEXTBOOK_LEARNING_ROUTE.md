# Петерсон 6 и Макарычев 8: маршрут обучения

## Identity and permission

- Owner: MathExam; requested 2026-11-09 (Asia/Novosibirsk).
- Base: main `ee7c501abc2f293d923d892a4b3dcc5ac4b798f7`.
- Branch: `draft/textbook-learning-route`.
- Review: HIGH (separate optional study metadata, legacy storage compatibility).
- START, branch, commits, push and Draft PR explicitly authorized by current request.
- Merge and deployment explicitly **on hold until separate owner confirmation**. This task-specific restriction supersedes standing publication authorization.
- Accepted ADR 0010 account boundary retained. ADR 0005 remains Proposed; this task adds a bounded presentation component over existing course evidence, not a replacement skill engine or account system.

## Goal and approved scope

Show the course journey inside the two existing student applications: chapter/topic sequence, visible task progress, current/next step and continuation, distinct theory acknowledgment, assisted and independent results. Preserve authored exercises, scoring, old saved work, practice detours, search, cabinet links and board isolation. No strategic dashboard or new public area.

Shared presentation and adapter live in school/shared. Each course keeps its original storage key and sanitizer. Only explicit theory acknowledgments use the corresponding `.route.v1` key; optional `learningRoute` backup data is separate from `state`. Old backups remain valid. No writes occur merely from viewing the route.

Peterson current-method results alone contribute to current task progress; old-method work and history remain accessible. Board sessions retain the original home and never initialize personal route storage. Hash links retain cabinet query parameters. The board wrapper loads the same inert shared resources to preserve the existing script-parity gate.

## Evidence definitions and learning design

- Reading alone never supplies an assessed result. “Теория изучена” is explicit pupil self-report.
- Independent means the existing validated course result: correct on first attempt without assistance; current-method credit required for Peterson.
- Help/after attempts includes other correct results; no existing evidence is upgraded.
- Progress percentage measures included course tasks, not all textbook exercises or mastery.
- Fully independent topic means all included topic tasks were independent. Separate practice is not attributed to a topic.
- Continuation returns to an unfinished draft, otherwise next unfinished task in that topic, then first incomplete topic. Completing all tasks offers separate practice. No topic is locked.
- Scope remains Peterson part 1 (14 topics), Makarychev 8 (51 topics). Theory and independently completed work have distinct visible labels.

## Acceptance and checks

- Pure component tests: counts, sequence, safe text/links, empty/mixed/complete evidence.
- Adapter tests: no legacy writes, study persistence/import, old-method evidence, continuation.
- Existing state/import/UI/board/picker/search regressions.
- Real Chromium: 320×900 and 1280×900; fresh/mixed/resumed work, theory marking, help/independent answers, reload, keyboard, no horizontal overflow, cabinet query, board isolation, denied/corrupt storage.
- Syntax and git diff --check; focused independent technical review.
- External provider review not performed under standing owner policy; no real-pupil pedagogical trial claimed.

## Risk and rollback

Progress stays local to this browser, not a new server journal. Optional theory metadata is monotonic and isolated; invalid metadata is not overwritten. Revert the changed code/resources to restore the old UI; do not remove original saves or the optional metadata. Failed shared resource load falls back to the original home.

## Execution record

Final test outcomes, exact head and PR are recorded in the Draft PR. Production and real-account testing are intentionally excluded until owner approval; simulated cabinet/board compatibility is checked locally.
