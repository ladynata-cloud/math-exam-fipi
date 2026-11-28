# Shared board · visible lower lines

Task requested by the owner on 28 November 2026. MEDIUM. Target main from
ea8f6f0680bbe0e5b4b6392966bc8c14eb8160ad, branch fix/board-follow-visible-lines-20261128.
Continuation of the published #775 observer camera. One client-side change.

On a phone the edge of the canvas can be on screen while the pupil reads the
exercise. Follow mode must show enough paper for a line when new writing arrives.
A pupil who adjusts the view while holding the pen must retain their observation
preference when the teacher takes the pen back. Manual observation and the
trainer-only view retain their existing behavior.

Acceptance uses the existing real two-client drawing gate. With six pixels of
canvas visible, check the pixels at both ends of a forty-pixel vertical stroke.
After a pupil zooms and pans during their writing turn, hand back to the teacher,
assert the follow button and check ink on the next lower line. Keep existing
rejoin, manual view, editor, image, history and permission checks.

Files: board-writing.js, its script cache version, and tools/board-writing.browser.cjs.
Risk: unwanted scrolling during independent observation. Guard on follow mode,
visible canvas, active role and new stroke. Revert this scoped change for rollback.
Release through the standard Pages flow after applicable gates.
