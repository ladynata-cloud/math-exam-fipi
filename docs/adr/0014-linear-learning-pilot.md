# Linear-equation learning pilot and evidence records

Status: Accepted for this bounded pilot by the owner's explicit 9 November 2026 night-work scope.

## Decision and boundary

The owner explicitly requested deployment of entry diagnosis, four short linear-equation lessons, a final form and a different form after five days on the existing main site. This decision is limited to `/equations/linear-pilot/`, with entries from the existing equation course and OGE question 9. It does not replace the whole course or establish a platform-wide model.

The original Library HTML prototype supplies original tasks and visual style. This implementation separates content, interaction and local event storage. Fixed control forms have distinct equations and transfer problems. Practice accepts the explicitly listed alternative transformations. Free written work is saved for teacher assessment; there is no semantic grading of explanations.

## Evidence and assistance

A correct numeric answer is different from a completed lesson and from mastery. Every practice submission retains the selected transformation, answer, explanation and time. Opening an example, model, hint, solution or gap link registers help for the active task. Declared external help also registers. A helped task or a corrected attempt requires a fresh first-attempt success before the lesson can be completed. Completion is derived from events up to finishing; opening an example afterward does not erase the historical result. A later explicit declaration of external help invalidates that task’s qualification, retaining every event. Corrections retain the first attempt and are labelled separately. Completion means the route step was completed, never proven mastery.

The final and delayed forms require an answer and written work (or explicit `?`) per item. Keys appear only after submission through the UI. This static frontend is not a secure exam: source code contains keys. The teacher assesses explanations and may accept other equivalent written solutions. Real independent learning and retention need observation of real learners; automated tests cannot establish them.

## Persistence

Each mutation is an immutable event in a separate `localStorage` key with a UUID. No full snapshot is overwritten. A reread before actions composes events from other tabs. Draft versions remain in the complete downloaded report. An old displayed practice task retains its own ID even if another tab opens a new task. Submitted control forms are immutable in normal UI; concurrent submissions remain separate records. Navigation is local to an open tab and the last navigation is restored on reopening.

Malformed event payloads are ignored without deleting original local keys. Existing course and trainer keys are untouched; there is no cross-device sync or server-side teacher journal. Storage denial/quota failure keeps current events in memory and warns to download before closing. Time-gated repetition uses the browser's clock and is a learning invitation, not an anti-cheating clock. Original file:// prototype storage belongs to a different origin and is not imported automatically.

## Consequences and rollback

Append-only writes avoid destructive stale-tab updates but consume storage over time; each input change is recorded as a prefix/suffix delta referencing its previous draft event, avoiding repeated full-text copies. Downloaded reports can become large. No automatic cleanup removes evidence. UI history is concise; the full download contains all draft revisions (the full event appendix stores compact deltas). A future bounded compaction/import protocol needs separate scope and tests.

Rollback reverts the pilot files, entrance links and associated test/binding changes together, leaving the additive local event keys intact for recovery. Do not clear learner storage during rollback.
