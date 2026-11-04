# Курс к учебнику Погорелова 7–9, издание 2022

- Task: POGORELOV_TEXTBOOK_COMPANION
- Owner request: 26 October 2026, explicit request to build a course accompanying
  the uploaded textbook in the established MathExam style. This is START for
  implementation, local checks and one Draft PR, not merge permission.
- Base: main `9cf995d30c400a6e581a3168bb8ef8f5c76ed945`
- Branch: `feat/pogorelov-textbook-companion`
- Review: MEDIUM, isolated content and browser-local UI using the established
  task / optional hints / retained steps / independent-or-assisted pattern.
- ADR 0001 remains Proposed and is not relied on.

## Goal and scope

Add a separately addressable companion under `geometry-pogorelov/textbook/`.
Every trainer refers to an actually verified exercise number, paragraph,
subpart where applicable and printed page in Pogorelov, Geometry 7–9, 11th
stereotyped edition, Prosveshchenie, 2022. Exercise numbering restarts in each
paragraph. Cover selected exercises across all 15 paragraphs; explicitly avoid
claiming that every exercise or every theory point is complete.

The student reads the original condition in their own book. Publish original
teaching questions, explanations, formulas and newly constructed diagrams,
without the PDF, page images, publisher illustrations or bulk copied prose.
This publication format is not a legal clearance or permission from the publisher.

Use large uncluttered diagrams, progressive steps, optional contextual help,
retained input and a separate record of assistance. Numeric answers receive
automatic checking; free proofs and physical constructions remain for manual
review. Export browser-local work. Preserve the old thematic course and its
progress. Add an ordinary link from its entrance to this companion.

Out of scope: other courses, board integration, pupil accounts, server state,
deployment, deleting or rewriting the older course, new generated analogues
passed off as textbook exercises.

## Acceptance and checks

- Source references and answer oracles for each selected exercise part.
- Diagram geometry and progressive construction views; no answer labels leaked
  before help on independently checked problems.
- Safe arithmetic parser, decimals/comma/fractions and explicit input labels.
- Retention across hints, navigation and reload; honest help/manual labels.
- Accessible keyboard controls, 390px and 1280px layout inspection.
- Structural/content checks, focused runtime tests, syntax and diff checks.
- Gate: POGORELOV_COMPANION_LOCAL_OK.

## Implementation checkpoint

Prepared 134 trainers for 92 source exercise numbers with selected subparts,
340 steps, 201 final numerical values, all 15 paragraphs. The source map and
README state the coverage precisely. The standalone HTML exporter is included.
An entrance link and one reviewed sitemap seed make the new route discoverable.
Local results and limitations: [focused check report](../reports/POGORELOV_TEXTBOOK_COMPANION.md).
No publication or external-review completion is claimed.

## Consultation and review

Claude design consultation applies. At preparation time there is no exposed
Claude/Anthropic tool and the authorized local API environment is unconfigured.
No consultation request was sent, no provider verdict was obtained, and no old
task waiver is reused. Continue useful implementation and technical checks
under TRAINER_CLAUDE_CONSULTATION.md; consultation/release exception must be
reported before publication. No real-pupil validation is claimed.

## Risk and rollback

Main risks: confusion between repeated exercise numbers, incorrect part/page,
diagram revealing an answer, confusing guided completion with independent work,
and stale browser records. Mitigate with stable paragraph-scoped IDs, explicit
coverage, independent answer fixtures and validated local records. Rollback is
the new subtree and entrance link; earlier course data and keys are untouched.

## Permissions

Implementation, branch, checks, local commit, push and Draft PR: authorized by
the current creation request. Merge, auto-merge and deployment: not authorized.
