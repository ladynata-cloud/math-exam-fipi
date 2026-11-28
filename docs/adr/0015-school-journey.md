# ADR 0015: единая предметная карта MathExam
Status: Proposed — prototype only; not a release decision.
Date: 2026-11-24.

## Problem
Separate public routes, textbook courses, exam maps, board and private learning accounts are useful but do not give the learner one continuous subject path. A new independent course would repeat the problem.

## Proposed design
1. A subject graph is a versioned index of mathematical skills and candidate prerequisite relations. It points to existing resource IDs, not copies of exercises. A task-solving graph remains distinct; its steps refer to the subject graph. Coarse nodes are initially navigational; their edges are hypotheses, not empirical causal claims.
2. Goals (school, gap recovery, algebra, geometry, OGE, base/profile EGE) select a recommended view of the same subject graph. They are not locks or separate mastery systems.
3. Every lesson eventually identifies its skill, explanatory representations, task family, supported/independent attempts, and fresh transfer check. Evidence includes task identity, help and assessment conditions. Existing local/managed records keep their contracts; no silent migration. Absence of evidence is not failure; a single error is not a confirmed cause.
4. Diagnostic policy offers distinguishing probes and alternatives; it may not automatically downgrade an entire course after one mistake. A pedagogy dispatcher chooses among explicit explanation, model, micro-example, practice, or fresh independent check; it must keep mathematical validation outside the language model.
5. Public free path does not require an account or paid model. Existing private cabinet/board remain separate under ADR 0010. Existing independent assistant ADR 0011 remains applicable; any new API or data exposure needs separate scoped authorization.
6. Preserve current URLs, source banks, saved work, Prezi-style maps and legacy access. Migration is incremental and reversible; do not replace the whole site in one change.

## First prototype
22 coarse nodes, 7 goal views, 26 short input probes in the new homepage section. No claim of mastery; no stored diagnostic answers; only selected topic/goal remembered locally. Direct existing course links remain usable. This is not full coverage, a new progress protocol or a completed pedagogical dispatcher. Learner testing and acceptance are outstanding.

## Gate for rollout
Review mathematical questions, reference integrity, old-page compatibility, mobile/keyboard, failure behavior and real learner experience. First prove a linked route from fractions to equations and back to a plausible gap, including independent transfer, before connecting more courses. Review and explicit acceptance of the archetype before publication. Source: Fable design consultations, not a release verdict.
