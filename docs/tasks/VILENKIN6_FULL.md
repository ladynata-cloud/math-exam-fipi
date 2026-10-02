# Подробный курс Виленкина, 6 класс

## Identity and authorization
- Owner request: 2026-10-02, current conversation: build a complete, detailed, visual and interactive Vilenkin course with stepwise teaching and helpful hints.
- Base: `5c49cc5c16ca2385624082128cf6439d1a57c951` (published PR #169).
- Branch: `course/vilenkin6-full`.
- Review level: MEDIUM. Content and bounded lesson/UI extensions within the existing Workshop task, model, route and local-progress contracts; no new backend, storage schema, authentication or deployment architecture.
- Existing owner authorization to finish and publish the discussed courses remains applicable. Independent external review and separate final acceptance were explicitly waived by the owner in this conversation; neither is claimed as performed. Normal verification and technical protection remain in force.

## Goal and scope
Turn the 44-point Vilenkin 6 (2024, parts 1–2) outline into a learnable course. Split each point into explicit skills, teach with original examples and interactive models, provide graduated guidance, varied independent exercises, targeted prerequisite links, chapter review and applications. Preserve old lesson URLs and progress. Keep the course available from the board.

The supplied full PDFs and their text layers are the source for scope and ordering. This is an original course aligned to the textbook, not a reproduction of the book or a claim to provide every numbered exercise. Source books are not published. Optional investigations are identified separately. No new automated agents or schedules are created.

## Acceptance
- Every numbered point has a mapped sequence of substantive lessons; coverage includes complex operations and word problems, not only definitions.
- Each new lesson has explanation, worked example, a misconception, interactive investigation, guided solution, varied practice and an independent check.
- Hints progress from a question to a concrete method to the next step. Error feedback points to a relevant skill where possible; return preserves work.
- Course navigation shows units and progress without an unwieldy flat list. Old 44 summaries remain reachable and link to the expanded units.
- Models support mouse/touch and keyboard controls, readable mobile labels and no required animation.
- Mathematics is checked with separate calculations and invariants, including fractions and alternative valid inputs. Browser paths include weak arithmetic, wrong percent base, sign mistakes, returning from help, confident pupil, mobile/keyboard and board opening.
- Existing data validation and export remain intact; guidance is not counted as independent mastery.
- Save to one PR, verify exact head and unchanged/reconciled base, publish through existing hosting, verify public file identity and live pages.

## Risk and rollback
Risks: hidden gaps, unclear model/task relationship, wrong generated answers, false mastery, broken old routes or state. Keep all old IDs and data keys. Use an ordinary revert of this release if required; no force/reset/rebase, no account/hosting changes, no destructive data migration.

## Checks
New content/model mathematics and browser scenarios; old edition/core/board regressions; existing virtual classroom; syntax, links and diff; desktop and 360 px render inspection. Simulated students are not presented as research with real pupils. Final coverage counts and exact release evidence are recorded after implementation.
