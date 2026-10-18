# Понятные подсказки к делению в кабинете

## Identity

- Task: PLAIN_DIVISION_HINTS
- Date: 2026-10-19 (Asia/Novosibirsk)
- Base branch: main
- Base SHA: fdde4e9cbdeaec1f8f0f65d677566482d09b6be7
- Planned/actual branch: fix/plain-division-hints
- Review level: MEDIUM — bounded presentation changes across managed arithmetic UI.
- ADR: no new architecture; existing managed task/presentation boundary.

## Goal and evidence

The owner requested a simplicity audit for a learner with learning difficulties
and identified unexplained terminology. The supplied cabinet screenshot shows
«Цифра частного», «линейка кратных», «произведение», «делитель» in the first
practice question and its help. The actual managed renderer uses canonical
saved tasks and optional `learning-scaffolds.js`; changing the standalone page
alone would not correct this screen. See [audit](../reports/PLAIN_DIVISION_HINTS_AUDIT.md).

Status reconciliation: PR 256 is merged at the base above. Its three runtime
assets were verified on Pages and Amvera in the preceding release; both ordered
personal plans persisted after restart. PROJECT_STATUS.md predates that release;
this record reconciles it without a separate status-only PR.

## Approved scope

- Audit the current managed division instruction path and concrete vocabulary.
- Simplify practice questions, hints and wrong-answer guidance for all existing
  managed division action kinds, preserving canonical task text and answers.
- Rewrite the five introductory quotient-digit explanations and its visible title/rule.
- Enlarge division help and place auxiliary notes below the main task.
- Keep task IDs, generators, answer acceptance, saved state, help accounting,
  roles, server contracts and existing lessons' answer identities unchanged.
- No account operations, production learner attempts, new generator progression,
  mirror board adaptation or standalone trainer rewrite.

## Acceptance criteria

- [x] First task asks how many times to take the concrete number.
- [x] Mandatory practice questions/hints do not require unexplained division terms.
- [x] Too-large/too-small digit errors give the concrete multiplication and direction.
- [x] No hint auto-advances or marks an answer correct; full solution stays distinct.
- [x] Zero and nine are supported; table includes the next (tenth) multiple.
- [x] Existing tasks/state remain canonical, including resumed checkpoint segments.
- [x] Missing optional help still leaves the original task usable.

## Checks and gates

Passed: node syntax checks; 15 scaffold tests; remediation arithmetic quality
(2,000 tasks / 5,142 division cycles); preparation catalog/contracts; catalog/reference checks (323 identities / 1,925 help variants);
180 exact before/after canonical task comparisons; managed DOM
regression for hints/errors/lessons/resume/read-only/fallback; git diff --check.

The standalone local browser smoke could not launch: Chromium executable is not
installed. No browser installation or URL-policy workaround was used. DOM tests
verify behavior but do not establish pixel layout or accessibility for a particular
pupil. Cloud browser checks remain required before release. No learner trial yet.

Final local marker: LEARNING_PLAIN_DIVISION_DOM_OK.
The catalog gate caught a title mismatch; the list-only display title was aligned
while canonical saved titles stayed unchanged. Missing sparse-checkout reference
fixtures were restored from exact base blobs. Browser robots now read the new
visible answer labels and check the error class instead of one error sentence.
Initial wording assertions were updated to the new copy without removing the
arithmetic/no-reveal assertions. A cross-realm DOM assertion was fixed by cloning
its returned array; runtime behavior was not weakened.

## Review, risk and rollback

Catalog/list presentation titles stay consistent; saved task titles are preserved.
Focused self-review, relevant regressions; independent external review not required
for MEDIUM. No external review is claimed. Only public code and synthetic fixtures
are published. No screenshots, personal data, credentials or machine paths.

Main risks: presentation/canonical mismatch, decimal/zero wording, cached mixed
assets. Exact canonical validation stays intact; presentation checks the current
plan before use; cache versions change. Roll back presentation/catalog assets;
no data migration or learner-work reset is needed.

## Permissions

Current owner request is the execution instruction for audit and scoped corrections.
Branch, local commit, push and Draft PR are part of the project workflow.
Merge, auto-merge and deployment: no separate authorization for this task yet.
The previous publication authorization applied to PR 256 only.
