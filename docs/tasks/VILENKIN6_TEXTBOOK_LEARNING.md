# Vilenkin 6: understandable learning from the supplied textbook

- Date: 2026-10-25, Asia/Novosibirsk.
- Base: main, 8e681831e874a9af129f50c16179bd2a424c5474.
- Branch: fix/vilenkin6-textbook-learning.
- Review: HIGH (substantial learning sequence and separately versioned browser progress).
- Owner instruction: first make the course understandable for a sixth-grader,
  use actual textbook tasks instead of invented tasks; mirror synchronization is
  the following stage. This is START for implementation and review, not merge.

## Scope

Revise the public first-part learning route using the supplied 2024 textbook at
courses/vilenkin-6-part-1/textbook.pdf. Cover the introductory prerequisites and
all 23 numbered topics, using selected real numbered exercises/subparts and
source examples. Preserve exact numbers, units and conditions; show source
number, printed page and PDF link. Do not claim a solution to every book number.
Replace the public default experience with the source-grounded learning route.
Retain legacy course files and saved attempts for compatibility; use a separate
browser progress key for the revised exercises. Never reinterpret old exercise
IDs or completion as success on new tasks.

Reuse the established textbook-course interaction: one task, retained completed
steps, contextual help, exact arithmetic, typed answer rules, a simple figure
only where the actual task requires it. No invented gameplay, fictional
contexts, extra topics, automatic personal records, cloud state migrations,
board SDK, account edits or synchronization work in this stage.

## Content and acceptance

- Every task/step is tied to a visually checked source page; unnumbered examples
  are honestly labeled as examples, not fabricated textbook numbers.
- Each topic has a short rule, prerequisites, worked steps and independent real
  book subparts. Help does not advance or erase work; assisted work remains aided.
- Preserve the problem and accumulated equations while entering the next step.
- A fraction conversion requires the requested representation. Other valid
  mathematical paths are not rejected by unstated intermediate denominators.
- Check actual figures for geometry; arithmetic expressions use fraction bars.
- Save drafts and completed steps, reload them, and distinguish repeated known
  tasks from first independent work. A solved task is not mastery of a topic.
- Real pupil outcomes are not inferred from automated tests.

## Review and gates

Source/mathematics review, representative complete journeys, wrong/alternate
answers, reload/help/prerequisite preservation, mobile layout, legacy managed
regressions and deterministic data validation are required. Independent review
must not be performed by the author of the same content block.

Claude consultation: unavailable in this execution environment (no authorized
Anthropic API credential/tool exposed). Existing repository review job is a
finished-patch reviewer, not a design-chat interface; no provider call or verdict
is claimed. The brief above records the owner-defined learning design. Proceed
with source preparation, implementation and independent checks; no standing
external-review exception or paid retry is assumed. Required release decision
and any external-review exception will concern the concrete ready result.

## Release boundary and rollback

One branch and one Draft PR. Do not merge or deploy without the owner's separate
release decision. Rollback of this stage restores only the public entry links;
legacy content and attempts remain intact, and new browser progress is retained
under its own key. No database or hosting change.

## Execution

Source book and exact base verified; worktree clean before branch creation.
Current status documents contain concurrent projects unrelated to this scope.
The 2026-10-25 audit established that public course links do not mirror; no claim
of mirror readiness is carried into this task.

Implementation complete: 24 source-based units, 192 selected tasks, 605 steps,
17 source crops; all content blocks independently checked against the book.
Public standalone entry selects the revision; managed and legacy attempts are
unchanged. See docs/reports/VILENKIN6_TEXTBOOK_LEARNING.md for evidence and limits.

During implementation remote main advanced to
741e9ce987cc9bdb452463d2d835632e5233c472 (college function course, PR #336).
Its changed files do not overlap this task. The task branch remains based on
8e681831e874a9af129f50c16179bd2a424c5474; no rebase, reset or branch merge was
performed. A read-only composed-tree check is required before release.

Main subsequently advanced to 3c6681b06313fb411b7b8e8c73dd62f08fbc0017
through SEO PR #337, which overlapped the optional shared catalogue copy edit.
That optional edit was removed from this task; Vilenkin runtime/default entry
and its old overview link remain. Main's catalogue changes are preserved by
the composed result without updating or merging main into the task branch.
