# SpaceMath: classroom construction and drawing workspace

- Owner request: continue implementing SpaceMath because the limited editor
  prevents full use of the unified board. Date: 2026-11-10, Asia/Novosibirsk.
- Review level: HIGH (shared geometry schema and persistent journals).
- Branch: feat/spacemath-classroom-tools, stacked on PR #528 runtime
  `4f0bafa7f7225b3eaf38beab2e5bc73544109c4d`, tree
  `a55d02b50189bcbd87580adacc9abc3051c09d00`.
- PR #527 already supplies dynamic path points, vectors, tangents and tables;
  PR #528 supplies bounded linear/quadratic roots and graph intersections.
  This stage reuses that code and ADR 0015, without a second geometry engine.

## Scope

1. Fixed-length segments along a selected direction and fixed-angle rays.
2. Regular polygons from a selected side, with directly dependent vertices.
3. Whole-figure rotation, dilation, reflections and vector translation. One
   canonical transformation descriptor owns the angle/factor for all vertices.
   Centers and edge points of transformed circles remain dependent.
4. Saved object appearance: visibility, label visibility, bounded color, line
   width, dash and fill. Hidden auxiliaries still participate in mathematics.
5. Compact narrow-screen workspace, optional object panel and local drawing
   focus. Local layout does not change geometry or other participants' views.
6. Reuse the accepted PR #519 warning fixes in the composed candidate; retain
   actual rejected-work notices across successful later writes and reload.

Use a single atomic construction update/undo per compound tool. Unique IDs and
labels, type validation, 160-object/64-KiB bounds, degenerate-result recovery,
explicit controller permissions and existing history semantics remain.

No CAS, 3D, general transcendental root solver, GGB interoperability, arbitrary
CSS/scripts, new transport, real pupil data, model API credits or deployment.

## Acceptance

Run full server contracts, all SpaceMath expression/model/editor/bridge/assets
tests, pure construction batches and local workspace tests. Add browser cases
for actual tools, properties, width 320/1280, focus without geometry writes,
teacher/pupil/observer synchronization, history and server/browser restoration.
Independently review mathematics, validation, interaction and actual final diff.
Record exact source identity, actual passing/failing/not-run gates and remaining
product limitations. Do not claim physical mobile-device testing from a viewport.

## Release hold and compatibility

The current task only authorizes implementation, validation and Draft PR work.
The owner's explicit hold from the board acceptance remains: **do not merge,
enable auto-merge, publish or include this package in another release without
the separate owner decision**. Keep the automatic release task paused.

New point/descriptor types and appearance require a compatible model reader in
the server and editor. Future rollout must update the reader before enabling
new writes. On rollback preserve compatible readers and original journals;
disable tools instead of deleting saved constructions. This task does not
declare production/backend release readiness or reauthorize PR #526/#519.
