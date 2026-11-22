# College stereometry: publish lesson 7

## Identity

- Owner: repository owner.
- Date: 2026-11-22.
- Base branch: `main`.
- Base SHA: `7a0857ad88a10a2584521d4bdbc0d6e7698273ac`.
- Branch: `feat/college-stereometry-lesson7-20261122`.
- Review level: `MEDIUM`.
- Related ADR: none; no platform or architecture change.

## Goal

Publish the prepared seventh college stereometry lesson so a teacher can send
one direct link to a learner, with a printable homework sheet and an offline
student package available from the same page.

## Context and evidence

The current public college entrance returned HTTP 200 and matched the base
repository file byte for byte before implementation. It lists six lessons,
ending with pyramids. The prepared continuation contains 36 learning cards,
three interactive section constructions, a reference section, and 12 homework
questions. The owner's current instruction explicitly requests publication of
this prepared lesson. The existing site is served by GitHub Pages.

## Approved scope

- Publish `/trainers/college-stereometry/polyhedra-sections/` as lesson 7.
- Add the lesson to the college course, update both static and dynamic catalog
  descriptions, and register its canonical URL in the sitemap inputs/output.
- Connect the public page to the existing navigator and update its exact
  source/coverage receipts; preserve the self-contained offline package.
- Publish a neutral student homework PDF and an offline package containing
  only `Trainer.html`, `Homework.pdf`, and student instructions.
- Fix the reviewed cube-to-prism parameter leak; draw established right angles
  in the relevant projected plane; retain exact mathematical answer checking.
- Add focused regression coverage and reconcile project status in this task.

Existing lessons 1–6, their downloads, the shared board, accounts, server,
registries and unrelated courses remain outside this task. Personalized files
and the separate teacher answer sheet are not public repository deliverables.

## Acceptance criteria

- The new page is reachable directly and from the seven-lesson course entrance.
- All 36 task IDs are unique; answer entry, hints, solutions and local progress
  work. Manual drawings/proofs are explicitly self-assessed.
- Switching from extreme cube slider positions to the prism restores valid
  parameters and keeps the external construction point visible.
- PDF contains 12 questions on six pages, with no answer key or learner name.
- Offline package is self-contained and matches the public lesson code.
- Applicable local tests, independent review and exact-candidate CI pass.
- After release, verify deployment and HTTP 200/byte identity of the course
  entrance, new lesson, PDF and ZIP before handing the link to the owner.

## Checks and review plan

- `node --test tools/college-stereometry-lesson7.test.cjs`.
- `node tools/college-stereometry-pyramids.test.cjs` for retained lesson 6.
- JavaScript syntax; PDF page/text checks and rendered visual inspection;
  archive integrity and absence of teacher/private content.
- Public home-return coverage, navigator source preservation and explicit
  source-binding checks; no navigation runtime or test exception changes.
- `python3 tools/seo-sitemap.test.py`, `python3 tools/build-sitemap.py --check`,
  `python3 tools/seo-check.py`, and `node tools/seo-catalog.test.cjs`.
- After commit: `python3 tools/seo-new-trainers.py --base <base SHA>`.
- `git diff --check` and applicable GitHub Actions on the actual candidate.
- Browser acceptance: altered cube parameters followed by prism construction,
  numeric input/edit invalidation, mobile layout, download links, live entrance.

MEDIUM covers a bounded new static lesson using existing course conventions,
with mathematical and local-state risks. Internal independent reviews checked
section coordinates, symmetry conventions, task answers, the numeric parser,
public-package contents and ready-result interaction. The shared-parameter
defect found by review is fixed and receives a regression test. Ambiguous
source exercises are separated into explicit cases in the teaching content.

External consultation/audit was not performed and was not requested for this
publication. The standing owner policy removes that prerequisite. This is not
an external provider verdict. No real-learner pilot is claimed. Remote handoffs
must include only the minimum public source/diff and no personal material.

## Risk and rollback

- Primary risks: incorrect geometry/answers, stale local completion feedback,
  broken entry/download links and disclosure of a teacher answer sheet.
- Lesson state uses its own `mathexam-college-lesson7-v1` browser storage key;
  there is no server migration or automatic transmission of learner results.
- Rollback: a normal scoped revert PR removing this lesson and restoring the
  previous entrance/catalog/sitemap; preserve unrelated concurrent work.

## Permissions

The current explicit request to publish the prepared lesson authorizes this
task's implementation, local commit, branch publication, Draft PR, controlled
merge after checks, and deployment. It also accords with
[OWNER_RELEASE_AUTHORIZATION.md](../OWNER_RELEASE_AUTHORIZATION.md).
No force operation, reset, rebase, admin override, disabled TLS, or gate change
is authorized. Requery authoritative main/head immediately before merge;
record any movement and honor the owner's exact-base restrictions.

## Execution record

The PR body records the exact local/remote head, independent-review result,
passed/failed/not-run checks, pre-merge base/head, merge verification and live
deployment evidence. This document describes the prepared scope and does not
claim publication before those checks complete.

## Required handoff

Use the repository's `EXECUTIVE STATUS` report, followed by authorized base,
actual current main, drift detection, authorization validity, virtual merge,
rerun gates and whether a new owner decision is required.
