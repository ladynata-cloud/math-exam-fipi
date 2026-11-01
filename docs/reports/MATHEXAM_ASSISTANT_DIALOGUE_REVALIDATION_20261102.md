# MaxExam dialogue integration — 2026-11-02

PR: https://github.com/ladynata-cloud/math-exam-fipi/pull/375
Task: [MATHEXAM_ASSISTANT_GRADE6_DIALOGUE_V1](../tasks/MATHEXAM_ASSISTANT_GRADE6_DIALOGUE_V1.md)
Review: HIGH; accepted ADR0011.
Integration base: `6b9c327f2ca438cb7e7620ef302876de467fac19`.
Previous head: `84664313af0ba374efff38aae1066d9338da8af5`.
The PR records the exact published head and its CI, avoiding a self-referential
commit identifier in this report.

## Candidate behavior

The learner can ask a follow-up about the last explanation while retaining the
original task and up to three previous exchanges. Each external follow-up needs
fresh acknowledgement and all existing teacher, service and budget permissions.
Memory-only context has a fixed 15-minute lifetime, a 60-entry cap and a
3,500-byte dialogue bound. The cache is bound to account, login session,
settings version, profile and task. A request cannot import browser-supplied
history or another learner's answer. Restart clears dialogue, not usage records.

Vilenkin NOD/NOK and Peterson decimal profiles use the explicitly entered root
condition; supported fixed Atanasyan tasks use their server-owned condition.
Saved Vilenkin textbook and embedded Peterson source helpers remain separate.
This candidate does not claim automatic model access to every open exercise.
In-flight answers are withheld when the teacher takes control, with request
accounting retained. No live provider, learner data or training export was used.

## Integration evidence

The base advanced through PRs374,387,388,391,393,395,390,396. Of 765 upstream
changed paths, 756 do not overlap the old task and match current main exactly.
Nine overlap. Six source/provenance paths now match main byte for byte; the
remaining three preserve main and add only the intended task changes:

- `learning/assistant.css`: four follow-up control rules; current Vilenkin
  source-helper rules retained.
- `learning/index.html`: two assistant cache tags set to
  `dialogue-lcm-20261102`; current Vilenkin asset tags and all other markup kept.
- `docs/PROJECT_STATUS.md`: current main retained verbatim, with a new current
  preparation entry and the prior task's explicitly historical section.

Five textual conflicts were resolved. Three source-test files keep main's
audited source pins/comments exactly; the other two are status and asset tags.
No mathematical oracle, course content, root hosting configuration, account
setting or provider credential changed. Branch integration retains both parent
commits and uses a guarded fast-forward ref update, without rewriting history.
OpenAI adapter PR399 remains a separate Draft; its implementation is not part
of this candidate or a release dependency.

## Fresh local validation

| Check | Result |
| --- | --- |
| Full assistant-service suite | 131/131 passed, no skips |
| Full board-server suite | 369/369 passed, no skips |
| Assistant local/dialogue/context-label/Vilenkin DOM | 40/40 passed, no skips |
| Assistant browser contract | 19 groups passed |
| Dialogue browser → cabinet → helper | 5 groups passed; 4 mocked provider calls, zero external calls |
| Existing cabinet/helper browser integration | 8 groups passed; 15 completed requests, zero live model calls |
| Vilenkin course navigation browser | 10 groups passed; 238-task catalogue, 320/390/1280px |
| Multi-number LCM browser | passed; 320/390/1280px, zero provider calls |
| Unified free-route browser and receipt privacy checks | passed |
| Generated assistant course projections | both source gates passed |
| Atanasyan bounded source oracle | 255 cards, 160 exercises, 23 theory cards passed |
| Ichenskaya source oracle | 110 cards, 23 works, 46 variants, 360 steps, 470 views passed |

The dialogue tests cover cross-account/task replay, absent acknowledgement,
stale parents, teacher takeover while a reply is pending, second clarification,
navigation cleanup and partial free NOD hints. Mobile screenshots were inspected:
the follow-up form, acknowledgement, retained explanation and buttons fit the
viewport, with the floating panel internally scrollable.

Local runtime: Node 24.22.1; isolated Playwright 1.55.0 with installed Chrome140.
The primary runtime's Playwright expected an absent browser executable; using
the version matching the installed browser fixed the test environment without
changing product code or disabling TLS. An initial source-link test needed the
tracked course directory in the sparse checkout. The free-route browser also
needed the tracked welcome video. These are local setup failures, not omitted
or weakened assertions; all final local reruns passed. Whitespace, committed
scope and handoff hygiene checks passed; no production secrets or local machine
paths are added. Exact-head hosted checks are recorded in the PR after upload.

## Review, risk and rollback

This continuation includes self-review and fresh automated tests only. Historical
independent review in the October31 report does not approve this new head.
Independent and external exact-head HIGH review remain required; no waiver is
inferred. Live-model pedagogy, provider transport, hosting rollout and real
learner acceptance were not tested or authorized.

External inference stays off by default. Deploy or revert helper and cabinet
catalogues together; the existing exact catalogue handshake fails closed on a
mismatch. Disabling the cabinet helper withdraws access without removing usage
or replay ledgers. No schema/data migration is introduced. The task remains a
Draft candidate; main merge, auto-merge and deployment are unperformed.

## Executive status

```text
EXECUTIVE STATUS
Task: MATHEXAM_ASSISTANT_GRADE6_DIALOGUE_V1
PR: 375 (Draft)
Base: 6b9c327f2ca438cb7e7620ef302876de467fac19
Head: exact published head recorded in PR metadata/body
Gate: MATHEXAM_ASSISTANT_GRADE6_DIALOGUE_PREPARED_OK (preparation only)
Tests: local results above, including free-route; exact-head CI recorded in PR
Failures: none remaining locally; initial browser/sparse-checkout setup failures resolved
Not run: independent/external new-head review; live model/pupil pilot; release
Scope deviations: none; same task and Draft PR, current upstream preserved
Recommendation: finish exact-head CI and required review before release
Next user decision: no decision needed for Draft preparation; separate release authorization after review
```
